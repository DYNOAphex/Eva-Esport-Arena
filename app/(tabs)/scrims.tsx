import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { createElement, useCallback, useMemo, useState } from "react";
import { Alert, ImageBackground, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import ScrimFormSummary from "../../components/dyno/ScrimFormSummary";
import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { createMatch, getMatch, updateMatch } from "../../services/matchStore";
import { notifyMatchCreated, requestNotificationPermission, scheduleMatchNotification } from "../../services/notifications";
import type { MatchArena, MatchStatus, MatchType } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
const arenas: MatchArena[] = ["Arène 1", "Arène 2"];
const statuses: MatchStatus[] = ["En attente", "Confirmé", "Annulé"];
const appointmentTypes: MatchType[] = ["Scrim", "Replay / Strat"];

export default function ScrimsScreen() {
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = typeof params.editId === "string" ? params.editId : undefined;
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<MatchType>("Scrim");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState("");
  const [matchTime, setMatchTime] = useState("21:20");
  const [matchTimeAlt, setMatchTimeAlt] = useState("22:00");
  const [arena, setArena] = useState<MatchArena>("Arène 1");
  const [status, setStatus] = useState<MatchStatus>("En attente");
  const [notes, setNotes] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const isReplay = type === "Replay / Strat";

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setAuthorized(null);

      void getScrimPermissions().then(async (permissions) => {
        if (!active) return;
        const allowed = editId ? permissions.canManage : permissions.canCreate;
        setAuthorized(allowed);
        if (!allowed) {
          Alert.alert(
            "Accès refusé",
            "Ton compte n'a pas encore le droit de créer ou gérer ce rendez-vous. Les droits viennent d'être revérifiés.",
            [{ text: "Retour", onPress: () => router.replace("/(tabs)/planning") }],
          );
          return;
        }

        if (editId) {
          const match = await getMatch(editId);
          if (!active || !match) return;
          setType(match.type);
          setOpponent(match.opponent);
          setDate(match.date);
          setMatchTime(normalizeTime(match.matchTime, "21:20"));
          setMatchTimeAlt(normalizeTime(match.matchTimeAlt, suggestSecondTime(match.matchTime)));
          setArena(match.arena);
          setStatus(match.status);
          setNotes(match.notes ?? "");
        }
      });

      return () => { active = false; };
    }, [editId]),
  );

  const formReady = useMemo(() => {
    const hasTitle = Boolean(opponent.trim() || isReplay);
    return hasTitle && /^\d{4}-\d{2}-\d{2}$/.test(date) && matchTime !== matchTimeAlt;
  }, [date, isReplay, matchTime, matchTimeAlt, opponent]);

  function chooseType(value: MatchType) {
    setType(value);
    setValidationMessage("");
    if (value === "Replay / Strat") {
      setArena("Aucune");
      if (!opponent.trim()) setOpponent("Replay / Strat");
    } else {
      if (opponent === "Replay / Strat") setOpponent("");
      if (arena === "Aucune") setArena("Arène 1");
    }
  }

  async function handleSave() {
    if (!authorized || saving) return;
    const title = opponent.trim() || (isReplay ? "Replay / Strat" : "");

    if (!title) {
      setValidationMessage("Renseigne l’équipe adverse avant de programmer le scrim.");
      Alert.alert("Équipe adverse manquante", "Indique l'équipe adverse avant de programmer le scrim.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setValidationMessage("Sélectionne une date avant de programmer le rendez-vous.");
      Alert.alert("Date manquante", "Sélectionne une date avant de programmer le rendez-vous.");
      return;
    }
    if (matchTime === matchTimeAlt) {
      setValidationMessage("Choisis deux horaires différents.");
      Alert.alert("Horaires identiques", "Les deux possibilités doivent avoir des horaires différents.");
      return;
    }

    try {
      if (!editId && Platform.OS === "web") await requestNotificationPermission().catch(() => false);
      setSaving(true);
      setValidationMessage("");

      const input = {
        type,
        opponent: title,
        date,
        arrivalTime: matchTime,
        matchTime,
        matchTimeAlt,
        arena: isReplay ? "Aucune" as const : arena,
        status,
        notes: notes.trim(),
      };

      const match = editId ? await updateMatch(editId, input) : await createMatch(input);
      if (!editId) {
        await notifyMatchCreated({
          type: match.type,
          opponent: match.opponent,
          date: match.date,
          matchTime: match.matchTime,
          matchTimeAlt: match.matchTimeAlt,
          arena: match.arena,
        }).catch(() => null);

        const firstStart = new Date(`${match.date}T${earliestTime(match.matchTime, match.matchTimeAlt)}:00`);
        if (!Number.isNaN(firstStart.getTime())) {
          await scheduleMatchNotification({ opponent: match.opponent, matchDate: firstStart }).catch(() => null);
        }
      }

      const successTitle = isReplay
        ? (editId ? "Rendez-vous modifié" : "Rendez-vous programmé")
        : (editId ? "Scrim modifié" : "Scrim programmé");
      Alert.alert(successTitle, `${match.opponent} est enregistré avec les créneaux ${formatTime(match.matchTime)} et ${formatTime(match.matchTimeAlt)}.`, [
        { text: "Voir l'Agenda", onPress: () => router.replace("/(tabs)/planning") },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Le rendez-vous n'a pas pu être enregistré.";
      setValidationMessage(message);
      Alert.alert("Erreur", message);
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
          <Text style={styles.title}>{editId ? "Modifier le rendez-vous" : "Programmer un rendez-vous"}</Text>
          <Text style={styles.subtitle}>{editId ? "Mets à jour les informations." : "Ajoute un scrim ou une session replay / strat à l'agenda."}</Text>

          <View style={styles.formCard}>
            <Label text="Type de rendez-vous" />
            <View style={styles.chipRow}>
              {appointmentTypes.map((value) => (
                <TouchableOpacity key={value} style={[styles.chip, type === value && styles.chipActive]} onPress={() => chooseType(value)}>
                  <Text style={[styles.chipText, type === value && styles.chipTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text={isReplay ? "Titre du rendez-vous" : "Équipe adverse"} />
            <TextInput
              style={styles.input}
              placeholder={isReplay ? "Ex. Analyse VOD / Travail défensif" : "Ex. TITANS"}
              placeholderTextColor="#777"
              value={opponent}
              onChangeText={(value) => { setOpponent(value); setValidationMessage(""); }}
              autoCapitalize={isReplay ? "sentences" : "characters"}
            />

            <Label text="Date" />
            <DateField value={date} onChange={(value) => { setDate(value); setValidationMessage(""); }} />

            <Label text="Horaires possibles" />
            <View style={styles.timeChoiceRow}>
              <TimeField label="HORAIRE 1" value={matchTime} onChange={(value) => { setMatchTime(value); setValidationMessage(""); }} />
              <TimeField label="HORAIRE 2" value={matchTimeAlt} onChange={(value) => { setMatchTimeAlt(value); setValidationMessage(""); }} />
            </View>
            <Text style={styles.timeHint}>Appuie sur chaque horaire pour le modifier librement.</Text>

            {!isReplay ? (
              <>
                <Label text="Arène" />
                <View style={styles.chipRow}>
                  {arenas.map((value) => (
                    <TouchableOpacity key={value} style={[styles.chip, arena === value && styles.chipActive]} onPress={() => setArena(value)}>
                      <Text style={[styles.chipText, arena === value && styles.chipTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}

            <Label text="Statut" />
            <View style={styles.statusWrap}>
              {statuses.map((value) => (
                <TouchableOpacity key={value} style={[styles.chip, status === value && styles.chipActive]} onPress={() => setStatus(value)}>
                  <Text style={[styles.chipText, status === value && styles.chipTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Notes (optionnel)" />
            <TextInput
              style={[styles.input, styles.notes]}
              placeholder={isReplay ? "Objectifs, maps ou points à revoir" : "Informations utiles"}
              placeholderTextColor="#777"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {validationMessage ? (
            <View style={styles.validationBox}>
              <Ionicons name="alert-circle-outline" size={19} color="#FFCA6A" />
              <Text style={styles.validationText}>{validationMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.previewLabel}>VÉRIFICATION AVANT ENREGISTREMENT</Text>
          <ScrimFormSummary
            type={type}
            opponent={opponent}
            date={date}
            matchTime={matchTime}
            matchTimeAlt={matchTimeAlt}
            arena={isReplay ? "Aucune" : arena}
            status={status}
            isReplay={isReplay}
          />

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityHint={formReady ? "Programme le rendez-vous" : "Affiche les informations manquantes"}
            style={[styles.saveButton, saving && styles.disabled]}
            disabled={saving}
            onPress={() => void handleSave()}
          >
            <Ionicons name={formReady ? "checkmark-circle-outline" : "alert-circle-outline"} size={20} color="#080808" />
            <Text style={styles.saveText}>{saving ? "ENREGISTREMENT…" : editId ? "ENREGISTRER LES MODIFICATIONS" : isReplay ? "PROGRAMMER LE RENDEZ-VOUS" : "PROGRAMMER LE SCRIM"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  if (Platform.OS === "web") {
    return createElement("input", {
      type: "date",
      value,
      min: todayValue(),
      onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      style: webInputStyle,
      "aria-label": "Date du rendez-vous",
    }) as never;
  }

  const [visible, setVisible] = useState(false);
  const current = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setVisible(false);
    if (event.type === "dismissed" || !selected) return;
    onChange(`${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`);
  }
  const label = value
    ? current.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "Choisir une date";

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={20} color={Theme.colors.goldLight} />
        <Text style={[styles.selectorText, !value && styles.placeholder]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color="#888" />
      </TouchableOpacity>
      {visible ? <DateTimePicker value={current} mode="date" minimumDate={todayDate()} display={Platform.OS === "android" ? "calendar" : "spinner"} onChange={handleChange} /> : null}
    </View>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);

  if (Platform.OS === "web") {
    return (
      <View style={styles.timeFieldWrap}>
        <Text style={styles.timeSlotLabel}>{label}</Text>
        {createElement("input", {
          type: "time",
          value,
          step: 300,
          onChange: (event: { target: { value: string } }) => onChange(event.target.value),
          style: webTimeInputStyle,
          "aria-label": label,
        }) as never}
      </View>
    );
  }

  const [hours, minutes] = value.split(":").map(Number);
  const pickerValue = new Date();
  pickerValue.setHours(hours || 0, minutes || 0, 0, 0);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setVisible(false);
    if (event.type === "dismissed" || !selected) return;
    onChange(`${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}`);
  }

  return (
    <View style={styles.timeFieldWrap}>
      <Text style={styles.timeSlotLabel}>{label}</Text>
      <TouchableOpacity style={styles.timeChoice} onPress={() => setVisible(true)} activeOpacity={0.82}>
        <Ionicons name="time-outline" size={21} color={Theme.colors.goldLight} />
        <Text style={styles.timeChoiceText}>{formatTime(value)}</Text>
        <Ionicons name="create-outline" size={17} color="#9A9A9A" />
      </TouchableOpacity>
      {visible ? <DateTimePicker value={pickerValue} mode="time" is24Hour minuteInterval={5} display={Platform.OS === "android" ? "clock" : "spinner"} onChange={handleChange} /> : null}
    </View>
  );
}

function normalizeTime(value: string | undefined, fallback: string) {
  return value && /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function suggestSecondTime(first: string) {
  return first === "22:00" ? "21:20" : "22:00";
}

function earliestTime(first: string, second?: string) {
  return second && second < first ? second : first;
}

function formatTime(value?: string) {
  return value ? value.replace(":", "h") : "--h--";
}

function todayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function todayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
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

const webTimeInputStyle = {
  ...webInputStyle,
  minHeight: 58,
  fontSize: 18,
} as const;

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  loadingText: { color: "#D8D8D8" },
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.42 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.68)" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 150 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#D0D0D0", marginTop: 8, marginBottom: 22, lineHeight: 20 },
  formCard: { padding: 18, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  label: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", marginTop: 14, marginBottom: 8 },
  input: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, color: "#fff", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  notes: { minHeight: 95, paddingTop: 13, textAlignVertical: "top" },
  selector: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  selectorText: { flex: 1, color: "#fff", fontWeight: "800", textTransform: "capitalize" },
  placeholder: { color: "#777" },
  chipRow: { flexDirection: "row", gap: 10 },
  statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flex: 1, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", paddingHorizontal: 8 },
  chipActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  chipText: { color: "#ddd", fontWeight: "800", fontSize: 11, textAlign: "center" },
  chipTextActive: { color: "#080808" },
  timeChoiceRow: { flexDirection: "row", gap: 10 },
  timeFieldWrap: { flex: 1, minWidth: 0 },
  timeSlotLabel: { color: "#AFAFAF", fontSize: 8, fontWeight: "900", letterSpacing: 0.9, marginBottom: 6 },
  timeChoice: { minHeight: 62, borderRadius: 17, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(246,215,106,0.28)", paddingHorizontal: 9 },
  timeChoiceText: { flex: 1, color: "#FFFFFF", fontSize: 18, fontWeight: "900", textAlign: "center" },
  timeHint: { color: "#AFAFAF", fontSize: 10, lineHeight: 15, marginTop: 8 },
  validationBox: { marginTop: 14, padding: 13, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,166,74,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,202,106,0.38)" },
  validationText: { flex: 1, color: "#FFD996", fontSize: 11, lineHeight: 16, fontWeight: "800" },
  previewLabel: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 22, marginBottom: 9 },
  saveButton: { minHeight: 54, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Theme.colors.gold },
  saveText: { color: "#080808", fontWeight: "900", letterSpacing: 0.3, fontSize: 11 },
  disabled: { opacity: 0.55 },
});
