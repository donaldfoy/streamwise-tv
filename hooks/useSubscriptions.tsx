import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getSelectedServices,
  setSelectedServices,
  STREAMING_SERVICES,
} from "@/lib/streaming-services";

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
    getSelectedServices().then(setSubscribedProviderIds);
  }, []);

  const persist = useCallback((ids: number[]) => {
    setSubscribedProviderIds(ids);
    setSelectedServices(ids);
  }, []);

  const isSubscribed = useCallback(
    (providerId: number) => subscribedProviderIds.includes(providerId),
    [subscribedProviderIds]
  );

  const toggleSubscription = useCallback(
    (providerId: number) => {
      const next = isSubscribed(providerId)
        ? subscribedProviderIds.filter((id) => id !== providerId)
        : [...subscribedProviderIds, providerId];
      persist(next);
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
