export type MediaType = "movie" | "tv";

export type StreamingProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
};

export type StreamingInfo = {
  contentId: string;
  contentType: MediaType;
  providers: {
    flatrate?: StreamingProvider[];
    rent?: StreamingProvider[];
    buy?: StreamingProvider[];
  };
  link: string;
};

export type ContentItem = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
  media_type: MediaType;
  streaming?: StreamingInfo;
};

export type SearchResponse = {
  results: ContentItem[];
  page?: number;
  total_results?: number;
  total_pages?: number;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type DetailItem = ContentItem & {
  title?: string;
  name?: string;
  first_air_date?: string;
  tagline?: string;
  status?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  budget?: number;
  revenue?: number;
  genres?: { id: number; name: string }[];
  next_episode_to_air?: { air_date: string; season_number: number; episode_number: number; name: string } | null;
  last_episode_to_air?: { air_date: string; season_number: number; episode_number: number; name: string } | null;
  networks?: { id: number; name: string; logo_path: string | null }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: Video[];
  };
  "watch/providers"?: {
    results: Record<string, {
      flatrate?: StreamingProvider[];
      rent?: StreamingProvider[];
      buy?: StreamingProvider[];
      link?: string;
    }>;
  };
  recommendations?: { results: ContentItem[] };
  similar?: { results: ContentItem[] };
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { name: string; english_name: string }[];
  origin_country?: string[];
};
