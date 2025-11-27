import DateTimePicker, {
  DateTimePickerEvent,
  IOSNativeProps,
} from "@react-native-community/datetimepicker";
import type { ComponentProps } from "react";
import { Platform, useColorScheme } from "react-native";

import { usePalette } from "../hooks/usePalette";

type AllowedDisplay =
  | "default"
  | "spinner"
  | "calendar"
  | "clock"
  | "compact"
  | "inline";

export type AppDatePickerProps = {
  value: Date;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  mode?: "date" | "time" | "datetime";
  display?: AllowedDisplay;
  minimumDate?: Date;
  maximumDate?: Date;
};
export type { DateTimePickerEvent };

export const AppDatePicker = ({
  display,
  mode,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: AppDatePickerProps) => {
  const palette = usePalette();
  const scheme = useColorScheme();

  const resolvedDisplay =
    display ?? (Platform.OS === "ios" ? "spinner" : "calendar");
  const resolvedMode = mode ?? "date";

  const iosProps: Partial<IOSNativeProps> =
    Platform.OS === "ios"
      ? {
          themeVariant: scheme === "dark" ? "dark" : "light",
          textColor: palette.text,
          accentColor: palette.primary,
        }
      : {};

  const pickerProps = {
    ...iosProps,
    value,
    onChange,
    minimumDate,
    maximumDate,
    display: resolvedDisplay,
    mode: resolvedMode,
  };

  return (
    <DateTimePicker
      {...(pickerProps as ComponentProps<typeof DateTimePicker>)}
    />
  );
};
