import { MaterialIcons } from "@expo/vector-icons";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePalette } from "../hooks/usePalette";
import { CuteText } from "../components/CuteText";

type ToastTone = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
};

type Toast = ToastOptions & { id: string };

type ToastContextValue = {
  showToast: (toast: ToastOptions) => string;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneMap: Record<
  ToastTone,
  { icon: keyof typeof MaterialIcons.glyphMap; colorKey: keyof ReturnType<typeof usePalette> }
> = {
  success: { icon: "check-circle", colorKey: "accent" },
  error: { icon: "error", colorKey: "accent" },
  info: { icon: "info", colorKey: "primary" },
  warning: { icon: "warning-amber", colorKey: "accent" },
};

const ToastCard = ({
  toast,
  onHide,
  index,
}: {
  toast: Toast;
  onHide: (id: string) => void;
  index: number;
}) => {
  const palette = usePalette();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const tone = toast.tone ?? "info";
  const toneMeta = toneMap[tone];
  const color = palette[toneMeta.colorKey] ?? palette.primary;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 12,
        mass: 0.9,
        stiffness: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => onHide(toast.id));
    }, toast.durationMs ?? 3200);

    return () => clearTimeout(timer);
  }, [opacity, translateY, toast.durationMs, toast.id, onHide]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: `${palette.card}F5`,
          borderColor: `${color}80`,
          shadowColor: palette.primary,
          opacity,
          transform: [{ translateY }],
          marginBottom: index === 0 ? 0 : 10,
        },
      ]}
    >
      <MaterialIcons name={toneMeta.icon} size={18} color={color} />
      <View style={{ flex: 1 }}>
        {toast.title ? (
          <CuteText weight="bold" style={{ color: palette.text, fontSize: 14 }}>
            {toast.title}
          </CuteText>
        ) : null}
        <CuteText style={{ color: palette.text, fontSize: 13 }}>
          {toast.message}
        </CuteText>
      </View>
    </Animated.View>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((toast: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        {toasts
          .slice(-3)
          .reverse()
          .map((toast, idx) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onHide={hideToast}
              index={idx}
            />
          ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  } as ViewStyle,
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: "80%",
    maxWidth: "94%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  } as ViewStyle,
});
