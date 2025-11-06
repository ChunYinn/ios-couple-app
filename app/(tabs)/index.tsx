import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View, Platform, useWindowDimensions } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { CuteButton } from "../../components/CuteButton";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { Chip } from "../../components/Chip";
import { useAppData } from "../../context/AppDataContext";
import { usePalette } from "../../hooks/usePalette";
import { coupleService, userService } from "../../firebase/services";
import { calculateDaysTogether, formatDateToYMD, parseLocalDate } from "../../utils/dateUtils";

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
  const { width } = useWindowDimensions();
  const {
    state: { auth, pairing, dashboard, milestones, profiles },
    dispatch,
  } = useAppData();
  const isPaired = pairing.isPaired;
  const isCompactLayout = width < 360;
  const profileCardWidth = Math.min(280, Math.max(220, width * 0.45));
  const displayName =
    profiles.me?.displayName ?? auth.user.displayName ?? "You";
  const greeting = dashboard.helloMessage ?? `Hello ${displayName}!`;

  const [anniversaryModalVisible, setAnniversaryModalVisible] = useState(false);
  const [anniversaryDraft, setAnniversaryDraft] = useState(() =>
    dashboard.anniversaryDate
      ? formatDateToYMD(dashboard.anniversaryDate)
      : ""
  );
  const [anniversaryDateValue, setAnniversaryDateValue] = useState(() =>
    dashboard.anniversaryDate
      ? parseLocalDate(dashboard.anniversaryDate)
      : new Date()
  );
  const [anniversarySaving, setAnniversarySaving] = useState(false);
  const [anniversaryError, setAnniversaryError] = useState<string | null>(null);

  useEffect(() => {
    if (dashboard.anniversaryDate) {
      const normalized = formatDateToYMD(dashboard.anniversaryDate);
      setAnniversaryDraft(normalized);
      setAnniversaryDateValue(parseLocalDate(normalized));
    } else {
      setAnniversaryDraft("");
      setAnniversaryDateValue(new Date());
    }
  }, [dashboard.anniversaryDate]);

  useEffect(() => {
    if (!anniversaryModalVisible) {
      setAnniversaryError(null);
    }
  }, [anniversaryModalVisible]);

  type StatsCard = {
    id: string;
    label: string;
    value: string;
    gradient: [string, string];
    hint?: string;
    icon?: keyof typeof MaterialIcons.glyphMap;
    actionable?: boolean;
  };

  const openAnniversaryModal = useCallback(() => {
    const normalized = dashboard.anniversaryDate
      ? formatDateToYMD(dashboard.anniversaryDate)
      : anniversaryDraft
        ? formatDateToYMD(anniversaryDraft)
        : "";
    setAnniversaryDraft(normalized);
    setAnniversaryDateValue(
      normalized ? parseLocalDate(normalized) : new Date()
    );
    setAnniversaryError(null);
    setAnniversaryModalVisible(true);
  }, [anniversaryDraft, dashboard.anniversaryDate]);

  const handleAnniversaryDateChange = useCallback(
    (event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === "android" && event.type === "dismissed") {
        return;
      }
      if (date) {
        setAnniversaryDateValue(date);
        setAnniversaryDraft(formatDateToYMD(date.toISOString()));
        setAnniversaryError(null);
      }
    },
    []
  );

  const handleAnniversarySave = useCallback(async () => {
    const trimmed = anniversaryDraft.trim();
    if (!trimmed) {
      setAnniversaryError("Choose a date to save.");
      return;
    }

    const normalized = formatDateToYMD(trimmed);
    const days = calculateDaysTogether(normalized);

    if (!auth.user.coupleId && !auth.user.uid) {
      setAnniversaryError(
        "We couldn't find your account. Please try again after restarting."
      );
      return;
    }

    setAnniversarySaving(true);
    try {
      if (auth.user.coupleId) {
        await coupleService.setAnniversary(auth.user.coupleId, normalized);
      } else if (auth.user.uid) {
        await userService.updateUser(auth.user.uid, {
          anniversaryDate: normalized,
        });
      }

      dispatch({
        type: "SET_ANNIVERSARY",
        payload: {
          anniversaryDate: normalized,
          daysTogether: days,
        },
      });

      setAnniversaryError(null);
      setAnniversaryModalVisible(false);
    } catch (error) {
      console.error("Failed to save anniversary", error);
      setAnniversaryError(
        error instanceof Error
          ? error.message
          : "We couldn't save that date. Please try again."
      );
    } finally {
      setAnniversarySaving(false);
    }
  }, [anniversaryDraft, auth.user.coupleId, auth.user.uid, dispatch]);

  const statsCards = useMemo<StatsCard[]>(() => {
    const hasDays = dashboard.daysTogether && dashboard.daysTogether > 0;
    const daysValue = hasDays
      ? `${dashboard.daysTogether.toLocaleString()} ${
          dashboard.daysTogether === 1 ? "day" : "days"
        }`
      : "Set your Day 0";
    const anniversaryValue = dashboard.anniversaryDate
      ? parseLocalDate(dashboard.anniversaryDate).toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        )
      : "Choose your date";
    const anniversaryHint = dashboard.anniversaryDate
      ? undefined
      : "Tap to choose your anniversary";

    return [
      {
        id: "days",
        label: "Together for",
        value: daysValue,
        gradient: ["#FFD8E2", "#FFB3C6"],
      },
      {
        id: "anniversary",
        label: "Anniversary",
        value: anniversaryValue,
        gradient: ["#D1EAFF", "#B7D8FF"],
        hint: anniversaryHint,
        icon: "calendar-month",
        actionable: true,
      },
    ];
  }, [dashboard.anniversaryDate, dashboard.daysTogether]);

  const partnerCards = useMemo(() => {
    const cards: {
      key: string;
      name: string;
      status: string;
      avatar?: string;
      accent: string;
      birthday?: string;
    }[] = [];

    if (profiles.me) {
      cards.push({
        key: "me",
        name: profiles.me.displayName,
        status: profiles.me.status,
        avatar: profiles.me.avatarUrl,
        accent: profiles.me.accentColor,
        birthday: profiles.me.birthday ?? auth.user.birthday,
      });
    }
    if (profiles.partner) {
      cards.push({
        key: "partner",
        name: profiles.partner.displayName,
        status: profiles.partner.status,
        avatar: profiles.partner.avatarUrl,
        accent: profiles.partner.accentColor,
        birthday: profiles.partner.birthday,
      });
    }

    return cards;
  }, [profiles.me, profiles.partner, auth.user.birthday]);

  const formatBirthday = (value?: string) => {
    if (!value) {
      return "";
    }
    const parsed = parseLocalDate(value);
    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleActionPress = (
    route: ActionRoute,
    requiresPair?: boolean
  ) => {
    if (requiresPair && !isPaired) {
      router.push("/pairing");
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
      <StatusBar style="dark" />
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
          flexDirection: isCompactLayout ? "column" : "row",
          gap: 16,
        }}
      >
        {statsCards.map((card) => {
          const content = (
            <LinearGradient
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <CuteText tone="muted" style={{ fontSize: 15 }}>
                  {card.label}
                </CuteText>
                {card.icon && !isCompactLayout ? (
                  <MaterialIcons
                    name={card.icon}
                    size={18}
                    color={palette.text}
                  />
                ) : null}
              </View>
              <CuteText weight="bold" style={{ fontSize: 24, marginTop: 6 }}>
                {card.value}
              </CuteText>
              {card.hint ? (
                <CuteText tone="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {card.hint}
                </CuteText>
              ) : null}
            </LinearGradient>
          );

          const containerStyle = isCompactLayout
            ? { width: "100%" }
            : { flex: 1 };

          if (card.actionable) {
            return (
              <Pressable
                key={card.id}
                style={containerStyle}
                onPress={openAnniversaryModal}
                accessibilityRole="button"
                accessibilityLabel="Set anniversary date"
                accessibilityHint={card.hint}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View key={card.id} style={containerStyle}>
              {content}
            </View>
          );
        })}
      </View>

      {/* Removed the paired celebration card per latest UX request */}

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
        {partnerCards.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingVertical: 4 }}
          >
            {partnerCards.map((partner) => (
              <Pressable
                key={partner.key}
                style={{
                  width: profileCardWidth,
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
                <View style={{ marginTop: 12, alignItems: "center", gap: 10 }}>
                  {partner.birthday ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: partner.accent + "1A",
                      }}
                    >
                      <MaterialIcons
                        name="cake"
                        size={16}
                        color={partner.accent}
                      />
                      <CuteText weight="semibold">
                        {formatBirthday(partner.birthday)}
                      </CuteText>
                    </View>
                  ) : null}
                  {partner.status ? (
                    <Chip
                      label={partner.status}
                      tone="primary"
                      style={{
                        backgroundColor: partner.accent,
                        paddingHorizontal: 18,
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
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

      <CuteModal
        visible={anniversaryModalVisible}
        onRequestClose={() => setAnniversaryModalVisible(false)}
        title="Pick your anniversary"
        contentStyle={{ alignItems: "center", gap: 16 }}
      >
        <DateTimePicker
          value={anniversaryDateValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          onChange={handleAnniversaryDateChange}
          maximumDate={new Date()}
        />
        {anniversaryError ? (
          <CuteText style={{ color: "#D93025", fontSize: 12 }}>
            {anniversaryError}
          </CuteText>
        ) : null}
        <CuteButton
          label={anniversarySaving ? "Saving..." : "Save date"}
          onPress={handleAnniversarySave}
          disabled={anniversarySaving}
          style={{ minWidth: 160 }}
        />
      </CuteModal>

    </Screen>
  );
}
