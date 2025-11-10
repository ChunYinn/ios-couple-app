import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Image, Pressable, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";
import { milestoneService } from "../../firebase/services";
import { formatDateToYMD, parseLocalDate } from "../../utils/dateUtils";

export default function NewMilestoneScreen() {
  const palette = usePalette();
  const {
    state: { pairing, auth, dashboard },
  } = useAppData();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coupleId = auth.user.coupleId;
  const today = useMemo(() => new Date(), []);
  const formattedToday = useMemo(
    () => formatDateToYMD(today.toISOString()),
    [today]
  );
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
      Math.floor((today.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [dashboard.anniversaryDate, today]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("We need photo access to add a milestone image.");
      return;
    }
    const imageMediaType =
      (ImagePicker as any)?.MediaType?.images ??
      ImagePicker.MediaTypeOptions.Images;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaType,
      allowsMultipleSelection: false,
      quality: 0.85,
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
    if (!imageUri) {
      setError("Add a photo to make this milestone pop.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle.length) {
      setError("Give this milestone a short name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      let dayCount = computedDayCount;
      if (!dayCount && dashboard.anniversaryDate) {
        const anniversary = parseLocalDate(dashboard.anniversaryDate);
        if (!Number.isNaN(anniversary.getTime())) {
          dayCount = Math.max(
            0,
            Math.floor((now.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24))
          );
        }
      }
      await milestoneService.createMilestoneWithImage(coupleId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        imageUri,
        achievedAt: now,
        dayCount,
      });
      router.replace("/(tabs)/gallery");
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
          <MaterialIcons name="lock" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to add milestones
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Connect with your partner to start sharing milestone stories.
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
        paddingBottom: 32,
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
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <MaterialIcons
            name="arrow-back-ios"
            size={20}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          New Milestone
        </CuteText>
        <View style={{ width: 24 }} />
      </View>

      <Pressable
        onPress={handlePickImage}
        style={{
          height: 220,
          borderRadius: 28,
          borderWidth: imageUri ? 0 : 2,
          borderStyle: imageUri ? "solid" : "dashed",
          borderColor: palette.primary,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.card,
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <MaterialIcons
              name="add-a-photo"
              size={30}
              color={palette.primary}
            />
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Tap to add a cover photo
            </CuteText>
          </View>
        )}
      </Pressable>

      <View style={{ gap: 14 }}>
        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: palette.primarySoft,
          }}
        >
          <TextInput
            placeholder="Milestone name (e.g. 500 days together)"
            placeholderTextColor={palette.textSecondary}
            value={title}
            onChangeText={setTitle}
            style={{
              fontSize: 16,
              paddingVertical: 10,
              color: palette.text,
            }}
          />
        </View>
        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: palette.primarySoft,
          }}
        >
          <TextInput
            placeholder="What made this moment special?"
            placeholderTextColor={palette.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            style={{
              fontSize: 15,
              paddingVertical: 10,
              minHeight: 60,
              color: palette.text,
              textAlignVertical: "top",
            }}
          />
        </View>
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.primarySoft,
            backgroundColor: palette.card,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 4,
          }}
        >
          <CuteText tone="muted" style={{ fontSize: 12 }}>
            Captured automatically
          </CuteText>
          <CuteText weight="semibold">{formattedToday}</CuteText>
          {computedDayCount !== undefined ? (
            <CuteText tone="muted" style={{ fontSize: 12 }}>
              {computedDayCount} days since your anniversary
            </CuteText>
          ) : (
            <CuteText tone="muted" style={{ fontSize: 12 }}>
              We'll sync this milestone with today's date and your anniversary.
            </CuteText>
          )}
        </View>
        {error ? (
          <CuteText style={{ fontSize: 13, color: palette.primary }}>
            {error}
          </CuteText>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: "center",
            backgroundColor: palette.primary,
            opacity: saving ? 0.6 : 1,
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
            backgroundColor: palette.card,
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
