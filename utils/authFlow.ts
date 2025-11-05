/**
 * Auth flow utilities for managing user onboarding state
 */

import { AuthStatus } from "../types/app";

interface UserState {
  uid: string | null;
  displayName?: string | null;
}

/**
 * Determine the next auth status based on user data.
 * Flow: initializing -> signedOut -> profile -> ready
 */
export const getNextAuthStatus = (
  user: UserState,
  currentStatus: AuthStatus
): AuthStatus => {
  if (!user.uid) {
    return "signedOut";
  }

  if (!user.displayName || !user.displayName.trim()) {
    return "profile";
  }

  return "ready";
};

/**
 * Check if a transition would move forward in the flow.
 */
export const canProceedToNext = (
  currentStatus: AuthStatus,
  targetStatus: AuthStatus
): boolean => {
  const flowOrder: AuthStatus[] = ["initializing", "signedOut", "profile", "ready"];

  const currentIndex = flowOrder.indexOf(currentStatus);
  const targetIndex = flowOrder.indexOf(targetStatus);

  return currentIndex >= 0 && targetIndex > currentIndex;
};
