const clamp = (value: number, min = 0, max = 255) =>
  Math.min(Math.max(value, min), max);

const toChannel = (hex: string, index: number) =>
  parseInt(hex.slice(index, index + 2), 16);

const toHex = (value: number) => clamp(Math.round(value))
  .toString(16)
  .padStart(2, "0");

const normalizeHex = (input: string): string => {
  if (!input) return "#000000";
  if (input.startsWith("#")) {
    const hex = input.slice(1);
    if (hex.length === 3) {
      return (
        "#" +
        hex
          .split("")
          .map((char) => char + char)
          .join("")
      ).toUpperCase();
    }
    if (hex.length === 6) {
      return `#${hex.toUpperCase()}`;
    }
  }
  return "#000000";
};

export const mixHexColors = (
  baseColor: string,
  mixColor: string,
  amount: number
): string => {
  const t = clamp(amount, 0, 1);
  const base = normalizeHex(baseColor).slice(1);
  const mix = normalizeHex(mixColor).slice(1);

  const r = toChannel(base, 0) * (1 - t) + toChannel(mix, 0) * t;
  const g = toChannel(base, 2) * (1 - t) + toChannel(mix, 2) * t;
  const b = toChannel(base, 4) * (1 - t) + toChannel(mix, 4) * t;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const lightenHex = (color: string, amount: number): string =>
  mixHexColors(color, "#FFFFFF", amount);

export const darkenHex = (color: string, amount: number): string =>
  mixHexColors(color, "#000000", amount);

const srgbToLinear = (value: number): number => {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
};

export const getRelativeLuminance = (color: string): number => {
  const normalized = normalizeHex(color).slice(1);
  const r = toChannel(normalized, 0);
  const g = toChannel(normalized, 2);
  const b = toChannel(normalized, 4);

  const rLin = srgbToLinear(r);
  const gLin = srgbToLinear(g);
  const bLin = srgbToLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};
