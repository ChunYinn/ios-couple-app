import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CuteButton } from "../../components/CuteButton";
import { CuteCard } from "../../components/CuteCard";
import { CuteDropdown } from "../../components/CuteDropdown";
import { CuteModal } from "../../components/CuteModal";
import { CuteText } from "../../components/CuteText";
import { CuteTextInput } from "../../components/CuteTextInput";
import { Screen } from "../../components/Screen";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { todoService } from "../../firebase/services";
import { usePalette } from "../../hooks/usePalette";
import { TodoItem } from "../../types/app";

type CategoryFilterOption = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
  hidden?: boolean;
};

type NewTodoFormValues = {
  title: string;
  categoryKey: string;
  notes: string;
  assignees: string[];
};

type NewCategoryInput = {
  name: string;
  emoji: string;
  color: string;
};

const DEFAULT_CATEGORY_FILTERS: CategoryFilterOption[] = [
  { key: "all", label: "All", emoji: "✨", color: "#FDE2E8" },
  { key: "home", label: "General", emoji: "📋", color: "#FFE8D6" },
];

const CATEGORY_COLOR_PRESETS = [
  "#FFE8D6",
  "#FFD6EA",
  "#E5DEFF",
  "#D6F0FF",
  "#E1F5EA",
  "#FFF4D6",
  "#FFE5F4",
  "#EAF7FF",
  "#F3E8FF",
  "#E8FFE5",
];
const DEFAULT_CATEGORY_COLOR = CATEGORY_COLOR_PRESETS[0];

const formatCategoryLabelFromKey = (key: string) =>
  key
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

export default function SharedListsScreen() {
  const palette = usePalette();
  const { showToast } = useToast();
  const {
    state: { pairing, todos, profiles, auth },
    dispatch,
  } = useAppData();
  const insets = useSafeAreaInsets();
  const categoryModalMaxHeight = useMemo(
    () => Math.min(Dimensions.get("window").height * 0.9, 720),
    []
  );
  const categoryModalPaddingBottom = useMemo(
    () => insets.bottom + 32,
    [insets.bottom]
  );

  const coupleId = auth.user.coupleId;
  const partnerName = profiles.partner?.displayName ?? "Partner";
  const myName = profiles.me?.displayName ?? "You";
  const partnerAvatar = profiles.partner?.avatarUrl ?? null;
  const myAvatar = profiles.me?.avatarUrl ?? null;

  const [activeCategoryKey, setActiveCategoryKey] = useState("all");
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
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
  const [manageCategoryName, setManageCategoryName] = useState("");
  const [manageCategoryEmoji, setManageCategoryEmoji] = useState("📝");
  const [manageCategoryColor, setManageCategoryColor] = useState(
    DEFAULT_CATEGORY_COLOR
  );
  const [manageCategorySaving, setManageCategorySaving] = useState(false);
  const [manageCategoryError, setManageCategoryError] = useState<string | null>(
    null
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const hiddenCategoryIds = useMemo(
    () =>
      new Set(
        todos.categories
          .filter((category) => category.hidden)
          .map((category) => category.id)
      ),
    [todos.categories]
  );

  const closeConfirmDialog = useCallback(() => setConfirmDialog(null), []);

  const confirmAndClose = useCallback(() => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }, [confirmDialog]);

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

  const visibleTodoItems = useMemo(() => {
    if (!hiddenCategoryIds.size) {
      return uniqueTodoItems;
    }
    return uniqueTodoItems.filter((item) => {
      const key = item.categoryKey ?? item.categoryId;
      return key ? !hiddenCategoryIds.has(key) : true;
    });
  }, [hiddenCategoryIds, uniqueTodoItems]);

  const selectedTodo = useMemo(
    () => visibleTodoItems.find((item) => item.id === selectedTodoId) ?? null,
    [visibleTodoItems, selectedTodoId]
  );

  const editingTodo = useMemo(
    () => visibleTodoItems.find((item) => item.id === editingTodoId) ?? null,
    [visibleTodoItems, editingTodoId]
  );

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedTodoId(null);
  };

  useEffect(() => {
    if (detailModalVisible && selectedTodoId && !selectedTodo) {
      setDetailModalVisible(false);
      setSelectedTodoId(null);
    }
  }, [detailModalVisible, selectedTodo, selectedTodoId]);

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
        hidden: Boolean(category.hidden),
      });
    });

    const combined = [
      ...DEFAULT_CATEGORY_FILTERS,
      ...customFilters.filter((option) => !builtInKeys.has(option.key)),
    ];

    const seenKeys = new Set(combined.map((filter) => filter.key));
    const fallbackFilters: CategoryFilterOption[] = [];
    visibleTodoItems.forEach((item) => {
      const key = item.categoryKey ?? item.categoryId;
      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        fallbackFilters.push({
          key,
          label: formatCategoryLabelFromKey(key),
          emoji: "📝",
          color: palette.primarySoft,
          isCustom: true,
          hidden: false,
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
  }, [todos.categories, visibleTodoItems, palette.primarySoft]);

  const visibleCategoryFilters = useMemo(
    () =>
      categoryFilters.filter(
        (filter) => filter.key === "all" || !hiddenCategoryIds.has(filter.key)
      ),
    [categoryFilters, hiddenCategoryIds]
  );

  const categoryManagerOptions = useMemo(
    () => categoryFilters.filter((filter) => filter.key !== "all"),
    [categoryFilters]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, { todo: number; done: number }>();
    let openTotal = 0;
    let doneTotal = 0;
    visibleTodoItems.forEach((item) => {
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
  }, [visibleTodoItems]);

  const canEditCategory = (filter: CategoryFilterOption) => {
    if (filter.key === "all") return false;
    return todos.categories.some((category) => category.id === filter.key);
  };

  const resetManageCategoryForm = () => {
    setManageCategoryName("");
    setManageCategoryEmoji("📝");
    setManageCategoryColor(DEFAULT_CATEGORY_COLOR);
    setManageCategorySaving(false);
    setManageCategoryError(null);
  };

  const openCategoryManager = () => {
    resetManageCategoryForm();
    setCategoryManagerVisible(true);
  };

  const closeCategoryManager = () => {
    setCategoryManagerVisible(false);
    resetManageCategoryForm();
  };

  const openCategoryEditor = (filter: CategoryFilterOption) => {
    if (!canEditCategory(filter)) return;
    const existing = todos.categories.find(
      (category) => category.id === filter.key
    );
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
        showToast({
          tone: "error",
          title: "Couldn't update category",
          message: "Please try again.",
        });
      }
    } finally {
      setCategoryEditorSaving(false);
    }
  };

  const handleManageAddCategory = async () => {
    const trimmedName = manageCategoryName.trim();
    if (!trimmedName.length || manageCategorySaving) {
      setManageCategoryError("Name is required.");
      return;
    }
    setManageCategorySaving(true);
    setManageCategoryError(null);
    try {
      await handleCreateCategory({
        name: trimmedName,
        emoji: manageCategoryEmoji,
        color: manageCategoryColor,
      });
      resetManageCategoryForm();
    } catch (error) {
      const code = (error as Error & { code?: string })?.code;
      if (code === "CATEGORY_EXISTS") {
        setManageCategoryError("That name is already taken.");
      } else {
        setManageCategoryError("Couldn't add category. Try again.");
        showToast({
          tone: "error",
          title: "Couldn't add category",
          message: "Please try again.",
        });
      }
    } finally {
      setManageCategorySaving(false);
    }
  };

  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, CategoryFilterOption>();
    visibleCategoryFilters.forEach((filter) => {
      if (filter.key !== "all") {
        lookup.set(filter.key, filter);
      }
    });
    return lookup;
  }, [visibleCategoryFilters]);

  const categoryOptionsForForm = useMemo(
    () => visibleCategoryFilters.filter((filter) => filter.key !== "all"),
    [visibleCategoryFilters]
  );

  const defaultNewTodoCategory =
    categoryOptionsForForm.find((option) => option.key === "home")?.key ??
    categoryOptionsForForm[0]?.key ??
    "home";

  const activeCategory = useMemo(
    () =>
      visibleCategoryFilters.find((filter) => filter.key === activeCategoryKey),
    [visibleCategoryFilters, activeCategoryKey]
  );

  useEffect(() => {
    if (
      !visibleCategoryFilters.some((filter) => filter.key === activeCategoryKey)
    ) {
      setActiveCategoryKey("all");
    }
  }, [activeCategoryKey, visibleCategoryFilters]);

  const filteredTodos = useMemo(() => {
    if (activeCategoryKey === "all") {
      return visibleTodoItems;
    }
    return visibleTodoItems.filter((item) => {
      const key = item.categoryKey ?? item.categoryId;
      return key === activeCategoryKey;
    });
  }, [visibleTodoItems, activeCategoryKey]);

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

  useEffect(() => {
    setShowCompleted(false);
  }, [activeCategoryKey]);

  const getAssigneeDisplay = (assignees: string[]) => {
    const hasMe = assignees.includes("me");
    const hasPartner = assignees.includes("partner");
    if (hasMe && hasPartner) {
      return { label: "You & Partner", icon: "groups" as const };
    }
    if (hasPartner) {
      return { label: "Partner", icon: "person" as const };
    }
    if (hasMe) {
      return { label: "You", icon: "person" as const };
    }
    return { label: "Unassigned", icon: "help-outline" as const };
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

  const confirmToggleTodo = (todo: TodoItem, value: boolean) => {
    setConfirmDialog({
      title: value ? "Mark this as done?" : "Reopen this to-do?",
      message: value
        ? "We'll move it into your completed tab."
        : "It will show up under your active to-dos again.",
      confirmLabel: value ? "Mark done" : "Reopen",
      onConfirm: () => handleToggleTodo(todo, value),
    });
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

  const renderMissionCard = (item: TodoItem) => {
    const isCompleted = item.completed;
    const categoryKey = item.categoryKey ?? item.categoryId;
    const categoryMeta = categoryLookup.get(categoryKey);
    const emoji = categoryMeta?.emoji ?? "📝";
    const categoryLabel = categoryMeta?.label ?? "General";
    const categoryAccent = categoryMeta?.color ?? palette.primarySoft;
    const previewNotes =
      item.notes && item.notes.length
        ? truncateText(item.notes, 140)
        : undefined;

    const assigneeAvatars = renderAssigneeAvatars(item.assigneeIds);

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          setSelectedTodoId(item.id);
          setDetailModalVisible(true);
        }}
        style={{
          borderRadius: 14,
          backgroundColor: palette.card,
          padding: 10,
          borderWidth: 1,
          borderColor: isCompleted ? palette.primarySoft : palette.border,
          shadowColor: "#00000015",
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
          gap: 6,
          opacity: isCompleted ? 0.9 : 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              confirmToggleTodo(item, !isCompleted);
            }}
            style={{
              width: 30,
              height: 30,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isCompleted ? palette.primary : palette.border,
              backgroundColor: isCompleted ? palette.primary : palette.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name={isCompleted ? "task-alt" : "radio-button-unchecked"}
              size={22}
              color={isCompleted ? "#fff" : palette.primary}
            />
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <CuteText
              weight="bold"
              numberOfLines={2}
              style={{
                flex: 1,
                fontSize: 16,
                color: isCompleted ? palette.textSecondary : palette.text,
                textDecorationLine: isCompleted ? "line-through" : "none",
              }}
            >
              {item.title}
            </CuteText>
            {item.notes ? (
              <CuteText
                tone="muted"
                numberOfLines={3}
                style={{
                  fontSize: 13,
                  color: isCompleted ? palette.textSecondary : palette.text,
                  textDecorationLine: isCompleted ? "line-through" : "none",
                }}
              >
                {previewNotes}
              </CuteText>
            ) : null}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginLeft: 32,
            marginTop: 0,
            gap: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: categoryAccent,
              opacity: isCompleted ? 0.95 : 1,
              paddingHorizontal: 7,
              paddingVertical: 4,
              borderRadius: 9,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: palette.card,
              }}
            >
              <CuteText style={{ fontSize: 13 }}>{emoji}</CuteText>
            </View>
            <CuteText
              weight="semibold"
              style={{ fontSize: 11.5, color: palette.text }}
            >
              {categoryLabel}
            </CuteText>
          </View>
          {assigneeAvatars}
        </View>
      </Pressable>
    );
  };

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
    const trimmedNotes = values.notes.trim();

    try {
      const id = await todoService.createTodoItem(coupleId, {
        categoryId: values.categoryKey,
        categoryKey: values.categoryKey,
        title: trimmedTitle,
        assigneeIds: values.assignees,
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
          hidden: false,
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

  const handleToggleCategoryVisibility = async (
    categoryId: string,
    categoryName: string,
    hidden: boolean
  ) => {
    if (!coupleId) {
      throw new Error("Missing couple");
    }
    try {
      await todoService.updateTodoCategory(coupleId, categoryId, { hidden });
      dispatch({
        type: "UPDATE_TODO_CATEGORY",
        payload: { id: categoryId, hidden },
      });
      showToast({
        tone: "info",
        message: hidden
          ? "This category is now hidden. Existing to-dos stay saved."
          : `${categoryName} is visible again.`,
      });
    } catch (error) {
      console.error("Failed to update category visibility", error);
      showToast({
        tone: "error",
        title: "Couldn't update category",
        message: "Please try again.",
      });
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
    const trimmedNotes = values.notes.trim();

    try {
      await todoService.updateTodoItem(coupleId, todoId, {
        categoryId: values.categoryKey,
        categoryKey: values.categoryKey,
        title: trimmedTitle,
        assigneeIds: values.assignees,
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
      showToast({
        tone: "error",
        title: "Couldn't delete to-do",
        message: "Please try again.",
      });
    }
  };

  const confirmDeleteTodo = (todo: TodoItem) => {
    setConfirmDialog({
      title: "Delete this to-do?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => handleDeleteTodo(todo),
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
    <Screen scrollable={false} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 12,
          gap: 12,
        }}
      >
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
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: palette.card,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: palette.border,
              shadowColor: "#00000015",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color={palette.text} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <CuteText weight="bold" style={{ fontSize: 22 }}>
              To-dos
            </CuteText>
          </View>
          <Pressable
            onPress={() => setTodoModalVisible(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: palette.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#ffffffaa",
              shadowColor: palette.primary,
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          style={{ flexGrow: 0 }}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 10,
            paddingBottom: 4,
            paddingHorizontal: 2,
          }}
        >
          {visibleCategoryFilters.map((filter) => {
            const isActive = filter.key === activeCategoryKey;
            const counts = categoryCounts.get(filter.key);
            const totalCount = (counts?.todo ?? 0) + (counts?.done ?? 0);
            const chipBackground = isActive ? palette.primary : palette.card;
            const chipBorder = isActive ? palette.primary : palette.border;
            const chipTextColor = isActive ? "#fff" : palette.text;
            const showEmoji = filter.key !== "all";
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveCategoryKey(filter.key)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: showEmoji ? 8 : 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 14,
                  backgroundColor: chipBackground,
                  borderWidth: 1,
                  borderColor: chipBorder,
                  shadowColor: "#000",
                  shadowOpacity: isActive ? 0.12 : 0.04,
                  shadowRadius: 8,
                  elevation: isActive ? 3 : 0,
                }}
              >
                {showEmoji ? (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActive
                        ? "#ffffff26"
                        : palette.primarySoft,
                    }}
                  >
                    <CuteText style={{ fontSize: 14, color: chipTextColor }}>
                      {filter.emoji}
                    </CuteText>
                  </View>
                ) : null}
                <CuteText
                  weight={isActive ? "bold" : "semibold"}
                  style={{
                    fontSize: 12,
                    color: chipTextColor,
                  }}
                >
                  {filter.label}
                  {totalCount ? ` (${totalCount})` : ""}
                </CuteText>
              </Pressable>
            );
          })}
          <Pressable
            onPress={openCategoryManager}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: palette.primary,
              backgroundColor: palette.card,
            }}
          >
            <MaterialIcons name="apps" size={18} color={palette.primary} />
            <CuteText weight="bold" style={{ color: palette.primary }}>
              Manage
            </CuteText>
          </Pressable>
        </ScrollView>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
          }}
        >
          <MaterialIcons
            name="filter-alt"
            size={16}
            color={palette.textSecondary}
          />
          <CuteText tone="muted" style={{ fontSize: 12 }}>
            {`${activeCategory?.label ?? "All"} • ${
              upcomingTodos.length
            } open / ${completedTodos.length} done`}
          </CuteText>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
        >
          {upcomingTodos.length ? (
            <View style={{ gap: 8 }}>
              {upcomingTodos.map((item) => renderMissionCard(item))}
            </View>
          ) : (
            <CuteCard
              background={palette.card}
              padding={22}
              style={{ gap: 10 }}
            >
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
          )}

          {completedTodos.length ? (
            <View style={{ gap: 6, marginTop: 2 }}>
              <Pressable
                onPress={() => setShowCompleted((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: palette.primarySoft,
                  borderWidth: 1,
                  borderColor: palette.border,
                }}
              >
                <CuteText weight="bold" style={{ color: palette.text }}>
                  {`Completed (${completedTodos.length})`}
                </CuteText>
                <MaterialIcons
                  name={showCompleted ? "expand-less" : "expand-more"}
                  size={20}
                  color={palette.text}
                />
              </Pressable>
              {showCompleted ? (
                <View style={{ gap: 8 }}>
                  {completedTodos.map((item) => renderMissionCard(item))}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>

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
                        borderWidth: isActive ? 2 : 1,
                        borderColor: isActive
                          ? palette.primary
                          : palette.border,
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
                label={categoryEditorSaving ? "Saving..." : "Save"}
                onPress={submitCategoryEdit}
                disabled={categoryEditorSaving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : null}
      </CuteModal>

      <Modal
        visible={categoryManagerVisible}
        animationType="slide"
        transparent
        onRequestClose={closeCategoryManager}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "#00000040",
            justifyContent: "flex-end",
          }}
          onPress={closeCategoryManager}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: palette.card,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              overflow: "hidden",
              maxHeight: categoryModalMaxHeight,
            }}
          >
            <ScrollView
              style={{ maxHeight: categoryModalMaxHeight, width: "100%" }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: categoryModalPaddingBottom,
                gap: 12,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              nestedScrollEnabled
              scrollEnabled
              scrollIndicatorInsets={{ bottom: insets.bottom + 12 }}
              showsVerticalScrollIndicator
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 2,
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.border,
                }}
              >
                <View style={{ width: 32 }} />
                <CuteText weight="bold" style={{ fontSize: 18 }}>
                  Manage categories
                </CuteText>
                <Pressable
                  onPress={closeCategoryManager}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: palette.card,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <MaterialIcons name="close" size={18} color={palette.text} />
                </Pressable>
              </View>
              {categoryManagerOptions.map((filter) => {
                const counts = categoryCounts.get(filter.key);
                const editable = canEditCategory(filter);
                const isHidden = Boolean(filter.hidden);
                return (
                  <View
                    key={filter.key}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 18,
                      backgroundColor: palette.card,
                      borderWidth: 1,
                      borderColor: palette.border,
                      gap: 10,
                      shadowColor: "#00000010",
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 1,
                      opacity: isHidden ? 0.85 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: palette.background,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CuteText style={{ fontSize: 20 }}>
                        {filter.emoji}
                      </CuteText>
                    </View>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: filter.color,
                        borderWidth: 1,
                        borderColor: palette.border,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <CuteText weight="semibold">{filter.label}</CuteText>
                      <CuteText tone="muted" style={{ fontSize: 12 }}>
                        {counts
                          ? `${counts.todo} open • ${counts.done} done`
                          : "0 items"}
                      </CuteText>
                      {isHidden ? (
                        <CuteText
                          style={{ fontSize: 11, color: palette.textSecondary }}
                        >
                          Hidden from lists
                        </CuteText>
                      ) : null}
                    </View>
                    {editable ? (
                      <>
                        <Pressable
                          onPress={() => {
                            openCategoryEditor(filter);
                            closeCategoryManager();
                          }}
                          style={{
                            padding: 6,
                          }}
                        >
                          <MaterialIcons
                            name="edit"
                            size={18}
                            color={palette.textSecondary}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            handleToggleCategoryVisibility(
                              filter.key,
                              filter.label,
                              !isHidden
                            )
                          }
                          style={{
                            padding: 6,
                          }}
                        >
                          <MaterialIcons
                            name={isHidden ? "visibility" : "visibility-off"}
                            size={18}
                            color={
                              isHidden ? palette.text : palette.textSecondary
                            }
                          />
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                );
              })}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 20,
                  padding: 16,
                  gap: 12,
                }}
              >
                <CuteText weight="bold" style={{ fontSize: 16 }}>
                  Add new category
                </CuteText>
                <CuteTextInput
                  label="Name"
                  placeholder="Ex. Weekend escapes"
                  value={manageCategoryName}
                  onChangeText={(text) => {
                    setManageCategoryName(text);
                    setManageCategoryError(null);
                  }}
                />
                <CuteTextInput
                  label="Emoji"
                  value={manageCategoryEmoji}
                  onChangeText={(text) =>
                    setManageCategoryEmoji(text.slice(0, 4))
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
                      const isActive = manageCategoryColor === color;
                      return (
                        <Pressable
                          key={color}
                          onPress={() => setManageCategoryColor(color)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: color,
                            borderWidth: isActive ? 2 : 1,
                            borderColor: isActive
                              ? palette.primary
                              : palette.border,
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
                {manageCategoryError ? (
                  <CuteText style={{ color: palette.warning, fontSize: 12 }}>
                    {manageCategoryError}
                  </CuteText>
                ) : null}
                <CuteButton
                  label={manageCategorySaving ? "Saving..." : "Add category"}
                  onPress={handleManageAddCategory}
                  disabled={manageCategorySaving}
                />
              </View>
              <View style={{ paddingHorizontal: 2 }}>
                <CuteButton label="Done" onPress={closeCategoryManager} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={Boolean(confirmDialog)}
        title={confirmDialog?.title ?? ""}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        destructive={confirmDialog?.destructive}
        onCancel={closeConfirmDialog}
        onConfirm={confirmAndClose}
      />

      <TodoFormModal
        mode="create"
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
        categories={categoryOptionsForForm}
        defaultCategoryKey={defaultNewTodoCategory}
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        meAvatar={myAvatar}
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
        partnerAvatar={partnerAvatar}
        meAvatar={myAvatar}
        onSubmit={async (values) => {
          if (!editingTodo) return;
          await handleUpdateTodo(editingTodo.id, values);
        }}
        onCreateCategory={handleCreateCategory}
        initialTodo={editingTodo ?? undefined}
      />

      <Modal
        visible={detailModalVisible}
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
              (() => {
                const categoryKey =
                  selectedTodo.categoryKey ?? selectedTodo.categoryId;
                const detailCategory = categoryLookup.get(categoryKey);
                const detailEmoji = detailCategory?.emoji ?? "📝";
                const detailLabel = detailCategory?.label ?? "General";
                const detailAccent =
                  detailCategory?.color ?? palette.primarySoft;
                const assigneeDisplay = getAssigneeDisplay(
                  selectedTodo.assigneeIds
                );
                const assigneeEntries = selectedTodo.assigneeIds.map((id) => {
                  const isMe = id === "me";
                  return {
                    id,
                    label: isMe ? myName : partnerName,
                    avatar: isMe ? myAvatar : partnerAvatar,
                  };
                });
                const infoRowStyle = {
                  flexDirection: "row" as const,
                  alignItems: "center" as const,
                  gap: 14,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: palette.card,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                };

                return (
                  <View style={{ gap: 14 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        backgroundColor: palette.card,
                        borderRadius: 24,
                        padding: 16,
                        shadowColor: "#000",
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 3,
                      }}
                    >
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 20,
                          backgroundColor: detailAccent,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 14,
                            backgroundColor: "#fff",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CuteText style={{ fontSize: 24 }}>
                            {detailEmoji}
                          </CuteText>
                        </View>
                      </View>
                      <View style={{ flex: 1, gap: 8 }}>
                        <CuteText weight="bold" style={{ fontSize: 20 }}>
                          {selectedTodo.title}
                        </CuteText>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              borderRadius: 12,
                              paddingHorizontal: 12,
                              paddingVertical: 5,
                              backgroundColor: palette.card,
                            }}
                          >
                            <MaterialIcons
                              name="label"
                              size={14}
                              color={palette.textSecondary}
                            />
                            <CuteText style={{ fontSize: 12 }}>
                              {detailLabel}
                            </CuteText>
                          </View>
                          {selectedTodo.completed ? (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                backgroundColor: "#E6F6EE",
                              }}
                            >
                              <MaterialIcons
                                name="check-circle"
                                size={16}
                                color="#2A5B3D"
                              />
                              <CuteText style={{ fontSize: 12 }}>
                                Completed
                              </CuteText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    <View style={infoRowStyle}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 16,
                          backgroundColor: detailAccent,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialIcons
                          name="notes"
                          size={20}
                          color={palette.text}
                        />
                      </View>
                      <CuteText style={{ flex: 1 }}>
                        {selectedTodo.notes?.trim() ||
                          "No notes yet — tap Edit to add a sweet reminder."}
                      </CuteText>
                    </View>

                    <View style={infoRowStyle}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 16,
                          backgroundColor: detailAccent,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialIcons
                          name={assigneeDisplay.icon}
                          size={20}
                          color={palette.text}
                        />
                      </View>
                      <CuteText weight="bold" style={{ flex: 1 }}>
                        {assigneeDisplay.label}
                      </CuteText>
                      {assigneeEntries.length ? (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {assigneeEntries.map((entry, index) => (
                            <View
                              key={`${entry.id}-${index}`}
                              style={{
                                marginLeft: index ? -6 : 0,
                                borderRadius: 14,
                                borderWidth: 1.5,
                                borderColor: palette.card,
                                overflow: "hidden",
                                width: 28,
                                height: 28,
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
                                  <CuteText
                                    weight="bold"
                                    style={{ fontSize: 11 }}
                                  >
                                    {entry.label.charAt(0).toUpperCase()}
                                  </CuteText>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <Pressable
                        onPress={() =>
                          confirmToggleTodo(
                            selectedTodo,
                            !selectedTodo.completed
                          )
                        }
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 14,
                          backgroundColor: palette.primary,
                          shadowColor: palette.primary,
                          shadowOpacity: 0.18,
                          shadowRadius: 6,
                        }}
                      >
                        <MaterialIcons
                          name={
                            selectedTodo.completed ? "undo" : "check-circle"
                          }
                          size={18}
                          color="#fff"
                        />
                        <CuteText style={{ color: "#fff" }} weight="bold">
                          {selectedTodo.completed ? "Undo" : "Done"}
                        </CuteText>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setEditingTodoId(selectedTodo.id);
                          closeDetailModal();
                        }}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 14,
                          backgroundColor: palette.card,
                          borderWidth: 1,
                          borderColor: palette.border,
                        }}
                      >
                        <MaterialIcons
                          name="edit"
                          size={18}
                          color={palette.text}
                        />
                        <CuteText weight="bold" style={{ color: palette.text }}>
                          Edit
                        </CuteText>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          closeDetailModal();
                          confirmDeleteTodo(selectedTodo);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 11,
                          borderRadius: 14,
                          backgroundColor: "#FFE7E7",
                          borderWidth: 1,
                          borderColor: "#F8B4B4",
                        }}
                      >
                        <MaterialIcons
                          name="delete"
                          size={18}
                          color="#B42318"
                        />
                        <CuteText style={{ color: "#B42318" }} weight="bold">
                          Delete
                        </CuteText>
                      </Pressable>
                    </View>

                    <View />
                  </View>
                );
              })()
            ) : (
              <View
                style={{
                  paddingVertical: 30,
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <MaterialIcons
                  name="hourglass-empty"
                  size={28}
                  color={palette.textSecondary}
                />
                <CuteText tone="muted">Loading this mission…</CuteText>
              </View>
            )}
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
  partnerAvatar?: string | null;
  meAvatar?: string | null;
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
  partnerAvatar,
  meAvatar,
  onSubmit,
  onCreateCategory,
  initialTodo,
}: TodoFormModalProps) => {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState(defaultCategoryKey);
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState<string[]>(["me"]);
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("📝");
  const [categoryColor, setCategoryColor] = useState(DEFAULT_CATEGORY_COLOR);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryNameError, setCategoryNameError] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showAssigneeError, setShowAssigneeError] = useState(false);
  const modalTitle = mode === "edit" ? "Edit Todo" : "Add New Todo";
  const submitLabel =
    mode === "edit"
      ? submitting
        ? "Updating..."
        : "Save Todo"
      : submitting
      ? "Saving..."
      : "Save Todo";
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
    setCategoryColor(DEFAULT_CATEGORY_COLOR);
    setCategorySaving(false);
    setCategoryNameError(null);
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setCategoryKey(defaultCategoryKey);
    setNotes("");
    setAssignees(["me"]);
    setCategoryFormVisible(false);
    setShowAssigneeError(false);
    resetCategoryForm();
  }, [defaultCategoryKey, resetCategoryForm]);

  const hydrateFromTodo = useCallback(
    (todo: TodoItem) => {
      setTitle(todo.title);
      setCategoryKey(todo.categoryKey ?? todo.categoryId ?? defaultCategoryKey);
      setNotes(todo.notes ?? "");
      setAssignees(
        todo.assigneeIds && todo.assigneeIds.length ? todo.assigneeIds : ["me"]
      );
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

  const assigneeMode = useMemo<"me" | "partner" | "both">(() => {
    const hasMe = assignees.includes("me");
    const hasPartner = assignees.includes("partner");
    if (hasMe && hasPartner) return "both";
    if (hasPartner) return "partner";
    return "me";
  }, [assignees]);

  const assigneeOptions = useMemo(
    () => [
      {
        key: "me" as const,
        label: "Me",
        emoji: "🐼",
        color: palette.accent,
        avatar: meAvatar ?? undefined,
      },
      {
        key: "partner" as const,
        label: partnerName,
        emoji: "🐰",
        color: palette.secondary,
        avatar: partnerAvatar ?? undefined,
      },
      {
        key: "both" as const,
        label: "Both",
        emoji: "🤝",
        color: palette.primarySoft,
        avatar: undefined,
      },
    ],
    [
      meAvatar,
      palette.accent,
      palette.primarySoft,
      palette.secondary,
      partnerAvatar,
      partnerName,
    ]
  );

  const selectAssigneeMode = (mode: "me" | "partner" | "both") => {
    if (mode === "both") {
      setAssignees(["me", "partner"]);
    } else if (mode === "partner") {
      setAssignees(["partner"]);
    } else {
      setAssignees(["me"]);
    }
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
        showToast({
          tone: "error",
          title: "Couldn't save category",
          message: "Please try again.",
        });
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
        notes: notes.trim(),
        assignees,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save to-do", error);
      showToast({
        tone: "error",
        title: "Couldn't save to-do",
        message: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={dismissModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.bottom + 24}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "#00000055",
            justifyContent: "flex-end",
          }}
          onPress={dismissModal}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={{
              backgroundColor: palette.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "94%",
              paddingBottom: insets.bottom + 16,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 18,
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              }}
            >
              <View style={{ width: 40 }} />
              <CuteText weight="bold" style={{ fontSize: 18 }}>
                {modalTitle}
              </CuteText>
              <Pressable
                onPress={dismissModal}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.card,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#00000012",
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <MaterialIcons name="close" size={20} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                gap: 16,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 8 }}>
                <CuteText weight="semibold" style={{ fontSize: 14 }}>
                  What needs to be done?
                </CuteText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Book flights to Bali"
                  placeholderTextColor={palette.textSecondary}
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.card,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: palette.text,
                    fontSize: 16,
                  }}
                />
              </View>

              <View style={{ gap: 8 }}>
                <CuteText weight="semibold" style={{ fontSize: 14 }}>
                  Category
                </CuteText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <CuteDropdown
                      value={categoryKey}
                      onChange={(value) =>
                        setCategoryKey(value ?? defaultCategoryKey)
                      }
                      options={categoryOptions}
                      placeholder="Choose a category"
                      modalTitle="Pick a category"
                      dropdownStyle={{
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: palette.border,
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                      }}
                    />
                  </View>
                  <Pressable
                    onPress={() => {
                      resetCategoryForm();
                      setCategoryFormVisible(true);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderStyle: "dashed",
                      borderColor: palette.primary,
                      backgroundColor: palette.card,
                    }}
                  >
                    <CuteText
                      weight="bold"
                      style={{ color: palette.primary, fontSize: 12 }}
                    >
                      New
                    </CuteText>
                  </Pressable>
                </View>
                {categoryFormVisible ? (
                  <View
                    style={{
                      marginTop: 10,
                      padding: 14,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: palette.primary,
                      borderStyle: "dashed",
                      backgroundColor: palette.card,
                      gap: 10,
                    }}
                  >
                    <CuteText weight="bold" style={{ fontSize: 14 }}>
                      New category
                    </CuteText>
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
                                borderWidth: isActive ? 2 : 1,
                                borderColor: isActive
                                  ? palette.primary
                                  : palette.border,
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

              <View style={{ gap: 8 }}>
                <CuteText weight="semibold" style={{ fontSize: 14 }}>
                  Notes (Optional)
                </CuteText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Add more details here..."
                  placeholderTextColor={palette.textSecondary}
                  style={{
                    minHeight: 110,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: palette.border,
                    backgroundColor: palette.card,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: palette.text,
                    fontSize: 14,
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <View style={{ gap: 10 }}>
                <CuteText weight="semibold" style={{ fontSize: 14 }}>
                  Assign to
                </CuteText>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {assigneeOptions.map((option) => {
                    const isActive = assigneeMode === option.key;
                    const renderAvatar = (
                      uri?: string,
                      emoji?: string,
                      bg?: string
                    ) => (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: bg ?? palette.card,
                          overflow: "hidden",
                          shadowColor: "#00000010",
                          shadowOpacity: 0.08,
                          shadowRadius: 8,
                        }}
                      >
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <CuteText style={{ fontSize: 22 }}>{emoji}</CuteText>
                        )}
                      </View>
                    );

                    const renderBothAvatars = () => (
                      <View style={{ width: 52, height: 48 }}>
                        <View
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: palette.accent,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            shadowColor: "#00000015",
                            shadowOpacity: 0.08,
                            shadowRadius: 6,
                          }}
                        >
                          {meAvatar ? (
                            <Image
                              source={{ uri: meAvatar }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <CuteText style={{ fontSize: 18 }}>🐼</CuteText>
                          )}
                        </View>
                        <View
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: palette.secondary,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            borderWidth: 2,
                            borderColor: palette.card,
                            shadowColor: "#00000015",
                            shadowOpacity: 0.08,
                            shadowRadius: 6,
                          }}
                        >
                          {partnerAvatar ? (
                            <Image
                              source={{ uri: partnerAvatar }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <CuteText style={{ fontSize: 18 }}>🐰</CuteText>
                          )}
                        </View>
                      </View>
                    );

                    return (
                      <Pressable
                        key={option.key}
                        onPress={() => selectAssigneeMode(option.key)}
                        style={{
                          flex: 1,
                          alignItems: "center",
                          gap: 8,
                          paddingVertical: 12,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: isActive
                            ? palette.primary
                            : palette.border,
                          backgroundColor: isActive
                            ? palette.primarySoft
                            : palette.card,
                          shadowColor: "#00000010",
                          shadowOpacity: isActive ? 0.12 : 0,
                          shadowRadius: 8,
                          elevation: isActive ? 2 : 0,
                        }}
                      >
                        {option.key === "both"
                          ? renderBothAvatars()
                          : renderAvatar(
                              option.avatar,
                              option.emoji,
                              option.color
                            )}
                        <CuteText
                          weight={isActive ? "bold" : "semibold"}
                          style={{
                            fontSize: 13,
                            color: isActive
                              ? palette.text
                              : palette.textSecondary,
                          }}
                        >
                          {option.label}
                        </CuteText>
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
            </ScrollView>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                paddingHorizontal: 20,
                paddingBottom: 16,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: palette.border,
                backgroundColor: palette.card,
              }}
            >
              <Pressable
                onPress={dismissModal}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor: palette.card,
                  borderWidth: 1,
                  borderColor: palette.border,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#00000010",
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <CuteText weight="bold" style={{ color: palette.text }}>
                  Cancel
                </CuteText>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!title.trim().length || submitting}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 999,
                  backgroundColor:
                    !title.trim().length || submitting
                      ? palette.primarySoft
                      : palette.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: palette.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 3,
                  opacity: submitting ? 0.8 : 1,
                }}
              >
                <CuteText
                  weight="bold"
                  style={{
                    color: "#fff",
                  }}
                >
                  {submitLabel}
                </CuteText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
