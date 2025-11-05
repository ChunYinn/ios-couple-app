import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";

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
  DEFAULT_LOVE_LANGUAGES,
  LOVE_LANGUAGES,
  LoveLanguageOption,
  MAX_LOVE_LANGUAGES,
  normalizeLoveLanguages,
} from "../data/loveLanguages";
import { coupleService, userService } from "../firebase/services";
import { firebaseAuth } from "../firebase/config";
import { calculateDaysTogether, formatDateToYMD, parseLocalDate } from "../utils/dateUtils";

const DEFAULT_STATUS = "";
const DEFAULT_ABOUT =
  "Curious heart who loves to make memories that feel like magic.";
const accentOptions = ["#FF8FAB", "#3A5BFF", "#1F9470", "#F6C28B", "#9B59FF"];

const formatBirthdayLabel = (value: string | undefined) => {
  if (!value) {
    return "Add your birthday so we can plan sweet surprises.";
  }
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const resolveLoveLanguages = (loveLanguages?: string[]) => {
  const normalized = normalizeLoveLanguages(loveLanguages);
  const matches = LOVE_LANGUAGES.filter((option) =>
    normalized.includes(option.key)
  );
  if (matches.length) {
    return matches;
  }
  return LOVE_LANGUAGES.filter((option) =>
    DEFAULT_LOVE_LANGUAGES.includes(option.key)
  );
};

export default function ProfileScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const params = useLocalSearchParams<{ who?: string }>();
  const viewing = (params.who as string) ?? "me";

  const {
    state: { profiles, pairing, auth },
    dispatch,
  } = useAppData();

  const viewingMe = viewing === "me" || viewing === "both";
  const profile = viewingMe ? profiles.me : profiles.partner;
  const accentColor = profile?.accentColor ?? palette.primary;

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    profile?.displayName ?? auth.user.displayName ?? ""
  );
  const [editStatus, setEditStatus] = useState(profile?.status ?? DEFAULT_STATUS);
  const [editAbout, setEditAbout] = useState(
    profile?.about ?? DEFAULT_ABOUT
  );
  const [selectedLoveLanguages, setSelectedLoveLanguages] =
    useState<LoveLanguageOption[]>(() =>
      resolveLoveLanguages(profile?.loveLanguages)
    );
  const [selectedAccent, setSelectedAccent] = useState(
    profile?.accentColor ?? palette.primary
  );
  const [birthdayInput, setBirthdayInput] = useState<string>(() =>
    profile?.birthday
      ? formatDateToYMD(profile.birthday)
      : auth.user.birthday
        ? formatDateToYMD(auth.user.birthday)
        : ""
  );
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [anniversaryInput, setAnniversaryInput] = useState<string>(() =>
    auth.user.anniversaryDate
      ? formatDateToYMD(auth.user.anniversaryDate)
      : ""
  );
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    profile?.avatarUrl ?? auth.user.avatarUrl ?? undefined
  );
  const [avatarUploadUri, setAvatarUploadUri] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (viewingMe && !profile) {
      router.replace("/onboarding/profile");
    }
  }, [viewingMe, profile]);

  const resetEditorFromProfile = useCallback(() => {
    if (!profile) {
      return;
    }
    setDisplayNameInput(profile.displayName ?? auth.user.displayName ?? "");
    setEditStatus(profile.status ?? DEFAULT_STATUS);
    setEditAbout(profile.about ?? DEFAULT_ABOUT);
    setSelectedLoveLanguages(resolveLoveLanguages(profile.loveLanguages));
    setSelectedAccent(profile.accentColor ?? palette.primary);
    setBirthdayInput(
      profile.birthday
        ? formatDateToYMD(profile.birthday)
        : auth.user.birthday
          ? formatDateToYMD(auth.user.birthday)
          : ""
    );
    setAnniversaryInput(
      auth.user.anniversaryDate
        ? formatDateToYMD(auth.user.anniversaryDate)
        : ""
    );
    setAvatarPreview(profile.avatarUrl ?? auth.user.avatarUrl ?? undefined);
    setAvatarUploadUri(null);
    setRemoveAvatar(false);
    setSaveError(null);
    setShowBirthdayPicker(false);
    setShowAnniversaryPicker(false);
  }, [
    profile,
    auth.user.displayName,
    auth.user.avatarUrl,
    auth.user.birthday,
    auth.user.anniversaryDate,
    palette.primary,
  ]);

  useEffect(() => {
    if (profile) {
      resetEditorFromProfile();
    }
  }, [profile, resetEditorFromProfile]);

  useEffect(() => {
    if (viewingMe) {
      setAnniversaryInput(
        auth.user.anniversaryDate
          ? formatDateToYMD(auth.user.anniversaryDate)
          : ""
      );
    }
  }, [auth.user.anniversaryDate, viewingMe]);

  const loveLanguageDisplay = useMemo(() => {
    return resolveLoveLanguages(profile?.loveLanguages);
  }, [profile?.loveLanguages]);

  const selectedBirthdayDate = useMemo(
    () => (birthdayInput ? parseLocalDate(birthdayInput) : new Date()),
    [birthdayInput]
  );
  const selectedAnniversaryDate = useMemo(
    () => (anniversaryInput ? parseLocalDate(anniversaryInput) : new Date()),
    [anniversaryInput]
  );

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

  const requestLibraryAccess = useCallback(async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo access so we can add your profile picture."
      );
      return false;
    }
    return true;
  }, []);

  const requestCameraAccess = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow camera access to snap a quick picture."
      );
      return false;
    }
    return true;
  }, []);

  const handlePickImage = useCallback(async () => {
    if (!(await requestLibraryAccess())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarPreview(uri);
      setAvatarUploadUri(uri);
      setRemoveAvatar(false);
      setSaveError(null);
    }
  }, [requestLibraryAccess]);

  const handleTakePhoto = useCallback(async () => {
    if (!(await requestCameraAccess())) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarPreview(uri);
      setAvatarUploadUri(uri);
      setRemoveAvatar(false);
      setSaveError(null);
    }
  }, [requestCameraAccess]);

  const handleRemoveAvatar = useCallback(() => {
    setAvatarPreview(undefined);
    setAvatarUploadUri(null);
    setRemoveAvatar(Boolean(profile?.avatarUrl));
    setSaveError(null);
  }, [profile?.avatarUrl]);

  const showImageOptions = useCallback(() => {
    const options: {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }[] = [
      { text: "Take photo", onPress: handleTakePhoto },
      { text: "Choose from library", onPress: handlePickImage },
    ];

    if (avatarPreview) {
      options.push({
        text: "Remove photo",
        style: "destructive",
        onPress: handleRemoveAvatar,
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Profile picture",
      "How would you like to add your photo?",
      options,
      { cancelable: true }
    );
  }, [handlePickImage, handleTakePhoto, handleRemoveAvatar, avatarPreview]);

  const handleBirthdayChange = (_: unknown, date?: Date) => {
    if (Platform.OS !== "ios") {
      setShowBirthdayPicker(false);
    }
    if (date) {
      setBirthdayInput(formatDateToYMD(date.toISOString()));
      setSaveError(null);
    }
  };

  const handleAnniversaryChange = (_: unknown, date?: Date) => {
    if (Platform.OS !== "ios") {
      setShowAnniversaryPicker(false);
    }
    if (date) {
      setAnniversaryInput(formatDateToYMD(date.toISOString()));
      setSaveError(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!viewingMe || !profile || !auth.user.uid) {
      return;
    }

    const trimmedName = displayNameInput.trim();
    if (!trimmedName.length) {
      setSaveError("Let us know what to call you.");
      return;
    }

    if (!selectedLoveLanguages.length) {
      setSaveError("Choose at least one love language.");
      return;
    }

    setSavingProfile(true);
    setSaveError(null);

    try {
      let nextAvatarUrl = profile.avatarUrl;

      if (avatarUploadUri) {
        nextAvatarUrl = await userService.uploadAvatar(
          profile.uid,
          avatarUploadUri,
          profile.avatarUrl ?? null
        );
      } else if (removeAvatar && profile.avatarUrl) {
        await userService.deleteAvatarFile(profile.avatarUrl);
        nextAvatarUrl = undefined;
      }

      const trimmedStatus = editStatus.trim();
      const trimmedAbout = editAbout.trim() || DEFAULT_ABOUT;
      const loveLanguageKeys = selectedLoveLanguages.map((option) => option.key);
      const normalizedBirthday = birthdayInput
        ? formatDateToYMD(birthdayInput)
        : null;
      const normalizedAnniversary = anniversaryInput
        ? formatDateToYMD(anniversaryInput)
        : "";
      const previousAnniversary = auth.user.anniversaryDate
        ? formatDateToYMD(auth.user.anniversaryDate)
        : "";
      const anniversaryChanged =
        normalizedAnniversary !== previousAnniversary;

      if (anniversaryChanged && auth.user.coupleId) {
        await coupleService.setAnniversary(
          auth.user.coupleId,
          normalizedAnniversary || null
        );
      }

      await userService.updateUser(profile.uid, {
        displayName: trimmedName,
        avatarUrl: nextAvatarUrl ?? null,
        status: trimmedStatus || null,
        about: trimmedAbout,
        loveLanguages: loveLanguageKeys,
        accentColor: selectedAccent,
        birthday: normalizedBirthday,
        anniversaryDate: normalizedAnniversary || null,
      });

      if (firebaseAuth.currentUser) {
        try {
          await updateProfile(firebaseAuth.currentUser, {
            displayName: trimmedName,
            photoURL: nextAvatarUrl ?? null,
          });
        } catch (profileError) {
          console.warn("Failed to update Firebase profile", profileError);
        }
      }

      dispatch({
        type: "UPDATE_AUTH_USER",
        payload: {
          displayName: trimmedName,
          avatarUrl: nextAvatarUrl,
          birthday: normalizedBirthday ?? undefined,
          anniversaryDate: normalizedAnniversary || undefined,
        },
      });

      dispatch({
        type: "UPDATE_PROFILES",
        payload: {
          me: {
            ...profile,
            displayName: trimmedName,
            status: trimmedStatus || DEFAULT_STATUS,
            about: trimmedAbout,
            accentColor: selectedAccent,
            birthday: normalizedBirthday ?? undefined,
            avatarUrl: nextAvatarUrl,
            loveLanguages: loveLanguageKeys,
          },
        },
      });

      if (anniversaryChanged) {
        const daysTogether = normalizedAnniversary
          ? calculateDaysTogether(normalizedAnniversary)
          : 0;
        dispatch({
          type: "SET_ANNIVERSARY",
          payload: {
            anniversaryDate: normalizedAnniversary,
            daysTogether,
          },
        });
      }

      setEditModalVisible(false);
      setAvatarUploadUri(null);
      setRemoveAvatar(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      setSaveError(
        "We couldn't save your changes right now. Please try again in a moment."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const sharedMemories = useMemo(() => [], []); // placeholder until storage is wired

  const openEditModal = () => {
    resetEditorFromProfile();
    setEditModalVisible(true);
  };

  const closeModal = () => {
    resetEditorFromProfile();
    setEditModalVisible(false);
  };

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
        {viewingMe ? (
          <Pressable onPress={openEditModal} style={{ padding: 8 }}>
            <CuteText tone="accent" weight="semibold">
              Edit
            </CuteText>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
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
              onPress={openEditModal}
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
          {profile.status ? (
            <Chip
              label={profile.status}
              tone="primary"
              style={{ backgroundColor: profile.accentColor ?? palette.primary }}
            />
          ) : null}
        </View>
      </View>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          About {profile.displayName}
        </CuteText>
        <CuteText tone="muted" style={{ lineHeight: 20 }}>
          {profile.about ?? DEFAULT_ABOUT}
        </CuteText>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Birthday
        </CuteText>
        <CuteText tone="muted" style={{ fontSize: 15 }}>
          {(() => {
            const ownValue =
              profile.birthday ??
              (viewingMe ? auth.user.birthday ?? undefined : undefined);
            if (ownValue) {
              return formatBirthdayLabel(ownValue);
            }
            return viewingMe
              ? "Add your birthday so we can plan sweet surprises."
              : "Your partner hasn’t shared their birthday yet.";
          })()}
        </CuteText>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Anniversary
        </CuteText>
        <CuteText tone="muted" style={{ fontSize: 15 }}>
          {(() => {
            const anniversaryValue = auth.user.anniversaryDate;
            if (anniversaryValue) {
              return parseLocalDate(anniversaryValue).toLocaleDateString(
                undefined,
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              );
            }
            return viewingMe
              ? "Add your anniversary so we can count your days together."
              : "No anniversary is set yet.";
          })()}
        </CuteText>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          Love Languages
        </CuteText>
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
        onRequestClose={closeModal}
        title="Update your profile"
        subtitle="Refresh your photo, details, and love languages anytime."
        contentStyle={{ paddingBottom: 24 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 18, paddingBottom: 8 }}
          style={{ maxHeight: 520 }}
        >
          <View style={{ alignItems: "center", gap: 12 }}>
            <Pressable
              onPress={showImageOptions}
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: palette.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderWidth: 3,
                borderColor: avatarPreview ? palette.primary : palette.border,
                shadowColor: palette.primary,
                shadowOpacity: 0.18,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 6,
              }}
            >
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  style={{ width: 128, height: 128 }}
                />
              ) : (
                <MaterialIcons
                  name="photo-camera"
                  size={40}
                  color={palette.primary}
                />
              )}
            </Pressable>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Tap to {avatarPreview ? "change or remove" : "add"} your photo.
            </CuteText>
          </View>

          <CuteTextInput
            label="Display name"
            placeholder="How should we address you?"
            value={displayNameInput}
            onChangeText={setDisplayNameInput}
          />

          <CuteTextInput
            label="Status"
            placeholder="How are you feeling?"
            value={editStatus}
            onChangeText={setEditStatus}
          />

          <CuteTextInput
            label="About you"
            placeholder="Write a little note about who you are."
            value={editAbout}
            onChangeText={setEditAbout}
            multiline
            style={{ height: 96, textAlignVertical: "top" }}
          />

          <View style={{ gap: 12 }}>
            <CuteText weight="semibold">Love languages</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Choose up to {MAX_LOVE_LANGUAGES} ways you most love to give or receive affection.
            </CuteText>
            <View style={{ maxHeight: 220 }}>
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
                        borderColor: isSelected
                          ? palette.primary
                          : palette.border,
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
                          backgroundColor: isSelected
                            ? palette.primary
                            : "transparent",
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: palette.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected ? (
                          <MaterialIcons
                            name="favorite"
                            size={16}
                            color="#fff"
                          />
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

          <View style={{ gap: 12 }}>
            <CuteText weight="semibold">Birthday</CuteText>
            <Pressable
              onPress={() => setShowBirthdayPicker(true)}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: palette.background,
              }}
            >
              <CuteText>
                {birthdayInput
                  ? formatBirthdayLabel(birthdayInput)
                  : "Select a date"}
              </CuteText>
            </Pressable>
            {showBirthdayPicker ? (
              <DateTimePicker
                value={selectedBirthdayDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleBirthdayChange}
                maximumDate={new Date()}
              />
            ) : null}
          </View>

          <View style={{ gap: 12 }}>
            <CuteText weight="semibold">Anniversary</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              We will count your days together from this date.
            </CuteText>
            <Pressable
              onPress={() => setShowAnniversaryPicker(true)}
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: palette.background,
              }}
            >
              <CuteText>
                {anniversaryInput
                  ? parseLocalDate(anniversaryInput).toLocaleDateString(
                      undefined,
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "Select a date"}
              </CuteText>
            </Pressable>
            {showAnniversaryPicker ? (
              <DateTimePicker
                value={selectedAnniversaryDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleAnniversaryChange}
                maximumDate={new Date()}
              />
            ) : null}
            {anniversaryInput ? (
              <Pressable
                onPress={() => {
                  setAnniversaryInput("");
                  setSaveError(null);
                  setShowAnniversaryPicker(false);
                }}
                style={{ alignSelf: "flex-start", paddingVertical: 4 }}
              >
                <CuteText tone="accent" style={{ fontSize: 13 }}>
                  Clear anniversary
                </CuteText>
              </Pressable>
            ) : null}
          </View>

          <View style={{ gap: 12 }}>
            <CuteText weight="semibold">Accent color</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Choose the hue that styles your highlights across the app.
            </CuteText>
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
                  onPress={() => {
                    setSelectedAccent(color);
                    setSaveError(null);
                  }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: color,
                    borderWidth: selectedAccent === color ? 4 : 2,
                    borderColor:
                      selectedAccent === color ? palette.card : "#ffffffaa",
                  }}
                />
              ))}
            </View>
          </View>

          {saveError ? (
            <CuteText
              weight="semibold"
              style={{ fontSize: 13, color: "#D93025" }}
            >
              {saveError}
            </CuteText>
          ) : null}
        </ScrollView>
        <CuteButton
          label={savingProfile ? "Saving..." : "Save changes"}
          onPress={handleSaveProfile}
          disabled={savingProfile}
          style={{ marginTop: 4 }}
        />
        {savingProfile ? (
          <View style={{ alignItems: "center", marginTop: -4 }}>
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : null}
      </CuteModal>
    </Screen>
  );
}
