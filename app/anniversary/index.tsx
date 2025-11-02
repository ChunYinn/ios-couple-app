import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme } from "react-native";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { CuteTextInput } from "../../components/CuteTextInput";
import { CuteButton } from "../../components/CuteButton";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";

const msPerDay = 1000 * 60 * 60 * 24;

const calculateDaysTogether = (anniversary: Date) => {
  const today = new Date();
  const diffMs = today.setHours(0, 0, 0, 0) - anniversary.setHours(0, 0, 0, 0);
  return diffMs > 0 ? Math.floor(diffMs / msPerDay) + 1 : 0;
};

export default function AnniversaryScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { dashboard },
    dispatch,
  } = useAppData();

  const [anniversary, setAnniversary] = useState(
    dashboard.anniversaryDate ?? ""
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = anniversary.trim();
    if (!trimmed) {
      setErrorMessage("Enter a date in YYYY-MM-DD format.");
      return;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      setErrorMessage("That didn't look like a real date. Try again.");
      return;
    }
    const days = calculateDaysTogether(parsed);
    dispatch({
      type: "SET_ANNIVERSARY",
      payload: {
        anniversaryDate: trimmed,
        daysTogether: days,
      },
    });
    // Placeholder for badge scheduling once notifications are wired.
    console.log("Set badge count to", days);
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
          Set your Day 0
        </CuteText>
        <CuteText tone="muted">
          Pick the moment everything began. We’ll handle the daily badge magic.
        </CuteText>
      </View>

      <View style={{ gap: 16 }}>
        <CuteTextInput
          label="Anniversary"
          placeholder="YYYY-MM-DD"
          value={anniversary}
          onChangeText={(value) => {
            setAnniversary(value);
            setErrorMessage(null);
          }}
        />
        <CuteCardPreview anniversary={anniversary} paletteAccent={palette.primary} />
        {errorMessage ? (
          <CuteText tone="muted" style={{ color: palette.primary, fontSize: 12 }}>
            {errorMessage}
          </CuteText>
        ) : null}
      </View>

      <View style={{ gap: 12 }}>
        <CuteButton label="Save" onPress={handleSave} disabled={!anniversary.trim()} />
        <CuteButton
          label="Skip for now"
          tone="ghost"
          onPress={() => dispatch({
            type: "SET_ANNIVERSARY",
            payload: { anniversaryDate: "", daysTogether: 0 },
          })}
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
  const parsed = anniversary ? new Date(anniversary) : null;
  const days = parsed && !Number.isNaN(parsed.getTime())
    ? calculateDaysTogether(parsed)
    : 0;
  const previewLabel = anniversary ? `${anniversary}` : "Choose a date";
  const previewDays = days > 0 ? `${days.toLocaleString()} days` : "Day counter";
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
