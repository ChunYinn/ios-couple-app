import {
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";

import { firebaseAuth } from "../firebase/config";
import { userService } from "../firebase/services";

export const authService = {
  /**
   * Ensure that the device has an anonymous Firebase session.
   * Returns the existing user if already signed in.
   */
  async ensureAnonymousSession(): Promise<User> {
    if (firebaseAuth.currentUser) {
      return firebaseAuth.currentUser;
    }
    const { user } = await signInAnonymously(firebaseAuth);
    return user;
  },

  async createAnonymousAccount(): Promise<User> {
    return this.ensureAnonymousSession();
  },

  async upgradeAnonymousUser(email: string, password: string): Promise<User> {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user to upgrade");
    }
    if (!currentUser.isAnonymous) {
      return currentUser;
    }

    const credential = EmailAuthProvider.credential(email, password);
    const { user } = await linkWithCredential(currentUser, credential);

    try {
      await userService.updateUser(user.uid, {
        authProvider: "password",
        email: user.email ?? email,
      });
    } catch (error) {
      console.warn("Failed to update user document after upgrade", error);
    }

    return user;
  },

  async updateDisplayName(displayName: string): Promise<void> {
    if (!firebaseAuth.currentUser) {
      throw new Error("No authenticated user");
    }
    await updateProfile(firebaseAuth.currentUser, { displayName });
  },

  /**
   * Sign the current user out. Consumers should warn about data loss first.
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(firebaseAuth);
  },
};
