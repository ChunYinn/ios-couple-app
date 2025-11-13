import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { onAuthStateChanged } from "firebase/auth";

import { initialState } from "../data/initialState";
import {
  AppAction,
  AppState,
  ChatMessage,
  Flashback,
  GalleryItem,
  Milestone,
  PartnerProfile,
  ProfileFavorite,
  TodoCategory,
  TodoItem,
} from "../types/app";
import {
  coupleService,
  memoryService,
  milestoneService,
  messageService,
  profileService,
  todoService,
  userService,
} from "../firebase/services";
import {
  DBMemory,
  DBMilestone,
  DBMessage,
  DBProfile,
  DBTodoCategory,
  DBTodoItem,
  timestampToDate,
} from "../firebase/types";
import { firebaseAuth } from "../firebase/config";
import {
  DEFAULT_LOVE_LANGUAGES,
  LOVE_LANGUAGES,
  normalizeLoveLanguages,
} from "../data/loveLanguages";
import { LoveLanguageValue } from "../types/app";
import { authService } from "../services/authService";
import { calculateDaysTogether, formatDateToYMD } from "../utils/dateUtils";

const AppDataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const DEFAULT_PROFILE_STATUS = "";
const DEFAULT_PROFILE_ABOUT =
  "Curious heart who loves to make memories that feel like magic.";
const DEFAULT_PROFILE_LANGUAGES: LoveLanguageValue[] = normalizeLoveLanguages(
  DEFAULT_LOVE_LANGUAGES
);
const DEFAULT_PROFILE_ACCENT = initialState.settings.accent;

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mergeFavorites = (
  base: ProfileFavorite[] | undefined,
  incoming: ProfileFavorite[]
) => {
  if (!base || !base.length) return incoming;
  if (!incoming.length) return base;
  return incoming;
};

const mapCategoryFromDb = (category: DBTodoCategory): TodoCategory => ({
  id: category.id ?? "",
  name: category.name,
  icon: category.icon,
  color: category.color,
  description: category.description ?? undefined,
});

const mapTodoFromDb = (item: DBTodoItem): TodoItem => ({
  id: item.id ?? "",
  categoryId: item.categoryId,
  categoryKey: item.categoryKey ?? undefined,
  title: item.title,
  completed: item.completed,
  assigneeIds: item.assigneeIds ?? [],
  dueDate: item.dueDate ?? undefined,
  mood: (item.mood as TodoItem["mood"]) ?? undefined,
  location: item.location ?? undefined,
  costEstimate: item.costEstimate ?? undefined,
  notes: item.notes ?? undefined,
  completedAt: item.completedAt
    ? timestampToDate(item.completedAt).toISOString()
    : undefined,
  proofImageUrl: item.proofImageUrl ?? undefined,
});

const mapProfileFromDb = (uid: string, profile: DBProfile): PartnerProfile => ({
  uid,
  displayName: profile.displayName,
  status: profile.status ?? DEFAULT_PROFILE_STATUS,
  avatarUrl: profile.avatarUrl ?? undefined,
  about: profile.about ?? DEFAULT_PROFILE_ABOUT,
  accentColor: profile.accentColor ?? DEFAULT_PROFILE_ACCENT,
  birthday: profile.birthday ?? undefined,
  anniversary: profile.anniversary ?? undefined,
  loveLanguages: normalizeLoveLanguages(profile.loveLanguages),
  favorites:
    profile.favorites?.map((favorite) => ({
      label: favorite.label,
      value: favorite.value,
    })) ?? [],
});

const mapMessageFromDb = (
  payload: { message: DBMessage; pending: boolean },
  myUid: string,
  partnerUid?: string | null
): ChatMessage => {
  const { message, pending } = payload;
  const reactions = message.reactions ?? {};
  const firstReactionKey = Object.keys(reactions)[0];

  const fallbackDate = (() => {
    if (message.clientTimestamp) {
      const candidate = new Date(message.clientTimestamp);
      if (!Number.isNaN(candidate.getTime())) {
        return candidate;
      }
    }
    return new Date();
  })();

  let resolvedDate: Date | null = null;
  const rawTimestamp = message.timestamp as any;
  if (rawTimestamp) {
    try {
      if (typeof rawTimestamp.toDate === "function") {
        resolvedDate = timestampToDate(rawTimestamp);
      } else if (
        rawTimestamp instanceof Date ||
        typeof rawTimestamp === "string" ||
        typeof rawTimestamp === "number"
      ) {
        const candidate = new Date(rawTimestamp);
        if (!Number.isNaN(candidate.getTime())) {
          resolvedDate = candidate;
        }
      }
    } catch (error) {
      console.warn("Unable to parse message timestamp", error);
    }
  }

  const finalDate = resolvedDate ?? fallbackDate;
  const readBy = message.readBy ?? {};
  const rawReadByMe = myUid ? readBy[myUid] : undefined;
  const rawReadByPartner = partnerUid ? readBy[partnerUid] : undefined;

  const readByMe =
    rawReadByMe !== undefined && rawReadByMe !== null
      ? true
      : message.sender === myUid;

  let readAt: string | undefined;
  if (rawReadByPartner) {
    try {
      readAt = timestampToDate(rawReadByPartner).toISOString();
    } catch (error) {
      console.warn("Unable to parse message readAt", error);
    }
  }

  return {
    id: message.id ?? generateId("msg"),
    sender: message.sender === myUid ? "me" : "partner",
    text: message.text,
    type: message.type,
    mediaUrl: message.mediaUrl ?? undefined,
    thumbnailUrl: message.thumbnailUrl ?? undefined,
    timestamp: finalDate.toISOString(),
    clientTimestamp: fallbackDate.toISOString(),
    pending,
    readByMe,
    readByPartner: Boolean(rawReadByPartner),
    readAt,
    reaction: firstReactionKey,
  };
};

const mapMemoryToGalleryItem = (memory: DBMemory): GalleryItem => ({
  id: memory.id ?? generateId("memory"),
  image: memory.thumbnailUrl || memory.imageUrl,
  type: memory.type,
  favorite: Boolean(memory.isFavorite),
});

const createFlashbacksFromMemories = (memories: DBMemory[]): Flashback[] => {
  const today = new Date();
  return memories
    .filter((memory) => {
      const date = timestampToDate(memory.capturedDate);
      return (
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate() &&
        date.getFullYear() < today.getFullYear()
      );
    })
    .map((memory) => {
      const captured = timestampToDate(memory.capturedDate);
      return {
        id: memory.id ?? generateId("flashback"),
        title: `On this day in ${captured.getFullYear()}`,
        subtitle: memory.caption || "Replay this moment together",
        image: memory.imageUrl,
        year: captured.getFullYear(),
      };
    });
};

const mapMilestoneFromDb = (milestone: DBMilestone): Milestone => ({
  id: milestone.id ?? generateId("milestone"),
  title: milestone.title,
  image: milestone.image ?? undefined,
  description: milestone.description ?? undefined,
  badgeColor: milestone.badgeColor ?? undefined,
  achievedAt: milestone.achievedAt
    ? timestampToDate(milestone.achievedAt).toISOString()
    : null,
  dayCount: milestone.dayCount ?? null,
  createdBy: milestone.createdBy ?? null,
});

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SIGN_IN": {
      return {
        ...state,
        auth: {
          status: "initializing",
          provider: action.payload.provider,
          user: {
            uid: action.payload.uid,
            displayName: undefined,
            birthday: undefined,
            avatarUrl: undefined,
            anniversaryDate: undefined,
            coupleId: null,
            email: action.payload.email ?? undefined,
            isAnonymous: action.payload.isAnonymous,
          },
        },
        pairing: {
          coupleId: null,
          inviteCode: null,
          inviteLink: null,
          qrCodeData: null,
          createdAt: null,
          ownerUid: action.payload.uid,
          isPaired: false,
        },
        dashboard: {
          ...state.dashboard,
          helloMessage: "Welcome back!",
          daysTogether: 0,
          anniversaryDate: null,
        },
        milestones: [],
        profiles: {},
        todos: { categories: [], items: [] },
        chat: {
          partnerName: undefined,
          partnerAvatar: undefined,
          messages: [],
          unreadCount: 0,
          lastReadTimestamp: null,
          locallyReadMessageIds: {},
        },
        gallery: { flashbacks: [], items: [] },
      };
    }
    case "SIGN_OUT": {
      return {
        ...initialState,
        settings: state.settings,
      };
    }
    case "RESET_SESSION": {
      return {
        ...initialState,
        settings: state.settings,
      };
    }
    case "SAVE_PROFILE": {
      if (!state.auth.user.uid) return state;
      const updatedProfile: PartnerProfile = {
        uid: state.auth.user.uid,
        displayName: action.payload.displayName,
        status: action.payload.status ?? DEFAULT_PROFILE_STATUS,
        avatarUrl: action.payload.avatarUrl,
        about:
          action.payload.about ||
          DEFAULT_PROFILE_ABOUT,
        accentColor: action.payload.accentColor ?? state.settings.accent,
        birthday: action.payload.birthday ?? state.profiles.me?.birthday,
        anniversary: action.payload.anniversary ?? state.profiles.me?.anniversary,
        loveLanguages: normalizeLoveLanguages(action.payload.loveLanguages),
        favorites: state.profiles.me?.favorites ?? [],
      };
      return {
        ...state,
        auth: {
          ...state.auth,
          status: "ready", // Go directly to app after profile setup
          user: {
            ...state.auth.user,
            displayName: action.payload.displayName,
            avatarUrl: action.payload.avatarUrl,
            birthday: action.payload.birthday,
            anniversaryDate: action.payload.anniversary ?? state.auth.user.anniversaryDate,
          },
        },
        profiles: {
          ...state.profiles,
          me: updatedProfile,
        },
      };
    }
    case "SET_PROFILE_ACCENT": {
      if (!state.profiles.me) return state;
      return {
        ...state,
        profiles: {
          ...state.profiles,
          me: {
            ...state.profiles.me,
            accentColor: action.payload.accentColor,
          },
        },
        settings: {
          ...state.settings,
          accent: action.payload.accentColor,
        },
      };
    }
    case "CREATE_INVITE": {
      return {
        ...state,
        auth: {
          ...state.auth,
          user: {
            ...state.auth.user,
            coupleId: action.payload.coupleId,
          },
        },
        pairing: {
          coupleId: action.payload.coupleId,
          inviteCode: action.payload.inviteCode,
          inviteLink: action.payload.inviteLink,
          qrCodeData: action.payload.qrCodeData,
          createdAt: new Date().toISOString(),
          ownerUid: state.auth.user.uid,
          isPaired: false,
        },
      };
    }
    case "SET_PENDING_PAIR": {
      return {
        ...state,
        pairing: {
          ...state.pairing,
          inviteCode: action.payload.inviteCode,
          createdAt: action.payload.createdAt,
          ownerUid: action.payload.ownerUid,
        },
      };
    }
    case "JOIN_COUPLE": {
      return {
        ...state,
        auth: {
          ...state.auth,
          status: "ready",  // Stay in app after joining couple
          user: {
            ...state.auth.user,
            coupleId: action.payload.coupleId,
          },
        },
        pairing: {
          ...state.pairing,
          coupleId: action.payload.coupleId,
          isPaired: true,
        },
        profiles: {
          ...state.profiles,
          partner: {
            ...action.payload.partnerProfile,
            favorites: mergeFavorites(
              state.profiles.partner?.favorites,
              action.payload.partnerProfile.favorites
            ),
          },
        },
        chat: {
          ...state.chat,
          partnerName: action.payload.partnerProfile.displayName,
          partnerAvatar: action.payload.partnerProfile.avatarUrl,
        },
      };
    }
    case "SET_ANNIVERSARY": {
      const nextAnniversary =
        action.payload.anniversaryDate && action.payload.anniversaryDate.length
          ? formatDateToYMD(action.payload.anniversaryDate)
          : undefined;
      return {
        ...state,
        auth: {
          ...state.auth,
          status: "ready",
          user: {
            ...state.auth.user,
            anniversaryDate: nextAnniversary,
          },
        },
        dashboard: {
          helloMessage: state.profiles.me
            ? `Hello ${state.profiles.me.displayName}!`
            : "Hello love birds!",
          daysTogether: action.payload.daysTogether,
          anniversaryDate: nextAnniversary ?? null,
        },
        profiles: {
          ...state.profiles,
          me: state.profiles.me
            ? { ...state.profiles.me, anniversary: nextAnniversary }
            : state.profiles.me,
        },
      };
    }
    case "RESET_PAIRING": {
      return {
        ...state,
        pairing: {
          coupleId: null,
          inviteCode: null,
          inviteLink: null,
          qrCodeData: null,
          createdAt: null,
          ownerUid: state.auth.user.uid,
          isPaired: false,
        },
        auth: {
          ...state.auth,
          status: "ready",  // Stay in app
          user: {
            ...state.auth.user,
            coupleId: null,
          },
        },
        milestones: [],
        profiles: {
          me: state.profiles.me,
        },
        todos: { categories: [], items: [] },
        chat: {
          partnerName: undefined,
          partnerAvatar: undefined,
          messages: [],
          unreadCount: 0,
          lastReadTimestamp: null,
          locallyReadMessageIds: {},
        },
        gallery: { flashbacks: [], items: [] },
      };
    }
    case "ADD_TODO_CATEGORY": {
      const id = action.payload.id ?? generateId("category");
      const newCategory: TodoCategory = {
        id,
        name: action.payload.name,
        icon: action.payload.icon,
        color: action.payload.color,
        description: action.payload.description,
      };
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: [...state.todos.categories, newCategory],
        },
      };
    }
    case "UPDATE_TODO_CATEGORY": {
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: state.todos.categories.map((category) =>
            category.id === action.payload.id
              ? {
                  ...category,
                  name: action.payload.name ?? category.name,
                  icon: action.payload.icon ?? category.icon,
                  color: action.payload.color ?? category.color,
                  description:
                    action.payload.description ?? category.description,
                }
              : category
          ),
        },
      };
    }
    case "DELETE_TODO_CATEGORY": {
      return {
        ...state,
        todos: {
          categories: state.todos.categories.filter(
            (category) => category.id !== action.payload.categoryId
          ),
          items: state.todos.items.filter(
            (item) => item.categoryId !== action.payload.categoryId
          ),
        },
      };
    }
    case "DELETE_TODO_ITEM": {
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.filter(
            (item) => item.id !== action.payload.itemId
          ),
        },
      };
    }
    case "ADD_TODO_ITEM": {
      const newItem: TodoItem = {
        id: action.payload.id ?? generateId("todo"),
        categoryId: action.payload.categoryId,
        categoryKey: action.payload.categoryKey ?? action.payload.categoryId,
        title: action.payload.title,
        completed: false,
        assigneeIds: action.payload.assigneeIds,
        dueDate: action.payload.dueDate,
        mood: action.payload.mood,
        location: action.payload.location,
        costEstimate: action.payload.costEstimate,
        notes: action.payload.notes,
      };
      return {
        ...state,
        todos: {
          ...state.todos,
          items: [newItem, ...state.todos.items],
        },
      };
    }
    case "UPDATE_TODO_ITEM": {
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.map((item) =>
            item.id === action.payload.itemId
              ? { ...item, ...action.payload.updates }
              : item
          ),
        },
      };
    }
    case "TOGGLE_TODO_ITEM": {
      return {
        ...state,
        todos: {
          ...state.todos,
          items: state.todos.items.map((item) =>
            item.id === action.payload.itemId
              ? {
                  ...item,
                  completed: action.payload.completed,
                  completedAt: action.payload.completedAt ?? undefined,
                  proofImageUrl:
                    action.payload.completed && action.payload.proofImageUrl
                      ? action.payload.proofImageUrl
                      : !action.payload.completed
                        ? undefined
                        : item.proofImageUrl,
                }
              : item
          ),
        },
      };
    }
    case "UPDATE_PROFILE_NOTE": {
      if (!state.profiles.me) return state;
      return {
        ...state,
        profiles: {
          ...state.profiles,
          me: {
            ...state.profiles.me,
            status: action.payload.status ?? state.profiles.me.status,
            about: action.payload.about ?? state.profiles.me.about,
            loveLanguages: normalizeLoveLanguages(
              action.payload.loveLanguages ?? state.profiles.me.loveLanguages
            ),
          },
        },
      };
    }
    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    }
    case "SYNC_TODO_CATEGORIES": {
      return {
        ...state,
        todos: {
          ...state.todos,
          categories: action.payload,
        },
      };
    }
    case "SYNC_TODO_ITEMS": {
      return {
        ...state,
        todos: {
          ...state.todos,
          items: action.payload,
        },
      };
    }
    case "UPDATE_AUTH_USER": {
      const { status, ...userPatch } = action.payload;
      return {
        ...state,
        auth: {
          ...state.auth,
          status: status ?? state.auth.status,
          user: {
            ...state.auth.user,
            ...userPatch,
          },
        },
      };
    }
    case "UPDATE_COUPLE_META": {
      const nextAnniversary =
        action.payload.anniversaryDate === undefined
          ? state.auth.user.anniversaryDate
          : action.payload.anniversaryDate ?? undefined;
      return {
        ...state,
        auth: {
          ...state.auth,
          status: action.payload.authStatus ?? state.auth.status,
          user: {
            ...state.auth.user,
            coupleId: action.payload.coupleId,
            anniversaryDate: nextAnniversary,
          },
        },
        pairing: {
          coupleId: action.payload.coupleId,
          inviteCode: action.payload.inviteCode ?? state.pairing.inviteCode,
          inviteLink:
            state.pairing.inviteLink ?? action.payload.inviteLink ?? null,
          qrCodeData: action.payload.qrCodeData ?? state.pairing.qrCodeData,
          createdAt: state.pairing.createdAt,
          ownerUid: action.payload.ownerUid ?? state.pairing.ownerUid,
          isPaired: action.payload.isPaired,
        },
        dashboard: {
          ...state.dashboard,
          daysTogether: action.payload.daysTogether,
          anniversaryDate: nextAnniversary ?? null,
        },
        settings: {
          ...state.settings,
          enablePush: action.payload.settings.enablePush,
          enableFlashbacks: action.payload.settings.enableFlashbacks,
        },
      };
    }
    case "UPDATE_PROFILES": {
      const partnerProfile = action.payload.partner ?? state.profiles.partner;
      return {
        ...state,
        profiles: {
          ...state.profiles,
          me: action.payload.me ?? state.profiles.me,
          partner: partnerProfile ?? undefined,
        },
        chat: {
          ...state.chat,
          partnerName: partnerProfile?.displayName ?? state.chat.partnerName,
          partnerAvatar: partnerProfile?.avatarUrl ?? state.chat.partnerAvatar,
        },
      };
    }
    case "SYNC_CHAT_MESSAGES": {
      const localRead = state.chat.locallyReadMessageIds ?? {};
      const messages = action.payload.map((message) =>
        message.sender === "partner" && localRead[message.id]
          ? { ...message, readByMe: true }
          : message
      );
      const unreadCount = messages.filter(
        (message) => message.sender === "partner" && !message.readByMe
      ).length;
      return {
        ...state,
        chat: {
          ...state.chat,
          messages,
          unreadCount,
        },
      };
    }
    case "MARK_CHAT_MESSAGES_READ": {
      if (!action.payload.messageIds.length) {
        return state;
      }
      const updatedLocal = {
        ...state.chat.locallyReadMessageIds,
      };
      action.payload.messageIds.forEach((id) => {
        updatedLocal[id] = true;
      });
      const messages = state.chat.messages.map((message) =>
        message.sender === "partner" && updatedLocal[message.id]
          ? { ...message, readByMe: true }
          : message
      );
      const unreadCount = messages.filter(
        (message) => message.sender === "partner" && !message.readByMe
      ).length;
      return {
        ...state,
        chat: {
          ...state.chat,
          messages,
          unreadCount,
          locallyReadMessageIds: updatedLocal,
          lastReadTimestamp: action.payload.timestamp,
        },
      };
    }
    case "SYNC_GALLERY_ITEMS": {
      return {
        ...state,
        gallery: {
          ...state.gallery,
          items: action.payload,
        },
      };
    }
    case "SYNC_GALLERY_FLASHBACKS": {
      return {
        ...state,
        gallery: {
          ...state.gallery,
          flashbacks: action.payload,
        },
      };
    }
    case "SYNC_MILESTONES": {
      return {
        ...state,
        milestones: action.payload,
      };
    }
    default:
      return state;
  }
};

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const ensureAnonymous = async () => {
      try {
        await authService.ensureAnonymousSession();
      } catch (error) {
        console.error("Failed to ensure anonymous session", error);
      }
    };

    if (!firebaseAuth.currentUser) {
      ensureAnonymous();
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        const providerId = firebaseUser.isAnonymous
          ? "anonymous"
          : firebaseUser.providerData[0]?.providerId === "password"
            ? "password"
            : "custom";

        dispatch({
          type: "SIGN_IN",
          payload: {
            provider: providerId,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
          },
        });
      } else {
        dispatch({ type: "RESET_SESSION" });
        ensureAnonymous();
      }
    });

    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    const uid = state.auth.user.uid;
    if (!uid) return;

    const unsubscribe = userService.subscribeToUser(
      uid,
      (user) => {
        const currentState = stateRef.current;
        if (!user) {
          // User document doesn't exist, so they need to create a profile.
          dispatch({
            type: "UPDATE_AUTH_USER",
            payload: {
              status: "profile",
              displayName: undefined,
              avatarUrl: undefined,
              birthday: undefined,
              coupleId: null,
            },
          });
          return;
        }

        const hasCompletedProfile = Boolean(
          typeof user.displayName === "string" && user.displayName.trim().length > 0
        );
        const nextStatus = hasCompletedProfile ? "ready" : "profile";

        const normalizedLoveLanguages = normalizeLoveLanguages(user.loveLanguages);

        dispatch({
          type: "UPDATE_AUTH_USER",
          payload: {
            uid,
            displayName: user.displayName ?? undefined,
            avatarUrl: user.avatarUrl ?? undefined,
            birthday: user.birthday ?? undefined,
            coupleId: user.coupleId,
            status: nextStatus,
            email: user.email ?? undefined,
            isAnonymous: user.authProvider === "anonymous",
            anniversaryDate: user.anniversaryDate ?? undefined,
          },
        });

        const derivedAccent = user.accentColor ?? currentState.settings.accent;
        const normalizedAnniversary = user.anniversaryDate
          ? formatDateToYMD(user.anniversaryDate)
          : undefined;

        dispatch({
          type: "UPDATE_PROFILES",
          payload: {
            me: {
              uid,
              displayName: user.displayName ?? "You",
              status: user.status ?? DEFAULT_PROFILE_STATUS,
              avatarUrl: user.avatarUrl ?? undefined,
              about: user.about ?? DEFAULT_PROFILE_ABOUT,
              accentColor: derivedAccent,
              loveLanguages: normalizedLoveLanguages,
              favorites: user.favorites ?? currentState.profiles.me?.favorites ?? [],
            },
          },
        });

        if (user.accentColor && user.accentColor !== currentState.settings.accent) {
          dispatch({
            type: "SET_PROFILE_ACCENT",
            payload: { accentColor: user.accentColor },
          });
        }

        if (!user.coupleId) {
          const currentAnniversary =
            stateRef.current.dashboard.anniversaryDate ?? undefined;

          if (
            normalizedAnniversary &&
            normalizedAnniversary !== currentAnniversary
          ) {
            dispatch({
              type: "SET_ANNIVERSARY",
              payload: {
                anniversaryDate: normalizedAnniversary,
                daysTogether: calculateDaysTogether(normalizedAnniversary),
              },
            });
          } else if (!normalizedAnniversary && currentAnniversary) {
            dispatch({
              type: "SET_ANNIVERSARY",
              payload: { anniversaryDate: "", daysTogether: 0 },
            });
          }
        }
      },
      (error) => {
        console.error("Failed to load user profile:", error);
        dispatch({
          type: "UPDATE_AUTH_USER",
          payload: {
            status:
              state.auth.status === "initializing" || state.auth.status === "ready"
                ? "profile"
                : state.auth.status,
          },
        });
      }
    );

    return unsubscribe;
  }, [state.auth.user.uid, state.auth.status]);

  useEffect(() => {
    const uid = state.auth.user.uid;
    const coupleId = state.auth.user.coupleId;
    if (!uid || !coupleId) {
      return;
    }

    const unsubscribeCouple = coupleService.subscribeToCouple(
      coupleId,
      (couple) => {
        if (!couple) return;
        const daysTogether = couple.anniversaryDate
          ? calculateDaysTogether(couple.anniversaryDate)
          : 0;
        // Stay in "ready" status when paired
        const authStatus = "ready";
        dispatch({
          type: "UPDATE_COUPLE_META",
          payload: {
            coupleId,
            inviteCode: couple.inviteCode ?? null,
            inviteLink: couple.inviteLink ?? null,
            qrCodeData: couple.qrCodeData ?? null,
            ownerUid: couple.ownerUid ?? null,
            isPaired: couple.isPaired,
            anniversaryDate: couple.anniversaryDate,
            daysTogether,
            settings: {
              enablePush: couple.settings.enablePush,
              enableFlashbacks: couple.settings.enableFlashbacks,
            },
            authStatus,
          },
        });
      }
    );

    const unsubscribeProfiles = profileService.subscribeToProfiles(
      coupleId,
      (profiles) => {
        const meProfile = profiles.find((entry) => entry.uid === uid);
        const partnerProfile = profiles.find((entry) => entry.uid !== uid);

        dispatch({
          type: "UPDATE_PROFILES",
          payload: {
            me: meProfile
              ? mapProfileFromDb(meProfile.uid, meProfile.profile)
              : undefined,
            partner: partnerProfile
              ? mapProfileFromDb(
                  partnerProfile.uid,
                  partnerProfile.profile
                )
              : null,
          },
        });
      }
    );

    return () => {
      unsubscribeCouple?.();
      unsubscribeProfiles?.();
    };
  }, [state.auth.user.coupleId, state.auth.user.uid]);

  useEffect(() => {
    const coupleId = state.auth.user.coupleId;
    if (!state.pairing.isPaired || !coupleId) {
      return;
    }

    const unsubscribeCategories = todoService.subscribeToCategories(
      coupleId,
      (categories) => {
        dispatch({
          type: "SYNC_TODO_CATEGORIES",
          payload: categories.map(mapCategoryFromDb),
        });
      }
    );

    const unsubscribeTodos = todoService.subscribeToTodos(
      coupleId,
      (items) => {
        dispatch({
          type: "SYNC_TODO_ITEMS",
          payload: items.map(mapTodoFromDb),
        });
      }
    );

    return () => {
      unsubscribeCategories?.();
      unsubscribeTodos?.();
    };
  }, [state.pairing.isPaired, state.auth.user.coupleId]);

  useEffect(() => {
    const coupleId = state.auth.user.coupleId;
    const uid = state.auth.user.uid;
    if (!state.pairing.isPaired || !coupleId || !uid) {
      return;
    }

    const partnerUid = state.profiles.partner?.uid ?? null;
    const unsubscribe = messageService.subscribeToMessages(coupleId, (entries) => {
      const mapped = entries
        .map((entry) => mapMessageFromDb(entry, uid, partnerUid))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      dispatch({
        type: "SYNC_CHAT_MESSAGES",
        payload: mapped,
      });
    });

    return unsubscribe;
  }, [
    state.pairing.isPaired,
    state.auth.user.coupleId,
    state.auth.user.uid,
    state.profiles.partner?.uid,
  ]);

  useEffect(() => {
    const coupleId = state.auth.user.coupleId;
    if (!state.pairing.isPaired || !coupleId) {
      return;
    }

    const unsubscribeMemories = memoryService.subscribeToMemories(
      coupleId,
      (memories) => {
        dispatch({
          type: "SYNC_GALLERY_ITEMS",
          payload: memories.map(mapMemoryToGalleryItem),
        });
        dispatch({
          type: "SYNC_GALLERY_FLASHBACKS",
          payload: createFlashbacksFromMemories(memories),
        });
      }
    );

    const unsubscribeMilestones = milestoneService.subscribeToMilestones(
      coupleId,
      (milestones) => {
        dispatch({
          type: "SYNC_MILESTONES",
          payload: milestones.map(mapMilestoneFromDb),
        });
      }
    );

    return () => {
      unsubscribeMemories?.();
      unsubscribeMilestones?.();
    };
  }, [state.pairing.isPaired, state.auth.user.coupleId]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};
