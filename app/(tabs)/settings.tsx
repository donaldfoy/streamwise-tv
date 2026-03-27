import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import {
  STREAMING_SERVICES,
  StreamingService,
  getProviderLogoUrl,
} from "@/lib/streaming-services";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { TVFocusGuideWrapper } from "@/components/TVFocusGuideViewWrapper";

const CATEGORIES: { key: StreamingService["category"]; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: "subscription", label: "Subscription Services", icon: "check-circle" },
  { key: "live",         label: "Live TV",               icon: "radio" },
  { key: "free",         label: "Free Streaming",        icon: "gift" },
];

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  selected,
  onToggle,
  hasTVPreferredFocus,
}: {
  service: StreamingService;
  selected: boolean;
  onToggle: () => void;
  hasTVPreferredFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onToggle}
        hasTVPreferredFocus={hasTVPreferredFocus}
        style={[
          styles.serviceCard,
          selected && styles.serviceCardSelected,
          focused && styles.serviceCardFocused,
        ]}
      >
        <Image
          source={{ uri: getProviderLogoUrl(service.logoPath) }}
          style={styles.serviceLogo}
          contentFit="cover"
          transition={200}
        />
        <Text style={styles.serviceName} numberOfLines={2}>
          {service.name}
        </Text>
        {selected && (
          <View style={styles.checkBadge}>
            <Feather name="check" size={14} color="#fff" />
          </View>
        )}
        {focused && !selected && (
          <View style={styles.focusHint}>
            <Text style={styles.focusHintText}>Select</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { subscribedProviderIds, isSubscribed, toggleSubscription } = useSubscriptions();

  const subscribedServices = STREAMING_SERVICES.filter((s) => isSubscribed(s.id));
  const count = subscribedServices.length;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Choose your streaming services to personalise your recommendations
          </Text>
        </View>

        {/* Summary pill */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Feather name="check-circle" size={16} color={Colors.accentGreen} />
            <Text style={styles.summaryText}>
              {count === 0
                ? "No services selected — showing all available content"
                : `${count} service${count === 1 ? "" : "s"} selected`}
            </Text>
          </View>
        </View>

        {/* Service groups */}
        {CATEGORIES.map(({ key, label, icon }) => {
          const services = STREAMING_SERVICES.filter((s) => s.category === key);
          return (
            <View key={key} style={styles.section}>
              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Feather name={icon} size={16} color={Colors.tint} />
                <Text style={styles.sectionTitle}>{label}</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* Grid */}
              <TVFocusGuideWrapper style={styles.grid}>
                {services.map((service, idx) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={isSubscribed(service.id)}
                    onToggle={() => toggleSubscription(service.id)}
                    hasTVPreferredFocus={key === "subscription" && idx === 0}
                  />
                ))}
              </TVFocusGuideWrapper>
            </View>
          );
        })}

        {/* Info footer */}
        <View style={styles.footer}>
          <Feather name="info" size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>
            Your selections power the "Streaming for You" rail on the Home screen.
            Changes take effect immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 64,
    paddingTop: 52,
    paddingBottom: 24,
    gap: 10,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 52,
    letterSpacing: -1,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: Colors.textSecondary,
    lineHeight: 26,
    maxWidth: 700,
  },
  summaryRow: {
    paddingHorizontal: 64,
    paddingBottom: 32,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.accentGreen + "40",
    alignSelf: "flex-start",
  },
  summaryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.accentGreen,
  },
  section: {
    paddingHorizontal: 64,
    paddingBottom: 40,
    gap: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  serviceCard: {
    width: 160,
    height: 180,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    position: "relative",
  },
  serviceCardSelected: {
    backgroundColor: Colors.tint + "22",
    borderColor: Colors.tint,
  },
  serviceCardFocused: {
    borderColor: Colors.focusRing,
    backgroundColor: "rgba(99,102,241,0.18)",
  },
  serviceLogo: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  serviceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  focusHint: {
    position: "absolute",
    bottom: 8,
    backgroundColor: Colors.focusRing + "33",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  focusHintText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: Colors.focusRing,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 64,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: "flex-start",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
