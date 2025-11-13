import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { usePalette } from "../hooks/usePalette";
import { getRelativeLuminance } from "../utils/color";
import { CuteText } from "./CuteText";

type ChipProps = {
  label: string;
  leading?: ReactNode;
  tone?: "primary" | "secondary" | "neutral";
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
};

export const Chip = ({
  label,
  leading,
  tone = "primary",
  style,
  backgroundColor,
  textColor,
}: ChipProps) => {
  const colors = usePalette();

  const resolvedBackground =
    backgroundColor ??
    (tone === "primary"
      ? colors.primary
      : tone === "secondary"
        ? colors.secondary
        : colors.backgroundMuted);

  const resolvedTextColor =
    textColor ??
    (backgroundColor != null
      ? getRelativeLuminance(resolvedBackground) > 0.55
        ? colors.text
        : "#ffffff"
      : tone === "primary" || tone === "secondary"
        ? "#ffffff"
        : colors.textSecondary);

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
          backgroundColor: resolvedBackground,
        },
        style,
      ]}
    >
      {leading}
      <CuteText
        weight="semibold"
        style={{
          color: resolvedTextColor,
          fontSize: 13,
        }}
      >
        {label}
      </CuteText>
    </View>
  );
};
