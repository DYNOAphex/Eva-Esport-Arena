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
  const healthy = notificationsEnabled && firebaseReady && !updateAvailable;
  const items = [
    { icon: notificationsEnabled ? "notifications" : "notifications-off-outline", label: "Notifications", value: notificationsEnabled ? "Actives" : "Coupées", ok: notificationsEnabled },
    { icon: firebaseReady ? "cloud-done-outline" : "cloud-offline-outline", label: "Cloud", value: firebaseReady ? "Synchronisé" : "À vérifier", ok: Boolean(firebaseReady) },
    { icon: updateAvailable ? "cloud-download-outline" : "shield-checkmark-outline", label: "Version", value: updateAvailable ? "Mise à jour" : installedVersion, ok: !updateAvailable },
  ] as const;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>ÉTAT DYNO</Text>
          <Text style={styles.title}>{healthy ? "Application prête" : "À vérifier"}</Text>
        </View>
        <View style={[styles.healthPill, healthy ? styles.healthPillOk : styles.healthPillWarn]}>
          <Ionicons name={healthy ? "checkmark-circle" : "alert-circle"} size={13} color={healthy ? "#83DD57" : "#FFCB6B"} />
          <Text style={[styles.healthText, healthy ? styles.healthTextOk : styles.healthTextWarn]}>{healthy ? "OK" : "ACTION"}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.label}>
            <View style={styles.item}>
              <View style={[styles.iconBox, item.ok && styles.iconBoxPositive]}>
                <Ionicons name={item.icon} size={17} color={item.ok ? "#83DD57" : Theme.colors.goldLight} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[styles.value, item.ok && styles.valuePositive]} numberOfLines={1}>{item.value}</Text>
            </View>
            {index < items.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 3 },
  healthPill: { minHeight: 27, paddingHorizontal: 9, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth },
  healthPillOk: { backgroundColor: "rgba(131,221,87,0.08)", borderColor: "rgba(131,221,87,0.25)" },
  healthPillWarn: { backgroundColor: "rgba(255,203,107,0.08)", borderColor: "rgba(255,203,107,0.25)" },
  healthText: { fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  healthTextOk: { color: "#83DD57" },
  healthTextWarn: { color: "#FFCB6B" },
  list: { borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.025)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)" },
  item: { minHeight: 53, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  iconBoxPositive: { backgroundColor: "rgba(131,221,87,0.07)" },
  label: { flex: 1, color: "#C9C9C9", fontSize: 10, fontWeight: "800" },
  value: { maxWidth: "45%", color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900" },
  valuePositive: { color: "#9AE77D" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 52, backgroundColor: "rgba(255,255,255,0.07)" },
});
