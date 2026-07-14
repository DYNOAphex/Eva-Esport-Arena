import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";
import { canCreateScrim } from "../../services/accessControl";
import { createMatch } from "../../services/matchStore";
import { scheduleMatchNotification } from "../../services/notifications";
import type { MatchArena } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
const arenas: MatchArena[] = ["Arène 1", "Arène 2"];

export default function ScrimsScreen() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("19:30");
  const [matchTime, setMatchTime] = useState("20:00");
  const [arena, setArena] = useState<MatchArena>("Arène 1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    void canCreateScrim().then((allowed) => {
      setAuthorized(allowed);
      if (!allowed) {
        Alert.alert("Accès refusé", "Ton compte n'est pas autorisé à programmer un scrim.", [
          { text: "Retour", onPress: () => router.replace("/(tabs)/planning") },
        ]);
      }
    });
  }, []);

  async function handleCreateScrim() {
    if (!authorized) return;
    if (!opponent.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Informations incomplètes", "Indique l'équipe adverse et une date au format AAAA-MM-JJ.");
      return;
    }

    try {
      setSaving(true);
      const match = await createMatch({
        type: "Scrim",
        opponent: opponent.trim(),
        date,
        arrivalTime,
        matchTime,
        arena,
        status: "En attente",
        notes: notes.trim(),
      });
      const start = new Date(`${match.date}T${match.matchTime}:00`);
      if (!Number.isNaN(start.getTime())) {
        await scheduleMatchNotification({ opponent: match.opponent, matchDate: start }).catch(() => null);
      }
      Alert.alert("Scrim programmé", `DYNO vs ${match.opponent} a été ajouté à l'Agenda.`, [
        { text: "Voir l'Agenda", onPress: () => router.replace("/(tabs)/planning") },
      ]);
      setOpponent("");
      setDate("");
      setArrivalTime("19:30");
      setMatchTime("20:00");
      setArena("Arène 1");
      setNotes("");
    } catch {
      Alert.alert("Erreur", "Le scrim n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  if (authorized !== true) {
    return <SafeAreaView style={styles.loading}><Text style={styles.loadingText}>Vérification de l'autorisation…</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Programmer un scrim</Text>
          <Text style={styles.subtitle}>Le bouton + sert uniquement à créer un nouveau scrim.</Text>

          <View style={styles.formCard}>
            <Label text="Équipe adverse" />
            <TextInput style={styles.input} placeholder="Ex. TITANS" placeholderTextColor="#777" value={opponent} onChangeText={setOpponent} autoCapitalize="characters" />

            <Label text="Date" />
            <TextInput style={styles.input} placeholder="AAAA-MM-JJ" placeholderTextColor="#777" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />

            <Label text="Heure de rendez-vous" />
            <ClockField value={arrivalTime} onChange={setArrivalTime} />

            <Label text="Heure du match" />
            <ClockField value={matchTime} onChange={setMatchTime} />

            <Label text="Arène" />
            <View style={styles.chipRow}>
              {arenas.map((value) => (
                <TouchableOpacity key={value} style={[styles.chip, arena === value && styles.chipActive]} onPress={() => setArena(value)}>
                  <Text style={[styles.chipText, arena === value && styles.chipTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Notes (optionnel)" />
            <TextInput style={[styles.input, styles.notes]} placeholder="Informations utiles" placeholderTextColor="#777" value={notes} onChangeText={setNotes} multiline />

            <TouchableOpacity style={styles.saveButton} disabled={saving} onPress={() => void handleCreateScrim()}>
              <Ionicons name="calendar" size={19} color="#080808" />
              <Text style={styles.saveText}>{saving ? "ENREGISTREMENT…" : "PROGRAMMER LE SCRIM"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function ClockField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setVisible(false);
    if (event.type === "dismissed" || !selected) return;
    onChange(`${selected.getHours().toString().padStart(2, "0")}:${selected.getMinutes().toString().padStart(2, "0")}`);
  }

  const [hours, minutes] = value.split(":").map(Number);
  const pickerValue = new Date();
  pickerValue.setHours(hours || 0, minutes || 0, 0, 0);

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}>
        <Ionicons name="time-outline" size={20} color={Theme.colors.goldLight} />
        <Text style={styles.selectorText}>{value.replace(":", "h")}</Text>
        <Ionicons name="chevron-forward" size={18} color="#888" />
      </TouchableOpacity>
      {visible ? <DateTimePicker value={pickerValue} mode="time" is24Hour minuteInterval={5} display={Platform.OS === "android" ? "clock" : "spinner"} onChange={handleChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" }, loadingText: { color: "#D8D8D8" },
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.6 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.62)" }, content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 5 }, subtitle: { color: "#D0D0D0", marginTop: 8, marginBottom: 22, lineHeight: 20 },
  formCard: { padding: 18, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.8)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" }, label: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 8 }, input: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }, notes: { minHeight: 95, paddingTop: 13, textAlignVertical: "top" },
  selector: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }, selectorText: { flex: 1, color: "#fff", fontWeight: "800" }, chipRow: { flexDirection: "row", gap: 10 }, chip: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }, chipActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight }, chipText: { color: "#ddd", fontWeight: "800" }, chipTextActive: { color: "#080808" },
  saveButton: { minHeight: 54, borderRadius: 17, marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Theme.colors.gold }, saveText: { color: "#080808", fontWeight: "900", letterSpacing: 0.5 },
});
