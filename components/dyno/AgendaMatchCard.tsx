import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type AgendaMatchCardProps = {
  day: string;
  month: string;
  type: string;
  status: string;
  countdown: string;
  opponent: string;
  arrivalTime: string;
  matchTime: string;
  arena: string;
  available: number;
  unavailable: number;
  pending: number;
  confirmationThreshold: number;
  needsResponse?: boolean;
  onOpenResponses?: () => void;
  children?: ReactNode;
};

export default function AgendaMatchCard({
  day,
  month,
  type,
  status,
  countdown,
  opponent,
  arrivalTime,
  matchTime,
  arena,
  available,
  unavailable,
  pending,
  confirmationThreshold,
  needsResponse = false,
  onOpenResponses,
  children,
}: AgendaMatchCardProps) {
  const progress = Math.min(1, available / Math.max(confirmationThreshold, 1));
  const confirmed = status === "Confirmé";
  const cancelled = status === "Annulé";

  return (
    <GlassCard style={[styles.card, needsResponse && styles.cardPriority]} strong>
      {needsResponse ? (
        <View style={styles.priorityBanner}>
          <Ionicons name="alert-circle" size={15} color="#080808" />
          <Text style={styles.priorityText}>RÉPONSE REQUISE</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>

        <View style={styles.headerBody}>
          <View style={styles.metaRow}>
            <Text style={styles.type}>{type.toUpperCase()}</Text>
            <View style={[styles.statusBadge, confirmed && styles.statusConfirmed, cancelled && styles.statusCancelled]}>
              <Text style={[styles.statusText, confirmed && styles.statusTextDark]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      </View>

      <View style={styles.versusRow}>
        <Text style={styles.dyno}>DYNO</Text>
        <Text style={styles.vs}>VS</Text>
        <Text style={styles.opponent} numberOfLines={1}>{opponent.toUpperCase()}</Text>
      </View>

      <View style={styles.infoRow}>
        <Info icon="people-outline" label="RDV" value={arrivalTime} />
        <Info icon="time-outline" label="MATCH" value={matchTime} />
        <Info icon="business-outline" label="ARÈNE" value={arena} />
      </View>

      <TouchableOpacity style={styles.progressCard} onPress={onOpenResponses} disabled={!onOpenResponses} activeOpacity={0.8}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>{available} / {confirmationThreshold} joueurs requis</Text>
          {onOpenResponses ? <Ionicons name="chevron-forward" size={16} color="#A0A0A0" /> : null}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.responseRow}>
          <Text style={styles.available}>● {available}</Text>
          <Text style={styles.unavailable}>● {unavailable}</Text>
          <Text style={styles.pending}>● {pending} en attente</Text>
        </View>
      </TouchableOpacity>

      {children}
    </GlassCard>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={16} color={Theme.colors.goldLight} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 15, overflow: "hidden" },
  cardPriority: { borderColor: "rgba(246,215,106,0.72)" },
  priorityBanner: { marginHorizontal: -15, marginTop: -15, marginBottom: 13, minHeight: 32, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight },
  priorityText: { color: "#080808", fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  header: { flexDirection: "row", alignItems: "center" },
  dateBox: { width: 54, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#F3EFE5", marginRight: 12 },
  day: { color: "#111", fontSize: 23, fontWeight: "900" },
  month: { color: "#78621D", fontSize: 9, fontWeight: "900" },
  headerBody: { flex: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  type: { flex: 1, color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(224,184,67,0.15)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(224,184,67,0.48)" },
  statusConfirmed: { backgroundColor: "#83DD57", borderColor: "#83DD57" },
  statusCancelled: { backgroundColor: "rgba(255,90,90,0.16)", borderColor: "rgba(255,100,100,0.5)" },
  statusText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  statusTextDark: { color: "#080808" },
  countdown: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 8 },
  versusRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 15 },
  dyno: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  vs: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900" },
  opponent: { flex: 1, color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  infoRow: { flexDirection: "row", gap: 7, marginTop: 13 },
  infoItem: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: 14, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { color: "#858585", fontSize: 7, fontWeight: "900" },
  infoValue: { color: "#F2F2F2", fontSize: 10, fontWeight: "900", marginTop: 2 },
  progressCard: { marginTop: 13, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: "#F2F2F2", fontSize: 11, fontWeight: "900" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden", marginTop: 10, backgroundColor: "rgba(255,255,255,0.1)" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: Theme.colors.goldLight },
  responseRow: { flexDirection: "row", justifyContent: "space-between", gap: 6, marginTop: 9 },
  available: { color: "#83DD57", fontSize: 9, fontWeight: "900" },
  unavailable: { color: "#FF7777", fontSize: 9, fontWeight: "900" },
  pending: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
});
