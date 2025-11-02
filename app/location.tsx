import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ImageBackground,
  Pressable,
  View,
  useColorScheme,
} from "react-native";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { useAppData } from "../context/AppDataContext";

export default function LiveLocationScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { pairing, profiles },
  } = useAppData();

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
          <MaterialIcons name="pin-drop" size={44} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to share live location
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Protect your privacy and share the journey only when both of you are
            connected.
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
    <Screen scrollable={false} style={{ flex: 1 }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL69651D7KdTO52dE0229yRW5jjguBicnlIUvgIZlfdKzoeuPAkuD1uGRrCkHGR0y2DJ1ILD0Q2B8_PzBnYuYx8xGfwldcmGrO-cVapnJndO5SnJZIRBzUt-7A3ap6jcSEdjSzNIGFlUBsgrDOVwNoL6llejdl7emX3GlMJg6EHqAXmJvJwNcj5jniIDWYzOOb-f44UTe5nuyXSbnKe4qEXpMgvZKZTYbGyT5cC400VoQXKUMzkQ2blzarwd_Qdvb2xDz5IoopV_3T",
          }}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 54,
            }}
          >
            <CuteCard
              background="#ffffffee"
              padding={14}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Pressable onPress={() => router.back()}>
                <MaterialIcons
                  name="arrow-back"
                  size={22}
                  color={palette.primary}
                />
              </Pressable>
              <View style={{ alignItems: "center" }}>
                <CuteText weight="bold">Live Location</CuteText>
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  Sharing for <CuteText weight="bold">25 mins</CuteText>
                </CuteText>
              </View>
              <View style={{ width: 24 }} />
            </CuteCard>
          </View>

          <View
            style={{
              position: "absolute",
              top: "28%",
              left: "18%",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffffdd",
                padding: 8,
                borderRadius: 999,
              }}
            >
            {profiles.me?.avatarUrl ? (
              <Image
                source={{ uri: profiles.me.avatarUrl }}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  borderWidth: 4,
                  borderColor: palette.primary,
                }}
              />
            ) : (
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  borderWidth: 4,
                  borderColor: palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: palette.primarySoft,
                }}
              >
                <MaterialIcons name="person" size={28} color={palette.primary} />
              </View>
            )}
              <View
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  backgroundColor: palette.primary,
                  borderRadius: 16,
                  padding: 6,
                }}
              >
                <MaterialIcons
                  name="favorite"
                  size={16}
                  color="#ffffff"
                />
              </View>
            </View>
            <CuteCard
              background="#ffffffdd"
              padding={10}
              style={{ marginTop: 10, alignItems: "center" }}
            >
            <CuteText weight="bold">{profiles.me?.displayName ?? "You"}</CuteText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons
                  name="battery-5-bar"
                  size={14}
                  color="#4caf50"
                />
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  98%
                </CuteText>
              </View>
            </CuteCard>
          </View>

          <View
            style={{
              position: "absolute",
              bottom: "38%",
              right: "18%",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffffdd",
                padding: 8,
                borderRadius: 999,
              }}
            >
            {profiles.partner?.avatarUrl ? (
              <Image
                source={{ uri: profiles.partner.avatarUrl }}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  borderWidth: 4,
                  borderColor: "#F5A623",
                }}
              />
            ) : (
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  borderWidth: 4,
                  borderColor: "#F5A623",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFE4E9",
                }}
              >
                <MaterialIcons name="person" size={28} color="#F5A623" />
              </View>
            )}
              <View
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  backgroundColor: "#F5A623",
                  borderRadius: 16,
                  padding: 6,
                }}
              >
                <MaterialIcons name="star" size={16} color="#ffffff" />
              </View>
            </View>
            <CuteCard
              background="#ffffffdd"
              padding={10}
              style={{ marginTop: 10, alignItems: "center" }}
            >
            <CuteText weight="bold">
              {profiles.partner?.displayName ?? "Partner"}
            </CuteText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons
                  name="battery-3-bar"
                  size={14}
                  color="#F5A623"
                />
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  64%
                </CuteText>
              </View>
            </CuteCard>
          </View>
        </ImageBackground>

        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 48,
              height: 4,
              borderRadius: 999,
              backgroundColor: palette.border,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />
          <CuteText weight="bold" style={{ fontSize: 20, marginBottom: 16 }}>
            Share for a set time
          </CuteText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {["15 min", "30 min", "1 hr"].map((duration, index) => {
              const isActive = index === 1;
              return (
                <Pressable
                  key={duration}
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    borderRadius: 18,
                    alignItems: "center",
                    backgroundColor: isActive
                      ? palette.primary
                      : palette.primarySoft,
                    shadowColor: isActive ? palette.primary : "transparent",
                    shadowOpacity: 0.35,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: isActive ? 6 : 0,
                  }}
                >
                  <CuteText
                    weight="bold"
                    style={{ color: isActive ? "#fff" : palette.primary }}
                  >
                    {duration}
                  </CuteText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={{
              marginTop: 20,
              borderRadius: 20,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              backgroundColor: palette.border,
            }}
          >
            <MaterialIcons name="stop-circle" size={24} color={palette.text} />
            <CuteText weight="bold">Stop sharing</CuteText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
