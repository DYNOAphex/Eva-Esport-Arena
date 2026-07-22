import type { PropsWithChildren, ReactNode } from "react";
import { ImageBackground, SafeAreaView, StyleSheet, View, ViewStyle } from "react-native";

import { Theme } from "../../constants/theme";

const marbleSource = require("../../assets/images/background-marble.jpg");

type MarbleScreenProps = PropsWithChildren<{
  decoration?: ReactNode;
  contentStyle?: ViewStyle;
  strongerOverlay?: boolean;
}>;

export default function MarbleScreen({ children, decoration, contentStyle, strongerOverlay = false }: MarbleScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={[styles.overlay, strongerOverlay && styles.overlayStrong]} />
        <View pointerEvents="none" style={styles.whiteGlow} />
        <View pointerEvents="none" style={styles.goldVein} />
        <View style={[styles.content, contentStyle]}>{children}</View>
        {decoration}
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  background: { flex: 1 },
  backgroundImage: { opacity: Theme.opacity.marble },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Theme.colors.overlay },
  overlayStrong: { backgroundColor: Theme.colors.overlayStrong },
  whiteGlow: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 330,
    height: 450,
    borderRadius: 190,
    backgroundColor: "rgba(255,255,255,0.075)",
    transform: [{ rotate: "-17deg" }],
  },
  goldVein: {
    position: "absolute",
    top: 145,
    left: -80,
    width: 520,
    height: 1,
    backgroundColor: "rgba(246,215,106,0.34)",
    transform: [{ rotate: "-23deg" }],
  },
  content: { flex: 1 },
});
