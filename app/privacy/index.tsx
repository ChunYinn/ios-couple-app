import { ScrollView, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";

const sections = [
  {
    title: "Information We Collect",
    body: [
      "Account data: an anonymous identifier and display name generated when you first open the app (no email required).",
      "Relationship data: anniversary date, couple profiles, messages, shared photos, and to-do lists.",
      "Device data: Firebase Cloud Messaging token for push notifications.",
      "Location data (optional): live-location sharing between partners when enabled.",
    ],
  },
  {
    title: "How We Use Your Information",
    body: [
      "Authenticate and personalize your account.",
      "Sync messages, memories, and to-do lists between you and your partner.",
      "Deliver push notifications and reminders.",
      "Improve app performance and reliability.",
    ],
  },
  {
    title: "Data Storage and Security",
    body: [
      "All data is stored securely using Google Firebase Firestore & Storage.",
      "Only you and your linked partner can access shared data.",
      "We do not sell or share your information with third parties.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can stop location sharing at any time in Settings.",
      "You can request account deletion, which removes your data from Firebase.",
    ],
  },
  {
    title: "Contact Us",
    body: [
      "If you have privacy questions or requests, email support@coupleapp.com.",
    ],
  },
];

export default function PrivacyScreen() {
  const palette = usePalette();

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        gap: 24,
      }}
    >
      <StatusBar style="auto" />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <PressableBack />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <CuteText weight="bold" style={{ fontSize: 24 }}>
            Privacy Policy — YouMeUs
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 12 }}>
            Effective Date: November 2025
          </CuteText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ gap: 20, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={{ gap: 12 }}>
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              {section.title}
            </CuteText>
            <View style={{ gap: 8 }}>
              {section.body.map((point) => (
                <View
                  key={point}
                  style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
                >
                  <MaterialIcons
                    name="favorite"
                    size={16}
                    color={palette.primary}
                    style={{ marginTop: 2 }}
                  />
                  <CuteText tone="muted" style={{ flex: 1, lineHeight: 20 }}>
                    {point}
                  </CuteText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const PressableBack = () => {
  const palette = usePalette();
  return (
    <Pressable
      onPress={() => router.back()}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.card,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <MaterialIcons name="arrow-back" size={20} color={palette.textSecondary} />
    </Pressable>
  );
};
