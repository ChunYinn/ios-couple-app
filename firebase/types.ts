import { FieldValue, Timestamp } from "firebase/firestore";
import { PronounValue, LoveLanguageValue } from "../types/app";

// ============= USER TYPES =============
export interface DBUser {
  uid: string;
  email: string;
  authProvider: "anonymous" | "password" | "custom";
  displayName: string;
  avatarUrl: string | null;
  birthday: string | null; // YYYY-MM-DD
  pronouns: PronounValue | null;
  coupleId: string | null;
  status?: string | null;
  about?: string | null;
  loveLanguages?: string[] | null;
  accentColor?: string | null;
  anniversaryDate?: string | null;
  createdAt: Timestamp | FieldValue;
  lastSeenAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface DBDevice {
  fcmToken: string;
  platform: "ios" | "android";
  pushEnabled: boolean;
  appVersion: string;
  lastSeenAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
}

// ============= COUPLE TYPES =============
export interface DBCouple {
  inviteCode: string;
  inviteLink: string;
  qrCodeData: string;
  isPaired: boolean;
  members: string[];
  ownerUid: string;
  partnerUid: string | null;
  anniversaryDate: string | null; // YYYY-MM-DD
  settings: {
    enablePush: boolean;
    enableFlashbacks: boolean;
    enableLocation: boolean;
    theme: "light" | "dark" | "auto";
  };
  createdAt: Timestamp | FieldValue;
  pairCompletedAt: Timestamp | FieldValue | null;
  lastActivityAt: Timestamp | FieldValue;
}

// ============= PROFILE TYPES =============
export interface DBProfile {
  displayName: string;
  status: string;
  avatarUrl: string | null;
  about: string;
  accentColor: string;
  emoji: string;
  birthday?: string | null;
  anniversary?: string | null;
  loveLanguages: LoveLanguageValue[];
  favorites: {
    category: string;
    label: string;
    value: string;
  }[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// ============= MESSAGE TYPES =============
export interface DBMessage {
  id?: string;
  sender: string;
  text: string;
  type: "text" | "image" | "voice" | "location" | "gif";
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  reactions: Record<string, string[]>; // emoji -> userIds
  readBy: Record<string, Timestamp | FieldValue>; // userId -> timestamp
  timestamp: Timestamp | FieldValue;
  editedAt: Timestamp | FieldValue | null;
  deletedAt: Timestamp | FieldValue | null;
}

// ============= TODO TYPES =============
export interface DBTodoCategory {
  id?: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  order: number;
}

export interface DBTodoItem {
  id?: string;
  categoryId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high" | null;
  assigneeIds: string[];
  dueDate: string | null; // YYYY-MM-DD
  reminderDate: Timestamp | FieldValue | null;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  completedAt: Timestamp | FieldValue | null;
  completedBy: string | null;
  updatedAt: Timestamp | FieldValue;
}

// ============= MEMORY TYPES =============
export interface DBMemory {
  id?: string;
  type: "photo" | "video";
  imageUrl: string;
  thumbnailUrl: string;
  videoUrl: string | null;
  caption: string | null;
  tags: string[];
  isFavorite: boolean;
  isPrivate: boolean;
  capturedDate: Timestamp | FieldValue;
  location: {
    latitude: number;
    longitude: number;
    name: string;
    address: string | null;
  } | null;
  uploadedBy: string;
  uploadedAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  faces: string[];
  sceneType: string | null;
}

// ============= MILESTONE TYPES =============
export interface DBMilestone {
  id?: string;
  title: string;
  description: string;
  type: "automatic" | "custom";
  image: string;
  badgeColor: string;
  icon: string;
  achievedAt: Timestamp | FieldValue;
  dayCount: number | null;
  customDate: string | null;
  customNote: string | null;
  createdAt: Timestamp | FieldValue;
  createdBy: string | null;
}

// ============= LOCATION TYPES =============
export interface DBLocation {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    speed: number | null;
  };
  isSharing: boolean;
  sharingNote: string | null;
  batteryLevel: number | null;
  isEmergency: boolean;
  timestamp: Timestamp | FieldValue;
  expiresAt: Timestamp | FieldValue;
}

export interface DBLocationHistory {
  userId: string;
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: Timestamp | FieldValue;
  activity: string | null;
  expiresAt: Timestamp | FieldValue;
}

// ============= INVITE TYPES =============
export interface DBInvite {
  code: string;
  coupleId: string;
  ownerUid: string;
  ownerName: string;
  ownerAvatar: string | null;
  used: boolean;
  usedBy: string | null;
  usedAt: Timestamp | FieldValue | null;
  createdAt: Timestamp | FieldValue;
  expiresAt: Timestamp | FieldValue;
  shareMethod: string | null;
}

// ============= NOTIFICATION TYPES =============
export interface DBNotification {
  id?: string;
  type:
    | "message"
    | "todo"
    | "memory"
    | "milestone"
    | "location"
    | "anniversary";
  title: string;
  body: string;
  recipientId: string;
  senderId: string | null;
  actionType: string | null;
  actionData: Record<string, any> | null;
  isRead: boolean;
  readAt: Timestamp | FieldValue | null;
  createdAt: Timestamp | FieldValue;
  expiresAt: Timestamp | FieldValue | null;
}

// ============= HELPER TYPES =============
export type FirestoreDate = Timestamp | FieldValue | Date;

export interface QueryOptions {
  limit?: number;
  startAfter?: any;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

// Convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to YYYY-MM-DD string
export const dateToString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Calculate days between dates
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};
