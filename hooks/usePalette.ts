import { useMemo } from "react";

import { lightPalette } from "../theme/palette";
import { useAppData } from "../context/AppDataContext";
import { lightenHex, mixHexColors, getRelativeLuminance } from "../utils/color";

const derivePrimarySoft = (accent: string, scheme: "light" | "dark", fallback: string) => {
  const luminance = getRelativeLuminance(accent);
  if (scheme === "light") {
    if (luminance > 0.7) {
      return mixHexColors(accent, "#000000", 0.2);
    }
    if (luminance < 0.35) {
      return lightenHex(accent, 0.35);
    }
    return lightenHex(accent, 0.2);
  }
  if (luminance > 0.7) {
    return mixHexColors(accent, fallback, 0.55);
  }
  return mixHexColors(accent, fallback, 0.4);
};

export const usePalette = () => {
  const scheme = "light";
  const {
    state: { settings },
  } = useAppData();

  const basePalette = lightPalette;
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
  }, [accent, basePalette]);
};
