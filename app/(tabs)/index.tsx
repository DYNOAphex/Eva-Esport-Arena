import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

const cards = [
  { title: "⚔️ Prochain Scrim", value: "Team Phoenix", detail: "Aujourd'hui • 20:00" },
  { title: "📅 Planning", value: "3 événements", detail: "Cette semaine" },
  { title: "🏆 Division", value: "2 matchs", detail: "À venir" },
  { title: "👥 Équipe", value: "8 joueurs", detail: "Actifs" },
  { title: "🔔 Notifications", value: "2 nouvelles", detail: "Non lues" },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>EVA ESPORT ARENA</Text>
        <Text style={styles.title}>Bienvenue 👋</Text>
        <Text style={styles.subtitle}>Tout ce qu'il faut pour gérer vos scrims, votre planning et votre équipe.</Text>

        {cards.map((card) => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardDetail}>{card.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  kicker: {
    color: Theme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: Theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 22,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: Theme.colors.gold,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  cardValue: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardDetail: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
});
