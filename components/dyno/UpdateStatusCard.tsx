import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

type UpdateStatusCardProps = {
  installedVersion: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  releaseNotes?: string[];
};

export default function UpdateStatusCard({
  installedVersion,
  latestVersion,
  updateAvailable = false,
  releaseNotes = [],
}: UpdateStatusCardProps) {
  const targetVersion = latestVersion || installedVersion;

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={[styles.iconBox, updateAvailable && styles.iconBoxAvailable]}>
          <Ionicons
            name={updateAvailable ? "cloud-download-outline" : "checkmark-circle-outline"}
            size={23}
            color={updateAvailable ? Theme.colors.goldLight : "#83DD57"}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>MISE À JOUR DYNO</Text>
          <Text style={styles.title}>{updateAvailable ? "Nouvelle version disponible" : "Application à jour"}</Text>
        </View>
      </View>

      <View style={styles.versionRow}>
        <Version label="INSTALLÉE" value={installedVersion} />
        <Ionicons name="arrow-forward" size={18} color="#777777" />
        <Version label={updateAvailable ? "DISPONIBLE" : "DERNIÈRE"} value={targetVersion} highlighted={updateAvailable} />
      </View>

      {updateAvailable ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>NOUVEAUTÉS</Text>
          {(releaseNotes.length ? releaseNotes : ["Correctifs et améliorations de DYNO."]).slice(0, 4).map((note) => (
            <View key={note} style={styles.noteRow}>
              <View style={styles.bullet} />
              <Text style={styles.note}>{note}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.hint}>Aucune mise à jour plus récente n’a été détectée pour cette installation.</Text>
      )}
    </GlassCard>
  );
}

function Version({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <View style={[styles.version, highlighted && styles.versionHighlighted]}>
      <Text style={styles.versionLabel}>{label}</Text>
      <Text style={[styles.versionValue, highlighted && styles.versionValueHighlighted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(131,221,87,0.08)" },
  iconBoxAvailable: { backgroundColor: "rgba(246,215,106,0.09)" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 },
  versionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15 },
  version: { flex: 1, minWidth: 0, minHeight: 65, borderRadius: 16, paddingHorizontal: 11, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  versionHighlighted: { backgroundColor: "rgba(246,215,106,0.075)", borderColor: "rgba(246,215,106,0.35)" },
  versionLabel: { color: "#888888", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  versionValue: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", marginTop: 5 },
  versionValueHighlighted: { color: Theme.colors.goldLight },
  notesBox: { marginTop: 14, padding: 13, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.035)" },
  notesTitle: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 9 },
  bullet: { width: 5, height: 5, borderRadius: 999, marginTop: 5, backgroundColor: Theme.colors.goldLight },
  note: { flex: 1, color: "#D2D2D2", fontSize: 11, lineHeight: 16 },
  hint: { color: "#A6A6A6", fontSize: 10, lineHeight: 15, marginTop: 14 },
});
