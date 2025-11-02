import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { usePalette } from "../hooks/usePalette";

type CuteCardProps = {
  children: ReactNode;
  background?: string;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderColor?: string;
};

export const CuteCard = ({
  children,
  background,
  style,
  padding = 20,
  borderColor,
}: CuteCardProps) => {
  const colors = usePalette();
  return (
    <View
      style={[
        {
          borderRadius: 24,
          backgroundColor: background ?? colors.card,
          padding,
          shadowColor: "#00000011",
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor ?? "transparent",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
