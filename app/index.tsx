import { ActivityIndicator, View, Image, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { usePalette } from "../hooks/usePalette";
import { CuteText } from "../components/CuteText";

export default function LoadingScreen() {
  const palette = usePalette();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[palette.background, palette.primarySoft + '20', palette.background]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 25,
            backgroundColor: palette.card,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            shadowColor: palette.primary,
            shadowOpacity: 0.2,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Image
            source={require("../assets/images/icon.png")}
            style={{ width: 80, height: 80, borderRadius: 20 }}
          />
        </View>
        <CuteText weight="bold" style={{ fontSize: 24, color: palette.primary, marginBottom: 8 }}>
          YouMeUs
        </CuteText>
        <ActivityIndicator size="small" color={palette.primary} />
      </Animated.View>
    </LinearGradient>
  );
}