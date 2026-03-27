import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
  Keyboard,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { fetchSearch, posterUrl, releaseYear, formatVoteAverage } from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { storeItem } from "@/constants/contentStore";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import type { ContentItem } from "@/constants/types";

const NUM_COLUMNS = 5;

function SearchCard({
  item,
  onPress,
  hasTVPreferredFocus,
}: {
  item: ContentItem;
  onPress: (item: ContentItem) => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, tension: 160, friction: 12 }),
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

  return (
    <Animated.View
      style={[styles.cardOuter, { transform: [{ scale }] }]}
    >
      <Animated.View
        style={[
          styles.cardGlow,
          { opacity: glowOpacity },
        ]}
      />
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={() => onPress(item)}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[styles.card, isFocused && styles.cardFocused]}
      >
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: posterUrl(item.poster_path) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <LinearGradient
            colors={["transparent", "rgba(10,10,15,0.95)"]}
            style={styles.cardGradient}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
          />
          {isFocused && <View style={styles.focusTint} />}
          <View style={styles.ratingPill}>
            <Feather name="star" size={9} color={Colors.accent} />
            <Text style={styles.ratingText}>{formatVoteAverage(item.vote_average)}</Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          {genres.length > 0 && (
            <Text style={styles.cardGenre} numberOfLines={1}>
              {genres.join(" · ")}
            </Text>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardYear}>{releaseYear(item.release_date)}</Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: item.media_type === "tv" ? Colors.tint + "30" : Colors.surfaceElevated }
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

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text), 400);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => fetchSearch(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });

  useEffect(() => {
    if (data) data.forEach((item) => storeItem(item));
  }, [data]);

  const handleCardPress = useCallback((item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id), type: item.media_type } });
  }, []);

  const results = data ?? [];
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <TVFocusGuideWrapper style={[styles.root, { paddingTop: topPad }]}>
      {/* Search bar */}
      <View style={styles.searchHeader}>
        <Text style={styles.screenTitle}>Search</Text>
        <View style={styles.searchBarRow}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={isFetching ? Colors.tint : Colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Movies, shows, genres..."
              placeholderTextColor={Colors.textSecondary}
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              selectionColor={Colors.tint}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => { setQuery(""); setDebouncedQuery(""); }}
                style={styles.clearBtn}
              >
                <Feather name="x-circle" size={18} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
          {hasQuery && !isFetching && (
            <Text style={styles.resultCount}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>

      {/* Results / states */}
      {!hasQuery ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Feather name="search" size={44} color={Colors.tint} />
          </View>
          <Text style={styles.emptyTitle}>Search StreamWise</Text>
          <Text style={styles.emptyBody}>
            Find movies, TV shows, and more from the StreamWise catalog
          </Text>
        </View>
      ) : isFetching && results.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.tint} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Feather name="film" size={44} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyBody}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <TVFocusGuideWrapper style={{ flex: 1 }}>
          <FlatList
            key={`grid-${NUM_COLUMNS}`}
            data={results}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            numColumns={NUM_COLUMNS}
            renderItem={({ item, index }) => (
              <SearchCard
                item={item}
                onPress={handleCardPress}
                hasTVPreferredFocus={index === 0}
              />
            )}
            contentContainerStyle={[
              styles.grid,
              { paddingBottom: bottomPad + 80 },
            ]}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
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
  searchHeader: {
    paddingHorizontal: 52,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  screenTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 30,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.text,
  },
  clearBtn: {
    padding: 2,
  },
  resultCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
    flexShrink: 0,
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
    borderColor: Colors.border,
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
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  grid: {
    paddingHorizontal: 52,
    paddingTop: 4,
    gap: 16,
  },
  row: {
    gap: 14,
    marginBottom: 14,
    flex: 1,
  },
  cardOuter: {
    flex: 1,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    inset: -10,
    borderRadius: 18,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
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
  posterContainer: {
    aspectRatio: 2 / 3,
    width: "100%",
    position: "relative",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  focusTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(99,102,241,0.08)",
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
  cardInfo: {
    padding: 10,
    gap: 4,
  },
  cardGenre: {
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
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  cardYear: {
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
