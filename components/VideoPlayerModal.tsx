import React, { useCallback, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  BackHandler,
} from "react-native";
import WebView from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface VideoPlayerModalProps {
  videoKey: string | null;
  videoTitle?: string;
  onClose: () => void;
}

const EMBED_HTML = (key: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${key}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
    allow="autoplay; encrypted-media"
    allowfullscreen
  ></iframe>
</body>
</html>
`;

export default function VideoPlayerModal({ videoKey, videoTitle, onClose }: VideoPlayerModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = !!videoKey;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // tvOS: pressing the Menu button fires the hardware back event
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const handleClose = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose]);

  if (!videoKey) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      supportedOrientations={["landscape"]}
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        {/* WebView player */}
        <WebView
          style={styles.player}
          source={{ html: EMBED_HTML(videoKey) }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          allowsFullscreenVideo
          startInLoadingState={false}
        />

        {/* Close button — top-right corner, always focusable */}
        <View style={styles.closeRow} pointerEvents="box-none">
          <CloseButton onPress={handleClose} />
        </View>
      </Animated.View>
    </Modal>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  const [focused, setFocused] = React.useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const onFocus = useCallback(() => {
    setFocused(true);
    Animated.spring(scale, { toValue: 1.15, useNativeDriver: true, tension: 200 }).start();
  }, []);
  const onBlur = useCallback(() => {
    setFocused(false);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onFocus={onFocus}
        onBlur={onBlur}
        onPress={onPress}
        hasTVPreferredFocus
        style={[styles.closeBtn, focused && styles.closeBtnFocused]}
        accessible
        accessibilityLabel="Close video"
        accessibilityRole="button"
      >
        <Feather name="x" size={28} color={Colors.text} />
        <Text style={styles.closeBtnText}>Close</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  player: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  closeRow: {
    position: "absolute",
    top: 30,
    right: 40,
    zIndex: 10,
  },
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 2,
    borderColor: "transparent",
  },
  closeBtnFocused: {
    borderColor: Colors.focusRing,
    backgroundColor: Colors.tint,
  },
  closeBtnText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
});
