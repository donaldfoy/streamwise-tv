import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { posterUrl, releaseYear, formatVoteAverage } from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import type { ContentItem } from "@/constants/types";

const NUM_COLS = 4;

function WatchlistCard({
  item,
  onPress,
  onRemove,
  hasTVPreferredFocus,
}: {
  item: ContentItem;
  onPress: (item: ContentItem) => void;
  onRemove: (id: number) => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, tension: 160, friction: 12 }),
      Animated.timing(glowOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, glowOpacity]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 160, friction: 12 }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, glowOpacity]);

  const genres = genreNames(item.genre_ids ?? [], 2);
  const streamCount = [
    ...(item.streaming?.providers?.flatrate ?? []),
    ...(item.streaming?.providers?.rent ?? []),
    ...(item.streaming?.providers?.buy ?? []),
  ].filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i).length;

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={() => onPress(item)}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[styles.card, isFocused && styles.cardFocused]}
      >
        <View style={styles.posterArea}>
          <Image
            source={{ uri: posterUrl(item.poster_path) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,10,15,0.96)"]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0.45 }}
            end={{ x: 0, y: 1 }}
          />
          {isFocused && <View style={styles.focusTint} />}

          {isFocused && (
            <Pressable
              style={styles.removeBtn}
              onPress={() => onRemove(item.id)}
            >
              <Feather name="x" size={13} color="#fff" />
            </Pressable>
          )}

          <View style={styles.ratingPill}>
            <Feather name="star" size={9} color={Colors.accent} />
            <Text style={styles.ratingText}>{formatVoteAverage(item.vote_average)}</Text>
          </View>

          {streamCount > 0 && (
            <View style={styles.streamBadge}>
              <View style={styles.streamDot} />
              <Text style={styles.streamText}>Streaming</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          {genres.length > 0 && (
            <Text style={styles.genres} numberOfLines={1}>{genres.join(" · ")}</Text>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.year}>{releaseYear(item.release_date)}</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: item.media_type === "tv" ? Colors.tint + "22" : Colors.surfaceElevated }
            ]}>
              <Text style={[
                styles.typeBadgeText,
                { color: item.media_type === "tv" ? Colors.tint : Colors.textSecondary }
              ]}>
                {item.media_type === "tv" ? "SERIES" : "FILM"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePress = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  };

  return (
    <TVFocusGuideWrapper style={[styles.root, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My List</Text>
          <Text style={styles.subtitle}>
            {watchlist.length} title{watchlist.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Feather name="bookmark" size={18} color={Colors.tint} />
        </View>
      </View>

      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Feather name="bookmark" size={48} color={Colors.tint} />
          </View>
          <Text style={styles.emptyTitle}>Your List is Empty</Text>
          <Text style={styles.emptyBody}>
            Browse Home or Search and add titles to your list
          </Text>
        </View>
      ) : (
        <TVFocusGuideWrapper style={{ flex: 1 }}>
          <FlatList
            key={`wl-${NUM_COLS}`}
            data={watchlist}
            keyExtractor={(item) => String(item.id)}
            numColumns={NUM_COLS}
            renderItem={({ item, index }) => (
              <WatchlistCard
                item={item}
                onPress={handlePress}
                onRemove={removeFromWatchlist}
                hasTVPreferredFocus={index === 0}
              />
            )}
            contentContainerStyle={[
              styles.grid,
              { paddingBottom: bottomPad + 80 },
            ]}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
          />
        </TVFocusGuideWrapper>
      )}
    </TVFocusGuideWrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 52,
    paddingTop: 14,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.tint + "40",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 80,
    paddingHorizontal: 48,
  },
  emptyIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.tint + "30",
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: Colors.text,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 420,
  },
  grid: {
    paddingHorizontal: 52,
    paddingTop: 4,
    gap: 16,
  },
  row: {
    gap: 16,
    marginBottom: 16,
    flex: 1,
  },
  cardOuter: {
    flex: 1,
    position: "relative",
    alignItems: "center",
  },
  cardGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 18,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 15,
  },
  card: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardFocused: {
    borderColor: Colors.focusRing,
    borderWidth: 3,
  },
  posterArea: {
    aspectRatio: 2 / 3,
    width: "100%",
    position: "relative",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  focusTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(99,102,241,0.07)",
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingPill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(10,10,15,0.82)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  ratingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.accent,
  },
  streamBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(10,10,15,0.82)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  streamDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accentGreen,
  },
  streamText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: Colors.accentGreen,
  },
  info: {
    padding: 10,
    gap: 4,
  },
  genres: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: Colors.tint,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  year: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  typeBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
