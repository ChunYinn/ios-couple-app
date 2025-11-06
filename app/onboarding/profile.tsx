import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { updateProfile } from "firebase/auth";

import { CuteButton } from "../../components/CuteButton";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { CuteTextInput } from "../../components/CuteTextInput";
import { PronounSelect } from "../../components/PronounSelect";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { DEFAULT_LOVE_LANGUAGES } from "../../data/loveLanguages";
import { usePalette } from "../../hooks/usePalette";
import { firebaseAuth } from "../../firebase/config";
import { userService } from "../../firebase/services";
import { PronounValue } from "../../types/app";
import {
  calculateDaysTogether,
  formatDateToYMD,
  parseLocalDate,
} from "../../utils/dateUtils";

const DEFAULT_STATUS = "";
const DEFAULT_ABOUT = "Curious heart who loves to make memories that feel like magic.";

const formatBirthdayLabel = (value: string | null) => {
  if (!value) return "Pick your birthday";
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function ProfileSetupScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const { state, dispatch } = useAppData();

  const existingProfile = state.profiles.me;
  const authUser = state.auth.user;

  const initialDisplayName =
    existingProfile?.displayName ?? authUser.displayName ?? "";
  const initialPronouns =
    (authUser.pronouns as PronounValue | undefined) ?? null;
  const initialBirthday = authUser.birthday
    ? formatDateToYMD(authUser.birthday)
    : "";
  const initialAnniversary = authUser.anniversaryDate
    ? formatDateToYMD(authUser.anniversaryDate)
    : "";
  const initialAvatar =
    existingProfile?.avatarUrl ?? authUser.avatarUrl ?? undefined;

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [pronouns, setPronouns] = useState<PronounValue | null>(initialPronouns);
  const [birthday, setBirthday] = useState(initialBirthday);
  const [anniversary, setAnniversary] = useState(initialAnniversary);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [showAnniversaryPicker, setShowAnniversaryPicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    initialAvatar
  );
  const [avatarUploadUri, setAvatarUploadUri] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBirthdayDate = useMemo(
    () => (birthday ? parseLocalDate(birthday) : new Date()),
    [birthday]
  );

  const selectedAnniversaryDate = useMemo(
    () => (anniversary ? parseLocalDate(anniversary) : new Date()),
    [anniversary]
  );


  const requestLibraryAccess = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo access so we can add your profile picture."
      );
      return false;
    }
    return true;
  };

  const requestCameraAccess = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow camera access to snap a quick picture."
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
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
    }
  };

  const handleTakePhoto = async () => {
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
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(undefined);
    setAvatarUploadUri(null);
    setRemoveAvatar(Boolean(initialAvatar));
  };

  const showImageOptions = () => {
    const actions: {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }[] = [
      { text: "Take photo", onPress: handleTakePhoto },
      { text: "Choose from library", onPress: handlePickImage },
    ];

    if (avatarPreview) {
      actions.push({
        text: "Remove photo",
        style: "destructive",
        onPress: handleRemoveAvatar,
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Profile picture", "How would you like to add your photo?", actions, {
      cancelable: true,
    });
  };

  const handleBirthdayPickerChange = (
    event: DateTimePickerEvent,
    date?: Date
  ) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowBirthdayPicker(false);
        return;
      }
      setShowBirthdayPicker(false);
    }
    if (date) {
      const formatted = formatDateToYMD(date.toISOString());
      setBirthday(formatted);
      setError(null);
    }
  };

  const handleAnniversaryPickerChange = (
    event: DateTimePickerEvent,
    date?: Date
  ) => {
    if (Platform.OS === "android") {
      if (event.type === "dismissed") {
        setShowAnniversaryPicker(false);
        return;
      }
      setShowAnniversaryPicker(false);
    }
    if (date) {
      const formatted = formatDateToYMD(date.toISOString());
      setAnniversary(formatted);
    }
  };

  const handleContinue = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName.length) {
      setError("Let us know what to call you before we continue.");
      return;
    }

    if (!birthday.trim()) {
      setError("Please choose your birthday before continuing.");
      return;
    }

    const uid = authUser.uid;
    if (!uid) {
      setError("We couldn't find your account. Please restart the app.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let nextAvatarUrl: string | undefined = initialAvatar;

      if (avatarUploadUri) {
        nextAvatarUrl = await userService.uploadAvatar(
          uid,
          avatarUploadUri,
          initialAvatar ?? null
        );
      } else if (removeAvatar && initialAvatar) {
        await userService.deleteAvatarFile(initialAvatar);
        nextAvatarUrl = undefined;
      }

      const birthdayValue = birthday ? formatDateToYMD(birthday) : null;
      const anniversaryValue = anniversary ? formatDateToYMD(anniversary) : null;

      await userService.createUser(uid, {
        displayName: trimmedName,
        avatarUrl: nextAvatarUrl ?? null,
        birthday: birthdayValue,
        anniversaryDate: anniversaryValue,
        pronouns: pronouns ?? null,
        authProvider: "anonymous",
        email: "",
        coupleId: authUser.coupleId ?? null,
        status: DEFAULT_STATUS,
        about: DEFAULT_ABOUT,
        loveLanguages: existingProfile?.loveLanguages ?? DEFAULT_LOVE_LANGUAGES,
        accentColor: state.settings.accent,
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
        type: "SAVE_PROFILE",
        payload: {
          displayName: trimmedName,
          avatarUrl: nextAvatarUrl,
          birthday: birthdayValue ?? undefined,
          anniversary: anniversaryValue ?? undefined,
          pronouns: pronouns ?? undefined,
          status: existingProfile?.status ?? DEFAULT_STATUS,
          about: existingProfile?.about ?? DEFAULT_ABOUT,
          loveLanguages: existingProfile?.loveLanguages ?? DEFAULT_LOVE_LANGUAGES,
          accentColor: state.settings.accent,
        },
      });

      if (anniversaryValue) {
        dispatch({
          type: "SET_ANNIVERSARY",
          payload: {
            anniversaryDate: anniversaryValue,
            daysTogether: calculateDaysTogether(anniversaryValue),
          },
        });
      } else if (state.dashboard.anniversaryDate) {
        dispatch({
          type: "SET_ANNIVERSARY",
          payload: { anniversaryDate: "", daysTogether: 0 },
        });
      }
    } catch (err) {
      console.error("Profile setup failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't save your profile right now. Please check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const ctaDisabled = loading || !displayName.trim().length || !birthday.trim().length;

  return (
    <Screen scrollable>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 32,
          gap: 32,
        }}
      >
        <LinearGradient
          colors={[palette.primarySoft + "35", "transparent"]}
          style={{
            marginHorizontal: -24,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 12,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <View style={{ gap: 12, alignItems: "center" }}>
            <CuteText weight="bold" style={{ fontSize: 30, textAlign: "center" }}>
              Create your profile 💖
            </CuteText>
            <CuteText tone="muted" style={{ textAlign: "center", fontSize: 16 }}>
              Add a few details so everything feels personal the next time you open the app.
            </CuteText>
          </View>
        </LinearGradient>

        <View style={{ alignItems: "center", gap: 16 }}>
          <Pressable
            onPress={showImageOptions}
            style={{
              width: 148,
              height: 148,
              borderRadius: 74,
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
              elevation: 8,
            }}
          >
            {avatarPreview ? (
              <Image
                source={{ uri: avatarPreview }}
                style={{ width: 148, height: 148 }}
              />
            ) : (
              <MaterialIcons name="photo-camera" size={46} color={palette.primary} />
            )}
          </Pressable>
          <View style={{ gap: 4, alignItems: "center" }}>
            <CuteText weight="semibold">
              {avatarPreview ? "Update your photo" : "Add a profile photo (optional)"}
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13, textAlign: "center" }}>
              Adding a photo is optional—you can always do it later.
            </CuteText>
            {avatarPreview ? (
              <Pressable onPress={handleRemoveAvatar} style={{ padding: 6 }}>
                <CuteText tone="accent" style={{ fontSize: 13 }}>
                  Remove photo
                </CuteText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: 24,
            padding: 20,
            gap: 20,
            borderWidth: 1,
            borderColor: palette.border,
            shadowColor: scheme === "dark" ? "#000000" : "#00000010",
            shadowOpacity: scheme === "dark" ? 0.35 : 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <CuteText weight="bold">Display name</CuteText>
              <CuteText tone="accent">*</CuteText>
            </View>
            <CuteTextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="What should we call you?"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <View style={{ gap: 12 }}>
            <PronounSelect value={pronouns} onChange={setPronouns} />
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <CuteText weight="bold">Birthday</CuteText>
              <CuteText tone="accent">*</CuteText>
            </View>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              We use this to celebrate you with countdowns and reminders.
            </CuteText>
            <Pressable
              onPress={() => setShowBirthdayPicker(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: palette.card,
              }}
            >
              <MaterialIcons
                name="cake"
                size={18}
                color={palette.primary}
              />
              <CuteText style={{ flex: 1 }}>
                {birthday ? formatBirthdayLabel(birthday) : "Pick your birthday"}
              </CuteText>
            </Pressable>
          </View>

          <View style={{ gap: 12 }}>
            <CuteText weight="bold">Anniversary (optional)</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Choosing this now lets us start counting your days together.
            </CuteText>
            <Pressable
              onPress={() => setShowAnniversaryPicker(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: palette.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: palette.card,
              }}
            >
              <MaterialIcons
                name="favorite"
                size={18}
                color={palette.primary}
              />
              <CuteText style={{ flex: 1 }}>
                {anniversary
                  ? formatBirthdayLabel(anniversary)
                  : "Set your Day 0"}
              </CuteText>
              {anniversary ? (
                <Pressable
                  onPress={(event: GestureResponderEvent) => {
                    event.stopPropagation();
                    setAnniversary("");
                  }}
                  hitSlop={8}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={palette.textSecondary}
                  />
                </Pressable>
              ) : null}
            </Pressable>
          </View>
        </View>

      {error ? (
          <View
            style={{
              backgroundColor: palette.primarySoft,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: palette.primary + "40",
            }}
          >
            <CuteText tone="accent" style={{ textAlign: "center", fontSize: 13 }}>
              {error}
            </CuteText>
          </View>
        ) : null}

        <CuteButton
          label={loading ? "Saving..." : "Start now"}
          onPress={handleContinue}
          disabled={ctaDisabled}
          icon={
            loading ? <ActivityIndicator size="small" color="#fff" /> : undefined
          }
        />
      </ScrollView>

      <CuteModal
        visible={showBirthdayPicker}
        onRequestClose={() => setShowBirthdayPicker(false)}
        title="Select your birthday"
        subtitle="We keep this local to remind you of sweet moments."
      >
        <DateTimePicker
          value={selectedBirthdayDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleBirthdayPickerChange}
          maximumDate={new Date()}
        />
        <CuteButton
          label="Done"
          onPress={() => setShowBirthdayPicker(false)}
          tone="secondary"
        />
      </CuteModal>

      <CuteModal
        visible={showAnniversaryPicker}
        onRequestClose={() => setShowAnniversaryPicker(false)}
        title="Set your anniversary"
        subtitle="This helps us track your days together."
      >
        <DateTimePicker
          value={selectedAnniversaryDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleAnniversaryPickerChange}
          maximumDate={new Date()}
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <CuteButton
            label="Save"
            onPress={() => setShowAnniversaryPicker(false)}
            style={{ flex: 1 }}
          />
          <CuteButton
            label="Clear"
            tone="ghost"
            onPress={() => {
              setAnniversary("");
              setShowAnniversaryPicker(false);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </CuteModal>
    </Screen>
  );
}
