import { Text as RNText, TextProps as RNTextProps } from "react-native";

import { usePalette } from "../hooks/usePalette";

type Weight = "regular" | "medium" | "semibold" | "bold";
type Tone = "default" | "muted" | "accent";

type CuteTextProps = RNTextProps & {
  weight?: Weight;
  tone?: Tone;
};

const weightMap: Record<Weight, string | undefined> = {
  regular: undefined,
  medium: "600",
  semibold: "700",
  bold: "800",
};

export const CuteText = ({
  children,
  weight = "regular",
  tone = "default",
  style,
  ...rest
}: CuteTextProps) => {
  const colors = usePalette();
  const toneColor =
    tone === "muted"
      ? colors.textSecondary
      : tone === "accent"
        ? colors.primary
        : colors.text;

  return (
    <RNText
      style={[
        {
          color: toneColor,
          fontWeight: weightMap[weight],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};
