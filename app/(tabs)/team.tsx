import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

const members = [
  { name: "DYNO", role: "Fondateur" },
  { name: "Lucas", role: "Capitaine" },
  { name: "Nathan", role: "Joueur" },
  { name: "Hugo", role: "Joueur" },
];

export default function TeamScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Équipe</Text>
        <Text style={styles.subtitle}>Retrouvez les membres et leurs rôles.</Text>

        {members.map((member) => (
          <View key={member.name} style={styles.card}>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.role}>{member.role}</Text>
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
  name: {
    color: Theme.colors.gold,
    fontWeight: "900",
    fontSize: 18,
  },
  role: {
    color: Theme.colors.textMuted,
    marginTop: 8,
  },
});
