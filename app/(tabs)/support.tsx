import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Alert, ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { getRoster, RosterPlayer, subscribeToRoster } from "../../services/rosterStore";
import { createSupportReport, deleteSupportReport, getSupportReports, SupportReport, updateSupportReportStatus } from "../../services/supportStore";

const marbleSource = require("../../assets/images/background-marble.jpg");

export default function SupportScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const permissions = await getScrimPermissions();
      setCanManage(permissions.canManage);
      if (permissions.canManage) setReports(await getSupportReports());
    } catch {
      // Le formulaire reste utilisable même si la boîte admin ne charge pas.
    } finally { setLoadingReports(false); }
  }, []);

  useEffect(() => {
    void loadReports();
    void getRoster().then(setRoster);
    const unsubscribeRoster = subscribeToRoster(setRoster);
    const timer = setInterval(() => void loadReports(), 10000);
    return () => { clearInterval(timer); unsubscribeRoster(); };
  }, [loadReports]);

  function playerName(report: SupportReport) {
    const player = roster.find((item) => item.accountUid === report.userId)
      ?? roster.find((item) => item.accountEmail?.trim().toLowerCase() === report.email.trim().toLowerCase());
    return player?.nickname || report.email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Joueur DYNO";
  }

  async function sendReport() {
    const description = message.trim();
    if (!description) return Alert.alert("Décris le problème", "Écris quelques mots sur ce qui ne fonctionne pas avant d’envoyer le signalement.");
    setBusy(true);
    try {
      await createSupportReport(description);
      setMessage("");
      Alert.alert("Signalement envoyé", "Ton message a bien été transmis à l’administrateur dans DYNO.");
      if (canManage) await loadReports();
    } catch (error) {
      Alert.alert("Support", error instanceof Error ? error.message : "Le signalement n’a pas pu être envoyé.");
    } finally { setBusy(false); }
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
    Alert.alert("Supprimer le signalement", `Le message de ${playerName(report)} sera supprimé définitivement.`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void deleteSupportReport(report.id).then(() => setReports((current) => current.filter((item) => item.id !== report.id))).catch((error) => Alert.alert("Support", error instanceof Error ? error.message : "Suppression impossible.")) },
    ]);
  }

  const newCount = reports.filter((report) => report.status === "Nouveau").length;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <View style={styles.whiteGlow} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>DYNO · CENTRE D’AIDE</Text>
              <Text style={styles.title}>Support</Text>
              <Text style={styles.subtitle}>Un problème ? Envoie-le directement dans DYNO avec les informations techniques utiles.</Text>
            </View>
            <View style={styles.onlinePill}><View style={styles.onlineDot} /><Text style={styles.onlineText}>ACTIF</Text></View>
          </View>

          <View style={styles.quickInfoRow}>
            <QuickInfo icon="send-outline" label="Envoi direct" />
            <QuickInfo icon="construct-outline" label="Diagnostic joint" />
            <QuickInfo icon="shield-checkmark-outline" label="Privé équipe" />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.icon}><Ionicons name="help-buoy-outline" size={22} color={Theme.colors.goldLight} /></View>
              <View style={styles.cardHeaderText}><Text style={styles.cardKicker}>NOUVEAU SIGNALEMENT</Text><Text style={styles.cardTitle}>Que se passe-t-il ?</Text></View>
            </View>
            <TextInput value={message} onChangeText={setMessage} placeholder="Exemple : je ne reçois pas la notification du nouveau scrim…" placeholderTextColor="#747474" multiline maxLength={1200} textAlignVertical="top" style={styles.input} />
            <View style={styles.inputFooter}><Text style={styles.cardText}>Compte, version, plateforme, rôle et notifications seront ajoutés automatiquement.</Text><Text style={styles.counter}>{message.length}/1200</Text></View>
            <TouchableOpacity style={[styles.button, (!message.trim() || busy) && styles.buttonDisabled]} disabled={!message.trim() || busy} onPress={() => void sendReport()} activeOpacity={0.86}><Ionicons name="send" size={17} color="#080808" /><Text style={styles.buttonText}>{busy ? "ENVOI…" : "ENVOYER LE SIGNALEMENT"}</Text></TouchableOpacity>
          </View>

          {canManage ? (
            <View style={styles.inboxSection}>
              <View style={styles.inboxHeader}>
                <View><Text style={styles.inboxKicker}>BOÎTE ADMIN</Text><Text style={styles.inboxTitle}>Signalements reçus</Text></View>
                <View style={[styles.countBadge, newCount === 0 && styles.countBadgeEmpty]}><Text style={[styles.countText, newCount === 0 && styles.countTextEmpty]}>{newCount}</Text><Text style={[styles.countLabel, newCount === 0 && styles.countTextEmpty]}>NOUVEAU{newCount > 1 ? "X" : ""}</Text></View>
              </View>

              {loadingReports && reports.length === 0 ? <View style={styles.loadingBox}><Ionicons name="sync-outline" size={20} color={Theme.colors.goldLight} /><Text style={styles.emptyText}>Chargement des signalements…</Text></View> : null}
              {!loadingReports && reports.length === 0 ? <View style={styles.emptyInbox}><View style={styles.emptyIcon}><Ionicons name="checkmark-done" size={24} color="#83DD57" /></View><Text style={styles.emptyTitle}>Boîte propre</Text><Text style={styles.emptyText}>Aucun signalement en attente pour le moment.</Text></View> : null}

              {reports.map((report) => (
                <View key={report.id} style={[styles.reportCard, report.status === "Résolu" && styles.reportResolved]}>
                  <View style={styles.reportTopRow}>
                    <View style={[styles.statusBadge, report.status === "Résolu" && styles.statusResolved]}><View style={[styles.statusDot, report.status === "Résolu" && styles.statusDotResolved]} /><Text style={[styles.statusText, report.status === "Résolu" && styles.statusTextResolved]}>{report.status.toUpperCase()}</Text></View>
                    <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>
                  </View>
                  <View style={styles.playerRow}><View style={styles.playerAvatar}><Text style={styles.playerAvatarText}>{playerName(report).slice(0, 2).toUpperCase()}</Text></View><Text style={styles.reportPlayer}>{playerName(report)}</Text></View>
                  <Text style={styles.reportMessage}>{report.message}</Text>
                  <View style={styles.diagnosticBox}>
                    <View style={styles.diagnosticRow}><Ionicons name="phone-portrait-outline" size={13} color="#AFAFAF" /><Text style={styles.diagnosticText}>v{report.version} · {report.platform} · {report.role}</Text></View>
                    <View style={styles.diagnosticRow}><Ionicons name="notifications-outline" size={13} color="#AFAFAF" /><Text style={styles.diagnosticText}>Notifications {report.notificationsEnabled ? "ON" : "OFF"} · 24 h {report.reminder24h ? "ON" : "OFF"} · 1 h {report.reminder1h ? "ON" : "OFF"}</Text></View>
                    {report.webPushDiagnostic ? <Text style={styles.webDiagnostic}>{report.webPushDiagnostic}</Text> : null}
                  </View>
                  <View style={styles.reportActions}>
                    <TouchableOpacity style={styles.resolveButton} onPress={() => void toggleResolved(report)}><Ionicons name={report.status === "Nouveau" ? "checkmark-circle-outline" : "refresh-outline"} size={16} color={Theme.colors.goldLight} /><Text style={styles.resolveText}>{report.status === "Nouveau" ? "MARQUER RÉSOLU" : "RÉOUVRIR"}</Text></TouchableOpacity>
                    <TouchableOpacity accessibilityLabel="Supprimer le signalement" style={styles.deleteButton} onPress={() => confirmDelete(report)}><Ionicons name="trash-outline" size={17} color="#FF7777" /></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function QuickInfo({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return <View style={styles.quickInfo}><Ionicons name={icon} size={15} color={Theme.colors.goldLight} /><Text style={styles.quickInfoText}>{label}</Text></View>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.28 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.78)" }, whiteGlow: { position: "absolute", top: -70, right: -100, width: 320, height: 380, borderRadius: 190, backgroundColor: "rgba(255,255,255,0.02)" }, content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 130 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, headerText: { flex: 1 }, kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#C6C6C6", marginTop: 7, fontSize: 12, lineHeight: 18 }, onlinePill: { marginTop: 3, minHeight: 26, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(131,221,87,0.05)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(131,221,87,0.2)" }, onlineDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#83DD57" }, onlineText: { color: "#98DA7D", fontSize: 7, fontWeight: "900" },
  quickInfoRow: { flexDirection: "row", gap: 7, marginTop: 16 }, quickInfo: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.12)" }, quickInfoText: { color: "#BDBDBD", fontSize: 7, fontWeight: "800", textAlign: "center" },
  card: { marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: "rgba(9,9,9,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.16)" }, cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 13 }, icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.16)" }, cardHeaderText: { flex: 1 }, cardKicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 }, cardTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 2 }, input: { minHeight: 128, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 13, color: "#fff", fontSize: 14, lineHeight: 20, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.13)" }, inputFooter: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 7 }, cardText: { flex: 1, color: "#9E9E9E", fontSize: 9, lineHeight: 14 }, counter: { color: "#777", fontSize: 9, fontWeight: "800" }, button: { marginTop: 14, minHeight: 49, borderRadius: 15, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight }, buttonDisabled: { opacity: 0.42 }, buttonText: { color: "#080808", fontWeight: "900", fontSize: 10, letterSpacing: 0.8 },
  inboxSection: { marginTop: 24 }, inboxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, inboxKicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 }, inboxTitle: { color: "#fff", fontSize: 21, fontWeight: "900", marginTop: 3 }, countBadge: { minWidth: 58, minHeight: 38, paddingHorizontal: 9, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(232,75,75,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(232,75,75,0.3)" }, countBadgeEmpty: { backgroundColor: "rgba(131,221,87,0.05)", borderColor: "rgba(131,221,87,0.2)" }, countText: { color: "#FF8585", fontSize: 15, fontWeight: "900" }, countTextEmpty: { color: "#8FD773" }, countLabel: { color: "#D57979", fontSize: 6, fontWeight: "900", marginTop: 1 },
  loadingBox: { minHeight: 80, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(9,9,9,0.82)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, emptyInbox: { padding: 22, borderRadius: 20, alignItems: "center", backgroundColor: "rgba(9,9,9,0.82)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(131,221,87,0.16)" }, emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(131,221,87,0.06)" }, emptyTitle: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 9 }, emptyText: { color: "#AFAFAF", textAlign: "center", marginTop: 5, fontSize: 10, lineHeight: 15 },
  reportCard: { padding: 15, borderRadius: 19, marginBottom: 10, backgroundColor: "rgba(9,9,9,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,214,91,0.22)" }, reportResolved: { opacity: 0.66, borderColor: "rgba(131,221,87,0.2)" }, reportTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, statusBadge: { minHeight: 25, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(232,75,75,0.09)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(232,75,75,0.2)" }, statusResolved: { backgroundColor: "rgba(131,221,87,0.07)", borderColor: "rgba(131,221,87,0.2)" }, statusDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#FF7777" }, statusDotResolved: { backgroundColor: "#83DD57" }, statusText: { color: "#FF8585", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 }, statusTextResolved: { color: "#8FD773" }, reportDate: { color: "#858585", fontSize: 8, fontWeight: "800" }, playerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }, playerAvatar: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)" }, playerAvatarText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" }, reportPlayer: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, reportMessage: { color: "#EEEEEE", fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 9 }, diagnosticBox: { marginTop: 12, padding: 10, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.035)" }, diagnosticRow: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 2 }, diagnosticText: { flex: 1, color: "#AAAAAA", fontSize: 9, lineHeight: 14 }, webDiagnostic: { color: "#858585", fontSize: 8, lineHeight: 13, marginTop: 5 }, reportActions: { flexDirection: "row", gap: 8, marginTop: 12 }, resolveButton: { flex: 1, minHeight: 42, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,218,104,0.3)", backgroundColor: "rgba(246,215,106,0.035)" }, resolveText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900" }, deleteButton: { width: 42, minHeight: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(130,20,20,0.09)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,100,100,0.25)" },
});
