import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type PlusOverviewProps = {
  notificationsEnabled: boolean;
  firebaseReady?: boolean;
  installedVersion: string;
  updateAvailable?: boolean;
};

export default function PlusOverview({ notificationsEnabled, firebaseReady, installedVersion, updateAvailable }: PlusOverviewProps) {
  const items = [
    {
      icon: notificationsEnabled ? "notifications" : "notifications-off-outline",
      label: "Notifications",
      value: notificationsEnabled ? "Activées" : "Désactivées",
      positive: notificationsEnabled,
    },
    {
      icon: firebaseReady ? "cloud-done-outline" : "cloud-offline-outline",
      label: "Synchronisation",
      value: firebaseReady ? "Opérationnelle" : "À vérifier",
      positive: Boolean(firebaseReady),
    },
    {
      icon: updateAvailable ? "cloud-download-outline" : "shield-checkmark-outline",
      label: "Version",
      value: updateAvailable ? "Mise à jour" : installedVersion,
      positive: !updateAvailable,
    },
  ] as const;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>ÉTAT DE L’APPLICATION</Text>
          <Text style={styles.title}>Tout en un coup d’œil</Text>
        </View>
        <View style={styles.brandDot} />
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={[styles.iconBox, item.positive && styles.iconBoxPositive]}>
              <Ionicons name={item.icon} size={19} color={item.positive ? "#8CE06A" : Theme.colors.goldLight} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.value, item.positive && styles.valuePositive]} numberOfLines={1}>{item.value}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#fff", fontSize: 21, fontWeight: "900", marginTop: 4 },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.goldLight, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.7, shadowRadius: 10 },
  grid: { flexDirection: "row", gap: 9 },
  item: { flex: 1, minWidth: 0, padding: 11, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  iconBox: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.09)", marginBottom: 10 },
  iconBoxPositive: { backgroundColor: "rgba(140,224,106,0.09)" },
  label: { color: Theme.colors.textSubtle, fontSize: 9, fontWeight: "800" },
  value: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", marginTop: 3 },
  valuePositive: { color: "#9AE77D" },
});
