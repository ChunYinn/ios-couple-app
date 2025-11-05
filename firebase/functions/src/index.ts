import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

export const redeemInvite = onCall({ region: "australia-southeast1" }, async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const code = (request.data?.code as string | undefined)?.toUpperCase();
  if (!code) {
    throw new HttpsError("invalid-argument", "Invite code is required");
  }

  const inviteDoc = await db.collection("invites").doc(code).get();
  if (!inviteDoc.exists) {
    throw new HttpsError("not-found", "Invalid code");
  }

  const invite = inviteDoc.data();
  if (!invite) {
    throw new HttpsError("internal", "Invite data missing");
  }

  if (invite.used) {
    throw new HttpsError("already-exists", "Code already used");
  }

  const userId = auth.uid;
  const coupleId = invite.coupleId as string | undefined;
  if (!coupleId) {
    throw new HttpsError("failed-precondition", "Invite is missing a coupleId");
  }

  const batch = db.batch();

  batch.update(db.collection("couples").doc(coupleId), {
    partnerUid: userId,
    members: FieldValue.arrayUnion(userId),
    isPaired: true,
    pairCompletedAt: Timestamp.now(),
  });

  batch.update(db.collection("users").doc(userId), {
    coupleId,
  });

  batch.update(inviteDoc.ref, {
    used: true,
    usedBy: userId,
    usedAt: Timestamp.now(),
  });

  await batch.commit();

  return { success: true, coupleId };
});
