import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Pressable, useColorScheme, View } from "react-native";

import { CuteButton } from "../components/CuteButton";
import { CuteCard } from "../components/CuteCard";
import { CuteText } from "../components/CuteText";
import { Screen } from "../components/Screen";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAppData } from "../context/AppDataContext";
import { useToast } from "../context/ToastContext";
import { firebaseApp, firebaseAuth } from "../firebase/config";
import { userService } from "../firebase/services";
import { usePalette } from "../hooks/usePalette";

const accentChoices = ["#FF8FAB", "#F6C28B", "#3A5BFF", "#1F9470", "#9B59FF"];

export default function SettingsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { settings, pairing, auth },
    dispatch,
  } = useAppData();
  const { showToast } = useToast();
  const [pendingAccent, setPendingAccent] = useState(settings.accent);
  const [unbinding, setUnbinding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const closeConfirm = () => setConfirmDialog(null);
  const confirmAndRun = () => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  };

  const coupleId = pairing.coupleId ?? auth.user.coupleId;
  const isPaired = pairing.isPaired && Boolean(coupleId);
  const dangerColor = "#D95C5C";

  const applyAccent = async () => {
    dispatch({
      type: "SET_PROFILE_ACCENT",
      payload: { accentColor: pendingAccent },
    });
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
    setConfirmDialog({
      title: "Sign out?",
      message:
        "You'll return to the sign-in screen. Unsynced changes on this device may be lost, but your account stays safe with your email and password.",
      confirmLabel: "Sign out",
      destructive: true,
      onConfirm: () => signOut(firebaseAuth),
    });
  };

  const handleUnbind = async () => {
    if (!coupleId) {
      showToast({ tone: "info", message: "You're not paired right now." });
      return;
    }
    try {
      setUnbinding(true);
      const functions = getFunctions(firebaseApp, "australia-southeast1");
      const unbind = httpsCallable(functions, "unbindCouple");
      await unbind({ coupleId });
      dispatch({ type: "RESET_PAIRING" });
      showToast({ tone: "success", message: "Couple removed successfully." });
      router.replace("/");
    } catch (error) {
      console.error("Failed to unbind couple", error);
      showToast({
        tone: "error",
        title: "Couldn't unbind",
        message:
          error instanceof Error
            ? error.message
            : "We couldn't remove your couple right now. Try again in a moment.",
      });
    } finally {
      setUnbinding(false);
    }
  };

  const confirmUnbind = () => {
    if (!isPaired) {
      showToast({
        tone: "info",
        message: "You need to be paired before you can unbind.",
      });
      return;
    }
    setConfirmDialog({
      title: "Unbind and delete couple?",
      message:
        "This removes all shared messages, milestones, todos, and profiles for both partners. This can't be undone.",
      confirmLabel: "Delete couple",
      destructive: true,
      onConfirm: handleUnbind,
    });
  };

  return (
    <>
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
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Settings
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
          Sign out to switch accounts or start fresh. Make sure changes are
          synced before leaving.
        </CuteText>
        {isPaired ? (
          <CuteButton
            label={unbinding ? "Unbinding..." : "Unbind & delete couple"}
            tone="ghost"
            onPress={confirmUnbind}
            disabled={unbinding}
            icon={
              <MaterialIcons name="link-off" size={18} color={dangerColor} />
            }
            labelColor={dangerColor}
          />
        ) : null}
        <CuteButton
          label="Sign out"
          tone="ghost"
          onPress={handleSignOut}
          icon={<MaterialIcons name="logout" size={18} color={dangerColor} />}
          labelColor={dangerColor}
        />
      </CuteCard>
      </Screen>
      <ConfirmDialog
        visible={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        destructive={confirmDialog?.destructive}
        onCancel={closeConfirm}
        onConfirm={confirmAndRun}
      />
    </>
  );
}
