import type { ContentItem, SearchResponse } from "./types";

const API_BASE = "https://streamwise.live/api";
const IMG_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size: "w300" | "w500" | "original" = "w500"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function providerLogoUrl(path: string): string {
  return `${IMG_BASE}/w92${path}`;
}

export function releaseYear(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 4);
}

export function formatVoteAverage(vote: number): string {
  return vote.toFixed(1);
}

export async function fetchTrending(): Promise<ContentItem[]> {
  const res = await fetch(`${API_BASE}/trending`);
  if (!res.ok) throw new Error("Failed to fetch trending");
  return res.json();
}

export async function fetchMovies(): Promise<ContentItem[]> {
  const res = await fetch(`${API_BASE}/movies`);
  if (!res.ok) throw new Error("Failed to fetch movies");
  const data: { results?: ContentItem[] } | ContentItem[] = await res.json();
  if (Array.isArray(data)) return data;
  return (data as { results?: ContentItem[] }).results ?? [];
}

export async function fetchTV(): Promise<ContentItem[]> {
  const res = await fetch(`${API_BASE}/tv`);
  if (!res.ok) throw new Error("Failed to fetch TV shows");
  const data: { results?: ContentItem[] } | ContentItem[] = await res.json();
  if (Array.isArray(data)) return data;
  return (data as { results?: ContentItem[] }).results ?? [];
}

export async function fetchSearch(query: string): Promise<ContentItem[]> {
  if (!query.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search");
  const data: SearchResponse | ContentItem[] = await res.json();
  if (Array.isArray(data)) return data;
  return (data as SearchResponse).results ?? [];
}
