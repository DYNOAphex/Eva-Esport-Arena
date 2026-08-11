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

export default function AdminOverview({ confirmationThreshold, notificationsEnabled, reminder24h, reminder1h, firebaseReady }: AdminOverviewProps) {
  const activeReminders = [reminder24h, reminder1h].filter(Boolean).length;
  const status = firebaseReady ? "Synchronisé" : "À vérifier";

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.headerIcon}><Ionicons name="shield-checkmark-outline" size={19} color={Theme.colors.goldLight} /></View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>RÈGLES DE L’ÉQUIPE</Text>
          <Text style={styles.title}>Gestion des scrims</Text>
        </View>
        <View style={[styles.syncPill, firebaseReady && styles.syncPillReady]}>
          <View style={[styles.syncDot, firebaseReady && styles.syncDotReady]} />
          <Text style={[styles.syncText, firebaseReady && styles.syncTextReady]}>{status}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Stat icon="people-outline" value={String(confirmationThreshold)} label="joueurs requis" />
        <Stat icon="notifications-outline" value={notificationsEnabled ? "ON" : "OFF"} label="notifications" positive={notificationsEnabled} />
        <Stat icon="alarm-outline" value={String(activeReminders)} label="rappels actifs" />
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="flash-outline" size={14} color={Theme.colors.goldLight} />
        <Text style={styles.hint}>Un scrim passe automatiquement en confirmé dès que le seuil de joueurs disponibles est atteint.</Text>
      </View>
    </GlassCard>
  );
}

function Stat({ icon, value, label, positive = false }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; positive?: boolean }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={15} color={positive ? "#83DD57" : Theme.colors.goldLight} />
      <View style={styles.statText}>
        <Text style={[styles.value, positive && styles.valuePositive]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 15 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.16)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 3 },
  syncPill: { minHeight: 25, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,119,119,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,119,119,0.18)" },
  syncPillReady: { backgroundColor: "rgba(131,221,87,0.06)", borderColor: "rgba(131,221,87,0.2)" },
  syncDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#FF7777" },
  syncDotReady: { backgroundColor: "#83DD57" },
  syncText: { color: "#D99595", fontSize: 7, fontWeight: "900" },
  syncTextReady: { color: "#91D975" },
  row: { flexDirection: "row", gap: 7, marginTop: 13 },
  stat: { flex: 1, minWidth: 0, minHeight: 58, borderRadius: 14, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)" },
  statText: { flex: 1, minWidth: 0 },
  value: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  valuePositive: { color: "#83DD57" },
  label: { color: "#929292", fontSize: 7, fontWeight: "800", marginTop: 1 },
  hintRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 11, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.07)" },
  hint: { flex: 1, color: "#AFAFAF", fontSize: 9, lineHeight: 14 },
});
