import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";

import { firebaseAuth } from "../firebase/config";
import { userService } from "../firebase/services";

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );
    return user;
  },

  async signUpWithEmail(email: string, password: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(
      firebaseAuth,
      email.trim(),
      password
    );
    return user;
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
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
