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
    const fallbacks = profiles.partner ? ["me", "partner"] : ["me"];
    dispatch({
      type: "ADD_TODO_ITEM",
      payload: {
        categoryId: selectedCategoryId,
        title: trimmed,
        assigneeIds: selectedAssignees.length ? selectedAssignees : fallbacks,
        dueDate: newTodoDate.trim() || undefined,
      },
    });
    setNewTodoTitle("");
    setNewTodoDate("");
    setSelectedAssignees(fallbacks);
    setTodoModalVisible(false);
  };

  const handleToggleTodo = (itemId: string) =>
    dispatch({ type: "TOGGLE_TODO_ITEM", payload: { itemId } });

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
          <MaterialIcons name="checklist" size={40} color={palette.primary} />
          <CuteText weight="bold" style={{ fontSize: 22 }}>
            Pair to unlock shared lists
          </CuteText>
          <CuteText tone="muted" style={{ textAlign: "center" }}>
            Keep date-night plans, bucket lists, and wishlists in one private
            place made for just the two of you.
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
        gap: 20,
      }}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          style={{ padding: 6, marginLeft: -6 }}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={20}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20 }}>
          Our Lists
        </CuteText>
        <Pressable
          onPress={() => setCategoryModalVisible(true)}
          style={{
            padding: 6,
            borderRadius: 12,
            backgroundColor: palette.primarySoft,
          }}
        >
          <MaterialIcons name="add" size={22} color={palette.primary} />
        </Pressable>
      </View>

      <View style={{ gap: 16 }}>
        {todos.categories.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {todos.categories.map((category) => {
              const isActive = category.id === selectedCategoryId;
              return (
                <View
                  key={category.id}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Pressable
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: isActive ? category.color : palette.border,
                      backgroundColor: isActive
                        ? category.color + "22"
                        : palette.card,
                    }}
                  >
                    <MaterialIcons
                      name={category.icon as any}
                      size={18}
                      color={isActive ? category.color : palette.textSecondary}
                    />
                    <CuteText
                      weight="semibold"
                      style={{
                        color: isActive ? palette.text : palette.textSecondary,
                      }}
                    >
                      {category.name}
                    </CuteText>
                  </Pressable>
                  {isActive ? (
                    <Pressable
                      onPress={() => handleDeleteCategory(category.id)}
                      style={{
                        padding: 8,
                        borderRadius: 999,
                        backgroundColor: palette.card,
                        borderWidth: 1,
                        borderColor: palette.border,
                      }}
                    >
                      <MaterialIcons name="delete" size={18} color={palette.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <CuteCard background={palette.card} padding={20} style={{ gap: 12 }}>
            <CuteText weight="bold">Create your first category</CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Organise plans by vibe — food, adventures, wellness, anything you love.
              Tap the + button to get started.
            </CuteText>
            <CuteButton label="New category" onPress={() => setCategoryModalVisible(true)} />
          </CuteCard>
        )}
        {activeCategory?.description ? (
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            {activeCategory.description}
          </CuteText>
        ) : null}
      </View>

      <View style={{ gap: 14, paddingBottom: 160 }}>
        {filteredItems.map((item) => {
          const assigneeAvatars = item.assigneeIds.map((id) =>
            id === "me" ? profiles.me?.avatarUrl : profiles.partner?.avatarUrl
          );
          return (
            <CuteCard
              key={item.id}
              background={palette.card}
              padding={20}
              style={{
                borderWidth: 1,
                borderColor: palette.border,
                gap: 14,
              }}
            >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
                <Switch
                  value={item.completed}
                  onValueChange={() => handleToggleTodo(item.id)}
                  thumbColor={item.completed ? palette.primary : "#FFFFFF"}
                  trackColor={{
                    false: palette.border,
                    true: palette.primarySoft,
                  }}
                  ios_backgroundColor={palette.border}
                />
              <CuteText
                style={{
                  flex: 1,
                  fontSize: 16,
                  textDecorationLine: item.completed ? "line-through" : "none",
                  color: item.completed ? palette.textSecondary : palette.text,
                }}
              >
                {item.title}
              </CuteText>
                <View style={{ flexDirection: "row", marginLeft: "auto" }}>
                  {assigneeAvatars.map((avatar, index) => (
                    avatar ? (
                      <Image
                        key={`${item.id}-assignee-${index}`}
                        source={{ uri: avatar }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: palette.card,
                          marginLeft: index === 0 ? 0 : -10,
                        }}
                      />
                    ) : (
                      <View
                        key={`${item.id}-assignee-${index}`}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: palette.primarySoft,
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: index === 0 ? 0 : -10,
                        }}
                      >
                        <MaterialIcons
                          name="person"
                          size={18}
                          color={palette.primary}
                        />
                      </View>
                    )
                  ))}
              </View>
            </View>
            {item.dueDate ? (
              <CuteText tone="muted" style={{ fontSize: 12 }}>
                Due {item.dueDate}
              </CuteText>
            ) : null}
            <CuteText tone="muted" style={{ fontSize: 12 }}>
              Tap the avatars to assign (coming soon)
            </CuteText>
          </CuteCard>
        );
        })}
        {!filteredItems.length && todos.categories.length ? (
          <CuteCard
            background={palette.card}
            padding={24}
            style={{ alignItems: "center", gap: 12 }}
          >
            <MaterialIcons
              name="playlist-add"
              size={36}
              color={palette.primary}
            />
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              No items yet
            </CuteText>
            <CuteText tone="muted" style={{ textAlign: "center", fontSize: 13 }}>
              Add your first shared to-do and watch this list fill with love.
            </CuteText>
            <CuteButton
              label="Add to-do"
              onPress={() => setTodoModalVisible(true)}
            />
          </CuteCard>
        ) : null}
      </View>

      <Pressable
        onPress={() => setTodoModalVisible(true)}
        style={{
          position: "absolute",
          bottom: 110,
          right: 24,
          backgroundColor: palette.primary,
          borderRadius: 24,
          width: 64,
          height: 64,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: palette.primary,
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <MaterialIcons name="add" size={28} color={palette.background} />
      </Pressable>

      <CuteModal
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
        title="Create a new category"
        subtitle="Sort your shared to-dos by vibe so collaborating feels even cuter."
      >
        <CuteTextInput
          label="Name"
          placeholder="Ex. Travel Dreams"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />
        <CuteTextInput
          label="Description"
          placeholder="Optional: describe what goes here"
          value={newCategoryDescription}
          onChangeText={setNewCategoryDescription}
        />
        <View style={{ gap: 10 }}>
          <CuteText weight="semibold">Color</CuteText>
          <View style={{ flexDirection: "row", gap: 10 }}>
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
                    borderWidth: isActive ? 3 : 2,
                    borderColor: isActive ? palette.card : "#ffffffaa",
                    shadowColor: color,
                    shadowOpacity: isActive ? 0.4 : 0.15,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                />
              );
            })}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <CuteText weight="semibold">Icon</CuteText>
          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            {iconOptions.map(({ icon, label }) => {
              const isActive = icon === newCategoryIcon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => setNewCategoryIcon(icon)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: isActive
                      ? newCategoryColor + "22"
                      : palette.background,
                    borderWidth: 1,
                    borderColor: isActive ? newCategoryColor : palette.border,
                  }}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={18}
                    color={isActive ? newCategoryColor : palette.textSecondary}
                  />
                  <CuteText
                    style={{
                      color: isActive ? palette.text : palette.textSecondary,
                    }}
                  >
                    {label}
                  </CuteText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <CuteButton
          label="Create category"
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
