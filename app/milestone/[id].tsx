import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";
import { Screen } from "../../components/Screen";

const formatMilestoneDate = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function MilestoneViewerScreen() {
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    state: { milestones },
  } = useAppData();

  const milestone =
    milestones.find((item) => item.id === id) ?? milestones[0] ?? null;
  const formattedDate = formatMilestoneDate(milestone?.achievedAt);

  if (!milestone) {
    return (
      <Screen
        scrollable={false}
        contentContainerStyle={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 12,
        }}
      >
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Milestone not found
        </CuteText>
        <CuteText tone="muted" style={{ textAlign: "center", fontSize: 13 }}>
          It may have been removed. Try opening another milestone or add a new
          one from your dashboard.
        </CuteText>
        <Pressable
          onPress={() => router.back()}
          style={{
            paddingHorizontal: 22,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: palette.primary,
          }}
        >
          <CuteText style={{ color: "#fff" }} weight="bold">
            Close
          </CuteText>
        </Pressable>
      </Screen>
    );
  }

  const content = (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 32 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#00000040",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#ffffff33",
            }}
            accessibilityRole="button"
            accessibilityLabel="Close milestone"
          >
            <MaterialIcons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: "flex-end", gap: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {milestone.dayCount ? (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: "#ffffff30",
                }}
              >
                <CuteText style={{ color: "#fff", fontSize: 13 }} weight="bold">
                  {milestone.dayCount} days
                </CuteText>
              </View>
            ) : null}
            {formattedDate ? (
              <CuteText tone="muted" style={{ color: "#ffffffcc", fontSize: 13 }}>
                {formattedDate}
              </CuteText>
            ) : null}
          </View>
          <CuteText style={{ color: "#fff", fontSize: 32 }} weight="bold">
            {milestone.title}
          </CuteText>
          <CuteText
            style={{ color: "#ffffffde", fontSize: 16, lineHeight: 24 }}
          >
            {milestone.description ??
              "Capture a few words about this memory to keep the feelings vivid."}
          </CuteText>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      {milestone.image ? (
        <ImageBackground
          source={{ uri: milestone.image }}
          resizeMode="cover"
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.85)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "65%",
            }}
            pointerEvents="none"
          />
          {content}
        </ImageBackground>
      ) : (
        <View style={{ flex: 1, backgroundColor: palette.primarySoft }}>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.35)"]}
            style={{ position: "absolute", inset: 0 }}
            pointerEvents="none"
          />
          {content}
        </View>
      )}
    </View>
  );
}
