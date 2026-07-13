import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

const marbleSource = require("../../assets/images/background-marble.jpg");

const members = [
  { name: "DYNO", role: "Fondateur", status: "En ligne" },
  { name: "Lucas", role: "Capitaine", status: "En ligne" },
  { name: "Nathan", role: "Joueur", status: "Absent" },
  { name: "Hugo", role: "Joueur", status: "En ligne" },
];

export default function TeamScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Équipe</Text>
          <Text style={styles.subtitle}>Les membres, leurs rôles et leur statut actuel.</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{members.length}</Text>
              <Text style={styles.summaryLabel}>Membres</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{members.filter((member) => member.status === "En ligne").length}</Text>
              <Text style={styles.summaryLabel}>En ligne</Text>
            </View>
          </View>

          {members.map((member) => (
            <View key={member.name} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.name.slice(0, 1)}</Text>
                <View style={[styles.statusDot, member.status !== "En ligne" && styles.offlineDot]} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={styles.role}>{member.role}</Text>
              </View>
              <View style={styles.statusPill}>
                <Ionicons name={member.status === "En ligne" ? "checkmark-circle" : "moon-outline"} size={15} color={member.status === "En ligne" ? "#7DD853" : "#B9B9B9"} />
                <Text style={styles.statusText}>{member.status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.6 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 },
  summaryCard: { flexDirection: "row", alignItems: "center", borderRadius: 24, padding: 18, marginBottom: 16, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { color: "#fff", fontSize: 28, fontWeight: "900" },
  summaryLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "800", marginTop: 4 },
  separator: { width: 1, height: 42, backgroundColor: "rgba(255,255,255,0.12)" },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 22, padding: 15, marginBottom: 13, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.34)" },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#151515", borderWidth: 1, borderColor: Theme.colors.goldLight },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  statusDot: { position: "absolute", right: 1, bottom: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: "#45D15A", borderWidth: 2, borderColor: "#0A0A0A" },
  offlineDot: { backgroundColor: "#777" },
  memberInfo: { flex: 1, marginLeft: 13 },
  name: { color: "#fff", fontWeight: "900", fontSize: 17 },
  role: { color: Theme.colors.goldLight, marginTop: 4, fontSize: 12, fontWeight: "700" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" },
  statusText: { color: "#D4D4D4", fontSize: 10, fontWeight: "700" },
});
