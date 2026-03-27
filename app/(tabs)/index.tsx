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
import { fetchTrending } from "@/constants/api";
import { storeItems } from "@/constants/contentStore";
import { HeroBanner } from "@/components/HeroBanner";
import { ContentRow } from "@/components/ContentRow";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { ContentItem } from "@/constants/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: fetchTrending,
  });

  useEffect(() => {
    if (data) storeItems(data);
  }, [data]);

  const handleCardPress = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  };

  const handleMoreInfo = (item: ContentItem) => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id) } });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.tint} />
        <Text style={styles.loadingText}>Loading StreamWise...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centered}>
        <Feather name="wifi-off" size={52} color={Colors.surfaceElevated} />
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorBody}>Unable to reach StreamWise servers.</Text>
      </View>
    );
  }

  const featured = data[0];
  const movies = data.filter((i) => i.media_type === "movie");
  const tvShows = data.filter((i) => i.media_type === "tv");
  const popular = [...data]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10);

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
            onPlay={handleMoreInfo}
            onMoreInfo={handleMoreInfo}
            onAddToList={toggleWatchlist}
            isInWatchlist={isInWatchlist(featured.id)}
          />
        )}

        <View style={styles.rows}>
          {movies.length > 0 && (
            <ContentRow
              title="Trending Movies"
              items={movies}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {tvShows.length > 0 && (
            <ContentRow
              title="Trending TV Shows"
              items={tvShows}
              cardSize="md"
              onCardPress={handleCardPress}
            />
          )}

          {popular.length > 0 && (
            <ContentRow
              title="Popular Right Now"
              items={popular}
              cardSize="lg"
              onCardPress={handleCardPress}
            />
          )}

          <ContentRow
            title="All Trending"
            items={data}
            cardSize="sm"
            onCardPress={handleCardPress}
          />
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
