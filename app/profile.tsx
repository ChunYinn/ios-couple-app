import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
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
import {
  LOVE_LANGUAGES,
  DEFAULT_LOVE_LANGUAGES,
  LoveLanguageOption,
  MAX_LOVE_LANGUAGES,
  normalizeLoveLanguages,
} from "../data/loveLanguages";

const accentOptions = ["#FF8FAB", "#7FA3FF", "#42B883", "#F6C28B", "#C084FC"];

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
  const [selectedLoveLanguages, setSelectedLoveLanguages] = useState<LoveLanguageOption[]>(() => {
    if (!profile) {
      return LOVE_LANGUAGES.filter((option) =>
        DEFAULT_LOVE_LANGUAGES.includes(option.key)
      );
    }
    const normalized = normalizeLoveLanguages(profile.loveLanguages);
    const matches = LOVE_LANGUAGES.filter((option) =>
      normalized.includes(option.key)
    );
    return matches.length
      ? matches
      : LOVE_LANGUAGES.filter((option) =>
          DEFAULT_LOVE_LANGUAGES.includes(option.key)
        );
  });
  const [accentModalVisible, setAccentModalVisible] = useState(false);

  useEffect(() => {
    if (viewingMe && !profile) {
      router.replace("/onboarding/profile");
    }
  }, [viewingMe, profile?.uid, router]);

  useEffect(() => {
    setEditStatus(profile?.status ?? "Feeling Happy");
    setEditAbout(
      profile?.about ?? "Curious heart who loves to make memories that feel like magic."
    );
    setSelectedLoveLanguages(() => {
      if (!profile) {
        return LOVE_LANGUAGES.filter((option) =>
          DEFAULT_LOVE_LANGUAGES.includes(option.key)
        );
      }
      const normalized = normalizeLoveLanguages(profile.loveLanguages);
      const matches = LOVE_LANGUAGES.filter((option) =>
        normalized.includes(option.key)
      );
      return matches.length
        ? matches
        : LOVE_LANGUAGES.filter((option) =>
            DEFAULT_LOVE_LANGUAGES.includes(option.key)
          );
    });
  }, [profile?.status, profile?.about, profile?.loveLanguages]);

  const loveLanguageDisplay = useMemo(() => {
    if (!profile) {
      return LOVE_LANGUAGES.filter((option) =>
        DEFAULT_LOVE_LANGUAGES.includes(option.key)
      );
    }
    const normalized = normalizeLoveLanguages(profile.loveLanguages);
    const matches = LOVE_LANGUAGES.filter((option) =>
      normalized.includes(option.key)
    );
    return matches.length
      ? matches
      : LOVE_LANGUAGES.filter((option) =>
          DEFAULT_LOVE_LANGUAGES.includes(option.key)
        );
  }, [profile?.loveLanguages]);

  const accentColor = profile?.accentColor ?? palette.primary;

  const toggleLoveLanguage = (option: LoveLanguageOption) => {
    setSelectedLoveLanguages((prev) => {
      const exists = prev.some((entry) => entry.key === option.key);
      if (exists) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((entry) => entry.key !== option.key);
      }
      if (prev.length >= MAX_LOVE_LANGUAGES) {
        Alert.alert(
          "Pick up to three",
          `You can choose up to ${MAX_LOVE_LANGUAGES} love languages.`
        );
        return prev;
      }
      return [...prev, option];
    });
  };

  const handleSaveNotes = () => {
    dispatch({
      type: "UPDATE_PROFILE_NOTE",
      payload: {
        status: editStatus.trim() || profile?.status,
        about: editAbout.trim() || profile?.about,
        loveLanguages: selectedLoveLanguages.map((option) => option.key),
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
            {viewingMe ? "Loading your profile..." : "Waiting for your partner"}
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            {viewingMe
              ? "Hang tight while we open your profile editor."
              : pairing.isPaired
                ? "Ask your partner to join the app to see their profile blossom here."
                : "Pair up first to unlock both profiles."}
          </CuteText>
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
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {loveLanguageDisplay.length ? (
            loveLanguageDisplay.map((language) => (
              <Chip key={language.key} label={language.label} tone="primary" />
            ))
          ) : (
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Tap edit to choose up to three love languages that feel true to you.
            </CuteText>
          )}
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
        <View style={{ gap: 12 }}>
          <CuteText weight="semibold">Love languages</CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Choose up to {MAX_LOVE_LANGUAGES} ways you most love to give or receive affection.
          </CuteText>
          <View style={{ maxHeight: 240 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {LOVE_LANGUAGES.map((option) => {
                const isSelected = selectedLoveLanguages.some(
                  (entry) => entry.key === option.key
                );
                return (
                  <Pressable
                  key={option.key}
                  onPress={() => toggleLoveLanguage(option)}
                  style={{
                    borderWidth: 1,
                    borderColor: isSelected ? palette.primary : palette.border,
                    borderRadius: 18,
                    padding: 14,
                    backgroundColor: isSelected
                      ? palette.primarySoft
                      : palette.card,
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isSelected ? palette.primary : "transparent",
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: palette.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected ? (
                      <MaterialIcons name="favorite" size={16} color="#fff" />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <CuteText weight="semibold">{option.label}</CuteText>
                    <CuteText tone="muted" style={{ fontSize: 12 }}>
                      {option.description}
                    </CuteText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
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
