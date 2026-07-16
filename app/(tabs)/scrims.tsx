import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { createElement, useEffect, useState } from "react";
import { Alert, ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { createMatch, getMatch, updateMatch } from "../../services/matchStore";
import { notifyMatchCreated, scheduleMatchNotification } from "../../services/notifications";
import type { MatchArena, MatchStatus } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
const arenas: MatchArena[] = ["Arène 1", "Arène 2"];
const statuses: MatchStatus[] = ["En attente", "Confirmé", "Annulé"];

export default function ScrimsScreen() {
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = typeof params.editId === "string" ? params.editId : undefined;
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("19:30");
  const [matchTime, setMatchTime] = useState("20:00");
  const [arena, setArena] = useState<MatchArena>("Arène 1");
  const [status, setStatus] = useState<MatchStatus>("En attente");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    void getScrimPermissions().then(async (permissions) => {
      const allowed = editId ? permissions.canManage : permissions.canCreate;
      setAuthorized(allowed);
      if (!allowed) {
        Alert.alert("Accès refusé", "Ton compte n'est pas autorisé à gérer ce scrim.", [{ text: "Retour", onPress: () => router.replace("/(tabs)/planning") }]);
        return;
      }
      if (editId) {
        const match = await getMatch(editId);
        if (!match) return;
        setOpponent(match.opponent); setDate(match.date); setArrivalTime(match.arrivalTime); setMatchTime(match.matchTime);
        setArena(match.arena); setStatus(match.status); setNotes(match.notes ?? "");
      }
    });
  }, [editId]);

  async function handleSave() {
    if (!authorized) return;
    if (!opponent.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Informations incomplètes", "Indique l'équipe adverse et sélectionne une date.");
      return;
    }
    try {
      setSaving(true);
      const input = { type: "Scrim" as const, opponent: opponent.trim(), date, arrivalTime, matchTime, arena, status, notes: notes.trim() };
      const match = editId ? await updateMatch(editId, input) : await createMatch(input);
      if (!editId) {
        await notifyMatchCreated({
          type: match.type,
          opponent: match.opponent,
          date: match.date,
          arrivalTime: match.arrivalTime,
          matchTime: match.matchTime,
          arena: match.arena,
        }).catch(() => null);

        const start = new Date(`${match.date}T${match.matchTime}:00`);
        if (!Number.isNaN(start.getTime())) {
          await scheduleMatchNotification({ opponent: match.opponent, matchDate: start }).catch(() => null);
        }
      }
      Alert.alert(editId ? "Scrim modifié" : "Scrim programmé", `DYNO vs ${match.opponent} est enregistré.`, [{ text: "Voir l'Agenda", onPress: () => router.replace("/(tabs)/planning") }]);
    } catch (error) {
      Alert.alert("Erreur", error instanceof Error ? error.message : "Le scrim n'a pas pu être enregistré.");
    } finally { setSaving(false); }
  }

  if (authorized !== true) return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Vérification de l'autorisation…</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>{editId ? "Modifier le scrim" : "Programmer un scrim"}</Text>
          <Text style={styles.subtitle}>{editId ? "Mets à jour les informations du scrim." : "Ajoute un nouveau scrim à l'agenda."}</Text>
          <View style={styles.formCard}>
            <Label text="Équipe adverse" />
            <TextInput style={styles.input} placeholder="Ex. TITANS" placeholderTextColor="#777" value={opponent} onChangeText={setOpponent} autoCapitalize="characters" />
            <Label text="Date" />
            <DateField value={date} onChange={setDate} />
            <Label text="Heure de rendez-vous" /><ClockField value={arrivalTime} onChange={setArrivalTime} />
            <Label text="Heure du match" /><ClockField value={matchTime} onChange={setMatchTime} />
            <Label text="Arène" />
            <View style={styles.chipRow}>{arenas.map((value) => <TouchableOpacity key={value} style={[styles.chip, arena === value && styles.chipActive]} onPress={() => setArena(value)}><Text style={[styles.chipText, arena === value && styles.chipTextActive]}>{value}</Text></TouchableOpacity>)}</View>
            <Label text="Statut" />
            <View style={styles.statusWrap}>{statuses.map((value) => <TouchableOpacity key={value} style={[styles.chip, status === value && styles.chipActive]} onPress={() => setStatus(value)}><Text style={[styles.chipText, status === value && styles.chipTextActive]}>{value}</Text></TouchableOpacity>)}</View>
            <Label text="Notes (optionnel)" />
            <TextInput style={[styles.input, styles.notes]} placeholder="Informations utiles" placeholderTextColor="#777" value={notes} onChangeText={setNotes} multiline />
            <TouchableOpacity style={styles.saveButton} disabled={saving} onPress={() => void handleSave()}><Ionicons name="save-outline" size={19} color="#080808" /><Text style={styles.saveText}>{saving ? "ENREGISTREMENT…" : editId ? "ENREGISTRER LES MODIFICATIONS" : "PROGRAMMER LE SCRIM"}</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value,
      min: todayValue(),
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: webInputStyle,
      "aria-label": "Date du scrim",
    }) as never;
  }

  const [visible, setVisible] = useState(false);
  const current = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setVisible(false);
    if (event.type === "dismissed" || !selected) return;
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const day = String(selected.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  }
  const label = value ? current.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "Choisir une date";
  return <View><TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}><Ionicons name="calendar-outline" size={20} color={Theme.colors.goldLight} /><Text style={[styles.selectorText, !value && styles.placeholder]}>{label}</Text><Ionicons name="chevron-forward" size={18} color="#888" /></TouchableOpacity>{visible ? <DateTimePicker value={current} mode="date" minimumDate={editIdSafeDate()} display={Platform.OS === "android" ? "calendar" : "spinner"} onChange={handleChange} /> : null}</View>;
}

function editIdSafeDate() { const today = new Date(); today.setHours(0, 0, 0, 0); return today; }
function todayValue() { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`; }

function ClockField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  if (Platform.OS === "web") {
    return createElement("input", {
      type: "time",
      value,
      step: 300,
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: webInputStyle,
      "aria-label": "Heure du scrim",
    }) as never;
  }

  const [visible, setVisible] = useState(false);
  function handleChange(event: DateTimePickerEvent, selected?: Date) { if (Platform.OS === "android") setVisible(false); if (event.type === "dismissed" || !selected) return; onChange(`${selected.getHours().toString().padStart(2, "0")}:${selected.getMinutes().toString().padStart(2, "0")}`); }
  const [hours, minutes] = value.split(":").map(Number); const pickerValue = new Date(); pickerValue.setHours(hours || 0, minutes || 0, 0, 0);
  return <View><TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}><Ionicons name="time-outline" size={20} color={Theme.colors.goldLight} /><Text style={styles.selectorText}>{value.replace(":", "h")}</Text><Ionicons name="chevron-forward" size={18} color="#888" /></TouchableOpacity>{visible ? <DateTimePicker value={pickerValue} mode="time" is24Hour minuteInterval={5} display={Platform.OS === "android" ? "clock" : "spinner"} onChange={handleChange} /> : null}</View>;
}

const webInputStyle = {
  width: "100%",
  minHeight: 50,
  borderRadius: 15,
  padding: "0 14px",
  color: "#ffffff",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontSize: 16,
  fontWeight: 700,
  colorScheme: "dark",
  boxSizing: "border-box",
  outline: "none",
} as const;

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" }, loadingText: { color: "#D8D8D8" }, container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.42 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.68)" }, content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 150 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 5 }, subtitle: { color: "#D0D0D0", marginTop: 8, marginBottom: 22, lineHeight: 20 }, formCard: { padding: 18, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, label: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 8 }, input: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, notes: { minHeight: 95, paddingTop: 13, textAlignVertical: "top" },
  selector: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, selectorText: { flex: 1, color: "#fff", fontWeight: "800", textTransform: "capitalize" }, placeholder: { color: "#777" }, chipRow: { flexDirection: "row", gap: 10 }, statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", paddingHorizontal: 8 }, chipActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight }, chipText: { color: "#ddd", fontWeight: "800", fontSize: 11 }, chipTextActive: { color: "#080808" }, saveButton: { minHeight: 54, borderRadius: 17, marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Theme.colors.gold }, saveText: { color: "#080808", fontWeight: "900", letterSpacing: 0.3, fontSize: 11 },
});