import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
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
    const listener = ({ colorScheme }: { colorScheme: "light" | "dark" | null }) => {
      if (colorScheme) {
        setScheme(colorScheme);
      }
    };
    const subscription = Appearance.addChangeListener(listener);
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

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }
    if (!segments.length) {
      return;
    }
    const root = segments[0];
    const next = state.auth.status;

    if (next === "signedOut" && root !== "auth") {
      router.replace("/auth");
      return;
    }
    if (next === "profile" && !(root === "onboarding" && segments[1] === "profile")) {
      router.replace("/onboarding/profile");
      return;
    }
    if (next === "pairing" && root !== "pairing") {
      router.replace("/pairing");
      return;
    }
    if (next === "anniversary" && root !== "anniversary") {
      router.replace("/anniversary");
      return;
    }
    const allowedReadyRoots = [
      "(tabs)",
      "settings",
      "profile",
      "location",
      "favorites",
      "milestone",
      "pairing",
      "anniversary",
    ];
    if (next === "ready" && !allowedReadyRoots.includes(root ?? "")) {
      router.replace("/(tabs)");
    }
  }, [state.auth.status, segments, router, navigationState?.key]);

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
