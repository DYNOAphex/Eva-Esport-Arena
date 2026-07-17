import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import {
  createSupportReport,
  deleteSupportReport,
  getSupportReports,
  SupportReport,
  updateSupportReportStatus,
} from "../../services/supportStore";

export default function SupportScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const permissions = await getScrimPermissions();
      setCanManage(permissions.canManage);
      if (permissions.canManage) setReports(await getSupportReports());
    } catch {
      // Le formulaire reste utilisable même si la boîte admin ne charge pas.
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
    const timer = setInterval(() => void loadReports(), 10000);
    return () => clearInterval(timer);
  }, [loadReports]);

  async function sendReport() {
    const description = message.trim();
    if (!description) {
      Alert.alert("Décris le problème", "Écris quelques mots sur ce qui ne fonctionne pas avant d’envoyer le signalement.");
      return;
    }

    setBusy(true);
    try {
      await createSupportReport(description);
      setMessage("");
      Alert.alert("Signalement envoyé", "Ton message a bien été transmis à l’administrateur dans DYNO.");
      if (canManage) await loadReports();
    } catch (error) {
      Alert.alert("Support", error instanceof Error ? error.message : "Le signalement n’a pas pu être envoyé.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleResolved(report: SupportReport) {
    try {
      const status = report.status === "Nouveau" ? "Résolu" : "Nouveau";
      const updated = await updateSupportReportStatus(report, status);
      setReports((current) => current.map((item) => item.id === report.id ? updated : item));
    } catch (error) {
      Alert.alert("Support", error instanceof Error ? error.message : "Le signalement n’a pas pu être modifié.");
    }
  }

  function confirmDelete(report: SupportReport) {
    Alert.alert(
      "Supprimer le signalement",
      `Le message de ${report.email} sera supprimé définitivement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => void deleteSupportReport(report.id)
            .then(() => setReports((current) => current.filter((item) => item.id !== report.id)))
            .catch((error) => Alert.alert("Support", error instanceof Error ? error.message : "Suppression impossible.")),
        },
      ],
    );
  }

  const newCount = reports.filter((report) => report.status === "Nouveau").length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>Décris ton problème. Il sera envoyé directement à l’administrateur dans DYNO avec les informations techniques utiles.</Text>

        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="help-buoy-outline" size={28} color={Theme.colors.goldLight} /></View>
          <Text style={styles.cardTitle}>Signaler un problème</Text>
          <Text style={styles.inputLabel}>QUE S’EST-IL PASSÉ ?</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Exemple : je ne reçois pas la notification du nouveau scrim…"
            placeholderTextColor="#777"
            multiline
            maxLength={1200}
            textAlignVertical="top"
            style={styles.input}
          />
          <Text style={styles.counter}>{message.length}/1200</Text>
          <Text style={styles.cardText}>Le signalement inclura aussi ton compte, la version, la plateforme, ton rôle et l’état des notifications.</Text>
          <TouchableOpacity style={[styles.button, (!message.trim() || busy) && styles.buttonDisabled]} disabled={!message.trim() || busy} onPress={() => void sendReport()}>
            <Ionicons name="send" size={18} color="#080808" />
            <Text style={styles.buttonText}>{busy ? "Envoi…" : "Envoyer à l’administrateur"}</Text>
          </TouchableOpacity>
        </View>

        {canManage ? (
          <View style={styles.inboxSection}>
            <View style={styles.inboxHeader}>
              <View>
                <Text style={styles.inboxKicker}>ADMINISTRATION</Text>
                <Text style={styles.inboxTitle}>Signalements reçus</Text>
              </View>
              <View style={styles.countBadge}><Text style={styles.countText}>{newCount}</Text></View>
            </View>

            {loadingReports && reports.length === 0 ? <Text style={styles.emptyText}>Chargement…</Text> : null}
            {!loadingReports && reports.length === 0 ? <View style={styles.emptyInbox}><Ionicons name="checkmark-done-circle-outline" size={36} color="#83DD57" /><Text style={styles.emptyTitle}>Aucun signalement</Text><Text style={styles.emptyText}>Tout fonctionne correctement pour le moment.</Text></View> : null}

            {reports.map((report) => (
              <View key={report.id} style={[styles.reportCard, report.status === "Résolu" && styles.reportResolved]}>
                <View style={styles.reportTopRow}>
                  <View style={[styles.statusBadge, report.status === "Résolu" && styles.statusResolved]}>
                    <Text style={[styles.statusText, report.status === "Résolu" && styles.statusTextResolved]}>{report.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>
                </View>

                <Text style={styles.reportEmail}>{report.email}</Text>
                <Text style={styles.reportMessage}>{report.message}</Text>

                <View style={styles.diagnosticBox}>
                  <Text style={styles.diagnosticText}>Version {report.version} · {report.platform} · {report.role}</Text>
                  <Text style={styles.diagnosticText}>Notifications {report.notificationsEnabled ? "activées" : "désactivées"} · 24 h {report.reminder24h ? "oui" : "non"} · 1 h {report.reminder1h ? "oui" : "non"}</Text>
                  {report.webPushDiagnostic ? <Text style={styles.webDiagnostic}>{report.webPushDiagnostic}</Text> : null}
                </View>

                <View style={styles.reportActions}>
                  <TouchableOpacity style={styles.resolveButton} onPress={() => void toggleResolved(report)}>
                    <Ionicons name={report.status === "Nouveau" ? "checkmark-circle-outline" : "refresh-outline"} size={17} color={Theme.colors.goldLight} />
                    <Text style={styles.resolveText}>{report.status === "Nouveau" ? "MARQUER RÉSOLU" : "RÉOUVRIR"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity accessibilityLabel="Supprimer le signalement" style={styles.deleteButton} onPress={() => confirmDelete(report)}>
                    <Ionicons name="trash-outline" size={18} color="#FF7777" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 140 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#CFCFCF", marginTop: 8, lineHeight: 20 },
  card: { marginTop: 24, padding: 20, borderRadius: 24, backgroundColor: "rgba(15,15,15,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.1)" },
  cardTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 16 },
  inputLabel: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 18, marginBottom: 8 },
  input: { minHeight: 145, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 14, color: "#fff", fontSize: 15, lineHeight: 21, backgroundColor: "rgba(255,255,255,0.055)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)" },
  counter: { color: "#777", fontSize: 10, textAlign: "right", marginTop: 5 },
  cardText: { color: "#C8C8C8", marginTop: 12, lineHeight: 19 },
  button: { marginTop: 18, minHeight: 50, borderRadius: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#080808", fontWeight: "900" },
  inboxSection: { marginTop: 30 },
  inboxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  inboxKicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  inboxTitle: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 3 },
  countBadge: { minWidth: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#E84B4B" },
  countText: { color: "#fff", fontWeight: "900" },
  emptyInbox: { padding: 26, borderRadius: 22, alignItems: "center", backgroundColor: "rgba(15,15,15,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 8 },
  emptyText: { color: "#AFAFAF", textAlign: "center", marginTop: 6 },
  reportCard: { padding: 17, borderRadius: 22, marginBottom: 13, backgroundColor: "rgba(15,15,15,0.97)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,214,91,0.3)" },
  reportResolved: { opacity: 0.68, borderColor: "rgba(131,221,87,0.25)" },
  reportTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(232,75,75,0.16)" },
  statusResolved: { backgroundColor: "rgba(131,221,87,0.13)" },
  statusText: { color: "#FF7777", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statusTextResolved: { color: "#83DD57" },
  reportDate: { color: "#8F8F8F", fontSize: 10, fontWeight: "700" },
  reportEmail: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900", marginTop: 13 },
  reportMessage: { color: "#fff", fontSize: 16, lineHeight: 23, fontWeight: "700", marginTop: 7 },
  diagnosticBox: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.045)" },
  diagnosticText: { color: "#BDBDBD", fontSize: 11, lineHeight: 17 },
  webDiagnostic: { color: "#888", fontSize: 10, lineHeight: 15, marginTop: 6 },
  reportActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  resolveButton: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,218,104,0.4)" },
  resolveText: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900" },
  deleteButton: { width: 44, minHeight: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(130,20,20,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,100,100,0.35)" },
});
