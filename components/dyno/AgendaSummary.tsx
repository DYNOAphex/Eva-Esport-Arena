import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type AgendaSummaryProps = {
  upcoming: number;
  awaitingResponse: number;
  confirmed: number;
};

export default function AgendaSummary({ upcoming, awaitingResponse, confirmed }: AgendaSummaryProps) {
  const items = [
    { icon: "calendar-outline" as const, label: "À venir", value: upcoming, tone: "gold" as const },
    { icon: "alert-circle-outline" as const, label: "À répondre", value: awaitingResponse, tone: awaitingResponse > 0 ? "warning" as const : "muted" as const },
    { icon: "checkmark-circle-outline" as const, label: "Confirmés", value: confirmed, tone: "positive" as const },
  ];

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>SITUATION DE L’ÉQUIPE</Text>
          <Text style={styles.title}>Agenda en un coup d’œil</Text>
        </View>
        <View style={styles.brandMark} />
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={[styles.iconBox, item.tone === "positive" && styles.iconPositive, item.tone === "warning" && styles.iconWarning]}>
              <Ionicons
                name={item.icon}
                size={18}
                color={item.tone === "positive" ? "#8CE06A" : item.tone === "warning" ? "#FF9A78" : Theme.colors.goldLight}
              />
            </View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 3 },
  brandMark: { width: 9, height: 9, borderRadius: 5, backgroundColor: Theme.colors.goldLight, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.6, shadowRadius: 8 },
  grid: { flexDirection: "row", gap: 8 },
  item: { flex: 1, minWidth: 0, padding: 10, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  iconBox: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 7, backgroundColor: "rgba(246,215,106,0.09)" },
  iconPositive: { backgroundColor: "rgba(140,224,106,0.09)" },
  iconWarning: { backgroundColor: "rgba(255,120,95,0.1)" },
  value: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" },
  label: { color: "#C7C7C7", fontSize: 9, fontWeight: "800", marginTop: 2 },
});