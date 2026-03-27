import React, { useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Text,
  BackHandler,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface VideoPlayerModalProps {
  videoKey: string | null;
  videoTitle?: string;
  onClose: () => void;
}

export default function VideoPlayerModal({ videoKey, videoTitle, onClose }: VideoPlayerModalProps) {
  const visible = !!videoKey;

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!videoKey) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&rel=0&playsinline=1`;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      supportedOrientations={["landscape"]}
    >
      <View style={styles.container}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
        <Pressable
          style={({ focused }) => [styles.closeBtn, focused && styles.closeBtnFocused]}
          onPress={onClose}
          hasTVPreferredFocus
        >
          <Feather name="x" size={28} color="#fff" />
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeBtn: {
    position: "absolute",
    top: 40,
    right: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  closeBtnFocused: {
    borderColor: Colors.focusRing,
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
});
