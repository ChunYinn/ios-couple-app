import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { CuteText } from "../../components/CuteText";
import { CuteCard } from "../../components/CuteCard";
import { Screen } from "../../components/Screen";
import { usePalette } from "../../hooks/usePalette";

export default function CalendarScreen() {
  const palette = usePalette();

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 16,
      }}
    >
      <StatusBar style="dark" />
      <View style={{ gap: 8 }}>
        <CuteText weight="bold" style={{ fontSize: 26 }}>
          Shared Calendar
        </CuteText>
        <CuteText tone="muted" style={{ fontSize: 14 }}>
          A cozy place for upcoming dates, reminders, and schedules. This view
          is in-progress — soon you'll be able to turn todos into events and see
          both partners' plans here.
        </CuteText>
      </View>
      <CuteCard
        background={palette.card}
        padding={24}
        style={{ alignItems: "center", gap: 12 }}
      >
        <CuteText weight="bold" style={{ fontSize: 20, textAlign: "center" }}>
          Calendar coming soon
        </CuteText>
        <CuteText tone="muted" style={{ textAlign: "center", fontSize: 13 }}>
          We're designing a shared schedule that syncs with your todos. Stay
          tuned while we put the finishing touches on it.
        </CuteText>
      </CuteCard>
    </Screen>
  );
}
