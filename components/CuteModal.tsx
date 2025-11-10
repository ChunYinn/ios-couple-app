import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { usePalette } from "../hooks/usePalette";
import { CuteText } from "./CuteText";

type CuteModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  fullScreen?: boolean;
  hideHandle?: boolean;
  enableSwipeDismiss?: boolean;
  respectTopInset?: boolean;
};

export const CuteModal = ({
  visible,
  onRequestClose,
  title,
  subtitle,
  children,
  contentStyle,
  fullScreen = false,
  hideHandle = false,
  enableSwipeDismiss = false,
  respectTopInset = false,
}: CuteModalProps) => {
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  const shouldEnableSwipe = enableSwipeDismiss && !fullScreen;

  useEffect(() => {
    if (!shouldEnableSwipe) {
      return;
    }
    if (visible) {
      translateY.setValue(0);
    }
  }, [shouldEnableSwipe, translateY, visible]);

  const panResponder = useMemo(() => {
    if (!shouldEnableSwipe) {
      return null;
    }
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 6,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.7) {
          Animated.timing(translateY, {
            toValue: 400,
            duration: 180,
            useNativeDriver: true,
          }).start(onRequestClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
    });
  }, [onRequestClose, shouldEnableSwipe, translateY]);

  const sheetHandlers = panResponder ? panResponder.panHandlers : undefined;

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
          justifyContent: fullScreen ? "flex-start" : "flex-end",
        }}
        onPress={onRequestClose}
      >
        <Animated.View
          style={{
            flex: fullScreen ? 1 : undefined,
            width: "100%",
            transform: shouldEnableSwipe ? [{ translateY }] : undefined,
          }}
          {...sheetHandlers}
        >
          <Pressable
            style={{
              flex: fullScreen ? 1 : undefined,
              width: "100%",
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <SafeAreaView
              edges={fullScreen ? ["top", "bottom"] : []}
              style={[
                {
                  backgroundColor: colors.card,
                  borderTopLeftRadius: fullScreen ? 0 : 28,
                  borderTopRightRadius: fullScreen ? 0 : 28,
                  paddingHorizontal: 20,
                  paddingTop: fullScreen ? 12 : 16,
                  paddingBottom: fullScreen ? 24 : 32,
                  gap: 16,
                  flex: fullScreen ? 1 : undefined,
                  marginTop:
                    fullScreen || !respectTopInset
                      ? 0
                      : Math.max(insets.top - 8, 0),
                },
                contentStyle,
              ]}
            >
              {!fullScreen && !hideHandle ? (
                <View
                  style={{
                    alignSelf: "center",
                    width: 42,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor: colors.border,
                  }}
                />
              ) : null}
              {title ? (
                <View
                  style={{
                    gap: 4,
                    marginTop: fullScreen ? 0 : 8,
                  }}
                >
                  <CuteText
                    weight="bold"
                    style={{
                      fontSize: 18,
                      textAlign: fullScreen ? "left" : "center",
                    }}
                  >
                    {title}
                  </CuteText>
                  {subtitle ? (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 13,
                        textAlign: fullScreen ? "left" : "center",
                      }}
                    >
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {children}
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
