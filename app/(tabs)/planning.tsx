import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

const events = [
  { day: "Aujourd'hui", time: "18:00", title: "Entraînement", type: "Training" },
  { day: "Aujourd'hui", time: "20:00", title: "Scrim vs Phoenix", type: "Scrim" },
  { day: "Demain", time: "19:30", title: "Division", type: "Division" },
];

export default function PlanningScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Planning</Text>
        <Text style={styles.subtitle}>Vue rapide des prochains événements de l'équipe.</Text>

        {events.map((event) => (
          <View key={`${event.day}-${event.time}-${event.title}`} style={styles.card}>
            <View style={styles.metaRow}>
              <Text style={styles.day}>{event.day}</Text>
              <Text style={styles.type}>{event.type}</Text>
            </View>
            <Text style={styles.time}>{event.time}</Text>
            <Text style={styles.eventTitle}>{event.title}</Text>
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  day: {
    color: Theme.colors.gold,
    fontWeight: "800",
  },
  type: {
    color: Theme.colors.textMuted,
    fontWeight: "700",
  },
  time: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  eventTitle: {
    color: Theme.colors.textMuted,
    marginTop: 6,
    fontSize: 15,
  },
});
