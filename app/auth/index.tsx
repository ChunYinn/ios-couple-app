import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CuteButton } from "../../components/CuteButton";
import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { usePalette } from "../../hooks/usePalette";
import { authService } from "../../services/authService";

export default function GetStartedScreen() {
  const palette = usePalette();
  const [loading, setLoading] = useState(false);
  const { state } = useAppData();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const highlights = [
    {
      icon: "emoji-emotions",
      title: "Create your vibe",
      description: "Tell us who you are so the app can greet you by name.",
    },
    {
      icon: "bolt",
      title: "Stay signed in",
      description: "We keep you signed in so you pick up right where you left off.",
    },
    {
      icon: "favorite",
      title: "Invite when ready",
      description: "Explore the space solo now and invite your partner whenever you're ready.",
    },
  ] as const;

  const journey = [
    {
      label: "Add your details",
      detail: "Share your display name and birthday (photo is optional).",
    },
    {
      label: "Open your dashboard",
      detail: "Jump straight into your shared spaces and milestones.",
    },
  ] as const;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 20,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handlePress = async () => {
    try {
      setLoading(true);
      await authService.createAnonymousAccount();
    } catch (error) {
      console.error("Failed to start anonymous session", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;
    if (state.auth.status === "profile" || state.auth.status === "ready") {
      setLoading(false);
    }
  }, [loading, state.auth.status]);

  return (
    <Screen>
      <LinearGradient
        colors={[
          palette.background,
          palette.primarySoft + "20",
          palette.background,
        ]}
        style={{ flex: 1 }}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              gap: 32,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            {/* App Icon with glow effect */}
            <View style={{ alignItems: "center", gap: 20 }}>
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 30,
                  backgroundColor: palette.card,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: palette.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                  borderWidth: 3,
                  borderColor: palette.primarySoft,
                }}
              >
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={{ width: 100, height: 100, borderRadius: 25 }}
                />
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: palette.primarySoft,
                  }}
                >
                  <CuteText
                    weight="semibold"
                    style={{ fontSize: 12, color: palette.primary }}
                  >
                    Step 1 of 2 · Personalise
                  </CuteText>
                </View>
                <CuteText
                  weight="bold"
                  style={{ fontSize: 36, color: palette.primary }}
                >
                  YouMeUs
                </CuteText>
                <CuteText
                  tone="muted"
                  style={{ fontSize: 18, textAlign: "center", maxWidth: 280 }}
                >
                  Your private space for two hearts to connect
                </CuteText>
              </View>
            </View>

            {/* Feature highlights */}
            <View style={{ gap: 16, width: "100%", maxWidth: 320 }}>
              {highlights.map((feature, index) => (
                <Animated.View
                  key={feature.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: palette.card,
                    borderWidth: 1,
                    borderColor: palette.border,
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: palette.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons
                      name={feature.icon as keyof typeof MaterialIcons.glyphMap}
                      size={20}
                      color={palette.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <CuteText weight="semibold" style={{ fontSize: 16 }}>
                      {feature.title}
                    </CuteText>
                    <CuteText tone="muted" style={{ fontSize: 13 }}>
                      {feature.description}
                    </CuteText>
                  </View>
                </Animated.View>
              ))}
            </View>

            <View style={{ width: "100%", maxWidth: 320, gap: 12 }}>
              <CuteText tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
                You{"'"}ll breeze through two quick steps:
              </CuteText>
              <View style={{ gap: 10 }}>
                {journey.map((step, index) => (
                  <View
                    key={step.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: palette.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CuteText weight="bold" style={{ color: palette.primary }}>
                        {index + 1}
                      </CuteText>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <CuteText weight="semibold">{step.label}</CuteText>
                      <CuteText tone="muted" style={{ fontSize: 12 }}>
                        {step.detail}
                      </CuteText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <View style={{ padding: 24, gap: 12 }}>
            <CuteButton
              label={
                loading
                  ? "Just a moment..."
                  : state.auth.status === "profile"
                  ? "Continue"
                  : "Get Started"
              }
              onPress={handlePress}
              disabled={loading}
              icon={
                loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : undefined
              }
              style={{
                shadowColor: palette.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
              }}
            />
            <CuteText
              tone="muted"
              style={{ fontSize: 12, textAlign: "center" }}
            >
              Free forever • No ads • Your data stays private
            </CuteText>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Screen>
  );
}
