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
  arena,
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
        <View style={[styles.iconBox, hasMatch && styles.iconBoxActive]}>
          <Ionicons name={hasMatch ? "flash" : "calendar-outline"} size={20} color={Theme.colors.goldLight} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>{hasMatch ? "PROCHAIN SCRIM" : "CENTRE DE COMMANDE"}</Text>
          <Text style={styles.title} numberOfLines={2}>{hasMatch ? `DYNO vs ${opponent}` : "Ton équipe est prête"}</Text>
          {hasMatch ? (
            <View style={styles.metaRow}>
              {dateLabel ? <Meta icon="calendar-outline" value={dateLabel} /> : null}
              {matchTime ? <Meta icon="time-outline" value={matchTime} /> : null}
              {arena ? <Meta icon="location-outline" value={arena} /> : null}
            </View>
          ) : <Text style={styles.meta}>Aucun scrim planifié pour le moment</Text>}
        </View>
        <View style={[styles.healthDot, healthy && styles.healthDotReady]} />
      </View>

      <View style={styles.metricsRow}>
        <Metric value={available} label="Disponibles" positive />
        <View style={styles.metricSeparator} />
        <Metric value={pending} label="Sans réponse" warning={pending > 0} />
        <View style={styles.metricSeparator} />
        <View style={styles.readiness}>
          <Ionicons name={pending === 0 && available > 0 ? "checkmark-circle" : "people-outline"} size={20} color={pending === 0 && available > 0 ? "#83DD57" : "#BEBEBE"} />
          <Text style={styles.readinessLabel}>{pending === 0 && available > 0 ? "PRÊTE" : "EN COURS"}</Text>
        </View>
      </View>

      {!healthy ? (
        <View style={styles.alertBox}>
          <Ionicons name="warning-outline" size={16} color="#FFCB6B" />
          <Text style={styles.alertText}>{!firebaseReady ? "Synchronisation Firebase à vérifier." : "Notifications à activer sur cet appareil."}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Action icon="calendar-outline" label="Agenda" onPress={onOpenAgenda} />
        <Action icon="add" label="Créer" primary onPress={onCreateScrim} />
        <Action icon="people-outline" label="Équipe" onPress={onOpenTeam} />
      </View>
    </GlassCard>
  );
}

function Meta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={11} color="#C7C7C7" />
      <Text style={styles.metaItemText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Metric({ value, label, positive = false, warning = false }: { value: number; label: string; positive?: boolean; warning?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, positive && styles.metricValuePositive, warning && styles.metricValueWarning]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Action({ icon, label, primary = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; primary?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.action, primary && styles.actionPrimary]} onPress={onPress} activeOpacity={0.82}>
      <Ionicons name={icon} size={17} color={primary ? "#080808" : Theme.colors.goldLight} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.15)" },
  iconBoxActive: { backgroundColor: "rgba(246,215,106,0.14)", borderColor: "rgba(246,215,106,0.34)" },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#FFFFFF", fontSize: 16, lineHeight: 20, fontWeight: "900", marginTop: 3 },
  meta: { color: "#A9A9A9", fontSize: 9, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 5 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3, maxWidth: "48%" },
  metaItemText: { color: "#C7C7C7", fontSize: 9, fontWeight: "700" },
  healthDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: "#FF7777", marginTop: 2 },
  healthDotReady: { backgroundColor: "#83DD57" },
  metricsRow: { minHeight: 67, flexDirection: "row", alignItems: "center", marginTop: 13, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" },
  metric: { flex: 1, alignItems: "center", justifyContent: "center" },
  metricSeparator: { width: StyleSheet.hairlineWidth, height: 37, backgroundColor: "rgba(255,255,255,0.13)" },
  metricValue: { color: Theme.colors.goldLight, fontSize: 20, fontWeight: "900" },
  metricValuePositive: { color: "#83DD57" },
  metricValueWarning: { color: "#FFCB6B" },
  metricLabel: { color: "#9F9F9F", fontSize: 8, fontWeight: "800", marginTop: 2 },
  readiness: { flex: 0.9, alignItems: "center", justifyContent: "center", gap: 2 },
  readinessLabel: { color: "#AFAFAF", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 13, backgroundColor: "rgba(255,178,54,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,203,107,0.24)" },
  alertText: { flex: 1, color: "#FFD99A", fontSize: 9, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 7, marginTop: 11 },
  action: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.35)", backgroundColor: "rgba(0,0,0,0.10)" },
  actionPrimary: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  actionText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  actionTextPrimary: { color: "#080808" },
});
