import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getMatches, Match, subscribeToMatches } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");

export default function PlanningScreen() {
  const [matches, setMatches] = useState<Match[]>([]);

  const loadMatches = useCallback(async () => {
    setMatches(await getMatches());
  }, []);

  useEffect(() => {
    loadMatches();
    return subscribeToMatches(setMatches);
  }, [loadMatches]);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Tous les scrims et matchs de division ajoutés par l'équipe.</Text>

          {matches.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={40} color={Theme.colors.goldLight} />
              <Text style={styles.emptyTitle}>Agenda vide</Text>
              <Text style={styles.emptyText}>Ajoute un match depuis l'onglet Scrims avec le bouton +.</Text>
            </View>
          ) : (
            matches.map((match) => (
              <View key={match.id} style={styles.card}>
                <View style={styles.dateColumn}>
                  <Text style={styles.day}>{getDay(match.date)}</Text>
                  <Text style={styles.month}>{getMonth(match.date)}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.metaRow}>
                    <Text style={styles.type}>{match.type.toUpperCase()}</Text>
                    <Text style={[styles.status, match.status === "Confirmé" && styles.confirmed, match.status === "Annulé" && styles.cancelled]}>
                      {match.status}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>DYNO vs {match.opponent}</Text>
                  <View style={styles.detailsRow}>
                    <Detail icon="time-outline" text={match.time} />
                    <Detail icon="business-outline" text={match.arena} />
                  </View>
                  {match.availability ? (
                    <View style={[styles.availabilityBadge, match.availability === "Disponible" ? styles.available : styles.unavailable]}>
                      <Ionicons name={match.availability === "Disponible" ? "checkmark" : "close"} size={14} color="#080808" />
                      <Text style={styles.availabilityText}>{match.availability}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={16} color={Theme.colors.goldLight} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

function getDay(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "--" : date.getDate().toString().padStart(2, "0");
}

function getMonth(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "---" : date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.6 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 24, lineHeight: 20 },
  emptyCard: { alignItems: "center", padding: 30, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.78)", borderWidth: 1, borderColor: "rgba(224,184,67,0.38)" },
  emptyTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#BEBEBE", textAlign: "center", lineHeight: 20, marginTop: 7 },
  card: { flexDirection: "row", marginBottom: 15, padding: 16, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" },
  dateColumn: { width: 66, height: 78, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F0E6", marginRight: 15 },
  day: { color: "#111", fontSize: 28, fontWeight: "900", lineHeight: 31 },
  month: { color: "#7D6422", fontSize: 11, fontWeight: "900" },
  cardContent: { flex: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  type: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  status: { color: "#E2C567", fontSize: 11, fontWeight: "800" },
  confirmed: { color: "#87D958" },
  cancelled: { color: "#FF7777" },
  eventTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 9 },
  detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 13, marginTop: 12 },
  detail: { flexDirection: "row", alignItems: "center", gap: 5 },
  detailText: { color: "#D2D2D2", fontSize: 12 },
  availabilityBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, marginTop: 12 },
  available: { backgroundColor: "#84D956" },
  unavailable: { backgroundColor: "#FF7474" },
  availabilityText: { color: "#080808", fontSize: 10, fontWeight: "900" },
});
