import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  View,
  Platform,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { DateTimePickerEvent } from "../../components/AppDatePicker";

import { CuteText } from "../../components/CuteText";
import { CuteCard } from "../../components/CuteCard";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { useAppData } from "../../context/AppDataContext";
import { usePalette } from "../../hooks/usePalette";
import { coupleService, userService } from "../../firebase/services";
import { calculateDaysTogether, formatDateToYMD, parseLocalDate } from "../../utils/dateUtils";
import { DatePickerSheet } from "../../components/DatePickerSheet";

type ActionRoute =
  | "/(tabs)/chat"
  | "/(tabs)/gallery"
  | "/(tabs)/lists"
  | "/location"
  | "/milestone/new";

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
    id: "milestone",
    label: "Add Milestone",
    icon: "auto-awesome",
    route: "/milestone/new",
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
  const isUltraNarrow = width < 360;
  const contentWidth = width - 40;
  const quickActionCardWidth = Math.max(120, (contentWidth - 12) / 2);
  const milestoneAvatarSize = isUltraNarrow ? 56 : 68;
  const milestoneFrameSize = milestoneAvatarSize + 4;
  const milestoneCardWidth = milestoneAvatarSize + (isUltraNarrow ? 14 : 20);
  const milestoneItemGap = isUltraNarrow ? 10 : 8;
  const statValueFontSize = isUltraNarrow ? 20 : 24;
  const statLabelFontSize = isUltraNarrow ? 13 : 15;
  const profileCardGap = width < 360 ? 6 : 10;
  const profileCardWidth = Math.min(
    260,
    Math.max(120, (contentWidth - profileCardGap) / 2)
  );
  const profileAvatarSize = width < 360 ? 64 : 80;
  const profileCardPadding = width < 360 ? 12 : 16;
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
            month: width < 360 ? "short" : "short",
            day: "numeric",
            year: width < 360 ? "2-digit" : "numeric",
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
  }, [dashboard.anniversaryDate, dashboard.daysTogether, width]);

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

  const shouldCenterProfiles =
    partnerCards.length <= 1 ||
    profileCardWidth * 2 + profileCardGap > contentWidth;

  const formatBirthday = (value?: string) => {
    if (!value) {
      return "";
    }
    const parsed = parseLocalDate(value);
    const month = parsed.toLocaleString("en-US", { month: "short" });
    const day = parsed.getDate();
    const fullYear = parsed.getFullYear();
    const shortYear = parsed.toLocaleString("en-US", { year: "2-digit" });
    return width < 360
      ? `${day} ${month}, ${shortYear}`
      : `${month} ${day}, ${fullYear}`;
  };

  const milestoneReels = useMemo(
    () => milestones.slice(0, 12),
    [milestones]
  );

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
          flexDirection: "row",
          gap: 12,
          alignItems: "stretch",
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
                padding: isUltraNarrow ? 16 : 18,
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
                <CuteText tone="muted" style={{ fontSize: statLabelFontSize }}>
                  {card.label}
                </CuteText>
                {card.icon && !isUltraNarrow ? (
                  <MaterialIcons
                    name={card.icon}
                    size={18}
                    color={palette.text}
                  />
                ) : null}
              </View>
              <CuteText
                weight="bold"
                style={{ fontSize: statValueFontSize, marginTop: 6 }}
              >
                {card.value}
              </CuteText>
              {card.hint ? (
                <CuteText
                  tone="muted"
                  style={{ fontSize: 12, marginTop: 8 }}
                >
                  {card.hint}
                </CuteText>
              ) : null}
            </LinearGradient>
          );

          const containerStyle = [
            statCardStyles.flexOne,
            isUltraNarrow
              ? { minWidth: (contentWidth - 12) / 2 }
              : undefined,
          ];

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
        <SectionHeader
          title="Our Milestones"
          action={
            milestones.length ? (
              <Pressable onPress={() => router.push("/(tabs)/gallery")}>
                <CuteText
                  weight="bold"
                  style={{ color: palette.primary, fontSize: 13 }}
                >
                  See all
                </CuteText>
              </Pressable>
            ) : undefined
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingVertical: 4,
            paddingRight: 8,
          }}
        >
          {milestones.length < 3 && (
            <Pressable
              onPress={() => router.push("/milestone/new")}
              style={{
                width: milestoneCardWidth,
                alignItems: "center",
                gap: milestoneItemGap,
              }}
            >
              <View
                style={{
                  width: milestoneFrameSize,
                  height: milestoneFrameSize,
                  borderRadius: milestoneFrameSize / 2,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: palette.card,
                }}
              >
                <MaterialIcons name="add" size={28} color={palette.primary} />
              </View>
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                Add
              </CuteText>
            </Pressable>
          )}
          {milestoneReels.map((milestone) => (
            <Pressable
              key={milestone.id}
              onPress={() => router.push(`/milestone/${milestone.id}`)}
              style={{
                width: milestoneCardWidth,
                alignItems: "center",
                gap: milestoneItemGap,
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
                {milestone.image ? (
                  <Image
                    source={{ uri: milestone.image }}
                    style={{
                      width: milestoneAvatarSize,
                      height: milestoneAvatarSize,
                      borderRadius: 999,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: milestoneAvatarSize,
                      height: milestoneAvatarSize,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: palette.primarySoft,
                    }}
                  >
                    <MaterialIcons
                      name="auto-awesome"
                      size={24}
                      color={palette.primary}
                    />
                  </View>
                )}
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
        {!milestones.length ? (
          <CuteCard
            background={palette.card}
            padding={20}
            style={{ marginTop: 12, gap: 10 }}
          >
            <CuteText weight="bold">Capture your first milestone</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Add a highlight to create shared reels that feel like little
              celebrations.
            </CuteText>
            <Pressable
              onPress={() => router.push("/milestone/new")}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 16,
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
        ) : null}
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
            justifyContent: "space-between",
            marginHorizontal: -6,
          }}
        >
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() =>
                handleActionPress(action.route, action.requiresPair)
              }
              style={{
                width: quickActionCardWidth,
                marginHorizontal: 6,
                marginBottom: 12,
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
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: shouldCenterProfiles ? "center" : "flex-start",
              gap: profileCardGap,
            }}
          >
            {partnerCards.map((partner) => {
              const hasStatus = Boolean(partner.status);
              return (
                <Pressable
                  key={partner.key}
                  style={{
                    width: profileCardWidth,
                    alignItems: "center",
                    backgroundColor: palette.card,
                    borderRadius: 22,
                    padding: profileCardPadding,
                    shadowColor: "#00000010",
                    shadowOpacity: 0.08,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 3,
                    borderWidth: 1,
                    borderColor: partner.accent + "55",
                  }}
                  onPress={() => router.push(`/profile?who=${partner.key}`)}
                >
                  <View
                    style={{
                      alignItems: "center",
                      marginBottom: hasStatus ? 20 : 12,
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 999,
                        padding: 4,
                        backgroundColor: partner.accent + "33",
                      }}
                    >
                      {partner.avatar ? (
                        <Image
                          source={{ uri: partner.avatar }}
                          style={{
                            width: profileAvatarSize,
                            height: profileAvatarSize,
                            borderRadius: profileAvatarSize / 2,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: profileAvatarSize,
                            height: profileAvatarSize,
                            borderRadius: profileAvatarSize / 2,
                            backgroundColor: partner.accent,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialIcons name="person" size={32} color="#fff" />
                        </View>
                      )}
                    </View>
                    {hasStatus ? (
                      <View
                        style={{
                          marginTop: -12,
                          paddingHorizontal: 14,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: palette.card,
                          borderWidth: 1,
                          borderColor: partner.accent + "66",
                          shadowColor: "#00000020",
                          shadowOpacity: 0.15,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 3 },
                          elevation: 3,
                        }}
                      >
                        <CuteText
                          weight="bold"
                          style={{ fontSize: 11, color: palette.text }}
                        >
                          {partner.status}
                        </CuteText>
                      </View>
                    ) : null}
                  </View>
                  <CuteText
                    weight="bold"
                    style={{ fontSize: 17, marginTop: hasStatus ? 6 : 12 }}
                  >
                    {partner.name}
                  </CuteText>
                  {partner.birthday ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: partner.accent + "1A",
                        marginTop: 10,
                        alignSelf: "center",
                      }}
                    >
                      <MaterialIcons
                        name="cake"
                        size={15}
                        color={partner.accent}
                      />
                      <CuteText
                        weight="semibold"
                        style={{ fontSize: 12, textAlign: "center" }}
                      >
                        {formatBirthday(partner.birthday)}
                      </CuteText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
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

      <DatePickerSheet
        visible={anniversaryModalVisible}
        onRequestClose={() => setAnniversaryModalVisible(false)}
        title="Pick your anniversary"
        value={anniversaryDateValue}
        onChange={handleAnniversaryDateChange}
        maximumDate={new Date()}
        onConfirm={handleAnniversarySave}
        confirmLabel={anniversarySaving ? "Saving..." : "Save date"}
        confirmDisabled={anniversarySaving}
        footer={
          anniversaryError ? (
            <CuteText style={{ color: "#D93025", fontSize: 12 }}>
              {anniversaryError}
            </CuteText>
          ) : null
        }
      />

    </Screen>
  );
}

const statCardStyles = StyleSheet.create({
  fullWidth: {
    width: "100%",
  },
  flexOne: {
    flex: 1,
  },
});
