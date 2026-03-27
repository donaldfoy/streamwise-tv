import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { backdropUrl, releaseYear, formatVoteAverage } from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { TVFocusGuideWrapper } from "./TVFocusGuideViewWrapper";
import type { ContentItem } from "@/constants/types";

type HeroBannerProps = {
  item: ContentItem;
  onPlay?: (item: ContentItem) => void;
  onMoreInfo?: (item: ContentItem) => void;
  onAddToList?: (item: ContentItem) => void;
  isInWatchlist?: boolean;
};

function HeroButton({
  icon,
  label,
  variant,
  onPress,
  hasTVPreferredFocus,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  variant: "primary" | "secondary" | "ghost";
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(scale, { toValue: 1.07, useNativeDriver: true, tension: 180, friction: 14 }).start();
  }, [scale]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180, friction: 14 }).start();
  }, [scale]);

  const bg =
    variant === "primary"
      ? Colors.tint
      : variant === "secondary"
      ? "rgba(255,255,255,0.12)"
      : "transparent";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={onPress}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.heroBtn,
          { backgroundColor: bg },
          isFocused && styles.heroBtnFocused,
          variant === "ghost" && isFocused && { backgroundColor: "rgba(99,102,241,0.15)" },
        ]}
      >
        <Feather
          name={icon}
          size={22}
          color={variant === "primary" ? "#fff" : Colors.textSecondary}
        />
        <Text
          style={[
            styles.heroBtnLabel,
            variant !== "primary" && { color: Colors.textSecondary },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HeroBanner({
  item,
  onPlay,
  onMoreInfo,
  onAddToList,
  isInWatchlist,
}: HeroBannerProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const genres = genreNames(item.genre_ids ?? [], 3);
  const provider = item.streaming?.providers?.flatrate?.[0];

  return (
    <TVFocusGuideWrapper style={[styles.container, { paddingTop: topPad }]}>
      {/* Full-bleed backdrop */}
      <Image
        source={{ uri: backdropUrl(item.backdrop_path) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={700}
      />

      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(10,10,15,0)", "rgba(10,10,15,0.45)", "rgba(10,10,15,0.88)", Colors.background]}
        style={styles.fadeBottom}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={[Colors.background, "rgba(10,10,15,0.7)", "transparent"]}
        style={styles.fadeSide}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Origin badge */}
        <View style={styles.originRow}>
          <View style={[styles.dot, { backgroundColor: Colors.tint }]} />
          <Text style={styles.originLabel}>
            {item.media_type === "tv" ? "SERIES" : "FILM"}
            {provider ? `  ·  ${provider.provider_name.replace(" Standard with Ads", "").replace(" Amazon Channel", "")}` : "  ·  FEATURED"}
          </Text>
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Feather name="star" size={13} color={Colors.accent} />
            <Text style={styles.ratingValue}>{formatVoteAverage(item.vote_average)}</Text>
          </View>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.metaText}>{releaseYear(item.release_date)}</Text>
          {genres.length > 0 && (
            <>
              <Text style={styles.metaDivider}>·</Text>
              <Text style={styles.metaText}>{genres.join(", ")}</Text>
            </>
          )}
        </View>

        <Text style={styles.overview} numberOfLines={3}>{item.overview}</Text>

        {/* CTA buttons */}
        <TVFocusGuideWrapper style={styles.actions}>
          <HeroButton
            icon="play"
            label="Play"
            variant="primary"
            onPress={() => onPlay?.(item)}
            hasTVPreferredFocus={true}
          />
          <HeroButton
            icon="info"
            label="More Info"
            variant="secondary"
            onPress={() => onMoreInfo?.(item)}
          />
          <HeroButton
            icon="bookmark"
            label={isInWatchlist ? "In My List" : "Add to List"}
            variant="ghost"
            onPress={() => onAddToList?.(item)}
          />
        </TVFocusGuideWrapper>
      </View>
    </TVFocusGuideWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 540,
    width: "100%",
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "78%",
  },
  fadeSide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "50%",
  },
  content: {
    position: "absolute",
    bottom: 48,
    left: 52,
    maxWidth: 620,
    gap: 16,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  originLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.8,
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.5,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.accent,
  },
  metaDivider: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  overview: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 25,
    color: Colors.textSecondary,
    maxWidth: 560,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  heroBtnFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  heroBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
});
