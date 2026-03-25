import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ContentItem } from "@/constants/types";

const STORAGE_KEY = "@streamwise_watchlist";

type WatchlistContextType = {
  watchlist: ContentItem[];
  isInWatchlist: (id: number) => boolean;
  addToWatchlist: (item: ContentItem) => void;
  removeFromWatchlist: (id: number) => void;
  toggleWatchlist: (item: ContentItem) => void;
};

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<ContentItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setWatchlist(JSON.parse(raw));
        } catch (error) {
          console.warn("Failed to parse watchlist from storage:", error);
        }
      }
    });
  }, []);

  const persist = useCallback((items: ContentItem[]) => {
    setWatchlist(items);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((error) => {
      console.warn("Failed to persist watchlist:", error);
    });
  }, []);

  const isInWatchlist = useCallback(
    (id: number) => watchlist.some((i) => i.id === id),
    [watchlist]
  );

  const addToWatchlist = useCallback(
    (item: ContentItem) => {
      if (!isInWatchlist(item.id)) persist([item, ...watchlist]);
    },
    [watchlist, isInWatchlist, persist]
  );

  const removeFromWatchlist = useCallback(
    (id: number) => {
      persist(watchlist.filter((i) => i.id !== id));
    },
    [watchlist, persist]
  );

  const toggleWatchlist = useCallback(
    (item: ContentItem) => {
      if (isInWatchlist(item.id)) {
        removeFromWatchlist(item.id);
      } else {
        addToWatchlist(item);
      }
    },
    [isInWatchlist, addToWatchlist, removeFromWatchlist]
  );

  return (
    <WatchlistContext.Provider
      value={{ watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist, toggleWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextType {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be inside WatchlistProvider");
  return ctx;
}
