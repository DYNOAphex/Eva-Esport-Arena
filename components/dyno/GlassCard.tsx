import type { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { Theme } from "../../constants/theme";

type GlassCardProps = PropsWithChildren<{
  style?: ViewStyle;
  emphasized?: boolean;
  strong?: boolean;
  goldAccent?: boolean;
}>;

export default function GlassCard({ children, style, emphasized = false, strong = false, goldAccent = false }: GlassCardProps) {
  const isStrong = emphasized || strong;

  return (
    <View style={[styles.card, isStrong && styles.emphasized, goldAccent && styles.goldAccent, style]}>
      <View pointerEvents="none" style={styles.sheen} />
      {goldAccent ? <View pointerEvents="none" style={styles.goldLine} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.glass.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.glass.border,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  emphasized: {
    backgroundColor: Theme.glass.cardStrong,
    borderColor: Theme.glass.borderGold,
    shadowOpacity: 0.24,
    shadowRadius: 15,
    elevation: 8,
  },
  goldAccent: {
    borderColor: Theme.glass.borderGold,
  },
  sheen: {
    position: "absolute",
    top: -72,
    right: -72,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  goldLine: {
    position: "absolute",
    top: 0,
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: Theme.marble.goldVein,
  },
});
