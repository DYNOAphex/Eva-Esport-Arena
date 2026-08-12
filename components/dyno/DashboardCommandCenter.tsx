import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getValidSession } from "../../services/authService";
import { Availability, getMatches, Match, setMatchAvailability, subscribeToMatches, toMatchDate } from "../../services/matchStore";
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

type QuickAvailability = Exclude<Availability, "En attente">;

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
  const ready = hasMatch && pending === 0 && available > 0;
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUid, setCurrentUid] = useState<string | undefined>();
  const [currentEmail, setCurrentEmail] = useState<string | undefined>();
  const [savingAvailability, setSavingAvailability] = useState<QuickAvailability | null>(null);

  useEffect(() => {
    let active = true;
    void getMatches().then((items) => { if (active) setMatches(items); }).catch(() => null);
    void getValidSession().then((session) => {
      if (!active || !session) return;
      setCurrentUid(session.localId);
      setCurrentEmail(session.email);
    }).catch(() => null);
    const unsubscribe = subscribeToMatches((items) => { if (active) setMatches(items); });
    return () => { active = false; unsubscribe(); };
  }, []);

  const nextMatch = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((match) => {
        const date = toMatchDate(match);
        return Boolean(date && date.getTime() >= now && match.status !== "Annulé");
      })
      .sort((a, b) => (toMatchDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (toMatchDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER))[0];
  }, [matches]);

  const myAvailability = useMemo<Availability>(() => {
    if (!nextMatch) return "En attente";
    const emailName = currentEmail?.split("@")[0]?.trim().toLowerCase();
    const response = nextMatch.responses.find((item) =>
      Boolean(currentUid && item.uid === currentUid)
      || Boolean(!item.uid && emailName && item.player.trim().toLowerCase() === emailName),
    );
    return response?.status ?? "En attente";
  }, [currentEmail, currentUid, nextMatch]);

  async function answerAvailability(value: QuickAvailability) {
    if (!nextMatch || savingAvailability) return;
    setSavingAvailability(value);
    try {
      await setMatchAvailability(nextMatch.id, value);
    } catch (error) {
      Alert.alert("Disponibilité", error instanceof Error ? error.message : "Ta réponse n’a pas pu être enregistrée.");
    } finally {
      setSavingAvailability(null);
    }
  }

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={[styles.iconBox, hasMatch && styles.iconBoxActive]}>
          <Ionicons name={hasMatch ? "trophy-outline" : "flash-outline"} size={20} color={Theme.colors.goldLight} />
        </View>
        <View style={styles.headerText}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>{hasMatch ? "MATCH CENTER" : "CENTRE DE COMMANDE"}</Text>
            {hasMatch ? <View style={[styles.statusPill, ready ? styles.statusPillReady : styles.statusPillPending]}><View style={[styles.statusDot, ready ? styles.statusDotReady : styles.statusDotPending]} /><Text style={styles.statusText}>{ready ? "PRÊTE" : "EN PRÉPARATION"}</Text></View> : null}
          </View>
          <Text style={styles.title} numberOfLines={2}>{hasMatch ? `DYNO  VS  ${opponent}` : "Ton équipe est prête"}</Text>
          {hasMatch ? (
            <View style={styles.metaRow}>
              {dateLabel ? <Meta icon="calendar-outline" value={dateLabel} /> : null}
              {matchTime ? <Meta icon="time-outline" value={matchTime} /> : null}
              {arena ? <Meta icon="location-outline" value={arena} /> : null}
            </View>
          ) : <Text style={styles.meta}>Aucun scrim planifié pour le moment</Text>}
        </View>
      </View>

      {hasMatch ? (
        <View style={styles.readinessBanner}>
          <View style={styles.readinessMain}>
            <Ionicons name={ready ? "checkmark-circle" : "people-outline"} size={22} color={ready ? Theme.colors.success : Theme.colors.warning} />
            <View style={styles.readinessCopy}>
              <Text style={styles.readinessTitle}>{ready ? "ÉQUIPE PRÊTE" : "COMPOSITION EN PRÉPARATION"}</Text>
              <Text style={styles.readinessSubtitle}>{ready ? "Tous les joueurs attendus ont répondu." : `${pending} joueur${pending > 1 ? "s" : ""} en attente de réponse.`}</Text>
            </View>
          </View>
          <Text style={styles.readinessRatio}>{available} dispo.</Text>
        </View>
      ) : null}

      {hasMatch && nextMatch ? (
        <View style={styles.availabilityPanel}>
          <View style={styles.availabilityHeader}>
            <View>
              <Text style={styles.availabilityKicker}>MA DISPONIBILITÉ</Text>
              <Text style={styles.availabilityHint}>Réponds directement pour ce match</Text>
            </View>
            <View style={[styles.myStatusPill, myAvailability === "Disponible" ? styles.myStatusAvailable : myAvailability === "Indisponible" ? styles.myStatusUnavailable : styles.myStatusPending]}>
              <View style={[styles.myStatusDot, myAvailability === "Disponible" ? styles.dotAvailable : myAvailability === "Indisponible" ? styles.dotUnavailable : styles.dotPending]} />
              <Text style={styles.myStatusText}>{myAvailability.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.availabilityActions}>
            <AvailabilityButton
              icon="checkmark-circle-outline"
              label="Disponible"
              selected={myAvailability === "Disponible"}
              disabled={Boolean(savingAvailability)}
              loading={savingAvailability === "Disponible"}
              onPress={() => void answerAvailability("Disponible")}
            />
            <AvailabilityButton
              icon="close-circle-outline"
              label="Indisponible"
              selected={myAvailability === "Indisponible"}
              danger
              disabled={Boolean(savingAvailability)}
              loading={savingAvailability === "Indisponible"}
              onPress={() => void answerAvailability("Indisponible")}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.metricsRow}>
        <Metric value={available} label="Disponibles" positive />
        <View style={styles.metricSeparator} />
        <Metric value={pending} label="Sans réponse" warning={pending > 0} />
        <View style={styles.metricSeparator} />
        <View style={styles.metric}>
          <Ionicons name={ready ? "checkmark-done" : "hourglass-outline"} size={20} color={ready ? Theme.colors.success : "#BEBEBE"} />
          <Text style={[styles.metricLabel, ready && styles.metricLabelReady]}>{ready ? "VALIDÉ" : "À SUIVRE"}</Text>
        </View>
      </View>

      {!healthy ? (
        <View style={styles.alertBox}>
          <Ionicons name="warning-outline" size={16} color={Theme.colors.warning} />
          <Text style={styles.alertText}>{!firebaseReady ? "Synchronisation Firebase à vérifier." : "Notifications à activer sur cet appareil."}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Action icon="calendar-outline" label="Agenda" onPress={onOpenAgenda} />
        <Action icon="add" label="Nouveau scrim" primary onPress={onCreateScrim} />
        <Action icon="people-outline" label="Équipe" onPress={onOpenTeam} />
      </View>
    </GlassCard>
  );
}

function Meta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return <View style={styles.metaItem}><Ionicons name={icon} size={11} color="#C7C7C7" /><Text style={styles.metaItemText} numberOfLines={1}>{value}</Text></View>;
}

function Metric({ value, label, positive = false, warning = false }: { value: number; label: string; positive?: boolean; warning?: boolean }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, positive && styles.metricValuePositive, warning && styles.metricValueWarning]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function AvailabilityButton({ icon, label, selected, danger = false, loading = false, disabled = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; selected: boolean; danger?: boolean; loading?: boolean; disabled?: boolean; onPress: () => void }) {
  const activeColor = danger ? Theme.colors.danger : Theme.colors.success;
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected, disabled }} style={[styles.availabilityButton, selected && (danger ? styles.availabilityButtonDanger : styles.availabilityButtonAvailable), disabled && styles.availabilityButtonDisabled]} onPress={onPress} disabled={disabled} activeOpacity={0.82}>
      <Ionicons name={loading ? "sync-outline" : icon} size={17} color={selected ? activeColor : "#BDBDBD"} />
      <Text style={[styles.availabilityButtonText, selected && { color: activeColor }]}>{loading ? "Enregistrement…" : label}</Text>
    </TouchableOpacity>
  );
}

function Action({ icon, label, primary = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; primary?: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" style={[styles.action, primary && styles.actionPrimary]} onPress={onPress} activeOpacity={0.82}><Ionicons name={icon} size={17} color={primary ? "#080808" : Theme.colors.goldLight} /><Text style={[styles.actionText, primary && styles.actionTextPrimary]} numberOfLines={1}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.15)" },
  iconBoxActive: { backgroundColor: "rgba(246,215,106,0.14)", borderColor: "rgba(246,215,106,0.34)" },
  headerText: { flex: 1, minWidth: 0 }, kickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 }, kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.25 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }, statusPillReady: { backgroundColor: "rgba(131,221,87,0.10)", borderColor: "rgba(131,221,87,0.28)" }, statusPillPending: { backgroundColor: "rgba(255,203,107,0.08)", borderColor: "rgba(255,203,107,0.22)" }, statusDot: { width: 5, height: 5, borderRadius: 99 }, statusDotReady: { backgroundColor: Theme.colors.success }, statusDotPending: { backgroundColor: Theme.colors.warning }, statusText: { color: "#D7D7D7", fontSize: 7, fontWeight: "900", letterSpacing: 0.45 },
  title: { color: "#FFFFFF", fontSize: 17, lineHeight: 21, fontWeight: "900", marginTop: 4 }, meta: { color: "#A9A9A9", fontSize: 9, marginTop: 4 }, metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 5 }, metaItem: { flexDirection: "row", alignItems: "center", gap: 3, maxWidth: "48%" }, metaItemText: { color: "#C7C7C7", fontSize: 9, fontWeight: "700" },
  readinessBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: 11, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" }, readinessMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 }, readinessCopy: { flex: 1 }, readinessTitle: { color: "#F4F4F4", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, readinessSubtitle: { color: "#9F9F9F", fontSize: 8, marginTop: 2 }, readinessRatio: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", marginLeft: 7 },
  availabilityPanel: { marginTop: 9, padding: 11, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.15)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.16)" }, availabilityHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, availabilityKicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, availabilityHint: { color: Theme.colors.textSubtle, fontSize: 8, marginTop: 2 }, myStatusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth }, myStatusAvailable: { backgroundColor: "rgba(131,221,87,0.07)", borderColor: "rgba(131,221,87,0.22)" }, myStatusUnavailable: { backgroundColor: "rgba(255,119,119,0.06)", borderColor: "rgba(255,119,119,0.22)" }, myStatusPending: { backgroundColor: "rgba(255,203,107,0.06)", borderColor: "rgba(255,203,107,0.2)" }, myStatusDot: { width: 6, height: 6, borderRadius: 99 }, dotAvailable: { backgroundColor: Theme.colors.success }, dotUnavailable: { backgroundColor: Theme.colors.danger }, dotPending: { backgroundColor: Theme.colors.warning }, myStatusText: { color: "#D1D1D1", fontSize: 7, fontWeight: "900" }, availabilityActions: { flexDirection: "row", gap: 7, marginTop: 10 }, availabilityButton: { flex: 1, minHeight: 40, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }, availabilityButtonAvailable: { borderColor: "rgba(131,221,87,0.4)", backgroundColor: "rgba(131,221,87,0.08)" }, availabilityButtonDanger: { borderColor: "rgba(255,119,119,0.38)", backgroundColor: "rgba(255,119,119,0.07)" }, availabilityButtonDisabled: { opacity: 0.62 }, availabilityButtonText: { color: "#BDBDBD", fontSize: 9, fontWeight: "900" },
  metricsRow: { minHeight: 64, flexDirection: "row", alignItems: "center", marginTop: 9, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" }, metric: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 55 }, metricSeparator: { width: StyleSheet.hairlineWidth, height: 35, backgroundColor: "rgba(255,255,255,0.13)" }, metricValue: { color: Theme.colors.goldLight, fontSize: 20, fontWeight: "900" }, metricValuePositive: { color: Theme.colors.success }, metricValueWarning: { color: Theme.colors.warning }, metricLabel: { color: "#9F9F9F", fontSize: 8, fontWeight: "800", marginTop: 2 }, metricLabelReady: { color: Theme.colors.success },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: 13, backgroundColor: "rgba(255,178,54,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,203,107,0.24)" }, alertText: { flex: 1, color: "#FFD99A", fontSize: 9, lineHeight: 14 },
  actions: { flexDirection: "row", gap: 7, marginTop: 11 }, action: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.35)", backgroundColor: "rgba(0,0,0,0.10)", paddingHorizontal: 7 }, actionPrimary: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 4 }, actionText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900" }, actionTextPrimary: { color: "#080808" },
});