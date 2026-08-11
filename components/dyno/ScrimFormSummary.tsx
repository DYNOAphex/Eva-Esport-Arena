import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type ScrimFormSummaryProps = {
  type: string;
  opponent: string;
  date: string;
  matchTime: string;
  matchTimeAlt?: string;
  arena: string;
  status: string;
  isReplay?: boolean;
};

export default function ScrimFormSummary({ type, opponent, date, matchTime, matchTimeAlt, arena, status, isReplay = false }: ScrimFormSummaryProps) {
  const title = opponent.trim() || (isReplay ? "Replay / Strat" : "Adversaire à renseigner");
  const formattedDate = formatDate(date);
  const complete = Boolean(opponent.trim() || isReplay) && /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.topLine}>
        <View style={styles.kickerWrap}>
          <View style={styles.liveDot} />
          <Text style={styles.kicker}>APERÇU</Text>
        </View>
        <View style={[styles.statusBadge, complete && styles.statusReady]}>
          <Ionicons name={complete ? "checkmark-circle" : "ellipse-outline"} size={13} color={Theme.colors.goldLight} />
          <Text style={styles.statusText}>{complete ? "PRÊT" : "À COMPLÉTER"}</Text>
        </View>
      </View>

      <View style={styles.matchHeader}>
        <View style={styles.titleWrap}>
          <Text style={styles.type}>{isReplay ? "SESSION" : type.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={1}>{title.toUpperCase()}</Text>
        </View>
        <View style={styles.flashBox}>
          <Ionicons name={isReplay ? "play" : "flash"} size={20} color="#080808" />
        </View>
      </View>

      <View style={styles.timeHero}>
        <View style={styles.timeIcon}><Ionicons name="time-outline" size={19} color={Theme.colors.goldLight} /></View>
        <View style={styles.timeCopy}>
          <Text style={styles.timeLabel}>HEURE DU MATCH</Text>
          <View style={styles.timesRow}>
            <Text style={styles.timeValue}>{formatTime(matchTime)}</Text>
            {matchTimeAlt ? <><Text style={styles.orText}>OU</Text><Text style={styles.timeValueAlt}>{formatTime(matchTimeAlt)}</Text></> : null}
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <SummaryItem icon="calendar-outline" label="DATE" value={formattedDate} />
        {!isReplay ? <SummaryItem icon="business-outline" label="ARÈNE" value={arena} /> : <SummaryItem icon="game-controller-outline" label="TYPE" value="Replay / Strat" />}
        <SummaryItem icon="flag-outline" label="STATUT" value={status} />
      </View>
    </GlassCard>
  );
}

function SummaryItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.item}>
      <View style={styles.iconBox}><Ionicons name={icon} size={15} color={Theme.colors.goldLight} /></View>
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

function formatTime(value?: string) { return value ? value.replace(":", "h") : "--h--"; }

const styles = StyleSheet.create({
  card: { marginBottom: 18, padding: 17 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kickerWrap: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.goldLight },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  statusReady: { backgroundColor: "rgba(246,215,106,0.10)", borderColor: "rgba(246,215,106,0.38)" },
  statusText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 0.4 },
  matchHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13 },
  titleWrap: { flex: 1, minWidth: 0 },
  type: { color: "#8E8E8E", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "900", marginTop: 3 },
  flashBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight },
  timeHero: { marginTop: 15, padding: 12, borderRadius: 17, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(246,215,106,0.07)", borderWidth: 1, borderColor: "rgba(246,215,106,0.20)" },
  timeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.10)" },
  timeCopy: { flex: 1, marginLeft: 10 },
  timeLabel: { color: "#9B9B9B", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  timesRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 },
  timeValue: { color: "#FFFFFF", fontSize: 25, fontWeight: "900" },
  timeValueAlt: { color: Theme.colors.goldLight, fontSize: 21, fontWeight: "900" },
  orText: { color: "#777", fontSize: 8, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  item: { flex: 1, minWidth: "30%", minHeight: 52, borderRadius: 14, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.09)" },
  iconBox: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)" },
  itemText: { flex: 1, minWidth: 0 },
  label: { color: "#858585", fontSize: 7, fontWeight: "900" },
  value: { color: "#EAEAEA", fontSize: 10, fontWeight: "900", marginTop: 2, textTransform: "capitalize" },
});
