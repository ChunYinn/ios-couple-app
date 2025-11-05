import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme, Platform, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { CuteButton } from "../../components/CuteButton";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";
import { coupleService } from "../../firebase/services";
import {
  formatDateToYMD,
  parseLocalDate,
  calculateDaysTogether,
  formatDaysText
} from "../../utils/dateUtils";

export default function AnniversaryScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { dashboard, auth },
    dispatch,
  } = useAppData();

  const [anniversary, setAnniversary] = useState(
    dashboard.anniversaryDate ? formatDateToYMD(dashboard.anniversaryDate) : ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    anniversary ? parseLocalDate(anniversary) : new Date()
  );

  const handleSave = async () => {
    const trimmed = anniversary.trim();
    if (!trimmed) {
      setErrorMessage("Enter a date in YYYY-MM-DD format.");
      return;
    }
    const parsed = parseLocalDate(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      setErrorMessage("That didn't look like a real date. Try again.");
      return;
    }
    if (!auth.user.coupleId) {
      setErrorMessage("Pair your account first to set the anniversary.");
      return;
    }
    const days = calculateDaysTogether(parsed);
    try {
      setIsSaving(true);
      await coupleService.setAnniversary(auth.user.coupleId, trimmed);
      dispatch({
        type: "SET_ANNIVERSARY",
        payload: {
          anniversaryDate: trimmed,
          daysTogether: days,
        },
      });
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to set anniversary", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't save that date. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!auth.user.coupleId) {
      dispatch({
        type: "SET_ANNIVERSARY",
        payload: { anniversaryDate: "", daysTogether: 0 },
      });
      return;
    }
    try {
      setIsSaving(true);
      await coupleService.setAnniversary(auth.user.coupleId, null);
      dispatch({
        type: "SET_ANNIVERSARY",
        payload: { anniversaryDate: "", daysTogether: 0 },
      });
      setAnniversary("");
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to skip anniversary", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't clear the anniversary right now."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 24,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ gap: 12 }}>
        <CuteText tone="muted" style={{ fontSize: 12 }}>
          Step 3 of 3
        </CuteText>
        <CuteText weight="bold" style={{ fontSize: 26 }}>
          Set your anniversary
        </CuteText>
        <CuteText tone="muted">
          Celebrate your journey together - we'll track your days as a couple.
        </CuteText>
      </View>

      <View style={{ gap: 16 }}>
        <View style={{ gap: 8 }}>
          <CuteText weight="bold">Anniversary Date</CuteText>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderRadius: 12,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <CuteText style={{ flex: 1 }}>
              {anniversary || "Select a date"}
            </CuteText>
            <MaterialIcons
              name="calendar-today"
              size={20}
              color={palette.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, date) => {
              setShowDatePicker(Platform.OS === "android");
              if (date) {
                setSelectedDate(date);
                setAnniversary(formatDateToYMD(date.toISOString()));
                setErrorMessage(null);
              }
            }}
            maximumDate={new Date()} // Can't select future dates
          />
        )}

        <CuteCardPreview anniversary={anniversary} paletteAccent={palette.primary} />
        {errorMessage ? (
          <CuteText tone="muted" style={{ color: palette.primary, fontSize: 12 }}>
            {errorMessage}
          </CuteText>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <CuteButton
          label={isSaving ? "Saving..." : "Save"}
          onPress={handleSave}
          disabled={!anniversary.trim() || isSaving}
        />
        <CuteButton
          label="Skip for now"
          tone="ghost"
          onPress={handleSkip}
          disabled={isSaving}
        />
      </View>
    </Screen>
  );
}

const CuteCardPreview = ({
  anniversary,
  paletteAccent,
}: {
  anniversary: string;
  paletteAccent: string;
}) => {
  const parsed = anniversary ? parseLocalDate(anniversary) : null;
  const days = parsed && !Number.isNaN(parsed.getTime())
    ? calculateDaysTogether(parsed)
    : 0;

  // Display the date in YYYY-MM-DD format
  const previewLabel = anniversary ? formatDateToYMD(anniversary) : "Choose a date";

  // Show "Days together" with proper formatting (singular/plural)
  const previewDays = formatDaysText(days);
  return (
    <View
      style={{
        borderRadius: 24,
        padding: 18,
        backgroundColor: paletteAccent + "22",
        borderWidth: 1,
        borderColor: paletteAccent,
        gap: 6,
      }}
    >
      <CuteText tone="muted" style={{ fontSize: 13 }}>
        {previewLabel}
      </CuteText>
      <CuteText weight="bold" style={{ fontSize: 24 }}>
        {previewDays}
      </CuteText>
    </View>
  );
};
