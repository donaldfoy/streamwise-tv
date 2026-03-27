import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { TVCard, CardSize, CARD_DIMENSIONS } from "./TVCard";
import { TVFocusGuideWrapper } from "./TVFocusGuideViewWrapper";
import type { ContentItem } from "@/constants/types";

type ContentRowProps = {
  title: string;
  items: ContentItem[];
  cardSize?: CardSize;
  onCardPress?: (item: ContentItem) => void;
  firstItemFocused?: boolean;
  /**
   * Called after mount with all card refs for this row (index-stable,
   * non-null at call time). Parent stores these for programmatic focus.
   */
  onRefsReady?: (refs: React.RefObject<View>[]) => void;
  /**
   * Called whenever a card in this row receives focus,
   * reporting its item index. Parent uses this to track current position.
   */
  onCardFocus?: (itemIndex: number) => void;
};

export function ContentRow({
  title,
  items,
  cardSize = "md",
  onCardPress,
  firstItemFocused = false,
  onRefsReady,
  onCardFocus,
}: ContentRowProps) {
  /**
   * Stable container so refs survive re-renders without being recreated.
   * We grow the array as items arrive; we never shrink it (stale refs are
   * harmless — the event handler clamps to the live item count via
   * rowCardRefsMap which is updated on every mount).
   */
  const refsContainer = useRef<React.RefObject<View>[]>([]);
  while (refsContainer.current.length < items.length) {
    refsContainer.current.push({ current: null } as React.RefObject<View>);
  }
  const cardRefs = refsContainer.current.slice(0, items.length);

  useEffect(() => {
    if (onRefsReady && items.length > 0) {
      onRefsReady(cardRefs);
    }
  // cardRefs identity changes each render (slice) but the ref objects inside
  // are stable. We only need to call onRefsReady once after mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length) return null;

  const { height } = CARD_DIMENSIONS[cardSize];

  return (
    <TVFocusGuideWrapper
      style={styles.container}
      trapFocusLeft={false}
      trapFocusRight={false}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        style={{ height: height + 32 }}
      >
        {items.map((item, index) => (
          <TVCard
            key={`${item.id}-${index}`}
            item={item}
            size={cardSize}
            onPress={onCardPress}
            hasTVPreferredFocus={firstItemFocused && index === 0}
            cardRef={cardRefs[index]}
            onFocusCallback={() => onCardFocus?.(index)}
          />
        ))}
      </ScrollView>
    </TVFocusGuideWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    marginBottom: 18,
    paddingHorizontal: 52,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 48,
    gap: 16,
    paddingRight: 64,
  },
});
