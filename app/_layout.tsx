import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useLayoutEffect } from "react";

import { lightPalette } from "../theme/palette";
import { AppDataProvider, useAppData } from "../context/AppDataContext";

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
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const navigationKey = navigationState?.key;

  useLayoutEffect(() => {
    if (!navigationKey || state.auth.status === "initializing") {
      return;
    }

    const inAuthGroup = segments[0] === "auth";
    const inOnboardingGroup = segments[0] === "onboarding";
    const inTabsGroup = segments[0] === "(tabs)";
    const onLoadingScreen = !segments[0];

    if (state.auth.status === "signedOut" && !inAuthGroup) {
      router.replace("/auth");
    } else if (state.auth.status === "profile" && !inOnboardingGroup) {
      router.replace("/onboarding/profile");
    } else if (
      state.auth.status === "ready" &&
      (inAuthGroup || inOnboardingGroup || onLoadingScreen) &&
      !inTabsGroup
    ) {
      router.replace("/(tabs)");
    }
  }, [navigationKey, router, segments, state.auth.status]);

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
      <AppDataProvider>
        <Navigator />
      </AppDataProvider>
    </ThemeProvider>
  );
}
