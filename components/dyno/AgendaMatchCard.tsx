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
  arrivalTime?: string;
  matchTime: string;
  matchTimeAlt?: string;
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
  matchTime,
  matchTimeAlt,
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
  const teamReady = confirmed || (available >= confirmationThreshold && pending === 0);

  return (
    <GlassCard style={[styles.card, needsResponse && styles.cardPriority]} strong>
      <View style={styles.topLine} />
      <View style={styles.header}>
        <View style={styles.dateBox}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>

        <View style={styles.headerBody}>
          <View style={styles.metaRow}>
            <Text style={styles.type}>{type.toUpperCase()}</Text>
            <View style={[styles.statusBadge, confirmed && styles.statusConfirmed, cancelled && styles.statusCancelled]}>
              <View style={[styles.statusDot, confirmed && styles.statusDotConfirmed, cancelled && styles.statusDotCancelled]} />
              <Text style={[styles.statusText, confirmed && styles.statusTextConfirmed, cancelled && styles.statusTextCancelled]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      </View>

      {needsResponse ? (
        <View style={styles.priorityBanner}>
          <View style={styles.priorityIcon}><Ionicons name="notifications" size={15} color="#080808" /></View>
          <View style={styles.priorityBody}>
            <Text style={styles.priorityText}>TA RÉPONSE EST ATTENDUE</Text>
            <Text style={styles.prioritySub}>Indique ta disponibilité pour ce rendez-vous.</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.versusRow}>
        <View style={styles.teamTag}><Text style={styles.dyno}>DYNO</Text></View>
        <Text style={styles.vs}>VS</Text>
        <Text style={styles.opponent} numberOfLines={1}>{opponent.toUpperCase()}</Text>
      </View>

      <View style={styles.infoRow}>
        <Info icon="time-outline" label={matchTimeAlt ? "CRÉNEAUX" : "HEURE"} value={formatTimeOptions(matchTime, matchTimeAlt)} />
        <Info icon="location-outline" label="ARÈNE" value={arena} />
      </View>

      <TouchableOpacity style={styles.progressCard} onPress={onOpenResponses} disabled={!onOpenResponses} activeOpacity={0.8}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressEyebrow}>PRÉPARATION ÉQUIPE</Text>
            <Text style={styles.progressTitle}>{available} / {confirmationThreshold} joueurs requis</Text>
          </View>
          <View style={[styles.readyPill, teamReady && styles.readyPillActive]}>
            <Ionicons name={teamReady ? "checkmark" : "people-outline"} size={12} color={teamReady ? "#84D956" : "#BEBEBE"} />
            <Text style={[styles.readyText, teamReady && styles.readyTextActive]}>{teamReady ? "PRÊTE" : "EN COURS"}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <View style={styles.responseRow}>
          <ResponseStat color="#83DD57" value={available} label="dispo" />
          <ResponseStat color="#FF7777" value={unavailable} label="absent" />
          <ResponseStat color={Theme.colors.goldLight} value={pending} label="attente" />
          {onOpenResponses ? <Ionicons name="chevron-forward" size={17} color="#8F8F8F" /> : null}
        </View>
      </TouchableOpacity>

      {children}
    </GlassCard>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}><Ionicons name={icon} size={16} color={Theme.colors.goldLight} /></View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ResponseStat({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <View style={styles.responseStat}>
      <View style={[styles.responseDot, { backgroundColor: color }]} />
      <Text style={styles.responseValue}>{value}</Text>
      <Text style={styles.responseLabel}>{label}</Text>
    </View>
  );
}

function formatTime(value?: string) {
  return value ? value.replace(":", "h") : "--h--";
}

function formatTimeOptions(first: string, second?: string) {
  return second ? `${formatTime(first)} ou ${formatTime(second)}` : formatTime(first);
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, overflow: "hidden" },
  cardPriority: { borderColor: "rgba(255,224,120,0.52)" },
  topLine: { position: "absolute", left: 22, right: 22, top: 0, height: 1, backgroundColor: "rgba(255,224,120,0.34)" },
  header: { flexDirection: "row", alignItems: "center" },
  dateBox: { width: 52, height: 58, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.94)", marginRight: 12 },
  day: { color: "#111", fontSize: 22, fontWeight: "900", lineHeight: 24 },
  month: { color: "#7A6420", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  headerBody: { flex: 1, minWidth: 0 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  type: { flex: 1, color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 0.9 },
  statusBadge: { minHeight: 26, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,224,120,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,120,0.24)" },
  statusConfirmed: { backgroundColor: "rgba(132,217,86,0.08)", borderColor: "rgba(132,217,86,0.22)" },
  statusCancelled: { backgroundColor: "rgba(255,90,90,0.08)", borderColor: "rgba(255,100,100,0.22)" },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.goldLight },
  statusDotConfirmed: { backgroundColor: "#84D956" },
  statusDotCancelled: { backgroundColor: "#FF7777" },
  statusText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900" },
  statusTextConfirmed: { color: "#9DDD7A" },
  statusTextCancelled: { color: "#FF9A9A" },
  countdown: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginTop: 7 },
  priorityBanner: { minHeight: 48, marginTop: 12, borderRadius: 14, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: Theme.colors.goldLight },
  priorityIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.10)", alignItems: "center", justifyContent: "center" },
  priorityBody: { flex: 1 },
  priorityText: { color: "#080808", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  prioritySub: { color: "rgba(8,8,8,0.68)", fontSize: 8, fontWeight: "700", marginTop: 2 },
  versusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  teamTag: { minHeight: 30, paddingHorizontal: 10, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.055)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" },
  dyno: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", letterSpacing: 0.6 },
  vs: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  opponent: { flex: 1, color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  infoRow: { flexDirection: "row", gap: 7, marginTop: 12 },
  infoItem: { flex: 1, minWidth: 0, minHeight: 52, borderRadius: 14, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.085)" },
  infoIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,224,120,0.07)" },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { color: "#969696", fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  infoValue: { color: "#F3F3F3", fontSize: 10, fontWeight: "900", marginTop: 2 },
  progressCard: { marginTop: 12, padding: 11, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.085)" },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  progressEyebrow: { color: "#909090", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  progressTitle: { color: "#F2F2F2", fontSize: 10, fontWeight: "900", marginTop: 2 },
  readyPill: { minHeight: 25, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.08)" },
  readyPillActive: { backgroundColor: "rgba(132,217,86,0.07)", borderColor: "rgba(132,217,86,0.20)" },
  readyText: { color: "#A5A5A5", fontSize: 7, fontWeight: "900", letterSpacing: 0.6 },
  readyTextActive: { color: "#9DDD7A" },
  progressTrack: { height: 5, borderRadius: 999, overflow: "hidden", marginTop: 9, backgroundColor: "rgba(255,255,255,0.08)" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: Theme.colors.goldLight },
  responseRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  responseStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  responseDot: { width: 6, height: 6, borderRadius: 3 },
  responseValue: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  responseLabel: { color: "#9F9F9F", fontSize: 8, fontWeight: "700" },
});