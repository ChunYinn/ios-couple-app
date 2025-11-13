import { ReactNode } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  Text,
  ViewStyle,
} from "react-native";

import { usePalette } from "../hooks/usePalette";

type Tone = "primary" | "secondary" | "ghost";

type CuteButtonProps = PressableProps & {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelColor?: string;
};

export const CuteButton = ({
  label,
  tone = "primary",
  icon,
  style,
  labelColor,
  disabled,
  ...rest
}: CuteButtonProps) => {
  const colors = usePalette();

  const background =
    tone === "primary"
      ? colors.primary
      : tone === "secondary"
        ? colors.primarySoft
        : "transparent";

  const textColor =
    tone === "primary"
      ? "#ffffff"
      : tone === "secondary"
        ? colors.primary
        : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: 999,
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: background,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      {icon}
      <Text
        style={{
          color: labelColor ?? textColor,
          fontWeight: "700",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};
