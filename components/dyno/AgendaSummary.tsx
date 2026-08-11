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
  const ready = upcoming > 0 && awaitingResponse === 0;
  const items = [
    { icon: "calendar-outline" as const, label: "À venir", value: upcoming, tone: "gold" as const },
    { icon: "time-outline" as const, label: "À répondre", value: awaitingResponse, tone: awaitingResponse > 0 ? "warning" as const : "muted" as const },
    { icon: "checkmark-circle-outline" as const, label: "Confirmés", value: confirmed, tone: "positive" as const },
  ];

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>AGENDA DYNO</Text>
          <Text style={styles.title}>Vue d’ensemble</Text>
          <Text style={styles.subtitle}>Les informations importantes, sans surcharge.</Text>
        </View>
        <View style={[styles.statePill, ready && styles.statePillReady]}>
          <View style={[styles.stateDot, ready && styles.stateDotReady]} />
          <Text style={[styles.stateText, ready && styles.stateTextReady]}>{ready ? "À JOUR" : awaitingResponse > 0 ? "ACTION" : "CALME"}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <View style={[styles.iconBox, item.tone === "positive" && styles.iconPositive, item.tone === "warning" && styles.iconWarning]}>
              <Ionicons
                name={item.icon}
                size={17}
                color={item.tone === "positive" ? "#8CE06A" : item.tone === "warning" ? "#FFB26B" : Theme.colors.goldLight}
              />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.value}>{item.value}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, padding: 15 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 13 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.35 },
  title: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 3 },
  subtitle: { color: "#AFAFAF", fontSize: 9, lineHeight: 13, marginTop: 4 },
  statePill: { minHeight: 27, paddingHorizontal: 9, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" },
  statePillReady: { backgroundColor: "rgba(132,217,86,0.07)", borderColor: "rgba(132,217,86,0.20)" },
  stateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.goldLight },
  stateDotReady: { backgroundColor: "#84D956" },
  stateText: { color: "#C7C7C7", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  stateTextReady: { color: "#9DDD7A" },
  grid: { flexDirection: "row", gap: 7 },
  item: { flex: 1, minWidth: 0, minHeight: 58, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.085)" },
  iconBox: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  iconPositive: { backgroundColor: "rgba(140,224,106,0.08)" },
  iconWarning: { backgroundColor: "rgba(255,178,107,0.09)" },
  itemText: { flex: 1, minWidth: 0 },
  value: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  label: { color: "#B9B9B9", fontSize: 8, fontWeight: "800", marginTop: 1 },
});