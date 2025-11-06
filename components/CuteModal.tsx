import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  View,
  StyleProp,
  ViewStyle,
  Text,
} from "react-native";

import { usePalette } from "../hooks/usePalette";
import { CuteText } from "./CuteText";

type CuteModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export const CuteModal = ({
  visible,
  onRequestClose,
  title,
  subtitle,
  children,
  contentStyle,
}: CuteModalProps) => {
  const colors = usePalette();

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "#1f172244",
          justifyContent: "flex-end",
        }}
        onPress={onRequestClose}
      >
        <Pressable
          style={[
            {
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 32,
              gap: 16,
            },
            contentStyle,
          ]}
          onPress={(event) => event.stopPropagation()}
        >
          <View
            style={{
              alignSelf: "center",
              width: 42,
              height: 4,
              borderRadius: 999,
              backgroundColor: colors.border,
            }}
          />
          {title ? (
            <View style={{ gap: 4, marginTop: 8 }}>
              <CuteText
                weight="bold"
                style={{ fontSize: 18, textAlign: "center" }}
              >
                {title}
              </CuteText>
              {subtitle ? (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
