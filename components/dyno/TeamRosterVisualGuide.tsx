import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

export function TeamPresenceGauge({ rate, present, total }: { rate: number; present: number; total: number }) {
  const label = total ? `${present}/${total} présences` : "Pas encore de données";
  const tone = total === 0 ? "#888" : rate >= 80 ? "#84D956" : rate >= 50 ? Theme.colors.goldLight : "#FF8A7A";
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.labelRow}>
          <Ionicons name="pulse-outline" size={13} color={tone} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={[styles.rate, { color: tone }]}>{total ? `${rate}%` : "—"}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(rate, 100))}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

export function TeamConnectionState({ linked }: { linked: boolean }) {
  return (
    <View style={[styles.connection, linked ? styles.connectionLinked : styles.connectionMissing]}>
      <Ionicons name={linked ? "checkmark-circle" : "alert-circle-outline"} size={12} color={linked ? "#84D956" : "#FFCB6B"} />
      <Text style={[styles.connectionText, linked ? styles.connectionTextLinked : styles.connectionTextMissing]}>
        {linked ? "Compte lié" : "Compte à associer"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 11 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  label: { color: "#BDBDBD", fontSize: 9, fontWeight: "800" },
  rate: { fontSize: 12, fontWeight: "900" },
  track: { height: 4, borderRadius: 999, overflow: "hidden", marginTop: 7, backgroundColor: "rgba(255,255,255,0.09)" },
  fill: { height: "100%", borderRadius: 999 },
  connection: { alignSelf: "flex-start", minHeight: 23, paddingHorizontal: 7, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: StyleSheet.hairlineWidth },
  connectionLinked: { backgroundColor: "rgba(132,217,86,0.06)", borderColor: "rgba(132,217,86,0.2)" },
  connectionMissing: { backgroundColor: "rgba(255,203,107,0.07)", borderColor: "rgba(255,203,107,0.25)" },
  connectionText: { fontSize: 8, fontWeight: "900" },
  connectionTextLinked: { color: "#A7E58A" },
  connectionTextMissing: { color: "#FFD58B" },
});
