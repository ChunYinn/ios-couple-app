import { ReactNode } from "react";
import { View } from "react-native";

import { CuteText } from "./CuteText";
import { usePalette } from "../hooks/usePalette";

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
  description?: string;
};

export const SectionHeader = ({
  title,
  action,
  description,
}: SectionHeaderProps) => {
  const colors = usePalette();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: description ? 6 : 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          {title}
        </CuteText>
        {description ? (
          <CuteText
            tone="muted"
            style={{
              marginTop: 4,
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            {description}
          </CuteText>
        ) : null}
      </View>
      {action}
    </View>
  );
};
