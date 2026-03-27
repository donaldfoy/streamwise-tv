import React, { useEffect, useMemo, useCallback, useRef, useState } from "react";
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

/**
 * Per-row: arrays of nextFocusUp and nextFocusDown node handles.
 * Index in the array == card index in the row.
 * undefined means "let tvOS decide" (first/last rows naturally have
 * no adjacent row in one direction).
 */
type RowHandles = {
  up: (number | undefined)[];
  down: (number | undefined)[];
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { watchlist, toggleWatchlist, isInWatchlist } = useWatchlist();
  const { subscribedProviderIds } = useSubscriptions();

  const trending = useQuery({ queryKey: ["trending"], queryFn: fetchTrending });
  const movies   = useQuery({ queryKey: ["movies"],   queryFn: fetchMovies   });
  const tvShows  = useQuery({ queryKey: ["tv"],        queryFn: fetchTV       });

  useEffect(() => { if (trending.data) storeItems(trending.data); }, [trending.data]);
  useEffect(() => { if (movies.data)   storeItems(movies.data);   }, [movies.data]);
  useEffect(() => { if (tvShows.data)  storeItems(tvShows.data);  }, [tvShows.data]);

  const handleCardPress = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id), type: item.media_type } });
  };

  const isLoading = trending.isLoading && movies.isLoading && tvShows.isLoading;
  const isError   = trending.isError   && movies.isError   && tvShows.isError;

  const allContent = useMemo(() => {
    const combined = [
      ...(trending.data ?? []),
      ...(movies.data   ?? []),
      ...(tvShows.data  ?? []),
    ];
    const seen = new Set<number>();
    return combined.filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }, [trending.data, movies.data, tvShows.data]);

  const suggestedForYou   = useMemo(() => getSuggestedForYou(allContent, watchlist),             [allContent, watchlist]);
  const becauseYouWatched = useMemo(() => getBecauseYouWatched(allContent, watchlist),           [allContent, watchlist]);
  const streamingForYou   = useMemo(() => getStreamingForYou(allContent, subscribedProviderIds), [allContent, subscribedProviderIds]);
  const justAdded         = useMemo(() => getJustAdded(allContent),                              [allContent]);
  const newReleases       = useMemo(() => getNewReleases(allContent),                            [allContent]);
  const popularMovies     = useMemo(() => getPopularMovies(allContent),                          [allContent]);
  const topRatedTV        = useMemo(() => getTopRatedTV(allContent),                             [allContent]);
  const hiddenGems        = useMemo(() => getHiddenGems(allContent),                             [allContent]);

  const trendingData = trending.data ?? [];
  const moviesData   = movies.data   ?? [];
  const tvData       = tvShows.data  ?? [];

  // Ordered, stable list of visible rails once data is loaded.
  const rows = useMemo((): RowDef[] => {
    const r: RowDef[] = [];
    if (trendingData.length > 0)    r.push({ key: "trending",   title: "Trending Now",         items: trendingData,              cardSize: "lg" });
    if (suggestedForYou.length > 0) r.push({ key: "suggested",  title: "Suggested for You",    items: suggestedForYou,           cardSize: "md" });
    if (becauseYouWatched)          r.push({ key: "because",    title: becauseYouWatched.label, items: becauseYouWatched.results, cardSize: "md" });
    if (streamingForYou.length > 0) r.push({ key: "streaming",  title: "Streaming for You",    items: streamingForYou,           cardSize: "md" });
    if (justAdded.length > 0)       r.push({ key: "justadded",  title: "Just Added",            items: justAdded,                 cardSize: "md" });
    if (newReleases.length > 0)     r.push({ key: "newrel",     title: "New Releases",          items: newReleases,               cardSize: "md" });
    if (moviesData.length > 0)      r.push({ key: "movies",     title: "Movies",                items: moviesData,                cardSize: "md" });
    if (tvData.length > 0)          r.push({ key: "tv",         title: "TV Shows",              items: tvData,                    cardSize: "md" });
    if (popularMovies.length > 0)   r.push({ key: "popular",    title: "Popular Movies",        items: popularMovies,             cardSize: "md" });
    if (topRatedTV.length > 0)      r.push({ key: "toprated",   title: "Top Rated TV",          items: topRatedTV,                cardSize: "md" });
    if (hiddenGems.length > 0)      r.push({ key: "hiddengems", title: "Hidden Gems",           items: hiddenGems,                cardSize: "sm" });
    return r;
  }, [trendingData, suggestedForYou, becauseYouWatched, streamingForYou, justAdded, newReleases, moviesData, tvData, popularMovies, topRatedTV, hiddenGems]);

  /**
   * rowCardRefs[rowIndex] = stable array of refs, one per card.
   * Populated by ContentRow.onRefsReady after each row mounts.
   * Keys are row indices matching the `rows` array.
   */
  const rowCardRefs = useRef<Map<number, React.RefObject<View>[]>>(new Map());

  /**
   * Number of rows that have called onRefsReady.
   * When this reaches rows.length we compute all nextFocusUp/Down handles.
   */
  const [mountedRowCount, setMountedRowCount] = useState(0);

  /**
   * Computed nextFocusUp / nextFocusDown node-handle arrays, keyed by
   * row index. Undefined entries = no override (let tvOS decide).
   * Set after all rows mount; triggers one extra render to wire handles.
   */
  const [rowHandles, setRowHandles] = useState<Map<number, RowHandles>>(new Map());

  // Reset when the rows list changes (e.g. more data arrived).
  const prevRowsRef = useRef<RowDef[]>([]);
  if (prevRowsRef.current !== rows) {
    prevRowsRef.current = rows;
    rowCardRefs.current.clear();
    // Reset counters synchronously during render so the next effect
    // re-triggers correctly.  Using a layout-safe pattern: we do NOT
    // call setState here (would double-render); instead we rely on the
    // useEffect below which re-runs whenever rows changes.
  }

  // Re-arm when rows changes.
  useEffect(() => {
    setMountedRowCount(0);
    setRowHandles(new Map());
  }, [rows]);

  /**
   * Once every row in the current `rows` list has mounted and given us
   * its refs, compute the full nextFocusUp / nextFocusDown handle table.
   *
   * Navigation rule (hard-coded, no heuristics):
   *   Up   → adjacent row above only (rowIndex - 1)
   *   Down → adjacent row below only (rowIndex + 1)
   *   target item = min(current item index, adjacent row card count - 1)
   */
  useEffect(() => {
    if (rows.length === 0 || mountedRowCount < rows.length) return;

    const handles = new Map<number, RowHandles>();

    rows.forEach((row, ri) => {
      const refs = rowCardRefs.current.get(ri);
      if (!refs) return;

      const up: (number | undefined)[]   = [];
      const down: (number | undefined)[] = [];

      refs.forEach((ref, ci) => {
        // --- nextFocusUp: row above, clamped ---
        if (ri > 0) {
          const aboveRefs = rowCardRefs.current.get(ri - 1);
          if (aboveRefs && aboveRefs.length > 0) {
            const targetCi = Math.min(ci, aboveRefs.length - 1);
            const handle = findNodeHandle(aboveRefs[targetCi].current);
            up[ci] = handle ?? undefined;
          } else {
            up[ci] = undefined;
          }
        } else {
          up[ci] = undefined; // first row — let Up go to HeroBanner naturally
        }

        // --- nextFocusDown: row below, clamped ---
        if (ri < rows.length - 1) {
          const belowRefs = rowCardRefs.current.get(ri + 1);
          if (belowRefs && belowRefs.length > 0) {
            const targetCi = Math.min(ci, belowRefs.length - 1);
            const handle = findNodeHandle(belowRefs[targetCi].current);
            down[ci] = handle ?? undefined;
          } else {
            down[ci] = undefined;
          }
        } else {
          down[ci] = undefined; // last row — no row below
        }
      });

      handles.set(ri, { up, down });
    });

    setRowHandles(handles);
  }, [mountedRowCount, rows]);

  const handleRefsReady = useCallback(
    (rowIndex: number) => (refs: React.RefObject<View>[]) => {
      rowCardRefs.current.set(rowIndex, refs);
      setMountedRowCount((c) => c + 1);
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
            const handles = rowHandles.get(rowIndex);
            return (
              <ContentRow
                key={row.key}
                title={row.title}
                items={row.items}
                cardSize={row.cardSize}
                onCardPress={handleCardPress}
                onRefsReady={handleRefsReady(rowIndex)}
                cardUpHandles={handles?.up}
                cardDownHandles={handles?.down}
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
