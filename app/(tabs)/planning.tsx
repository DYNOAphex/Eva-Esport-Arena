import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ImageBackground, Modal, Platform, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { getAppSettings } from "../../services/appSettings";
import { getStoredSession } from "../../services/authService";
import { deleteMatch, duplicateMatch, getMatch, getMatches, setMatchAvailability, subscribeToMatches, updateMatch } from "../../services/matchStore";
import { getRoster, RosterPlayer, subscribeToRoster } from "../../services/rosterStore";
import type { AuthSession } from "../../services/authService";
import type { Availability, Match } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
type AgendaFilter = "upcoming" | "history" | "cancelled";

export default function PlanningScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [confirmationThreshold, setConfirmationThreshold] = useState(4);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [details, setDetails] = useState<Match | null>(null);
  const [filter, setFilter] = useState<AgendaFilter>("upcoming");

  const loadMatches = useCallback(async () => setMatches(await getMatches()), []);

  useEffect(() => {
    void loadMatches();
    void getRoster().then(setRoster);
    void getStoredSession().then(setSession);
    void getScrimPermissions().then((permissions) => setCanManage(permissions.canManage));
    void getAppSettings().then((settings) => setConfirmationThreshold(settings.confirmationThreshold));
    const unsubscribeMatches = subscribeToMatches(setMatches);
    const unsubscribeRoster = subscribeToRoster(setRoster);
    return () => { unsubscribeMatches(); unsubscribeRoster(); };
  }, [loadMatches]);

  const filteredMatches = useMemo(() => {
    const now = Date.now();
    return matches.filter((match) => {
      const timestamp = new Date(`${match.date}T${match.matchTime}:00`).getTime();
      if (filter === "cancelled") return match.status === "Annulé";
      if (filter === "history") return match.status !== "Annulé" && Number.isFinite(timestamp) && timestamp < now;
      return match.status !== "Annulé" && (!Number.isFinite(timestamp) || timestamp >= now);
    });
  }, [matches, filter]);

  function responseForPlayer(match: Match, player: RosterPlayer) {
    return match.responses.find((response) => response.uid === player.accountUid || response.player.trim().toLowerCase() === player.nickname.trim().toLowerCase());
  }

  function getResponseSummary(match: Match) {
    const available = match.responses.filter((item) => item.status === "Disponible").length;
    const unavailable = match.responses.filter((item) => item.status === "Indisponible").length;
    const pendingPlayers = roster.filter((player) => !responseForPlayer(match, player) || responseForPlayer(match, player)?.status === "En attente");
    return { available, unavailable, pendingPlayers };
  }

  async function answer(matchId: string, availability: Exclude<Availability, "En attente">) {
    try {
      setSavingMatchId(matchId);
      await setMatchAvailability(matchId, availability);
      const updated = await getMatch(matchId);
      const available = updated?.responses.filter((response) => response.status === "Disponible").length ?? 0;
      if (updated && updated.status === "En attente" && available >= confirmationThreshold) {
        await updateMatch(matchId, { status: "Confirmé" });
        Alert.alert("Scrim confirmé", `${available} joueurs sont disponibles. Le seuil configuré est de ${confirmationThreshold}.`);
      }
    } catch {
      Alert.alert("Disponibilité", "Ta réponse n'a pas pu être enregistrée.");
    } finally {
      setSavingMatchId(null);
    }
  }

  async function shareMatch(match: Match) {
    const summary = getResponseSummary(match);
    await Share.share({
      title: `DYNO vs ${match.opponent}`,
      message: [
        `⚔️ DYNO vs ${match.opponent}`,
        `📅 ${formatDate(match.date)}`,
        `🕒 Rendez-vous ${match.arrivalTime} • Match ${match.matchTime}`,
        `📍 ${match.arena}`,
        `✅ ${summary.available} disponible(s) • ❌ ${summary.unavailable} indisponible(s)`,
        summary.pendingPlayers.length ? `⏳ Sans réponse : ${summary.pendingPlayers.map((player) => player.nickname).join(", ")}` : "✅ Tout le monde a répondu",
        `Statut : ${match.status}`,
        match.notes ? `📝 ${match.notes}` : "",
      ].filter(Boolean).join("\n"),
    });
  }

  async function addToCalendar(match: Match) {
    try {
      const startDate = new Date(`${match.date}T${match.matchTime}:00`);
      if (Number.isNaN(startDate.getTime())) return Alert.alert("Calendrier", "La date ou l'heure du match n'est pas valide.");
      const endDate = new Date(startDate.getTime() + 90 * 60 * 1000);

      if (Platform.OS === "web") {
        const pad = (value: number) => String(value).padStart(2, "0");
        const toUtc = (value: Date) => `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(value.getUTCSeconds())}Z`;
        const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
        const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DYNO//Esport Manager//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${match.id}@dyno-esport`, `DTSTAMP:${toUtc(new Date())}`, `DTSTART:${toUtc(startDate)}`, `DTEND:${toUtc(endDate)}`, `SUMMARY:${escape(`DYNO vs ${match.opponent}`)}`, `LOCATION:${escape(match.arena)}`, `DESCRIPTION:${escape([`Type : ${match.type}`, `Rendez-vous : ${match.arrivalTime}`, match.notes ?? ""].filter(Boolean).join("\n"))}`, "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Rappel match DYNO", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
        const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `DYNO-${match.opponent}-${match.date}.ics`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        Alert.alert("Calendrier", "Le fichier calendrier a été créé. Ouvre-le pour ajouter le match.");
        return;
      }

      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== "granted") return Alert.alert("Calendrier", "Autorise DYNO à accéder au calendrier dans les réglages du téléphone.");
      await Calendar.createEventInCalendarAsync({ title: `DYNO vs ${match.opponent}`, startDate, endDate, location: match.arena, notes: [`Type : ${match.type}`, `Rendez-vous : ${match.arrivalTime}`, match.notes].filter(Boolean).join("\n"), alarms: [{ relativeOffset: -30 }], timeZone: "Europe/Paris" });
    } catch {
      Alert.alert("Calendrier", "Impossible d'ajouter ce match au calendrier.");
    }
  }

  async function removeMatch(match: Match) {
    try {
      setSavingMatchId(match.id);
      await deleteMatch(match.id);
      setMatches((current) => current.filter((item) => item.id !== match.id));
      if (details?.id === match.id) setDetails(null);
      Alert.alert("Scrim supprimé", "Le match a été supprimé de tous les appareils.");
    } catch (error) {
      Alert.alert("Suppression impossible", error instanceof Error ? error.message : "Le match n'a pas pu être supprimé de Firebase.");
    } finally {
      setSavingMatchId(null);
    }
  }

  function confirmDelete(match: Match) {
    Alert.alert(
      "Supprimer le scrim",
      `DYNO vs ${match.opponent}\n\nCette action est définitive et sera synchronisée sur tous les appareils.`,
      [
        { text: "Retour", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => void removeMatch(match) },
      ],
    );
  }

  function openMoreActions(match: Match) {
    Alert.alert(`DYNO vs ${match.opponent}`, "Actions supplémentaires", [
      { text: match.status === "Annulé" ? "Réactiver" : "Annuler le scrim", onPress: () => void updateMatch(match.id, { status: match.status === "Annulé" ? "En attente" : "Annulé" }) },
      { text: "Supprimer", style: "destructive", onPress: () => confirmDelete(match) },
      { text: "Fermer", style: "cancel" },
    ]);
  }

  function manage(match: Match) {
    Alert.alert(`DYNO vs ${match.opponent}`, "Choisis une action", [
      { text: "Modifier", onPress: () => router.push({ pathname: "/(tabs)/scrims", params: { editId: match.id } }) },
      { text: "Dupliquer", onPress: () => void duplicateMatch(match.id).then((copy) => router.push({ pathname: "/(tabs)/scrims", params: { editId: copy.id } })) },
      { text: "Plus d'actions", onPress: () => openMoreActions(match) },
    ]);
  }

  const detailRows = details ? roster.map((player) => ({ player, response: responseForPlayer(details, player) })) : [];

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Disponibilités, historique et joueurs sans réponse.</Text>
          <View style={styles.filters}>
            <FilterButton label="À venir" active={filter === "upcoming"} onPress={() => setFilter("upcoming")} />
            <FilterButton label="Historique" active={filter === "history"} onPress={() => setFilter("history")} />
            <FilterButton label="Annulés" active={filter === "cancelled"} onPress={() => setFilter("cancelled")} />
          </View>

          {filteredMatches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={40} color={Theme.colors.goldLight} />
              <Text style={styles.emptyTitle}>Aucun match</Text>
              <Text style={styles.emptyText}>Aucun match ne correspond à ce filtre.</Text>
            </View>
          ) : filteredMatches.map((match) => {
            const response = match.responses.find((item) => item.uid === session?.localId)?.status ?? "En attente";
            const summary = getResponseSummary(match);
            const isSaving = savingMatchId === match.id;
            const isPast = new Date(`${match.date}T${match.matchTime}:00`).getTime() < Date.now();

            return (
              <View key={match.id} style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.dateColumn}><Text style={styles.day}>{getDay(match.date)}</Text><Text style={styles.month}>{getMonth(match.date)}</Text></View>
                  <View style={styles.cardContent}>
                    <View style={styles.metaRow}><Text style={styles.type}>{match.type.toUpperCase()}</Text><Text style={[styles.status, match.status === "Confirmé" && styles.confirmed, match.status === "Annulé" && styles.cancelled]}>{match.status}</Text></View>
                    <Text style={styles.eventTitle}>DYNO vs {match.opponent}</Text>
                    <View style={styles.detailsRow}><Detail icon="people-outline" text={`RDV ${match.arrivalTime}`} /><Detail icon="time-outline" text={`Match ${match.matchTime}`} /><Detail icon="business-outline" text={match.arena} /></View>
                  </View>
                </View>

                {!isPast && match.status !== "Annulé" ? <><Text style={styles.answerLabel}>TA DISPONIBILITÉ</Text><View style={styles.answerRow}><AnswerButton active={response === "Disponible"} positive label="Disponible" disabled={isSaving} onPress={() => void answer(match.id, "Disponible")} /><AnswerButton active={response === "Indisponible"} label="Indisponible" disabled={isSaving} onPress={() => void answer(match.id, "Indisponible")} /></View></> : null}

                <TouchableOpacity style={styles.summaryRow} onPress={() => setDetails(match)}><Text style={styles.summaryAvailable}>● {summary.available} dispo</Text><Text style={styles.summaryUnavailable}>● {summary.unavailable} indispo</Text><Text style={styles.summaryPending}>● {summary.pendingPlayers.length} sans réponse</Text><Ionicons name="chevron-forward" size={15} color="#999" /></TouchableOpacity>
                {summary.pendingPlayers.length ? <Text style={styles.pendingNames} numberOfLines={2}>{summary.pendingPlayers.map((player) => player.nickname).join(", ")}</Text> : null}
                {match.notes ? <Text style={styles.notes}>{match.notes}</Text> : null}

                <View style={styles.actionRow}>
                  {!isPast && match.status !== "Annulé" ? <TouchableOpacity style={styles.calendarButton} onPress={() => void addToCalendar(match)}><Ionicons name="calendar-outline" size={16} color="#080808" /><Text style={styles.calendarButtonText}>CALENDRIER</Text></TouchableOpacity> : null}
                  <TouchableOpacity style={styles.shareButton} onPress={() => void shareMatch(match)}><Ionicons name="share-social-outline" size={17} color={Theme.colors.goldLight} /><Text style={styles.shareText}>PARTAGER</Text></TouchableOpacity>
                  {canManage ? <TouchableOpacity accessibilityLabel="Modifier le scrim" style={styles.manageButton} onPress={() => manage(match)}><Ionicons name="settings-outline" size={18} color={Theme.colors.goldLight} /></TouchableOpacity> : null}
                  {canManage ? <TouchableOpacity accessibilityLabel="Supprimer le scrim" disabled={isSaving} style={[styles.deleteButton, isSaving && styles.disabled]} onPress={() => confirmDelete(match)}><Ionicons name="trash-outline" size={19} color="#FF7777" /></TouchableOpacity> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </ImageBackground>

      <Modal visible={Boolean(details)} transparent animationType="fade" onRequestClose={() => setDetails(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Réponses de l'équipe</Text><TouchableOpacity onPress={() => setDetails(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity></View>
            <ScrollView>{detailRows.length ? detailRows.map(({ player, response: playerResponse }) => <View key={player.id} style={styles.responseRow}><Text style={styles.responsePlayer}>{player.nickname}</Text><Text style={[styles.responseStatus, playerResponse?.status === "Disponible" ? styles.responseOk : playerResponse?.status === "Indisponible" ? styles.responseNo : styles.responsePending]}>{playerResponse?.status ?? "Sans réponse"}</Text></View>) : <Text style={styles.noResponse}>Aucun membre dans l'équipe.</Text>}</ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <TouchableOpacity style={[styles.filterButton, active && styles.filterActive]} onPress={onPress}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></TouchableOpacity>; }
function AnswerButton({ active, positive, label, disabled, onPress }: { active: boolean; positive?: boolean; label: string; disabled: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} style={[styles.answerButton, active && (positive ? styles.answerPositive : styles.answerNegative), disabled && styles.disabled]} onPress={onPress}><Ionicons name={positive ? "checkmark-circle" : "close-circle"} size={18} color={active ? "#080808" : positive ? "#83DD57" : "#FF7777"} /><Text style={[styles.answerText, active && styles.answerTextActive]}>{label}</Text></TouchableOpacity>; }
function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.detail}><Ionicons name={icon} size={16} color={Theme.colors.goldLight} /><Text style={styles.detailText}>{text}</Text></View>; }
function getDay(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? "--" : date.getDate().toString().padStart(2, "0"); }
function getMonth(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase(); }
function formatDate(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.42 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" }, content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 170 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 8, marginBottom: 20 },
  filters: { flexDirection: "row", gap: 10, marginBottom: 20 }, filterButton: { flex: 1, minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, filterActive: { backgroundColor: Theme.colors.goldLight }, filterText: { color: "#D8D8D8", fontWeight: "900", fontSize: 12 }, filterTextActive: { color: "#080808" },
  emptyCard: { padding: 34, borderRadius: 24, alignItems: "center", backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 12 }, emptyText: { color: "#C8C8C8", textAlign: "center", marginTop: 8 },
  card: { borderRadius: 24, padding: 17, marginBottom: 16, backgroundColor: "rgba(8,8,8,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, topRow: { flexDirection: "row" }, dateColumn: { width: 76, minHeight: 98, borderRadius: 20, backgroundColor: "#F4F0E7", alignItems: "center", justifyContent: "center", marginRight: 15 }, day: { color: "#111", fontSize: 30, fontWeight: "900" }, month: { color: "#78621D", fontSize: 12, fontWeight: "900" }, cardContent: { flex: 1 }, metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, type: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" }, status: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900" }, confirmed: { color: "#8FDD58" }, cancelled: { color: "#FF7777" }, eventTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginTop: 9 }, detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 11 }, detail: { flexDirection: "row", alignItems: "center", gap: 5 }, detailText: { color: "#D2D2D2", fontSize: 12 },
  answerLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", marginTop: 18, marginBottom: 9 }, answerRow: { flexDirection: "row", gap: 10 }, answerButton: { flex: 1, minHeight: 50, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.11)" }, answerPositive: { backgroundColor: "#83DD57" }, answerNegative: { backgroundColor: "#FF7777" }, answerText: { color: "#fff", fontWeight: "900", fontSize: 12 }, answerTextActive: { color: "#080808" }, disabled: { opacity: 0.55 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }, summaryAvailable: { color: "#81DD55", fontSize: 10, fontWeight: "900" }, summaryUnavailable: { color: "#FF7777", fontSize: 10, fontWeight: "900" }, summaryPending: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", flex: 1 }, pendingNames: { color: "#CFCFCF", fontSize: 11, marginTop: 8 }, notes: { color: "#D0D0D0", fontSize: 11, marginTop: 8 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 16 }, calendarButton: { flex: 1.35, minHeight: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: Theme.colors.goldLight }, calendarButtonText: { color: "#080808", fontSize: 11, fontWeight: "900" }, shareButton: { flex: 1.2, minHeight: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,218,104,0.45)" }, shareText: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900" }, manageButton: { width: 46, minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,218,104,0.45)" }, deleteButton: { width: 46, minHeight: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(130,20,20,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,100,100,0.35)" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(0,0,0,0.82)" }, modalCard: { maxHeight: "70%", borderRadius: 24, padding: 18, backgroundColor: "#101010", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.15)" }, modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, modalTitle: { color: "#fff", fontSize: 18, fontWeight: "900" }, responseRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.1)" }, responsePlayer: { color: "#fff", fontWeight: "800" }, responseStatus: { fontWeight: "900" }, responseOk: { color: "#83DD57" }, responseNo: { color: "#FF7777" }, responsePending: { color: Theme.colors.goldLight }, noResponse: { color: "#C8C8C8", textAlign: "center", paddingVertical: 20 },
});