import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type AdminOverviewProps = {
  confirmationThreshold: number;
  notificationsEnabled: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  firebaseReady?: boolean;
};

export default function AdminOverview({
  confirmationThreshold,
  notificationsEnabled,
  reminder24h,
  reminder1h,
  firebaseReady,
}: AdminOverviewProps) {
  const activeReminders = [reminder24h, reminder1h].filter(Boolean).length;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark-outline" size={22} color={Theme.colors.goldLight} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>GESTION DE L’ÉQUIPE</Text>
          <Text style={styles.title}>Paramètres des scrims</Text>
        </View>
        <View style={[styles.syncDot, firebaseReady && styles.syncDotReady]} />
      </View>

      <View style={styles.grid}>
        <Stat icon="people-outline" value={String(confirmationThreshold)} label="Joueurs requis" />
        <Stat icon="notifications-outline" value={notificationsEnabled ? "ON" : "OFF"} label="Notifications" />
        <Stat icon="alarm-outline" value={String(activeReminders)} label="Rappels actifs" />
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="information-circle-outline" size={16} color="#A7A7A7" />
        <Text style={styles.hint}>Le seuil confirme automatiquement un scrim dès que suffisamment de joueurs sont disponibles.</Text>
      </View>
    </GlassCard>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={Theme.colors.goldLight} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 },
  syncDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "#FF7777" },
  syncDotReady: { backgroundColor: "#83DD57" },
  grid: { flexDirection: "row", gap: 8, marginTop: 15 },
  stat: { flex: 1, minWidth: 0, minHeight: 78, borderRadius: 16, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  value: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 5 },
  label: { color: "#999999", fontSize: 8, fontWeight: "800", textAlign: "center", marginTop: 3 },
  hintRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 14 },
  hint: { flex: 1, color: "#B8B8B8", fontSize: 10, lineHeight: 15 },
});
