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

  const rawCode = request.data?.code as string | undefined;
  const code = rawCode?.trim().toUpperCase();
  if (!code || code.length !== 6) {
    throw new HttpsError(
      "invalid-argument",
      "Invite code is required and must be 6 characters long."
    );
  }

  const userId = auth.uid;
  const userRef = db.collection("users").doc(userId);
  const inviteRef = db.collection("invites").doc(code);

  const [userDoc, inviteDoc] = await Promise.all([
    userRef.get(),
    inviteRef.get(),
  ]);

  if (!userDoc.exists) {
    throw new HttpsError(
      "failed-precondition",
      "User record not found. Please sign out and back in."
    );
  }

  const userData = userDoc.data();
  if (userData?.coupleId) {
    throw new HttpsError(
      "failed-precondition",
      "You're already paired with another account. Remove that pairing before joining a new invite."
    );
  }

  if (!inviteDoc.exists) {
    throw new HttpsError("not-found", "Invalid invite code. Please check and try again.");
  }

  const invite = inviteDoc.data();
  if (!invite?.coupleId) {
    throw new HttpsError("failed-precondition", "Invite is missing couple details.");
  }

  if (invite.ownerUid === userId) {
    throw new HttpsError(
      "failed-precondition",
      "You can't join an invite you created. Share it with your partner instead."
    );
  }

  if (invite.used) {
    throw new HttpsError(
      "already-exists",
      "This invite code has already been used. Ask your partner to refresh their invite."
    );
  }

  const expiresAt = invite.expiresAt as Timestamp | undefined;
  if (expiresAt) {
    const expiresDate = expiresAt.toDate();
    if (expiresDate.getTime() < Date.now()) {
      throw new HttpsError(
        "deadline-exceeded",
        "This invite code has expired. Ask your partner to generate a new one."
      );
    }
  }

  const coupleRef = db.collection("couples").doc(invite.coupleId as string);
  const coupleDoc = await coupleRef.get();
  if (!coupleDoc.exists) {
    throw new HttpsError("not-found", "Couple not found for this invite.");
  }

  const couple = coupleDoc.data();
  const members = (couple?.members as string[] | undefined) ?? [];

  if (members.includes(userId)) {
    throw new HttpsError(
      "failed-precondition",
      "You're already part of this couple."
    );
  }

  if (members.length >= 2) {
    throw new HttpsError(
      "failed-precondition",
      "This couple already has two members."
    );
  }

  await db.runTransaction(async (transaction) => {
    transaction.update(coupleRef, {
      partnerUid: userId,
      members: FieldValue.arrayUnion(userId),
      isPaired: true,
      pairCompletedAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
    });

    transaction.update(userRef, {
      coupleId: invite.coupleId,
      updatedAt: Timestamp.now(),
    });

    transaction.update(inviteRef, {
      used: true,
      usedBy: userId,
      usedAt: Timestamp.now(),
    });
  });

  return { success: true, coupleId: invite.coupleId };
});
