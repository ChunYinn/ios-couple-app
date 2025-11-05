import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  Pressable,
  ScrollView,
  Switch,
  View,
  useColorScheme,
} from "react-native";
import { useEffect, useMemo, useState } from "react";

import { Screen } from "../../components/Screen";
import { CuteText } from "../../components/CuteText";
import { usePalette } from "../../hooks/usePalette";
import { CuteCard } from "../../components/CuteCard";
import { CuteModal } from "../../components/CuteModal";
import { CuteTextInput } from "../../components/CuteTextInput";
import { CuteButton } from "../../components/CuteButton";
import { useAppData } from "../../context/AppDataContext";

const colorOptions = ["#FF8FAB", "#F6C28B", "#A2D2FF", "#C7F9CC", "#F1C0E8"];
const iconOptions = [
  { icon: "favorite", label: "Romance" },
  { icon: "restaurant", label: "Foodie" },
  { icon: "self-improvement", label: "Wellness" },
  { icon: "flight", label: "Travel" },
  { icon: "sports-tennis", label: "Active" },
];

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SharedListsScreen() {
  const palette = usePalette();
  const scheme = useColorScheme();
  const {
    state: { pairing, todos, profiles },
    dispatch,
  } = useAppData();

  const partnerAvailableInitial = Boolean(profiles.partner);
  const partnerAvailable = Boolean(profiles.partner);

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    todos.categories[0]?.id ?? ""
  );
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState(iconOptions[0].icon);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDate, setNewTodoDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(() =>
    partnerAvailableInitial ? ["me", "partner"] : ["me"]
  );

  useEffect(() => {
    if (!todos.categories.length) {
      setSelectedCategoryId("");
      return;
    }

    if (
      !selectedCategoryId ||
      !todos.categories.some((category) => category.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(todos.categories[0].id);
    }
  }, [selectedCategoryId, todos.categories]);

  const filteredItems = useMemo(
    () =>
      todos.items.filter((item) => item.categoryId === selectedCategoryId),
    [todos.items, selectedCategoryId]
  );

  const activeCategory = todos.categories.find(
    (category) => category.id === selectedCategoryId
  );

  useEffect(() => {
    if (!partnerAvailable) {
      setSelectedAssignees((prev) => prev.filter((id) => id !== "partner"));
    } else if (partnerAvailable && !selectedAssignees.includes("partner")) {
      setSelectedAssignees((prev) => [...prev, "partner"]);
    }
  }, [partnerAvailable, selectedAssignees]);

  const toggleAssignee = (profileKey: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(profileKey)
        ? prev.filter((id) => id !== profileKey)
        : [...prev, profileKey]
    );
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed.length) {
      return;
    }
    const id = createId("category");
    dispatch({
      type: "ADD_TODO_CATEGORY",
      payload: {
        id,
        name: trimmed,
        color: newCategoryColor,
        icon: newCategoryIcon,
        description: newCategoryDescription.trim() || undefined,
      },
    });
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryColor(colorOptions[0]);
    setNewCategoryIcon(iconOptions[0].icon);
    setCategoryModalVisible(false);
    setSelectedCategoryId(id);
  };

  const handleDeleteCategory = (categoryId: string) => {
    dispatch({ type: "DELETE_TODO_CATEGORY", payload: { categoryId } });
  };

  const handleAddTodo = () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed.length || !selectedCategoryId) {
      return;
    }
    dispatch({
      type: "ADD_TODO_ITEM",
      payload: {
        categoryId: selectedCategoryId,
        title: trimmed,
        assigneeIds: selectedAssignees,
        dueDate: newTodoDate.trim() || undefined,
      },
    });
    setNewTodoTitle("");
    setNewTodoDate("");
    setTodoModalVisible(false);
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
          <MaterialIcons name="list-alt" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock lists
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Once you both connect, shared to-dos sparkle with avatars and cute reminders.
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
          Our Lists
        </CuteText>
        <Pressable
          onPress={() => setCategoryModalVisible(true)}
          style={{
            padding: 10,
            borderRadius: 999,
            backgroundColor: palette.primarySoft,
          }}
        >
          <MaterialIcons name="add" size={22} color={palette.primary} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 12,
        }}
      >
        {todos.categories.map((category) => {
          const isActive = category.id === selectedCategoryId;
          return (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategoryId(category.id)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 12,
                backgroundColor: isActive ? palette.primary : palette.primarySoft,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MaterialIcons
                name={category.icon as keyof typeof MaterialIcons.glyphMap}
                size={18}
                color={isActive ? "#fff" : palette.primary}
              />
              <CuteText
                weight="semibold"
                style={{ color: isActive ? "#fff" : palette.primary }}
              >
                {category.name}
              </CuteText>
            </Pressable>
          );
        })}
        {!todos.categories.length ? (
          <CuteCard
            background={palette.card}
            padding={18}
            style={{ gap: 8, flexDirection: "row", alignItems: "center" }}
          >
            <MaterialIcons name="lightbulb" size={20} color={palette.primary} />
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Create your first category to begin planning together.
            </CuteText>
          </CuteCard>
        ) : null}
      </ScrollView>

      <View style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            {activeCategory?.name ?? "Shared to-dos"}
          </CuteText>
          {activeCategory ? (
            <Pressable onPress={() => handleDeleteCategory(activeCategory.id)}>
              <CuteText tone="accent">Delete</CuteText>
            </Pressable>
          ) : null}
        </View>

        <CuteCard background={palette.card} padding={20} style={{ gap: 14 }}>
          {filteredItems.map((item) => {
            const isCompleted = item.completed;
            return (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <CuteText
                    weight="semibold"
                    style={{
                      fontSize: 16,
                      textDecorationLine: isCompleted ? "line-through" : "none",
                      color: isCompleted ? palette.textSecondary : palette.text,
                    }}
                  >
                    {item.title}
                  </CuteText>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    {item.dueDate ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MaterialIcons
                          name="event"
                          size={16}
                          color={palette.textSecondary}
                        />
                        <CuteText tone="muted" style={{ fontSize: 13 }}>
                          {item.dueDate}
                        </CuteText>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {item.assigneeIds.map((assignee) => {
                        const assigneeAvatar =
                          assignee === "partner"
                            ? profiles.partner?.avatarUrl
                            : profiles.me?.avatarUrl;
                        const displayName =
                          assignee === "partner"
                            ? profiles.partner?.displayName ?? "Partner"
                            : profiles.me?.displayName ?? "You";
                        return (
                          <View
                            key={`${item.id}-${assignee}`}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {assigneeAvatar ? (
                              <Image
                                source={{ uri: assigneeAvatar }}
                                style={{ width: 28, height: 28, borderRadius: 14 }}
                              />
                            ) : (
                              <View
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                  backgroundColor: palette.primarySoft,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <MaterialIcons
                                  name="person"
                                  size={16}
                                  color={palette.primary}
                                />
                              </View>
                            )}
                            <CuteText tone="muted" style={{ fontSize: 12 }}>
                              {displayName}
                            </CuteText>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
                <Switch
                  value={isCompleted}
                  onValueChange={() =>
                    dispatch({
                      type: "TOGGLE_TODO_ITEM",
                      payload: { itemId: item.id },
                    })
                  }
                  thumbColor={isCompleted ? palette.primary : "#fff"}
                  trackColor={{
                    true: palette.primarySoft,
                    false: palette.border,
                  }}
                />
              </View>
            );
          })}
          {!filteredItems.length ? (
            <View
              style={{
                alignItems: "center",
                gap: 10,
                paddingVertical: 16,
              }}
            >
              <MaterialIcons name="playlist-add" size={38} color={palette.primary} />
              <CuteText weight="bold" style={{ fontSize: 18 }}>
                Nothing here yet
              </CuteText>
              <CuteText tone="muted" style={{ textAlign: "center", fontSize: 13 }}>
                Add a shared to-do and keep it tracked together.
              </CuteText>
            </View>
          ) : null}
        </CuteCard>

        <CuteButton
          label="Add to-do"
          onPress={() => setTodoModalVisible(true)}
          disabled={!activeCategory}
        />
      </View>

      <CuteModal
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
        title="Create a new list"
        subtitle="Organize your ideas with a fresh pastel category."
      >
        <CuteTextInput
          label="Category name"
          placeholder="Ex. Weekend dates"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />
        <CuteTextInput
          label="Description"
          placeholder="Add a sweet note about this list (optional)"
          value={newCategoryDescription}
          onChangeText={setNewCategoryDescription}
        />
        <View style={{ gap: 10 }}>
          <CuteText weight="semibold">Colour</CuteText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {colorOptions.map((color) => {
              const isActive = color === newCategoryColor;
              return (
                <Pressable
                  key={color}
                  onPress={() => setNewCategoryColor(color)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: color,
                    borderWidth: isActive ? 4 : 2,
                    borderColor: isActive ? palette.card : "#ffffffaa",
                  }}
                />
              );
            })}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <CuteText weight="semibold">Icon</CuteText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {iconOptions.map((option) => {
              const isActive = option.icon === newCategoryIcon;
              return (
                <Pressable
                  key={option.icon}
                  onPress={() => setNewCategoryIcon(option.icon)}
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    backgroundColor: isActive
                      ? palette.primary
                      : palette.primarySoft,
                  }}
                >
                  <MaterialIcons
                    name={option.icon as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={isActive ? "#fff" : palette.primary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
        <CuteButton
          label="Create list"
          onPress={handleAddCategory}
          disabled={!newCategoryName.trim()}
        />
      </CuteModal>

      <CuteModal
        visible={todoModalVisible}
        onRequestClose={() => setTodoModalVisible(false)}
        title="Add a shared to-do"
        subtitle={
          activeCategory
            ? `You're adding to "${activeCategory.name}"`
            : "Choose a category first"
        }
      >
        <CuteTextInput
          label="What’s the plan?"
          placeholder="Ex. Picnic at the botanical garden"
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
        />
        <CuteTextInput
          label="Due date"
          placeholder="YYYY-MM-DD (optional)"
          value={newTodoDate}
          onChangeText={setNewTodoDate}
        />
        <View style={{ gap: 10 }}>
          <CuteText weight="semibold">Assign to</CuteText>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => toggleAssignee("me")}
              style={{ alignItems: "center", gap: 6 }}
            >
              {profiles.me?.avatarUrl ? (
                <Image
                  source={{ uri: profiles.me.avatarUrl }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: selectedAssignees.includes("me") ? 3 : 0,
                    borderColor: palette.primary,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: palette.primarySoft,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: selectedAssignees.includes("me") ? 3 : 0,
                    borderColor: palette.primary,
                  }}
                >
                  <MaterialIcons
                    name="person"
                    size={24}
                    color={palette.primary}
                  />
                </View>
              )}
              <CuteText
                style={{
                  color: selectedAssignees.includes("me")
                    ? palette.primary
                    : palette.textSecondary,
                  fontSize: 13,
                }}
              >
                {profiles.me?.displayName ?? "You"}
              </CuteText>
            </Pressable>
            {partnerAvailable ? (
              <Pressable
                onPress={() => toggleAssignee("partner")}
                style={{ alignItems: "center", gap: 6 }}
              >
                {profiles.partner?.avatarUrl ? (
                  <Image
                    source={{ uri: profiles.partner.avatarUrl }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      borderWidth: selectedAssignees.includes("partner") ? 3 : 0,
                      borderColor: palette.primary,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: palette.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: selectedAssignees.includes("partner") ? 3 : 0,
                      borderColor: palette.primary,
                    }}
                  >
                    <MaterialIcons
                      name="person"
                      size={24}
                      color={palette.primary}
                    />
                  </View>
                )}
                <CuteText
                  style={{
                    color: selectedAssignees.includes("partner")
                      ? palette.primary
                      : palette.textSecondary,
                    fontSize: 13,
                  }}
                >
                  {profiles.partner?.displayName ?? "Partner"}
                </CuteText>
              </Pressable>
            ) : null}
          </View>
        </View>
        <CuteButton
          label="Add to list"
          onPress={handleAddTodo}
          disabled={!newTodoTitle.trim() || !selectedCategoryId}
        />
      </CuteModal>
    </Screen>
  );
}
