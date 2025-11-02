import { StatusBar } from "expo-status-bar";
import { Pressable, Switch, useColorScheme, View } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { CuteButton } from "../components/CuteButton";
import { useAppData } from "../context/AppDataContext";

const accentChoices = ["#FF8FAB", "#F6C28B", "#A2D2FF", "#C7F9CC", "#F1C0E8"];

export default function SettingsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { settings },
    dispatch,
  } = useAppData();
  const [pendingAccent, setPendingAccent] = useState(settings.accent);

  const togglePush = () =>
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { enablePush: !settings.enablePush },
    });

  const toggleFlashbacks = () =>
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { enableFlashbacks: !settings.enableFlashbacks },
    });

  const applyAccent = () =>
    dispatch({ type: "UPDATE_SETTINGS", payload: { accent: pendingAccent } });

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 18,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 6, marginLeft: -6 }}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color={palette.textSecondary} />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Cute Settings
        </CuteText>
        <View style={{ width: 32 }} />
      </View>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Notifications
        </CuteText>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <CuteText>Push love notes</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Get gentle reminders and cute nudges throughout the day.
            </CuteText>
          </View>
          <Switch
            value={settings.enablePush}
            onValueChange={togglePush}
            thumbColor={settings.enablePush ? palette.primary : "#ffffff"}
            trackColor={{ false: palette.border, true: palette.primarySoft }}
          />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <CuteText>Daily flashbacks</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Highlight memories on mornings with matching anniversaries.
            </CuteText>
          </View>
          <Switch
            value={settings.enableFlashbacks}
            onValueChange={toggleFlashbacks}
            thumbColor={settings.enableFlashbacks ? palette.primary : "#ffffff"}
            trackColor={{ false: palette.border, true: palette.primarySoft }}
          />
        </View>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Accent palette
        </CuteText>
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          Choose the glow that will splash across buttons and highlights.
        </CuteText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {accentChoices.map((color) => {
            const isActive = color === pendingAccent;
            return (
              <Pressable
                key={color}
                onPress={() => setPendingAccent(color)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: color,
                  borderWidth: isActive ? 4 : 2,
                  borderColor: isActive ? palette.card : "#ffffffaa",
                }}
              />
            );
          })}
        </View>
        <CuteButton
          label="Update accent"
          onPress={applyAccent}
          disabled={pendingAccent === settings.accent}
        />
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 12 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Account
        </CuteText>
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          Sign out to switch accounts or start fresh.
        </CuteText>
        <CuteButton
          label="Sign out"
          tone="ghost"
          onPress={() => dispatch({ type: "SIGN_OUT" })}
        />
      </CuteCard>
    </Screen>
  );
}
