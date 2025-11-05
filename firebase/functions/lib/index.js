"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redeemInvite = void 0;
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
    const code = (_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.code) === null || _b === void 0 ? void 0 : _b.toUpperCase();
    if (!code) {
        throw new https_1.HttpsError("invalid-argument", "Invite code is required");
    }
    const inviteDoc = await db.collection("invites").doc(code).get();
    if (!inviteDoc.exists) {
        throw new https_1.HttpsError("not-found", "Invalid code");
    }
    const invite = inviteDoc.data();
    if (!invite) {
        throw new https_1.HttpsError("internal", "Invite data missing");
    }
    if (invite.used) {
        throw new https_1.HttpsError("already-exists", "Code already used");
    }
    const userId = auth.uid;
    const coupleId = invite.coupleId;
    if (!coupleId) {
        throw new https_1.HttpsError("failed-precondition", "Invite is missing a coupleId");
    }
    const batch = db.batch();
    batch.update(db.collection("couples").doc(coupleId), {
        partnerUid: userId,
        members: firestore_1.FieldValue.arrayUnion(userId),
        isPaired: true,
        pairCompletedAt: firestore_1.Timestamp.now(),
    });
    batch.update(db.collection("users").doc(userId), {
        coupleId,
    });
    batch.update(inviteDoc.ref, {
        used: true,
        usedBy: userId,
        usedAt: firestore_1.Timestamp.now(),
    });
    await batch.commit();
    return { success: true, coupleId };
});
//# sourceMappingURL=index.js.map