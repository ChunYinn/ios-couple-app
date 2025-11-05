import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect, useLayoutEffect, useState } from "react";
import { Appearance } from "react-native";

import { darkPalette, lightPalette } from "../theme/palette";
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

const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkPalette.primary,
    background: darkPalette.background,
    card: darkPalette.card,
    text: darkPalette.text,
    border: darkPalette.border,
    notification: darkPalette.accent,
  },
};

const useAppearanceScheme = () => {
  const [scheme, setScheme] = useState(Appearance.getColorScheme() ?? "light");

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setScheme(colorScheme);
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return scheme;
};

const Navigator = () => {
  const { state } = useAppData();
  const scheme = useAppearanceScheme();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Return null if the navigation state is not ready.
  if (!navigationState?.key) {
    return null;
  }

  useLayoutEffect(() => {
    if (state.auth.status === "initializing") {
      return;
    }

    if (!navigationState?.key) {
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
  }, [state.auth.status, segments, navigationState?.key]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor:
            scheme === "dark" ? darkPalette.background : lightPalette.background,
        },
      }}
    />
  );
};

export default function RootLayout() {
  const scheme = useAppearanceScheme();

  return (
    <ThemeProvider
      value={scheme === "dark" ? darkNavigationTheme : lightNavigationTheme}
    >
      <AppDataProvider>
        <Navigator />
      </AppDataProvider>
    </ThemeProvider>
  );
}
