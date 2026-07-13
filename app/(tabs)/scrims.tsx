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

export default function ScrimsScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<MatchType>("Scrim");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [arena, setArena] = useState<MatchArena>("Arène 1");
  const [status, setStatus] = useState<MatchStatus>("En attente");
  const [notes, setNotes] = useState("");

  const loadMatches = useCallback(async () => {
    setMatches(await getMatches());
  }, []);

  useEffect(() => {
    loadMatches();
    return subscribeToMatches(setMatches);
  }, [loadMatches]);

  const upcomingMatches = useMemo(
    () => matches.filter((match) => match.status !== "Annulé" || new Date(`${match.date}T${match.time}`).getTime() > Date.now()),
    [matches],
  );

  function resetForm() {
    setType("Scrim");
    setOpponent("");
    setDate("");
    setTime("");
    setArena("Arène 1");
    setStatus("En attente");
    setNotes("");
  }

  async function handleCreateMatch() {
    const cleanOpponent = opponent.trim();
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

    if (!cleanOpponent || !validDate || !validTime) {
      Alert.alert(
        "Informations incomplètes",
        "Indique l'équipe adverse, une date au format AAAA-MM-JJ et une heure au format HH:MM.",
      );
      return;
    }

    try {
      setSaving(true);
      const match = await createMatch({
        type,
        opponent: cleanOpponent,
        date,
        time,
        arena,
        status,
        notes: notes.trim(),
      });

      const matchDate = toMatchDate(match);
      if (matchDate) {
        await scheduleMatchNotification({ opponent: match.opponent, matchDate }).catch(() => null);
      }

      setModalVisible(false);
      resetForm();
      Alert.alert("Match créé", `${type} contre ${cleanOpponent} ajouté au planning.`);
    } catch {
      Alert.alert("Erreur", "Le match n'a pas pu être enregistré.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailability(match: Match, value: "Disponible" | "Indisponible") {
    await setMatchAvailability(match.id, match.availability === value ? null : value);
  }

  function confirmDelete(match: Match) {
    Alert.alert(
      "Supprimer le match",
      `Supprimer ${match.type.toLowerCase()} contre ${match.opponent} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMatch(match.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
              <Text style={styles.title}>Matchs</Text>
              <Text style={styles.subtitle}>Crée les scrims et divisions, puis indique ta disponibilité.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
              <Ionicons name="add" size={30} color="#080808" />
            </TouchableOpacity>
          </View>

          {upcomingMatches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={42} color={Theme.colors.goldLight} />
              <Text style={styles.emptyTitle}>Aucun match prévu</Text>
              <Text style={styles.emptyText}>Appuie sur le bouton + pour ajouter un scrim ou une division.</Text>
            </View>
          ) : (
            upcomingMatches.map((match) => (
              <View key={match.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.typeBadge, match.type === "Division" && styles.divisionBadge]}>
                    <Ionicons name={match.type === "Scrim" ? "flash" : "trophy"} size={14} color="#080808" />
                    <Text style={styles.typeBadgeText}>{match.type}</Text>
                  </View>
                  <TouchableOpacity onLongPress={() => confirmDelete(match)} style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={22} color="#CFCFCF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.opponent}>DYNO <Text style={styles.vs}>VS</Text> {match.opponent.toUpperCase()}</Text>

                <View style={styles.infoGrid}>
                  <Info icon="calendar-outline" label="Date" value={formatDate(match.date)} />
                  <Info icon="time-outline" label="Heure" value={match.time} />
                  <Info icon="business-outline" label="Arène" value={match.arena} />
                  <Info icon="shield-checkmark-outline" label="Statut" value={match.status} />
                </View>

                {match.notes ? <Text style={styles.notes}>{match.notes}</Text> : null}

                <Text style={styles.availabilityTitle}>TA DISPONIBILITÉ</Text>
                <View style={styles.availabilityRow}>
                  <TouchableOpacity
                    style={[styles.availabilityButton, match.availability === "Disponible" && styles.availableActive]}
                    onPress={() => handleAvailability(match, "Disponible")}
                  >
                    <Ionicons name="checkmark-circle" size={19} color={match.availability === "Disponible" ? "#081008" : "#78D54B"} />
                    <Text style={[styles.availabilityText, match.availability === "Disponible" && styles.availabilityTextActive]}>Disponible</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.availabilityButton, match.availability === "Indisponible" && styles.unavailableActive]}
                    onPress={() => handleAvailability(match, "Indisponible")}
                  >
                    <Ionicons name="close-circle" size={19} color={match.availability === "Indisponible" ? "#170606" : "#FF7373"} />
                    <Text style={[styles.availabilityText, match.availability === "Indisponible" && styles.availabilityTextActive]}>Pas disponible</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.deleteHint}>Maintiens les trois points pour supprimer</Text>
              </View>
            ))
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalKicker}>NOUVEL ÉVÉNEMENT</Text>
                    <Text style={styles.modalTitle}>Créer un match</Text>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <FieldLabel text="Type" />
                <ChipRow values={types} selected={type} onSelect={(value) => setType(value as MatchType)} />

                <FieldLabel text="Équipe adverse" />
                <Input icon="people-outline" placeholder="Ex. TITANS" value={opponent} onChangeText={setOpponent} />

                <FieldLabel text="Date" />
                <Input icon="calendar-outline" placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" />

                <FieldLabel text="Heure du match" />
                <Input icon="time-outline" placeholder="HH:MM" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" />

                <FieldLabel text="Arène" />
                <ChipRow values={arenas} selected={arena} onSelect={(value) => setArena(value as MatchArena)} />

                <FieldLabel text="Statut" />
                <ChipRow values={statuses} selected={status} onSelect={(value) => setStatus(value as MatchStatus)} />

                <FieldLabel text="Notes (optionnel)" />
                <View style={[styles.inputWrap, styles.notesInputWrap]}>
                  <Ionicons name="document-text-outline" size={20} color={Theme.colors.goldLight} />
                  <TextInput
                    placeholder="Informations utiles pour l'équipe"
                    placeholderTextColor="#989898"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                    style={[styles.input, styles.notesInput]}
                  />
                </View>

                <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={handleCreateMatch} disabled={saving}>
                  <Text style={styles.saveText}>{saving ? "ENREGISTREMENT…" : "CRÉER LE MATCH"}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#080808" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={19} color={Theme.colors.goldLight} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function ChipRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {values.map((value) => (
        <TouchableOpacity key={value} style={[styles.chip, selected === value && styles.chipActive]} onPress={() => onSelect(value)}>
          <Text style={[styles.chipText, selected === value && styles.chipTextActive]}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Input({ icon, ...props }: { icon: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={20} color={Theme.colors.goldLight} />
      <TextInput placeholderTextColor="#989898" style={styles.input} {...props} />
    </View>
  );
}

function formatDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.62 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.57)" },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 130 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  headerText: { flex: 1, paddingRight: 14 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#D0D0D0", fontSize: 14, lineHeight: 20, marginTop: 7 },
  addButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, shadowColor: Theme.colors.gold, shadowOpacity: 0.55, shadowRadius: 14, elevation: 10 },
  emptyCard: { alignItems: "center", padding: 30, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.78)", borderWidth: 1, borderColor: "rgba(224,184,67,0.38)" },
  emptyTitle: { color: "#fff", fontWeight: "900", fontSize: 19, marginTop: 12 },
  emptyText: { color: "#BDBDBD", textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: { padding: 18, marginBottom: 16, borderRadius: 25, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.42)", shadowColor: Theme.colors.gold, shadowOpacity: 0.16, shadowRadius: 14, elevation: 6 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, backgroundColor: Theme.colors.goldLight },
  divisionBadge: { backgroundColor: "#F0C95B" },
  typeBadgeText: { color: "#080808", fontWeight: "900", fontSize: 12 },
  moreButton: { padding: 8 },
  opponent: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 17 },
  vs: { color: Theme.colors.gold },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  infoItem: { width: "48%", flexDirection: "row", gap: 9, alignItems: "center", marginBottom: 15 },
  infoLabel: { color: "#979797", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.6 },
  infoValue: { color: "#fff", fontSize: 13, fontWeight: "800", marginTop: 2 },
  notes: { color: "#CFCFCF", lineHeight: 20, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", marginBottom: 15 },
  availabilityTitle: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 4, marginBottom: 10 },
  availabilityRow: { flexDirection: "row", gap: 10 },
  availabilityButton: { flex: 1, minHeight: 46, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.04)" },
  availableActive: { backgroundColor: "#84D956", borderColor: "#84D956" },
  unavailableActive: { backgroundColor: "#FF7474", borderColor: "#FF7474" },
  availabilityText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  availabilityTextActive: { color: "#080808" },
  deleteHint: { color: "#737373", fontSize: 9, textAlign: "right", marginTop: 10 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.68)" },
  modalCard: { maxHeight: "92%", borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: "#0B0B0B", borderWidth: 1, borderColor: "rgba(224,184,67,0.48)", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalKicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  modalTitle: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 3 },
  closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#1B1B1B" },
  fieldLabel: { color: "#E4E4E4", fontSize: 12, fontWeight: "800", marginTop: 13, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.22)" },
  chipActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  chipText: { color: "#D0D0D0", fontWeight: "800", fontSize: 12 },
  chipTextActive: { color: "#080808" },
  inputWrap: { minHeight: 54, borderRadius: 16, backgroundColor: "#171717", borderWidth: 1, borderColor: "rgba(224,184,67,0.22)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 14 },
  notesInputWrap: { alignItems: "flex-start", paddingTop: 14 },
  notesInput: { minHeight: 78, textAlignVertical: "top", paddingTop: 0 },
  saveButton: { minHeight: 58, borderRadius: 18, marginTop: 24, backgroundColor: Theme.colors.goldLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { color: "#080808", fontWeight: "900", letterSpacing: 1.1 },
  disabled: { opacity: 0.55 },
});
