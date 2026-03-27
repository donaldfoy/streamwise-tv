import AsyncStorage from "@react-native-async-storage/async-storage";

// Same storage key as the iOS app so preferences roam via iCloud Backup
const STORAGE_KEY = "streamwise_streaming_services";

export interface StreamingService {
  id: number;
  name: string;
  logoPath: string;
  category: "subscription" | "free" | "live";
}

export const STREAMING_SERVICES: StreamingService[] = [
  { id: 8,    name: "Netflix",            logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg", category: "subscription" },
  { id: 9,    name: "Amazon Prime Video", logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg",  category: "subscription" },
  { id: 15,   name: "Hulu",               logoPath: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg",  category: "subscription" },
  { id: 337,  name: "Disney+",            logoPath: "/97yvRBw1GzX7fXprcF80er19ot.jpg",   category: "subscription" },
  { id: 350,  name: "Apple TV+",          logoPath: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg",  category: "subscription" },
  { id: 1899, name: "Max",                logoPath: "/jbe4gVSfRlbPTdESXhEKpornsfu.jpg",  category: "subscription" },
  { id: 386,  name: "Peacock",            logoPath: "/2aGrp1xw3qhwCYvNGAJZPdjfeeX.jpg",  category: "subscription" },
  { id: 531,  name: "Paramount+",         logoPath: "/h5DcR0J2EESLitnhR8xLG1QymTE.jpg",  category: "subscription" },
  { id: 283,  name: "Crunchyroll",        logoPath: "/fzN5Jok5Ig1eJ7gyNGoMhnLSCfh.jpg",  category: "subscription" },
  { id: 11,   name: "MUBI",               logoPath: "/x570VpH2C9EKDf1riP83rYc5dnL.jpg",  category: "subscription" },
  { id: 526,  name: "AMC+",               logoPath: "/ovmu6uot1XVvsemM2dDySXLiX57.jpg",  category: "subscription" },
  { id: 257,  name: "fuboTV",             logoPath: "/9BgaNQRMDvVlji1JBZi6tcfxpKx.jpg",  category: "live" },
  { id: 2528, name: "YouTube TV",         logoPath: "/x9zOHTUkQzt3PgPVKbMH9CKBwLK.jpg",  category: "live" },
  { id: 73,   name: "Tubi",               logoPath: "/rMb93u1tBeErSYLv79zSTR07UdO.jpg",  category: "free" },
  { id: 300,  name: "Pluto TV",           logoPath: "/dB8G41Q6tSL5NBisrIeqByfepBc.jpg",  category: "free" },
  { id: 538,  name: "Plex",               logoPath: "/vLZKlXUNDcZR7ilvfY9Wr9k80FZ.jpg",  category: "free" },
];

export function getProviderLogoUrl(logoPath: string): string {
  return `https://image.tmdb.org/t/p/w92${logoPath}`;
}

// ID migrations for renamed/merged providers (matches iOS)
const ID_MIGRATIONS: Record<number, number | null> = {
  384: 1899,
  80:  526,
  363: 2528,
};

export async function getSelectedServices(): Promise<number[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const ids: number[] = JSON.parse(stored);
    const validIds = STREAMING_SERVICES.map((s) => s.id);
    let changed = false;
    const migrated = ids
      .map((id) => {
        if (id in ID_MIGRATIONS) {
          changed = true;
          return ID_MIGRATIONS[id];
        }
        return id;
      })
      .filter((id): id is number => id !== null && validIds.includes(id));
    const unique = [...new Set(migrated)];
    if (changed) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    }
    return unique;
  } catch {
    return [];
  }
}

export async function setSelectedServices(ids: number[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}
