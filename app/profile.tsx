import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  Pressable,
  View,
  useColorScheme,
} from "react-native";
import { useEffect, useMemo, useState } from "react";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { Chip } from "../components/Chip";
import { CuteModal } from "../components/CuteModal";
import { CuteTextInput } from "../components/CuteTextInput";
import { CuteButton } from "../components/CuteButton";
import { useAppData } from "../context/AppDataContext";

const accentOptions = ["#FF8FAB", "#A2D2FF", "#C7F9CC", "#F6C28B", "#F1C0E8"];

export default function ProfileScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const params = useLocalSearchParams<{ who?: string }>();
  const viewing = (params.who as string) ?? "me";
  const {
    state: { profiles, pairing },
    dispatch,
  } = useAppData();

  const viewingMe = viewing === "me" || viewing === "both";
  const profile = viewingMe ? profiles.me : profiles.partner;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editStatus, setEditStatus] = useState(profile?.status ?? "Feeling Happy");
  const [editAbout, setEditAbout] = useState(
    profile?.about ?? "Curious heart who loves to make memories that feel like magic."
  );
  const [editLoveLanguages, setEditLoveLanguages] = useState(
    profile?.loveLanguages.join(", ") ?? "Words of Affirmation"
  );
  const [accentModalVisible, setAccentModalVisible] = useState(false);

  useEffect(() => {
    setEditStatus(profile?.status ?? "Feeling Happy");
    setEditAbout(
      profile?.about ?? "Curious heart who loves to make memories that feel like magic."
    );
    setEditLoveLanguages(profile?.loveLanguages.join(", ") ?? "Words of Affirmation");
  }, [profile?.status, profile?.about, profile?.loveLanguages]);

  const parsedLoveLanguages = profile?.loveLanguages ?? [];

  const accentColor = profile?.accentColor ?? palette.primary;

  const handleSaveNotes = () => {
    const languages = editLoveLanguages
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    dispatch({
      type: "UPDATE_PROFILE_NOTE",
      payload: {
        status: editStatus.trim() || profile?.status,
        about: editAbout.trim() || profile?.about,
        loveLanguages: languages.length ? languages : profile?.loveLanguages,
      },
    });
    setEditModalVisible(false);
  };

  const handleSelectAccent = (color: string) => {
    dispatch({ type: "SET_PROFILE_ACCENT", payload: { accentColor: color } });
    setAccentModalVisible(false);
  };

  const sharedMemories = useMemo(() => [], []); // placeholder until storage is wired

  if (!profile) {
    return (
      <Screen scrollable={false}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 16,
          }}
        >
          <MaterialIcons name="person" size={48} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            {viewingMe ? "Create your profile" : "Waiting for your partner"}
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            {viewingMe
              ? "Add your name, vibes, and favourite things so everything feels personalised."
              : pairing.isPaired
                ? "Ask your partner to join the app to see their profile blossom here."
                : "Pair up first to unlock both profiles."}
          </CuteText>
          {viewingMe ? (
            <Pressable
              onPress={() => router.push("/onboarding/profile")}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: palette.primary,
              }}
            >
              <CuteText style={{ color: "#fff" }} weight="bold">
                Start profile
              </CuteText>
            </Pressable>
          ) : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 20,
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
          style={{ padding: 8, marginLeft: -8 }}
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={18}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Profile
        </CuteText>
        <Pressable
          onPress={() => setAccentModalVisible(true)}
          style={{ padding: 8 }}
        >
          <MaterialIcons name="palette" size={22} color={accentColor} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center", gap: 16 }}>
        <View
          style={{
            borderRadius: 120,
            padding: 6,
            backgroundColor: palette.card,
            shadowColor: "#00000020",
            shadowOpacity: 0.2,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: 140, height: 140, borderRadius: 70 }}
            />
          ) : (
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: accentColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcons name="person" size={56} color="#fff" />
            </View>
          )}
          {viewingMe ? (
            <Pressable
              onPress={() => router.push("/onboarding/profile")}
              style={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: accentColor,
                borderRadius: 16,
                padding: 8,
              }}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            {profile.displayName}
          </CuteText>
          <Chip label={profile.status} tone="secondary" />
        </View>
      </View>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            About {profile.displayName}
          </CuteText>
          {viewingMe ? (
            <Pressable
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              onPress={() => setEditModalVisible(true)}
            >
              <MaterialIcons name="edit" size={16} color={accentColor} />
              <CuteText weight="semibold" tone="accent">
                Edit
              </CuteText>
            </Pressable>
          ) : null}
        </View>
        <CuteText tone="muted" style={{ lineHeight: 20 }}>
          {profile.about}
        </CuteText>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            Love Languages
          </CuteText>
        </View>
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          A quick glance at how {profile.displayName} gives and receives love.
        </CuteText>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {parsedLoveLanguages.map((language) => (
            <Chip
              key={language}
              label={language}
              tone={language === "Acts of Service" ? "secondary" : "primary"}
            />
          ))}
        </View>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 14 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Our Memories
        </CuteText>
        {sharedMemories.length ? (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            {sharedMemories.map((memory) => (
              <ImageBackground
                key={memory}
                source={{ uri: memory }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              />
            ))}
          </View>
        ) : (
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Add your first shared memory to see it sparkle here.
          </CuteText>
        )}
      </CuteCard>

      <CuteModal
        visible={editModalVisible && viewingMe}
        onRequestClose={() => setEditModalVisible(false)}
        title="Update your vibe"
        subtitle="Tweak your status, bio, and love languages anytime."
      >
        <CuteTextInput
          label="Status"
          placeholder="How are you feeling?"
          value={editStatus}
          onChangeText={setEditStatus}
        />
        <CuteTextInput
          label="About"
          placeholder="Tell your story"
          value={editAbout}
          onChangeText={setEditAbout}
          multiline
          style={{ height: 100, textAlignVertical: "top" }}
        />
        <CuteTextInput
          label="Love languages"
          placeholder="Comma separated list"
          value={editLoveLanguages}
          onChangeText={setEditLoveLanguages}
        />
        <CuteButton label="Save changes" onPress={handleSaveNotes} />
      </CuteModal>

      <CuteModal
        visible={accentModalVisible && viewingMe}
        onRequestClose={() => setAccentModalVisible(false)}
        title="Choose your accent"
        subtitle="Cuddle up your buttons and highlights with the perfect hue."
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {accentOptions.map((color) => (
            <Pressable
              key={color}
              onPress={() => handleSelectAccent(color)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: color,
                borderWidth: accentColor === color ? 4 : 2,
                borderColor: accentColor === color ? palette.card : "#ffffffaa",
              }}
            />
          ))}
        </View>
      </CuteModal>
    </Screen>
  );
}
