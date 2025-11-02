import { useLocalSearchParams, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme } from "react-native";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { CuteCard } from "../../components/CuteCard";
import { useAppData } from "../../context/AppDataContext";

export default function MilestoneDetailsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    state: { milestones },
  } = useAppData();

  const milestone =
    milestones.find((item) => item.id === id) ?? milestones[0] ?? null;

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 20,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <MaterialIcons
          name="arrow-back-ios"
          size={22}
          color={palette.textSecondary}
          onPress={() => router.back()}
        />
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          {milestone?.title ?? "Milestone"}
        </CuteText>
        <MaterialIcons name="celebration" size={22} color={palette.primary} />
      </View>

      {milestone ? (
        <CuteCard padding={22} background={palette.card} style={{ gap: 16 }}>
          <CuteText tone="muted">{milestone.description}</CuteText>
          <CuteCard
            background={palette.primarySoft}
            padding={16}
            style={{ gap: 10 }}
          >
            <CuteText weight="bold">Celebrate this moment</CuteText>
            <CuteText tone="muted">
              Add photos, write a love note, or schedule an annual reminder to
              relive it together.
            </CuteText>
          </CuteCard>
        </CuteCard>
      ) : (
        <CuteCard padding={22} background={palette.card}>
          <CuteText tone="muted">
            We could not find this milestone, but you can add a new one from the
            dashboard soon.
          </CuteText>
        </CuteCard>
      )}
    </Screen>
  );
}
