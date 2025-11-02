import { forwardRef } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";

import { usePalette } from "../hooks/usePalette";

type CuteTextInputProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const CuteTextInput = forwardRef<TextInput, CuteTextInputProps>(
  ({ label, containerStyle, style, ...rest }, ref) => {
    const colors = usePalette();
    return (
      <View style={[{ width: "100%", gap: 8 }, containerStyle]}>
        {label ? (
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            {
              width: "100%",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 16,
            },
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...rest}
        />
      </View>
    );
  }
);

CuteTextInput.displayName = "CuteTextInput";
