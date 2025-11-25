import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FirebaseError } from "firebase/app";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAppData } from "../../context/AppDataContext";
import { authService } from "../../services/authService";

const design = {
  primary: "#F8B4D9",
  primaryContent: "#4A223B",
  secondary: "#A6E3E9",
  background: "#FDF7FA",
  surface: "#FFFFFF",
  textMain: "#5C4B56",
  textSubtle: "#A18F9A",
  border: "rgba(248, 180, 217, 0.4)",
};

export default function LoginScreen() {
  const router = useRouter();
  const { state } = useAppData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const bounceAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!loading) return;
    if (state.auth.status === "ready") {
      setLoading(false);
    }
  }, [loading, state.auth.status]);

  const validEmail = useMemo(
    () => email.trim().length > 0 && email.includes("@"),
    [email]
  );

  const loginDisabled = useMemo(
    () => loading || !validEmail || password.trim().length < 6,
    [loading, password, validEmail]
  );

  const friendlyError = (err: unknown): string => {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case "auth/invalid-email":
          return "Enter a valid email address.";
        case "auth/user-not-found":
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
          return "We couldn't find that account. Double-check your details.";
        case "auth/wrong-password":
          return "That password doesn't look right. Please try again.";
        case "auth/too-many-requests":
          return "Too many attempts. Please wait a moment and try again.";
        case "auth/network-request-failed":
          return "Check your connection and try again.";
        default:
          break;
      }
    }
    return "Something went wrong. Please check your details and try again.";
  };

  const handleLogin = async () => {
    if (loginDisabled) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await authService.signInWithEmail(email.trim(), password.trim());
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[
          design.primary + "33",
          design.background,
          design.secondary + "22",
        ]}
        style={{ flex: 1, backgroundColor: design.background }}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: design.background }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                minHeight: "100%",
                paddingHorizontal: 24,
                paddingVertical: 32,
                justifyContent: "center",
                gap: 28,
              }}
            >
              <View
                style={{
                  flex: 1,
                  width: "100%",
                  alignItems: "center",
                  gap: 28,
                }}
              >
                <View
                  style={{
                    width: "100%",
                    maxWidth: 360,
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      width: 140,
                      height: 140,
                      borderRadius: 70,
                      backgroundColor: design.primary + "30",
                      top: -10,
                      opacity: 0.8,
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
                      transform: [
                        { scale: bounceAnim },
                        {
                          translateY: bounceAnim.interpolate({
                            inputRange: [0.9, 1],
                            outputRange: [6, 0],
                          }),
                        },
                      ],
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
                        style={{ fontSize: 44, color: design.primaryContent }}
                      >
                        💌
                      </CuteText>
                    </View>
                  </Animated.View>

                  <CuteText
                    weight="bold"
                    style={{
                      fontSize: 32,
                      color: design.primaryContent,
                      marginTop: 6,
                    }}
                  >
                    YouMeUs
                  </CuteText>
                </View>

                <View
                  style={{
                    width: "100%",
                    maxWidth: 360,
                    backgroundColor: design.surface,
                    borderRadius: 20,
                    padding: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 6 },
                    gap: 18,
                    borderWidth: 1,
                    borderColor: design.border,
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
                    Welcome back!
                  </CuteText>

                  <View style={{ gap: 12 }}>
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
                          size={18}
                          color={design.textSubtle}
                          style={{
                            position: "absolute",
                            left: 14,
                            top: 14,
                            zIndex: 1,
                          }}
                        />
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          placeholder="you@example.com"
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
                            paddingHorizontal: 42,
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
                        Password
                      </CuteText>
                      <View style={{ position: "relative" }}>
                        <MaterialIcons
                          name="key"
                          size={18}
                          color={design.textSubtle}
                          style={{
                            position: "absolute",
                            left: 14,
                            top: 14,
                            zIndex: 1,
                          }}
                        />
                        <TextInput
                          value={password}
                          onChangeText={setPassword}
                          placeholder="••••••••"
                          placeholderTextColor={design.textSubtle}
                          secureTextEntry
                          textContentType="password"
                          style={{
                            width: "100%",
                            borderRadius: 16,
                            backgroundColor: design.background,
                            paddingVertical: 14,
                            paddingHorizontal: 42,
                            color: design.textMain,
                            borderWidth: 1,
                            borderColor: design.primary + "33",
                            fontSize: 15,
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  <CuteButton
                    label={loading ? "Signing in..." : "Sign in"}
                    onPress={handleLogin}
                    disabled={loginDisabled}
                    icon={
                      loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : undefined
                    }
                    style={{ borderRadius: 999, paddingVertical: 14 }}
                  />

                  {error ? (
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
                        {error}
                      </CuteText>
                    </View>
                  ) : null}

                  <View
                    style={{
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <CuteText tone="muted" style={{ fontSize: 12 }}>
                      New to YouMeUs?
                    </CuteText>
                    <Pressable onPress={() => router.push("/auth/signup")}>
                      <CuteText
                        style={{
                          fontSize: 13,
                          color: design.primary,
                          fontWeight: "700",
                        }}
                      >
                        Create account
                      </CuteText>
                    </Pressable>
                  </View>

                  {info ? (
                    <View
                      style={{
                        backgroundColor: design.primary + "40",
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: design.primary + "60",
                      }}
                    >
                      <CuteText
                        style={{ fontSize: 13, color: design.primaryContent }}
                      >
                        {info}
                      </CuteText>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </LinearGradient>
    </Screen>
  );
}
