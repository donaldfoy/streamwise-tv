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
  const firstCardRef = useRef<View>(null);

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
          {items.map((item, index) => (
            <TVCard
              key={`${item.id}-${index}`}
              item={item}
              size={cardSize}
              onPress={onCardPress}
              hasTVPreferredFocus={firstItemFocused && index === 0}
              cardRef={index === 0 ? firstCardRef : undefined}
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
