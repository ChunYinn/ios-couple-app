import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback } from "react";
import {
  FlatList,
  ImageBackground,
  ListRenderItem,
  Pressable,
  View,
  useColorScheme,
} from "react-native";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";
import { CuteCard } from "../../components/CuteCard";
import { Milestone } from "../../types/app";

const ACCENT_CARD_COLORS = ["#FFD9E8", "#D6F0FF", "#FFF5D6", "#D9FFE8"];

export default function MilestoneArchiveScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { milestones, pairing },
  } = useAppData();

  const renderMilestoneItem = useCallback<ListRenderItem<Milestone>>(
    ({ item, index }) => {
      const hasImage = Boolean(item.image);
      const fallbackColor = ACCENT_CARD_COLORS[index % ACCENT_CARD_COLORS.length];

      const overlay = (
        <LinearGradient
          colors={
            hasImage
              ? ["#00000090", "#00000040", "#000000C0"]
              : ["#ffffff00", "#ffffffaa"]
          }
          style={{
            flex: 1,
            justifyContent: "flex-end",
            padding: 16,
          }}
        >
          <View style={{ gap: 6 }}>
            <CuteText
              weight="bold"
              style={{
                color: hasImage ? "#ffffff" : palette.text,
                fontSize: 16,
              }}
              numberOfLines={2}
            >
              {item.title}
            </CuteText>
            {item.dayCount ? (
              <CuteText
                tone="muted"
                style={{
                  fontSize: 12,
                  color: hasImage ? "#ffffff" : palette.textSecondary,
                }}
              >
                {item.dayCount} days
              </CuteText>
            ) : null}
          </View>
        </LinearGradient>
      );

      return (
        <Pressable
          onPress={() => router.push(`/milestone/${item.id}`)}
          style={{
            width: "48%",
            aspectRatio: 3 / 4,
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: hasImage ? palette.card : fallbackColor,
            shadowColor: "#00000025",
            shadowOpacity: 0.18,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          {hasImage ? (
            <ImageBackground
              source={{ uri: item.image! }}
              style={{ flex: 1 }}
              resizeMode="cover"
            >
              {overlay}
            </ImageBackground>
          ) : (
            <View style={{ flex: 1 }}>{overlay}</View>
          )}
        </Pressable>
      );
    },
    [palette.card, palette.text, palette.textSecondary]
  );

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
          <MaterialIcons name="auto-awesome" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock milestones
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Once you both connect, you can create looping highlight reels for
            every special moment.
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

  const handleBack = () => {
    try {
      router.back();
    } catch {
      router.push("/");
    }
  };

  return (
    <Screen scrollable={false} style={{ flex: 1 }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Pressable
            onPress={handleBack}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: palette.card,
              borderWidth: 1,
              borderColor: palette.border,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#00000015",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={20} color={palette.text} />
          </Pressable>
          <View style={{ gap: 4, flex: 1 }}>
            <CuteText weight="bold" style={{ fontSize: 26 }}>
              Our Milestones
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              An archive of our most cherished moments.
            </CuteText>
          </View>
          <Pressable
            onPress={() => router.push("/milestone/new")}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: palette.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Add milestone"
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {milestones.length ? (
          <FlatList
            data={milestones}
            keyExtractor={(item) => item.id}
            renderItem={renderMilestoneItem}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: 20,
              paddingBottom: 100,
              gap: 14,
            }}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          />
        ) : (
          <CuteCard
            background={palette.card}
            padding={24}
            style={{ gap: 12, marginTop: 24 }}
          >
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              No milestones yet
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Tap the star button above to add your first big moment — photos
              only for now, so choose your favorite shot.
            </CuteText>
            <Pressable
              onPress={() => router.push("/milestone/new")}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: palette.primary,
              }}
            >
              <CuteText style={{ color: "#fff" }} weight="semibold">
                Add milestone
              </CuteText>
            </Pressable>
          </CuteCard>
        )}
      </View>
    </Screen>
  );
}
