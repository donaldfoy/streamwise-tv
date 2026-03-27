import React, { useState, useRef, useCallback } from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { posterUrl, releaseYear, formatVoteAverage } from "@/constants/api";
import { genreNames } from "@/constants/genres";
import type { ContentItem } from "@/constants/types";

export type CardSize = "sm" | "md" | "lg";

// Sized for the 10-foot TV interface — large enough to read from a couch
export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  sm: { width: 180, height: 270 },
  md: { width: 240, height: 360 },
  lg: { width: 300, height: 450 },
};

type TVCardProps = {
  item: ContentItem;
  size?: CardSize;
  onPress?: (item: ContentItem) => void;
  hasTVPreferredFocus?: boolean;
  cardRef?: React.RefObject<View>;
  style?: ViewStyle;
  nextFocusUp?: number;
};

export function TVCard({
  item,
  size = "md",
  onPress,
  hasTVPreferredFocus,
  cardRef,
  style,
  nextFocusUp,
}: TVCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const internalRef = useRef<View>(null);
  const resolvedRef = cardRef ?? internalRef;

  const { width, height } = CARD_DIMENSIONS[size];

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.12,
        useNativeDriver: true,
        tension: 140,
        friction: 12,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, glowOpacity]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 140,
        friction: 12,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, glowOpacity]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 300 }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.12 : 1,
      useNativeDriver: true,
      tension: 220,
    }).start();
  }, [scale, isFocused]);

  const genres = genreNames(item.genre_ids ?? [], 2);

  return (
    <Animated.View
      style={[{ width, height, transform: [{ scale }] }, style]}
    >
      {/* Purple glow on focus */}
      <Animated.View
        style={[
          styles.glow,
          { width: width + 24, height: height + 24, opacity: glowOpacity },
        ]}
      />
      <Pressable
        ref={resolvedRef as any}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(item)}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusUp={nextFocusUp}
        style={[
          styles.card,
          { width, height },
          isFocused && styles.cardFocused,
        ]}
        accessible
        accessibilityLabel={`${item.title}, ${item.media_type === "tv" ? "TV series" : "Movie"}, rated ${formatVoteAverage(item.vote_average)}`}
      >
        {/* Poster image */}
        <Image
          source={{ uri: posterUrl(item.poster_path) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />

        {/* Bottom gradient overlay */}
        <LinearGradient
          colors={["rgba(10,10,15,0)", "rgba(10,10,15,0.98)"]}
          style={styles.gradient}
          start={{ x: 0, y: 0.38 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Media type badge top-right */}
        <View style={styles.typePill}>
          {item.media_type === "tv" ? (
            <Feather name="tv" size={9} color={Colors.textSecondary} />
          ) : (
            <Feather name="film" size={9} color={Colors.textSecondary} />
          )}
          <Text style={styles.typePillText}>
            {item.media_type === "tv" ? "SERIES" : "FILM"}
          </Text>
        </View>

        {/* Focus overlay */}
        {isFocused && (
          <View style={styles.focusOverlay} />
        )}

        {/* Card info */}
        <View style={styles.info}>
          {genres.length > 0 && (
            <Text style={styles.genres} numberOfLines={1}>
              {genres.join("  ·  ")}
            </Text>
          )}
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.bottomRow}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={10} color={Colors.accent} />
              <Text style={styles.ratingText}>{formatVoteAverage(item.vote_average)}</Text>
            </View>
            <Text style={styles.year}>{releaseYear(item.release_date)}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    top: -12,
    left: -12,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.35)",
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardFocused: {
    borderWidth: 3,
    borderColor: Colors.focusRing,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(99,102,241,0.06)",
  },
  typePill: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,10,15,0.7)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  typePillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 8,
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 4,
  },
  genres: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.tint,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: Colors.accent,
  },
  year: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
