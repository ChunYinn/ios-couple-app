import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
    Stack,
    usePathname,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { useEffect, useRef } from "react";

import { AppDataProvider, useAppData } from "../context/AppDataContext";
import { SignupProvider } from "../context/SignupContext";
import { ToastProvider } from "../context/ToastContext";
import { lightPalette } from "../theme/palette";

const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightPalette.primary,
    background: lightPalette.background,
    card: lightPalette.card,
    text: lightPalette.text,
    border: lightPalette.border,
    notification: lightPalette.accent,
  },
};

const Navigator = () => {
  const { state } = useAppData();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const navigationKey = navigationState?.key;
  const lastRedirect = useRef<{ target: string; from: string } | null>(null);

  useEffect(() => {
    if (!navigationKey || state.auth.status === "initializing") {
      lastRedirect.current = null;
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const inTabsGroup = segments[0] === "(tabs)";
    const onLoadingScreen = !segments[0];
    const normalize = (value: string) =>
      (value.replace(/\/+$/, "") || "/").replace(/^\/?/, "/");
    const currentPath = normalize(pathname);

    let target: string | null = null;
    if (state.auth.status === "signedOut" && !inAuthGroup) {
      target = "/auth";
    } else if (state.auth.status === "profile" && !inAuthGroup) {
      target = "/auth/profile";
    } else if (
      state.auth.status === "ready" &&
      (inAuthGroup || onLoadingScreen) &&
      !inTabsGroup
    ) {
      target = "/(tabs)";
    }

    if (!target) {
      lastRedirect.current = null;
      return;
    }

    const normalizedTarget = normalize(target);

    if (normalizedTarget === currentPath) {
      lastRedirect.current = null;
      return;
    }

    if (lastRedirect.current?.target === normalizedTarget) {
      return;
    }

    lastRedirect.current = { target: normalizedTarget, from: currentPath };
    router.replace(target as any);
  }, [navigationKey, pathname, router, segments, state.auth.status]);

  // Return null if the navigation state is not ready.
  if (!navigationKey) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: lightPalette.background,
        },
      }}
    />
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider value={lightNavigationTheme}>
      <SignupProvider>
        <AppDataProvider>
          <ToastProvider>
            <Navigator />
          </ToastProvider>
        </AppDataProvider>
      </SignupProvider>
    </ThemeProvider>
  );
}
