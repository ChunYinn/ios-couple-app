import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { updateProfile } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    AppDatePicker,
    DateTimePickerEvent,
} from "../../components/AppDatePicker";
import { CuteButton } from "../../components/CuteButton";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { useAppData } from "../../context/AppDataContext";
import { useSignupDraft } from "../../context/SignupContext";
import { DEFAULT_LOVE_LANGUAGES } from "../../data/loveLanguages";
import { firebaseAuth } from "../../firebase/config";
import { userService } from "../../firebase/services";
import { authService } from "../../services/authService";
import { formatDateToYMD, parseLocalDate } from "../../utils/dateUtils";

const DEFAULT_STATUS = "";
const DEFAULT_ABOUT =
  "Curious heart who loves to make memories that feel like magic.";

const design = {
  primary: "#F8B4D9",
  primaryContent: "#4A223B",
  secondary: "#A6E3E9",
  background: "#FDF7FA",
  surface: "#FFFFFF",
  textMain: "#5C4B56",
  textSubtle: "#A18F9A",
  border: "rgba(248, 180, 217, 0.4)",
  error: "#FDBAB1",
  errorText: "#582C25",
};

const formatBirthdayLabel = (value: string | null) => {
  if (!value) return "Select your birthday";
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function SignupProfileScreen() {
  const { draft, resetDraft } = useSignupDraft();
  const { state, dispatch } = useAppData();

  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined
  );
  const [avatarUploadUri, setAvatarUploadUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBirthdayDate = useMemo(
    () => (birthday ? parseLocalDate(birthday) : new Date()),
    [birthday]
  );

  useEffect(() => {
    if (!draft.email || !draft.password) {
      router.replace("/auth/signup");
    }
  }, [draft.email, draft.password]);

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
    }
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

  const handleSubmit = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName.length) {
      setError("Display name is required.");
      return;
    }
    if (!birthday.trim()) {
      setError("Please choose your birthday before continuing.");
      return;
    }

    if (!draft.email || !draft.password) {
      setError("Please start from the signup step again.");
      router.replace("/auth/signup");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Attempt to create the user now
      if (!firebaseAuth.currentUser) {
        await authService.signUpWithEmail(draft.email, draft.password);
      }
      
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        throw new Error("We couldn't create your account. Please try again.");
      }

      let nextAvatarUrl: string | undefined = undefined;
      if (avatarUploadUri) {
        nextAvatarUrl = await userService.uploadAvatar(
          currentUser.uid,
          avatarUploadUri,
          null
        );
      }

      const birthdayValue = birthday ? formatDateToYMD(birthday) : null;

      await userService.createUser(currentUser.uid, {
        displayName: trimmedName,
        avatarUrl: nextAvatarUrl ?? null,
        birthday: birthdayValue,
        authProvider: "password",
        email: currentUser.email ?? draft.email,
        coupleId: null,
        status: DEFAULT_STATUS,
        about: DEFAULT_ABOUT,
        loveLanguages: DEFAULT_LOVE_LANGUAGES,
        accentColor: state.settings.accent,
      });

      try {
        await updateProfile(currentUser, {
          displayName: trimmedName,
          photoURL: nextAvatarUrl ?? null,
        });
      } catch (profileError) {
        console.warn("Failed to update Firebase profile", profileError);
      }

      dispatch({
        type: "SAVE_PROFILE",
        payload: {
          displayName: trimmedName,
          avatarUrl: nextAvatarUrl,
          birthday: birthdayValue ?? undefined,
          status: DEFAULT_STATUS,
          about: DEFAULT_ABOUT,
          loveLanguages: DEFAULT_LOVE_LANGUAGES,
          accentColor: state.settings.accent,
        },
      });

      resetDraft();
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Profile setup failed:", err);
      if (err.code === "auth/email-already-in-use") {
        // Redirect back to signup with error
        router.replace("/auth/signup?error=taken");
        return;
      }
      
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't save your profile right now. Please check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const ctaDisabled =
    loading || !displayName.trim().length || !birthday.trim().length;

  return (
    <LinearGradient
      colors={[
        design.primary + "33",
        design.background,
        design.secondary + "22",
      ]}
      style={{ flex: 1 }}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaView
        style={{ flex: 1 }}
        edges={["top", "right", "bottom", "left"]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 28,
            gap: 20,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 8, alignItems: "center" }}>
            <CuteText
              weight="bold"
              style={{ fontSize: 30, color: design.textMain }}
            >
              Create your profile
            </CuteText>
          </View>

          <View style={{ alignItems: "center", gap: 12 }}>
            <View style={{ position: "relative" }}>
              <Pressable
                onPress={handlePickImage}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: design.primary + "80",
                  backgroundColor: design.background,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  shadowColor: design.primary,
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                }}
              >
                {avatarPreview ? (
                  <Image
                    source={{ uri: avatarPreview }}
                    style={{ width: 140, height: 140 }}
                  />
                ) : (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <MaterialIcons
                      name="add-a-photo"
                      size={34}
                      color={design.textSubtle}
                    />
                    <CuteText tone="muted" style={{ fontSize: 13 }}>
                      Tap to upload
                    </CuteText>
                  </View>
                )}
              </Pressable>
              {avatarPreview ? (
                <Pressable
                  onPress={() => {
                    setAvatarPreview(undefined);
                    setAvatarUploadUri(null);
                  }}
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: design.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.12,
                    shadowRadius: 6,
                  }}
                >
                  <MaterialIcons
                    name="close"
                    size={18}
                    color={design.errorText}
                  />
                </Pressable>
              ) : null}
            </View>
            <CuteText
              tone="muted"
              style={{ fontSize: 12, textAlign: "center" }}
            >
              Tap the circle to upload a profile photo.
            </CuteText>
          </View>

          <View
            style={{
              backgroundColor: design.surface,
              borderRadius: 20,
              padding: 16,
              gap: 14,
              borderWidth: 1,
              borderColor: design.border,
              shadowColor: "#000000",
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <View style={{ gap: 8 }}>
              <CuteText weight="semibold" style={{ color: design.textMain }}>
                Display Name
              </CuteText>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 16,
                  backgroundColor: design.surface,
                  borderWidth: 1,
                  borderColor: design.border,
                  paddingHorizontal: 12,
                }}
              >
                <MaterialIcons
                  name="sentiment-satisfied"
                  size={20}
                  color={design.textSubtle}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g., Your Sweetheart"
                  placeholderTextColor={design.textSubtle}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 0,
                    color: design.textMain,
                    fontSize: 16,
                  }}
                  autoCapitalize="words"
                  textContentType="name"
                  returnKeyType="done"
                />
              </View>
              {!displayName.trim().length && error ? (
                <CuteText style={{ fontSize: 12, color: design.errorText }}>
                  Display Name is required.
                </CuteText>
              ) : null}
            </View>

            <View style={{ gap: 8 }}>
              <CuteText weight="semibold" style={{ color: design.textMain }}>
                Birthday
              </CuteText>
              <Pressable
                onPress={() => setShowBirthdayPicker(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: design.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  backgroundColor: design.surface,
                }}
              >
                <MaterialIcons
                  name="cake"
                  size={20}
                  color={design.textSubtle}
                />
                <CuteText style={{ flex: 1, color: design.textMain }}>
                  {birthday
                    ? formatBirthdayLabel(birthday)
                    : "Select your birthday"}
                </CuteText>
                <MaterialIcons
                  name="arrow-drop-down"
                  size={22}
                  color={design.textSubtle}
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: design.primary + "33",
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: design.primary + "55",
              }}
            >
              <CuteText
                tone="accent"
                style={{ textAlign: "center", fontSize: 13 }}
              >
                {error}
              </CuteText>
            </View>
          ) : null}

          <CuteButton
            label={loading ? "Creating your space..." : "Start now"}
            onPress={handleSubmit}
            disabled={ctaDisabled}
            icon={
              loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              )
            }
            style={{ borderRadius: 16, paddingVertical: 14 }}
          />
        </ScrollView>

        <CuteModal
          visible={showBirthdayPicker}
          onRequestClose={() => setShowBirthdayPicker(false)}
          title="Pick a birthday"
          contentStyle={{ alignItems: "center", gap: 16 }}
        >
          <AppDatePicker
            value={selectedBirthdayDate}
            mode="date"
            onChange={handleBirthdayPickerChange}
            maximumDate={new Date()}
          />
          <CuteButton
            label="Done"
            onPress={() => setShowBirthdayPicker(false)}
            style={{ minWidth: 140 }}
          />
        </CuteModal>
      </SafeAreaView>
    </LinearGradient>
  );
}
