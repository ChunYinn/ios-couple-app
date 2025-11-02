import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  ReactNode,
} from "react";

import { initialState } from "../data/initialState";
import {
  AppAction,
  AppState,
  PartnerProfile,
  ProfileFavorite,
} from "../types/app";
import {
  demoPartnerProfile,
  demoMilestones,
  demoTodoCategories,
  demoTodoItems,
  demoChatMessages,
  demoFlashbacks,
  demoGalleryItems,
} from "../data/demoContent";

const AppDataContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const generateId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const mergeFavorites = (
  base: ProfileFavorite[] | undefined,
  incoming: ProfileFavorite[]
) => {
  if (!base || !base.length) return incoming;
  return base;
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "SIGN_IN": {
      return {
        ...state,
        auth: {
          status: "profile",
          provider: action.payload.provider,
          user: {
            uid: action.payload.uid,
            displayName: undefined,
            birthday: undefined,
            pronouns: undefined,
            avatarUrl: undefined,
            coupleId: null,
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
        chat: { partnerName: undefined, partnerAvatar: undefined, messages: [] },
        gallery: { flashbacks: [], items: [] },
      };
    }
    case "SIGN_OUT": {
      return initialState;
    }
    case "SAVE_PROFILE": {
      if (!state.auth.user.uid) return state;
      const updatedProfile: PartnerProfile = {
        displayName: action.payload.displayName,
        status: action.payload.status ?? "Feeling Happy",
        avatarUrl: action.payload.avatarUrl,
        about:
          action.payload.about ||
          "Curious heart who loves to make memories that feel like magic.",
        accentColor: state.settings.accent,
        loveLanguages: action.payload.loveLanguages || ["Words of Affirmation"],
        favorites: state.profiles.me?.favorites ?? [],
      };
      return {
        ...state,
        auth: {
          ...state.auth,
          status: "pairing",
          user: {
            ...state.auth.user,
            displayName: action.payload.displayName,
            avatarUrl: action.payload.avatarUrl,
            birthday: action.payload.birthday,
            pronouns: action.payload.pronouns,
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
      if (!state.auth.user.uid) return state;
      return {
        ...state,
        pairing: {
          coupleId: null,
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
      const partnerProfile: PartnerProfile = action.payload.partnerProfile;
      const mergedMilestones = state.milestones.length
        ? state.milestones
        : demoMilestones;
      const mergedCategories = state.todos.categories.length
        ? state.todos.categories
        : demoTodoCategories;
      const mergedItems = state.todos.items.length
        ? state.todos.items
        : demoTodoItems;
      const mergedChat = state.chat.messages.length
        ? state.chat.messages
        : demoChatMessages;
      const mergedFlashbacks = state.gallery.flashbacks.length
        ? state.gallery.flashbacks
        : demoFlashbacks;
      const mergedGallery = state.gallery.items.length
        ? state.gallery.items
        : demoGalleryItems;

      return {
        ...state,
        auth: {
          ...state.auth,
          status: state.dashboard.anniversaryDate ? "ready" : "anniversary",
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
        milestones: mergedMilestones,
        profiles: {
          ...state.profiles,
          partner: {
            ...partnerProfile,
            favorites: mergeFavorites(state.profiles.partner?.favorites, partnerProfile.favorites),
          },
        },
        todos: {
          categories: mergedCategories,
          items: mergedItems,
        },
        chat: {
          partnerName: partnerProfile.displayName,
          partnerAvatar: partnerProfile.avatarUrl,
          messages: mergedChat,
        },
        gallery: {
          flashbacks: mergedFlashbacks,
          items: mergedGallery,
        },
      };
    }
    case "SET_ANNIVERSARY": {
      return {
        ...state,
        auth: {
          ...state.auth,
          status: "ready",
        },
        dashboard: {
          helloMessage: state.profiles.me
            ? `Hello ${state.profiles.me.displayName}!`
            : "Hello love birds!",
          daysTogether: action.payload.daysTogether,
          anniversaryDate: action.payload.anniversaryDate,
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
          status: "pairing",
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
        chat: { partnerName: undefined, partnerAvatar: undefined, messages: [] },
        gallery: { flashbacks: [], items: [] },
      };
    }
    case "ADD_TODO_CATEGORY": {
      const id = action.payload.id ?? generateId("category");
      const newCategory = {
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
    case "ADD_TODO_ITEM": {
      const newItem = {
        id: generateId("todo"),
        categoryId: action.payload.categoryId,
        title: action.payload.title,
        completed: false,
        assigneeIds: action.payload.assigneeIds,
        dueDate: action.payload.dueDate,
      };
      return {
        ...state,
        todos: {
          ...state.todos,
          items: [newItem, ...state.todos.items],
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
              ? { ...item, completed: !item.completed }
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
            loveLanguages:
              action.payload.loveLanguages ?? state.profiles.me.loveLanguages,
          },
        },
      };
    }
    case "ADD_CHAT_MESSAGE": {
      return {
        ...state,
        chat: {
          ...state.chat,
          messages: [
            ...state.chat.messages,
            {
              id: generateId("msg"),
              sender: "me",
              text: action.payload.text,
              timestamp: new Date().toISOString(),
            },
          ],
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
    default:
      return state;
  }
};

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
};
