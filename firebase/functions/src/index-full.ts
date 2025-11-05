import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// ============= REDEEM INVITE FUNCTION =============
export const redeemInvite = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to redeem an invite.'
    );
  }

  const { code } = data;
  const userId = context.auth.uid;

  if (!code || typeof code !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code provided.'
    );
  }

  try {
    // Get invite document
    const inviteRef = db.collection('invites').doc(code.toUpperCase());
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid invite code. Please check and try again.'
      );
    }

    const invite = inviteDoc.data()!;

    // Check if invite is already used
    if (invite.used) {
      throw new functions.https.HttpsError(
        'already-exists',
        'This invite code has already been used.'
      );
    }

    // Check if invite is expired
    const expiresAt = invite.expiresAt.toDate();
    if (expiresAt < new Date()) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'This invite code has expired.'
      );
    }

    // Check if user is trying to join their own couple
    if (invite.ownerUid === userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'You cannot join your own couple.'
      );
    }

    // Get couple document
    const coupleRef = db.collection('couples').doc(invite.coupleId);
    const coupleDoc = await coupleRef.get();

    if (!coupleDoc.exists) {
      throw new functions.https.HttpsError(
        'internal',
        'Couple not found. Please contact support.'
      );
    }

    const couple = coupleDoc.data()!;

    // Check if couple already has 2 members
    if (couple.members && couple.members.length >= 2) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This couple already has two members.'
      );
    }

    // Start transaction to update multiple documents
    await db.runTransaction(async (transaction) => {
      // Update couple document
      transaction.update(coupleRef, {
        partnerUid: userId,
        members: admin.firestore.FieldValue.arrayUnion(userId),
        isPaired: true,
        pairCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update both users with coupleId
      const userRef = db.collection('users').doc(userId);
      const ownerRef = db.collection('users').doc(invite.ownerUid);

      transaction.update(userRef, {
        coupleId: invite.coupleId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      transaction.update(ownerRef, {
        coupleId: invite.coupleId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Mark invite as used
      transaction.update(inviteRef, {
        used: true,
        usedBy: userId,
        usedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create partner's profile
      const partnerProfileRef = db.collection('couples').doc(invite.coupleId)
        .collection('profiles').doc(userId);

      transaction.set(partnerProfileRef, {
        displayName: context.auth?.token?.name || 'Partner',
        status: 'Feeling Happy',
        avatarUrl: context.auth?.token?.picture || null,
        about: 'New to the couple!',
        accentColor: '#A2D2FF',
        emoji: '💙',
        loveLanguages: ['Quality Time'],
        favorites: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create welcome notification for owner
      const notificationRef = db.collection('couples').doc(invite.coupleId)
        .collection('notifications').doc();

      transaction.set(notificationRef, {
        type: 'couple',
        title: 'Your partner joined!',
        body: `${context.auth?.token?.name || 'Your partner'} has joined your couple. Time to celebrate! 🎉`,
        recipientId: invite.ownerUid,
        senderId: userId,
        actionType: 'view_partner',
        actionData: { partnerId: userId },
        isRead: false,
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: null
      });
    });

    // Send push notification to owner
    await sendPushToUser(
      invite.ownerUid,
      'Your partner joined! 💕',
      `${context.auth?.token?.name || 'Your partner'} has joined your couple!`,
      { coupleId: invite.coupleId, type: 'partner_joined' }
    );

    return {
      success: true,
      coupleId: invite.coupleId,
      message: 'Successfully joined the couple!'
    };

  } catch (error: any) {
    console.error('Error redeeming invite:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while redeeming the invite. Please try again.'
    );
  }
});

// ============= MESSAGE NOTIFICATION FUNCTION =============
export const onMessageCreated = functions.firestore
  .document('couples/{coupleId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { coupleId, messageId } = context.params;

    try {
      // Get couple document to find partner
      const coupleDoc = await db.collection('couples').doc(coupleId).get();
      if (!coupleDoc.exists) return;

      const couple = coupleDoc.data()!;
      const members = couple.members || [];

      // Find partner ID (the one who didn't send the message)
      const partnerId = members.find((id: string) => id !== message.sender);
      if (!partnerId) return;

      // Get sender's profile for display name
      const senderProfile = await db
        .collection('couples').doc(coupleId)
        .collection('profiles').doc(message.sender)
        .get();

      const senderName = senderProfile.exists
        ? senderProfile.data()!.displayName
        : 'Your partner';

      // Create in-app notification
      await db.collection('couples').doc(coupleId)
        .collection('notifications').add({
          type: 'message',
          title: `New message from ${senderName}`,
          body: message.text.substring(0, 100),
          recipientId: partnerId,
          senderId: message.sender,
          actionType: 'open_chat',
          actionData: { messageId, coupleId },
          isRead: false,
          readAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        });

      // Send push notification
      await sendPushToUser(
        partnerId,
        senderName,
        message.text,
        { coupleId, messageId, type: 'message' }
      );

    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  });

// ============= TODO REMINDER FUNCTION =============
export const onTodoCreated = functions.firestore
  .document('couples/{coupleId}/todoItems/{todoId}')
  .onCreate(async (snapshot, context) => {
    const todo = snapshot.data();
    const { coupleId, todoId } = context.params;

    // Only send notifications for todos with assignees
    if (!todo.assigneeIds || todo.assigneeIds.length === 0) return;

    try {
      // Get category for context
      const categoryDoc = await db
        .collection('couples').doc(coupleId)
        .collection('todoCategories').doc(todo.categoryId)
        .get();

      const categoryName = categoryDoc.exists
        ? categoryDoc.data()!.name
        : 'Tasks';

      // Get creator's profile
      const creatorProfile = await db
        .collection('couples').doc(coupleId)
        .collection('profiles').doc(todo.createdBy)
        .get();

      const creatorName = creatorProfile.exists
        ? creatorProfile.data()!.displayName
        : 'Your partner';

      // Send notification to each assignee (except creator)
      for (const assigneeId of todo.assigneeIds) {
        if (assigneeId === todo.createdBy) continue;

        // Create in-app notification
        await db.collection('couples').doc(coupleId)
          .collection('notifications').add({
            type: 'todo',
            title: 'New task assigned to you',
            body: `${creatorName} assigned "${todo.title}" in ${categoryName}`,
            recipientId: assigneeId,
            senderId: todo.createdBy,
            actionType: 'view_todo',
            actionData: { todoId, categoryId: todo.categoryId },
            isRead: false,
            readAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: null
          });

        // Send push notification
        await sendPushToUser(
          assigneeId,
          'New task assigned',
          `${todo.title}`,
          { coupleId, todoId, type: 'todo' }
        );
      }

    } catch (error) {
      console.error('Error sending todo notification:', error);
    }
  });

// ============= MEMORY UPLOADED FUNCTION =============
export const onMemoryUploaded = functions.firestore
  .document('couples/{coupleId}/memories/{memoryId}')
  .onCreate(async (snapshot, context) => {
    const memory = snapshot.data();
    const { coupleId, memoryId } = context.params;

    try {
      // Get couple to find partner
      const coupleDoc = await db.collection('couples').doc(coupleId).get();
      if (!coupleDoc.exists) return;

      const couple = coupleDoc.data()!;
      const partnerId = couple.members.find((id: string) => id !== memory.uploadedBy);
      if (!partnerId) return;

      // Get uploader's profile
      const uploaderProfile = await db
        .collection('couples').doc(coupleId)
        .collection('profiles').doc(memory.uploadedBy)
        .get();

      const uploaderName = uploaderProfile.exists
        ? uploaderProfile.data()!.displayName
        : 'Your partner';

      // Create notification
      await db.collection('couples').doc(coupleId)
        .collection('notifications').add({
          type: 'memory',
          title: `${uploaderName} added a new memory`,
          body: memory.caption || `New ${memory.type} added to your gallery`,
          recipientId: partnerId,
          senderId: memory.uploadedBy,
          actionType: 'view_memory',
          actionData: { memoryId },
          isRead: false,
          readAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: null
        });

      // Send push notification
      await sendPushToUser(
        partnerId,
        'New memory added 📸',
        `${uploaderName} added a new ${memory.type}`,
        { coupleId, memoryId, type: 'memory' }
      );

    } catch (error) {
      console.error('Error sending memory notification:', error);
    }
  });

// ============= MILESTONE ACHIEVED FUNCTION =============
export const checkDailyMilestones = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/Los_Angeles')
  .onRun(async () => {
    try {
      // Get all couples
      const couplesSnapshot = await db.collection('couples')
        .where('isPaired', '==', true)
        .where('anniversaryDate', '!=', null)
        .get();

      for (const coupleDoc of couplesSnapshot.docs) {
        const couple = coupleDoc.data();
        const coupleId = coupleDoc.id;

        // Calculate days together
        const anniversaryDate = couple.anniversaryDate;
        if (!anniversaryDate) continue;

        const anniversary = new Date(anniversaryDate);
        const today = new Date();
        const daysTogether = Math.floor(
          (today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check milestone days
        const milestoneDays = [7, 30, 100, 365, 500, 1000, 1825, 3650];

        if (milestoneDays.includes(daysTogether)) {
          // Create milestone
          const milestoneTitle = getMilestoneTitle(daysTogether);

          await db.collection('couples').doc(coupleId)
            .collection('milestones').add({
              title: milestoneTitle,
              description: `You've been together for ${daysTogether} days!`,
              type: 'automatic',
              image: 'default-milestone.png',
              badgeColor: '#FFD700',
              icon: 'star',
              achievedAt: admin.firestore.FieldValue.serverTimestamp(),
              dayCount: daysTogether,
              customDate: null,
              customNote: null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: null
            });

          // Notify both partners
          for (const memberId of couple.members) {
            await db.collection('couples').doc(coupleId)
              .collection('notifications').add({
                type: 'milestone',
                title: 'Milestone Achieved! 🎉',
                body: milestoneTitle,
                recipientId: memberId,
                senderId: null,
                actionType: 'view_milestone',
                actionData: { daysTogether },
                isRead: false,
                readAt: null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: null
              });

            await sendPushToUser(
              memberId,
              'Milestone Achieved! 🎉',
              milestoneTitle,
              { coupleId, type: 'milestone', daysTogether: daysTogether.toString() }
            );
          }
        }

        // Check for anniversary
        if (anniversary.getMonth() === today.getMonth() &&
            anniversary.getDate() === today.getDate() &&
            daysTogether > 0) {

          const years = Math.floor(daysTogether / 365);
          const message = years === 1
            ? 'Happy 1st Anniversary! 💕'
            : `Happy ${years} Year Anniversary! 💕`;

          for (const memberId of couple.members) {
            await sendPushToUser(
              memberId,
              message,
              'Celebrate your special day together!',
              { coupleId, type: 'anniversary' }
            );
          }
        }
      }

    } catch (error) {
      console.error('Error checking daily milestones:', error);
    }
  });

// ============= HELPER FUNCTIONS =============

// Send push notification to a user
async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, string>
): Promise<void> {
  try {
    // Get user's devices
    const devicesSnapshot = await db.collection('users').doc(userId)
      .collection('devices')
      .where('pushEnabled', '==', true)
      .get();

    if (devicesSnapshot.empty) return;

    const tokens: string[] = [];
    devicesSnapshot.forEach(doc => {
      const device = doc.data();
      if (device.fcmToken) {
        tokens.push(device.fcmToken);
      }
    });

    if (tokens.length === 0) return;

    // Send multicast message
    const message = {
      notification: {
        title,
        body
      },
      data,
      tokens,
      apns: {
        payload: {
          aps: {
            'content-available': 1,
            sound: 'default',
            badge: 1
          }
        }
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          priority: 'high' as const,
          channelId: 'couple-app-messages'
        }
      }
    };

    const response = await messaging.sendMulticast(message);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });

      // Remove invalid tokens
      for (const token of failedTokens) {
        const deviceQuery = await db.collection('users').doc(userId)
          .collection('devices')
          .where('fcmToken', '==', token)
          .get();

        deviceQuery.forEach(doc => {
          doc.ref.delete();
        });
      }
    }

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Get milestone title based on days
function getMilestoneTitle(days: number): string {
  const titles: Record<number, string> = {
    7: 'One Week Together',
    30: 'One Month Together',
    100: '100 Days Together',
    365: 'One Year Anniversary',
    500: '500 Days Together',
    1000: '1000 Days Together',
    1825: '5 Years Together',
    3650: '10 Years Together'
  };

  return titles[days] || `${days} Days Together`;
}

// ============= CLEANUP FUNCTIONS =============

// Clean up expired invites (runs daily)
export const cleanupExpiredInvites = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    const expiredInvites = await db.collection('invites')
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    expiredInvites.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${expiredInvites.size} expired invites`);
  });

// Clean up old notifications (runs weekly)
export const cleanupOldNotifications = functions.pubsub
  .schedule('every sunday 00:00')
  .onRun(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const couplesSnapshot = await db.collection('couples').get();

    for (const coupleDoc of couplesSnapshot.docs) {
      const oldNotifications = await db
        .collection('couples').doc(coupleDoc.id)
        .collection('notifications')
        .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .where('isRead', '==', true)
        .get();

      const batch = db.batch();
      oldNotifications.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    console.log('Cleaned up old notifications');
  });