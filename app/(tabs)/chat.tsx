import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { messageService } from "../../firebase/services";
import { usePalette } from "../../hooks/usePalette";

export default function PrivateChatScreen() {
  const palette = usePalette();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const {
    state: { pairing, profiles, chat, auth },
  } = useAppData();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const partnerAvatar = useMemo(
    () => profiles.partner?.avatarUrl ?? chat.partnerAvatar,
    [profiles.partner?.avatarUrl, chat.partnerAvatar]
  );
  const myAvatar = useMemo(
    () => profiles.me?.avatarUrl ?? auth.user.avatarUrl,
    [profiles.me?.avatarUrl, auth.user.avatarUrl]
  );
  const partnerInitial = useMemo(
    () =>
      (profiles.partner?.displayName ?? chat.partnerName ?? "P")
        .trim()
        .charAt(0)
        .toUpperCase() || "P",
    [profiles.partner?.displayName, chat.partnerName]
  );
  const myInitial = useMemo(
    () =>
      (profiles.me?.displayName ?? auth.user.displayName ?? "You")
        ?.trim()
        .charAt(0)
        .toUpperCase() || "Y",
    [profiles.me?.displayName, auth.user.displayName]
  );
  const renderAvatarBubble = useCallback(
    (
      uri: string | undefined | null,
      initial: string,
      fallbackColor: string,
      size = 48
    ) => {
      const containerSize = size;
      return (
        <View
          style={{
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            borderWidth: 2,
            borderColor: palette.background,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: fallbackColor,
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <CuteText weight="bold" style={{ color: palette.text }}>
              {initial}
            </CuteText>
          )}
        </View>
      );
    },
    [palette.background, palette.text]
  );

  const maxBubbleWidth = Math.min(width * 0.72, 320);

  const coupleId = pairing.coupleId ?? auth.user.coupleId ?? null;

  const handleSend = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed.length || isSending) return;
    if (!coupleId) {
      Alert.alert(
        "Pair first",
        "We need a shared couple space before you can chat."
      );
      return;
    }

    try {
      setIsSending(true);
      await messageService.sendMessage(coupleId, trimmed);
      setDraft("");
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error) {
      console.error("Failed to send message", error);
      Alert.alert(
        "Message failed",
        "We couldn't deliver that message. Please check your connection and try again."
      );
    } finally {
      setIsSending(false);
    }
  }, [coupleId, draft, isSending]);

  const formatMessageTime = useCallback((iso?: string) => {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [chat.messages.length]);

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
          <MaterialIcons name="lock" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock chat
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Once you both connect, private chat lights up with pastel bubbles
            and sweet reactions just for you two.
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
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={{ flex: 1, backgroundColor: palette.background }}>
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              marginBottom: 8,
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderRadius: 28,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: palette.card,
              shadowColor: "#00000014",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 2,
          }}
        >
            <Pressable
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <MaterialIcons
                name="arrow-back-ios"
                size={20}
                color={palette.textSecondary}
              />
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ zIndex: 2 }}>
                {renderAvatarBubble(
                  myAvatar,
                  myInitial,
                  palette.primarySoft,
                  46
                )}
              </View>
              <View style={{ marginLeft: -18, zIndex: 1 }}>
                {renderAvatarBubble(
                  partnerAvatar,
                  partnerInitial,
                  palette.secondary,
                  46
                )}
              </View>
            </View>
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingVertical: 24,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            {chat.messages.map((message) => {
              const isPartner = message.sender === "partner";
              const bubbleColor = isPartner ? palette.card : palette.primary;
              const textColor = isPartner ? palette.text : "#fff";
              const timeSource =
                message.pending && message.clientTimestamp
                  ? message.clientTimestamp
                  : message.timestamp;
              const timestamp = formatMessageTime(timeSource);
              const metaLabel = message.pending ? "Sending…" : timestamp;

              return (
                <View
                  key={message.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: isPartner ? "flex-start" : "flex-end",
                    gap: 12,
                  }}
                >
                  {isPartner ? (
                    <View>
                      {renderAvatarBubble(
                        partnerAvatar,
                        partnerInitial,
                        palette.secondary,
                        34
                      )}
                    </View>
                  ) : (
                    <View style={{ width: 34 }} />
                  )}

                  <View
                    style={{
                      maxWidth: maxBubbleWidth,
                      alignItems: isPartner ? "flex-start" : "flex-end",
                      opacity: message.pending ? 0.75 : 1,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: bubbleColor,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderRadius: 24,
                        borderBottomLeftRadius: isPartner ? 12 : 24,
                        borderBottomRightRadius: isPartner ? 24 : 12,
                      }}
                    >
                      <CuteText
                        style={{
                          color: textColor,
                          fontSize: 15,
                        }}
                      >
                        {message.text}
                      </CuteText>
                    </View>
                    {!!metaLabel && (
                      <CuteText
                        tone="muted"
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          textAlign: isPartner ? "left" : "right",
                        }}
                      >
                        {metaLabel}
                      </CuteText>
                    )}
                    {message.reaction ? (
                      <View
                        style={{
                          marginTop: 4,
                          backgroundColor: palette.card,
                          borderRadius: 14,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          shadowColor: "#00000010",
                          shadowOpacity: 0.1,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 2,
                        }}
                      >
                        <CuteText>{message.reaction}</CuteText>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: palette.card,
              borderRadius: 28,
              paddingHorizontal: 16,
              paddingVertical: 6,
              gap: 8,
              shadowColor: "#00000012",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
              <Pressable
                style={{
                  padding: 8,
                  borderRadius: 999,
                }}
              >
                <MaterialIcons
                  name="add-reaction"
                  size={24}
                  color={palette.primary}
                />
              </Pressable>
              <TextInput
                placeholder="Send a message..."
                placeholderTextColor={palette.textSecondary}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => {
                  if (!isSending) {
                    handleSend();
                  }
                }}
                style={{
                  flex: 1,
                  minHeight: 40,
                  fontSize: 15,
                  color: palette.text,
                }}
                autoCorrect
                autoCapitalize="sentences"
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <Pressable
                onPress={handleSend}
                style={{
                  backgroundColor: palette.primary,
                  borderRadius: 999,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  opacity: draft.trim().length && !isSending ? 1 : 0.5,
                }}
                disabled={!draft.trim().length || isSending}
              >
                <MaterialIcons name="send" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
