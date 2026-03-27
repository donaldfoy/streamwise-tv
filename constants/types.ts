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
