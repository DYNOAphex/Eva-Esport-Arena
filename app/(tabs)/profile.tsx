import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Votre identité dans EVA Esport Arena.</Text>

        <View style={styles.card}>
          <Text style={styles.name}>DYNO</Text>
          <Text style={styles.role}>Fondateur</Text>
          <Text style={styles.meta}>98% présence</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <Text style={styles.meta}>Niveau 15</Text>
          <Text style={styles.meta}>12 scrims joués</Text>
          <Text style={styles.meta}>8 victoires</Text>
        </View>
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
    fontSize: 20,
  },
  role: {
    color: Theme.colors.textMuted,
    marginTop: 8,
  },
  meta: {
    color: Theme.colors.text,
    marginTop: 8,
  },
  sectionTitle: {
    color: Theme.colors.gold,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
});
