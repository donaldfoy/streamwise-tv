import React, { useEffect } from "react";
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
import type { ContentItem } from "@/constants/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
  });

  const movies = useQuery({
    queryKey: ["movies"],
    queryFn: fetchMovies,
  });

  const tvShows = useQuery({
    queryKey: ["tv"],
    queryFn: fetchTV,
  });

  useEffect(() => {
    if (trending.data) storeItems(trending.data);
  }, [trending.data]);

  useEffect(() => {
    if (movies.data) storeItems(movies.data);
  }, [movies.data]);

  useEffect(() => {
    if (tvShows.data) storeItems(tvShows.data);
  }, [tvShows.data]);

  const handleCardPress = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  };

  const isLoading = trending.isLoading && movies.isLoading && tvShows.isLoading;
  const isError = trending.isError && movies.isError && tvShows.isError;

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

  const popular = [...trendingData, ...moviesData, ...tvData]
    .filter((item, idx, arr) => arr.findIndex((i) => i.id === item.id) === idx)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 15);

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
          {trendingData.length > 0 && (
            <ContentRow
              title="Trending Now"
              items={trendingData}
              cardSize="lg"
              onCardPress={handleCardPress}
            />
          )}

          {moviesData.length > 0 && (
            <ContentRow
              title="Movies"
              items={moviesData}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {tvData.length > 0 && (
            <ContentRow
              title="TV Shows"
              items={tvData}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {popular.length > 0 && (
            <ContentRow
              title="Popular Right Now"
              items={popular}
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
