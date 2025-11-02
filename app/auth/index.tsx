import { StatusBar } from "expo-status-bar";
import { Pressable, View, useColorScheme } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { CuteButton } from "../../components/CuteButton";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";

const createUid = (provider: string) =>
  `${provider}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function AuthScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const { dispatch } = useAppData();

  const handleSignIn = (provider: "apple" | "google") => {
    dispatch({
      type: "SIGN_IN",
      payload: { provider, uid: createUid(provider) },
    });
  };

  return (
    <Screen scrollable={false}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          gap: 32,
        }}
      >
        <View style={{ alignItems: "center", gap: 12 }}>
          <MaterialIcons name="favorite" size={48} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 26 }}>
            Welcome to Couplely
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Sign in to keep your shared story private and in sync.
          </CuteText>
        </View>

        <View style={{ width: "100%", gap: 16 }}>
          <CuteButton
            label="Continue with Apple"
            tone="secondary"
            onPress={() => handleSignIn("apple")}
            icon={<Ionicons name="logo-apple" size={20} color={palette.primary} />}
          />
          <CuteButton
            label="Continue with Google"
            onPress={() => handleSignIn("google")}
            icon={<Ionicons name="logo-google" size={20} color="#fff" />}
          />
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <CuteText tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
            We only use your sign-in details to connect you and your partner.
          </CuteText>
          <Pressable disabled>
            <CuteText tone="accent" style={{ fontSize: 12 }}>
              Privacy policy (coming soon)
            </CuteText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
