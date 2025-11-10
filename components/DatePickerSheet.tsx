import { ReactNode } from "react";
import { Pressable } from "react-native";

import {
  AppDatePicker,
  AppDatePickerProps,
} from "./AppDatePicker";
import { CuteModal } from "./CuteModal";
import { CuteText } from "./CuteText";
import { CuteButton } from "./CuteButton";
import { usePalette } from "../hooks/usePalette";

type SecondaryAction = {
  label: string;
  onPress: () => void;
};

type DatePickerSheetProps = {
  visible: boolean;
  onRequestClose: () => void;
  title: string;
  subtitle?: string;
  value: Date;
  onChange: AppDatePickerProps["onChange"];
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  mode?: AppDatePickerProps["mode"];
  display?: AppDatePickerProps["display"];
  minimumDate?: AppDatePickerProps["minimumDate"];
  maximumDate?: AppDatePickerProps["maximumDate"];
  footer?: ReactNode;
  secondaryAction?: SecondaryAction;
};

export const DatePickerSheet = ({
  visible,
  onRequestClose,
  title,
  subtitle,
  value,
  onChange,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  loading,
  mode = "date",
  display,
  minimumDate,
  maximumDate,
  footer,
  secondaryAction,
}: DatePickerSheetProps) => {
  const palette = usePalette();
  const buttonLabel = loading
    ? "Saving..."
    : confirmLabel ?? "Save date";

  return (
    <CuteModal
      visible={visible}
      onRequestClose={onRequestClose}
      title={title}
      subtitle={subtitle}
      contentStyle={{
        alignItems: "center",
        gap: 16,
        paddingBottom: 24,
      }}
    >
      <AppDatePicker
        value={value}
        onChange={onChange}
        mode={mode}
        display={display}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
      {footer}
      <CuteButton
        label={buttonLabel}
        onPress={onConfirm}
        disabled={Boolean(loading || confirmDisabled)}
        style={{ alignSelf: "stretch" }}
      />
      {secondaryAction ? (
        <Pressable onPress={secondaryAction.onPress}>
          <CuteText
            weight="semibold"
            style={{ color: palette.textSecondary }}
          >
            {secondaryAction.label}
          </CuteText>
        </Pressable>
      ) : null}
    </CuteModal>
  );
};
