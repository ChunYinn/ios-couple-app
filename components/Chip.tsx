import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { usePalette } from "../hooks/usePalette";
import { CuteText } from "./CuteText";

type ChipProps = {
  label: string;
  leading?: ReactNode;
  tone?: "primary" | "secondary" | "neutral";
  style?: StyleProp<ViewStyle>;
};

export const Chip = ({ label, leading, tone = "primary", style }: ChipProps) => {
  const colors = usePalette();

  const background =
    tone === "primary"
      ? colors.primary
      : tone === "secondary"
        ? colors.secondary
        : colors.backgroundMuted;

  const textColor =
    tone === "primary" || tone === "secondary"
      ? "#ffffff"
      : colors.textSecondary;

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {leading}
      <CuteText
        weight="semibold"
        style={{
          color: textColor,
          fontSize: 13,
        }}
      >
        {label}
      </CuteText>
    </View>
  );
};
