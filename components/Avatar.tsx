import { Image, ImageSourcePropType, StyleProp, View, ViewStyle } from "react-native";

import { usePalette } from "../hooks/usePalette";

type AvatarProps = {
  source: ImageSourcePropType;
  size?: number;
  borderColor?: string;
  badgeIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Avatar = ({
  source,
  size = 72,
  borderColor,
  badgeIcon,
  style,
}: AvatarProps) => {
  const colors = usePalette();

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderColor ? 4 : 0,
          borderColor: borderColor ?? colors.card,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Image
        source={source}
        resizeMode="cover"
        style={{
          width: size - 6,
          height: size - 6,
          borderRadius: (size - 6) / 2,
        }}
      />
      {badgeIcon ? (
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
          }}
        >
          {badgeIcon}
        </View>
      ) : null}
    </View>
  );
};
