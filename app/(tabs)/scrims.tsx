import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";
import { addMatchToDeviceCalendar } from "../../services/deviceCalendar";
import {
  createMatch,
  deleteMatch,
  getMatches,
  Match,
  MatchArena,
  MatchStatus,
  MatchType,
  setMatchAvailability,
  subscribeToMatches,
  toMatchDate,
} from "../../services/matchStore";
import { scheduleMatchNotification } from "../../services/notifications";

const marbleSource = require("../../assets/images/background-marble.jpg");
const types: MatchType[] = ["Scrim", "Division"];
const arenas: MatchArena[] = ["Arène 1", "Arène 2"];
const statuses: MatchStatus[] = ["En attente", "Confirmé", "Annulé"];
const times = Array.from({ length: 33 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${Math.floor(minutes / 60).toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}`;
});

export default function ScrimsScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<MatchType>("Scrim");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("19:30");
  const [matchTime, setMatchTime] = useState("20:00");
  const [arena, setArena] = useState<MatchArena>("Arène 1");
  const [status, setStatus] = useState<MatchStatus>("En attente");
  const [notes, setNotes] = useState("");

  const loadMatches = useCallback(async () => setMatches(await getMatches()), []);
  useEffect(() => {
    loadMatches();
    return subscribeToMatches(setMatches);
  }, [loadMatches]);

  const upcomingMatches = useMemo(() => matches.filter((match) => match.status !== "Annulé"), [matches]);

  function resetForm() {
    setType("Scrim");
    setOpponent("");
    setDate("");
    setArrivalTime("19:30");
    setMatchTime("20:00");
    setArena("Arène 1");
    setStatus("En attente");
    setNotes("");
  }

  async function handleCreateMatch() {
    if (!opponent.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Informations incomplètes", "Choisis une date dans le calendrier et indique l'équipe adverse.");
      return;
    }

    try {
      setSaving(true);
      const match = await createMatch({
        type,
        opponent: opponent.trim(),
        date,
        arrivalTime,
        matchTime,
        arena,
        status,
        notes: notes.trim(),
      });
      const matchDate = toMatchDate(match);
      if (matchDate) await scheduleMatchNotification({ opponent: match.opponent, matchDate }).catch(() => null);
      setModalVisible(false);
      resetForm();
      Alert.alert("Match créé", `${type} contre ${match.opponent} ajouté.`);
    } catch {
      Alert.alert("Erreur", "Le match n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  async function addToCalendar(match: Match) {
    try {
      await addMatchToDeviceCalendar(match);
      Alert.alert("Calendrier", "Le match a été ajouté au calendrier du téléphone.");
    } catch (error) {
      Alert.alert("Calendrier", error instanceof Error ? error.message : "Ajout impossible.");
    }
  }

  function confirmDelete(match: Match) {
    Alert.alert("Supprimer le match", `Supprimer le match contre ${match.opponent} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => deleteMatch(match.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
              <Text style={styles.title}>Matchs</Text>
              <Text style={styles.subtitle}>Crée les matchs et suis les réponses de l'équipe.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="add" size={30} color="#080808" />
            </TouchableOpacity>
          </View>

          {upcomingMatches.map((match) => {
            const available = match.responses.filter((response) => response.status === "Disponible");
            const unavailable = match.responses.filter((response) => response.status === "Indisponible");
            const pending = match.responses.filter((response) => response.status === "En attente");
            const mine = match.responses.find((response) => response.player === "DYNOxAphex")?.status;

            return (
              <View key={match.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.typeBadge}>
                    <Ionicons name={match.type === "Scrim" ? "flash" : "trophy"} size={14} color="#080808" />
                    <Text style={styles.typeBadgeText}>{match.type}</Text>
                  </View>
                  <TouchableOpacity onLongPress={() => confirmDelete(match)}><Ionicons name="ellipsis-horizontal" size={23} color="#ddd" /></TouchableOpacity>
                </View>

                <Text style={styles.opponent}>DYNO <Text style={styles.vs}>VS</Text> {match.opponent.toUpperCase()}</Text>
                <View style={styles.infoGrid}>
                  <Info icon="calendar-outline" label="Date" value={formatDate(match.date)} />
                  <Info icon="people-outline" label="Rendez-vous" value={match.arrivalTime} />
                  <Info icon="time-outline" label="Match" value={match.matchTime} />
                  <Info icon="business-outline" label="Arène" value={match.arena} />
                </View>

                <Text style={styles.sectionTitle}>TA DISPONIBILITÉ</Text>
                <View style={styles.answerRow}>
                  <AnswerButton active={mine === "Disponible"} positive label="Disponible" onPress={() => setMatchAvailability(match.id, "Disponible")} />
                  <AnswerButton active={mine === "Indisponible"} label="Pas disponible" onPress={() => setMatchAvailability(match.id, "Indisponible")} />
                </View>

                <Text style={styles.sectionTitle}>RÉPONSES DE L'ÉQUIPE</Text>
                <ResponseGroup icon="checkmark-circle" title={`Disponibles (${available.length})`} names={available.map((item) => item.player)} color="#82DD55" />
                <ResponseGroup icon="close-circle" title={`Indisponibles (${unavailable.length})`} names={unavailable.map((item) => item.player)} color="#FF7777" />
                <ResponseGroup icon="time" title={`En attente (${pending.length})`} names={pending.map((item) => item.player)} color="#D8B64B" />

                <TouchableOpacity style={styles.calendarButton} onPress={() => addToCalendar(match)}>
                  <Ionicons name="calendar" size={19} color="#080808" />
                  <Text style={styles.calendarButtonText}>AJOUTER À MON CALENDRIER</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <View><Text style={styles.kicker}>NOUVEL ÉVÉNEMENT</Text><Text style={styles.modalTitle}>Créer un match</Text></View>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={26} color="#fff" /></TouchableOpacity>
                </View>

                <Label text="Type" />
                <ChipRow values={types} selected={type} onSelect={(value) => setType(value as MatchType)} />
                <Label text="Équipe adverse" />
                <TextInput style={styles.input} placeholder="Ex. TITANS" placeholderTextColor="#888" value={opponent} onChangeText={setOpponent} />
                <Label text="Date" />
                <TouchableOpacity style={styles.selector} onPress={() => setCalendarVisible(true)}>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.goldLight} />
                  <Text style={styles.selectorText}>{date ? formatDate(date) : "Choisir une date"}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
                <Label text="Heure de rendez-vous" />
                <TimeCarousel selected={arrivalTime} onSelect={setArrivalTime} />
                <Label text="Heure du match" />
                <TimeCarousel selected={matchTime} onSelect={setMatchTime} />
                <Label text="Arène" />
                <ChipRow values={arenas} selected={arena} onSelect={(value) => setArena(value as MatchArena)} />
                <Label text="Statut" />
                <ChipRow values={statuses} selected={status} onSelect={(value) => setStatus(value as MatchStatus)} />
                <Label text="Notes (optionnel)" />
                <TextInput style={[styles.input, styles.notesInput]} multiline placeholder="Informations utiles" placeholderTextColor="#888" value={notes} onChangeText={setNotes} />
                <TouchableOpacity style={styles.saveButton} onPress={handleCreateMatch} disabled={saving}>
                  <Text style={styles.saveText}>{saving ? "ENREGISTREMENT…" : "CRÉER LE MATCH"}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <CalendarPicker visible={calendarVisible} value={date} onClose={() => setCalendarVisible(false)} onSelect={(value) => { setDate(value); setCalendarVisible(false); }} />
      </ImageBackground>
    </SafeAreaView>
  );
}

function CalendarPicker({ visible, value, onClose, onSelect }: { visible: boolean; value: string; onClose: () => void; onSelect: (value: string) => void }) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const days = buildCalendar(cursor);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdropCenter}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Ionicons name="chevron-back" size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.calendarMonth}>{cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</Text>
            <TouchableOpacity onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
          </View>
          <View style={styles.weekRow}>{["L", "M", "M", "J", "V", "S", "D"].map((day, i) => <Text key={`${day}-${i}`} style={styles.weekDay}>{day}</Text>)}</View>
          <View style={styles.daysGrid}>{days.map((day, index) => day ? <TouchableOpacity key={day.toISOString()} style={styles.dayCell} onPress={() => onSelect(toDateKey(day))}><Text style={styles.dayText}>{day.getDate()}</Text></TouchableOpacity> : <View key={`empty-${index}`} style={styles.dayCell} />)}</View>
          <TouchableOpacity style={styles.closeCalendar} onPress={onClose}><Text style={styles.closeCalendarText}>FERMER</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function TimeCarousel({ selected, onSelect }: { selected: string; onSelect: (value: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>{times.map((time) => <TouchableOpacity key={time} style={[styles.timeChip, selected === time && styles.chipActive]} onPress={() => onSelect(time)}><Text style={[styles.chipText, selected === time && styles.chipTextActive]}>{time}</Text></TouchableOpacity>)}</ScrollView>;
}

function ResponseGroup({ icon, title, names, color }: { icon: keyof typeof Ionicons.glyphMap; title: string; names: string[]; color: string }) {
  return <View style={styles.responseGroup}><View style={styles.responseHeader}><Ionicons name={icon} size={17} color={color} /><Text style={[styles.responseTitle, { color }]}>{title}</Text></View><Text style={styles.responseNames}>{names.length ? names.join(" • ") : "Personne"}</Text></View>;
}

function AnswerButton({ active, positive = false, label, onPress }: { active: boolean; positive?: boolean; label: string; onPress: () => void }) {
  return <TouchableOpacity style={[styles.answerButton, active && (positive ? styles.availableActive : styles.unavailableActive)]} onPress={onPress}><Ionicons name={positive ? "checkmark-circle" : "close-circle"} size={19} color={active ? "#080808" : positive ? "#82DD55" : "#FF7777"} /><Text style={[styles.answerText, active && { color: "#080808" }]}>{label}</Text></TouchableOpacity>;
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { return <View style={styles.infoItem}><Ionicons name={icon} size={19} color={Theme.colors.goldLight} /><View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>; }
function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function ChipRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) { return <View style={styles.chipRow}>{values.map((value) => <TouchableOpacity key={value} style={[styles.chip, selected === value && styles.chipActive]} onPress={() => onSelect(value)}><Text style={[styles.chipText, selected === value && styles.chipTextActive]}>{value}</Text></TouchableOpacity>)}</View>; }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
function toDateKey(date: Date) { return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`; }
function buildCalendar(cursor: Date) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0); const offset = (first.getDay() + 6) % 7; return [...Array(offset).fill(null), ...Array.from({ length: last.getDate() }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))]; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.62 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.57)" }, content: { padding: 20, paddingBottom: 130 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 22 }, kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.6 }, title: { color: "#fff", fontSize: 34, fontWeight: "900" }, subtitle: { color: "#ccc", marginTop: 6 }, addButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight },
  card: { padding: 18, marginBottom: 16, borderRadius: 25, backgroundColor: "rgba(8,8,8,0.78)", borderWidth: 1, borderColor: "rgba(224,184,67,0.42)" }, cardTopRow: { flexDirection: "row", justifyContent: "space-between" }, typeBadge: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Theme.colors.goldLight, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14 }, typeBadgeText: { color: "#080808", fontWeight: "900" }, opponent: { color: "#fff", fontSize: 23, fontWeight: "900", marginTop: 18 }, vs: { color: Theme.colors.gold }, infoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }, infoItem: { width: "48%", flexDirection: "row", gap: 9, marginBottom: 14 }, infoLabel: { color: "#999", fontSize: 10, textTransform: "uppercase" }, infoValue: { color: "#fff", fontWeight: "800", marginTop: 2 }, sectionTitle: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginTop: 10, marginBottom: 9 }, answerRow: { flexDirection: "row", gap: 10 }, answerButton: { flex: 1, minHeight: 48, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }, answerText: { color: "#fff", fontWeight: "800", fontSize: 12 }, availableActive: { backgroundColor: "#82DD55", borderColor: "#82DD55" }, unavailableActive: { backgroundColor: "#FF7777", borderColor: "#FF7777" }, responseGroup: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 11, marginBottom: 8 }, responseHeader: { flexDirection: "row", alignItems: "center", gap: 6 }, responseTitle: { fontWeight: "900", fontSize: 11 }, responseNames: { color: "#ddd", fontSize: 11, marginTop: 6, lineHeight: 17 }, calendarButton: { minHeight: 50, backgroundColor: Theme.colors.goldLight, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10 }, calendarButtonText: { color: "#080808", fontWeight: "900", fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }, modalBackdropCenter: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.76)" }, modalCard: { maxHeight: "92%", backgroundColor: "#0B0B0B", borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderColor: "rgba(224,184,67,0.5)", padding: 20 }, modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }, modalTitle: { color: "#fff", fontSize: 27, fontWeight: "900" }, label: { color: "#ddd", fontSize: 12, fontWeight: "800", marginTop: 14, marginBottom: 8 }, input: { minHeight: 54, borderRadius: 16, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.25)", color: "#fff", paddingHorizontal: 14 }, notesInput: { minHeight: 82, textAlignVertical: "top", paddingTop: 14 }, selector: { minHeight: 54, borderRadius: 16, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.25)", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }, selectorText: { flex: 1, color: "#fff" }, chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.22)" }, chipActive: { backgroundColor: Theme.colors.goldLight }, chipText: { color: "#ddd", fontWeight: "800" }, chipTextActive: { color: "#080808" }, timeRow: { gap: 8, paddingRight: 10 }, timeChip: { minWidth: 72, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.22)" }, saveButton: { minHeight: 58, borderRadius: 18, backgroundColor: Theme.colors.goldLight, alignItems: "center", justifyContent: "center", marginTop: 24 }, saveText: { color: "#080808", fontWeight: "900" },
  calendarCard: { backgroundColor: "#0B0B0B", borderRadius: 24, padding: 18, borderWidth: 1, borderColor: "rgba(224,184,67,0.5)" }, calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, calendarMonth: { color: "#fff", fontWeight: "900", textTransform: "capitalize" }, weekRow: { flexDirection: "row", marginTop: 18 }, weekDay: { width: "14.28%", color: Theme.colors.goldLight, textAlign: "center", fontWeight: "900" }, daysGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 }, dayCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center" }, dayText: { color: "#fff", fontWeight: "700" }, closeCalendar: { marginTop: 12, minHeight: 46, borderRadius: 14, backgroundColor: Theme.colors.goldLight, alignItems: "center", justifyContent: "center" }, closeCalendarText: { color: "#080808", fontWeight: "900" },
});
