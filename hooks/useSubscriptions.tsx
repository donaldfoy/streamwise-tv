import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@streamwise_subscriptions";

type SubscriptionsContextType = {
  subscribedProviderIds: number[];
  isSubscribed: (providerId: number) => boolean;
  toggleSubscription: (providerId: number) => void;
  setSubscriptions: (ids: number[]) => void;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | null>(null);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [subscribedProviderIds, setSubscribedProviderIds] = useState<number[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSubscribedProviderIds(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const persist = useCallback((ids: number[]) => {
    setSubscribedProviderIds(ids);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const isSubscribed = useCallback(
    (providerId: number) => subscribedProviderIds.includes(providerId),
    [subscribedProviderIds]
  );

  const toggleSubscription = useCallback(
    (providerId: number) => {
      if (isSubscribed(providerId)) {
        persist(subscribedProviderIds.filter((id) => id !== providerId));
      } else {
        persist([...subscribedProviderIds, providerId]);
      }
    },
    [subscribedProviderIds, isSubscribed, persist]
  );

  const setSubscriptions = useCallback(
    (ids: number[]) => persist(ids),
    [persist]
  );

  return (
    <SubscriptionsContext.Provider
      value={{ subscribedProviderIds, isSubscribed, toggleSubscription, setSubscriptions }}
    >
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions(): SubscriptionsContextType {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error("useSubscriptions must be inside SubscriptionsProvider");
  return ctx;
}
