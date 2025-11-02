import { useColorScheme } from "react-native";

import { darkPalette, lightPalette } from "../theme/palette";

export const usePalette = () => {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkPalette : lightPalette;
};
