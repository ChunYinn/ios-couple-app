export type LoveLanguageKey =
  | "words"
  | "acts"
  | "gifts"
  | "time"
  | "touch"
  | "support"
  | "adventures"
  | "kindness";

export type LoveLanguageOption = {
  key: LoveLanguageKey;
  label: string;
  description: string;
  emoji: string;
};

export const LOVE_LANGUAGES: LoveLanguageOption[] = [
  {
    key: "words",
    label: "Words of Affirmation",
    description: "Encouraging texts, handwritten notes, and thoughtful compliments.",
    emoji: "💬",
  },
  {
    key: "acts",
    label: "Acts of Service",
    description: "Helpful gestures that lighten the load—laundry, dishes, errands.",
    emoji: "🤝",
  },
  {
    key: "gifts",
    label: "Gift Giving",
    description: "Surprises and little tokens that show you were thinking of them.",
    emoji: "🎁",
  },
  {
    key: "time",
    label: "Quality Time",
    description: "Unplugging together for date nights, cozy chats, or shared hobbies.",
    emoji: "🕒",
  },
  {
    key: "touch",
    label: "Physical Touch",
    description: "Warm hugs, cuddles, hand-holding—affection you can feel.",
    emoji: "🤗",
  },
  {
    key: "support",
    label: "Emotional Support",
    description: "Being an attentive listener and holding space for each other.",
    emoji: "🫶",
  },
  {
    key: "adventures",
    label: "Shared Adventures",
    description: "Trying new things together and making memories in fresh places.",
    emoji: "🗺️",
  },
  {
    key: "kindness",
    label: "Words of Kindness",
    description: "Gentle check-ins, love notes, and daily encouragement.",
    emoji: "🌸",
  },
];

export const DEFAULT_LOVE_LANGUAGES: LoveLanguageKey[] = ["words"];
export const MAX_LOVE_LANGUAGES = 3;
export const LOVE_LANGUAGE_KEYS = new Set<LoveLanguageKey>(
  LOVE_LANGUAGES.map((option) => option.key)
);

export const normalizeLoveLanguages = (
  values?: ReadonlyArray<string | LoveLanguageKey> | null,
  fallback: LoveLanguageKey[] = DEFAULT_LOVE_LANGUAGES
): LoveLanguageKey[] => {
  if (!values || values.length === 0) {
    return [...fallback];
  }
  const normalized = values.filter((value): value is LoveLanguageKey =>
    LOVE_LANGUAGE_KEYS.has(value as LoveLanguageKey)
  );
  return normalized.length ? normalized : [...fallback];
};
