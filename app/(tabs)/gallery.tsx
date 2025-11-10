import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";
import { CuteCard } from "../../components/CuteCard";

const formatMilestoneDate = (value?: string | null) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function MilestoneArchiveScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { milestones, pairing },
  } = useAppData();

  if (!pairing.isPaired) {
    return (
      <Screen scrollable={false}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 16,
          }}
        >
          <MaterialIcons name="auto-awesome" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock milestones
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Once you both connect, you can create looping highlight reels for
            every special moment.
          </CuteText>
          <Pressable
            onPress={() => router.push("/pairing")}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: palette.primary,
            }}
          >
            <CuteText style={{ color: "#fff" }} weight="bold">
              Pair now
            </CuteText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 24,
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
        <View style={{ gap: 4, flex: 1 }}>
          <CuteText weight="bold" style={{ fontSize: 26 }}>
            Milestones
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            A cozy archive of the moments you want on repeat.
          </CuteText>
        </View>
        <Pressable
          onPress={() => router.push("/milestone/new")}
          style={{
            padding: 10,
            borderRadius: 999,
            backgroundColor: palette.primary,
          }}
          accessibilityRole="button"
          accessibilityLabel="Add milestone"
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {milestones.length ? (
        <ScrollView
          contentContainerStyle={{
            gap: 18,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {milestones.map((milestone) => {
            const formattedDate = formatMilestoneDate(milestone.achievedAt);
            const imageSource = milestone.image
              ? { uri: milestone.image }
              : null;

            const overlay = (
              <LinearGradient
                colors={["#000000B8", "#00000010", "#000000D0"]}
                style={{
                  flex: 1,
                  justifyContent: "space-between",
                  padding: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <CuteText weight="bold" style={{ color: "#fff", fontSize: 20 }}>
                      {milestone.title}
                    </CuteText>
                    {formattedDate ? (
                      <CuteText tone="muted" style={{ color: "#fff", marginTop: 2 }}>
                        {formattedDate}
                      </CuteText>
                    ) : null}
                  </View>
                  {milestone.dayCount ? (
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: "#ffffff30",
                      }}
                    >
                      <CuteText style={{ color: "#fff", fontSize: 13 }}>
                        {milestone.dayCount} days
                      </CuteText>
                    </View>
                  ) : null}
                </View>
                {milestone.description ? (
                  <CuteText
                    style={{
                      color: "#fff",
                      fontSize: 14,
                    }}
                    numberOfLines={3}
                  >
                    {milestone.description}
                  </CuteText>
                ) : null}
              </LinearGradient>
            );

            return (
              <Pressable
                key={milestone.id}
                onPress={() => router.push(`/milestone/${milestone.id}`)}
                style={{
                  borderRadius: 28,
                  overflow: "hidden",
                  shadowColor: "#00000040",
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 6,
                }}
              >
                {imageSource ? (
                  <ImageBackground
                    source={imageSource}
                    style={{ width: "100%", height: 240 }}
                    imageStyle={{ borderRadius: 28 }}
                  >
                    {overlay}
                  </ImageBackground>
                ) : (
                  <View
                    style={{
                      height: 240,
                      borderRadius: 28,
                      overflow: "hidden",
                      backgroundColor: palette.primarySoft,
                    }}
                  >
                    {overlay}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <CuteCard
          background={palette.card}
          padding={24}
          style={{ gap: 12, marginBottom: 40 }}
        >
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            No milestones yet
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Tap the star button above to add your first big moment — photos only
            for now, so choose your favorite shot.
          </CuteText>
          <Pressable
            onPress={() => router.push("/milestone/new")}
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: palette.primary,
            }}
          >
            <CuteText style={{ color: "#fff" }} weight="semibold">
              Add milestone
            </CuteText>
          </Pressable>
        </CuteCard>
      )}
    </Screen>
  );
}
