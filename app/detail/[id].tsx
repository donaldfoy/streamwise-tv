import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  posterUrl,
  backdropUrl,
  releaseYear,
  formatVoteAverage,
  providerLogoUrl,
} from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { getItem } from "@/constants/contentStore";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import type { ContentItem, StreamingProvider } from "@/constants/types";

function ActionButton({
  icon,
  label,
  variant = "primary",
  onPress,
  hasTVPreferredFocus,
  active,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  variant?: "primary" | "secondary" | "destructive";
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  active?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(scale, { toValue: 1.07, useNativeDriver: true, tension: 180 }).start();
  }, [scale]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 180 }).start();
  }, [scale]);

  const bgColor =
    variant === "primary"
      ? Colors.tint
      : variant === "destructive"
      ? Colors.accentRed
      : active
      ? Colors.tint + "33"
      : Colors.surface;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={onPress}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.actionBtn,
          { backgroundColor: bgColor },
          isFocused && styles.actionBtnFocused,
        ]}
      >
        <Feather name={icon} size={20} color={Colors.text} />
        <Text style={styles.actionBtnLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ProviderChip({ provider }: { provider: StreamingProvider }) {
  const shortName = provider.provider_name
    .replace(" Standard with Ads", "")
    .replace(" Amazon Channel", "")
    .replace(" Apple TV+", "Apple TV+");

  return (
    <View style={styles.providerChip}>
      <Image
        source={{ uri: providerLogoUrl(provider.logo_path) }}
        style={styles.providerLogo}
        contentFit="cover"
      />
      <Text style={styles.providerName} numberOfLines={1}>
        {shortName}
      </Text>
    </View>
  );
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const item = getItem(id ?? "");
  const inList = item ? isInWatchlist(item.id) : false;

  if (!item) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: topPad }]}>
        <View style={styles.errorIcon}>
          <Feather name="alert-circle" size={48} color={Colors.textSecondary} />
        </View>
        <Text style={styles.errorTitle}>Content Not Found</Text>
        <Text style={styles.errorBody}>Navigate back and try again.</Text>
        <ActionButton
          icon="arrow-left"
          label="Go Back"
          variant="secondary"
          onPress={() => router.back()}
          hasTVPreferredFocus
        />
      </View>
    );
  }

  const genres = genreNames(item.genre_ids ?? [], 4);
  const flatrate = item.streaming?.providers?.flatrate ?? [];
  const rent = item.streaming?.providers?.rent ?? [];
  const buy = item.streaming?.providers?.buy ?? [];

  const allProviders = [...flatrate, ...rent, ...buy].filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  );

  const streamLabel = [
    flatrate.length && "Stream",
    rent.length && "Rent",
    buy.length && "Buy",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero backdrop */}
        <View style={styles.hero}>
          <Image
            source={{ uri: backdropUrl(item.backdrop_path, "original") }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={500}
          />
          <LinearGradient
            colors={["rgba(10,10,15,0.3)", "rgba(10,10,15,0.6)", Colors.background]}
            style={styles.heroFadeBottom}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <LinearGradient
            colors={[Colors.background, "transparent"]}
            style={styles.heroFadeSide}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          {/* Back button */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Main layout: poster + info side by side */}
          <View style={styles.mainRow}>
            {/* Poster */}
            <View style={styles.posterWrapper}>
              <Image
                source={{ uri: posterUrl(item.poster_path, "w500") }}
                style={styles.posterImage}
                contentFit="cover"
                borderRadius={14}
                transition={400}
              />
              {/* Streaming availability indicator */}
              {flatrate.length > 0 && (
                <View style={styles.availableBadge}>
                  <View style={[styles.availableDot, { backgroundColor: Colors.accentGreen }]} />
                  <Text style={styles.availableText}>Available to Stream</Text>
                </View>
              )}
            </View>

            {/* Info column */}
            <View style={styles.infoCol}>
              {/* Type badge */}
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {item.media_type === "tv" ? "TV SERIES" : "FILM"}
                </Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>

              {/* Meta */}
              <View style={styles.metaRow}>
                <View style={styles.scoreBadge}>
                  <Feather name="star" size={14} color={Colors.accent} />
                  <Text style={styles.scoreText}>{formatVoteAverage(item.vote_average)}</Text>
                </View>
                <View style={styles.divider} />
                <Text style={styles.metaText}>{releaseYear(item.release_date)}</Text>
                {streamLabel ? (
                  <>
                    <View style={styles.divider} />
                    <Text style={[styles.metaText, { color: Colors.accentGreen }]}>
                      {streamLabel}
                    </Text>
                  </>
                ) : null}
              </View>

              {/* Genres */}
              {genres.length > 0 && (
                <View style={styles.genreRow}>
                  {genres.map((g) => (
                    <View key={g} style={styles.genreTag}>
                      <Text style={styles.genreText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.overview}>{item.overview}</Text>

              {/* Action buttons */}
              <TVFocusGuideWrapper style={styles.actions}>
                <ActionButton
                  icon="play"
                  label="Play Now"
                  variant="primary"
                  onPress={() => {}}
                  hasTVPreferredFocus
                />
                <ActionButton
                  icon={inList ? "bookmark" : "bookmark"}
                  label={inList ? "Remove from List" : "Add to List"}
                  variant="secondary"
                  active={inList}
                  onPress={() => toggleWatchlist(item)}
                />
                <ActionButton
                  icon="share-2"
                  label="Share"
                  variant="secondary"
                  onPress={() => {}}
                />
              </TVFocusGuideWrapper>
            </View>
          </View>

          {/* Where to Watch */}
          {allProviders.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>WHERE TO WATCH</Text>
                <View style={styles.sectionLine} />
              </View>

              <View style={styles.providerGroups}>
                {flatrate.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerGroupLabel}>
                      <Feather name="play-circle" size={11} color={Colors.accentGreen} />
                      {"  "}Included with Subscription
                    </Text>
                    <View style={styles.providerList}>
                      {flatrate
                        .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
                        .slice(0, 4)
                        .map((p) => (
                          <ProviderChip key={p.provider_id} provider={p} />
                        ))}
                    </View>
                  </View>
                )}

                {rent.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerGroupLabel}>
                      <Feather name="dollar-sign" size={11} color={Colors.accent} />
                      {"  "}Available to Rent
                    </Text>
                    <View style={styles.providerList}>
                      {rent
                        .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
                        .slice(0, 4)
                        .map((p) => (
                          <ProviderChip key={p.provider_id} provider={p} />
                        ))}
                    </View>
                  </View>
                )}

                {buy.length > 0 && (
                  <View style={styles.providerGroup}>
                    <Text style={styles.providerGroupLabel}>
                      <Feather name="shopping-bag" size={11} color={Colors.textSecondary} />
                      {"  "}Buy to Own
                    </Text>
                    <View style={styles.providerList}>
                      {buy
                        .filter((p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i)
                        .slice(0, 4)
                        .map((p) => (
                          <ProviderChip key={p.provider_id} provider={p} />
                        ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Popularity & Stats */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>DETAILS</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Feather name="star" size={20} color={Colors.accent} />
                <Text style={styles.statValue}>{formatVoteAverage(item.vote_average)}</Text>
                <Text style={styles.statLabel}>User Score</Text>
              </View>
              <View style={styles.statCard}>
                <Feather name="trending-up" size={20} color={Colors.tint} />
                <Text style={styles.statValue}>
                  {item.popularity > 1000
                    ? `${(item.popularity / 1000).toFixed(1)}k`
                    : item.popularity.toFixed(0)}
                </Text>
                <Text style={styles.statLabel}>Popularity</Text>
              </View>
              <View style={styles.statCard}>
                <Feather name="calendar" size={20} color={Colors.textSecondary} />
                <Text style={styles.statValue}>{releaseYear(item.release_date)}</Text>
                <Text style={styles.statLabel}>Release Year</Text>
              </View>
              <View style={styles.statCard}>
                <Feather
                  name={item.media_type === "tv" ? "tv" : "film"}
                  size={20}
                  color={Colors.textSecondary}
                />
                <Text style={styles.statValue}>
                  {item.media_type === "tv" ? "Series" : "Film"}
                </Text>
                <Text style={styles.statLabel}>Format</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 48,
  },
  errorIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    color: Colors.text,
  },
  errorBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  scroll: { flex: 1 },
  hero: {
    height: 420,
    width: "100%",
    position: "relative",
  },
  heroFadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85%",
  },
  heroFadeSide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "38%",
  },
  backBtn: {
    position: "absolute",
    top: 20,
    left: 52,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(20,20,32,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  body: {
    paddingHorizontal: 52,
    marginTop: -140,
    gap: 48,
  },
  mainRow: {
    flexDirection: "row",
    gap: 44,
    alignItems: "flex-start",
  },
  posterWrapper: {
    flexShrink: 0,
    gap: 12,
  },
  posterImage: {
    width: 240,
    height: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 20,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accentGreen + "40",
  },
  availableDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availableText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.accentGreen,
  },
  infoCol: {
    flex: 1,
    gap: 16,
    paddingTop: 96,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.tint,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.text,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    lineHeight: 50,
    letterSpacing: -0.8,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.accent,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  metaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  genreRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  genreTag: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.tint + "30",
  },
  genreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  overview: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textSecondary,
    maxWidth: 680,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  actionBtnFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  actionBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.text,
  },
  section: {
    gap: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  providerGroups: {
    gap: 20,
  },
  providerGroup: {
    gap: 12,
  },
  providerGroupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  providerList: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  providerLogo: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  providerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    maxWidth: 140,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 14,
    flexWrap: "wrap",
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 6,
    alignItems: "center",
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
