import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { posterUrl, releaseYear, formatVoteAverage } from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import type { ContentItem } from "@/constants/types";

// ─── Remove Button ────────────────────────────────────────────────────────────

function RemoveButton({ onPress }: { onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onPress}
        style={[styles.removeBtn, focused && styles.removeBtnFocused]}
      >
        <Feather name="trash-2" size={20} color={focused ? "#fff" : Colors.accentRed} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Watchlist Row Item ───────────────────────────────────────────────────────

function WatchlistItem({
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
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.02, useNativeDriver: true, tension: 200 }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, bgOpacity]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [scale, bgOpacity]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      "Remove from Watchlist",
      `Remove "${item.title}" from your list?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onRemove(item.id) },
      ]
    );
  }, [item.id, item.title, onRemove]);

  const genres = genreNames(item.genre_ids ?? [], 3);
  const flatrateCount = item.streaming?.providers?.flatrate?.length ?? 0;
  const isStreaming = flatrateCount > 0;

  return (
    <TVFocusGuideWrapper style={styles.rowWrapper}>
      <Animated.View
        style={[
          styles.rowContainer,
          { transform: [{ scale }] },
        ]}
      >
        {/* Focused background highlight */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.rowHighlight, { opacity: bgOpacity }]}
        />

        <Pressable
          onFocus={onFocus}
          onBlur={onBlur}
          onPress={() => onPress(item)}
          hasTVPreferredFocus={hasTVPreferredFocus}
          style={[styles.rowPressable, focused && styles.rowPressableFocused]}
        >
          {/* Poster */}
          <View style={styles.posterWrap}>
            <Image
              source={{ uri: posterUrl(item.poster_path, "w300") }}
              style={styles.poster}
              contentFit="cover"
              borderRadius={8}
              transition={300}
            />
            {isStreaming && (
              <View style={styles.streamingDot} />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            {/* Type + Rating row */}
            <View style={styles.metaRow}>
              <View style={[
                styles.typeBadge,
                item.media_type === "tv"
                  ? { backgroundColor: Colors.tint + "22" }
                  : { backgroundColor: Colors.surfaceElevated },
              ]}>
                <Text style={[
                  styles.typeText,
                  { color: item.media_type === "tv" ? Colors.tint : Colors.textSecondary },
                ]}>
                  {item.media_type === "tv" ? "TV SERIES" : "FILM"}
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <Feather name="star" size={13} color={Colors.accent} />
                <Text style={styles.ratingText}>{formatVoteAverage(item.vote_average)}</Text>
              </View>
              <Text style={styles.yearText}>{releaseYear(item.release_date)}</Text>
              {isStreaming && (
                <View style={styles.streamingBadge}>
                  <View style={styles.streamingBadgeDot} />
                  <Text style={styles.streamingBadgeText}>Streaming</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

            {/* Genres */}
            {genres.length > 0 && (
              <Text style={styles.genreText} numberOfLines={1}>
                {genres.join("  ·  ")}
              </Text>
            )}

            {/* Overview */}
            {item.overview ? (
              <Text style={styles.overview} numberOfLines={2}>{item.overview}</Text>
            ) : null}
          </View>

          {/* Chevron */}
          <Feather
            name="chevron-right"
            size={22}
            color={focused ? Colors.text : Colors.textSecondary}
          />
        </Pressable>

        {/* Remove button — separate D-pad target */}
        <RemoveButton onPress={handleRemove} />
      </Animated.View>
    </TVFocusGuideWrapper>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCountBadge}>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function sortByDateDesc(a?: string, b?: string): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(b).getTime() - new Date(a).getTime();
}

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handlePress = useCallback((item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  }, []);

  const tvShows = watchlist
    .filter((i) => i.media_type === "tv")
    .sort((a, b) => sortByDateDesc(a.release_date, b.release_date));

  const movies = watchlist
    .filter((i) => i.media_type === "movie")
    .sort((a, b) => sortByDateDesc(a.release_date, b.release_date));

  const sections = [
    ...(tvShows.length > 0 ? [{ title: "TV Shows", data: tvShows }] : []),
    ...(movies.length > 0  ? [{ title: "Movies",   data: movies  }] : []),
  ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Watchlist</Text>
          {watchlist.length > 0 && (
            <Text style={styles.headerCount}>
              {watchlist.length} title{watchlist.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        <View style={styles.headerIcon}>
          <Feather name="bookmark" size={22} color={Colors.tint} />
        </View>
      </View>

      {/* Empty state */}
      {watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Feather name="bookmark" size={52} color={Colors.tint} />
          </View>
          <Text style={styles.emptyTitle}>Your Watchlist is Empty</Text>
          <Text style={styles.emptyBody}>
            Browse Home or Search and press Add to List on any title
          </Text>
        </View>
      ) : (
        <TVFocusGuideWrapper style={{ flex: 1 }}>
          <SectionList
            sections={sections}
            keyExtractor={(item) => `wl-${item.id}`}
            renderSectionHeader={({ section }) => (
              <SectionHeader title={section.title} count={section.data.length} />
            )}
            renderItem={({ item, index, section }) => (
              <WatchlistItem
                item={item}
                onPress={handlePress}
                onRemove={removeFromWatchlist}
                hasTVPreferredFocus={index === 0 && section.title === sections[0]?.title}
              />
            )}
            contentContainerStyle={{ paddingBottom: bottomPad + 80, paddingHorizontal: 64 }}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </TVFocusGuideWrapper>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingHorizontal: 64,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    letterSpacing: -1,
    color: Colors.text,
  },
  headerCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.tint + "40",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingBottom: 80,
  },
  emptyIconRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.tint + "30",
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: Colors.text,
  },
  emptyBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 500,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    flexShrink: 0,
  },
  sectionCountBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionCount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },

  // Row
  rowWrapper: {
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  rowHighlight: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
  },
  rowPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowPressableFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },

  // Poster
  posterWrap: {
    position: "relative",
    flexShrink: 0,
  },
  poster: {
    width: 90,
    height: 135,
  },
  streamingDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Colors.accentGreen,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Info column
  info: {
    flex: 1,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  typeBadge: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.accent,
  },
  yearText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  streamingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  streamingBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentGreen,
  },
  streamingBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.accentGreen,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    color: Colors.text,
  },
  genreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.tint,
    letterSpacing: 0.2,
  },
  overview: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },

  // Remove button
  removeBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 4,
    flexShrink: 0,
  },
  removeBtnFocused: {
    backgroundColor: Colors.accentRed,
    borderColor: Colors.accentRed,
    shadowColor: Colors.accentRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  separator: {
    height: 8,
  },
});
