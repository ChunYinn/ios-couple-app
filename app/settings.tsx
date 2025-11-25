import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, useColorScheme, View } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signOut } from "firebase/auth";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { CuteButton } from "../components/CuteButton";
import { useAppData } from "../context/AppDataContext";
import { firebaseApp, firebaseAuth } from "../firebase/config";
import { userService } from "../firebase/services";

const accentChoices = ["#FF8FAB", "#F6C28B", "#3A5BFF", "#1F9470", "#9B59FF"];

export default function SettingsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { settings, pairing, auth },
    dispatch,
  } = useAppData();
  const [pendingAccent, setPendingAccent] = useState(settings.accent);
  const [unbinding, setUnbinding] = useState(false);

  const coupleId = pairing.coupleId ?? auth.user.coupleId;
  const dangerColor = "#D95C5C";

  const applyAccent = async () => {
    dispatch({ type: "SET_PROFILE_ACCENT", payload: { accentColor: pendingAccent } });
    if (auth.user.uid) {
      try {
        await userService.updateUser(auth.user.uid, {
          accentColor: pendingAccent,
        });
      } catch (error) {
        console.error("Failed to save accent", error);
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll return to the sign-in screen. Unsynced changes on this device may be lost, but your account stays safe with your email and password.",
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

  const handleUnbind = async () => {
    if (!coupleId) {
      Alert.alert("Not paired", "You need to be paired before you can unbind.");
      return;
    }
    try {
      setUnbinding(true);
      const functions = getFunctions(firebaseApp, "australia-southeast1");
      const unbind = httpsCallable(functions, "unbindCouple");
      await unbind({ coupleId });
      dispatch({ type: "RESET_PAIRING" });
      Alert.alert("Unbound", "Couple removed successfully.");
      router.replace("/pairing");
    } catch (error) {
      console.error("Failed to unbind couple", error);
      Alert.alert(
        "Couldn't unbind",
        error instanceof Error
          ? error.message
          : "We couldn't remove your couple right now. Try again in a moment."
      );
    } finally {
      setUnbinding(false);
    }
  };

  const confirmUnbind = () => {
    if (!coupleId) {
      Alert.alert("Not paired", "You need to be paired before you can unbind.");
      return;
    }
    Alert.alert(
      "Unbind and delete couple?",
      "This removes all shared messages, milestones, todos, and profiles for both partners. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete couple",
          style: "destructive",
          onPress: handleUnbind,
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
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MaterialIcons name="arrow-back" size={20} color={palette.textSecondary} />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Cute Settings
        </CuteText>
        <View style={{ width: 32 }} />
      </View>

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
          Sign out to switch accounts or start fresh. Make sure changes are synced before leaving.
        </CuteText>
        <CuteButton
          label="Unbind & delete couple"
          tone="ghost"
          onPress={confirmUnbind}
          disabled={!coupleId || unbinding}
          icon={<MaterialIcons name="link-off" size={18} color={dangerColor} />}
          labelColor={dangerColor}
        />
        <CuteButton
          label="Sign out"
          tone="ghost"
          onPress={handleSignOut}
          icon={<MaterialIcons name="logout" size={18} color={dangerColor} />}
          labelColor={dangerColor}
        />
      </CuteCard>
    </Screen>
  );
}
