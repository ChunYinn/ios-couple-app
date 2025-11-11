import { MaterialIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Platform } from "react-native";

import { useAppData } from "../../context/AppDataContext";
import { usePalette } from "../../hooks/usePalette";

export default function TabLayout() {
  const colors = usePalette();
  const router = useRouter();
  const {
    state: { pairing, chat },
  } = useAppData();
  const chatBadge =
    chat.unreadCount > 0 ? chat.unreadCount.toString() : undefined;
  const guardTabPress = (requiresPair: boolean) => ({
    tabPress: (event: { preventDefault(): void }) => {
      if (requiresPair && !pairing.isPaired) {
        event.preventDefault();
        router.push("/pairing");
      }
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: Platform.select({ ios: 88, android: 70, default: 70 }),
          paddingBottom: Platform.select({ ios: 26, android: 14, default: 16 }),
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        listeners={guardTabPress(true)}
        options={{
          title: "Chat",
          tabBarBadge: chatBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: "#fff",
            fontWeight: "700",
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        listeners={guardTabPress(true)}
        options={{
          title: "Milestones",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        listeners={guardTabPress(true)}
        options={{
          title: "To-dos",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list-alt" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
