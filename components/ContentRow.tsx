import React, { useRef } from "react";
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
};

export function ContentRow({
  title,
  items,
  cardSize = "md",
  onCardPress,
  firstItemFocused = false,
}: ContentRowProps) {
  /**
   * Stable ref array — one ref per card position.
   * Grows as items grow; never shrinks so existing refs stay stable.
   * Avoids calling useRef in a loop (hooks rules) by storing refs
   * inside a single ref-of-array container.
   */
  const cardRefsContainer = useRef<React.RefObject<View>[]>([]);
  while (cardRefsContainer.current.length < items.length) {
    cardRefsContainer.current.push(React.createRef<View>());
  }
  const cardRefs = cardRefsContainer.current.slice(0, items.length);

  if (!items.length) return null;

  const { height } = CARD_DIMENSIONS[cardSize];

  return (
    <TVFocusGuideWrapper
      style={styles.container}
      trapFocusLeft={false}
      trapFocusRight={false}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {/*
       * destinations = ALL card refs for this row.
       *
       * Why: when focus enters this row's guide area from any direction
       * (including Up from a longer row below), the tvOS spatial engine
       * picks the nearest ref from this list. That gives us the
       * "clamp to nearest available card" behavior for free — no custom
       * key-handler logic needed.
       *
       * Before this fix, destinations was only [cardRefs[0]] when
       * firstItemFocused=true, meaning all other entry points had no
       * candidates and focus got stuck when pressing Up from a card whose
       * column index exceeded this row's card count.
       */}
      <TVFocusGuideWrapper
        destinations={cardRefs}
        trapFocusUp={false}
        trapFocusDown={false}
      >
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
            />
          ))}
        </ScrollView>
      </TVFocusGuideWrapper>
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
