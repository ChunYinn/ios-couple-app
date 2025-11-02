import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useMemo, useRef, useState } from "react";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { useAppData } from "../../context/AppDataContext";

export default function PrivateChatScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const scrollRef = useRef<ScrollView>(null);
  const {
    state: { pairing, profiles, chat },
    dispatch,
  } = useAppData();
  const [draft, setDraft] = useState("");

  const partnerAvatar = useMemo(
    () => profiles.partner?.avatarUrl ?? chat.partnerAvatar,
    [profiles.partner?.avatarUrl, chat.partnerAvatar]
  );
  const partnerName = profiles.partner?.displayName ?? chat.partnerName ?? "Partner";

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed.length) return;
    dispatch({ type: "ADD_CHAT_MESSAGE", payload: { text: trimmed } });
    setDraft("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

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
            Once you both connect, private chat lights up with pastel bubbles and
            sweet reactions just for you two.
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
      <View style={{ flex: 1, backgroundColor: palette.background }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingBottom: 12,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: palette.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: palette.background,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={20}
              color={palette.textSecondary}
            />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
            {partnerAvatar ? (
              <Image
                source={{ uri: partnerAvatar }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: palette.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="person" size={22} color={palette.primary} />
              </View>
            )}
            <CuteText weight="bold">{partnerName}</CuteText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialIcons
                name="lock"
                size={12}
                color={palette.textSecondary}
              />
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                End-to-end encrypted
              </CuteText>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/favorites")}
            style={{
              padding: 8,
              backgroundColor: palette.primarySoft,
              borderRadius: 16,
            }}
          >
            <MaterialIcons name="favorite" size={22} color={palette.primary} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 120,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            requestAnimationFrame(() => {
              scrollRef.current?.scrollToEnd({ animated: true });
            })
          }
        >
          <CuteText
            tone="muted"
            style={{ textAlign: "center", fontSize: 13, marginBottom: 4 }}
          >
            Today
          </CuteText>

          {chat.messages.map((message) => {
            const isPartner = message.sender === "partner";
            const bubbleColor = isPartner
              ? palette.secondary + "55"
              : palette.primary;
            const textColor = isPartner ? palette.text : "#FFFFFF";

            return (
              <View
                key={message.id}
                style={{
                  flexDirection: isPartner ? "row" : "row-reverse",
                  alignItems: "flex-end",
                  gap: 12,
                }}
              >
                {isPartner ? (
                  partnerAvatar ? (
                    <Image
                      source={{ uri: partnerAvatar }}
                      style={{ width: 36, height: 36, borderRadius: 18 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: palette.primarySoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons name="person" size={18} color={palette.primary} />
                    </View>
                  )
                ) : (
                  <View style={{ width: 36 }} />
                )}

                <View
                  style={{
                    maxWidth: "75%",
                    alignItems: isPartner ? "flex-start" : "flex-end",
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
                  {message.reaction ? (
                    <View
                      style={{
                        marginTop: 6,
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
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 24,
            paddingTop: 10,
            backgroundColor: palette.background,
            borderTopWidth: 1,
            borderTopColor: palette.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: palette.card,
              borderRadius: 32,
              borderWidth: 1,
              borderColor: palette.border,
              paddingHorizontal: 12,
              paddingVertical: 4,
              gap: 6,
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
              onSubmitEditing={handleSend}
              style={{
                flex: 1,
                paddingVertical: 10,
                fontSize: 15,
                color: palette.text,
              }}
            />
            <Pressable
              onPress={handleSend}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 999,
                padding: 12,
                opacity: draft.trim().length ? 1 : 0.5,
              }}
              disabled={!draft.trim().length}
            >
              <MaterialIcons name="send" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
