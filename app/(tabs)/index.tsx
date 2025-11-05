import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";

import { CuteButton } from "../../components/CuteButton";
import { CuteCard } from "../../components/CuteCard";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { useAppData } from "../../context/AppDataContext";
import { usePalette } from "../../hooks/usePalette";

type ActionRoute =
  | "/(tabs)/chat"
  | "/(tabs)/gallery"
  | "/(tabs)/lists"
  | "/location";

type QuickAction = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: ActionRoute;
  requiresPair?: boolean;
};

const quickActions: QuickAction[] = [
  {
    id: "chat",
    label: "Chat",
    icon: "chat",
    route: "/(tabs)/chat",
    requiresPair: true,
  },
  {
    id: "memory",
    label: "Add Memory",
    icon: "add-photo-alternate",
    route: "/(tabs)/gallery",
    requiresPair: true,
  },
  {
    id: "plan",
    label: "Plan Date",
    icon: "favorite",
    route: "/(tabs)/lists",
    requiresPair: true,
  },
  {
    id: "location",
    label: "Share Location",
    icon: "my-location",
    route: "/location",
    requiresPair: true,
  },
];

export default function AnniversaryDashboardScreen() {
  const palette = usePalette();
  const router = useRouter();
  const scheme = useColorScheme();
  const {
    state: { auth, pairing, dashboard, milestones, profiles, settings },
    dispatch,
  } = useAppData();
  const [unlockSheetVisible, setUnlockSheetVisible] = useState(false);

  const isPaired = pairing.isPaired;
  const displayName =
    profiles.me?.displayName ?? auth.user.displayName ?? "You";
  const greeting = dashboard.helloMessage ?? `Hello ${displayName}!`;

  type StatsCard = {
    id: string;
    label: string;
    value: string;
    gradient: [string, string];
  };

  const statsCards = useMemo<StatsCard[]>(
    () => [
      {
        id: "days",
        label: "Together for",
        value:
          dashboard.daysTogether && dashboard.daysTogether > 0
            ? `${dashboard.daysTogether.toLocaleString()} days`
            : "Set your Day 0",
        gradient: ["#FFD8E2", "#FFB3C6"],
      },
      {
        id: "anniversary",
        label: "Anniversary",
        value: dashboard.anniversaryDate ?? "Choose your date",
        gradient: ["#D1EAFF", "#B7D8FF"],
      },
    ],
    [dashboard.anniversaryDate, dashboard.daysTogether]
  );

  const partnerCards = useMemo(() => {
    const cards: {
      key: string;
      name: string;
      status: string;
      avatar?: string;
      accent: string;
    }[] = [];

    if (profiles.me) {
      cards.push({
        key: "me",
        name: profiles.me.displayName,
        status: profiles.me.status,
        avatar: profiles.me.avatarUrl,
        accent: profiles.me.accentColor,
      });
    }
    if (profiles.partner) {
      cards.push({
        key: "partner",
        name: profiles.partner.displayName,
        status: profiles.partner.status,
        avatar: profiles.partner.avatarUrl,
        accent: profiles.partner.accentColor,
      });
    }

    return cards;
  }, [profiles.me, profiles.partner]);

  const handleActionPress = (
    route: ActionRoute,
    requiresPair?: boolean
  ) => {
    if (requiresPair && !isPaired) {
      setUnlockSheetVisible(true);
      return;
    }
    router.push(route);
  };

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 12,
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
        <Pressable onPress={() => router.push("/profile")}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              borderWidth: 2,
              borderColor: palette.primary,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {profiles.me?.avatarUrl ? (
              <Image
                source={{ uri: profiles.me.avatarUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <MaterialIcons name="person" size={22} color={palette.primary} />
            )}
          </View>
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <CuteText weight="bold" style={{ fontSize: 20 }}>
            {greeting}
          </CuteText>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/settings")}
          style={{
            padding: 8,
            borderRadius: 12,
          }}
        >
          <MaterialIcons name="settings" size={26} color={palette.text} />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 16,
        }}
      >
        {statsCards.map((card) => (
          <LinearGradient
            key={card.id}
            colors={card.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              borderRadius: 24,
              padding: 18,
              shadowColor: "#00000015",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <CuteText tone="muted" style={{ fontSize: 15 }}>
              {card.label}
            </CuteText>
            <CuteText weight="bold" style={{ fontSize: 24, marginTop: 6 }}>
              {card.value}
            </CuteText>
          </LinearGradient>
        ))}
      </View>

      {isPaired ? (
        <CuteCard
          background={palette.card}
          padding={20}
          style={{ gap: 12, borderWidth: 1, borderColor: palette.border }}
        >
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            You’re connected!
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Cue the confetti—everything is unlocked. What should we do first?
          </CuteText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <CuteButton
              label={
                settings.enablePush
                  ? "Notifications on"
                  : "Enable notifications"
              }
              tone={settings.enablePush ? "secondary" : "primary"}
              onPress={() =>
                dispatch({
                  type: "UPDATE_SETTINGS",
                  payload: { enablePush: !settings.enablePush },
                })
              }
            />
            <CuteButton
              label="Add first memory"
              tone="ghost"
              onPress={() => router.push("/(tabs)/gallery")}
            />
            <CuteButton
              label="Open chat"
              tone="ghost"
              onPress={() => router.push("/(tabs)/chat")}
            />
            <CuteButton
              label="Share location"
              tone="ghost"
              onPress={() => router.push("/location")}
            />
          </View>
        </CuteCard>
      ) : null}

      <View>
        <SectionHeader title="Our Milestones" />
        {milestones.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 16,
              paddingVertical: 4,
            }}
          >
            {milestones.map((milestone) => (
              <Pressable
                key={milestone.id}
                onPress={() => router.push(`/milestone/${milestone.id}`)}
                style={{
                  width: 84,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    padding: 4,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: palette.primary,
                    backgroundColor: palette.card,
                  }}
                >
                  <Image
                    source={{ uri: milestone.image }}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 999,
                    }}
                  />
                </View>
                <CuteText
                  style={{ fontSize: 13, textAlign: "center" }}
                  numberOfLines={2}
                >
                  {milestone.title}
                </CuteText>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View
            style={{
              backgroundColor: palette.card,
              borderRadius: 20,
              padding: 18,
            }}
          >
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Pair with your person to start collecting milestone badges that
              sparkle with memories.
            </CuteText>
          </View>
        )}
      </View>

      <View>
        <SectionHeader
          title="Quick Actions"
          description="Jump into your favourite shared spaces."
        />
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() =>
                handleActionPress(action.route, action.requiresPair)
              }
              style={{
                flexBasis: "48%",
                flexGrow: 1,
                backgroundColor: palette.card,
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#00000015",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
          <View
            style={{
              backgroundColor: palette.primary,
              borderRadius: 999,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <MaterialIcons
              name={action.icon as keyof typeof MaterialIcons.glyphMap}
              size={24}
              color="#ffffff"
            />
          </View>
              <CuteText weight="semibold">{action.label}</CuteText>
              {!isPaired && action.requiresPair ? (
                <CuteText tone="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  Pair to unlock
                </CuteText>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Our Profiles" />
        <View
          style={{
            flexDirection: "row",
            gap: 16,
          }}
        >
          {partnerCards.length ? (
            partnerCards.map((partner) => (
              <Pressable
                key={partner.key}
                style={{
                  flex: 1,
                  alignItems: "center",
                  backgroundColor: palette.card,
                  borderRadius: 24,
                  paddingVertical: 24,
                  paddingHorizontal: 12,
                  shadowColor: "#00000010",
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: partner.accent + "55",
                }}
                onPress={() => router.push(`/profile?who=${partner.key}`)}
              >
                <View
                  style={{
                    borderRadius: 999,
                    padding: 5,
                    backgroundColor: partner.accent + "55",
                  }}
                >
                  {partner.avatar ? (
                    <Image
                      source={{ uri: partner.avatar }}
                      style={{ width: 88, height: 88, borderRadius: 44 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: 44,
                        backgroundColor: partner.accent,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name="person" size={36} color="#fff" />
                    </View>
                  )}
                </View>
                <CuteText weight="bold" style={{ fontSize: 18, marginTop: 16 }}>
                  {partner.name}
                </CuteText>
                <CuteText tone="muted" style={{ marginTop: 6, fontSize: 14 }}>
                  {partner.status}
                </CuteText>
              </Pressable>
            ))
          ) : (
            <View
              style={{
                backgroundColor: palette.card,
                borderRadius: 24,
                padding: 24,
                flex: 1,
                gap: 12,
              }}
            >
              <CuteText weight="bold" style={{ fontSize: 18 }}>
                Solo mode activated
              </CuteText>
              <CuteText tone="muted" style={{ fontSize: 13 }}>
                Create or join your couple to see both profiles side by side.
              </CuteText>
              <Pressable
                onPress={() => router.push("/pairing")}
                style={{
                  alignSelf: "flex-start",
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 999,
                  backgroundColor: palette.primary,
                }}
              >
                <CuteText style={{ color: "#fff" }} weight="semibold">
                  Pair now
                </CuteText>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <CuteModal
        visible={unlockSheetVisible}
        onRequestClose={() => setUnlockSheetVisible(false)}
        title="Pair to unlock"
        subtitle="Chat, memories, to-dos, and live location unlock once you’re connected."
      >
        <CuteText tone="muted" style={{ fontSize: 13 }}>
          Only the two of you. Private by default. Pair now to open every shared
          space.
        </CuteText>
        <Pressable
          onPress={() => {
            setUnlockSheetVisible(false);
            router.push("/pairing");
          }}
          style={{
            marginTop: 8,
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: palette.primary,
            alignItems: "center",
          }}
        >
          <CuteText style={{ color: "#fff" }} weight="bold">
            Create or Join Couple
          </CuteText>
        </Pressable>
      </CuteModal>
    </Screen>
  );
}
