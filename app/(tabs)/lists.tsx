import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  AppDatePicker,
  DateTimePickerEvent,
} from "../../components/AppDatePicker";
import { CuteButton } from "../../components/CuteButton";
import { CuteCard } from "../../components/CuteCard";
import { CuteDropdown } from "../../components/CuteDropdown";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { CuteTextInput } from "../../components/CuteTextInput";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { todoService } from "../../firebase/services";
import { usePalette } from "../../hooks/usePalette";
import { TodoItem } from "../../types/app";
import { formatDateToYMD, parseLocalDate } from "../../utils/dateUtils";

type CategoryFilterOption = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
};

type NewTodoFormValues = {
  title: string;
  categoryKey: string;
  dueDate: Date | null;
  location: string;
  costEstimate: string;
  notes: string;
  assignees: string[];
};

type NewCategoryInput = {
  name: string;
  emoji: string;
  color: string;
};

const DEFAULT_CATEGORY_FILTERS: CategoryFilterOption[] = [
  { key: "all", label: "All missions", emoji: "✨", color: "#FDE2E8" },
  { key: "home", label: "General", emoji: "📋", color: "#FFE8D6" },
  { key: "love", label: "Relationship", emoji: "❤️", color: "#FFD6EA" },
  { key: "food", label: "Food & Groceries", emoji: "🍱", color: "#FFF4D6" },
  { key: "date", label: "Date ideas", emoji: "🎬", color: "#E5DEFF" },
  { key: "travel", label: "Travel", emoji: "🧳", color: "#D6F0FF" },
];

const CATEGORY_COLOR_PRESETS = [
  "#FFE8D6",
  "#FFD6EA",
  "#E5DEFF",
  "#D6F0FF",
  "#E1F5EA",
  "#FFF4D6",
];

const formatCategoryLabelFromKey = (key: string) =>
  key
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const imageMediaType =
  (ImagePicker as any)?.MediaType?.images ??
  ImagePicker.MediaTypeOptions.Images;

const groupTodosByDate = (items: TodoItem[]) => {
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const buckets: Record<"today" | "tomorrow" | "week" | "later", TodoItem[]> = {
    today: [],
    tomorrow: [],
    week: [],
    later: [],
  };

  items.forEach((item) => {
    if (!item.dueDate) {
      buckets.later.push(item);
      return;
    }
    const date = parseLocalDate(item.dueDate);
    if (date < startOfToday) {
      buckets.today.push(item);
    } else if (date >= startOfToday && date < startOfTomorrow) {
      buckets.today.push(item);
    } else if (date >= startOfTomorrow && date < endOfWeek) {
      buckets.tomorrow.push(item);
    } else if (date >= endOfWeek) {
      buckets.later.push(item);
    } else {
      buckets.week.push(item);
    }
  });

  return [
    { key: "today", label: "Today", items: buckets.today },
    { key: "tomorrow", label: "Tomorrow", items: buckets.tomorrow },
    { key: "week", label: "This Week", items: buckets.week },
    { key: "later", label: "Later", items: buckets.later },
  ].filter((group) => group.items.length);
};

const formatAssigneeLabel = (assignees: string[], partnerName?: string) => {
  if (assignees.includes("me") && assignees.includes("partner")) {
    return "Both of you";
  }
  if (assignees.includes("partner")) {
    return partnerName ? partnerName : "Partner";
  }
  return "You";
};

const formatDueDateLabel = (value?: string) => {
  if (!value) return "Flexible date";
  const parsed = parseLocalDate(value);
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

export default function SharedListsScreen() {
  const palette = usePalette();
  const {
    state: { pairing, todos, profiles, auth, dashboard },
    dispatch,
  } = useAppData();

  const coupleId = auth.user.coupleId;
  const partnerName = profiles.partner?.displayName ?? "Partner";

  const [activeCategoryKey, setActiveCategoryKey] = useState("all");
  const [activeView, setActiveView] = useState<"todo" | "done">("todo");
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);

  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [todoBeingCompleted, setTodoBeingCompleted] = useState<TodoItem | null>(
    null
  );
  const [proofImageUri, setProofImageUri] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");

  const categoryFilters = useMemo(() => {
    const builtInKeys = new Set(
      DEFAULT_CATEGORY_FILTERS.map((filter) => filter.key)
    );
    const customFilters: CategoryFilterOption[] = todos.categories.map(
      (category) => ({
        key: category.id,
        label: category.name,
        emoji: category.icon?.trim() || "📝",
        color: category.color || palette.primarySoft,
        isCustom: true,
      })
    );
    const combined = [
      ...DEFAULT_CATEGORY_FILTERS,
      ...customFilters.filter((option) => !builtInKeys.has(option.key)),
    ];
    const seenKeys = new Set(combined.map((filter) => filter.key));
    const fallbackFilters: CategoryFilterOption[] = [];
    todos.items.forEach((item) => {
      const key = item.categoryKey ?? item.categoryId;
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        fallbackFilters.push({
          key,
          label: formatCategoryLabelFromKey(key),
          emoji: "📝",
          color: palette.primarySoft,
          isCustom: true,
        });
      }
    });
    return [...combined, ...fallbackFilters];
  }, [todos.categories, todos.items, palette.primarySoft]);

  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, CategoryFilterOption>();
    categoryFilters.forEach((filter) => {
      if (filter.key !== "all") {
        lookup.set(filter.key, filter);
      }
    });
    return lookup;
  }, [categoryFilters]);

  const categoryOptionsForForm = useMemo(
    () => categoryFilters.filter((filter) => filter.key !== "all"),
    [categoryFilters]
  );

  const defaultNewTodoCategory = categoryOptionsForForm[0]?.key ?? "home";

  const activeCategory = useMemo(
    () => categoryFilters.find((filter) => filter.key === activeCategoryKey),
    [categoryFilters, activeCategoryKey]
  );

  const completedCount = useMemo(
    () => todos.items.filter((item) => item.completed).length,
    [todos.items]
  );
  const totalCount = todos.items.length || 1;
  const completedProgress = Math.min(completedCount / totalCount, 1);

  const filteredTodos = useMemo(() => {
    if (activeCategoryKey === "all") {
      return todos.items;
    }
    return todos.items.filter((item) => {
      const key = item.categoryKey ?? item.categoryId;
      return key === activeCategoryKey;
    });
  }, [todos.items, activeCategoryKey]);

  const upcomingTodos = useMemo(
    () => filteredTodos.filter((item) => !item.completed),
    [filteredTodos]
  );

  const completedTodos = useMemo(
    () =>
      filteredTodos
        .filter((item) => item.completed)
        .sort((a, b) =>
          (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
        ),
    [filteredTodos]
  );

  const groupedUpcoming = useMemo(
    () => groupTodosByDate(upcomingTodos),
    [upcomingTodos]
  );

  const anniversaryDayCount = useMemo(() => {
    if (!dashboard.anniversaryDate) return undefined;
    const anniversary = parseLocalDate(dashboard.anniversaryDate);
    if (Number.isNaN(anniversary.getTime())) return undefined;
    const today = new Date();
    return Math.max(
      0,
      Math.floor((today.getTime() - anniversary.getTime()) / 86400000)
    );
  }, [dashboard.anniversaryDate]);

  const openProofModal = (todo: TodoItem) => {
    setTodoBeingCompleted(todo);
    setProofImageUri(null);
    setProofNote("");
    setProofModalVisible(true);
  };

  const handleToggleTodo = async (todo: TodoItem, value: boolean) => {
    if (!coupleId) return;
    if (value) {
      openProofModal(todo);
      return;
    }
    try {
      await todoService.toggleTodo(coupleId, todo.id, false);
      dispatch({
        type: "TOGGLE_TODO_ITEM",
        payload: { itemId: todo.id, completed: false, completedAt: null },
      });
    } catch (error) {
      console.error("Failed to un-complete todo", error);
    }
  };

  const renderCompletionToggle = (
    todo: TodoItem,
    mode: "complete" | "undo" = "complete"
  ) => (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        handleToggleTodo(todo, mode === "undo" ? false : !todo.completed);
      }}
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          mode === "undo"
            ? palette.primarySoft
            : todo.completed
            ? palette.primarySoft
            : palette.card,
        borderWidth: 1,
        borderColor: mode === "undo" ? palette.primary : palette.primarySoft,
      }}
      hitSlop={10}
    >
      <MaterialIcons
        name={
          mode === "undo"
            ? "undo"
            : todo.completed
            ? "check-circle"
            : "radio-button-unchecked"
        }
        size={22}
        color={
          mode === "undo"
            ? palette.primary
            : todo.completed
            ? palette.primary
            : palette.primary
        }
      />
    </Pressable>
  );

  const handleCreateTodo = async (values: NewTodoFormValues) => {
    if (!coupleId) {
      throw new Error("Missing couple");
    }
    const trimmedTitle = values.title.trim();
    if (!trimmedTitle.length) {
      throw new Error("Title is required");
    }
    if (!values.assignees.length) {
      throw new Error("Select at least one assignee");
    }
    const trimmedLocation = values.location.trim();
    const trimmedCost = values.costEstimate.trim();
    const trimmedNotes = values.notes.trim();
    const dueDateString = values.dueDate
      ? formatDateToYMD(values.dueDate.toISOString())
      : undefined;

    try {
      const id = await todoService.createTodoItem(coupleId, {
        categoryId: values.categoryKey,
        categoryKey: values.categoryKey,
        title: trimmedTitle,
        assigneeIds: values.assignees,
        dueDate: dueDateString,
        location: trimmedLocation || undefined,
        costEstimate: trimmedCost || undefined,
        notes: trimmedNotes || undefined,
      });
      dispatch({
        type: "ADD_TODO_ITEM",
        payload: {
          id,
          categoryId: values.categoryKey,
          categoryKey: values.categoryKey,
          title: trimmedTitle,
          assigneeIds: values.assignees,
          dueDate: dueDateString,
          location: trimmedLocation || undefined,
          costEstimate: trimmedCost || undefined,
          notes: trimmedNotes || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to add todo", error);
      throw error;
    }
  };

  const handleCreateCategory = async ({
    name,
    emoji,
    color,
  }: NewCategoryInput) => {
    if (!coupleId) {
      throw new Error("Missing couple");
    }
    const trimmedName = name.trim();
    if (!trimmedName.length) {
      throw new Error("Category name required");
    }
    const normalizedEmoji = emoji.trim() || "📝";
    try {
      const id = await todoService.createCategory(coupleId, {
        name: trimmedName,
        icon: normalizedEmoji,
        color,
        description: null,
        order: todos.categories.length,
      });
      dispatch({
        type: "ADD_TODO_CATEGORY",
        payload: {
          id,
          name: trimmedName,
          icon: normalizedEmoji,
          color,
        },
      });
      return id;
    } catch (error) {
      console.error("Failed to create category", error);
      throw error;
    }
  };

  const handlePickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imageMediaType,
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      setProofImageUri(result.assets[0].uri);
    }
  };

  const completeTodoMission = async (withPhoto: boolean) => {
    if (!coupleId || !todoBeingCompleted) return;
    try {
      await todoService.toggleTodo(coupleId, todoBeingCompleted.id, true, {
        proofPhotoUri: withPhoto ? proofImageUri ?? undefined : undefined,
        note: proofNote.trim() || undefined,
        milestoneTitle: todoBeingCompleted.title,
        milestoneDescription: proofNote.trim() || undefined,
        dayCount: anniversaryDayCount,
      });
      dispatch({
        type: "TOGGLE_TODO_ITEM",
        payload: {
          itemId: todoBeingCompleted.id,
          completed: true,
          proofImageUrl: proofImageUri ?? undefined,
          completedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Failed to complete todo", error);
    } finally {
      setProofModalVisible(false);
      setTodoBeingCompleted(null);
      setProofImageUri(null);
      setProofNote("");
    }
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
            Once you both connect, shared to-dos sparkle with avatars and cute
            reminders.
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
        paddingTop: 24,
        gap: 24,
      }}
    >
      <StatusBar style="dark" />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
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
        <View style={{ flex: 1, alignItems: "center" }}>
          <CuteText weight="bold" style={{ fontSize: 20, color: palette.text }}>
            To-dos
          </CuteText>
        </View>
        <Pressable
          onPress={() => setTodoModalVisible(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </Pressable>
      </View>

      <CuteCard background={palette.card} padding={20} style={{ gap: 14 }}>
        <CuteText weight="bold" style={{ fontSize: 18 }}>
          You’ve done {completedCount} things together 💑
        </CuteText>
        <View
          style={{
            height: 10,
            borderRadius: 999,
            backgroundColor: palette.primarySoft,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${completedProgress * 100}%`,
              backgroundColor: palette.primary,
              borderRadius: 999,
            }}
          />
        </View>
        <CuteText tone="muted" style={{ fontSize: 12 }}>
          {completedCount}/{totalCount === 1 ? completedCount : totalCount}{" "}
          shared missions completed
        </CuteText>
      </CuteCard>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {categoryFilters.map((filter) => {
          const isActive = filter.key === activeCategoryKey;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveCategoryKey(filter.key)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 12,
                backgroundColor: isActive ? filter.color : palette.card,
                borderRadius: 999,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: isActive ? filter.color : palette.primarySoft,
              }}
            >
              <CuteText
                weight="semibold"
                style={{
                  color: isActive ? palette.text : palette.textSecondary,
                }}
              >
                {filter.emoji} {filter.label}
              </CuteText>
            </Pressable>
          );
        })}
      </ScrollView>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: -4,
        }}
      >
        <MaterialIcons
          name="filter-alt"
          size={16}
          color={palette.textSecondary}
        />
        <CuteText tone="muted" style={{ fontSize: 12 }}>
          {(activeCategory?.label ?? "All missions") +
            " • " +
            upcomingTodos.length +
            (upcomingTodos.length === 1 ? " plan" : " plans")}
        </CuteText>
      </View>

      <View
        style={{
          flexDirection: "row",
          borderRadius: 999,
          borderWidth: 1,
          borderColor: palette.primarySoft,
          padding: 4,
          backgroundColor: palette.card,
        }}
      >
        {["todo", "done"].map((view) => {
          const isActive = activeView === view;
          return (
            <Pressable
              key={view}
              onPress={() => setActiveView(view as "todo" | "done")}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 999,
                alignItems: "center",
                backgroundColor: isActive ? palette.primary : "transparent",
              }}
            >
              <CuteText
                weight="bold"
                style={{ color: isActive ? "#fff" : palette.text }}
              >
                {view === "todo" ? "To-dos" : "Done"}
              </CuteText>
            </Pressable>
          );
        })}
      </View>

      {activeView === "todo" ? (
        groupedUpcoming.length ? (
          groupedUpcoming.map((group) => (
            <CuteCard
              key={group.key}
              background={palette.card}
              padding={20}
              style={{ gap: 16 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <CuteText weight="bold" style={{ fontSize: 18 }}>
                  {group.label}
                </CuteText>
                <CuteText tone="muted" style={{ fontSize: 12 }}>
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "mission" : "missions"}
                </CuteText>
              </View>
              <View style={{ gap: 12 }}>
                {group.items.map((item) => {
                  const assigneeLabel = formatAssigneeLabel(
                    item.assigneeIds,
                    partnerName
                  );
                  const categoryKey = item.categoryKey ?? item.categoryId;
                  const categoryMeta = categoryLookup.get(categoryKey);
                  const pillItems = [
                    `📅 ${formatDueDateLabel(item.dueDate)}`,
                    `👥 ${assigneeLabel}`,
                  ];
                  if (categoryMeta) {
                    pillItems.push(
                      `${categoryMeta.emoji} ${categoryMeta.label}`
                    );
                  }
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        setSelectedTodo(item);
                        setDetailModalVisible(true);
                      }}
                      style={{
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: palette.border,
                        backgroundColor: palette.background,
                        padding: 14,
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor:
                              categoryMeta?.color ?? palette.cardAlt,
                          }}
                        >
                          <CuteText weight="bold">
                            {categoryMeta?.emoji ?? "📝"}
                          </CuteText>
                        </View>
                        <View style={{ flex: 1, gap: 8 }}>
                          <CuteText weight="semibold" style={{ fontSize: 16 }}>
                            {item.title}
                          </CuteText>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              gap: 8,
                            }}
                          >
                            {pillItems.map((pill, index) => (
                              <View
                                key={`${pill}-${index}`}
                                style={{
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 999,
                                  backgroundColor: palette.card,
                                  borderWidth: 1,
                                  borderColor: palette.primarySoft,
                                }}
                              >
                                <CuteText style={{ fontSize: 12 }}>
                                  {pill}
                                </CuteText>
                              </View>
                            ))}
                          </View>
                          {item.location ? (
                            <CuteText tone="muted" style={{ fontSize: 12 }}>
                              📍 {item.location}
                            </CuteText>
                          ) : null}
                          {item.costEstimate ? (
                            <CuteText tone="muted" style={{ fontSize: 12 }}>
                              💸 {item.costEstimate}
                            </CuteText>
                          ) : null}
                          {item.notes ? (
                            <CuteText tone="muted" style={{ fontSize: 12 }}>
                              📝 {item.notes}
                            </CuteText>
                          ) : null}
                        </View>
                        {renderCompletionToggle(item, "complete")}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </CuteCard>
          ))
        ) : (
          <CuteCard background={palette.card} padding={24} style={{ gap: 10 }}>
            <MaterialIcons
              name="playlist-add"
              size={42}
              color={palette.primary}
            />
            <CuteText weight="bold" style={{ fontSize: 18 }}>
              Nothing planned here yet
            </CuteText>
            <CuteText tone="muted" style={{ fontSize: 13 }}>
              Add a shared to-do and keep it tracked together.
            </CuteText>
            <CuteButton
              label="Add a to-do"
              onPress={() => setTodoModalVisible(true)}
            />
          </CuteCard>
        )
      ) : completedTodos.length ? (
        <CuteCard background={palette.card} padding={20} style={{ gap: 16 }}>
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            Finished together
          </CuteText>
          <View style={{ gap: 12 }}>
            {completedTodos.map((item) => {
              const completedLabel = item.completedAt
                ? new Date(item.completedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "Completed";
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedTodo(item);
                    setDetailModalVisible(true);
                  }}
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.background,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {item.proofImageUrl ? (
                      <Image
                        source={{ uri: item.proofImageUrl }}
                        style={{ width: 60, height: 60, borderRadius: 16 }}
                      />
                    ) : (
                      <Pressable
                        onPress={(event) => {
                          event.stopPropagation();
                          setSelectedTodo(item);
                          openProofModal(item);
                        }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderStyle: "dashed",
                          borderColor: palette.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialIcons
                          name="add-a-photo"
                          size={20}
                          color={palette.primary}
                        />
                      </Pressable>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <CuteText weight="semibold">{item.title}</CuteText>
                      <CuteText tone="muted" style={{ fontSize: 12 }}>
                        {completedLabel}
                      </CuteText>
                    </View>
                    {renderCompletionToggle(item, "undo")}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </CuteCard>
      ) : (
        <CuteCard background={palette.card} padding={24} style={{ gap: 10 }}>
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            No finished missions yet
          </CuteText>
          <CuteText tone="muted" style={{ fontSize: 13 }}>
            Complete a task and save a sweet proof photo here.
          </CuteText>
        </CuteCard>
      )}

      <AddTodoModal
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
        categories={categoryOptionsForForm}
        defaultCategoryKey={defaultNewTodoCategory}
        partnerName={partnerName}
        onCreateTodo={handleCreateTodo}
        onCreateCategory={handleCreateCategory}
      />

      <CuteModal
        visible={detailModalVisible && Boolean(selectedTodo)}
        onRequestClose={() => setDetailModalVisible(false)}
        title={selectedTodo?.title ?? "Details"}
        subtitle="Quick glance at the plan"
      >
        {selectedTodo ? (
          <View style={{ gap: 12 }}>
            {selectedTodo.location ? (
              <CuteText>📍 {selectedTodo.location}</CuteText>
            ) : null}
            {selectedTodo.costEstimate ? (
              <CuteText>💸 {selectedTodo.costEstimate}</CuteText>
            ) : null}
            {selectedTodo.notes ? (
              <CuteText>📝 {selectedTodo.notes}</CuteText>
            ) : null}
            {selectedTodo.dueDate ? (
              <CuteText>
                📅{" "}
                {formatDateToYMD(
                  parseLocalDate(selectedTodo.dueDate).toISOString()
                )}
              </CuteText>
            ) : null}
            <CuteButton
              label={
                selectedTodo.completed ? "Mark as not done" : "Mark as done"
              }
              onPress={() => {
                setDetailModalVisible(false);
                handleToggleTodo(selectedTodo, !selectedTodo.completed);
              }}
            />
          </View>
        ) : null}
      </CuteModal>

      <CuteModal
        visible={proofModalVisible && Boolean(todoBeingCompleted)}
        onRequestClose={() => setProofModalVisible(false)}
        title="Proof of love mission"
        subtitle="Add a cute receipt or skip to keep it simple."
      >
        <Pressable
          onPress={handlePickProofImage}
          style={{
            height: 160,
            borderRadius: 20,
            borderWidth: proofImageUri ? 0 : 2,
            borderStyle: proofImageUri ? "solid" : "dashed",
            borderColor: palette.primary,
            backgroundColor: palette.card,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {proofImageUri ? (
            <Image
              source={{ uri: proofImageUri }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <View style={{ alignItems: "center", gap: 6 }}>
              <MaterialIcons
                name="add-a-photo"
                size={28}
                color={palette.primary}
              />
              <CuteText tone="muted">Tap to add a photo</CuteText>
            </View>
          )}
        </Pressable>
        <CuteTextInput
          label="Caption (optional)"
          placeholder="How did it go?"
          value={proofNote}
          onChangeText={setProofNote}
        />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <CuteButton
            label="Skip photo"
            tone="ghost"
            onPress={() => completeTodoMission(false)}
          />
          <CuteButton
            label="Save memory"
            onPress={() => completeTodoMission(true)}
            disabled={!proofImageUri}
          />
        </View>
      </CuteModal>
    </Screen>
  );
}

type AddTodoModalProps = {
  visible: boolean;
  onClose: () => void;
  categories: CategoryFilterOption[];
  defaultCategoryKey: string;
  partnerName: string;
  onCreateTodo: (values: NewTodoFormValues) => Promise<void>;
  onCreateCategory: (values: NewCategoryInput) => Promise<string>;
};

const AddTodoModal = ({
  visible,
  onClose,
  categories,
  defaultCategoryKey,
  partnerName,
  onCreateTodo,
  onCreateCategory,
}: AddTodoModalProps) => {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState(defaultCategoryKey);
  const [location, setLocation] = useState("");
  const [costEstimate, setCostEstimate] = useState("");
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState<string[]>(["me"]);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [pendingDate, setPendingDate] = useState<Date>(new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("📝");
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLOR_PRESETS[0]);
  const [categorySaving, setCategorySaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAssigneeError, setShowAssigneeError] = useState(false);
  const categoryOptions = useMemo(
    () =>
      categories.map((filter) => ({
        label: `${filter.emoji} ${filter.label}`,
        value: filter.key,
      })),
    [categories]
  );

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryEmoji("📝");
    setCategoryColor(CATEGORY_COLOR_PRESETS[0]);
    setCategorySaving(false);
  };

  const resetForm = useCallback(() => {
    setTitle("");
    setCategoryKey(defaultCategoryKey);
    setLocation("");
    setCostEstimate("");
    setNotes("");
    setAssignees(["me"]);
    setDueDate(null);
    setPendingDate(new Date());
    setDatePickerVisible(false);
    setCategoryFormVisible(false);
    setShowAssigneeError(false);
    resetCategoryForm();
  }, [defaultCategoryKey]);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  useEffect(() => {
    if (visible && !categories.some((option) => option.key === categoryKey)) {
      setCategoryKey(defaultCategoryKey);
    }
  }, [categories, categoryKey, defaultCategoryKey, visible]);

  const dismissModal = () => {
    resetForm();
    onClose();
  };

  const handleToggleAssignee = (key: string) => {
    setAssignees((prev) =>
      prev.includes(key)
        ? prev.filter((entry) => entry !== key)
        : [...prev, key]
    );
    setShowAssigneeError(false);
  };

  const handleAddCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName.length || categorySaving) {
      return;
    }
    setCategorySaving(true);
    try {
      const id = await onCreateCategory({
        name: trimmedName,
        emoji: categoryEmoji,
        color: categoryColor,
      });
      setCategoryKey(id);
      setCategoryFormVisible(false);
      resetCategoryForm();
    } catch (error) {
      console.error("Failed to create category", error);
      Alert.alert("Couldn't save category", "Please try again.");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle.length || submitting) {
      return;
    }
    if (!assignees.length) {
      setShowAssigneeError(true);
      return;
    }
    setSubmitting(true);
    try {
      await onCreateTodo({
        title: trimmedTitle,
        categoryKey,
        dueDate,
        location: location.trim(),
        costEstimate: costEstimate.trim(),
        notes: notes.trim(),
        assignees,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save to-do", error);
      Alert.alert("Couldn't save to-do", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDatePicker = () => {
    setPendingDate(dueDate ?? new Date());
    setDatePickerVisible(true);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    date?: Date
  ) => {
    if (Platform.OS === "android" && event.type === "dismissed") {
      return;
    }
    if (date) {
      setPendingDate(date);
    }
  };

  const handleDateConfirm = () => {
    setDueDate(pendingDate);
    setDatePickerVisible(false);
  };

  const handleClearDate = () => {
    setDueDate(null);
    setDatePickerVisible(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={dismissModal}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: palette.card,
          }}
        >
          <View
            style={{
              flex: 1,
              paddingHorizontal: 20,
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 60,
              }}
            >
              <Pressable
                onPress={dismissModal}
                style={{ padding: 8, marginLeft: -8 }}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={20}
                  color={palette.textSecondary}
                />
              </Pressable>
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <CuteText
                  weight="bold"
                  style={{ fontSize: 20, marginLeft: 20 }}
                >
                  Add to-do
                </CuteText>
              </View>
              <View style={{ width: 44 }} />
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={insets.bottom + 24}
              style={{ flex: 1 }}
            >
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  gap: 16,
                  paddingBottom: insets.bottom + 32,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                showsVerticalScrollIndicator={false}
              >
                <CuteTextInput
                  label="What’s the plan?"
                  placeholder="Ex. Picnic at the botanical garden"
                  value={title}
                  onChangeText={setTitle}
                />
                <View style={{ gap: 12 }}>
                  <CuteText weight="semibold">Category</CuteText>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <CuteDropdown
                        value={categoryKey}
                        onChange={(value) => {
                          if (value) {
                            setCategoryKey(value);
                          }
                        }}
                        options={categoryOptions}
                        placeholder="Select a category"
                        modalTitle="Choose a category"
                      />
                    </View>
                    <Pressable
                      onPress={() => {
                        resetCategoryForm();
                        setCategoryFormVisible(true);
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: palette.primary,
                        backgroundColor: palette.card,
                      }}
                    >
                      <CuteText
                        weight="semibold"
                        style={{ color: palette.primary }}
                      >
                        + New
                      </CuteText>
                    </Pressable>
                  </View>
                  {categoryFormVisible ? (
                    <View
                      style={{
                        marginTop: 12,
                        padding: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: palette.primarySoft,
                        backgroundColor: palette.background,
                        gap: 12,
                      }}
                    >
                      <CuteText weight="semibold">New category</CuteText>
                      <CuteTextInput
                        label="Name"
                        placeholder="Ex. Weekend escapes"
                        value={categoryName}
                        onChangeText={setCategoryName}
                      />
                      <CuteTextInput
                        label="Emoji or short icon"
                        placeholder="Ex. 🌿"
                        value={categoryEmoji}
                        onChangeText={(text) =>
                          setCategoryEmoji(text.slice(0, 4))
                        }
                        maxLength={4}
                      />
                      <View style={{ gap: 8 }}>
                        <CuteText weight="semibold">Color</CuteText>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 10,
                          }}
                        >
                          {CATEGORY_COLOR_PRESETS.map((color) => {
                            const isActive = categoryColor === color;
                            return (
                              <Pressable
                                key={color}
                                onPress={() => setCategoryColor(color)}
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 17,
                                  backgroundColor: color,
                                  borderWidth: isActive ? 2 : 0,
                                  borderColor: palette.primary,
                                }}
                              />
                            );
                          })}
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 12 }}>
                        <CuteButton
                          label="Cancel"
                          tone="ghost"
                          onPress={() => {
                            resetCategoryForm();
                            setCategoryFormVisible(false);
                          }}
                          style={{ flex: 1 }}
                        />
                        <CuteButton
                          label={categorySaving ? "Saving..." : "Save"}
                          onPress={handleAddCategory}
                          disabled={!categoryName.trim() || categorySaving}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
                <CuteTextInput
                  label="Location (optional)"
                  placeholder="Ex. Botanical gardens"
                  value={location}
                  onChangeText={setLocation}
                />
                <CuteTextInput
                  label="Cost estimate (optional)"
                  placeholder="Ex. $40 picnic supplies"
                  value={costEstimate}
                  onChangeText={setCostEstimate}
                />
                <CuteTextInput
                  label="Notes"
                  placeholder="Any sweet reminders?"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  style={{ minHeight: 100, textAlignVertical: "top" }}
                />
                <View style={{ gap: 12 }}>
                  <CuteText weight="semibold">Plan for</CuteText>
                  <Pressable
                    onPress={openDatePicker}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: palette.primarySoft,
                      backgroundColor: palette.card,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <CuteText>
                      {dueDate
                        ? dueDate.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Tap to pick a day"}
                    </CuteText>
                    <MaterialIcons
                      name="calendar-today"
                      size={18}
                      color={palette.textSecondary}
                    />
                  </Pressable>
                </View>
                <View style={{ gap: 12 }}>
                  <CuteText weight="semibold">Who’s doing this?</CuteText>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}
                  >
                    {[
                      { key: "me", label: "You" },
                      { key: "partner", label: partnerName },
                    ].map((option) => {
                      const isActive = assignees.includes(option.key);
                      return (
                        <Pressable
                          key={option.key}
                          onPress={() => handleToggleAssignee(option.key)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 999,
                            backgroundColor: isActive
                              ? palette.primary
                              : palette.card,
                            borderWidth: 2,
                            borderColor: isActive
                              ? palette.primary
                              : palette.primarySoft,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <CuteText
                            weight="semibold"
                            style={{ color: isActive ? "#fff" : palette.text }}
                          >
                            {option.label}
                          </CuteText>
                          {isActive ? (
                            <MaterialIcons
                              name="check-circle"
                              size={16}
                              color="#fff"
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  {showAssigneeError ? (
                    <CuteText style={{ color: palette.warning, fontSize: 12 }}>
                      Pick who will take this mission.
                    </CuteText>
                  ) : null}
                </View>
                <CuteButton
                  label={submitting ? "Saving..." : "Save to-do"}
                  onPress={handleSubmit}
                  disabled={!title.trim().length || submitting}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
          {datePickerVisible ? (
            <Pressable
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#1f172244",
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
              onPress={() => setDatePickerVisible(false)}
            >
              <Pressable
                onPress={(event) => event.stopPropagation()}
                style={{
                  width: "100%",
                  borderRadius: 24,
                  backgroundColor: palette.card,
                  padding: 20,
                  gap: 16,
                  shadowColor: "#00000030",
                  shadowOpacity: 0.2,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <CuteText weight="bold" style={{ fontSize: 18 }}>
                    Pick a due date
                  </CuteText>
                  <Pressable onPress={() => setDatePickerVisible(false)}>
                    <MaterialIcons
                      name="close"
                      size={20}
                      color={palette.textSecondary}
                    />
                  </Pressable>
                </View>
                <AppDatePicker
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  value={pendingDate}
                  onChange={handleDateChange}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <CuteButton
                    label="Clear"
                    tone="ghost"
                    onPress={handleClearDate}
                    style={{ flex: 1 }}
                  />
                  <CuteButton
                    label="Save date"
                    onPress={handleDateConfirm}
                    style={{ flex: 1 }}
                  />
                </View>
              </Pressable>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </Modal>
    </>
  );
};
