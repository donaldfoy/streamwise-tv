import React, { useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
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
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  };

  const isLoading = trending.isLoading && movies.isLoading && tvShows.isLoading;
  const isError = trending.isError && movies.isError && tvShows.isError;

  // Combine and dedupe all content for rail filtering
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

  // Compute all personalised rails
  const suggestedForYou = useMemo(
    () => getSuggestedForYou(allContent, watchlist),
    [allContent, watchlist]
  );

  const becauseYouWatched = useMemo(
    () => getBecauseYouWatched(allContent, watchlist),
    [allContent, watchlist]
  );

  const streamingForYou = useMemo(
    () => getStreamingForYou(allContent, subscribedProviderIds),
    [allContent, subscribedProviderIds]
  );

  const justAdded = useMemo(() => getJustAdded(allContent), [allContent]);
  const newReleases = useMemo(() => getNewReleases(allContent), [allContent]);
  const popularMovies = useMemo(() => getPopularMovies(allContent), [allContent]);
  const topRatedTV = useMemo(() => getTopRatedTV(allContent), [allContent]);
  const hiddenGems = useMemo(() => getHiddenGems(allContent), [allContent]);

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

  const trendingData = trending.data ?? [];
  const moviesData = movies.data ?? [];
  const tvData = tvShows.data ?? [];
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
          {/* 1. Trending Now */}
          {trendingData.length > 0 && (
            <ContentRow
              title="Trending Now"
              items={trendingData}
              cardSize="lg"
              onCardPress={handleCardPress}
            />
          )}

          {/* 2. Suggested for You — watchlist-driven */}
          {suggestedForYou.length > 0 && (
            <ContentRow
              title="Suggested for You"
              items={suggestedForYou}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 3. Because You Watched X */}
          {becauseYouWatched && (
            <ContentRow
              title={becauseYouWatched.label}
              items={becauseYouWatched.results}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 4. Streaming for You — provider-filtered */}
          {streamingForYou.length > 0 && (
            <ContentRow
              title="Streaming for You"
              items={streamingForYou}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 5. Just Added */}
          {justAdded.length > 0 && (
            <ContentRow
              title="Just Added"
              items={justAdded}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 6. New Releases */}
          {newReleases.length > 0 && (
            <ContentRow
              title="New Releases"
              items={newReleases}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 7. Movies rail */}
          {moviesData.length > 0 && (
            <ContentRow
              title="Movies"
              items={moviesData}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 8. TV Shows rail */}
          {tvData.length > 0 && (
            <ContentRow
              title="TV Shows"
              items={tvData}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 9. Popular Movies */}
          {popularMovies.length > 0 && (
            <ContentRow
              title="Popular Movies"
              items={popularMovies}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 10. Top Rated TV */}
          {topRatedTV.length > 0 && (
            <ContentRow
              title="Top Rated TV"
              items={topRatedTV}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {/* 11. Hidden Gems */}
          {hiddenGems.length > 0 && (
            <ContentRow
              title="Hidden Gems"
              items={hiddenGems}
              cardSize="sm"
              onCardPress={handleCardPress}
            />
          )}
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
