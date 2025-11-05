import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, Switch, useColorScheme, View } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { CuteButton } from "../components/CuteButton";
import { useAppData } from "../context/AppDataContext";
import { firebaseAuth } from "../firebase/config";
import { coupleService } from "../firebase/services";

const accentChoices = ["#FF8FAB", "#F6C28B", "#7FA3FF", "#42B883", "#C084FC"];

export default function SettingsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { settings, pairing, auth },
    dispatch,
  } = useAppData();
  const [pendingAccent, setPendingAccent] = useState(settings.accent);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const coupleId = pairing.coupleId ?? auth.user.coupleId;

  const togglePush = async () => {
    if (!coupleId) {
      Alert.alert(
        "Pair up first",
        "Invite your partner so you can enable shared reminders together."
      );
      return;
    }
    const next = !settings.enablePush;
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { enablePush: next },
    });
    try {
      setUpdatingSettings(true);
      await coupleService.updateSettings(coupleId, { enablePush: next });
    } catch (error) {
      console.error("Failed to update push setting", error);
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { enablePush: !next },
      });
    } finally {
      setUpdatingSettings(false);
    }
  };

  const toggleFlashbacks = async () => {
    if (!coupleId) {
      Alert.alert(
        "Pair up first",
        "Connect with your partner to relive shared flashbacks."
      );
      return;
    }
    const next = !settings.enableFlashbacks;
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { enableFlashbacks: next },
    });
    if (!coupleId) return;
    try {
      setUpdatingSettings(true);
      await coupleService.updateSettings(coupleId, { enableFlashbacks: next });
    } catch (error) {
      console.error("Failed to update flashbacks setting", error);
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { enableFlashbacks: !next },
      });
    } finally {
      setUpdatingSettings(false);
    }
  };

  const applyAccent = () =>
    dispatch({ type: "SET_PROFILE_ACCENT", payload: { accentColor: pendingAccent } });

  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "Signing out removes your anonymous profile from this device and may delete any unsynced data. You can always start fresh, but the current memories may be lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => signOut(firebaseAuth),
        },
      ],
      { cancelable: true }
    );
  };

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

      {coupleId ? (
        <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            Couple notifications
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
              disabled={updatingSettings}
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
              disabled={updatingSettings}
            />
          </View>
        </CuteCard>
      ) : (
        <CuteCard background={palette.card} padding={20} style={{ gap: 12 }}>
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            Couple notifications
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Pair with your partner to turn on shared reminders and flashback highlights.
          </CuteText>
          <CuteButton label="Go to pairing" onPress={() => router.push("/pairing")} />
        </CuteCard>
      )}

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
          Sign out to start over. This removes the local anonymous account and its data.
        </CuteText>
        <CuteButton
          label="Sign out"
          tone="ghost"
          onPress={handleSignOut}
        />
      </CuteCard>
    </Screen>
  );
}
