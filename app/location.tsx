import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, ImageBackground, Pressable, View, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as ExpoLocation from "expo-location";

import { Screen } from "../components/Screen";
import { CuteText } from "../components/CuteText";
import { usePalette } from "../hooks/usePalette";
import { CuteCard } from "../components/CuteCard";
import { useAppData } from "../context/AppDataContext";
import { locationService } from "../firebase/services";
import { timestampToDate } from "../firebase/types";

const formatCoords = (location: any | null) => {
  if (!location?.coords) return "Waiting for location...";
  const { latitude, longitude } = location.coords;
  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
};

const formatBattery = (level: number | null | undefined, fallback: string) => {
  if (level == null) return fallback;
  return `${Math.round(level * 100)}%`;
};

export default function LiveLocationScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { pairing, profiles, auth },
  } = useAppData();

  const [myLocation, setMyLocation] = useState<any | null>(null);
  const [partnerLocation, setPartnerLocation] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const coupleId = auth.user.coupleId;
  const myUid = auth.user.uid;
  const partnerUid = profiles.partner?.uid ?? null;

  useEffect(() => {
    if (!pairing.isPaired || !coupleId || !myUid) {
      return;
    }

    const unsubscribeMine = locationService.subscribeToPartnerLocation(
      coupleId,
      myUid,
      (location) => setMyLocation(location)
    );

    let unsubscribePartner: (() => void) | undefined;
    if (partnerUid) {
      unsubscribePartner = locationService.subscribeToPartnerLocation(
        coupleId,
        partnerUid,
        (location) => setPartnerLocation(location)
      );
    }

    return () => {
      unsubscribeMine?.();
      unsubscribePartner?.();
    };
  }, [pairing.isPaired, coupleId, myUid, partnerUid]);

  const startSharing = useCallback(async () => {
    if (!coupleId) {
      setErrorMessage("Pair with your partner before sharing location.");
      return;
    }
    setErrorMessage(null);
    setIsUpdating(true);
    try {
      const { status } =
        await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error(
          "We need location permission to share your live location."
        );
      }
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Highest,
      });
      await locationService.updateLocation(coupleId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? 0,
        altitude: position.coords.altitude ?? null,
        speed: position.coords.speed ?? null,
      });
    } catch (error) {
      console.error("Failed to start sharing", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't start sharing your location. Try again."
      );
    } finally {
      setIsUpdating(false);
    }
  }, [coupleId]);

  const stopSharing = useCallback(async () => {
    if (!coupleId) return;
    setErrorMessage(null);
    setIsUpdating(true);
    try {
      await locationService.stopSharing(coupleId);
    } catch (error) {
      console.error("Failed to stop sharing", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't stop sharing your location. Try again."
      );
    } finally {
      setIsUpdating(false);
    }
  }, [coupleId]);

  const mySharing = Boolean(myLocation?.isSharing);
  const partnerSharing = Boolean(partnerLocation?.isSharing);

  const countdownLabel = useMemo(() => {
    if (!myLocation?.expiresAt) {
      return mySharing ? "Active now" : "Share to begin";
    }
    const expiry = timestampToDate(myLocation.expiresAt);
    const minutes = Math.max(0, Math.round((expiry.getTime() - Date.now()) / 60000));
    return minutes > 0 ? `Expires in ${minutes} min` : "Expiring soon";
  }, [myLocation?.expiresAt, mySharing]);

  const partnerStatus = useMemo(() => {
    if (!partnerUid) return "Invite your partner to enable live sharing.";
    if (!partnerSharing) return "Partner is currently offline.";
    return "Partner is sharing live now!";
  }, [partnerUid, partnerSharing]);

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
                  {mySharing ? (
                    <>
                      Sharing • <CuteText weight="bold">{countdownLabel}</CuteText>
                    </>
                  ) : (
                    "Start sharing to send updates in real time"
                  )}
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
                <MaterialIcons name="favorite" size={16} color="#ffffff" />
              </View>
            </View>
            <CuteCard
              background="#ffffffdd"
              padding={10}
              style={{ marginTop: 10, alignItems: "center" }}
            >
              <CuteText weight="bold">
                {profiles.me?.displayName ?? "You"}
              </CuteText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <MaterialIcons name="battery-5-bar" size={14} color="#4caf50" />
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  {formatBattery(myLocation?.batteryLevel, countdownLabel)}
                </CuteText>
              </View>
              <CuteText tone="muted" style={{ fontSize: 11 }}>
                {formatCoords(myLocation)}
              </CuteText>
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
                <MaterialIcons name="battery-3-bar" size={14} color="#F5A623" />
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  {formatBattery(
                    partnerLocation?.batteryLevel,
                    partnerSharing ? "Live now" : "Offline"
                  )}
                </CuteText>
              </View>
              <CuteText tone="muted" style={{ fontSize: 11 }}>
                {formatCoords(partnerLocation)}
              </CuteText>
            </CuteCard>
          </View>
        </ImageBackground>

        <View
          style={{
            padding: 20,
            gap: 16,
            backgroundColor: palette.background,
          }}
        >
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            You’re in control
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Tap Share to broadcast your location for quick meet-ups. Stop any
            time — it’s just the two of you.
          </CuteText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={mySharing ? stopSharing : startSharing}
              disabled={isUpdating}
              style={{
                flex: 1,
                backgroundColor: palette.primary,
                paddingVertical: 14,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                opacity: isUpdating ? 0.7 : 1,
              }}
            >
              <CuteText weight="bold" style={{ color: "#fff" }}>
                {mySharing ? "Stop sharing" : "Share location"}
              </CuteText>
            </Pressable>
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "#F5F5F5",
                paddingVertical: 14,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
              }}
              disabled
            >
              <CuteText weight="bold" style={{ color: palette.primary }}>
                Pairing tips
              </CuteText>
            </Pressable>
          </View>
          <CuteCard
            background={palette.card}
            padding={16}
            style={{ gap: 8, borderWidth: 1, borderColor: palette.border }}
          >
            <CuteText weight="bold">Partner status</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              {partnerStatus}
            </CuteText>
          </CuteCard>
          {errorMessage ? (
            <CuteText
              tone="muted"
              style={{ color: palette.primary, fontSize: 12 }}
            >
              {errorMessage}
            </CuteText>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
