export type Palette = {
  background: string;
  backgroundMuted: string;
  card: string;
  cardAlt: string;
  text: string;
  textSecondary: string;
  primary: string;
  primarySoft: string;
  secondary: string;
  accent: string;
  border: string;
  success: string;
  warning: string;
};

export const lightPalette: Palette = {
  background: "#FFF5F8",
  backgroundMuted: "#FFE8F0",
  card: "#FFFFFF",
  cardAlt: "#FFD8E2",
  text: "#3F3045",
  textSecondary: "#766375",
  primary: "#FF8FAB",
  primarySoft: "#FFE1EC",
  secondary: "#A2D2FF",
  accent: "#F9C6D8",
  border: "#F3D9E3",
  success: "#91F2C5",
  warning: "#F6C28B",
};

export const darkPalette: Palette = {
  background: "#2A1A20",
  backgroundMuted: "#3B2129",
  card: "#3F2630",
  cardAlt: "#583040",
  text: "#FDE8EF",
  textSecondary: "#E1BAC7",
  primary: "#FF9DB9",
  primarySoft: "#7B3548",
  secondary: "#78B3F9",
  accent: "#F38FB0",
  border: "#6F4050",
  success: "#64D5A0",
  warning: "#FAB36F",
};
