import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type DashboardCommandCenterProps = {
  opponent?: string;
  dateLabel?: string;
  matchTime?: string;
  arena?: string;
  available: number;
  pending: number;
  firebaseReady?: boolean;
  notificationsReady?: boolean;
  onOpenAgenda: () => void;
  onCreateScrim: () => void;
  onOpenTeam: () => void;
};

export default function DashboardCommandCenter({
  opponent,
  dateLabel,
  matchTime,
  available,
  pending,
  firebaseReady,
  notificationsReady,
  onOpenAgenda,
  onCreateScrim,
  onOpenTeam,
}: DashboardCommandCenterProps) {
  const hasMatch = Boolean(opponent);
  const healthy = firebaseReady && notificationsReady;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="grid-outline" size={21} color={Theme.colors.goldLight} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>CENTRE DE COMMANDE</Text>
          <Text style={styles.title}>{hasMatch ? "Équipe prête pour le prochain scrim" : "Aucun scrim planifié"}</Text>
          {hasMatch ? <Text style={styles.meta}>{[dateLabel, matchTime].filter(Boolean).join(" · ")}</Text> : null}
        </View>
        <View style={[styles.healthDot, healthy && styles.healthDotReady]} />
      </View>

      <View style={styles.metricsRow}>
        <Metric value={available} label="Disponibles" positive />
        <View style={styles.metricSeparator} />
        <Metric value={pending} label="Sans réponse" />
      </View>

      {!healthy ? (
        <View style={styles.alertBox}>
          <Ionicons name="warning-outline" size={16} color="#FFCB6B" />
          <Text style={styles.alertText}>{!firebaseReady ? "Synchronisation Firebase à vérifier." : "Notifications à activer sur cet appareil."}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Action icon="calendar-outline" label="Agenda" onPress={onOpenAgenda} />
        <Action icon="add-circle-outline" label="Créer" primary onPress={onCreateScrim} />
        <Action icon="people-outline" label="Équipe" onPress={onOpenTeam} />
      </View>
    </GlassCard>
  );
}

function Metric({ value, label, positive = false }: { value: number; label: string; positive?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, positive && styles.metricValuePositive]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Action({ icon, label, primary = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; primary?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.action, primary && styles.actionPrimary]} onPress={onPress}>
      <Ionicons name={icon} size={17} color={primary ? "#080808" : Theme.colors.goldLight} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginTop: 3 },
  meta: { color: "#9F9F9F", fontSize: 9, marginTop: 4 },
  healthDot: { width: 9, height: 9, borderRadius: 999, backgroundColor: "#FF7777" },
  healthDotReady: { backgroundColor: "#83DD57" },
  metricsRow: { minHeight: 61, flexDirection: "row", alignItems: "center", marginTop: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)" },
  metric: { flex: 1, alignItems: "center", justifyContent: "center" },
  metricSeparator: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: "rgba(255,255,255,0.12)" },
  metricValue: { color: Theme.colors.goldLight, fontSize: 19, fontWeight: "900" },
  metricValuePositive: { color: "#83DD57" },
  metricLabel: { color: "#9B9B9B", fontSize: 8, fontWeight: "800", marginTop: 2 },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 13, backgroundColor: "rgba(255,178,54,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,203,107,0.24)" },
  alertText: { flex: 1, color: "#FFD99A", fontSize: 9, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 7, marginTop: 11 },
  action: { flex: 1, minHeight: 42, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.35)" },
  actionPrimary: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  actionText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  actionTextPrimary: { color: "#080808" },
});