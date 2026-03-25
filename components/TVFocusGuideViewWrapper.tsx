/**
 * Safe wrapper for TVFocusGuideView — available on tvOS/native, falls back
 * to a plain View on web/other platforms.
 */
import React, { ReactNode } from "react";
import { Platform, View, ViewStyle } from "react-native";

let NativeTVFocusGuideView: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    const rn = require("react-native");
    if (rn.TVFocusGuideView) {
      NativeTVFocusGuideView = rn.TVFocusGuideView;
    }
  } catch {}
}

type Props = {
  children: ReactNode;
  destinations?: React.RefObject<any>[];
  style?: ViewStyle;
  autoFocus?: boolean;
  trapFocusLeft?: boolean;
  trapFocusRight?: boolean;
  trapFocusUp?: boolean;
  trapFocusDown?: boolean;
};

export function TVFocusGuideWrapper({
  children,
  destinations,
  style,
  autoFocus,
  trapFocusLeft,
  trapFocusRight,
  trapFocusUp,
  trapFocusDown,
}: Props) {
  if (NativeTVFocusGuideView) {
    return (
      <NativeTVFocusGuideView
        destinations={destinations}
        style={style}
        autoFocus={autoFocus}
        trapFocusLeft={trapFocusLeft}
        trapFocusRight={trapFocusRight}
        trapFocusUp={trapFocusUp}
        trapFocusDown={trapFocusDown}
      >
        {children}
      </NativeTVFocusGuideView>
    );
  }
  return <View style={style}>{children}</View>;
}
