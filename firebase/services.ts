import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from './config';
import {
  DBUser,
  DBDevice,
  DBCouple,
  DBProfile,
  DBMessage,
  DBTodoCategory,
  DBTodoItem,
  DBMemory,
  DBMilestone,
  DBLocation,
  DBInvite,
  DBNotification,
  timestampToDate,
  dateToString,
  daysBetween
} from './types';
import { DEFAULT_LOVE_LANGUAGES } from '../data/loveLanguages';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

// ============= USER SERVICES =============
export const userService = {
  // Create or update user profile
  async createUser(userId: string, data: Partial<DBUser>): Promise<void> {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      uid: userId,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Get user by ID
  async getUser(userId: string): Promise<DBUser | null> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() as DBUser : null;
  },

  // Update user
  async updateUser(userId: string, data: Partial<DBUser>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async uploadAvatar(userId: string, uri: string, currentAvatarUrl?: string | null): Promise<string> {
    const cleanedUri = uri.split('?')[0]?.split('#')[0] ?? uri;
    const extensionMatch = cleanedUri.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch?.[1]?.toLowerCase() ?? 'jpg';
    const storagePath = `users/${userId}/avatar/${Date.now()}.${extension}`;
    const storageRef = ref(storage, storagePath);

    const response = await fetch(uri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);

    if (currentAvatarUrl && currentAvatarUrl.startsWith("http")) {
      try {
        const previousRef = ref(storage, currentAvatarUrl);
        await deleteObject(previousRef);
      } catch (deleteError) {
        console.warn('Unable to delete previous avatar', deleteError);
      }
    }

    return downloadUrl;
  },

  // Update last seen
  async updateLastSeen(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      lastSeenAt: serverTimestamp()
    });
  },

  // Register device for push notifications
  async registerDevice(userId: string, deviceId: string, token: string, platform: 'ios' | 'android'): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'devices', deviceId), {
      fcmToken: token,
      platform,
      pushEnabled: true,
      appVersion: '1.0.0', // Get from app config
      lastSeenAt: serverTimestamp(),
      createdAt: serverTimestamp()
    } as DBDevice);
  },

  subscribeToUser(
    userId: string,
    callback: (user: DBUser | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'users', userId),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as DBUser) : null);
      },
      (error) => {
        console.error('User subscription failed:', error);
        onError?.(error);
      }
    );
  },

  async deleteAvatarFile(avatarUrl?: string | null): Promise<void> {
    if (!avatarUrl || !avatarUrl.startsWith("http")) {
      return;
    }
    try {
      const avatarRef = ref(storage, avatarUrl);
      await deleteObject(avatarRef);
    } catch (error) {
      console.warn('Unable to delete avatar', error);
    }
  }
};

// ============= COUPLE SERVICES =============
export const coupleService = {
  // Create new couple
  async createCouple(ownerUid: string, inviteCode: string): Promise<string> {
    const coupleRef = doc(collection(db, 'couples'));
    const coupleId = coupleRef.id;

    await setDoc(coupleRef, {
      inviteCode,
      inviteLink: `coupleapp://join/${inviteCode}`,
      qrCodeData: `COUPLE:${inviteCode}`,
      isPaired: false,
      members: [ownerUid],
      ownerUid,
      partnerUid: null,
      anniversaryDate: null,
      settings: {
        enablePush: true,
        enableFlashbacks: true,
        enableLocation: false,
        theme: 'auto'
      },
      createdAt: serverTimestamp(),
      pairCompletedAt: null,
      lastActivityAt: serverTimestamp()
    } as DBCouple);

    // Create owner's profile
    await profileService.createProfile(coupleId, ownerUid, {
      displayName: 'You',
      status: '',
      about: 'Tell your story...',
      accentColor: '#FFB3C6',
      emoji: '💕',
      loveLanguages: [...DEFAULT_LOVE_LANGUAGES],
      birthday: null,
      anniversary: null,
      favorites: []
    });

    return coupleId;
  },

  // Get couple by ID
  async getCouple(coupleId: string): Promise<DBCouple | null> {
    const coupleDoc = await getDoc(doc(db, 'couples', coupleId));
    return coupleDoc.exists() ? coupleDoc.data() as DBCouple : null;
  },

  // Update couple settings
  async updateSettings(coupleId: string, settings: Partial<DBCouple['settings']>): Promise<void> {
    const updates: Record<string, unknown> = {
      lastActivityAt: serverTimestamp()
    };

    Object.entries(settings).forEach(([key, value]) => {
      updates[`settings.${key}`] = value;
    });

    await updateDoc(doc(db, 'couples', coupleId), updates);
  },

  // Set anniversary date
  async setAnniversary(coupleId: string, date: string | null): Promise<void> {
    await updateDoc(doc(db, 'couples', coupleId), {
      anniversaryDate: date,
      lastActivityAt: serverTimestamp()
    });
  },

  // Calculate days together
  getDaysTogether(anniversaryDate: string | null): number {
    if (!anniversaryDate) return 0;
    const anniversary = new Date(anniversaryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    anniversary.setHours(0, 0, 0, 0);
    return daysBetween(anniversary, today);
  },

  subscribeToCouple(
    coupleId: string,
    callback: (couple: DBCouple | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, 'couples', coupleId), (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as DBCouple) : null);
    });
  }
};

// ============= PROFILE SERVICES =============
export const profileService = {
  // Create or update profile
  async createProfile(coupleId: string, userId: string, data: Partial<DBProfile>): Promise<void> {
    await setDoc(doc(db, 'couples', coupleId, 'profiles', userId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  // Get profile
  async getProfile(coupleId: string, userId: string): Promise<DBProfile | null> {
    const profileDoc = await getDoc(doc(db, 'couples', coupleId, 'profiles', userId));
    return profileDoc.exists() ? profileDoc.data() as DBProfile : null;
  },

  // Get both profiles
  async getCoupleProfiles(
    coupleId: string
  ): Promise<{ me?: (DBProfile & { uid: string }); partner?: (DBProfile & { uid: string }) }> {
    const profilesSnapshot = await getDocs(collection(db, 'couples', coupleId, 'profiles'));
    const profiles: {
      me?: DBProfile & { uid: string };
      partner?: DBProfile & { uid: string };
    } = {};

    profilesSnapshot.forEach((doc) => {
      if (doc.id === auth.currentUser?.uid) {
        profiles.me = { ...(doc.data() as DBProfile), uid: doc.id };
      } else {
        profiles.partner = { ...(doc.data() as DBProfile), uid: doc.id };
      }
    });

    return profiles;
  },

  subscribeToProfiles(
    coupleId: string,
    callback: (profiles: Array<{ uid: string; profile: DBProfile }>) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'couples', coupleId, 'profiles'),
      (snapshot) => {
        const profiles: Array<{ uid: string; profile: DBProfile }> = [];
        snapshot.forEach((doc) => {
          profiles.push({ uid: doc.id, profile: doc.data() as DBProfile });
        });
        callback(profiles);
      }
    );
  }
};

// ============= MESSAGE SERVICES =============
export const messageService = {
  // Send message
  async sendMessage(coupleId: string, text: string, type: DBMessage['type'] = 'text'): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await addDoc(collection(db, 'couples', coupleId, 'messages'), {
      sender: userId,
      text,
      type,
      mediaUrl: null,
      thumbnailUrl: null,
      duration: null,
      reactions: {},
      readBy: { [userId]: serverTimestamp() },
      timestamp: serverTimestamp(),
      editedAt: null,
      deletedAt: null
    } as DBMessage);
  },

  // Add reaction to message
  async addReaction(coupleId: string, messageId: string, emoji: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const messageRef = doc(db, 'couples', coupleId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${emoji}`]: arrayUnion(userId)
    });
  },

  // Mark message as read
  async markAsRead(coupleId: string, messageId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'couples', coupleId, 'messages', messageId), {
      [`readBy.${userId}`]: serverTimestamp()
    });
  },

  // Subscribe to messages
  subscribeToMessages(
    coupleId: string,
    callback: (messages: DBMessage[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages: DBMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as DBMessage);
      });
      callback(messages);
    });
  }
};

// ============= TODO SERVICES =============
export const todoService = {
  // Create category
  async createCategory(
    coupleId: string,
    data: Omit<DBTodoCategory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const categoryRef = await addDoc(collection(db, 'couples', coupleId, 'todoCategories'), {
      ...data,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return categoryRef.id;
  },

  // Create todo item
  async createTodoItem(coupleId: string, data: Omit<DBTodoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const itemRef = await addDoc(collection(db, 'couples', coupleId, 'todoItems'), {
      ...data,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return itemRef.id;
  },

  // Delete category (and related todos)
  async deleteCategory(coupleId: string, categoryId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const categoryRef = doc(db, 'couples', coupleId, 'todoCategories', categoryId);
    const itemsQuery = query(
      collection(db, 'couples', coupleId, 'todoItems'),
      where('categoryId', '==', categoryId)
    );
    const snapshot = await getDocs(itemsQuery);

    const batch = writeBatch(db);
    batch.delete(categoryRef);
    snapshot.forEach((itemDoc) => {
      batch.delete(itemDoc.ref);
    });

    await batch.commit();
  },

  // Toggle todo completion
  async toggleTodo(coupleId: string, todoId: string, completed: boolean): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'couples', coupleId, 'todoItems', todoId), {
      completed,
      completedAt: completed ? serverTimestamp() : null,
      completedBy: completed ? userId : null,
      updatedAt: serverTimestamp()
    });
  },

  // Get todos by category
  async getTodosByCategory(coupleId: string, categoryId: string): Promise<DBTodoItem[]> {
    const q = query(
      collection(db, 'couples', coupleId, 'todoItems'),
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBTodoItem));
  },

  // Subscribe to categories
  subscribeToCategories(
    coupleId: string,
    callback: (categories: DBTodoCategory[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'todoCategories'),
      orderBy('order', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const categories: DBTodoCategory[] = [];
      snapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as DBTodoCategory);
      });
      callback(categories);
    });
  },

  // Subscribe to todos
  subscribeToTodos(
    coupleId: string,
    callback: (items: DBTodoItem[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'todoItems'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: DBTodoItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as DBTodoItem);
      });
      callback(items);
    });
  }
};

// ============= MEMORY SERVICES =============
export const memoryService = {
  // Upload memory
  async uploadMemory(
    coupleId: string,
    file: File,
    type: 'photo' | 'video',
    caption?: string
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Upload to storage
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storagePath = `couples/${coupleId}/memories/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file);
    const imageUrl = await getDownloadURL(storageRef);

    // Create thumbnail (in production, use Cloud Functions)
    const thumbnailUrl = imageUrl; // Placeholder

    // Add to Firestore
    const memoryRef = await addDoc(collection(db, 'couples', coupleId, 'memories'), {
      type,
      imageUrl,
      thumbnailUrl,
      videoUrl: type === 'video' ? imageUrl : null,
      caption: caption || null,
      tags: [],
      isFavorite: false,
      isPrivate: false,
      capturedDate: serverTimestamp(),
      location: null,
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      faces: [],
      sceneType: null
    } as DBMemory);

    return memoryRef.id;
  },

  // Toggle favorite
  async toggleFavorite(coupleId: string, memoryId: string, isFavorite: boolean): Promise<void> {
    await updateDoc(doc(db, 'couples', coupleId, 'memories', memoryId), {
      isFavorite,
      updatedAt: serverTimestamp()
    });
  },

  // Get memories with filters
  async getMemories(
    coupleId: string,
    filter?: 'all' | 'favorites' | 'photos' | 'videos'
  ): Promise<DBMemory[]> {
    let q = query(
      collection(db, 'couples', coupleId, 'memories'),
      orderBy('capturedDate', 'desc')
    );

    if (filter === 'favorites') {
      q = query(q, where('isFavorite', '==', true));
    } else if (filter === 'photos') {
      q = query(q, where('type', '==', 'photo'));
    } else if (filter === 'videos') {
      q = query(q, where('type', '==', 'video'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBMemory));
  },

  // Get flashbacks (memories from this day in previous years)
  async getFlashbacks(coupleId: string): Promise<DBMemory[]> {
    const memories = await this.getMemories(coupleId);
    const today = new Date();

    return memories.filter(memory => {
      const memoryDate = timestampToDate(memory.capturedDate);
      return memoryDate.getMonth() === today.getMonth() &&
             memoryDate.getDate() === today.getDate() &&
             memoryDate.getFullYear() < today.getFullYear();
    });
  },

  subscribeToMemories(
    coupleId: string,
    callback: (memories: DBMemory[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'memories'),
      orderBy('capturedDate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: DBMemory[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as DBMemory);
      });
      callback(items);
    });
  }
};

// ============= LOCATION SERVICES =============
export const locationService = {
  // Update location
  async updateLocation(
    coupleId: string,
    coords: DBLocation['coords'],
    note?: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour TTL

    await setDoc(doc(db, 'couples', coupleId, 'locations', userId), {
      coords,
      isSharing: true,
      sharingNote: note || null,
      batteryLevel: null, // Get from device
      isEmergency: false,
      timestamp: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt)
    } as DBLocation);
  },

  // Stop sharing location
  async stopSharing(coupleId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'couples', coupleId, 'locations', userId), {
      isSharing: false,
      timestamp: serverTimestamp()
    });
  },

  // Subscribe to partner's location
  subscribeToPartnerLocation(
    coupleId: string,
    partnerId: string,
    callback: (location: DBLocation | null) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, 'couples', coupleId, 'locations', partnerId),
      (doc) => {
        callback(doc.exists() ? doc.data() as DBLocation : null);
      }
    );
  }
};

// ============= INVITE SERVICES =============
export const inviteService = {
  // Create invite
  async createInvite(
    coupleId: string,
    ownerName: string,
    ownerAvatar?: string,
    preferredCode?: string
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const code = (preferredCode || this.generateInviteCode()).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day TTL

    await setDoc(doc(db, 'invites', code), {
      code,
      coupleId,
      ownerUid: userId,
      ownerName,
      ownerAvatar: ownerAvatar || null,
      used: false,
      usedBy: null,
      usedAt: null,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      shareMethod: null
    } as DBInvite);

    return code;
  },

  // Generate 6-character invite code
  generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
};

// ============= MILESTONE SERVICES =============
export const milestoneService = {
  // Check and create automatic milestones
  async checkMilestones(coupleId: string, daysTogether: number): Promise<void> {
    const milestones = [
      { days: 1, title: 'First Day', description: 'The beginning of your journey' },
      { days: 7, title: 'First Week', description: 'Seven days of love' },
      { days: 30, title: 'First Month', description: 'One month together' },
      { days: 100, title: '100 Days', description: 'Your first hundred days' },
      { days: 365, title: 'First Year', description: 'One year anniversary' },
      { days: 1000, title: '1000 Days', description: 'A thousand days of memories' }
    ];

    for (const milestone of milestones) {
      if (daysTogether === milestone.days) {
        await this.createMilestone(coupleId, {
          title: milestone.title,
          description: milestone.description,
          type: 'automatic',
          dayCount: milestone.days
        });
      }
    }
  },

  // Create milestone
  async createMilestone(
    coupleId: string,
    data: Partial<DBMilestone>
  ): Promise<string> {
    const milestoneRef = await addDoc(collection(db, 'couples', coupleId, 'milestones'), {
      ...data,
      image: data.image || 'default-milestone.png',
      badgeColor: data.badgeColor || '#FFD700',
      icon: data.icon || 'star',
      achievedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: data.type === 'custom' ? auth.currentUser?.uid : null
    });

    return milestoneRef.id;
  },

  subscribeToMilestones(
    coupleId: string,
    callback: (milestones: DBMilestone[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'couples', coupleId, 'milestones'),
      orderBy('achievedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const milestones: DBMilestone[] = [];
      snapshot.forEach((doc) => {
        milestones.push({ id: doc.id, ...doc.data() } as DBMilestone);
      });
      callback(milestones);
    });
  }
};

// Export all services
export default {
  user: userService,
  couple: coupleService,
  profile: profileService,
  message: messageService,
  todo: todoService,
  memory: memoryService,
  location: locationService,
  invite: inviteService,
  milestone: milestoneService
};
