import { PronounValue } from "../types/app";

export type PronounOption = {
  id: string;
  label: string;
  description?: string;
  value: PronounValue;
};

export const PRONOUN_OPTIONS: readonly PronounOption[] = [
  { id: "she_her", label: "She / Her", value: "she/her" },
  { id: "he_him", label: "He / Him", value: "he/him" },
  { id: "they_them", label: "They / Them", value: "they/them" },
  { id: "she_they", label: "She / They", value: "she/they" },
  { id: "he_they", label: "He / They", value: "he/they" },
  { id: "xe_xem", label: "Xe / Xem", value: "xe/xem" },
  { id: "ze_zir", label: "Ze / Zir", value: "ze/zir" },
  { id: "fae_faer", label: "Fae / Faer", value: "fae/faer" },
  { id: "ask_me", label: "Ask me", value: "ask me" },
] as const;

export const isValidPronounValue = (value: unknown): value is PronounValue =>
  typeof value === "string" &&
  PRONOUN_OPTIONS.some((option) => option.value === value);
