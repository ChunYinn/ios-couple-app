import { useMemo, useState } from "react";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View, useColorScheme } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getFunctions, httpsCallable } from "firebase/functions";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { CuteCard } from "../../components/CuteCard";
import { CuteButton } from "../../components/CuteButton";
import { CuteTextInput } from "../../components/CuteTextInput";
import { useAppData } from "../../context/AppDataContext";
import {
  coupleService,
  inviteService,
  profileService,
  userService,
} from "../../firebase/services";
import { DBProfile } from "../../firebase/types";
import { PartnerProfile } from "../../types/app";
import {
  DEFAULT_LOVE_LANGUAGES,
  normalizeLoveLanguages,
} from "../../data/loveLanguages";
import { firebaseApp } from "../../firebase/config";

export default function PairingScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { pairing, auth, profiles },
    dispatch,
  } = useAppData();

  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const inviteCode = pairing.inviteCode;
  const inviteLink =
    pairing.inviteLink ?? (inviteCode ? `https://couple.ly/invite/${inviteCode}` : null);

  const qrPlaceholder = useMemo(
    () => inviteCode?.split("").join(" ") ?? "------",
    [inviteCode]
  );
  const generateLabel = isGenerating ? "Generating..." : "Generate invite";
  const joinLabel = isJoining ? "Joining..." : "Join couple";

  const mapDbProfileToPartner = (uid: string, profile: DBProfile): PartnerProfile => ({
    uid,
    displayName: profile.displayName,
    status: profile.status,
    avatarUrl: profile.avatarUrl ?? undefined,
    about: profile.about,
    accentColor: profile.accentColor,
    loveLanguages: normalizeLoveLanguages(profile.loveLanguages),
    favorites:
      profile.favorites?.map((favorite) => ({
        label: favorite.label,
        value: favorite.value,
      })) ?? [],
  });

  const handleCreateInvite = async () => {
    if (!auth.user.uid) {
      setErrorMessage("Please sign in again to generate a fresh invite.");
      return;
    }
    try {
      setIsGenerating(true);
      const ownerName =
        profiles.me?.displayName ?? auth.user.displayName ?? "You";

      let coupleId = pairing.coupleId ?? auth.user.coupleId;
      let code = pairing.inviteCode ?? null;
      let qrData = pairing.qrCodeData ?? null;
      let shareLink = pairing.inviteLink ?? null;

      if (!coupleId) {
        code = inviteService.generateInviteCode();
        coupleId = await coupleService.createCouple(auth.user.uid, code);
        await userService.updateUser(auth.user.uid, {
          displayName: ownerName,
          avatarUrl: profiles.me?.avatarUrl ?? null,
          coupleId,
        });
        if (profiles.me) {
          await profileService.createProfile(coupleId, auth.user.uid, {
            displayName: profiles.me.displayName,
            status: profiles.me.status,
            avatarUrl: profiles.me.avatarUrl ?? null,
            about: profiles.me.about ?? "",
            accentColor: profiles.me.accentColor,
            emoji: "💕",
            loveLanguages: profiles.me.loveLanguages,
            favorites: [],
          });
        }
        qrData = `COUPLE:${code}`;
        shareLink = `https://couple.ly/invite/${code}`;
      }

      if (!coupleId) {
        throw new Error("We couldn't create your invite just yet. Please try again.");
      }

      const ensuredCode = await inviteService.createInvite(
        coupleId,
        ownerName,
        profiles.me?.avatarUrl,
        code ?? undefined
      );

      const finalLink = shareLink ?? `https://couple.ly/invite/${ensuredCode}`;
      const finalQr = qrData ?? `COUPLE:${ensuredCode}`;

      dispatch({
        type: "CREATE_INVITE",
        payload: {
          coupleId,
          inviteCode: ensuredCode,
          inviteLink: finalLink,
          qrCodeData: finalQr,
        },
      });
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to create invite", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't create your invite. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinCouple = async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage("Enter the 6-digit invite code your partner shared.");
      return;
    }
    if (trimmed.length !== 6) {
      setErrorMessage("Invite codes are six characters long.");
      return;
    }
    if (!auth.user.uid) {
      setErrorMessage("Please sign in again before joining.");
      return;
    }

    try {
      setIsJoining(true);
      const functions = getFunctions(firebaseApp);
      const redeemInvite = httpsCallable(functions, "redeemInvite");
      const response = await redeemInvite({ code: trimmed });
      const coupleId = (response.data as { coupleId?: string })?.coupleId;

      if (!coupleId) {
        throw new Error("We couldn't verify that invite. Try again in a moment.");
      }

      const myProfile = profiles.me;
      if (myProfile) {
        await profileService.createProfile(coupleId, auth.user.uid, {
          displayName: myProfile.displayName,
          status: myProfile.status,
          avatarUrl: myProfile.avatarUrl ?? null,
          about: myProfile.about ?? "",
          accentColor: myProfile.accentColor,
          emoji: "💕",
          loveLanguages: myProfile.loveLanguages,
          favorites: [],
        });
      }

      await userService.updateUser(auth.user.uid, {
        displayName: myProfile?.displayName ?? auth.user.displayName ?? "",
        avatarUrl: myProfile?.avatarUrl ?? auth.user.avatarUrl ?? null,
        coupleId,
      });

      const profileData = await profileService.getCoupleProfiles(coupleId);
      const partnerEntry =
        profileData.partner && profileData.partner.uid !== auth.user.uid
          ? profileData.partner
          : profileData.me && profileData.me.uid !== auth.user.uid
            ? profileData.me
            : undefined;

      if (!partnerEntry) {
        setErrorMessage(
          "You're paired! We’ll pull in your partner’s profile as soon as they finish onboarding."
        );
      }

      const partnerProfile = partnerEntry
        ? mapDbProfileToPartner(partnerEntry.uid, partnerEntry)
        : {
            uid: "pending-partner",
            displayName: "Partner",
            status: "Excited!",
            accentColor: "#A2D2FF",
            about:
              "Your partner will finish setting up soon. Until then, enjoy a preview!",
            avatarUrl: undefined,
            loveLanguages: [...DEFAULT_LOVE_LANGUAGES],
            favorites: [],
          };

      dispatch({
        type: "JOIN_COUPLE",
        payload: {
          coupleId,
          partnerProfile,
        },
      });
      setJoinCode("");
      setErrorMessage(null);
    } catch (error) {
      console.error("Failed to join couple", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't join with that code. Double-check and try again."
      );
    } finally {
      setIsJoining(false);
    }
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
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
        <View style={{ flex: 1 }}>
          <CuteText weight="bold" style={{ fontSize: 26 }}>
            Invite your partner
          </CuteText>
        </View>
      </View>
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
              <CuteButton
                label="Reset invite"
                tone="ghost"
                onPress={handleReset}
                disabled={isGenerating}
              />
            </View>
          ) : (
            <CuteButton
              label={generateLabel}
              onPress={handleCreateInvite}
              disabled={isGenerating}
            />
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
            label={joinLabel}
            onPress={handleJoinCouple}
            disabled={!joinCode.trim() || isJoining}
          />
        </CuteCard>
      </View>

      <View style={{ gap: 12 }}>
        <CuteCard background={palette.card} padding={18} style={{ gap: 8 }}>
          <CuteText weight="bold">How it works</CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Share your invite code with your partner. Once they join, you'll be connected in a private space just for two.
          </CuteText>
        </CuteCard>
        <CuteText tone="muted" style={{ fontSize: 12, textAlign: "center" }}>
          Signed in as {auth.user.displayName ?? "you"}
        </CuteText>
      </View>
    </Screen>
  );
}
