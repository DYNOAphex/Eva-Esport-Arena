import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ImageBackground, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { getStoredSession } from "../../services/authService";
import { deleteMatch, duplicateMatch, getMatches, setMatchAvailability, subscribeToMatches, updateMatch } from "../../services/matchStore";
import type { AuthSession } from "../../services/authService";
import type { Availability, Match } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");

export default function PlanningScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [details, setDetails] = useState<Match | null>(null);

  const loadMatches = useCallback(async () => setMatches(await getMatches()), []);
  useEffect(() => {
    void loadMatches();
    void getStoredSession().then(setSession);
    void getScrimPermissions().then((permissions) => setCanManage(permissions.canManage));
    return subscribeToMatches(setMatches);
  }, [loadMatches]);

  async function answer(matchId: string, availability: Exclude<Availability, "En attente">) {
    try { setSavingMatchId(matchId); await setMatchAvailability(matchId, availability); }
    catch { Alert.alert("Disponibilité", "Ta réponse n'a pas pu être enregistrée."); }
    finally { setSavingMatchId(null); }
  }

  async function addToCalendar(match: Match) {
    try {
      const permission = await Calendar.requestCalendarPermissionsAsync();
      if (permission.status !== "granted") return Alert.alert("Calendrier", "Autorise DYNO à accéder au calendrier dans les réglages du téléphone.");
      const startDate = new Date(`${match.date}T${match.matchTime}:00`);
      if (Number.isNaN(startDate.getTime())) return Alert.alert("Calendrier", "La date ou l'heure du match n'est pas valide.");
      await Calendar.createEventInCalendarAsync({ title: `DYNO vs ${match.opponent}`, startDate, endDate: new Date(startDate.getTime() + 90 * 60 * 1000), location: match.arena, notes: [`Type : ${match.type}`, `Rendez-vous : ${match.arrivalTime}`, match.notes].filter(Boolean).join("\n"), alarms: [{ relativeOffset: -30 }], timeZone: "Europe/Paris" });
    } catch { Alert.alert("Calendrier", "Impossible d'ouvrir le calendrier du téléphone."); }
  }

  function manage(match: Match) {
    Alert.alert(`DYNO vs ${match.opponent}`, "Choisis une action", [
      { text: "Modifier", onPress: () => router.push({ pathname: "/(tabs)/scrims", params: { editId: match.id } }) },
      { text: match.status === "Annulé" ? "Réactiver" : "Annuler le scrim", onPress: () => void updateMatch(match.id, { status: match.status === "Annulé" ? "En attente" : "Annulé" }) },
      { text: "Dupliquer", onPress: () => void duplicateMatch(match.id).then(() => Alert.alert("Scrim dupliqué", "Une copie a été ajoutée à l'agenda.")) },
      { text: "Supprimer", style: "destructive", onPress: () => Alert.alert("Supprimer le scrim", "Cette action est définitive.", [{ text: "Retour", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => void deleteMatch(match.id) }]) },
      { text: "Fermer", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text><Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Indique ta disponibilité et consulte les réponses de l'équipe.</Text>
          {matches.length === 0 ? <View style={styles.emptyCard}><Ionicons name="calendar-clear-outline" size={40} color={Theme.colors.goldLight} /><Text style={styles.emptyTitle}>Agenda vide</Text><Text style={styles.emptyText}>Aucun scrim n'est encore programmé.</Text></View> : matches.map((match) => {
            const response = match.responses.find((item) => item.uid === session?.localId)?.status ?? "En attente";
            const available = match.responses.filter((item) => item.status === "Disponible").length;
            const unavailable = match.responses.filter((item) => item.status === "Indisponible").length;
            const pending = match.responses.filter((item) => item.status === "En attente").length;
            const isSaving = savingMatchId === match.id;
            return <View key={match.id} style={styles.card}>
              <View style={styles.topRow}><View style={styles.dateColumn}><Text style={styles.day}>{getDay(match.date)}</Text><Text style={styles.month}>{getMonth(match.date)}</Text></View><View style={styles.cardContent}><View style={styles.metaRow}><Text style={styles.type}>{match.type.toUpperCase()}</Text><Text style={[styles.status, match.status === "Confirmé" && styles.confirmed, match.status === "Annulé" && styles.cancelled]}>{match.status}</Text></View><Text style={styles.eventTitle}>DYNO vs {match.opponent}</Text><View style={styles.detailsRow}><Detail icon="people-outline" text={`RDV ${match.arrivalTime}`} /><Detail icon="time-outline" text={`Match ${match.matchTime}`} /><Detail icon="business-outline" text={match.arena} /></View></View></View>
              <Text style={styles.answerLabel}>TA DISPONIBILITÉ</Text><View style={styles.answerRow}><AnswerButton active={response === "Disponible"} positive label="Disponible" disabled={isSaving} onPress={() => void answer(match.id, "Disponible")} /><AnswerButton active={response === "Indisponible"} label="Indisponible" disabled={isSaving} onPress={() => void answer(match.id, "Indisponible")} /></View>
              <TouchableOpacity style={styles.summaryRow} onPress={() => setDetails(match)}><Text style={styles.summaryAvailable}>● {available} dispo</Text><Text style={styles.summaryUnavailable}>● {unavailable} indispo</Text><Text style={styles.summaryPending}>● {pending} attente</Text><Ionicons name="chevron-forward" size={15} color="#999" /></TouchableOpacity>
              {match.notes ? <Text style={styles.notes}>{match.notes}</Text> : null}
              <View style={styles.actionRow}><TouchableOpacity style={styles.calendarButton} onPress={() => void addToCalendar(match)}><Ionicons name="calendar-outline" size={16} color="#080808" /><Text style={styles.calendarButtonText}>CALENDRIER</Text></TouchableOpacity>{canManage ? <TouchableOpacity style={styles.manageButton} onPress={() => manage(match)}><Ionicons name="settings-outline" size={17} color={Theme.colors.goldLight} /></TouchableOpacity> : null}</View>
            </View>;
          })}
        </ScrollView>
      </ImageBackground>
      <Modal visible={Boolean(details)} transparent animationType="fade" onRequestClose={() => setDetails(null)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Réponses de l'équipe</Text><TouchableOpacity onPress={() => setDetails(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity></View>{details?.responses.length ? details.responses.map((item, index) => <View key={`${item.uid ?? item.player}-${index}`} style={styles.responseRow}><Text style={styles.responsePlayer}>{item.player}</Text><Text style={[styles.responseStatus, item.status === "Disponible" ? styles.responseOk : styles.responseNo]}>{item.status}</Text></View>) : <Text style={styles.noResponse}>Aucune réponse pour le moment.</Text>}</View></View></Modal>
    </SafeAreaView>
  );
}

function AnswerButton({ active, positive, label, disabled, onPress }: { active: boolean; positive?: boolean; label: string; disabled: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} style={[styles.answerButton, active && (positive ? styles.answerPositive : styles.answerNegative), disabled && styles.disabled]} onPress={onPress}><Ionicons name={positive ? "checkmark-circle" : "close-circle"} size={18} color={active ? "#080808" : positive ? "#83DD57" : "#FF7777"} /><Text style={[styles.answerText, active && styles.answerTextActive]}>{label}</Text></TouchableOpacity>; }
function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { return <View style={styles.detail}><Ionicons name={icon} size={16} color={Theme.colors.goldLight} /><Text style={styles.detailText}>{text}</Text></View>; }
function getDay(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? "--" : date.getDate().toString().padStart(2, "0"); }
function getMonth(value: string) { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase(); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.6 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" }, content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 }, kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 24, lineHeight: 20 },
  emptyCard: { alignItems: "center", padding: 30, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.78)", borderWidth: 1, borderColor: "rgba(224,184,67,0.38)" }, emptyTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 10 }, emptyText: { color: "#BEBEBE", textAlign: "center", lineHeight: 20, marginTop: 7 },
  card: { marginBottom: 15, padding: 16, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.78)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" }, topRow: { flexDirection: "row" }, dateColumn: { width: 66, height: 78, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F0E6", marginRight: 15 }, day: { color: "#111", fontSize: 28, fontWeight: "900", lineHeight: 31 }, month: { color: "#7D6422", fontSize: 11, fontWeight: "900" }, cardContent: { flex: 1 }, metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, type: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1 }, status: { color: "#E2C567", fontSize: 11, fontWeight: "800" }, confirmed: { color: "#87D958" }, cancelled: { color: "#FF7777" }, eventTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 9 }, detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 13, marginTop: 12 }, detail: { flexDirection: "row", alignItems: "center", gap: 5 }, detailText: { color: "#D2D2D2", fontSize: 12 },
  answerLabel: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 16, marginBottom: 8 }, answerRow: { flexDirection: "row", gap: 10 }, answerButton: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.04)" }, answerPositive: { backgroundColor: "#84D956", borderColor: "#84D956" }, answerNegative: { backgroundColor: "#FF7474", borderColor: "#FF7474" }, answerText: { color: "#E5E5E5", fontSize: 11, fontWeight: "900" }, answerTextActive: { color: "#080808" }, disabled: { opacity: 0.55 },
  summaryRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginTop: 13 }, summaryAvailable: { color: "#84D956", fontSize: 10, fontWeight: "800" }, summaryUnavailable: { color: "#FF7474", fontSize: 10, fontWeight: "800" }, summaryPending: { color: "#E0BD50", fontSize: 10, fontWeight: "800", flex: 1 }, notes: { color: "#BFBFBF", fontSize: 12, marginTop: 12, lineHeight: 18 }, actionRow: { flexDirection: "row", gap: 8, marginTop: 14 }, calendarButton: { minHeight: 42, flex: 1, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Theme.colors.goldLight }, calendarButtonText: { color: "#080808", fontSize: 10, fontWeight: "900" }, manageButton: { width: 46, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(224,184,67,0.5)" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(0,0,0,0.78)" }, modalCard: { maxHeight: "75%", borderRadius: 24, padding: 20, backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(224,184,67,0.45)" }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }, modalTitle: { color: "#fff", fontSize: 20, fontWeight: "900" }, responseRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" }, responsePlayer: { color: "#fff", fontWeight: "800" }, responseStatus: { fontSize: 11, fontWeight: "900" }, responseOk: { color: "#84D956" }, responseNo: { color: "#FF7474" }, noResponse: { color: "#aaa", textAlign: "center", paddingVertical: 24 },
});