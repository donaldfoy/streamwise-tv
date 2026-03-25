import type { ContentItem } from "./types";

const store = new Map<string, ContentItem>();

export function storeItem(item: ContentItem) {
  store.set(String(item.id), item);
}

export function storeItems(items: ContentItem[]) {
  items.forEach((item) => storeItem(item));
}

export function getItem(id: string): ContentItem | undefined {
  return store.get(id);
}
