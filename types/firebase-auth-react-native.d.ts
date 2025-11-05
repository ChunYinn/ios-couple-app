import type { Persistence } from "firebase/auth";

declare module "firebase/auth/react-native" {
  export function getReactNativePersistence(
    storage: {
      getItem(key: string): Promise<string | null>;
      setItem(key: string, value: string): Promise<void>;
      removeItem(key: string): Promise<void>;
    }
  ): Persistence;
}
