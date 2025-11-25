import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from "react-native";

import { CuteButton } from "../../components/CuteButton";
import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { useSignupDraft } from "../../context/SignupContext";
import { firebaseAuth } from "../../firebase/config";

const design = {
  primary: "#F8B4D9",
  primaryContent: "#4A223B",
  secondary: "#A6E3E9",
  accent: "#F5C396",
  background: "#FDF7FA",
  surface: "#FFFFFF",
  textMain: "#5C4B56",
  textSubtle: "#A18F9A",
  border: "rgba(248, 180, 217, 0.4)",
};

export default function SignupScreen() {
  const router = useRouter();
  const { setDraft } = useSignupDraft();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [submitted, setSubmitted] = useState(false);

  const bounceAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const takenMessage =
    "That email is already registered. Try signing in instead.";

  useEffect(() => {
    Animated.parallel([
      Animated.spring(bounceAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 20,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim, fadeAnim]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmail = emailRegex.test(email.trim());
  const passwordsMatch = password.trim() === confirm.trim();
  const strongPassword = password.trim().length >= 6;

  const signupDisabled = loading;

  const resetValidationState = () => {
    setError(null);
    setSubmitted(false);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    resetValidationState();
    setEmailStatus("idle");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    resetValidationState();
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    resetValidationState();
  };

  const handleContinue = async () => {
    setSubmitted(true);
    const trimmedEmail = email.trim().toLowerCase();
    if (!validEmail) {
      setError("Add a valid email.");
      return;
    }
    if (!strongPassword) {
      setError("Use at least 6 characters.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords need to match.");
      return;
    }
    if (emailStatus === "taken") {
      setError(takenMessage);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const methods = await fetchSignInMethodsForEmail(
        firebaseAuth,
        trimmedEmail
      );
      const isTaken = methods.length > 0;
      if (isTaken) {
        setEmailStatus("taken");
        setError(takenMessage);
        setLoading(false);
        return;
      }
      setEmailStatus("available");
      setDraft({
        email: trimmedEmail,
        password: password.trim(),
        confirm: confirm.trim(),
      });
      setLoading(false);
      router.push("/auth/profile");
    } catch {
      setEmailStatus("idle");
      setError("We couldn't verify your email right now. Try again.");
      setLoading(false);
    }
  };

  const renderEmailMessage = () => {
    if (!submitted) return null;
    if (!validEmail) {
      return { text: "Enter a valid email address.", tone: "accent" as const };
    }
    if (emailStatus === "taken") {
      return { text: takenMessage, tone: "accent" as const };
    }
    return null;
  };

  const renderConfirmMessage = () => {
    if (!submitted) return null;
    if (!passwordsMatch) {
      return { text: "Passwords need to match.", tone: "accent" as const };
    }
    if (!strongPassword) {
      return { text: "Use at least 6 characters.", tone: "accent" as const };
    }
    return null;
  };

  const emailMessage = renderEmailMessage();
  const confirmMessage = renderConfirmMessage();

  return (
    <Screen scrollable={false}>
      <StatusBar barStyle="dark-content" />
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
        <View
          style={{
            flex: 1,
            backgroundColor: design.background,
            paddingTop: 20,
          }}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 20,
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <View style={{ alignItems: "center", paddingTop: 12, gap: 12 }}>
                <View
                  style={{
                    position: "absolute",
                    width: 136,
                    height: 136,
                    borderRadius: 68,
                    backgroundColor: design.primary + "30",
                    top: 0,
                    opacity: 0.9,
                  }}
                />
                <Animated.View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 56,
                    backgroundColor: design.primary + "33",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ scale: bounceAnim }],
                    opacity: fadeAnim,
                  }}
                >
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: design.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: design.primary,
                      shadowOpacity: 0.35,
                      shadowRadius: 16,
                      shadowOffset: { width: 0, height: 8 },
                    }}
                  >
                    <CuteText
                      style={{ fontSize: 40, color: design.primaryContent }}
                    >
                      💌
                    </CuteText>
                  </View>
                </Animated.View>
                <CuteText
                  weight="bold"
                  style={{
                    fontSize: 30,
                    color: design.textMain,
                    textAlign: "center",
                  }}
                >
                  YouMeUs
                </CuteText>
              </View>

              <View
                style={{
                  backgroundColor: design.surface,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  paddingHorizontal: 18,
                  paddingTop: 20,
                  paddingBottom: 16,
                  borderWidth: 1,
                  borderColor: design.border,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: -4 },
                  gap: 14,
                }}
              >
                <CuteText
                  weight="bold"
                  style={{
                    fontSize: 22,
                    textAlign: "center",
                    color: design.textMain,
                  }}
                >
                  Create your account
                </CuteText>
                <View style={{ gap: 10 }}>
                  <View style={{ gap: 6 }}>
                    <CuteText
                      weight="semibold"
                      style={{ color: design.textMain, fontSize: 14 }}
                    >
                      Email
                    </CuteText>
                    <View style={{ position: "relative" }}>
                      <MaterialIcons
                        name="mail"
                        size={20}
                        color={design.textSubtle}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: 16,
                          zIndex: 2,
                        }}
                        pointerEvents="none"
                      />
                      <TextInput
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder="Signup Email"
                        placeholderTextColor={design.textSubtle}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        style={{
                          width: "100%",
                          borderRadius: 16,
                          backgroundColor: design.background,
                          paddingVertical: 14,
                          paddingHorizontal: 46,
                          color: design.textMain,
                          borderWidth: 1,
                          borderColor: design.primary + "33",
                          fontSize: 15,
                        }}
                      />
                    </View>
                    {emailMessage ? (
                      <CuteText
                        tone={emailMessage.tone}
                        style={{ fontSize: 12 }}
                      >
                        {emailMessage.text}
                      </CuteText>
                    ) : null}
                  </View>
                  <View style={{ gap: 6 }}>
                    <CuteText
                      weight="semibold"
                      style={{ color: design.textMain, fontSize: 14 }}
                    >
                      Signup Password
                    </CuteText>
                    <View style={{ position: "relative" }}>
                      <MaterialIcons
                        name="lock-outline"
                        size={20}
                        color={design.textSubtle}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: 16,
                          zIndex: 2,
                        }}
                        pointerEvents="none"
                      />
                      <TextInput
                        value={password}
                        onChangeText={handlePasswordChange}
                        placeholder="Signup Password"
                        placeholderTextColor={design.textSubtle}
                        secureTextEntry
                        textContentType="newPassword"
                        style={{
                          width: "100%",
                          borderRadius: 16,
                          backgroundColor: design.background,
                          paddingVertical: 14,
                          paddingHorizontal: 46,
                          color: design.textMain,
                          borderWidth: 1,
                          borderColor: design.primary + "33",
                          fontSize: 15,
                        }}
                      />
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <CuteText
                      weight="semibold"
                      style={{ color: design.textMain, fontSize: 14 }}
                    >
                      Confirm Password
                    </CuteText>
                    <View style={{ position: "relative" }}>
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color={design.textSubtle}
                        style={{
                          position: "absolute",
                          left: 14,
                          top: 16,
                          zIndex: 2,
                        }}
                        pointerEvents="none"
                      />
                      <TextInput
                        value={confirm}
                        onChangeText={handleConfirmChange}
                        placeholder="Signup Confirm"
                        placeholderTextColor={design.textSubtle}
                        secureTextEntry
                        textContentType="newPassword"
                        style={{
                          width: "100%",
                          borderRadius: 16,
                          backgroundColor: design.background,
                          paddingVertical: 14,
                          paddingHorizontal: 46,
                          color: design.textMain,
                          borderWidth: 1,
                          borderColor: design.primary + "33",
                          fontSize: 15,
                        }}
                      />
                    </View>
                    {confirmMessage ? (
                      <CuteText
                        tone={confirmMessage.tone}
                        style={{ fontSize: 12 }}
                      >
                        {confirmMessage.text}
                      </CuteText>
                    ) : null}
                  </View>
                </View>
                <CuteButton
                  label={loading ? "Next..." : "Next →"}
                  onPress={handleContinue}
                  disabled={signupDisabled}
                  icon={
                    loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : undefined
                  }
                  style={{ borderRadius: 16, paddingVertical: 14 }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 6,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: design.border,
                    }}
                  />
                  <CuteText tone="muted" style={{ fontSize: 12 }}>
                    Already registered?
                  </CuteText>
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: design.border,
                    }}
                  />
                </View>
                <Pressable onPress={() => router.replace("/auth")}>
                  <CuteText
                    tone="accent"
                    style={{ textAlign: "center", fontSize: 13 }}
                  >
                    Sign in instead
                  </CuteText>
                </Pressable>

                {submitted && (error || emailStatus === "taken") ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      backgroundColor: design.primary + "25",
                      padding: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: design.primary + "60",
                    }}
                  >
                    <MaterialIcons
                      name="error-outline"
                      size={18}
                      color={design.primaryContent}
                    />
                    <CuteText tone="accent" style={{ fontSize: 13, flex: 1 }}>
                      {error ?? takenMessage}
                    </CuteText>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </LinearGradient>
    </Screen>
  );
}
