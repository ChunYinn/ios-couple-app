export type AuthStatus =
  | "signedOut"
  | "profile"
  | "pairing"
  | "anniversary"
  | "ready";

export type AuthProvider = "apple" | "google";

export type UserProfile = {
  uid: string | null;
  displayName?: string;
  avatarUrl?: string;
  birthday?: string;
  pronouns?: string;
  coupleId?: string | null;
};

export type AuthState = {
  status: AuthStatus;
  provider?: AuthProvider;
  user: UserProfile;
};

export type ProfileFavorite = {
  label: string;
  value: string;
};

export type PartnerProfile = {
  displayName: string;
  status: string;
  avatarUrl?: string;
  about?: string;
  accentColor: string;
  loveLanguages: string[];
  favorites: ProfileFavorite[];
};

export type Milestone = {
  id: string;
  title: string;
  image: string;
  description: string;
};

export type TodoCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
};

export type TodoItem = {
  id: string;
  categoryId: string;
  title: string;
  completed: boolean;
  assigneeIds: string[];
  dueDate?: string;
};

export type ChatMessage = {
  id: string;
  sender: "me" | "partner";
  text: string;
  timestamp: string;
  reaction?: string;
};

export type Flashback = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  year: number;
};

export type GalleryItem = {
  id: string;
  image: string;
  type: "photo" | "video";
  favorite?: boolean;
};

export type AppSettings = {
  enablePush: boolean;
  enableFlashbacks: boolean;
  accent: string;
};

export type PairingState = {
  coupleId?: string | null;
  inviteCode?: string | null;
  inviteLink?: string | null;
  qrCodeData?: string | null;
  createdAt?: string | null;
  ownerUid?: string | null;
  isPaired: boolean;
};

export type DashboardState = {
  helloMessage?: string;
  daysTogether: number;
  anniversaryDate?: string | null;
};

export type ProfilesState = {
  me?: PartnerProfile;
  partner?: PartnerProfile;
};

export type TodosState = {
  categories: TodoCategory[];
  items: TodoItem[];
};

export type ChatState = {
  partnerName?: string;
  partnerAvatar?: string;
  messages: ChatMessage[];
};

export type GalleryState = {
  flashbacks: Flashback[];
  items: GalleryItem[];
};

export type AppState = {
  auth: AuthState;
  pairing: PairingState;
  dashboard: DashboardState;
  milestones: Milestone[];
  profiles: ProfilesState;
  todos: TodosState;
  chat: ChatState;
  gallery: GalleryState;
  settings: AppSettings;
};

export type AppAction =
  | { type: "SIGN_IN"; payload: { provider: AuthProvider; uid: string } }
  | { type: "SIGN_OUT" }
  | {
      type: "SAVE_PROFILE";
      payload: {
        displayName: string;
        avatarUrl?: string;
        birthday?: string;
        pronouns?: string;
        status?: string;
        about?: string;
        loveLanguages?: string[];
      };
    }
  | { type: "SET_PROFILE_ACCENT"; payload: { accentColor: string } }
  | {
      type: "CREATE_INVITE";
      payload: { inviteCode: string; inviteLink: string; qrCodeData: string };
    }
  | {
      type: "SET_PENDING_PAIR";
      payload: { inviteCode: string; ownerUid: string; createdAt: string };
    }
  | {
      type: "JOIN_COUPLE";
      payload: {
        coupleId: string;
        partnerProfile: PartnerProfile;
      };
    }
  | { type: "SET_ANNIVERSARY"; payload: { anniversaryDate: string; daysTogether: number } }
  | { type: "RESET_PAIRING" }
  | {
      type: "ADD_TODO_CATEGORY";
      payload: {
        id?: string;
        name: string;
        icon: string;
        color: string;
        description?: string;
      };
    }
  | { type: "DELETE_TODO_CATEGORY"; payload: { categoryId: string } }
  | {
      type: "ADD_TODO_ITEM";
      payload: { categoryId: string; title: string; assigneeIds: string[]; dueDate?: string };
    }
  | { type: "TOGGLE_TODO_ITEM"; payload: { itemId: string } }
  | {
      type: "UPDATE_PROFILE_NOTE";
      payload: { status?: string; about?: string; loveLanguages?: string[] };
    }
  | {
      type: "ADD_CHAT_MESSAGE";
      payload: { text: string };
    }
  | {
      type: "UPDATE_SETTINGS";
      payload: Partial<AppSettings>;
    };
