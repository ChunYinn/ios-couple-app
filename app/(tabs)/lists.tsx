import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
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

type IconName = ComponentProps<typeof MaterialIcons>["name"];

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
    state: { pairing, todos, profiles, auth },
    dispatch,
  } = useAppData();

  const coupleId = auth.user.coupleId;
  const partnerName = profiles.partner?.displayName ?? "Partner";
  const myName = profiles.me?.displayName ?? "You";
  const partnerAvatar = profiles.partner?.avatarUrl ?? null;
  const myAvatar = profiles.me?.avatarUrl ?? null;

  const [activeCategoryKey, setActiveCategoryKey] = useState("all");
  const [activeView, setActiveView] = useState<"todo" | "done">("todo");
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<{
    id: string;
    name: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [categoryEditorSaving, setCategoryEditorSaving] = useState(false);
  const [categoryEditorError, setCategoryEditorError] = useState<string | null>(
    null
  );

  const uniqueTodoItems = useMemo(() => {
    const seen = new Set<string>();
    return todos.items.filter((item) => {
      if (!item.id) {
        return true;
      }
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [todos.items]);

  const selectedTodo = useMemo(
    () => uniqueTodoItems.find((item) => item.id === selectedTodoId) ?? null,
    [uniqueTodoItems, selectedTodoId]
  );

  const editingTodo = useMemo(
    () => uniqueTodoItems.find((item) => item.id === editingTodoId) ?? null,
    [uniqueTodoItems, editingTodoId]
  );

  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedTodoId(null);
  };

  const categoryFilters = useMemo(() => {
    const builtInKeys = new Set(
      DEFAULT_CATEGORY_FILTERS.map((filter) => filter.key)
    );

    const seenCustomKeys = new Set<string>();
    const customFilters: CategoryFilterOption[] = [];
    todos.categories.forEach((category) => {
      if (seenCustomKeys.has(category.id)) {
        return;
      }
      seenCustomKeys.add(category.id);
      customFilters.push({
        key: category.id,
        label: category.name,
        emoji: category.icon?.trim() || "📝",
        color: category.color || palette.primarySoft,
        isCustom: true,
      });
    });

    const combined = [
      ...DEFAULT_CATEGORY_FILTERS,
      ...customFilters.filter((option) => !builtInKeys.has(option.key)),
    ];

    const seenKeys = new Set(combined.map((filter) => filter.key));
    const fallbackFilters: CategoryFilterOption[] = [];
    uniqueTodoItems.forEach((item) => {
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

    const uniqueFilters: CategoryFilterOption[] = [];
    const usedKeys = new Set<string>();
    [...combined, ...fallbackFilters].forEach((filter) => {
      if (usedKeys.has(filter.key)) return;
      usedKeys.add(filter.key);
      uniqueFilters.push(filter);
    });

    return uniqueFilters;
  }, [todos.categories, uniqueTodoItems, palette.primarySoft]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, { todo: number; done: number }>();
    let openTotal = 0;
    let doneTotal = 0;
    uniqueTodoItems.forEach((item) => {
      const resolvedKey = item.categoryKey ?? item.categoryId;
      if (item.completed) {
        doneTotal += 1;
      } else {
        openTotal += 1;
      }
      if (!resolvedKey) {
        return;
      }
      const existing = counts.get(resolvedKey) ?? { todo: 0, done: 0 };
      if (item.completed) {
        existing.done += 1;
      } else {
        existing.todo += 1;
      }
      counts.set(resolvedKey, existing);
    });
    counts.set("all", { todo: openTotal, done: doneTotal });
    return counts;
  }, [uniqueTodoItems]);

  const canEditCategory = (filter: CategoryFilterOption) => {
    if (filter.key === "all") return false;
    return todos.categories.some((category) => category.id === filter.key);
  };

  const openCategoryEditor = (filter: CategoryFilterOption) => {
    if (!canEditCategory(filter)) return;
    const existing = todos.categories.find((category) => category.id === filter.key);
    if (!existing) return;
    setCategoryEditor({
      id: existing.id,
      name: existing.name,
      emoji: existing.icon ?? filter.emoji,
      color: existing.color ?? filter.color,
    });
    setCategoryEditorError(null);
  };

  const closeCategoryEditor = () => {
    if (categoryEditorSaving) return;
    setCategoryEditor(null);
    setCategoryEditorError(null);
  };

  const submitCategoryEdit = async () => {
    if (!categoryEditor || categoryEditorSaving) {
      return;
    }
    const trimmedName = categoryEditor.name.trim();
    if (!trimmedName.length) {
      setCategoryEditorError("Name is required.");
      return;
    }
    setCategoryEditorError(null);
    setCategoryEditorSaving(true);
    try {
      await handleUpdateCategory(categoryEditor.id, {
        name: trimmedName,
        emoji: categoryEditor.emoji,
        color: categoryEditor.color,
      });
      setCategoryEditor(null);
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      if (code === "CATEGORY_EXISTS") {
        setCategoryEditorError("That name is already taken.");
      } else {
        Alert.alert("Couldn't update category", "Please try again.");
      }
    } finally {
      setCategoryEditorSaving(false);
    }
  };

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
    () => uniqueTodoItems.filter((item) => item.completed).length,
    [uniqueTodoItems]
  );
  const totalCount = uniqueTodoItems.length || 1;
  const completedProgress = Math.min(completedCount / totalCount, 1);

  const filteredTodos = useMemo(() => {
    if (activeCategoryKey === "all") {
      return uniqueTodoItems;
    }
    return uniqueTodoItems.filter((item) => {
      const key = item.categoryKey ?? item.categoryId;
      return key === activeCategoryKey;
    });
  }, [uniqueTodoItems, activeCategoryKey]);

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

  const groupedTodosByDate = useMemo(
    () => groupTodosByDate(filteredTodos),
    [filteredTodos]
  );

  const formatAssigneesText = (assignees: string[]) => {
    if (!assignees.length) return "Unassigned";
    const hasMe = assignees.includes("me");
    const hasPartner = assignees.includes("partner");
    if (hasMe && hasPartner) {
      return `${myName} & ${partnerName}`;
    }
    if (hasPartner) return partnerName;
    return myName;
  };

  const handleToggleTodo = async (todo: TodoItem, value: boolean) => {
    if (!coupleId) return;
    try {
      await todoService.toggleTodo(coupleId, todo.id, value);
      dispatch({
        type: "TOGGLE_TODO_ITEM",
        payload: {
          itemId: todo.id,
          completed: value,
          completedAt: value ? new Date().toISOString() : null,
        },
      });
    } catch (error) {
      console.error("Failed to toggle todo", error);
    }
  };

  const renderAssigneeAvatars = (assigneeIds: string[]) => {
    if (!assigneeIds.length) {
      return null;
    }
    const entries = assigneeIds.map((id) => {
      const isMe = id === "me";
      return {
        id,
        label: isMe ? myName : partnerName,
        avatar: isMe ? myAvatar : partnerAvatar,
      };
    });
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {entries.map((entry, index) => (
          <View
            key={`${entry.id}-${index}`}
            style={{
              marginLeft: index ? -8 : 0,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: palette.card,
              overflow: "hidden",
              width: 32,
              height: 32,
              backgroundColor: palette.primarySoft,
            }}
          >
            {entry.avatar ? (
              <Image
                source={{ uri: entry.avatar }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CuteText weight="bold" style={{ fontSize: 13 }}>
                  {entry.label.charAt(0).toUpperCase()}
                </CuteText>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderInfoRow = (icon: IconName, text: string) => (
    <View
      key={`${icon}-${text}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <MaterialIcons name={icon} size={14} color={palette.textSecondary} />
      <CuteText tone="muted" style={{ fontSize: 12, flexShrink: 1 }}>
        {text}
      </CuteText>
    </View>
  );

  const formatCompletionLabel = (todo: TodoItem) => {
    if (!todo.completedAt) return "Completed";
    try {
      return `Completed ${new Date(todo.completedAt).toLocaleDateString(
        undefined,
        { month: "short", day: "numeric" }
      )}`;
    } catch {
      return "Completed";
    }
  };

  const renderMissionCard = (
    item: TodoItem,
    completionMode: "complete" | "undo" = "complete"
  ) => {
    const isCompleted = item.completed;
    const categoryKey = item.categoryKey ?? item.categoryId;
    const categoryMeta = categoryLookup.get(categoryKey);
    const emoji = categoryMeta?.emoji ?? "📝";
    const completionLabel =
      completionMode === "undo" ? formatCompletionLabel(item) : null;
    const dueDateObj = item.dueDate ? parseLocalDate(item.dueDate) : null;
    const isOverdue =
      !!dueDateObj && !item.completed && dueDateObj < startOfToday;

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          setSelectedTodoId(item.id);
          setDetailModalVisible(true);
        }}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          borderRadius: 18,
          backgroundColor: palette.card,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
          borderWidth: 1,
          borderColor: isCompleted ? palette.primarySoft : palette.border,
          opacity: isCompleted && completionMode === "complete" ? 0.75 : 1,
          position: "relative",
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: categoryMeta?.color ?? palette.primarySoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CuteText style={{ fontSize: 22 }}>{emoji}</CuteText>
        </View>
        <View style={{ flex: 1, gap: 10 }}>
          <CuteText
            weight="semibold"
            style={[
              { fontSize: 16 },
              isCompleted && {
                textDecorationLine: "line-through",
                color: palette.textSecondary,
              },
            ]}
          >
            {item.title}
          </CuteText>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: palette.primarySoft,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <MaterialIcons
                name="calendar-today"
                size={14}
                color={isOverdue ? "#B42318" : palette.text}
              />
              <CuteText
                style={{
                  fontSize: 12,
                  color: isOverdue ? "#B42318" : palette.text,
                }}
              >
                {item.dueDate ? formatDueDateLabel(item.dueDate) : "Flexible"}
              </CuteText>
            </View>
            {isOverdue ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "#F8B4B4",
                }}
              >
                <MaterialIcons name="warning" size={14} color="#4A2222" />
                <CuteText style={{ fontSize: 11, color: "#4A2222" }}>
                  Overdue
                </CuteText>
              </View>
            ) : null}
          </View>
          {completionLabel ? (
            <CuteText tone="muted" style={{ fontSize: 11 }}>
              {completionLabel}
            </CuteText>
          ) : null}
        </View>
        <View style={{ position: "absolute", top: 12, right: 12 }}>
          {renderAssigneeAvatars(item.assigneeIds)}
        </View>
      </Pressable>
    );
  };

  const detailDueDate = selectedTodo?.dueDate
    ? parseLocalDate(selectedTodo.dueDate)
    : null;
  const detailOverdue =
    !!detailDueDate &&
    !!selectedTodo &&
    !selectedTodo.completed &&
    detailDueDate < startOfToday;
  const detailDueText = selectedTodo?.dueDate
    ? `Due ${formatDueDateLabel(selectedTodo.dueDate)}`
    : "Flexible date";

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
    const normalizedName = trimmedName.toLowerCase();
    const duplicateExists = categoryFilters.some(
      (filter) => filter.label.trim().toLowerCase() === normalizedName
    );
    if (duplicateExists) {
      const error = new Error("Category already exists");
      (error as Error & { code?: string }).code = "CATEGORY_EXISTS";
      throw error;
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
      const code = (error as Error & { code?: string })?.code;
      if (code !== "CATEGORY_EXISTS") {
        console.error("Failed to create category", error);
      }
      throw error;
    }
  };

  const handleUpdateCategory = async (
    categoryId: string,
    { name, emoji, color }: NewCategoryInput
  ) => {
    if (!coupleId) {
      throw new Error("Missing couple");
    }
    const trimmedName = name.trim();
    if (!trimmedName.length) {
      throw new Error("Category name required");
    }
    const normalizedName = trimmedName.toLowerCase();
    const duplicateExists = categoryFilters.some(
      (filter) =>
        filter.key !== categoryId &&
        filter.label.trim().toLowerCase() === normalizedName
    );
    if (duplicateExists) {
      const error = new Error("Category already exists");
      (error as Error & { code?: string }).code = "CATEGORY_EXISTS";
      throw error;
    }
    const normalizedEmoji = emoji.trim() || "📝";
    try {
      await todoService.updateTodoCategory(coupleId, categoryId, {
        name: trimmedName,
        icon: normalizedEmoji,
        color,
      });
      dispatch({
        type: "UPDATE_TODO_CATEGORY",
        payload: {
          id: categoryId,
          name: trimmedName,
          icon: normalizedEmoji,
          color,
        },
      });
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      if (code !== "CATEGORY_EXISTS") {
        console.error("Failed to update category", error);
      }
      throw error;
    }
  };

  const handleUpdateTodo = async (
    todoId: string,
    values: NewTodoFormValues
  ) => {
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
    const dueDateValue = values.dueDate
      ? formatDateToYMD(values.dueDate.toISOString())
      : null;

    try {
      await todoService.updateTodoItem(coupleId, todoId, {
        categoryId: values.categoryKey,
        categoryKey: values.categoryKey,
        title: trimmedTitle,
        assigneeIds: values.assignees,
        dueDate: dueDateValue,
        location: trimmedLocation || null,
        costEstimate: trimmedCost || null,
        notes: trimmedNotes || null,
      });
      dispatch({
        type: "UPDATE_TODO_ITEM",
        payload: {
          itemId: todoId,
          updates: {
            categoryId: values.categoryKey,
            categoryKey: values.categoryKey,
            title: trimmedTitle,
            assigneeIds: values.assignees,
            dueDate: dueDateValue ?? undefined,
            location: trimmedLocation || undefined,
            costEstimate: trimmedCost || undefined,
            notes: trimmedNotes || undefined,
          },
        },
      });
    } catch (error) {
      console.error("Failed to update todo", error);
      throw error;
    }
  };

  const handleDeleteTodo = async (todo: TodoItem) => {
    if (!coupleId) return;
    try {
      await todoService.deleteTodoItem(coupleId, todo.id);
      dispatch({ type: "DELETE_TODO_ITEM", payload: { itemId: todo.id } });
      if (selectedTodoId === todo.id) {
        closeDetailModal();
      }
    } catch (error) {
      console.error("Failed to delete todo", error);
      Alert.alert("Couldn't delete to-do", "Please try again.");
    }
  };

  const confirmDeleteTodo = (todo: TodoItem) => {
    Alert.alert(
      "Delete this to-do?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteTodo(todo),
        },
      ],
      { cancelable: true }
    );
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
          gap: 12,
          paddingHorizontal: 4,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: palette.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={palette.textSecondary}
          />
        </Pressable>
        <CuteText weight="bold" style={{ fontSize: 20, flex: 1, textAlign: "center" }}>
          To-dos
        </CuteText>
        <Pressable
          onPress={() => setTodoModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: palette.primary,
            shadowColor: palette.primary,
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <MaterialIcons name="add-circle" size={18} color="#fff" />
          <CuteText weight="bold" style={{ color: "#fff" }}>
            Add
          </CuteText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 8, paddingHorizontal: 2 }}
      >
        {categoryFilters.map((filter) => {
          const isActive = filter.key === activeCategoryKey;
          const counts = categoryCounts.get(filter.key);
          const openCount = counts?.todo ?? 0;
          const doneCount = counts?.done ?? 0;
          const countLabel =
            openCount > 0
              ? `${openCount} open`
              : doneCount > 0
                ? `${doneCount} done`
                : "No missions";
          const editable = canEditCategory(filter);
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveCategoryKey(filter.key)}
              onLongPress={
                editable ? () => openCategoryEditor(filter) : undefined
              }
              delayLongPress={200}
              style={{
                width: 104,
                padding: 12,
                borderRadius: 18,
                alignItems: "center",
                backgroundColor: isActive ? filter.color : palette.card,
                shadowColor: "#000",
                shadowOpacity: isActive ? 0.12 : 0.05,
                shadowRadius: isActive ? 10 : 6,
                elevation: isActive ? 3 : 1,
                position: "relative",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isActive ? "#fff" : palette.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CuteText style={{ fontSize: 22 }}>{filter.emoji}</CuteText>
              </View>
              <CuteText
                weight="bold"
                style={{
                  fontSize: 12,
                  textAlign: "center",
                  color: palette.text,
                }}
              >
                {filter.label}
              </CuteText>
              <CuteText
                style={{
                  fontSize: 11,
                  color: palette.textSecondary,
                  textAlign: "center",
                }}
              >
                {countLabel}
              </CuteText>
              {isActive ? (
                <View
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: palette.success,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                >
                  <MaterialIcons
                    name="check"
                    size={12}
                    color={palette.text}
                  />
                </View>
              ) : null}
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
          {`${activeCategory?.label ?? "All missions"} • ${
            upcomingTodos.length
          } open / ${completedTodos.length} done`}
        </CuteText>
      </View>
      <CuteText tone="muted" style={{ fontSize: 11, marginTop: -12 }}>
        Long-press a custom category to edit it.
      </CuteText>

      <View
        style={{
          position: "relative",
          flexDirection: "row",
          borderRadius: 999,
          padding: 4,
          backgroundColor: palette.primarySoft,
        }}
      >
        <View
          style={[
            {
              position: "absolute",
              top: 4,
              bottom: 4,
              width: "48%",
              borderRadius: 999,
              backgroundColor: palette.card,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 1,
            },
            activeView === "todo" ? { left: 4 } : { right: 4 },
          ]}
        />
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
                zIndex: 2,
              }}
            >
              <CuteText
                weight="bold"
                style={{
                  color: isActive ? palette.text : palette.textSecondary,
                }}
              >
                {view === "todo" ? "To-dos" : "Done"}
              </CuteText>
            </Pressable>
          );
        })}
      </View>

      {activeView === "todo" ? (
        groupedTodosByDate.length ? (
          groupedTodosByDate.map((group) => {
            const sortedItems = [...group.items].sort(
              (a, b) => Number(a.completed) - Number(b.completed)
            );
            return (
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
                  {sortedItems.map((item) => renderMissionCard(item))}
                </View>
              </CuteCard>
            );
          })
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
            {completedTodos.map((item) => renderMissionCard(item, "undo"))}
          </View>
        </CuteCard>
      ) : (
        <CuteCard background={palette.card} padding={20} style={{ gap: 14 }}>
          <CuteText weight="bold" style={{ fontSize: 18 }}>
            Overall progress
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
            missions completed overall • {completionPercent}%
          </CuteText>
        </CuteCard>
      )}

      <CuteModal
        visible={Boolean(categoryEditor)}
        onRequestClose={closeCategoryEditor}
        title="Edit category"
      >
        {categoryEditor ? (
          <View style={{ gap: 12 }}>
            <CuteTextInput
              label="Name"
              value={categoryEditor.name}
              onChangeText={(text) =>
                setCategoryEditor((prev) =>
                  prev ? { ...prev, name: text } : prev
                )
              }
            />
            <CuteTextInput
              label="Emoji"
              value={categoryEditor.emoji}
              onChangeText={(text) =>
                setCategoryEditor((prev) =>
                  prev ? { ...prev, emoji: text.slice(0, 4) } : prev
                )
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
                  const isActive = categoryEditor.color === color;
                  return (
                    <Pressable
                      key={color}
                      onPress={() =>
                        setCategoryEditor((prev) =>
                          prev ? { ...prev, color } : prev
                        )
                      }
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
            {categoryEditorError ? (
              <CuteText style={{ color: palette.warning, fontSize: 12 }}>
                {categoryEditorError}
              </CuteText>
            ) : null}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <CuteButton
                label="Cancel"
                tone="ghost"
                onPress={closeCategoryEditor}
                disabled={categoryEditorSaving}
                style={{ flex: 1 }}
              />
              <CuteButton
                label={categoryEditorSaving ? "Saving..." : "Save changes"}
                onPress={submitCategoryEdit}
                disabled={categoryEditorSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}
      </CuteModal>

      <TodoFormModal
        mode="create"
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
        categories={categoryOptionsForForm}
        defaultCategoryKey={defaultNewTodoCategory}
        partnerName={partnerName}
        onSubmit={handleCreateTodo}
        onCreateCategory={handleCreateCategory}
      />

      <TodoFormModal
        key={editingTodo?.id ?? "edit-modal"}
        mode="edit"
        visible={Boolean(editingTodo)}
        onClose={() => setEditingTodoId(null)}
        categories={categoryOptionsForForm}
        defaultCategoryKey={defaultNewTodoCategory}
        partnerName={partnerName}
        onSubmit={async (values) => {
          if (!editingTodo) return;
          await handleUpdateTodo(editingTodo.id, values);
        }}
        onCreateCategory={handleCreateCategory}
        initialTodo={editingTodo ?? undefined}
      />

      <Modal
        visible={detailModalVisible && Boolean(selectedTodo)}
        animationType="slide"
        transparent
        onRequestClose={closeDetailModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "#00000055",
            justifyContent: "flex-end",
          }}
          onPress={closeDetailModal}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: palette.card,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 32,
              gap: 16,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View
              style={{
                height: 5,
                width: 48,
                borderRadius: 999,
                backgroundColor: palette.primarySoft,
                alignSelf: "center",
              }}
            />
            {selectedTodo ? (
              <View style={{ gap: 20 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 24,
                      backgroundColor:
                        categoryLookup.get(
                          selectedTodo.categoryKey ?? selectedTodo.categoryId
                        )?.color ?? palette.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 20,
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CuteText style={{ fontSize: 26 }}>
                        {categoryLookup.get(
                          selectedTodo.categoryKey ?? selectedTodo.categoryId
                        )?.emoji ?? "📝"}
                      </CuteText>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <CuteText weight="bold" style={{ fontSize: 20 }}>
                      {selectedTodo.title}
                    </CuteText>
                    <CuteText tone="muted" style={{ fontSize: 13, marginTop: 4 }}>
                      {detailDueText}
                    </CuteText>
                    {detailOverdue ? (
                      <View
                        style={{
                          marginTop: 6,
                          alignSelf: "flex-start",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: "#F8B4B4",
                        }}
                      >
                        <MaterialIcons
                          name="warning"
                          size={16}
                          color="#4A2222"
                        />
                        <CuteText style={{ fontSize: 12, color: "#4A2222" }}>
                          Overdue
                        </CuteText>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={{ gap: 12 }}>
                  {selectedTodo.location
                    ? renderInfoRow("location-on", selectedTodo.location)
                    : null}
                  {selectedTodo.costEstimate
                    ? renderInfoRow("attach-money", selectedTodo.costEstimate)
                    : null}
                  {selectedTodo.notes
                    ? renderInfoRow("notes", selectedTodo.notes)
                    : null}
                  {selectedTodo.completed ? (
                    renderInfoRow("check-circle", formatCompletionLabel(selectedTodo))
                  ) : null}
                </View>
                <View style={{ gap: 12 }}>
                  <CuteText weight="semibold">Who’s doing this?</CuteText>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: palette.border,
                    }}
                  >
                    {renderAssigneeAvatars(selectedTodo.assigneeIds)}
                    <CuteText tone="muted" style={{ fontSize: 13 }}>
                      {formatAssigneesText(selectedTodo.assigneeIds)}
                    </CuteText>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <CuteButton
                    label="Edit"
                    tone="primary"
                    icon={
                      <MaterialIcons name="edit" size={18} color="#ffffff" />
                    }
                    style={{
                      flex: 1,
                      backgroundColor: palette.primary,
                      borderWidth: 0,
                    }}
                    onPress={() => {
                      if (!selectedTodo) return;
                      setEditingTodoId(selectedTodo.id);
                      closeDetailModal();
                    }}
                  />
                  <CuteButton
                    label={selectedTodo.completed ? "Undo" : "Done"}
                    icon={
                      <MaterialIcons
                        name={selectedTodo.completed ? "undo" : "check-circle"}
                        size={18}
                        color="#ffffff"
                      />
                    }
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (!selectedTodo) return;
                      handleToggleTodo(selectedTodo, !selectedTodo.completed);
                      closeDetailModal();
                    }}
                  />
                </View>
                <CuteButton
                  label="Delete to-do"
                  tone="ghost"
                  onPress={() => {
                    closeDetailModal();
                    confirmDeleteTodo(selectedTodo);
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: palette.border,
                  }}
                />
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

type TodoFormModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  categories: CategoryFilterOption[];
  defaultCategoryKey: string;
  partnerName: string;
  onSubmit: (values: NewTodoFormValues) => Promise<void>;
  onCreateCategory: (values: NewCategoryInput) => Promise<string>;
  initialTodo?: TodoItem;
};

const TodoFormModal = ({
  visible,
  mode,
  onClose,
  categories,
  defaultCategoryKey,
  partnerName,
  onSubmit,
  onCreateCategory,
  initialTodo,
}: TodoFormModalProps) => {
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
  const [categoryNameError, setCategoryNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAssigneeError, setShowAssigneeError] = useState(false);
  const modalTitle = mode === "edit" ? "Edit to-do" : "Add to-do";
  const submitLabel =
    mode === "edit"
      ? submitting
        ? "Updating..."
        : "Update to-do"
      : submitting
        ? "Saving..."
        : "Save to-do";
  const categoryOptions = useMemo(
    () =>
      categories.map((filter) => ({
        label: `${filter.emoji} ${filter.label}`,
        value: filter.key,
      })),
    [categories]
  );

  const resetCategoryForm = useCallback(() => {
    setCategoryName("");
    setCategoryEmoji("📝");
    setCategoryColor(CATEGORY_COLOR_PRESETS[0]);
    setCategorySaving(false);
    setCategoryNameError(null);
  }, []);

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
  }, [defaultCategoryKey, resetCategoryForm]);

  const hydrateFromTodo = useCallback(
    (todo: TodoItem) => {
      setTitle(todo.title);
      setCategoryKey(todo.categoryKey ?? todo.categoryId ?? defaultCategoryKey);
      setLocation(todo.location ?? "");
      setCostEstimate(todo.costEstimate ?? "");
      setNotes(todo.notes ?? "");
      setAssignees(
        todo.assigneeIds && todo.assigneeIds.length
          ? todo.assigneeIds
          : ["me"]
      );
      const parsedDate = todo.dueDate ? parseLocalDate(todo.dueDate) : null;
      setDueDate(parsedDate);
      setPendingDate(parsedDate ?? new Date());
      setDatePickerVisible(false);
      setCategoryFormVisible(false);
      setShowAssigneeError(false);
      resetCategoryForm();
    },
    [defaultCategoryKey, resetCategoryForm]
  );

  useEffect(() => {
    if (!visible) {
      resetForm();
      return;
    }
    if (mode === "edit") {
      if (initialTodo) {
        hydrateFromTodo(initialTodo);
      }
      return;
    }
    resetForm();
  }, [visible, mode, initialTodo, resetForm, hydrateFromTodo]);

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
    setCategoryNameError(null);
    const normalizedName = trimmedName.toLowerCase();
    const duplicateExists = categories.some(
      (option) => option.label.trim().toLowerCase() === normalizedName
    );
    if (duplicateExists) {
      setCategoryNameError(
        "That name is already taken. Try something a little more unique."
      );
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
      const code = (error as Error & { code?: string })?.code;
      if (error instanceof Error && code === "CATEGORY_EXISTS") {
        setCategoryNameError(
          "That name is already taken. Try something a little more unique."
        );
      } else {
        console.error("Failed to create category", error);
        Alert.alert("Couldn't save category", "Please try again.");
      }
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
      await onSubmit({
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
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.card,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={20}
                  color={palette.textSecondary}
                />
              </Pressable>
              <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
                <CuteText
                  weight="bold"
                  style={{ fontSize: 20, marginLeft: 20 }}
                >
                  {modalTitle}
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
                        onChangeText={(text) => {
                          setCategoryName(text);
                          if (categoryNameError) {
                            setCategoryNameError(null);
                          }
                        }}
                      />
                      {categoryNameError ? (
                        <CuteText
                          style={{ color: palette.warning, fontSize: 12 }}
                        >
                          {categoryNameError}
                        </CuteText>
                      ) : null}
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
                  label={submitLabel}
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
