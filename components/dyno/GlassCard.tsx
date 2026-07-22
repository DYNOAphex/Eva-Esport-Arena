import type { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { Theme } from "../../constants/theme";

type GlassCardProps = PropsWithChildren<{
  style?: ViewStyle;
  emphasized?: boolean;
  goldAccent?: boolean;
}>;

export default function GlassCard({ children, style, emphasized = false, goldAccent = false }: GlassCardProps) {
  return (
    <View style={[styles.card, emphasized && styles.emphasized, goldAccent && styles.goldAccent, style]}>
      <View pointerEvents="none" style={styles.sheen} />
      {goldAccent ? <View pointerEvents="none" style={styles.goldLine} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: Theme.glass.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.glass.border,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  emphasized: {
    backgroundColor: Theme.glass.cardStrong,
    borderColor: Theme.glass.borderGold,
  },
  goldAccent: {
    borderColor: Theme.glass.borderGold,
  },
  sheen: {
    position: "absolute",
    top: -70,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.045)",
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
