import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import type { Persistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

type StorageModule = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const createAsyncStoragePersistence = (
  storage: StorageModule
): Persistence => {
  class ReactNativeAsyncStoragePersistence {
    public static type = "LOCAL";
    public readonly type = "LOCAL";

    async _isAvailable(): Promise<boolean> {
      try {
        await storage.setItem("__firebase__persistence__test", "1");
        await storage.removeItem("__firebase__persistence__test");
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown): Promise<void> {
      return storage.setItem(key, JSON.stringify(value));
    }

    async _get<T = unknown>(key: string): Promise<T | null> {
      const json = await storage.getItem(key);
      return json ? (JSON.parse(json) as T) : null;
    }

    _remove(key: string): Promise<void> {
      return storage.removeItem(key);
    }

    // Listeners are not supported for AsyncStorage persistence.
    _addListener(_key: string, _listener: () => void): void {}

    _removeListener(_key: string, _listener: () => void): void {}
  }

  return ReactNativeAsyncStoragePersistence as unknown as Persistence;
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!getApps().length) initializeApp(firebaseConfig);

export const firebaseApp = getApp();

let authInstance;
if (Platform.OS === "web") {
  authInstance = getAuth(firebaseApp);
} else {
  try {
    authInstance = initializeAuth(firebaseApp, {
      persistence: createAsyncStoragePersistence(AsyncStorage),
    });
  } catch (error) {
    authInstance = getAuth(firebaseApp);
  }
}

export const firebaseAuth = authInstance;
