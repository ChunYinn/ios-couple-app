import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, Pressable, View } from "react-native";

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

  const overlay = (
    <LinearGradient
      colors={["#000000D0", "#00000010", "#000000D0"]}
      style={{ flex: 1, padding: 24 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <CuteText style={{ color: "#fff", fontSize: 24 }} weight="bold">
            {milestone.title}
          </CuteText>
          {formattedDate ? (
            <CuteText tone="muted" style={{ color: "#fff" }}>
              {formattedDate}
            </CuteText>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#00000060",
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel="Close milestone"
        >
          <MaterialIcons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 10 }}>
        {milestone.dayCount ? (
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#00000050",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <CuteText style={{ color: "#fff", fontSize: 13 }}>
              {milestone.dayCount} days together
            </CuteText>
          </View>
        ) : null}
        {milestone.description ? (
          <CuteText style={{ color: "#fff", fontSize: 16 }}>
            {milestone.description}
          </CuteText>
        ) : (
          <CuteText tone="muted" style={{ color: "#fff", fontSize: 14 }}>
            Tap the add button to update this story with more notes or photos.
          </CuteText>
        )}
      </View>
    </LinearGradient>
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
          {overlay}
        </ImageBackground>
      ) : (
        <View
          style={{
            flex: 1,
            backgroundColor: palette.primarySoft,
          }}
        >
          {overlay}
        </View>
      )}
    </View>
  );
}
