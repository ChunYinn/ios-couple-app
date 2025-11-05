import { ChatMessage, GalleryItem, Flashback, Milestone, PartnerProfile, ProfileFavorite, TodoCategory, TodoItem } from "../types/app";

const demoFavorites: ProfileFavorite[] = [
  { label: "Favorite Food", value: "Sushi" },
  { label: "Coffee Order", value: "Iced Latte" },
  { label: "Dream Vacation", value: "Kyoto, Japan" },
  { label: "Favorite Movie", value: "Inception" },
];

export const demoPartnerProfile: PartnerProfile = {
  uid: "demo-partner",
  displayName: "Bailey",
  status: "Excited!",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDDV1kiYGC9nvKJQ7KLQpCHbYNfFd8VQ9xvrC5x4-LWJcz7ocLri2XkcVk-AScOoYNH9fLxbLxPbf-SFed8RG5Kstb-LuKhKUXDPUj2aC6YWRyI70hl1f_C-LCqzAFmCbi6J2Qp1W_fIBfCs_pz__bBzkJCMzY1wf3h5cr29-XiwKwbt62KSiez5sPhcEG15baLo6yJjMbNiMMGg2s0fwfKFysievQa9dzsH35pLoBYrtgAZfsxLGnh8W9t9cUCsAFTyp7ixMDYdrzB",
  about:
    "Big-hearted creative fueled by playlists, surprise dates, and dreamy kitchen dance breaks.",
  accentColor: "#A2D2FF",
  birthday: "1995-04-12",
  loveLanguages: ["touch", "time", "gifts"],
  favorites: demoFavorites,
};

export const demoMilestones: Milestone[] = [
  {
    id: "engaged",
    title: "Engaged!",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC8v4Z7pK37UDa40xn1hclBvHKlSp2-IkmBAhKkx-RHbAnksGw1QCssIxatYLtX5uiYm6jVP7gjUhuNULD37wmzt41F-bw54-eqldAH6dTGqPWDE_RW-DOgkkhusbIYUPl-6w6vMsA-02PpK_c3YvZxXOT6qn7aricwQMDxUD-j69zamcsNNLKt7AxgejP88ploxaDBQsrAJSjQzI2eGTauZtwdoUau7u0c7kxsMIGZPfiAV7zeD2ysjc68DUWmvUEx4CY490OZaFIm",
    description:
      "Your magical engagement day — keep track of sweet details, photos, and the proposal story.",
  },
  {
    id: "trip",
    title: "First Trip",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA2S0k3LDoicuTpm9YRaCJiyrvQzNtjGpCIqbzRRXc7Ro21sbF7RE1YK_n7qQ2eS0PTF8BuD1eOu7ruMutqzZoD8ygfKeAoDyiqP2Ee_rjv2tuB2TpzSGRtbg-uoyN848PRl7ly6CK-YOZ1Irc0qwgPuRwI8iGYDVOrTkvZRRtT8YdoDeV-DTrajIaPlufehmTUgAquf-DRVfM07PW8HWgEEqMWna5AQlpITUogL-vCi8mmZtBbKClV-LK4HKtRyH67z7ReoxYCN1KI",
    description:
      "A dreamy adventure that deserves its own highlight reel. Add pins, itinerary ideas, and keepsakes.",
  },
  {
    id: "house",
    title: "Our Home",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMCB7thhVAQZ_QDABKew5UdjNp6lDmX8k964cS5Dya3f0c1ehShKfWTafXVasis4RIZX4IfvIsgwCaPODSHu8BtjdYhRUz4PhP5H0QJN2HCNndDusRIxI8--zbvssDN2nygUqw7qQ3YkzL10xpmVt0WL042VjudfA394dfIzByN58rhCptryJV_eJkZiXxBV-II44X0p0r4BG9SxoV2POHHO--MBhhHggBXRMejp3ihJ8bRo55TVs7VK-MT3NwgBoSM-PwOBSPHIAr",
    description:
      "Snapshots of building a cozy home together — renovations, decor wins, and little daily joys.",
  },
  {
    id: "puppy",
    title: "New Friend",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDwZRVvj0tcDE6A-rVwI65lpIWx1HMlcPEEUckv-BFAZ6bbTmm_zW-uKdJVuHBz6B6d8vSK58LXIsUUTM7MoxntvCs91xl2FqXeAiWGt3q37FnaTWRWsn5pELUNzEvXqpBYjOOWUmGaHR_0v3nG9b1VDI7q-A10j80Bz6wjqlKWJJFI6ZHA8Cm14LbauiDgwDIHGtuLYlSItbC4Xea4euVW7WnykIemh33dYQ0lEy1NWKPK-BDueuRhHYsAzU2VoletnZrMM_uTwsER",
    description:
      "Celebrate the four-pawed addition with playful memories, vet notes, and adorable photo drops.",
  },
  {
    id: "anniversary",
    title: "1st Anniversary",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCkLrrDnVLTGBk0VjyJ9Zt2oH05dhti8IuzXDlY54X0q5a-8H1leCFNCOknNFdkz77olImwb7D91CAl0RdIfkB3MXjuajFBJRQwk3MZd3xQloK3QdG9dUvShkhcHH9cCm6Jc63HDEEvMugLCyg-p70S5IkQsme3peS7Trd6w7GUGlortAPmnx905f9bgrVSzbrqpEmrK92I-IYCi3Wb5p_SwMJB1DtGMM8vnllB58mnTCj9dJntWhgqlx0rnfPu4viWansbTopFK63M",
    description:
      "Relive year one with playlists, letters, highlight reels, and anniversary tradition ideas.",
  },
];

export const demoTodoCategories: TodoCategory[] = [
  {
    id: "romance",
    name: "Romantic Dates",
    icon: "favorite",
    color: "#FF8FAB",
    description: "Plan date nights, sweet surprises, and celebration ideas.",
  },
  {
    id: "foodie",
    name: "Foodie Adventures",
    icon: "restaurant",
    color: "#F6C28B",
    description: "Restaurants to try, recipes to cook, and tasting goals.",
  },
  {
    id: "wellness",
    name: "Wellness & Fun",
    icon: "self-improvement",
    color: "#A2D2FF",
    description: "Joint workouts, spa plans, and mindful rituals together.",
  },
];

export const demoTodoItems: TodoItem[] = [
  {
    id: "todo-1",
    categoryId: "foodie",
    title: "Try the new Italian restaurant downtown",
    completed: true,
    assigneeIds: ["me", "partner"],
    dueDate: "2024-02-20",
  },
  {
    id: "todo-2",
    categoryId: "romance",
    title: "Book flight tickets for Hawaii",
    completed: false,
    assigneeIds: ["me"],
    dueDate: "2024-03-05",
  },
  {
    id: "todo-3",
    categoryId: "wellness",
    title: "Couples yoga class on Sunday",
    completed: false,
    assigneeIds: ["partner"],
    dueDate: "2024-02-24",
  },
  {
    id: "todo-4",
    categoryId: "romance",
    title: "Plan a surprise movie night",
    completed: false,
    assigneeIds: ["me"],
  },
];

export const demoChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "partner",
    text: "Hey! Just thinking about you. How's your day going?",
    timestamp: "2024-02-14T09:20:00Z",
  },
  {
    id: "msg-2",
    sender: "me",
    text: "It's going great now! I was just about to message you.",
    timestamp: "2024-02-14T09:21:00Z",
    reaction: "❤️",
  },
  {
    id: "msg-3",
    sender: "partner",
    text: "Aww! You're the best. Are we still on for dinner tonight?",
    timestamp: "2024-02-14T09:22:00Z",
  },
  {
    id: "msg-4",
    sender: "me",
    text: "Absolutely! Can't wait. I'll book our usual spot.",
    timestamp: "2024-02-14T09:23:00Z",
  },
  {
    id: "msg-5",
    sender: "partner",
    text: "Perfect! See you at 7? 😍",
    timestamp: "2024-02-14T09:23:30Z",
    reaction: "👍",
  },
];

export const demoFlashbacks: Flashback[] = [
  {
    id: "flashback-1",
    title: "Beach Day",
    subtitle: "3 Years Ago Today",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ5D-HR1qz9KoeqHU7rFx5pTkKt3sKghnmEkLHfkqz6V0vHdu_glmbnSVxnXihHcQD9h1Agjbjct6KlZ9aN6Oy-wM5wTe88CXAUYTg_2dObJKFUEwFlNYkVeA9SJs43tvbLtTiNTclws7XfRrFSdiYTHgcNXMljDwuOKq8gpgw8lxIDlISwDGG_ASh5pq_LjyDqGVf9xmv8JDSdUYq5Px85A2m7sXW7gAtlO9w6ftcqraB8B8aQL8RVfGRRSdPvUmJAiFBFFDHdF6p",
    year: 2021,
  },
  {
    id: "flashback-2",
    title: "Morning Coffee",
    subtitle: "2 Years Ago Today",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC6ZlmOEP5o7c-FxeODW91YnyHCBlXGkAzO3Ly9TjXimw-b7OftC5RBAtPUnOIzDDTB30JK7FInfklY56bDUWMb3k_LTXwZSNhiTMd8nVJfucLg6Kqve8hbBX-gZSQ_4x0Rk-drHJess36uWLID28NYbqmAvOQC_KO7TbUTwZX-a_bWMJw9yKmJlYbGbhCeb_9hGftGvclCImEV4xaTqTU_yhCw-eU1i8nVumcy6CqfF45GCt55lGYhaAIXIx9glpKQQw3qn0uImlsK",
    year: 2022,
  },
  {
    id: "flashback-3",
    title: "Mountain Hike",
    subtitle: "1 Year Ago Today",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDBAeHKbHzoLyoHmnaQmeblLzOiTrws84ZS37BIMSKCl4KJ_f1C4jAInH1aofbTRG1_3oDIjf7qEGttzunqxyoNp2ga-_I5ctyf_fOAGJgQJ3Z6Q5wq5UE58QWuIN2SHJUV4yvE889B2rEPcb8gElQHiYOenQu-NyeFioTQtcvIYxA-5I4h0iRg5IuAwJuVB5W8QcoSoc26zifVKJmL63qj1PAjMCvS-uA-gsAiFAwu3Wd5BFCDrVVGbB5cnY0U6Gmxmy9R4J38r2lZ",
    year: 2023,
  },
];

export const demoGalleryItems: GalleryItem[] = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUF4NW9tYEB2CAgr7H1z2lXgyW7R5KMwfsZzixYYGWYZfl-4ON1f-4ePOog70Pt9jstNy6QTsb1uAuIuuwmmFGtfoXzGOrNb3ENwNWn8pxO3kBb0vhZJug57eeU6oW1o8ddhfBEw4ED26G2BLg182Nrt6ncOrJk9f--tANdn8oZtgbBCSeQL4Cm49YuZ3Zu50nSa1FaGrXEv77gGeqVVRV1UwVuD7_70Jxufsi1vNE-sKRU8UNXuIMOUwbneRpPm7qCgqY7j4eJrpe",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBh287dRte_N4irHVq095ODC4hsMkZ3TvHlN8-w2WAI-tO5NRJoaY1ku1dWRuWvFi8n8zcGZcg_Uy2QkJQy8m86wl9ns6LFMnM6bDu5QtZqKDW5SgB5n4Jyu7FHNVlY9qc-Sj_V0VSzZ-8vKzm5fbAXsgpxtAlFHAkvzGlgvayFxAx59xzqBCnSAJLhrFVx_YflSyUIDLgwxMeV7GBNKbpJDHqBYAadYK9l7j88qJRjt_kCqnwIpoEnA-Ac_zt20oLyNoQsBEDXNFGa",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWALf_7TDys6nbPuVqP36x3gfR94VsUfnnJiOF1VhqYBfvlCnEDW7lb11RgxbWYVFJdJaS99Njzy3OxLgAeXuJ0QZZvCCkbmsdbZHMajEHujpLxM9BZGeKMOaAwW-XiqAJ_qlaJKZDlIQs1rrYGks8XvtlraB_XTuqurIZBzCIBIWLuI9XSaxrIygjSkvXaVFidYQI4LOGABYAzW48mIZwFl41ZM9xnQ3vvjq_E7JOSuxMS7VKHowExa30bnncVktaDioG9wH4msNU",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDsu_x0V8Po0K-1XZDquzyaC31hZYIoLmr7_6LJK9TNQoO6Dkp5tXS7UasNxLoYnXz1WyqGgkv1U7OORDssng3I8qMxrLUX1g5sIM6eneseaZKMOxnBXKpHvmSiGSmQLbvFwsaSJhBNN6DeGyFASPebSIGXuCZnDK0AhMf8JmRIU-FDNBYRhC8cPfkl4rdpZFubFyvB3KaZuAOk2_A_LB0KU3-K1GKhaJmAhnp4VQfniIeZPTeVA5jBazKlfLxb9tQQYfEO4dRl-sJk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDletI-b-FDphUWoq_ynYjookMnky6yf49OTPYnAETAICq0klTeA1VRBirW5wZ_ncyCrH2yuk_jQZECMbGeB0kx0iCw3kZVVvjX8ZDzkyGsQZrNnt9hGu5AAHGxU8vdo__lg_Ej55jM_YkxgA_LZtysY4cmkeSlQxkklwcw5-CCtNvhpSxT9PyMoYjDUXYp-1476wnLY32AtC-BE66kywLePCsafwCG7yjDL09VEG4GdcOQE1fqtIjnQ83N5i7kJypnZBFIaejutXx9",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCwbpbZEZZVhzwD_q_Sz65R-fnwP-65gJQQeezgmezC7KyZtp6MsCcCKK2ReWKaqCyiAgtrzrLn7vph8lhzxZYQbXPuG3Bfft85W2lxpouj4uMgkhkbtA2KPIGrCFm8yA1xd_CHp3k5e8vaAtp4isnR2MjmLJGxXUybirkvQkCzW7NI0Fq-Ej9Oc29TEEjAffcHML2Bu1p1mSTe9NfmFybliooePow6skLwfn8RcCMZyQuhf9MTk84TGa4t63EaIx_zJOpYNMVMbqD2",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBo6PTdDwi6NXm009np1rKvZoPb0E7bbBEfRSBle0GpmqcFPmbCw16UIBAMwRFhLORjSkZ2KEQ8PS3vcRCG0Zo3mUU5iDVGMK4lIF7hNPdW_IyRfIkMg-dDF8ZQvyakQYqTR4EuuRJUPDatJC5YodZawXfz_Fv4D-40Pq32TpFB8-SD0ESFyAmhr0lFk893q-IGF0f8C_RqGV6i10g1z_OmzdEm0D30b2w6w-9V3lTQpn_NkkAXZDGD0odQwjfW0lVjqDjbG-u-l8KI",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ2VMMmwPQbBP2tB_mlJxXKHZKNRvr5Exjn4JV4En1bRtNuUC4F3xzlrIEiuqw3z-BJHvGQ6pwHX8pfWJOu0aSf9zUpbjxt9WcUdjaxn6NRLEieKkrCjJPOOx_8oc-SRWHx4kvcP0lRLV-7fO5WpGjDRoQlYd0CcFBMYTkf1NbblisEJ8TNuIb4qyrfEl3R1YCeEtIPF5PUAZM84hYlK5Lzpm_h0Xs3CGNdjYyDKEe910gd9rIfRsgw4CTkFX_bLbaTAs50xzYIx4_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBQl_25CRHw0sdmZQMG9Y_F14DKmhKHL0DfBNIDyFqbXtG5hUbWsgn4DsoiFQom3zI8QyEC_0td4PfiTZ8yQvglpbghbdu3a007NuOAc6f5K6A10jV6kJScqZ00Lk3O-_fJY0PiMMYws5YA4TUb4IwUzEL_iZuWpPNNn393qHyHS8oTzgSHcx38Lw_xvCBQQYpNjgcmQpprJv0B1mOpQUtRxMBZv6j6Ya5kP2TtbcUZbAqxGL60YAPznTHwr2I-4YNwGcb0B4zT7cuW",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrXXaRXX8sa-j_4fobMp-r_t4qYKvAlf4v28Xfv-NgAqnnCFIuL082PcBJ0vR0z0pdNp_5PYadtdtzfLMRnlmiWy4y6_gTwmmmidbH55hHeJhCF4xSV1S3tCTcAFJGgPXczk77xHpzajz3z2N2weoAFS7fpo3oqwRF03aEUi3iw-L_0BLYNFpkJ2jcY-Cm2jyYf7vhKiG51u-rHBWJXEeJsBq3uE1Rz2uTr3TTCHr0uJXGB6YFZzoRo8K-BjboHAzsqE-rHJEjjCYQ",
].map((url, index) => ({
  id: `gallery-${index + 1}`,
  image: url,
  type: index % 5 === 0 ? "video" : "photo",
  favorite: index % 2 === 0,
}));
