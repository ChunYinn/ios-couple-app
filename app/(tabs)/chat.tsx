import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { CuteText } from "../../components/CuteText";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { messageService } from "../../firebase/services";
import { usePalette } from "../../hooks/usePalette";

export default function PrivateChatScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const {
    state: { pairing, profiles, chat, auth },
    dispatch,
  } = useAppData();
  const isFocused = useIsFocused();
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const markedReadRef = useRef<Set<string>>(new Set());
  const readPermissionWarnedRef = useRef(false);

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

  const headerAvatarSize = useMemo(() => {
    if (width <= 340) return 36;
    if (width <= 375) return 42;
    if (width >= 430) return 54;
    return 46;
  }, [width]);

  const headerOverlap = Math.round(headerAvatarSize * 0.4);
  const headerHorizontalMargin = width <= 360 ? 12 : 16;
  const headerPaddingHorizontal = width <= 360 ? 14 : 18;
  const headerPaddingVertical = width <= 360 ? 10 : 12;
  const composerHorizontalPadding = width <= 360 ? 12 : 16;
  const composerRadius = width <= 360 ? 24 : 28;
  const composerPaddingVertical = width <= 360 ? 6 : 8;
  const maxInputHeight = 120;
  const composerBottomPadding = Math.max(0, insets.bottom);

  const maxBubbleWidth = Math.min(width * 0.72, 320);

  const coupleId = pairing.coupleId ?? auth.user.coupleId ?? null;

  const handlePickImage = useCallback(async () => {
    if (!coupleId || isUploadingImage) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "We need access to your photos to share pictures."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert(
          "No image",
          "We couldn't read that picture. Please try again."
        );
        return;
      }

      setIsUploadingImage(true);
      await messageService.sendImageMessage(coupleId, asset.uri);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error) {
      console.error("Failed to send photo message", error);
      Alert.alert(
        "Photo not sent",
        "We couldn't share that picture. Please try again."
      );
    } finally {
      setIsUploadingImage(false);
    }
  }, [coupleId, isUploadingImage]);

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
      setInputHeight(40);
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

  useEffect(() => {
    markedReadRef.current.clear();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId || !isFocused) return;
    const newlyReadIds: string[] = [];
    chat.messages.forEach((message) => {
      if (
        message.sender === "partner" &&
        !message.pending &&
        !message.readByMe &&
        !markedReadRef.current.has(message.id)
      ) {
        markedReadRef.current.add(message.id);
        newlyReadIds.push(message.id);
        messageService.markAsRead(coupleId, message.id).catch((error) => {
          const code = (error as any)?.code;
          if (code === "permission-denied" || code === "failed-precondition") {
            if (!readPermissionWarnedRef.current) {
              console.info(
                "Read receipts require updating Firestore rules to let recipients update the readBy field."
              );
              readPermissionWarnedRef.current = true;
            }
            return;
          }
          console.warn("Failed to mark message read", error);
        });
      }
    });
    if (newlyReadIds.length) {
      dispatch({
        type: "MARK_CHAT_MESSAGES_READ",
        payload: {
          messageIds: newlyReadIds,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [chat.messages, coupleId, isFocused, dispatch]);

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 4 : 0}
      >
        <View style={{ flex: 1, backgroundColor: palette.background }}>
          <View
            style={{
              marginHorizontal: headerHorizontalMargin,
              marginTop: 12,
              marginBottom: 8,
              paddingHorizontal: headerPaddingHorizontal,
              paddingVertical: headerPaddingVertical,
              borderRadius: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: palette.card,

              shadowColor: "#00000010",
              shadowOpacity: 0.06,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 1,
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
                  partnerAvatar,
                  partnerInitial,
                  palette.secondary,
                  headerAvatarSize
                )}
              </View>
              <View style={{ marginLeft: -headerOverlap, zIndex: 1 }}>
                {renderAvatarBubble(
                  myAvatar,
                  myInitial,
                  palette.primarySoft,
                  headerAvatarSize
                )}
              </View>
            </View>
            <View style={{ width: 32 }} />
          </View>

        <ScrollView
          style={{ flex: 1 }}
          keyboardDismissMode="on-drag"
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            paddingBottom:
              composerBottomPadding + 80,
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
            const readByMe = message.readByMe || markedReadRef.current.has(message.id);
            const isImageMessage =
              message.type === "image" && Boolean(message.mediaUrl);
            const bubbleColor = isImageMessage
              ? "transparent"
              : isPartner
              ? readByMe
                ? palette.card
                : palette.cardAlt
              : palette.primary;
            const textColor = isPartner ? palette.text : "#fff";
            const timeSource =
              message.pending && message.clientTimestamp
                ? message.clientTimestamp
                : message.timestamp;
            const timestamp = formatMessageTime(timeSource);
            const readTimestamp = message.readAt
              ? formatMessageTime(message.readAt)
              : "";
            let metaLabel: string | null = null;
            if (message.pending) {
              metaLabel = "Sending…";
            } else if (isPartner) {
              metaLabel = timestamp;
            } else if (message.readAt) {
              metaLabel = readTimestamp ? `${readTimestamp} · Seen` : "Seen";
            } else if (message.readByPartner) {
              metaLabel = "Seen";
            } else {
              metaLabel = timestamp ? `${timestamp} · Sent` : "Sent";
            }
            const imageSize = Math.min(maxBubbleWidth, 240);

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
                      paddingHorizontal: isImageMessage ? 0 : 16,
                      paddingVertical: isImageMessage ? 0 : 14,
                      borderRadius: 24,
                      borderBottomLeftRadius: isPartner ? 12 : 24,
                      borderBottomRightRadius: isPartner ? 24 : 12,
                      overflow: isImageMessage ? "hidden" : "visible",
                    }}
                  >
                    {isImageMessage && message.mediaUrl ? (
                      <View
                        style={{
                          width: imageSize,
                          height: imageSize,
                          backgroundColor: palette.cardAlt,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Image
                          source={{ uri: message.mediaUrl }}
                          style={{
                            width: imageSize,
                            height: imageSize,
                          }}
                          resizeMode="cover"
                        />
                        {message.pending ? (
                          <View
                            style={{
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: 0,
                              right: 0,
                              backgroundColor: "#00000040",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ActivityIndicator color="#fff" />
                          </View>
                        ) : null}
                      </View>
                    ) : (
                      <CuteText
                        style={{
                          color: textColor,
                          fontSize: 15,
                        }}
                      >
                        {message.text}
                      </CuteText>
                    )}
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
              paddingHorizontal: composerHorizontalPadding,
              paddingTop: 10,
              paddingBottom: composerBottomPadding,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: palette.card,
                borderRadius: composerRadius,
                paddingHorizontal: 16,
                paddingVertical: composerPaddingVertical,
                gap: 8,
                borderWidth: 1,
                borderColor: palette.primarySoft,
                shadowColor: "#00000010",
                shadowOpacity: 0.06,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <Pressable
                style={{
                  padding: 8,
                  borderRadius: 999,
                }}
                onPress={handlePickImage}
                disabled={isUploadingImage}
              >
                <MaterialIcons
                  name="photo-camera"
                  size={24}
                  color={palette.primary}
                />
              </Pressable>
              {isUploadingImage ? (
                <ActivityIndicator
                  size="small"
                  color={palette.primary}
                  style={{ marginRight: 4 }}
                />
              ) : null}
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
                ref={inputRef}
                multiline
                onContentSizeChange={(event) => {
                  setInputHeight(event.nativeEvent.contentSize.height);
                }}
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: palette.text,
                  paddingTop: Platform.OS === "ios" ? 10 : 8,
                  paddingBottom: Platform.OS === "ios" ? 10 : 8,
                  height: Math.max(40, Math.min(inputHeight, maxInputHeight)),
                  maxHeight: maxInputHeight,
                  textAlignVertical: "top",
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
                  opacity:
                    draft.trim().length && !isSending && !isUploadingImage
                      ? 1
                      : 0.5,
                }}
                disabled={!draft.trim().length || isSending || isUploadingImage}
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
