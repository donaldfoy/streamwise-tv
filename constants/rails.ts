import type { ContentItem } from "./types";

function dedupe(items: ContentItem[]): ContentItem[] {
  const seen = new Set<number>();
  return items.filter((i) => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function getSuggestedForYou(
  allContent: ContentItem[],
  watchlist: ContentItem[]
): ContentItem[] {
  if (watchlist.length === 0) return [];
  const watchedGenres = new Set(watchlist.flatMap((i) => i.genre_ids));
  const watchlistIds = new Set(watchlist.map((i) => i.id));
  return dedupe(
    allContent
      .filter(
        (i) =>
          !watchlistIds.has(i.id) &&
          i.genre_ids.some((g) => watchedGenres.has(g))
      )
      .sort((a, b) => b.vote_average - a.vote_average)
  ).slice(0, 20);
}

export function getBecauseYouWatched(
  allContent: ContentItem[],
  watchlist: ContentItem[]
): { label: string; results: ContentItem[] } | null {
  if (watchlist.length === 0) return null;
  const seed = watchlist[0];
  const genreSet = new Set(seed.genre_ids);
  const results = dedupe(
    allContent
      .filter((i) => i.id !== seed.id && i.genre_ids.some((g) => genreSet.has(g)))
      .sort((a, b) => b.popularity - a.popularity)
  ).slice(0, 20);
  if (results.length === 0) return null;
  return { label: `Because You Watched ${seed.title}`, results };
}

export function getStreamingForYou(
  allContent: ContentItem[],
  subscribedProviderIds: number[]
): ContentItem[] {
  if (subscribedProviderIds.length === 0) {
    return dedupe(
      allContent
        .filter((i) => (i.streaming?.providers?.flatrate?.length ?? 0) > 0)
        .sort((a, b) => b.popularity - a.popularity)
    ).slice(0, 20);
  }
  const providerSet = new Set(subscribedProviderIds);
  return dedupe(
    allContent
      .filter((i) =>
        i.streaming?.providers?.flatrate?.some((p) => providerSet.has(p.provider_id))
      )
      .sort((a, b) => b.popularity - a.popularity)
  ).slice(0, 20);
}

export function getJustAdded(allContent: ContentItem[]): ContentItem[] {
  const cutoff = daysAgo(90);
  return dedupe(
    allContent
      .filter((i) => i.release_date && new Date(i.release_date) >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      )
  ).slice(0, 20);
}

export function getNewReleases(allContent: ContentItem[]): ContentItem[] {
  const cutoff = daysAgo(30);
  return dedupe(
    allContent
      .filter(
        (i) =>
          i.media_type === "movie" &&
          i.release_date &&
          new Date(i.release_date) >= cutoff
      )
      .sort(
        (a, b) =>
          new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      )
  ).slice(0, 20);
}

export function getPopularMovies(allContent: ContentItem[]): ContentItem[] {
  return dedupe(
    allContent
      .filter((i) => i.media_type === "movie" && i.vote_average >= 8)
      .sort((a, b) => b.popularity - a.popularity)
  ).slice(0, 20);
}

export function getTopRatedTV(allContent: ContentItem[]): ContentItem[] {
  return dedupe(
    allContent
      .filter((i) => i.media_type === "tv" && i.vote_average >= 8)
      .sort((a, b) => b.vote_average - a.vote_average)
  ).slice(0, 20);
}

export function getHiddenGems(allContent: ContentItem[]): ContentItem[] {
  return dedupe(
    allContent
      .filter((i) => i.vote_average >= 7.5 && i.popularity < 50)
      .sort((a, b) => b.vote_average - a.vote_average)
  ).slice(0, 20);
}
