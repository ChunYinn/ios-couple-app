import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { MILESTONE_STEPS } from "../../data/milestoneSteps";
import { milestoneService } from "../../firebase/services";
import { usePalette } from "../../hooks/usePalette";
import { parseLocalDate } from "../../utils/dateUtils";

export default function NewMilestoneScreen() {
  const palette = usePalette();
  const {
    state: { pairing, auth, dashboard, milestones },
  } = useAppData();
  const params = useLocalSearchParams<{
    day?: string | string[];
    locked?: string | string[];
  }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showStepPicker, setShowStepPicker] = useState(false);
  const lockedParam = Array.isArray(params.locked)
    ? params.locked[0]
    : params.locked;
  const isLockedSelection =
    lockedParam !== undefined && lockedParam !== "0" && lockedParam !== "false";

  useEffect(() => {
    if (!pairing.isPaired) {
      router.replace("/pairing");
    }
  }, [pairing.isPaired]);

  const coupleId = auth.user.coupleId;
  const today = useMemo(() => new Date(), []);

  const computedDayCount = useMemo(() => {
    if (!dashboard.anniversaryDate) {
      return undefined;
    }
    const anniversary = parseLocalDate(dashboard.anniversaryDate);
    if (Number.isNaN(anniversary.getTime())) {
      return undefined;
    }
    return Math.max(
      0,
      Math.floor(
        (today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
  }, [dashboard.anniversaryDate, today]);
  const daysTogether = dashboard.daysTogether || computedDayCount || 0;

  const achievedDayCounts = useMemo(
    () =>
      new Set(
        milestones
          .map((m) => m.dayCount)
          .filter((day): day is number => typeof day === "number")
      ),
    [milestones]
  );

  const unlockedSteps = useMemo(
    () =>
      MILESTONE_STEPS.filter(
        (step) =>
          daysTogether >= step.dayCount && !achievedDayCounts.has(step.dayCount)
      ),
    [daysTogether, achievedDayCounts]
  );

  const eligibleStep = useMemo(() => {
    const target = selectedDay ?? unlockedSteps[0]?.dayCount;
    if (!target) return undefined;
    return unlockedSteps.find((step) => step.dayCount === target);
  }, [selectedDay, unlockedSteps]);

  const selectedDateLabel = useMemo(() => {
    if (!eligibleStep) return null;
    if (!dashboard.anniversaryDate) return "Saved with today’s date";
    const anniversary = parseLocalDate(dashboard.anniversaryDate);
    if (Number.isNaN(anniversary.getTime())) return "Saved with today’s date";
    const achievedAt = new Date(anniversary);
    achievedAt.setDate(achievedAt.getDate() + eligibleStep.dayCount);
    return achievedAt.toLocaleDateString();
  }, [dashboard.anniversaryDate, eligibleStep]);

  const nextStep = useMemo(
    () => MILESTONE_STEPS.find((step) => step.dayCount > daysTogether),
    [daysTogether]
  );

  useEffect(() => {
    const paramDayRaw = Array.isArray(params.day) ? params.day[0] : params.day;
    const paramDay = paramDayRaw ? Number(paramDayRaw) : NaN;
    if (!Number.isNaN(paramDay)) {
      setSelectedDay(paramDay);
      if (isLockedSelection) {
        setShowStepPicker(false);
      }
      return;
    }
    if (unlockedSteps.length && selectedDay === null) {
      setSelectedDay(unlockedSteps[0].dayCount);
    }
  }, [params.day, unlockedSteps, selectedDay, isLockedSelection]);

  useEffect(() => {
    if (isLockedSelection && showStepPicker) {
      setShowStepPicker(false);
    }
  }, [isLockedSelection, showStepPicker]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("We need photo access to add a milestone image.");
      return;
    }
    const imageMediaType =
      ((ImagePicker as any)?.MediaType?.images as
        | ImagePicker.MediaType
        | undefined) ?? "images";
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [imageMediaType] as ImagePicker.MediaType[],
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!coupleId || !pairing.isPaired) {
      setError("Pair your account to start saving milestones.");
      return;
    }
    if (!eligibleStep) {
      setError("No milestone unlocked yet.");
      return;
    }
    if (!imageUri) {
      setError("Add a photo to celebrate this milestone.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      let achievedAt = now;
      if (dashboard.anniversaryDate) {
        const anniversary = parseLocalDate(dashboard.anniversaryDate);
        if (!Number.isNaN(anniversary.getTime())) {
          achievedAt = new Date(anniversary);
          achievedAt.setDate(
            achievedAt.getDate() + Math.max(0, eligibleStep.dayCount - 1)
          );
        }
      }
      await milestoneService.createMilestoneWithImage(coupleId, {
        title: eligibleStep.label,
        imageUri,
        achievedAt,
        dayCount: eligibleStep.dayCount,
      });
      router.replace("/gallery");
    } catch (err) {
      console.error("Failed to save milestone", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't save that milestone. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!pairing.isPaired) {
    return null;
  }

  return (
    <Screen scrollable={false} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: palette.card,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#00000025",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={palette.textSecondary}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <CuteText weight="bold" style={{ fontSize: 22 }}>
              Add a new milestone
            </CuteText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 20,
            paddingBottom: 160,
            gap: 16,
          }}
        >
          <View style={{ gap: 8 }}>
            <CuteText weight="semibold" style={{ fontSize: 14 }}>
              Add a photo*
            </CuteText>
            <Pressable
              onPress={handlePickImage}
              style={{
                height: 220,
                borderRadius: 28,
                borderWidth: imageUri ? 0 : 2,
                borderStyle: imageUri ? "solid" : "dashed",
                borderColor: `${palette.primary}80`,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.background,
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <View style={{ alignItems: "center", gap: 6 }}>
                  <MaterialIcons
                    name="add-a-photo"
                    size={34}
                    color={palette.primary}
                  />
                  <CuteText weight="semibold" style={{ color: palette.text }}>
                    Tap to upload a photo
                  </CuteText>
                  <CuteText tone="muted" style={{ fontSize: 12 }}>
                    A photo is required
                  </CuteText>
                </View>
              )}
            </Pressable>
            {error && !imageUri ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <MaterialIcons name="error" size={16} color="#D95C5C" />
                <CuteText style={{ color: "#D95C5C", fontSize: 12 }}>
                  {error}
                </CuteText>
              </View>
            ) : null}
          </View>

          <View style={{ gap: 12 }}>
            <View style={{ gap: 6 }}>
              <CuteText weight="semibold" style={{ fontSize: 14 }}>
                Milestone
              </CuteText>
              <View
                style={{
                  backgroundColor: palette.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: palette.primarySoft,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() => {
                    if (isLockedSelection) return;
                    setShowStepPicker((prev) => !prev);
                  }}
                  disabled={isLockedSelection}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    opacity: isLockedSelection ? 0.65 : 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <CuteText weight="bold" style={{ fontSize: 16 }}>
                      {eligibleStep
                        ? eligibleStep.label
                        : unlockedSteps.length
                        ? "Select milestone"
                        : "Milestone locked"}
                    </CuteText>
                    <CuteText tone="muted" style={{ fontSize: 13 }}>
                      {eligibleStep
                        ? selectedDateLabel ?? "We’ll timestamp this milestone."
                        : nextStep
                        ? `Unlocks at ${nextStep.label}`
                        : "You're all caught up on milestones!"}
                    </CuteText>
                  </View>
                  {!isLockedSelection ? (
                    <MaterialIcons
                      name={showStepPicker ? "expand-less" : "expand-more"}
                      size={22}
                      color={palette.textSecondary}
                    />
                  ) : null}
                </Pressable>
                {!isLockedSelection &&
                showStepPicker &&
                unlockedSteps.length ? (
                  <View style={{ maxHeight: 220 }}>
                    <ScrollView
                      showsVerticalScrollIndicator
                      contentContainerStyle={{ paddingVertical: 8 }}
                    >
                      {unlockedSteps.map((step) => {
                        const isSelected = selectedDay === step.dayCount;
                        return (
                          <Pressable
                            key={step.dayCount}
                            onPress={() => {
                              setSelectedDay(step.dayCount);
                              setShowStepPicker(false);
                            }}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 12,
                              backgroundColor: isSelected
                                ? `${palette.primary}12`
                                : "transparent",
                            }}
                          >
                            <MaterialIcons
                              name={
                                isSelected
                                  ? "radio-button-checked"
                                  : "radio-button-unchecked"
                              }
                              size={20}
                              color={palette.primary}
                            />
                            <CuteText weight="bold" style={{ fontSize: 14 }}>
                              {step.label}
                            </CuteText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </View>
            {error && imageUri ? (
              <CuteText style={{ fontSize: 13, color: "#D95C5C" }}>
                {error}
              </CuteText>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderColor: palette.primarySoft,
          backgroundColor: `${palette.background}F2`,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            borderRadius: 999,
            paddingVertical: 16,
            alignItems: "center",
            backgroundColor: palette.primary,
            opacity: saving ? 0.6 : 1,
            shadowColor: palette.primary,
            shadowOpacity: 0.25,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <CuteText style={{ color: "#fff", fontSize: 16 }} weight="bold">
            {saving ? "Saving..." : "Save milestone"}
          </CuteText>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          disabled={saving}
          style={{
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: palette.background,
            borderWidth: 1,
            borderColor: palette.primarySoft,
          }}
        >
          <CuteText weight="bold" style={{ color: palette.text }}>
            Cancel
          </CuteText>
        </Pressable>
      </View>
    </Screen>
  );
}
