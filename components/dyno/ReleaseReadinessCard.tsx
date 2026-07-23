import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type ReleaseReadinessCardProps = {
  installedVersion: string;
  targetVersion: string;
  firebaseReady?: boolean;
  notificationsEnabled: boolean;
  updateChecked: boolean;
};

export default function ReleaseReadinessCard({
  installedVersion,
  targetVersion,
  firebaseReady,
  notificationsEnabled,
  updateChecked,
}: ReleaseReadinessCardProps) {
  const checks = [
    { label: `Version cible ${targetVersion}`, ready: installedVersion === targetVersion },
    { label: "Synchronisation Firebase", ready: firebaseReady === true },
    { label: "Notifications activées", ready: notificationsEnabled },
    { label: "Canal de mise à jour vérifié", ready: updateChecked },
  ];
  const readyCount = checks.filter((item) => item.ready).length;
  const releaseReady = readyCount === checks.length;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={[styles.iconBox, releaseReady && styles.iconBoxReady]}>
          <Ionicons
            name={releaseReady ? "rocket-outline" : "construct-outline"}
            size={23}
            color={releaseReady ? "#83DD57" : Theme.colors.goldLight}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>PRÉPARATION DE LA VERSION</Text>
          <Text style={styles.title}>{releaseReady ? "Prête à être publiée" : `${readyCount}/4 vérifications prêtes`}</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(readyCount / checks.length) * 100}%` }]} />
      </View>

      <View style={styles.checks}>
        {checks.map((item) => (
          <View key={item.label} style={styles.checkRow}>
            <Ionicons
              name={item.ready ? "checkmark-circle" : "ellipse-outline"}
              size={18}
              color={item.ready ? "#83DD57" : "#747474"}
            />
            <Text style={[styles.checkLabel, item.ready && styles.checkLabelReady]}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Une mise à jour JavaScript peut être publiée par Expo Updates. Le numéro de version Android change uniquement après installation d’un nouvel APK.
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.09)" },
  iconBoxReady: { backgroundColor: "rgba(131,221,87,0.09)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 },
  progressTrack: { height: 7, overflow: "hidden", borderRadius: 999, marginTop: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  progressFill: { height: "100%", borderRadius: 999, backgroundColor: Theme.colors.goldLight },
  checks: { marginTop: 12 },
  checkRow: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  checkLabel: { flex: 1, color: "#8D8D8D", fontSize: 11, fontWeight: "800" },
  checkLabelReady: { color: "#E5E5E5" },
  hint: { color: "#A9A9A9", fontSize: 10, lineHeight: 15, marginTop: 13 },
});
