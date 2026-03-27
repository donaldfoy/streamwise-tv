import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
  findNodeHandle,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { fetchTrending, fetchMovies, fetchTV } from "@/constants/api";
import { storeItems } from "@/constants/contentStore";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  getSuggestedForYou,
  getBecauseYouWatched,
  getStreamingForYou,
  getJustAdded,
  getNewReleases,
  getPopularMovies,
  getTopRatedTV,
  getHiddenGems,
} from "@/constants/rails";
import type { ContentItem } from "@/constants/types";
import type { CardSize } from "@/components/TVCard";

type RowDef = {
  key: string;
  title: string;
  items: ContentItem[];
  cardSize: CardSize;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();
  const { subscribedProviderIds } = useSubscriptions();

  const trending = useQuery({ queryKey: ["trending"], queryFn: fetchTrending });
  const movies = useQuery({ queryKey: ["movies"], queryFn: fetchMovies });
  const tvShows = useQuery({ queryKey: ["tv"], queryFn: fetchTV });

  useEffect(() => { if (trending.data) storeItems(trending.data); }, [trending.data]);
  useEffect(() => { if (movies.data) storeItems(movies.data); }, [movies.data]);
  useEffect(() => { if (tvShows.data) storeItems(tvShows.data); }, [tvShows.data]);

  const handleCardPress = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id), type: item.media_type } });
  };

  const isLoading = trending.isLoading && movies.isLoading && tvShows.isLoading;
  const isError = trending.isError && movies.isError && tvShows.isError;

  const allContent = useMemo(() => {
    const combined = [
      ...(trending.data ?? []),
      ...(movies.data ?? []),
      ...(tvShows.data ?? []),
    ];
    const seen = new Set<number>();
    return combined.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }, [trending.data, movies.data, tvShows.data]);

  const suggestedForYou = useMemo(() => getSuggestedForYou(allContent, watchlist), [allContent, watchlist]);
  const becauseYouWatched = useMemo(() => getBecauseYouWatched(allContent, watchlist), [allContent, watchlist]);
  const streamingForYou = useMemo(() => getStreamingForYou(allContent, subscribedProviderIds), [allContent, subscribedProviderIds]);
  const justAdded = useMemo(() => getJustAdded(allContent), [allContent]);
  const newReleases = useMemo(() => getNewReleases(allContent), [allContent]);
  const popularMovies = useMemo(() => getPopularMovies(allContent), [allContent]);
  const topRatedTV = useMemo(() => getTopRatedTV(allContent), [allContent]);
  const hiddenGems = useMemo(() => getHiddenGems(allContent), [allContent]);

  const trendingData = trending.data ?? [];
  const moviesData = movies.data ?? [];
  const tvData = tvShows.data ?? [];

  /**
   * Flat ordered list of visible rows. Computed at render time so row
   * indices are always correct regardless of which rails have data.
   */
  const rows = useMemo((): RowDef[] => {
    const r: RowDef[] = [];
    if (trendingData.length > 0)    r.push({ key: "trending",   title: "Trending Now",       items: trendingData,              cardSize: "lg" });
    if (suggestedForYou.length > 0) r.push({ key: "suggested",  title: "Suggested for You",  items: suggestedForYou,           cardSize: "md" });
    if (becauseYouWatched)          r.push({ key: "because",    title: becauseYouWatched.label, items: becauseYouWatched.results, cardSize: "md" });
    if (streamingForYou.length > 0) r.push({ key: "streaming",  title: "Streaming for You",  items: streamingForYou,           cardSize: "md" });
    if (justAdded.length > 0)       r.push({ key: "justadded",  title: "Just Added",          items: justAdded,                 cardSize: "md" });
    if (newReleases.length > 0)     r.push({ key: "newrel",     title: "New Releases",        items: newReleases,               cardSize: "md" });
    if (moviesData.length > 0)      r.push({ key: "movies",     title: "Movies",              items: moviesData,                cardSize: "md" });
    if (tvData.length > 0)          r.push({ key: "tv",         title: "TV Shows",            items: tvData,                    cardSize: "md" });
    if (popularMovies.length > 0)   r.push({ key: "popular",    title: "Popular Movies",      items: popularMovies,             cardSize: "md" });
    if (topRatedTV.length > 0)      r.push({ key: "toprated",   title: "Top Rated TV",        items: topRatedTV,                cardSize: "md" });
    if (hiddenGems.length > 0)      r.push({ key: "hiddengems", title: "Hidden Gems",         items: hiddenGems,                cardSize: "sm" });
    return r;
  }, [trendingData, suggestedForYou, becauseYouWatched, streamingForYou, justAdded, newReleases, moviesData, tvData, popularMovies, topRatedTV, hiddenGems]);

  /**
   * Map from row key → node handle of that row's last card.
   * Populated after each row mounts (ContentRow calls onLastCardMount).
   * Used to set nextFocusUp on tail cards in the row immediately below.
   */
  const [rowLastHandles, setRowLastHandles] = useState<Map<string, number>>(new Map());

  const handleLastCardMount = useCallback(
    (rowKey: string) => (ref: React.RefObject<View>) => {
      // requestAnimationFrame ensures the native view is fully committed
      requestAnimationFrame(() => {
        const handle = findNodeHandle(ref.current);
        if (handle != null) {
          setRowLastHandles((prev) => {
            const next = new Map(prev);
            next.set(rowKey, handle);
            return next;
          });
        }
      });
    },
    []
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.tint} />
        <Text style={styles.loadingText}>Loading StreamWise...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Feather name="wifi-off" size={52} color={Colors.surfaceElevated} />
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorBody}>Unable to reach StreamWise servers.</Text>
      </View>
    );
  }

  const featured = trendingData[0];
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <TVFocusGuideWrapper style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {featured && (
          <HeroBanner
            item={featured}
            onPlay={handleCardPress}
            onMoreInfo={handleCardPress}
            onAddToList={toggleWatchlist}
            isInWatchlist={isInWatchlist(featured.id)}
          />
        )}

        <View style={styles.rows}>
          {rows.map((row, rowIndex) => {
            const rowAbove = rowIndex > 0 ? rows[rowIndex - 1] : null;
            return (
              <ContentRow
                key={row.key}
                title={row.title}
                items={row.items}
                cardSize={row.cardSize}
                onCardPress={handleCardPress}
                onLastCardMount={handleLastCardMount(row.key)}
                nextFocusUpHandle={rowAbove ? rowLastHandles.get(rowAbove.key) : undefined}
                rowAboveCardCount={rowAbove?.items.length}
              />
            );
          })}
        </View>
      </ScrollView>
    </TVFocusGuideWrapper>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  rows: {
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: Colors.text,
  },
  errorBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
