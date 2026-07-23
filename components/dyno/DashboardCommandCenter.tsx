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
        <View style={styles.iconBox}>
          <Ionicons name="grid-outline" size={22} color={Theme.colors.goldLight} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>CENTRE DE COMMANDE</Text>
          <Text style={styles.title}>{hasMatch ? "Prochain rendez-vous" : "Équipe prête"}</Text>
        </View>
        <View style={[styles.healthDot, healthy && styles.healthDotReady]} />
      </View>

      {hasMatch ? (
        <View style={styles.matchBox}>
          <Text style={styles.vs}>DYNO VS {opponent?.toUpperCase()}</Text>
          <Text style={styles.meta}>{[dateLabel, matchTime, arena].filter(Boolean).join(" · ")}</Text>
          <View style={styles.stats}>
            <Metric value={available} label="Disponibles" positive />
            <Metric value={pending} label="Sans réponse" />
          </View>
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-clear-outline" size={25} color="#8D8D8D" />
          <Text style={styles.emptyTitle}>Aucun scrim à venir</Text>
          <Text style={styles.emptyText}>Crée un rendez-vous pour commencer à suivre les disponibilités.</Text>
        </View>
      )}

      {!healthy ? (
        <View style={styles.alertBox}>
          <Ionicons name="warning-outline" size={17} color="#FFCB6B" />
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
      <Ionicons name={icon} size={18} color={primary ? "#080808" : Theme.colors.goldLight} />
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 4 },
  healthDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: "#FF7777" },
  healthDotReady: { backgroundColor: "#83DD57" },
  matchBox: { marginTop: 15, padding: 15, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  vs: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  meta: { color: "#A9A9A9", fontSize: 10, lineHeight: 15, marginTop: 6 },
  stats: { flexDirection: "row", gap: 8, marginTop: 13 },
  metric: { flex: 1, minHeight: 57, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  metricValue: { color: Theme.colors.goldLight, fontSize: 20, fontWeight: "900" },
  metricValuePositive: { color: "#83DD57" },
  metricLabel: { color: "#9B9B9B", fontSize: 8, fontWeight: "800", marginTop: 2 },
  emptyBox: { alignItems: "center", marginTop: 15, padding: 18, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.035)" },
  emptyTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginTop: 9 },
  emptyText: { color: "#969696", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 5 },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 11, borderRadius: 14, backgroundColor: "rgba(255,178,54,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,203,107,0.24)" },
  alertText: { flex: 1, color: "#FFD99A", fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
  action: { flex: 1, minHeight: 46, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.35)" },
  actionPrimary: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  actionText: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900" },
  actionTextPrimary: { color: "#080808" },
});
