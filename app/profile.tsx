import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { updateProfile } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import { AppDatePicker } from "../components/AppDatePicker";

import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Chip } from "../components/Chip";
import { CuteButton } from "../components/CuteButton";
import { CuteCard } from "../components/CuteCard";
import { CuteModal } from "../components/CuteModal";
import { CuteText } from "../components/CuteText";
import { CuteTextInput } from "../components/CuteTextInput";
import { Screen } from "../components/Screen";
import { useAppData } from "../context/AppDataContext";
import {
  DEFAULT_LOVE_LANGUAGES,
  LOVE_LANGUAGES,
  LoveLanguageOption,
  normalizeLoveLanguages,
} from "../data/loveLanguages";
import { firebaseAuth } from "../firebase/config";
import { coupleService, profileService, userService } from "../firebase/services";
import { usePalette } from "../hooks/usePalette";
import {
  calculateDaysTogether,
  formatDateToYMD,
  parseLocalDate,
} from "../utils/dateUtils";
import { ProfileFavorite } from "../types/app";

const DEFAULT_STATUS = "";
const DEFAULT_ABOUT =
  "Curious heart who loves to make memories that feel like magic.";
const accentOptions = ["#FF8FAB", "#3A5BFF", "#1F9470", "#F6C28B", "#9B59FF"];
const DEFAULT_FAVORITE_CATEGORY = "custom";

const normalizeFavoriteEntries = (favorites?: ProfileFavorite[]) =>
  favorites?.map((favorite) => ({
    label: favorite.label,
    value: favorite.value,
    category: favorite.category ?? DEFAULT_FAVORITE_CATEGORY,
  })) ?? [];
const EDITOR_TAB_META: Record<
  EditorSection,
  { label: string; title: string }
> = {
  about: { label: "Basics", title: "Edit your basics" },
  loveLanguages: { label: "Love languages", title: "Love languages" },
  favorites: { label: "Favorites", title: "Favorites & preferences" },
};

const formatBirthdayLabel = (value: string | undefined) => {
  if (!value) {
    return "Select a date";
  }
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatAnniversaryLabel = (value: string | undefined) => {
  if (!value) {
    return null;
  }
  return parseLocalDate(value).toLocaleDateString(undefined, {
    month: "short",
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

type EditorSection = "about" | "loveLanguages" | "favorites";

export default function ProfileScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const safeInsets = useSafeAreaInsets();
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
  const [activeEditorSection, setActiveEditorSection] =
    useState<EditorSection>("about");
  const [displayNameInput, setDisplayNameInput] = useState(
    profile?.displayName ?? auth.user.displayName ?? ""
  );
  const [editStatus, setEditStatus] = useState(
    profile?.status ?? DEFAULT_STATUS
  );
  const [editAbout, setEditAbout] = useState(profile?.about ?? DEFAULT_ABOUT);
  const [selectedLoveLanguages, setSelectedLoveLanguages] = useState<
    LoveLanguageOption[]
  >(() => resolveLoveLanguages(profile?.loveLanguages));
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
    auth.user.anniversaryDate ? formatDateToYMD(auth.user.anniversaryDate) : ""
  );
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    profile?.avatarUrl ?? auth.user.avatarUrl ?? undefined
  );
  const [avatarUploadUri, setAvatarUploadUri] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [favoriteEntries, setFavoriteEntries] = useState<ProfileFavorite[]>(
    normalizeFavoriteEntries(profile?.favorites)
  );

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
    setFavoriteEntries(normalizeFavoriteEntries(profile.favorites));
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
  const profileBirthdayValue = useMemo(() => {
    if (profile?.birthday) {
      return profile.birthday;
    }
    if (viewingMe && auth.user.birthday) {
      return auth.user.birthday;
    }
    return undefined;
  }, [profile?.birthday, viewingMe, auth.user.birthday]);
  const profileAnniversaryValue = useMemo(() => {
    if (viewingMe) {
      return auth.user.anniversaryDate ?? profile?.anniversary;
    }
    return profile?.anniversary;
  }, [viewingMe, auth.user.anniversaryDate, profile?.anniversary]);
  const formattedAnniversary = useMemo(
    () => formatAnniversaryLabel(profileAnniversaryValue),
    [profileAnniversaryValue]
  );
  const togetherSinceLabel = useMemo(() => {
    if (!profileAnniversaryValue) {
      return null;
    }
    const year = parseLocalDate(profileAnniversaryValue).getFullYear();
    return `Together since ${year}`;
  }, [profileAnniversaryValue]);
  const profileFirstName = useMemo(() => {
    if (!profile?.displayName) {
      return "Partner";
    }
    return profile.displayName.split(" ")[0];
  }, [profile?.displayName]);
  const hasPartnerProfile = Boolean(profiles.partner);
  const activeTab: "me" | "partner" = viewingMe ? "me" : "partner";

  const toggleLoveLanguage = (option: LoveLanguageOption) => {
    setSelectedLoveLanguages((prev) => {
      const exists = prev.some((entry) => entry.key === option.key);
      if (exists) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((entry) => entry.key !== option.key);
      }
      return [...prev, option];
    });
  };

  const requestLibraryAccess = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      const loveLanguageKeys = selectedLoveLanguages.map(
        (option) => option.key
      );
      const sanitizedFavorites = favoriteEntries
        .map((entry) => ({
          category: (entry.category ?? DEFAULT_FAVORITE_CATEGORY).trim() || DEFAULT_FAVORITE_CATEGORY,
          label: entry.label.trim(),
          value: entry.value.trim(),
        }))
        .filter((entry) => entry.label.length && entry.value.length);
      const normalizedBirthday = birthdayInput
        ? formatDateToYMD(birthdayInput)
        : null;
      const normalizedAnniversary = anniversaryInput
        ? formatDateToYMD(anniversaryInput)
        : "";
      const previousAnniversary = auth.user.anniversaryDate
        ? formatDateToYMD(auth.user.anniversaryDate)
        : "";
      const anniversaryChanged = normalizedAnniversary !== previousAnniversary;

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
        favorites: sanitizedFavorites,
      });

      if (auth.user.coupleId) {
        await profileService.createProfile(auth.user.coupleId, profile.uid, {
          displayName: trimmedName,
          status: trimmedStatus || DEFAULT_STATUS,
          about: trimmedAbout,
          accentColor: selectedAccent,
          birthday: normalizedBirthday,
          anniversary: normalizedAnniversary || null,
          avatarUrl: nextAvatarUrl ?? null,
          loveLanguages: loveLanguageKeys,
          favorites: sanitizedFavorites,
        });
      }

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
            anniversary: normalizedAnniversary || undefined,
            avatarUrl: nextAvatarUrl,
            loveLanguages: loveLanguageKeys,
            favorites: sanitizedFavorites,
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

  const openEditModal = (section: EditorSection = "about") => {
    resetEditorFromProfile();
    setActiveEditorSection(section);
    setEditModalVisible(true);
  };

  const closeModal = () => {
    resetEditorFromProfile();
    setActiveEditorSection("about");
    setEditModalVisible(false);
  };
  const handleSwitchProfile = useCallback(
    (target: "me" | "partner") => {
      if (target === activeTab) {
        return;
      }
      if (target === "partner" && !hasPartnerProfile) {
        return;
      }
      router.replace({
        pathname: "/profile",
        params: { who: target },
      });
    },
    [activeTab, hasPartnerProfile]
  );

  const editorTabOrder: EditorSection[] = ["about", "loveLanguages", "favorites"];
  const activeEditorMeta =
    EDITOR_TAB_META[activeEditorSection] ?? EDITOR_TAB_META.about;

  useEffect(() => {
    if (!EDITOR_TAB_META[activeEditorSection]) {
      setActiveEditorSection("about");
    }
  }, [activeEditorSection]);

  const updateFavoriteEntry = useCallback(
    (index: number, field: "label" | "value", value: string) => {
      setFavoriteEntries((prev) =>
        prev.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, [field]: value } : entry
        )
      );
      setSaveError(null);
    },
    []
  );

  const addFavoriteEntry = useCallback(() => {
    setFavoriteEntries((prev) => [
      ...prev,
      { label: "", value: "", category: DEFAULT_FAVORITE_CATEGORY },
    ]);
  }, []);

  const removeFavoriteEntry = useCallback((index: number) => {
    setFavoriteEntries((prev) =>
      prev.filter((_, entryIndex) => entryIndex !== index)
    );
  }, []);

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

  const infoRows = [
    {
      key: "birthday",
      icon: "cake" as const,
      label: "Birthday",
      value: profileBirthdayValue
        ? formatBirthdayLabel(profileBirthdayValue)
        : viewingMe
          ? "Add your birthday so we can plan sweet surprises."
          : "Not shared yet.",
    },
    {
      key: "anniversary",
      icon: "favorite" as const,
      label: "Anniversary",
      value: formattedAnniversary
        ? formattedAnniversary
        : viewingMe
          ? "Add your anniversary so we can count your days together."
          : "No anniversary is set yet.",
    },
  ];

  const favoritesList = profile.favorites ?? [];

  const renderEditButton = (section: EditorSection) => {
    if (!viewingMe) {
      return null;
    }
    return (
      <Pressable
        onPress={() => openEditModal(section)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: palette.primary,
          shadowColor: "#00000020",
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <MaterialIcons name="edit" size={16} color="#ffffff" />
        <CuteText weight="semibold" style={{ fontSize: 13, color: "#ffffff" }}>
          Edit
        </CuteText>
      </Pressable>
    );
  };

  const renderEditorSectionContent = () => {
    if (activeEditorSection === "about") {
      return (
        <View style={{ gap: 18 }}>
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
          </View>

          <View style={{ gap: 12 }}>
            <CuteText weight="semibold">Anniversary</CuteText>
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
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "Select a date"}
              </CuteText>
            </Pressable>
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
        </View>
      );
    }

    if (activeEditorSection === "loveLanguages") {
      return (
        <View style={{ gap: 12 }}>
          <CuteText weight="semibold">Love languages</CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Choose every love language that resonates with how you give or
            receive affection.
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
                      borderColor: isSelected ? palette.primary : palette.border,
                      borderRadius: 20,
                      padding: 16,
                      backgroundColor: isSelected
                        ? palette.primarySoft
                        : palette.background,
                      flexDirection: "row",
                      gap: 14,
                      alignItems: "center",
                      shadowColor: isSelected ? palette.primary : "transparent",
                      shadowOpacity: isSelected ? 0.12 : 0,
                      shadowRadius: isSelected ? 8 : 0,
                      shadowOffset: { width: 0, height: isSelected ? 4 : 0 },
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? palette.primary
                          : palette.primarySoft,
                      }}
                    >
                      <CuteText
                        weight="bold"
                        style={{
                          fontSize: 18,
                          color: isSelected ? "#ffffff" : palette.text,
                        }}
                      >
                        {option.emoji}
                      </CuteText>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <CuteText
                        weight="semibold"
                        style={{
                          color: palette.text,
                        }}
                      >
                        {option.label}
                      </CuteText>
                      <CuteText
                        tone="muted"
                        style={{ fontSize: 12, lineHeight: 16 }}
                      >
                        {option.description}
                      </CuteText>
                    </View>
                    <MaterialIcons
                      name={isSelected ? "check-circle" : "radio-button-unchecked"}
                      size={22}
                      color={isSelected ? palette.primary : palette.border}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      );
    }

    return (
      <View style={{ gap: 16 }}>
        <CuteText weight="semibold">Favorites & preferences</CuteText>
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          Save go-to treats, drinks, shows, or anything your partner should know.
        </CuteText>
        {favoriteEntries.length ? (
          favoriteEntries.map((favorite, index) => (
            <View
              key={`favorite-entry-${index}`}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 18,
                padding: 16,
                gap: 12,
              }}
            >
              <CuteTextInput
                label="Label"
                placeholder="e.g. Favorite food"
                value={favorite.label}
                onChangeText={(text) =>
                  updateFavoriteEntry(index, "label", text)
                }
              />
              <CuteTextInput
                label="Value"
                placeholder="e.g. Sushi"
                value={favorite.value}
                onChangeText={(text) =>
                  updateFavoriteEntry(index, "value", text)
                }
              />
              <Pressable
                onPress={() => removeFavoriteEntry(index)}
                style={{
                  alignSelf: "flex-end",
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <CuteText tone="accent" weight="semibold">
                  Remove
                </CuteText>
              </Pressable>
            </View>
          ))
        ) : (
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Add your first favorite to make thoughtful surprises easy.
          </CuteText>
        )}
        <Pressable
          onPress={addFavoriteEntry}
          style={{
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: palette.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CuteText tone="accent" weight="semibold">
            Add favorite
          </CuteText>
        </Pressable>
      </View>
    );
  };

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
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: palette.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#00000025",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color={palette.text} />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Profile
        </CuteText>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ alignItems: "center", gap: 12, paddingTop: 4 }}>
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
              onPress={() => openEditModal()}
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
        <View style={{ alignItems: "center", gap: 6 }}>
          <CuteText weight="bold" style={{ fontSize: 24 }}>
            {profile.displayName}
          </CuteText>
          {togetherSinceLabel ? (
            <CuteText tone="muted" style={{ fontSize: 14 }}>
              {togetherSinceLabel}
            </CuteText>
          ) : null}
          {profile.status ? (
            <Chip
              label={profile.status}
              tone="primary"
              backgroundColor={profile.accentColor ?? palette.primary}
              textColor="#ffffff"
            />
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          width: "100%",
          backgroundColor: palette.card,
          padding: 4,
          borderRadius: 999,
          gap: 4,
          borderWidth: 1,
          borderColor: palette.border,
          shadowColor: "#00000010",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {[
          { label: "My Profile", value: "me" as const, disabled: false },
          {
            label: "Partner's Profile",
            value: "partner" as const,
            disabled: !hasPartnerProfile,
          },
        ].map((option) => {
          const isActive = activeTab === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => handleSwitchProfile(option.value)}
              disabled={option.disabled}
              style={{
                flex: 1,
                borderRadius: 999,
                paddingVertical: 10,
                paddingHorizontal: 12,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 40,
                backgroundColor: isActive ? palette.background : "transparent",
                shadowColor: "#00000020",
                shadowOpacity: isActive ? 0.15 : 0,
                shadowRadius: isActive ? 8 : 0,
                shadowOffset: { width: 0, height: isActive ? 4 : 0 },
                elevation: isActive ? 2 : 0,
                opacity: option.disabled ? 0.5 : 1,
              }}
            >
                <CuteText
                  weight={isActive ? "bold" : "medium"}
                  style={{ fontSize: 13 }}
                  tone={isActive ? "default" : "muted"}
                  numberOfLines={1}
                >
                  {option.label}
                </CuteText>
              </Pressable>
            );
        })}
      </View>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              {viewingMe ? "About Me" : `About ${profileFirstName}`}
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              A little snapshot about what makes this heart unique.
            </CuteText>
          </View>
          {renderEditButton("about")}
        </View>
        <CuteText tone="muted" style={{ lineHeight: 20 }}>
          {profile.about ?? DEFAULT_ABOUT}
        </CuteText>
        <View
          style={{
            borderTopWidth: 1,
            borderColor: palette.border,
            paddingTop: 14,
            gap: 14,
          }}
        >
          {infoRows.map((row) => (
            <View
              key={row.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: palette.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name={row.icon} size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <CuteText weight="semibold">{row.label}</CuteText>
                <CuteText tone="muted" style={{ fontSize: 13 }}>
                  {row.value}
                </CuteText>
              </View>
            </View>
          ))}
        </View>
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              {viewingMe
                ? "My Love Languages"
                : `${profileFirstName}'s Love Languages`}
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              My favorite ways of giving and receiving love.
            </CuteText>
          </View>
          {renderEditButton("loveLanguages")}
        </View>
        {loveLanguageDisplay.length ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {loveLanguageDisplay.map((language) => (
              <Chip key={language.key} label={language.label} tone="primary" />
            ))}
          </View>
        ) : (
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Tap edit to choose up to three love languages that feel true to you.
          </CuteText>
        )}
      </CuteCard>

      <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              Favorites & Preferences
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Quick cues for go-to treats, drinks, and cozy plans.
            </CuteText>
          </View>
          {renderEditButton("favorites")}
        </View>
        {favoritesList.length ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {favoritesList.map((favorite, index) => (
              <View
                key={`favorite-display-${index}`}
                style={{
                  flexBasis: "48%",
                  minWidth: "48%",
                  flexGrow: 1,
                  borderRadius: 16,
                  padding: 14,
                  backgroundColor: palette.backgroundMuted,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <CuteText
                  tone="muted"
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {favorite.label}
                </CuteText>
                <CuteText weight="semibold" style={{ marginTop: 4 }}>
                  {favorite.value}
                </CuteText>
              </View>
            ))}
          </View>
        ) : (
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            {viewingMe
              ? "Add your go-to favorites so your partner always knows what delights you."
              : `${profileFirstName} hasn't shared their favorites yet.`}
          </CuteText>
        )}
      </CuteCard>

      <Modal
        visible={editModalVisible && viewingMe}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <SafeAreaProvider>
          <SafeAreaView
            edges={["top", "bottom"]}
            style={{
              flex: 1,
              backgroundColor: palette.background,
            }}
          >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: palette.border,
            }}
          >
            <Pressable
              onPress={closeModal}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.card,
                shadowColor: "#00000020",
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <MaterialIcons
                name="arrow-back"
                size={20}
                color={palette.textSecondary}
              />
            </Pressable>
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              {activeEditorMeta.title}
            </CuteText>
            <Pressable
              onPress={handleSaveProfile}
              disabled={savingProfile}
              style={{ paddingHorizontal: 8, paddingVertical: 6 }}
            >
              <CuteText
                tone="accent"
                weight="semibold"
                style={{ opacity: savingProfile ? 0.5 : 1 }}
              >
                {savingProfile ? "Saving..." : "Done"}
              </CuteText>
            </Pressable>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={safeInsets.bottom + 24}
            style={{ flex: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                gap: 18,
                paddingBottom: safeInsets.bottom + 120,
                paddingHorizontal: 20,
                flexGrow: 1,
              }}
              style={{ flex: 1 }}
            >
              <View style={{ alignItems: "center", gap: 12, marginTop: 12 }}>
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

              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: palette.backgroundMuted,
                  borderRadius: 999,
                  padding: 4,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                {editorTabOrder.map((tab) => {
                  const isActive = activeEditorSection === tab;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => setActiveEditorSection(tab)}
                      style={{
                        flex: 1,
                        borderRadius: 999,
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 40,
                        backgroundColor: isActive ? palette.card : "transparent",
                        shadowColor: "#00000015",
                        shadowOpacity: isActive ? 0.12 : 0,
                        shadowRadius: isActive ? 8 : 0,
                        shadowOffset: { width: 0, height: isActive ? 4 : 0 },
                        elevation: isActive ? 2 : 0,
                      }}
                      >
                        <CuteText
                          weight={isActive ? "bold" : "medium"}
                          style={{ fontSize: 13 }}
                          tone={isActive ? "default" : "muted"}
                          numberOfLines={1}
                        >
                          {EDITOR_TAB_META[tab].label}
                        </CuteText>
                      </Pressable>
                    );
                })}
              </View>

              {renderEditorSectionContent()}

              {saveError ? (
                <CuteText
                  weight="semibold"
                  style={{ fontSize: 13, color: "#D93025" }}
                >
                  {saveError}
                </CuteText>
              ) : null}
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
            </ScrollView>
          </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>

      <CuteModal
        visible={showBirthdayPicker}
        onRequestClose={() => setShowBirthdayPicker(false)}
        title="Pick a birthday"
        contentStyle={{ alignItems: "center", gap: 16 }}
      >
        <AppDatePicker
          value={selectedBirthdayDate}
          mode="date"
          onChange={handleBirthdayChange}
          maximumDate={new Date()}
        />
        <CuteButton
          label="Done"
          tone="secondary"
          onPress={() => setShowBirthdayPicker(false)}
          style={{ minWidth: 140 }}
        />
      </CuteModal>

      <CuteModal
        visible={showAnniversaryPicker}
        onRequestClose={() => setShowAnniversaryPicker(false)}
        title="Pick your anniversary"
        contentStyle={{ alignItems: "center", gap: 16 }}
      >
        <AppDatePicker
          value={selectedAnniversaryDate}
          mode="date"
          onChange={handleAnniversaryChange}
          maximumDate={new Date()}
        />
        <CuteButton
          label="Save"
          tone="secondary"
          onPress={() => setShowAnniversaryPicker(false)}
          style={{ minWidth: 140 }}
        />
      </CuteModal>
    </Screen>
  );
}
