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
   * Called once after mount with stable refs for every card (all non-null
   * at call time). Parent stores them so inter-row TVFocusGuideViews can
   * compute non-null destinations when a card receives focus.
   */
  onRefsReady?: (refs: React.RefObject<View>[]) => void;
  /**
   * Called whenever a card in this row receives tvOS focus.
   * Parent uses this to update the UIFocusGuide destinations for the
   * guides immediately above and below this row.
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
   * Stable grow-only ref container. Refs are created once and reused
   * across re-renders. They are NEVER passed to TVFocusGuideView during
   * render (only after mount, when .current is guaranteed non-null).
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
    marginBottom: 24,
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
