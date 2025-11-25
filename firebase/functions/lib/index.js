"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unbindCouple = exports.redeemInvite = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
exports.redeemInvite = (0, https_1.onCall)({ region: "australia-southeast1" }, async (request) => {
    var _a, _b;
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be authenticated");
    }
    const rawCode = (_a = request.data) === null || _a === void 0 ? void 0 : _a.code;
    const code = rawCode === null || rawCode === void 0 ? void 0 : rawCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
        throw new https_1.HttpsError("invalid-argument", "Invite code is required and must be 6 characters long.");
    }
    const userId = auth.uid;
    const userRef = db.collection("users").doc(userId);
    const inviteRef = db.collection("invites").doc(code);
    const [userDoc, inviteDoc] = await Promise.all([
        userRef.get(),
        inviteRef.get(),
    ]);
    if (!userDoc.exists) {
        throw new https_1.HttpsError("failed-precondition", "User record not found. Please sign out and back in.");
    }
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.coupleId) {
        const currentCoupleRef = db.collection("couples").doc(userData.coupleId);
        const currentCoupleSnap = await currentCoupleRef.get();
        const currentCouple = currentCoupleSnap.data();
        if (currentCouple === null || currentCouple === void 0 ? void 0 : currentCouple.isPaired) {
            throw new https_1.HttpsError("failed-precondition", "You're already paired with another account. Remove that pairing before joining a new invite.");
        }
        // If the user is hosting an unpaired invite, allow them to join another code.
    }
    if (!inviteDoc.exists) {
        throw new https_1.HttpsError("not-found", "Invalid invite code. Please check and try again.");
    }
    const invite = inviteDoc.data();
    if (!(invite === null || invite === void 0 ? void 0 : invite.coupleId)) {
        throw new https_1.HttpsError("failed-precondition", "Invite is missing couple details.");
    }
    if (invite.ownerUid === userId) {
        throw new https_1.HttpsError("failed-precondition", "You can't join an invite you created. Share it with your partner instead.");
    }
    if (invite.used) {
        throw new https_1.HttpsError("already-exists", "This invite code has already been used. Ask your partner to refresh their invite.");
    }
    const expiresAt = invite.expiresAt;
    if (expiresAt) {
        const expiresDate = expiresAt.toDate();
        if (expiresDate.getTime() < Date.now()) {
            throw new https_1.HttpsError("deadline-exceeded", "This invite code has expired. Ask your partner to generate a new one.");
        }
    }
    const coupleRef = db.collection("couples").doc(invite.coupleId);
    const coupleDoc = await coupleRef.get();
    if (!coupleDoc.exists) {
        throw new https_1.HttpsError("not-found", "Couple not found for this invite.");
    }
    const couple = coupleDoc.data();
    const members = (_b = couple === null || couple === void 0 ? void 0 : couple.members) !== null && _b !== void 0 ? _b : [];
    if (members.includes(userId)) {
        throw new https_1.HttpsError("failed-precondition", "You're already part of this couple.");
    }
    if (members.length >= 2) {
        throw new https_1.HttpsError("failed-precondition", "This couple already has two members.");
    }
    await db.runTransaction(async (transaction) => {
        transaction.update(coupleRef, {
            partnerUid: userId,
            members: firestore_1.FieldValue.arrayUnion(userId),
            isPaired: true,
            pairCompletedAt: firestore_1.Timestamp.now(),
            lastActivityAt: firestore_1.Timestamp.now(),
        });
        transaction.update(userRef, {
            coupleId: invite.coupleId,
            updatedAt: firestore_1.Timestamp.now(),
        });
        transaction.update(inviteRef, {
            used: true,
            usedBy: userId,
            usedAt: firestore_1.Timestamp.now(),
        });
    });
    return { success: true, coupleId: invite.coupleId };
});
exports.unbindCouple = (0, https_1.onCall)({ region: "australia-southeast1" }, async (request) => {
    var _a, _b, _c;
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be authenticated");
    }
    const coupleId = (_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.coupleId) === null || _b === void 0 ? void 0 : _b.trim();
    if (!coupleId) {
        throw new https_1.HttpsError("invalid-argument", "coupleId is required");
    }
    const coupleRef = db.collection("couples").doc(coupleId);
    const coupleDoc = await coupleRef.get();
    if (!coupleDoc.exists) {
        throw new https_1.HttpsError("not-found", "Couple not found");
    }
    const couple = coupleDoc.data();
    const members = (_c = couple === null || couple === void 0 ? void 0 : couple.members) !== null && _c !== void 0 ? _c : [];
    if (!members.includes(auth.uid)) {
        throw new https_1.HttpsError("permission-denied", "You are not part of this couple");
    }
    // Clean up invites tied to this couple
    const invitesSnap = await db
        .collection("invites")
        .where("coupleId", "==", coupleId)
        .get();
    const batch = db.batch();
    invitesSnap.forEach((doc) => batch.delete(doc.ref));
    members.forEach((uid) => {
        batch.update(db.collection("users").doc(uid), {
            coupleId: null,
            updatedAt: firestore_1.Timestamp.now(),
        });
    });
    await batch.commit();
    // Recursively delete the couple and all nested data.
    try {
        await db.recursiveDelete(coupleRef);
    }
    catch (error) {
        console.error("recursiveDelete failed, deleting root doc only", error);
        await coupleRef.delete();
    }
    return { success: true };
});
//# sourceMappingURL=index.js.map