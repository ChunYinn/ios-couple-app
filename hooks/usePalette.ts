import { useColorScheme } from "react-native";
import { useMemo } from "react";

import { darkPalette, lightPalette } from "../theme/palette";
import { useAppData } from "../context/AppDataContext";
import { lightenHex, mixHexColors, getRelativeLuminance } from "../utils/color";

const derivePrimarySoft = (accent: string, scheme: "light" | "dark", fallback: string) => {
  const luminance = getRelativeLuminance(accent);
  if (scheme === "light") {
    if (luminance > 0.75) {
      return mixHexColors(accent, "#000000", 0.18);
    }
    if (luminance < 0.35) {
      return lightenHex(accent, 0.4);
    }
    return lightenHex(accent, 0.25);
  }
  return mixHexColors(accent, fallback, 0.45);
};

export const usePalette = () => {
  const scheme = useColorScheme() ?? "light";
  const {
    state: { settings },
  } = useAppData();

  const basePalette = scheme === "dark" ? darkPalette : lightPalette;
  const accent = settings.accent || basePalette.primary;

  return useMemo(() => {
    const primarySoft = derivePrimarySoft(
      accent,
      scheme === "dark" ? "dark" : "light",
      basePalette.primarySoft
    );

    return {
      ...basePalette,
      primary: accent,
      primarySoft,
      accent,
    };
  }, [accent, basePalette, scheme]);
};
