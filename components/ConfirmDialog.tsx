import { useMemo } from "react";
import { View } from "react-native";

import { usePalette } from "../hooks/usePalette";
import { CuteButton } from "./CuteButton";
import { CuteModal } from "./CuteModal";
import { CuteText } from "./CuteText";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const palette = usePalette();

  const confirmStyle = useMemo(
    () => ({
      backgroundColor: destructive ? "#FFE7E7" : palette.primary,
      borderWidth: destructive ? 1 : 0,
      borderColor: destructive ? "#F5B5B5" : "transparent",
      flex: 1,
    }),
    [destructive, palette.primary]
  );

  const confirmLabelColor = destructive ? "#B42318" : "#fff";

  return (
    <CuteModal visible={visible} onRequestClose={onCancel} hideHandle>
      <View style={{ gap: 14 }}>
        <CuteText weight="bold" style={{ fontSize: 18, textAlign: "center" }}>
          {title}
        </CuteText>
        {message ? (
          <CuteText tone="muted" style={{ fontSize: 14, textAlign: "center" }}>
            {message}
          </CuteText>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <CuteButton
            label={cancelLabel}
            tone="ghost"
            onPress={onCancel}
            style={{ flex: 1, borderWidth: 1, borderColor: palette.border }}
          />
          <CuteButton
            label={confirmLabel}
            onPress={onConfirm}
            style={confirmStyle}
            labelColor={confirmLabelColor}
          />
        </View>
      </View>
    </CuteModal>
  );
};
