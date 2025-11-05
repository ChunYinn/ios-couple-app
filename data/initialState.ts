import { AppState } from "../types/app";

export const initialState: AppState = {
  auth: {
    status: "initializing",
    user: {
      uid: null,
      displayName: undefined,
      avatarUrl: undefined,
      birthday: undefined,
      pronouns: undefined,
      anniversaryDate: undefined,
      coupleId: null,
      email: undefined,
      isAnonymous: undefined,
    },
  },
  pairing: {
    coupleId: null,
    inviteCode: null,
    inviteLink: null,
    qrCodeData: null,
    createdAt: null,
    ownerUid: null,
    isPaired: false,
  },
  dashboard: {
    helloMessage: "Welcome back!",
    daysTogether: 0,
    anniversaryDate: null,
  },
  milestones: [],
  profiles: {},
  todos: {
    categories: [],
    items: [],
  },
  chat: {
    partnerName: undefined,
    partnerAvatar: undefined,
    messages: [],
  },
  gallery: {
    flashbacks: [],
    items: [],
  },
  settings: {
    enablePush: false,
    enableFlashbacks: false,
    accent: "#FF8FAB",
  },
};
