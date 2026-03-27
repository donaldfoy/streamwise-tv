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
   * Called once after the last card mounts, with the ref to that card's
   * Pressable view. The parent uses this to compute the node handle needed
   * for nextFocusUp wiring on the row below.
   */
  onLastCardMount?: (ref: React.RefObject<View>) => void;
  /**
   * Node handle (from findNodeHandle) of the last card in the row directly
   * above this one. When a card's column index is >= the row above's count,
   * the native spatial engine can't find a direct target — we override
   * nextFocusUp to land on this handle instead.
   */
  nextFocusUpHandle?: number;
  /**
   * Number of cards in the row above. Cards at index >= this value get
   * nextFocusUp wired to nextFocusUpHandle.
   */
  rowAboveCardCount?: number;
};

export function ContentRow({
  title,
  items,
  cardSize = "md",
  onCardPress,
  firstItemFocused = false,
  onLastCardMount,
  nextFocusUpHandle,
  rowAboveCardCount,
}: ContentRowProps) {
  const firstCardRef = useRef<View>(null);
  const lastCardRef = useRef<View>(null);

  useEffect(() => {
    if (onLastCardMount && items.length > 0) {
      onLastCardMount(lastCardRef);
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
      <TVFocusGuideWrapper
        destinations={firstItemFocused ? [firstCardRef] : undefined}
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
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            /*
             * nextFocusUp override: only applied to cards whose column
             * index is beyond the row above's card count. For those cards,
             * the native spatial engine finds no target directly above,
             * so we redirect to the last visible card in the row above.
             */
            const needsUpOverride =
              nextFocusUpHandle !== undefined &&
              rowAboveCardCount !== undefined &&
              index >= rowAboveCardCount;

            return (
              <TVCard
                key={`${item.id}-${index}`}
                item={item}
                size={cardSize}
                onPress={onCardPress}
                hasTVPreferredFocus={firstItemFocused && isFirst}
                cardRef={isFirst ? firstCardRef : isLast ? lastCardRef : undefined}
                nextFocusUp={needsUpOverride ? nextFocusUpHandle : undefined}
              />
            );
          })}
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
