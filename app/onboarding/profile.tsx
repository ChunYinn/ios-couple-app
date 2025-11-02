import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import {
  ImageBackground,
  Pressable,
  View,
  useColorScheme,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { CuteTextInput } from "../../components/CuteTextInput";
import { CuteButton } from "../../components/CuteButton";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";

const avatarOptions = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC9vM1CckvQwVKQpp1X7WKuLTBqn7kV-zigd60ZjI7gCAV0rXPQIYmQf73Nb9W8F1-iMaG0HTRtIAF0Y1h8VZgGJ85zT4DMmYTgf-bN6zZ0P5mx58wJGdw-7JIj8_Q-GxuwHnKOgix2xNPQZe2d2i14Z1a1IY1btatb-7rRG0jl3vzx1VWAxwm2y3a66Bpc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCmFkd9-cCAw9e9CTN4cl9O7wn0or-8wrL0UuKvKogku7pNho4ZCwrHm631FvZlBQzJ8JBdvJNwDUjtOYO1stw-PPznuw3ogXmGLnSEmlTKjlYIfZ_Jk1nK1QRH-9DcVbJ3afKMcOC9AvAu2y_S6H5DncL6EqvyelzEKE5LRZyY6u1hDfVe9YkmeSqs9TXO",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDmnKeHyA9d3uG3OVmNAGEG2I1OB8_UQWH9zNg1tTFmnXC3Okv7EHVLNc4K6bI9W5W1Fn3k9gxwTQ8EqBi5F414WZnI6hFYz4ynFAubxVsgw9ZHLQFv0yUaH_conf9RJiq7OJw8g9yr-jH5CnzKSSAVYoarLKwWvtO9CB2p-DpQjo6m268KHgJctvmtuv7c",
];

export default function ProfileOnboardingScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const { dispatch } = useAppData();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [birthday, setBirthday] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [status, setStatus] = useState("Feeling Happy");
  const [loveLanguages, setLoveLanguages] = useState("Words of Affirmation");

  const avatarPreview = useMemo(() => avatarUrl ?? avatarOptions[0], [avatarUrl]);

  const canContinue = displayName.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    const languages = loveLanguages
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    dispatch({
      type: "SAVE_PROFILE",
      payload: {
        displayName: displayName.trim(),
        avatarUrl,
        birthday: birthday.trim() || undefined,
        pronouns: pronouns.trim() || undefined,
        status: status.trim() || "Feeling Happy",
        loveLanguages: languages.length ? languages : ["Words of Affirmation"],
      },
    });
  };

  return (
    <Screen scrollable>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ alignItems: "center", gap: 16, paddingTop: 32 }}>
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: palette.primarySoft,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {avatarPreview ? (
            <ImageBackground
              source={{ uri: avatarPreview }}
              style={{ width: 120, height: 120 }}
            />
          ) : (
            <MaterialIcons name="person" size={48} color={palette.primary} />
          )}
        </View>
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          Optional avatar for extra sparkle
        </CuteText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {avatarOptions.map((url) => (
            <Pressable
              key={url}
              onPress={() => setAvatarUrl(url)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                overflow: "hidden",
                borderWidth: avatarUrl === url ? 3 : 1,
                borderColor:
                  avatarUrl === url ? palette.primary : palette.primarySoft,
              }}
            >
              <ImageBackground source={{ uri: url }} style={{ flex: 1 }} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => setAvatarUrl(undefined)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: avatarUrl ? 1 : 3,
              borderColor: avatarUrl ? palette.primarySoft : palette.primary,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.card,
            }}
          >
            <MaterialIcons name="close" size={22} color={palette.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 32, gap: 18 }}>
        <CuteTextInput
          label="Display name*"
          placeholder="How should we greet you?"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <CuteTextInput
          label="Status"
          placeholder="Ex. Feeling Happy"
          value={status}
          onChangeText={setStatus}
        />
        <CuteTextInput
          label="Pronouns"
          placeholder="She/Her, They/Them, He/Him"
          value={pronouns}
          onChangeText={setPronouns}
        />
        <CuteTextInput
          label="Birthday"
          placeholder="YYYY-MM-DD"
          value={birthday}
          onChangeText={setBirthday}
        />
        <CuteTextInput
          label="Love languages"
          placeholder="Comma separated"
          value={loveLanguages}
          onChangeText={setLoveLanguages}
        />
      </View>

      <View style={{ padding: 20, gap: 16 }}>
        <CuteButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
        <CuteText tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
          You can change these later in Settings.
        </CuteText>
      </View>
    </Screen>
  );
}
