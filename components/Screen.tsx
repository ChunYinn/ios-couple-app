import { ReactNode } from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePalette } from "../hooks/usePalette";

type ScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  canScrollContent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export const Screen = ({
  children,
  scrollable = true,
  canScrollContent = true,
  contentContainerStyle,
  style,
}: ScreenProps) => {
  const colors = usePalette();

  if (!scrollable) {
    return (
      <SafeAreaView
        style={[
          {
            flex: 1,
            backgroundColor: colors.background,
          },
          style,
        ]}
      >
        {children}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <ScrollView
        bounces={canScrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingBottom: 120,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};
