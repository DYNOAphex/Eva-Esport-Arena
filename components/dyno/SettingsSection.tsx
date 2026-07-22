import type { PropsWithChildren, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}>;

export default function SettingsSection({ title, subtitle, icon, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
      </View>
      <GlassCard strong>{children}</GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9, paddingHorizontal: 3 },
  headingText: { flex: 1 },
  title: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  subtitle: { color: Theme.colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginLeft: 12, backgroundColor: "rgba(246,215,106,0.09)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold },
});
