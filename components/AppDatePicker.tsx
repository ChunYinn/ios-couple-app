import DateTimePicker, {
  DateTimePickerEvent,
  IOSNativeProps,
} from "@react-native-community/datetimepicker";
import type { ComponentProps } from "react";
import { Platform, useColorScheme } from "react-native";

import { usePalette } from "../hooks/usePalette";

type NativeProps = ComponentProps<typeof DateTimePicker>;

export type AppDatePickerProps = NativeProps;
export type { DateTimePickerEvent };

export const AppDatePicker = ({
  display,
  ...rest
}: AppDatePickerProps) => {
  const palette = usePalette();
  const scheme = useColorScheme();

  const resolvedDisplay =
    display ?? (Platform.OS === "ios" ? "spinner" : "calendar");

  const iosProps: Partial<IOSNativeProps> =
    Platform.OS === "ios"
      ? {
          themeVariant: scheme === "dark" ? "dark" : "light",
          textColor: palette.text,
          accentColor: palette.primary,
        }
      : {};

  return (
    <DateTimePicker
      {...rest}
      {...iosProps}
      display={resolvedDisplay}
    />
  );
};
