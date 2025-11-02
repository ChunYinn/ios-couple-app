import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";

const favorites = [
  { id: "song", title: "Song of the Week", detail: "“Bright” – Echosmith" },
  { id: "date", title: "Date Night Idea", detail: "Stargazing picnic in the park" },
  { id: "quote", title: "Love Note", detail: "“You’re my favorite notification.”" },
];

export default function FavoritesScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 18,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <CuteText weight="bold" style={{ fontSize: 24 }}>
        Shared Favorites
      </CuteText>
      {favorites.map((item) => (
        <CuteCard key={item.id} background={palette.card} padding={20} style={{ gap: 10 }}>
          <CuteText weight="bold">{item.title}</CuteText>
          <CuteText tone="muted">{item.detail}</CuteText>
        </CuteCard>
      ))}
    </Screen>
  );
}
