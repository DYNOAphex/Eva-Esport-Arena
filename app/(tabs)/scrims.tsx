import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

const scrims = [
  { opponent: "Team Phoenix", time: "20:00", status: "Confirmé", score: "BO3" },
  { opponent: "Team Nova", time: "21:30", status: "En attente", score: "BO1" },
];

export default function ScrimsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scrims</Text>
        <Text style={styles.subtitle}>Gérez les matchs d'entraînement de l'équipe.</Text>

        {scrims.map((scrim) => (
          <View key={`${scrim.opponent}-${scrim.time}`} style={styles.card}>
            <Text style={styles.opponent}>VS {scrim.opponent}</Text>
            <Text style={styles.time}>{scrim.time}</Text>
            <Text style={styles.score}>{scrim.score}</Text>
            <Text style={styles.status}>{scrim.status}</Text>
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
  title: {
    color: Theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: Theme.colors.textMuted,
    marginTop: 8,
    marginBottom: 22,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  opponent: {
    color: Theme.colors.gold,
    fontWeight: "900",
    fontSize: 18,
  },
  time: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  score: {
    color: Theme.colors.textMuted,
    marginTop: 6,
  },
  status: {
    color: Theme.colors.text,
    marginTop: 10,
    fontWeight: "700",
  },
});
