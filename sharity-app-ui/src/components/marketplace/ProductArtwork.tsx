import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../../theme";
import { systemFontFamily } from "../../theme/typography";

type Item = {
  title: string;
  imageUrl?: string | null;
  categoryCode?: string;
  verticalCode?: string;
  demoSeed?: boolean;
};
export function ProductArtwork({
  item,
  style,
  compact = false,
}: {
  item: Item;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.imageUrl]);
  const category = (
    item.categoryCode ||
    item.verticalCode ||
    "Marketplace"
  ).replace(/_/g, " ");
  const jewellery = /jewel|gold|silver|earring|necklace/i.test(
    category + " " + item.title,
  );
  return (
    <View style={[styles.frame, style]}>
      {item.imageUrl && !failed ? (
        <Image
          accessibilityLabel={item.title}
          source={{ uri: item.imageUrl }}
          contentFit="contain"
          testID="listing-image"
          transition={180}
          style={styles.image}
          onError={() => setFailed(true)}
        />
      ) : (
        <View
          style={styles.artwork}
          accessibilityLabel={`${category} illustration`}
        >
          <View style={[styles.symbol, compact && { width: 44, height: 44, borderRadius: 10 }]}>
            <Ionicons
              name={
                jewellery
                  ? "diamond-outline"
                  : /course/i.test(category)
                    ? "school-outline"
                    : /grocery|meat/i.test(category)
                      ? "basket-outline"
                      : "gift-outline"
              }
              size={compact ? 28 : 44}
              color={colors.primary}
            />
          </View>
          {!compact && <Text numberOfLines={2} style={styles.category}>
            {category}
          </Text>}
          {!compact && <Text style={styles.caption}>
            Image unavailable
          </Text>}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: {
    width: "100%",
    aspectRatio: 1.35,
    minHeight: 0,
    backgroundColor: "#f7f8fa",
    overflow: "hidden",
  },
  image: { position: "absolute", top: 12, left: 12, right: 12, bottom: 12 },
  artwork: {
    flex: 1,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  symbol: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  category: {
    fontFamily: systemFontFamily,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    color: colors.primaryDark,
  },
  caption: {
    fontFamily: systemFontFamily,
    fontSize: 11,
    textAlign: "center",
    color: colors.textSecondary,
  },
});
