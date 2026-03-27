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
   * Called once after mount with the stable ref array for every card
   * in this row (all refs are non-null at call time). Parent stores
   * them to compute nextFocusUp/Down handles for adjacent rows.
   */
  onRefsReady?: (refs: React.RefObject<View>[]) => void;
  /**
   * nextFocusUp node handle per card index. Tells tvOS native focus
   * engine exactly where to go on Up press — no heuristics involved.
   */
  cardUpHandles?: (number | undefined)[];
  /**
   * nextFocusDown node handle per card index. Same as above for Down.
   */
  cardDownHandles?: (number | undefined)[];
};

export function ContentRow({
  title,
  items,
  cardSize = "md",
  onCardPress,
  firstItemFocused = false,
  onRefsReady,
  cardUpHandles,
  cardDownHandles,
}: ContentRowProps) {
  /**
   * Grow-only stable ref container — refs are never recreated across
   * re-renders, only appended. This is safe because item order is stable
   * once TMDB data loads.
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
            nextFocusUp={cardUpHandles?.[index]}
            nextFocusDown={cardDownHandles?.[index]}
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
