import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { CuteCard } from "../../components/CuteCard";
import { CuteButton } from "../../components/CuteButton";
import { CuteTextInput } from "../../components/CuteTextInput";
import { useAppData } from "../../context/AppDataContext";
import { demoPartnerProfile } from "../../data/demoContent";

const createInviteCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const createCoupleId = () =>
  `couple-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function PairingScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { pairing, auth },
    dispatch,
  } = useAppData();

  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inviteCode = pairing.inviteCode;
  const inviteLink =
    pairing.inviteLink ?? (inviteCode ? `https://couple.ly/invite/${inviteCode}` : null);

  const qrPlaceholder = useMemo(
    () => inviteCode?.split("").join(" ") ?? "------",
    [inviteCode]
  );

  const handleCreateInvite = () => {
    const code = createInviteCode();
    const link = `https://couple.ly/invite/${code}`;
    dispatch({
      type: "CREATE_INVITE",
      payload: {
        inviteCode: code,
        inviteLink: link,
        qrCodeData: link,
      },
    });
    setErrorMessage(null);
  };

  const handleJoinCouple = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) {
      setErrorMessage("Enter the 6-digit invite code your partner shared.");
      return;
    }
    if (trimmed !== pairing.inviteCode) {
      setErrorMessage("We couldn't find that code. Double-check and try again.");
      return;
    }
    dispatch({
      type: "JOIN_COUPLE",
      payload: {
        coupleId: createCoupleId(),
        partnerProfile: demoPartnerProfile,
      },
    });
  };

  const handleReset = () => {
    dispatch({ type: "RESET_PAIRING" });
    setJoinCode("");
    setErrorMessage(null);
  };

  return (
    <Screen
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 24,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View style={{ gap: 6 }}>
        <CuteText tone="muted" style={{ fontSize: 12 }}>
          Step 2 of 3
        </CuteText>
        <CuteText weight="bold" style={{ fontSize: 26 }}>
          Create or join your couple
        </CuteText>
        <CuteText tone="muted">
          Only the two of you. Private by default.
        </CuteText>
      </View>

      <View style={{ gap: 16 }}>
        <CuteCard
          background={palette.card}
          padding={20}
          style={{ gap: 12, borderWidth: 1, borderColor: palette.border }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <CuteText weight="bold">Create Couple</CuteText>
            <MaterialIcons name="launch" size={20} color={palette.primary} />
          </View>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Generate a private invite code, deep link, and QR to share with your person.
          </CuteText>
          {inviteCode ? (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 20,
                  padding: 16,
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  Your invite code
                </CuteText>
                <CuteText weight="bold" style={{ fontSize: 28 }}>
                  {inviteCode}
                </CuteText>
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  Share this with your partner.
                </CuteText>
              </View>
              <CuteCard
                background={palette.primarySoft}
                padding={16}
                style={{ alignItems: "center", gap: 8 }}
              >
                <CuteText weight="bold">QR preview</CuteText>
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  {qrPlaceholder}
                </CuteText>
              </CuteCard>
              <CuteCard background={palette.background} padding={16} style={{ gap: 6 }}>
                <CuteText weight="bold">Invite link</CuteText>
                <CuteText tone="muted" style={{ fontSize: 13 }}>
                  {inviteLink}
                </CuteText>
              </CuteCard>
              <CuteButton label="Reset invite" tone="ghost" onPress={handleReset} />
            </View>
          ) : (
            <CuteButton label="Generate invite" onPress={handleCreateInvite} />
          )}
        </CuteCard>

        <CuteCard
          background={palette.card}
          padding={20}
          style={{ gap: 12, borderWidth: 1, borderColor: palette.border }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <CuteText weight="bold">Join Couple</CuteText>
            <MaterialIcons name="favorite" size={20} color={palette.primary} />
          </View>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Already received an invite? Enter the 6-digit code or scan the QR.
          </CuteText>
          <CuteTextInput
            label="Invite code"
            placeholder="123456"
            value={joinCode}
            onChangeText={(value) => {
              setJoinCode(value);
              setErrorMessage(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
          />
          {errorMessage ? (
            <CuteText tone="muted" style={{ fontSize: 12, color: palette.primary }}>
              {errorMessage}
            </CuteText>
          ) : null}
          <CuteButton
            label="Join couple"
            onPress={handleJoinCouple}
            disabled={!joinCode.trim() || !inviteCode}
          />
        </CuteCard>
      </View>

      <View style={{ gap: 12 }}>
        <CuteCard background={palette.card} padding={18} style={{ gap: 8 }}>
          <CuteText weight="bold">How pairing works</CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            On create we stash your invite under pendingPairs/{`{code}`}. On join we
            create your couple, link both of you, and clear the pending invite.
          </CuteText>
        </CuteCard>
        <CuteText tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
          Signed in as {auth.user.displayName ?? "you"}. Only the two of you can see
          this space.
        </CuteText>
      </View>
    </Screen>
  );
}
