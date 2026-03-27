import React, { useState, useRef, useCallback, useEffect } from "react";
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
  ActivityIndicator,
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
  fetchDetail,
} from "@/constants/api";
import { genreNames } from "@/constants/genres";
import { getItem } from "@/constants/contentStore";
import { useWatchlist } from "@/hooks/useWatchlist";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";
import type { ContentItem, StreamingProvider, DetailItem, CastMember, CrewMember, Video } from "@/constants/types";

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

// ─── Focusable Button ─────────────────────────────────────────────────────────

function FocusButton({
  icon,
  label,
  variant = "secondary",
  onPress,
  hasTVPreferredFocus,
  active,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  variant?: "primary" | "secondary";
  onPress?: () => void;
  hasTVPreferredFocus?: boolean;
  active?: boolean;
  color?: string;
}) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === "primary";

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.08, useNativeDriver: true, tension: 200 }).start();
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
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.actionBtn,
          isPrimary ? styles.actionBtnPrimary : styles.actionBtnSecondary,
          active && styles.actionBtnActive,
          focused && styles.actionBtnFocused,
          color && { borderColor: focused ? color : "transparent" },
        ]}
      >
        <Feather name={icon} size={22} color={isPrimary ? "#fff" : (color ?? Colors.text)} />
        <Text style={[styles.actionBtnLabel, isPrimary && styles.actionBtnLabelPrimary, color && !isPrimary && { color }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Provider Chip ────────────────────────────────────────────────────────────

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
      try { await Linking.openURL(scheme); return; } catch {}
    }
    Alert.alert(provider.provider_name, `Open the ${provider.provider_name} app on your Apple TV.`, [{ text: "Got it" }]);
  }, [provider.provider_id, provider.provider_name]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onFocus={onFocus} onBlur={onBlur} onPress={handlePress}
        style={[styles.providerChip, focused && styles.providerChipFocused]}>
        <Image source={{ uri: providerLogoUrl(provider.logo_path) }} style={styles.providerLogo} contentFit="cover" borderRadius={7} />
        <Text style={styles.providerName} numberOfLines={1}>{shortName}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Cast Card ────────────────────────────────────────────────────────────────

function CastCard({ member }: { member: CastMember }) {
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

  return (
    <Animated.View style={[styles.castCardOuter, { transform: [{ scale }] }]}>
      <Pressable onFocus={onFocus} onBlur={onBlur} style={[styles.castCard, focused && styles.castCardFocused]}>
        {member.profile_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w185${member.profile_path}` }}
            style={styles.castPhoto}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.castPhoto, styles.castPhotoPlaceholder]}>
            <Feather name="user" size={30} color={Colors.textSecondary} />
          </View>
        )}
        <View style={styles.castInfo}>
          <Text style={styles.castName} numberOfLines={2}>{member.name}</Text>
          <Text style={styles.castCharacter} numberOfLines={2}>{member.character}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Video Tile ───────────────────────────────────────────────────────────────

function VideoTile({ video, onPlay }: { video: Video; onPlay: (key: string, title: string) => void }) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const thumb = `https://img.youtube.com/vi/${video.key}/mqdefault.jpg`;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.06, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);
  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    onPlay(video.key, video.name);
  }, [video.key, video.name, onPlay]);

  return (
    <Animated.View style={[styles.videoTileOuter, { transform: [{ scale }] }]}>
      <Pressable onFocus={onFocus} onBlur={onBlur} onPress={handlePress}
        style={[styles.videoTile, focused && styles.videoTileFocused]}>
        <Image source={{ uri: thumb }} style={styles.videoThumb} contentFit="cover" borderRadius={10} />
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
        />
        <View style={styles.videoPlayBtn}>
          <Feather name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.videoMeta}>
          <View style={styles.videoTypeBadge}>
            <Text style={styles.videoTypeText}>{video.type}</Text>
          </View>
          <Text style={styles.videoName} numberOfLines={2}>{video.name}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Recommended Card ─────────────────────────────────────────────────────────

function RecommendedCard({ item }: { item: ContentItem }) {
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

  const handlePress = useCallback(() => {
    router.push({ pathname: "/detail/[id]", params: { id: String(item.id), type: (item as any).media_type ?? "movie" } });
  }, [item.id, (item as any).media_type]);

  return (
    <Animated.View style={[styles.recCardOuter, { transform: [{ scale }] }]}>
      <Animated.View style={[styles.recCardGlow, { opacity: focused ? 1 : 0 }]} />
      <Pressable onFocus={onFocus} onBlur={onBlur} onPress={handlePress}
        style={[styles.recCard, focused && styles.recCardFocused]}>
        <Image
          source={{ uri: posterUrl(item.poster_path, "w300") }}
          style={styles.recPoster}
          contentFit="cover"
        />
        <LinearGradient
          colors={["rgba(10,10,15,0)", "rgba(10,10,15,0.95)"]}
          style={styles.recGradient}
        />
        <View style={styles.recInfo}>
          <View style={styles.recRating}>
            <Feather name="star" size={12} color={Colors.accent} />
            <Text style={styles.recRatingText}>{formatVoteAverage(item.vote_average)}</Text>
          </View>
          <Text style={styles.recTitle} numberOfLines={2}>{item.title || (item as any).name}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionLabel({ label, icon }: { label: string; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View style={styles.sectionLabel}>
      <Feather name={icon} size={20} color={Colors.tint} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, value, color }: { icon: keyof typeof Feather.glyphMap; value: string; color?: string }) {
  return (
    <View style={styles.statPill}>
      <Feather name={icon} size={16} color={color ?? Colors.textSecondary} />
      <Text style={[styles.statPillText, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  );
}

// ─── Detail Screen ────────────────────────────────────────────────────────────

export default function DetailScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const { width, height } = useWindowDimensions();
  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const playVideo = useCallback((key: string, _title: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${key}`);
  }, []);

  const baseItem = getItem(id ?? "");
  const inList = baseItem ? isInWatchlist(baseItem.id) : false;

  // Prefer contentStore item, fall back to TMDB response once loaded
  const item: DetailItem | null = detail ?? (baseItem ? { ...baseItem, genres: undefined } : null);

  // Resolved media type: from URL param or contentStore
  const mediaType = (type as "movie" | "tv") ?? baseItem?.media_type ?? "movie";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchDetail(mediaType, id)
      .then((data: any) => {
        // Normalise TV `name` → `title` and attach media_type/streaming from contentStore
        const normalised: DetailItem = {
          ...data,
          title: data.title ?? data.name ?? "",
          media_type: mediaType,
          streaming: baseItem?.streaming,
          // TMDB fields that don't exist on ContentItem
          genre_ids: data.genre_ids ?? (data.genres?.map((g: any) => g.id) ?? []),
          release_date: data.release_date ?? data.first_air_date ?? "",
          poster_path: data.poster_path ?? "",
          backdrop_path: data.backdrop_path ?? "",
          overview: data.overview ?? "",
          vote_average: data.vote_average ?? 0,
          popularity: data.popularity ?? 0,
        };
        setDetail(normalised);
      })
      .catch((err: unknown) => console.error("[Detail] TMDB fetch failed:", err))
      .finally(() => setLoading(false));
  }, [id, mediaType]);

  // Show spinner while fetching if we have no baseItem to display yet
  if (!item && loading) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator size="large" color={Colors.tint} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={56} color={Colors.textSecondary} />
        <Text style={styles.notFoundTitle}>Content Not Found</Text>
        <Text style={styles.notFoundBody}>Press Menu to go back.</Text>
      </View>
    );
  }

  const displayTitle = item.title || item.name || "";
  const displayYear = releaseYear(item.release_date || item.first_air_date);
  const genres = detail?.genres?.map(g => g.name) ?? genreNames(item.genre_ids ?? [], 4);
  const flatrate = item.streaming?.providers?.flatrate ?? [];
  const rent = item.streaming?.providers?.rent ?? [];
  const buy = item.streaming?.providers?.buy ?? [];
  const allProviders = [...flatrate, ...rent, ...buy].filter(
    (p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i
  );

  const cast = detail?.credits?.cast?.slice(0, 20) ?? [];
  const crew = detail?.credits?.crew ?? [];
  const directors = crew.filter(c => c.job === "Director").slice(0, 3);
  const writers = crew.filter(c => c.job === "Screenplay" || c.job === "Writer" || c.job === "Story").slice(0, 3);
  const composers = crew.filter(c => c.department === "Sound" && (c.job.includes("Music") || c.job.includes("Composer") || c.job.includes("Score"))).slice(0, 2);

  const videos = detail?.videos?.results ?? [];
  const trailers = videos.filter(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
  const otherVideos = videos.filter(v => v.site === "YouTube" && v.type !== "Trailer" && v.type !== "Teaser").slice(0, 5);
  const allVideos = [...trailers, ...otherVideos].slice(0, 8);

  const recommendations = detail?.recommendations?.results?.filter(r => r.poster_path).slice(0, 12) ?? [];
  const similar = detail?.similar?.results?.filter(r => r.poster_path).slice(0, 12) ?? [];

  const runtime = detail?.runtime
    ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m`
    : detail?.episode_run_time?.[0]
      ? `~${detail.episode_run_time[0]}m / ep`
      : "";

  const popularityDisplay = item.popularity > 1000
    ? `${(item.popularity / 1000).toFixed(1)}k`
    : item.popularity.toFixed(0);

  const hasFullDetail = !!detail;
  const streamLabel = [
    flatrate.length && "Stream",
    rent.length && "Rent",
    buy.length && "Buy",
  ].filter(Boolean).join(" · ");

  const isTV = item.media_type === "tv";

  return (
    <View style={styles.root}>
      {/* Full-bleed backdrop */}
      <Image
        source={{ uri: backdropUrl(item.backdrop_path, "original") }}
        style={[StyleSheet.absoluteFill, { width, height }]}
        contentFit="cover"
        transition={600}
      />

      {/* Gradients */}
      <LinearGradient
        colors={["rgba(10,10,15,0.99)", "rgba(10,10,15,0.94)", "rgba(10,10,15,0.6)", "rgba(10,10,15,0)"]}
        style={styles.gradientLeft}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0.75)", "rgba(10,10,15,0)"]}
        style={styles.gradientTop}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(10,10,15,0)", "rgba(10,10,15,0.98)"]}
        style={styles.gradientBottom}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={styles.topRow}>
            {/* Poster */}
            <Image
              source={{ uri: posterUrl(item.poster_path, "w500") }}
              style={styles.poster}
              contentFit="cover"
              transition={400}
            />

            {/* Info column */}
            <View style={styles.infoCol}>
              {/* Badges */}
              <View style={styles.badgeRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{isTV ? "TV SERIES" : "FILM"}</Text>
                </View>
                {flatrate.length > 0 && (
                  <View style={styles.streamBadge}>
                    <View style={styles.streamDot} />
                    <Text style={styles.streamBadgeText}>Streaming Now</Text>
                  </View>
                )}
                {detail?.status && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>{detail.status}</Text>
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={styles.title} numberOfLines={2}>{displayTitle}</Text>

              {/* Tagline */}
              {detail?.tagline ? (
                <Text style={styles.tagline} numberOfLines={2}>"{detail.tagline}"</Text>
              ) : null}

              {/* Stats */}
              <View style={styles.statsRow}>
                <StatPill icon="star" value={formatVoteAverage(item.vote_average)} color={Colors.accent} />
                <View style={styles.statDivider} />
                {displayYear ? <><StatPill icon="calendar" value={displayYear} /><View style={styles.statDivider} /></> : null}
                {runtime ? <><StatPill icon="clock" value={runtime} /><View style={styles.statDivider} /></> : null}
                <StatPill icon="trending-up" value={popularityDisplay} color={Colors.tint} />
                {streamLabel ? (
                  <><View style={styles.statDivider} /><StatPill icon="play-circle" value={streamLabel} color={Colors.accentGreen} /></>
                ) : null}
              </View>

              {/* TV extra info */}
              {isTV && detail && (
                <View style={styles.tvExtraRow}>
                  {detail.number_of_seasons ? (
                    <View style={styles.tvPill}>
                      <Text style={styles.tvPillText}>{detail.number_of_seasons} Season{detail.number_of_seasons !== 1 ? "s" : ""}</Text>
                    </View>
                  ) : null}
                  {detail.number_of_episodes ? (
                    <View style={styles.tvPill}>
                      <Text style={styles.tvPillText}>{detail.number_of_episodes} Episodes</Text>
                    </View>
                  ) : null}
                  {detail.next_episode_to_air ? (
                    <View style={[styles.tvPill, styles.tvPillUpcoming]}>
                      <View style={styles.streamDot} />
                      <Text style={[styles.tvPillText, { color: Colors.accentGreen }]}>
                        S{detail.next_episode_to_air.season_number}E{detail.next_episode_to_air.episode_number} · {detail.next_episode_to_air.air_date?.slice(0, 10)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Genres */}
              {genres.length > 0 && (
                <View style={styles.genreRow}>
                  {genres.map(g => (
                    <View key={g} style={styles.genreTag}>
                      <Text style={styles.genreText}>{g}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Overview */}
              <Text style={styles.overview} numberOfLines={5}>{item.overview}</Text>

              {/* Key crew */}
              {hasFullDetail && (directors.length > 0 || writers.length > 0 || composers.length > 0) && (
                <View style={styles.crewRow}>
                  {directors.length > 0 && (
                    <View style={styles.crewItem}>
                      <Text style={styles.crewRole}>{isTV ? "Creator" : "Director"}</Text>
                      <Text style={styles.crewName}>{directors.map(d => d.name).join(", ")}</Text>
                    </View>
                  )}
                  {writers.length > 0 && (
                    <View style={styles.crewItem}>
                      <Text style={styles.crewRole}>Screenplay</Text>
                      <Text style={styles.crewName}>{writers.map(w => w.name).join(", ")}</Text>
                    </View>
                  )}
                  {composers.length > 0 && (
                    <View style={styles.crewItem}>
                      <Text style={styles.crewRole}>Music</Text>
                      <Text style={styles.crewName}>{composers.map(c => c.name).join(", ")}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Action buttons — inside info col so they anchor to the text */}
              <TVFocusGuideWrapper style={styles.actionsRow}>
                <FocusButton
                  icon="play"
                  label="Play Now"
                  variant="primary"
                  hasTVPreferredFocus
                  onPress={() =>
                    Alert.alert("Starting Playback", `Now playing: ${displayTitle}`, [{ text: "OK" }])
                  }
                />
                <FocusButton
                  icon={inList ? "bookmark" : "bookmark"}
                  label={inList ? "In My List" : "+ My List"}
                  variant="secondary"
                  active={inList}
                  onPress={() => baseItem && toggleWatchlist(baseItem)}
                />
                {trailers.length > 0 && (
                  <FocusButton
                    icon="film"
                    label="Watch Trailer"
                    variant="secondary"
                    color={Colors.accentRed}
                    onPress={() => playVideo(trailers[0].key, trailers[0].name)}
                  />
                )}
              </TVFocusGuideWrapper>
            </View>
          </View>
        </View>

        {/* Loading indicator for detail data */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.tint} size="small" />
            <Text style={styles.loadingText}>Loading details…</Text>
          </View>
        )}

        {/* Where to Watch */}
        {allProviders.length > 0 && (
          <View style={styles.section}>
            <SectionLabel label="Where to Watch" icon="tv" />
            {flatrate.length > 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="play-circle" size={13} color={Colors.accentGreen} />
                  {"  "}Included with subscription
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {flatrate.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i).slice(0, 6).map(p => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}
            {rent.length > 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="dollar-sign" size={13} color={Colors.accent} />
                  {"  "}Rent
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {rent.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i).slice(0, 6).map(p => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}
            {buy.length > 0 && (
              <View style={styles.providerSection}>
                <Text style={styles.providerSectionLabel}>
                  <Feather name="shopping-bag" size={13} color={Colors.textSecondary} />
                  {"  "}Buy
                </Text>
                <TVFocusGuideWrapper style={styles.providerRow}>
                  {buy.filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i).slice(0, 6).map(p => (
                    <ProviderChip key={p.provider_id} provider={p} />
                  ))}
                </TVFocusGuideWrapper>
              </View>
            )}
          </View>
        )}

        {/* Trailers & Videos */}
        {allVideos.length > 0 && (
          <View style={styles.section}>
            <SectionLabel label="Trailers & Videos" icon="film" />
            <TVFocusGuideWrapper style={styles.videoRow}>
              {allVideos.map(v => <VideoTile key={v.id} video={v} onPlay={playVideo} />)}
            </TVFocusGuideWrapper>
          </View>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <View style={styles.section}>
            <SectionLabel label="Cast" icon="users" />
            <TVFocusGuideWrapper style={styles.castRow}>
              {cast.map(m => <CastCard key={m.id} member={m} />)}
            </TVFocusGuideWrapper>
          </View>
        )}

        {/* Full crew details */}
        {hasFullDetail && (detail?.budget ?? 0) > 0 || (detail?.revenue ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionLabel label="Box Office" icon="bar-chart-2" />
            <View style={styles.infoGrid}>
              {(detail?.budget ?? 0) > 0 && (
                <InfoRow
                  label="Budget"
                  value={`$${((detail?.budget ?? 0) / 1_000_000).toFixed(1)}M`}
                />
              )}
              {(detail?.revenue ?? 0) > 0 && (
                <InfoRow
                  label="Revenue"
                  value={`$${((detail?.revenue ?? 0) / 1_000_000).toFixed(1)}M`}
                />
              )}
            </View>
          </View>
        ) : null}

        {/* Production details */}
        {hasFullDetail && (
          <View style={styles.section}>
            <SectionLabel label="Details" icon="info" />
            <View style={styles.infoGrid}>
              {detail?.status && <InfoRow label="Status" value={detail.status} />}
              {runtime && <InfoRow label="Runtime" value={runtime} />}
              {detail?.spoken_languages?.length ? (
                <InfoRow label="Language" value={detail.spoken_languages.map(l => l.english_name).join(", ")} />
              ) : null}
              {detail?.origin_country?.length ? (
                <InfoRow label="Country" value={detail.origin_country.join(", ")} />
              ) : null}
              {directors.length > 0 && (
                <InfoRow label={isTV ? "Creator" : "Director"} value={directors.map(d => d.name).join(", ")} />
              )}
              {writers.length > 0 && (
                <InfoRow label="Screenplay" value={writers.map(w => w.name).join(", ")} />
              )}
              {composers.length > 0 && (
                <InfoRow label="Music / Score" value={composers.map(c => c.name).join(", ")} />
              )}
              {detail?.production_companies?.length ? (
                <InfoRow label="Studio" value={detail.production_companies.map(c => c.name).join(", ")} />
              ) : null}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <SectionLabel label="More Like This" icon="thumbs-up" />
            <TVFocusGuideWrapper style={styles.recRow}>
              {recommendations.map(r => (
                <RecommendedCard key={r.id} item={{ ...r, media_type: (r as any).media_type || item.media_type }} />
              ))}
            </TVFocusGuideWrapper>
          </View>
        )}

        {/* Similar */}
        {similar.length > 0 && recommendations.length === 0 && (
          <View style={styles.section}>
            <SectionLabel label="Similar Titles" icon="layers" />
            <TVFocusGuideWrapper style={styles.recRow}>
              {similar.map(r => (
                <RecommendedCard key={r.id} item={{ ...r, media_type: (r as any).media_type || item.media_type }} />
              ))}
            </TVFocusGuideWrapper>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  notFound: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundTitle: { fontFamily: "Inter_600SemiBold", fontSize: 28, color: Colors.text },
  notFoundBody: { fontFamily: "Inter_400Regular", fontSize: 18, color: Colors.textSecondary },

  // Left gradient: covers ~80% width so text is always legible; backdrop shows on far right
  gradientLeft: { ...StyleSheet.absoluteFillObject, right: "10%" },
  gradientTop: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  gradientBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 300 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 52, paddingHorizontal: 80 },

  heroSection: { marginBottom: 24 },
  topRow: { flexDirection: "row", gap: 56, alignItems: "flex-start" },

  // Poster — much larger for 10-foot viewing
  poster: {
    width: 300,
    height: 450,
    flexShrink: 0,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.85,
    shadowRadius: 40,
  },

  infoCol: { flex: 1, gap: 18, paddingTop: 6 },

  badgeRow: { flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" },
  typeBadge: { backgroundColor: Colors.tint, borderRadius: 7, paddingHorizontal: 14, paddingVertical: 6 },
  typeBadgeText: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 1.6, color: "#fff" },
  streamBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: Colors.accentGreen + "22", borderRadius: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.accentGreen + "50",
  },
  streamDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accentGreen },
  streamBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.accentGreen },
  statusBadge: {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  statusBadgeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.textSecondary },

  // Title: big and bold for 10-foot readability
  title: { fontFamily: "Inter_700Bold", fontSize: 66, lineHeight: 74, letterSpacing: -1.5, color: Colors.text },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 20, lineHeight: 30, color: Colors.textSecondary, fontStyle: "italic" },

  statsRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  statPill: { flexDirection: "row", alignItems: "center", gap: 7 },
  statPillText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.textSecondary },
  statDivider: { width: 1, height: 20, backgroundColor: Colors.border },

  tvExtraRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  tvPill: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 7,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  tvPillUpcoming: { borderColor: Colors.accentGreen + "50", backgroundColor: Colors.accentGreen + "15", flexDirection: "row", alignItems: "center", gap: 6 },
  tvPillText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },

  genreRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  genreTag: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 7,
    paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  genreText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.textSecondary },

  overview: { fontFamily: "Inter_400Regular", fontSize: 20, lineHeight: 32, color: Colors.textSecondary },

  crewRow: { flexDirection: "row", gap: 40, flexWrap: "wrap" },
  crewItem: { gap: 4 },
  crewRole: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.tint, letterSpacing: 1, textTransform: "uppercase" },
  crewName: { fontFamily: "Inter_500Medium", fontSize: 18, color: Colors.text },

  // Action buttons — large for easy D-pad selection on TV
  actionsRow: { flexDirection: "row", gap: 18, flexWrap: "wrap", marginTop: 8 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 40, paddingVertical: 20, borderRadius: 12,
    borderWidth: 2.5, borderColor: "transparent",
    minWidth: 210, justifyContent: "center",
  },
  actionBtnPrimary: { backgroundColor: Colors.tint },
  actionBtnSecondary: { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.18)" },
  actionBtnActive: { backgroundColor: Colors.tint + "30", borderColor: Colors.tint + "60" },
  actionBtnFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 18,
  },
  actionBtnLabel: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: Colors.text },
  actionBtnLabelPrimary: { color: "#fff" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 16, color: Colors.textSecondary },

  section: { gap: 22, marginTop: 48 },
  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionLabelText: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.text, letterSpacing: 0.2 },

  // Where to watch
  providerSection: { gap: 12 },
  providerSectionLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.textSecondary },
  providerRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  providerChip: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.15)",
  },
  providerChipFocused: {
    borderColor: Colors.focusRing, backgroundColor: "rgba(99,102,241,0.2)",
    shadowColor: Colors.focusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  providerLogo: { width: 36, height: 36 },
  providerName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.text, maxWidth: 140 },

  // Videos
  videoRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  videoTileOuter: { width: 340 },
  videoTile: {
    borderRadius: 10, overflow: "hidden",
    borderWidth: 2, borderColor: "transparent",
  },
  videoTileFocused: {
    borderColor: Colors.focusRing,
    shadowColor: Colors.focusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14,
  },
  videoThumb: { width: "100%", height: 192 },
  videoPlayBtn: {
    position: "absolute", top: "50%", left: "50%",
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  videoMeta: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 12, gap: 4,
  },
  videoTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  videoTypeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: Colors.text, letterSpacing: 0.8, textTransform: "uppercase" },
  videoName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.text, lineHeight: 18 },

  // Cast
  castRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  castCardOuter: { width: 120 },
  castCard: {
    borderRadius: 12, overflow: "hidden", padding: 10, gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2, borderColor: "transparent",
    alignItems: "center",
  },
  castCardFocused: {
    borderColor: Colors.focusRing, backgroundColor: "rgba(99,102,241,0.12)",
    shadowColor: Colors.focusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  castPhoto: { width: 80, height: 80, borderRadius: 40 },
  castPhotoPlaceholder: { backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  castInfo: { gap: 2, alignItems: "center" },
  castName: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, textAlign: "center" },
  castCharacter: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.textSecondary, textAlign: "center" },

  // Info grid
  infoGrid: { gap: 0, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoRowLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.textSecondary },
  infoRowValue: { fontFamily: "Inter_400Regular", fontSize: 15, color: Colors.text, maxWidth: "60%", textAlign: "right" },

  // Recommendations
  recRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  recCardOuter: { width: 160, position: "relative", alignItems: "center" },
  recCardGlow: {
    position: "absolute", top: -8, left: -8, right: -8, bottom: -8, borderRadius: 20,
    shadowColor: Colors.focusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 18,
  },
  recCard: { width: "100%", borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  recCardFocused: { borderColor: Colors.focusRing },
  recPoster: { width: "100%", aspectRatio: 2 / 3 },
  recGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" },
  recInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, gap: 4 },
  recRating: { flexDirection: "row", alignItems: "center", gap: 3 },
  recRatingText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.accent },
  recTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.text, lineHeight: 16 },
});
