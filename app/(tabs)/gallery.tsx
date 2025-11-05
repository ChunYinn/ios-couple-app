import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import { useMemo, useState } from "react";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { CuteCard } from "../../components/CuteCard";
import { useAppData } from "../../context/AppDataContext";

const filters = ["All", "Favorites", "Videos", "Photos"] as const;

export default function SharedGalleryScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { gallery, pairing },
  } = useAppData();
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case "Favorites":
        return gallery.items.filter((item) => item.favorite);
      case "Videos":
        return gallery.items.filter((item) => item.type === "video");
      case "Photos":
        return gallery.items.filter((item) => item.type === "photo");
      default:
        return gallery.items;
    }
  }, [activeFilter, gallery.items]);

  if (!pairing.isPaired) {
    return (
      <Screen scrollable={false}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 16,
          }}
        >
          <MaterialIcons name="photo-library" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock memories
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Once you’re paired, your shared gallery will wrap every photo in soft
            frames and flashbacks.
          </CuteText>
          <Pressable
            onPress={() => router.push("/pairing")}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
              backgroundColor: palette.primary,
            }}
          >
            <CuteText style={{ color: "#fff" }} weight="bold">
              Pair now
            </CuteText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 24,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 6, marginLeft: -6 }}
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={20}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20, color: palette.primary }}>
          Memories
        </CuteText>
        <Pressable
          style={{
            padding: 10,
            borderRadius: 999,
            backgroundColor: palette.primarySoft,
          }}
        >
          <MaterialIcons
            name="add-a-photo"
            size={22}
            color={palette.primary}
          />
        </Pressable>
      </View>

      <View>
        <CuteText weight="bold" style={{ fontSize: 22, marginBottom: 10 }}>
          On This Day...
        </CuteText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 16,
          }}
        >
          {gallery.flashbacks.map((flashback) => (
            <Pressable
              key={flashback.id}
              style={{
                width: 220,
                borderRadius: 24,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <ImageBackground
                source={{ uri: flashback.image }}
                style={{
                  width: "100%",
                  height: 140,
                  justifyContent: "flex-end",
                  padding: 16,
                }}
                imageStyle={{ borderRadius: 24 }}
              >
                <CuteText weight="bold" style={{ color: "#fff", fontSize: 18 }}>
                  {flashback.title}
                </CuteText>
                <CuteText style={{ color: "#fff", fontSize: 13 }}>
                  {flashback.subtitle}
                </CuteText>
              </ImageBackground>
            </Pressable>
          ))}
          {!gallery.flashbacks.length ? (
            <CuteCard
              background={palette.card}
              padding={20}
              style={{ width: 220, gap: 10 }}
            >
              <MaterialIcons
                name="photo-camera"
                size={32}
                color={palette.primary}
              />
              <CuteText weight="bold">Flashbacks will appear here</CuteText>
              <CuteText tone="muted" style={{ fontSize: 13 }}>
                Add memories with dates to relive them on anniversaries and special days.
              </CuteText>
            </CuteCard>
          ) : null}
        </ScrollView>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 10,
        }}
      >
        {filters.map((filter) => {
          const isActive = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={{
                backgroundColor: isActive
                  ? palette.primary
                  : palette.primarySoft,
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {filter === "Favorites" && (
                <MaterialIcons
                  name="favorite"
                  size={16}
                  color={isActive ? "#fff" : palette.primary}
                />
              )}
              {filter === "Videos" && (
                <MaterialIcons
                  name="movie"
                  size={16}
                  color={isActive ? "#fff" : palette.primary}
                />
              )}
              <CuteText
                weight="semibold"
                style={{
                  color: isActive ? "#fff" : palette.primary,
                }}
              >
                {filter}
              </CuteText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          rowGap: 14,
        }}
      >
        {filteredItems.map((item, index) => (
          <CuteCard
            key={item.id}
            padding={0}
            style={{
              width: "48%",
              overflow: "hidden",
              transform: [{ rotate: `${(index % 3) - 1}deg` }],
            }}
          >
            <ImageBackground
              source={{ uri: item.image }}
              imageStyle={{ borderRadius: 24 }}
              style={{
                width: "100%",
                aspectRatio: 1,
                borderRadius: 24,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.type === "video" ? (
                <MaterialIcons
                  name="play-circle"
                  size={54}
                  color="#ffffffdd"
                />
              ) : null}
              {item.favorite ? (
                <MaterialIcons
                  name="favorite"
                  size={26}
                  color="#ff8fab"
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    shadowColor: "#00000055",
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                  }}
                />
              ) : null}
            </ImageBackground>
          </CuteCard>
        ))}
        {!filteredItems.length ? (
          <CuteCard
            background={palette.card}
            padding={24}
            style={{ alignItems: "center", gap: 12, width: "100%" }}
          >
            <MaterialIcons
              name="photo-library"
              size={42}
              color={palette.primary}
            />
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              No memories yet
            </CuteText>
            <CuteText tone="muted" style={{ textAlign: "center", fontSize: 13 }}>
              Switch filters or add a new memory to fill this gallery.
            </CuteText>
          </CuteCard>
        ) : null}
      </View>
    </Screen>
  );
}
