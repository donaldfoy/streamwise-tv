import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

const PROVIDER_SCHEMES: Record<number, string> = {
  8:    "nflx://",
  9:    "aiv://",
  15:   "hulu://",
  337:  "disneyplus://",
  384:  "hbomax://",
  1899: "max://",
  386:  "peacocktv://",
  531:  "paramountplus://",
  2:    "videos://",
  350:  "appletvplus://",
  283:  "crunchyroll://",
  43:   "starz://",
  257:  "fubo://",
};

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  variant = "secondary",
  onPress,
  hasTVPreferredFocus,
  active,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  variant?: "primary" | "secondary";
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  active?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const isPrimary = variant === "primary";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onPress}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.actionBtn,
          isPrimary ? styles.actionBtnPrimary : styles.actionBtnSecondary,
          active && styles.actionBtnActive,
          focused && styles.actionBtnFocused,
        ]}
      >
        <Feather
          name={icon}
          size={22}
          color={isPrimary ? "#fff" : Colors.text}
        />
        <Text style={[styles.actionBtnLabel, isPrimary && styles.actionBtnLabelPrimary]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Provider Chip ─────────────────────────────────────────────────────────────

function ProviderChip({ provider }: { provider: StreamingProvider }) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const shortName = provider.provider_name
    .replace(" Standard with Ads", "")
    .replace(" Amazon Channel", "")
    .replace(" Apple TV Channel", "")
    .trim();

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const handlePress = useCallback(async () => {
    const scheme = PROVIDER_SCHEMES[provider.provider_id];
    if (scheme) {
      try {
        await Linking.openURL(scheme);
        return;
      } catch {}
    }
    Alert.alert(
      provider.provider_name,
      `Open the ${provider.provider_name} app on your Apple TV to watch this title.`,
      [{ text: "Got it" }]
    );
  }, [provider.provider_id, provider.provider_name]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={handlePress}
        style={[styles.providerChip, focused && styles.providerChipFocused]}
      >
        <Image
          source={{ uri: providerLogoUrl(provider.logo_path) }}
          style={styles.providerLogo}
          contentFit="cover"
        />
        <Text style={styles.providerName} numberOfLines={1}>
          {shortName}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, value, color }: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.statPill}>
      <Feather name={icon} size={15} color={color ?? Colors.textSecondary} />
      <Text style={[styles.statPillText, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Detail Screen ────────────────────────────────────────────────────────────

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { width, height } = useWindowDimensions();

  const item = getItem(id ?? "");
  const inList = item ? isInWatchlist(item.id) : false;

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={56} color={Colors.textSecondary} />
        <Text style={styles.notFoundTitle}>Content Not Found</Text>
        <Text style={styles.notFoundBody}>Press Menu to go back.</Text>
      </View>
    );
  }

  const genres = genreNames(item.genre_ids ?? [], 3);
  const flatrate = item.streaming?.providers?.flatrate ?? [];
  const rent = item.streaming?.providers?.rent ?? [];
  const buy = item.streaming?.providers?.buy ?? [];

  const flatrateUnique = flatrate.filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  );
  const rentUnique = rent.filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  );
  const buyUnique = buy.filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  );

  const allProviders = [...flatrateUnique, ...rentUnique, ...buyUnique];

  const streamLabel = [
    flatrate.length && "Stream",
    rent.length && "Rent",
    buy.length && "Buy",
  ]
    .filter(Boolean)
    .join(" · ");

  const popularityDisplay =
    item.popularity > 1000
      ? `${(item.popularity / 1000).toFixed(1)}k`
      : item.popularity.toFixed(0);

  return (
    <View style={styles.root}>
      {/* Full-bleed backdrop */}
      <Image
        source={{ uri: backdropUrl(item.backdrop_path, "original") }}
        style={[StyleSheet.absoluteFill, { width, height }]}
        contentFit="cover"
        transition={600}
      />

      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(10,10,15,0.98)", "rgba(10,10,15,0.85)", "rgba(10,10,15,0.3)", "transparent"]}
        style={styles.gradientLeft}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0.7)", "rgba(10,10,15,0.2)", "transparent"]}
        style={styles.gradientTop}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={["transparent", "rgba(10,10,15,0.9)"]}
        style={styles.gradientBottom}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Content panel — left side */}
      <View style={styles.contentPanel}>

        {/* Top: poster + info row */}
        <View style={styles.topRow}>
          {/* Poster */}
          <Image
            source={{ uri: posterUrl(item.poster_path, "w500") }}
            style={styles.poster}
            contentFit="cover"
            borderRadius={10}
            transition={400}
          />

          {/* Info column */}
          <View style={styles.infoCol}>
            {/* Badge row */}
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {item.media_type === "tv" ? "TV SERIES" : "FILM"}
                </Text>
              </View>
              {flatrate.length > 0 && (
                <View style={styles.streamBadge}>
                  <View style={styles.streamDot} />
                  <Text style={styles.streamBadgeText}>Available to Stream</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatPill icon="star" value={formatVoteAverage(item.vote_average)} color={Colors.accent} />
              <View style={styles.statDivider} />
              <StatPill icon="calendar" value={releaseYear(item.release_date)} />
              <View style={styles.statDivider} />
              <StatPill icon="trending-up" value={popularityDisplay} color={Colors.tint} />
              {streamLabel ? (
                <>
                  <View style={styles.statDivider} />
                  <StatPill icon="play-circle" value={streamLabel} color={Colors.accentGreen} />
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

            {/* Overview */}
            <Text style={styles.overview} numberOfLines={4}>
              {item.overview}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <TVFocusGuideWrapper style={styles.actionsRow}>
          <ActionButton
            icon="play"
            label="Play Now"
            variant="primary"
            hasTVPreferredFocus
            onPress={() =>
              Alert.alert("Starting Playback", `Now playing: ${item.title}`, [{ text: "OK" }])
            }
          />
          <ActionButton
            icon={inList ? "bookmark" : "bookmark"}
            label={inList ? "Remove from List" : "+ My List"}
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

        {/* Where to Watch */}
        {allProviders.length > 0 && (
          <View style={styles.whereToWatch}>
            <Text style={styles.whereToWatchLabel}>WHERE TO WATCH</Text>

            {flatrateUnique.length > 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="play-circle" size={12} color={Colors.accentGreen} />
                  {"  "}Included with subscription
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {flatrateUnique.slice(0, 5).map((p) => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}

            {rentUnique.length > 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="dollar-sign" size={12} color={Colors.accent} />
                  {"  "}Rent
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {rentUnique.slice(0, 5).map((p) => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}

            {buyUnique.length > 0 && flatrateUnique.length === 0 && rentUnique.length === 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="shopping-bag" size={12} color={Colors.textSecondary} />
                  {"  "}Buy
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {buyUnique.slice(0, 5).map((p) => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: Colors.text,
  },
  notFoundBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.textSecondary,
  },

  // Gradients
  gradientLeft: {
    ...StyleSheet.absoluteFillObject,
    right: "30%",
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  // Content panel
  contentPanel: {
    flex: 1,
    paddingHorizontal: 64,
    paddingTop: 52,
    paddingBottom: 48,
    justifyContent: "center",
    gap: 28,
    maxWidth: "65%",
  },

  // Top row: poster + info
  topRow: {
    flexDirection: "row",
    gap: 36,
    alignItems: "flex-start",
  },
  poster: {
    width: 180,
    height: 268,
    flexShrink: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
  },
  infoCol: {
    flex: 1,
    gap: 14,
    paddingTop: 8,
  },

  // Badges
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  typeBadge: {
    backgroundColor: Colors.tint,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    color: "#fff",
  },
  streamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentGreen + "20",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.accentGreen + "50",
  },
  streamDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.accentGreen,
  },
  streamBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.accentGreen,
  },

  // Title
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 46,
    lineHeight: 54,
    letterSpacing: -1,
    color: Colors.text,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
  },

  // Genres
  genreRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  genreTag: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  genreText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // Overview
  overview: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: Colors.textSecondary,
  },

  // Action buttons
  actionsRow: {
    flexDirection: "row",
    gap: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "transparent",
    minWidth: 160,
    justifyContent: "center",
  },
  actionBtnPrimary: {
    backgroundColor: Colors.tint,
  },
  actionBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
  },
  actionBtnActive: {
    backgroundColor: Colors.tint + "30",
    borderColor: Colors.tint + "60",
  },
  actionBtnFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  actionBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text,
  },
  actionBtnLabelPrimary: {
    color: "#fff",
  },

  // Where to watch
  whereToWatch: {
    gap: 14,
  },
  whereToWatchLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textSecondary,
  },
  providerSection: {
    gap: 10,
  },
  providerSectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  providerRow: {
    flexDirection: "row",
    gap: 10,
  },
  providerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  providerChipFocused: {
    borderColor: Colors.focusRing,
    backgroundColor: "rgba(99,102,241,0.2)",
    shadowColor: Colors.focusRing,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  providerLogo: {
    width: 32,
    height: 32,
    borderRadius: 7,
  },
  providerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    maxWidth: 130,
  },
});
