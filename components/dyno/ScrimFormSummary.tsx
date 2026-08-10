import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type ScrimFormSummaryProps = {
  type: string;
  opponent: string;
  date: string;
  matchTime: string;
  arena: string;
  status: string;
  isReplay?: boolean;
};

export default function ScrimFormSummary({
  type,
  opponent,
  date,
  matchTime,
  arena,
  status,
  isReplay = false,
}: ScrimFormSummaryProps) {
  const title = opponent.trim() || (isReplay ? "Replay / Strat" : "Adversaire à renseigner");
  const formattedDate = formatDate(date);

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>APERÇU DU RENDEZ-VOUS</Text>
          <Text style={styles.title} numberOfLines={1}>{title.toUpperCase()}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.typeRow}>
        <Ionicons name={isReplay ? "play-circle-outline" : "flash-outline"} size={17} color={Theme.colors.goldLight} />
        <Text style={styles.type}>{type}</Text>
      </View>

      <View style={styles.grid}>
        <SummaryItem icon="calendar-outline" label="DATE" value={formattedDate} />
        <SummaryItem icon="time-outline" label="HEURE DU MATCH" value={formatTime(matchTime)} />
        {!isReplay ? <SummaryItem icon="business-outline" label="ARÈNE" value={arena} wide /> : null}
      </View>
    </GlassCard>
  );
}

function SummaryItem({ icon, label, value, wide = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.item, wide && styles.itemWide]}>
      <View style={styles.iconBox}><Ionicons name={icon} size={16} color={Theme.colors.goldLight} /></View>
      <View style={styles.itemText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Date à sélectionner";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Date à sélectionner";
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

function formatTime(value: string) {
  return value ? value.replace(":", "h") : "À choisir";
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(246,215,106,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.42)" },
  statusText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  type: { color: "#D8D8D8", fontSize: 11, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  item: { width: "48.5%", minHeight: 56, borderRadius: 15, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  itemWide: { width: "100%" },
  iconBox: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  itemText: { flex: 1, minWidth: 0 },
  label: { color: "#929292", fontSize: 7, fontWeight: "900" },
  value: { color: "#F2F2F2", fontSize: 10, fontWeight: "900", marginTop: 3, textTransform: "capitalize" },
});
