import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ImageBackground, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getAppSettings, updateAppSettings } from "../../services/appSettings";
import { checkForAppUpdate, getInstalledVersion, openAppUpdate } from "../../services/appUpdateService";
import { logout } from "../../services/authService";
import { registerForPushNotificationsAsync } from "../../services/notifications";
import { getWebPushDiagnostic, repairWebPushSubscription, sendWebPushLocalTest } from "../../services/webPushDiagnostics";
import type { AppearanceMode } from "../../services/appSettings";
import type { AppUpdateInfo } from "../../services/appUpdateService";
import type { WebPushDiagnostic, WebPushState } from "../../services/webPushDiagnostics";

const marbleSource = require("../../assets/images/background-marble.jpg");

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(true);
  const [appearance, setAppearance] = useState<AppearanceMode>("gold");
  const [confirmationThreshold, setConfirmationThreshold] = useState(4);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [activatingPush, setActivatingPush] = useState(false);
  const [pushDiagnostic, setPushDiagnostic] = useState<WebPushDiagnostic | null>(null);
  const [checkingPush, setCheckingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    let active = true;
    void getAppSettings().then((settings) => {
      if (!active) return;
      setNotificationsEnabled(settings.notificationsEnabled);
      setReminder24h(settings.reminder24h);
      setReminder1h(settings.reminder1h);
      setAppearance(settings.appearance);
      setConfirmationThreshold(settings.confirmationThreshold);
    });
    if (Platform.OS === "web") void refreshPushDiagnostic();
    return () => { active = false; };
  }, []);

  async function refreshPushDiagnostic() {
    setCheckingPush(true);
    try {
      setPushDiagnostic(await getWebPushDiagnostic());
    } finally {
      setCheckingPush(false);
    }
  }

  async function repairPush() {
    setActivatingPush(true);
    try {
      const diagnostic = await repairWebPushSubscription();
      setPushDiagnostic(diagnostic);
      const settings = await updateAppSettings({ notificationsEnabled: true });
      setNotificationsEnabled(settings.notificationsEnabled);
      Alert.alert("Abonnement réparé", "Cet appareil est maintenant enregistré pour les notifications DYNO.");
    } catch (error) {
      Alert.alert("Réparation Web Push", error instanceof Error ? error.message : "Réparation impossible.");
      await refreshPushDiagnostic();
    } finally {
      setActivatingPush(false);
    }
  }

  async function testPush() {
    setTestingPush(true);
    try {
      await sendWebPushLocalTest();
      Alert.alert("Test envoyé", "Une notification DYNO doit apparaître sur cet appareil.");
    } catch (error) {
      Alert.alert("Test Web Push", error instanceof Error ? error.message : "Test impossible.");
    } finally {
      setTestingPush(false);
      await refreshPushDiagnostic();
    }
  }

  async function toggleNotifications() {
    if (Platform.OS === "web") {
      try {
        setActivatingPush(true);
        const subscription = await registerForPushNotificationsAsync();
        if (!subscription) {
          Alert.alert("Notifications web", "L'autorisation a été refusée ou DYNO n'est pas installé depuis l'écran d'accueil.");
          return;
        }
        const settings = await updateAppSettings({ notificationsEnabled: true });
        setNotificationsEnabled(settings.notificationsEnabled);
        Alert.alert("Notifications activées", "Cet appareil est maintenant enregistré pour recevoir les notifications DYNO.");
      } catch (error) {
        Alert.alert("Notifications web", error instanceof Error ? error.message : "Activation impossible sur cet appareil.");
      } finally {
        setActivatingPush(false);
        await refreshPushDiagnostic();
      }
      return;
    }

    if (notificationsEnabled) {
      const settings = await updateAppSettings({ notificationsEnabled: false });
      setNotificationsEnabled(settings.notificationsEnabled);
      return;
    }
    const permission = await registerForPushNotificationsAsync();
    if (permission) {
      const settings = await updateAppSettings({ notificationsEnabled: true });
      setNotificationsEnabled(settings.notificationsEnabled);
      Alert.alert("Notifications activées", "Les notifications DYNO sont actives sur cet appareil.");
      return;
    }
    Alert.alert("Autoriser les notifications", "Android bloque les notifications DYNO.", [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les réglages", onPress: () => void Linking.openSettings() },
    ]);
  }

  async function toggleReminder24h() { const settings = await updateAppSettings({ reminder24h: !reminder24h }); setReminder24h(settings.reminder24h); }
  async function toggleReminder1h() { const settings = await updateAppSettings({ reminder1h: !reminder1h }); setReminder1h(settings.reminder1h); }
  async function toggleAppearance() { const settings = await updateAppSettings({ appearance: appearance === "gold" ? "dark" : "gold" }); setAppearance(settings.appearance); }

  function chooseThreshold() {
    Alert.alert("Confirmation automatique", "Nombre minimum de joueurs disponibles", [
      ...[3, 4, 5, 6].map((value) => ({ text: `${value} joueurs${value === confirmationThreshold ? " ✓" : ""}`, onPress: () => void updateAppSettings({ confirmationThreshold: value }).then((settings) => setConfirmationThreshold(settings.confirmationThreshold)) })),
      { text: "Fermer", style: "cancel" },
    ]);
  }

  async function checkUpdate() {
    setCheckingUpdate(true);
    try {
      const info = await checkForAppUpdate();
      setUpdateInfo(info);
      if (!info.updateAvailable) Alert.alert("DYNO est à jour", `Version installée : ${info.installedVersion}`);
    } catch (error) {
      Alert.alert("Mise à jour", error instanceof Error ? error.message : "Vérification impossible.");
    } finally { setCheckingUpdate(false); }
  }

  function confirmLogout() {
    Alert.alert("Se déconnecter", "Tu devras te reconnecter pour accéder à l'équipe.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: () => void logout().then(() => router.replace("/(auth)/login")) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={[styles.backgroundImage, appearance === "dark" && styles.backgroundDark]}>
        <View style={[styles.overlay, appearance === "dark" && styles.overlayDark]} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Plus</Text>
          <Text style={styles.subtitle}>Gérez les préférences et les réglages de l'application.</Text>

          <Text style={styles.sectionLabel}>RÉGLAGES</Text>
          <View style={styles.settingsCard}>
            <Setting icon="notifications-outline" label={Platform.OS === "web" ? "Notifications sur cet appareil" : "Notifications"} value={activatingPush ? "Activation…" : Platform.OS === "web" ? "Activer" : notificationsEnabled ? "Activées" : "Désactivées"} onPress={() => void toggleNotifications()} />
            <View style={styles.separator} />
            <Setting icon="time-outline" label="Rappel 24 h avant" value={reminder24h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void toggleReminder24h()} />
            <View style={styles.separator} />
            <Setting icon="alarm-outline" label="Rappel 1 h avant" value={reminder1h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void toggleReminder1h()} />
            <View style={styles.separator} />
            <Setting icon="people-outline" label="Confirmation auto" value={`${confirmationThreshold} joueurs`} onPress={chooseThreshold} />
            <View style={styles.separator} />
            <Setting icon="color-palette-outline" label="Apparence" value={appearance === "gold" ? "DYNO Or" : "Sombre"} onPress={() => void toggleAppearance()} />
          </View>

          {Platform.OS === "web" ? (
            <>
              <Text style={styles.sectionLabel}>DIAGNOSTIC WEB PUSH</Text>
              <View style={styles.pushCard}>
                <DiagnosticRow label="Autorisation navigateur" value={pushDiagnostic?.permission === "granted" ? "OK" : pushDiagnostic?.permission === "denied" ? "Refusée" : pushDiagnostic?.permission === "default" ? "À autoriser" : "Non compatible"} ok={pushDiagnostic?.permission === "granted"} />
                <DiagnosticRow label="Service worker" value={stateLabel(pushDiagnostic?.serviceWorker)} ok={pushDiagnostic?.serviceWorker === "ready"} />
                <DiagnosticRow label="Abonnement Push" value={stateLabel(pushDiagnostic?.subscription, "Enregistré")} ok={pushDiagnostic?.subscription === "ready"} />
                <DiagnosticRow label="Enregistrement Firebase" value={stateLabel(pushDiagnostic?.firebase, "Enregistré")} ok={pushDiagnostic?.firebase === "ready"} />
                <DiagnosticRow label="PWA installée" value={pushDiagnostic?.installed ? "Oui" : "Non"} ok={pushDiagnostic?.installed} />
                <DiagnosticRow label="Dernier test" value={pushDiagnostic?.lastTest ? `${pushDiagnostic.lastTest.status === "received" ? "Reçu" : "Échec"} • ${new Date(pushDiagnostic.lastTest.at).toLocaleString("fr-FR")}` : "Jamais"} ok={pushDiagnostic?.lastTest?.status === "received"} />
                {pushDiagnostic?.isIOS && !pushDiagnostic.installed ? <Text style={styles.pushWarning}>Sur iPhone, ajoute DYNO à l'écran d'accueil avant d'activer les notifications.</Text> : null}
                {pushDiagnostic?.error ? <Text style={styles.pushError}>{pushDiagnostic.error}</Text> : null}
                <View style={styles.pushButtons}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => void refreshPushDiagnostic()}><Text style={styles.secondaryButtonText}>{checkingPush ? "Analyse…" : "Actualiser"}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => void repairPush()}><Text style={styles.secondaryButtonText}>{activatingPush ? "Réparation…" : "Réparer"}</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.testButton} onPress={() => void testPush()}><Text style={styles.testButtonText}>{testingPush ? "Test en cours…" : "Envoyer une notification test"}</Text></TouchableOpacity>
              </View>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>MISE À JOUR</Text>
          <View style={styles.updateCard}>
            <View style={styles.updateHeader}><Ionicons name="cloud-download-outline" size={24} color={Theme.colors.goldLight} /><View style={styles.updateText}><Text style={styles.updateTitle}>Version installée : {getInstalledVersion()}</Text><Text style={styles.updateSubtitle}>{updateInfo?.updateAvailable ? `Version ${updateInfo.latestVersion} disponible` : "Vérifiez si une nouvelle version de DYNO est disponible."}</Text></View></View>
            {updateInfo?.releaseNotes.length ? <View style={styles.releaseNotes}><Text style={styles.releaseNotesTitle}>NOUVEAUTÉS</Text>{updateInfo.releaseNotes.map((note, index) => <Text key={`${note}-${index}`} style={styles.releaseNote}>• {note}</Text>)}</View> : null}
            <TouchableOpacity style={styles.updateButton} onPress={() => updateInfo?.updateAvailable ? void openAppUpdate(updateInfo) : void checkUpdate()}><Text style={styles.updateButtonText}>{updateInfo?.updateAvailable ? "Télécharger la mise à jour" : checkingUpdate ? "Vérification…" : "Vérifier les mises à jour"}</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={confirmLogout}><Ionicons name="log-out-outline" size={20} color="#FF8585" /><Text style={styles.logoutText}>Se déconnecter</Text></TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function stateLabel(state?: WebPushState, readyLabel = "OK") {
  if (state === "ready") return readyLabel;
  if (state === "missing") return "Absent";
  if (state === "error") return "Erreur";
  return "Non compatible";
}

function DiagnosticRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return <View style={styles.diagnosticRow}><View style={[styles.statusDot, ok ? styles.statusOk : styles.statusBad]} /><Text style={styles.diagnosticLabel}>{label}</Text><Text style={[styles.diagnosticValue, ok && styles.diagnosticValueOk]}>{value}</Text></View>;
}

function Setting({ icon, label, value, onPress, disabled = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity disabled={disabled} style={[styles.settingRow, disabled && styles.disabled]} activeOpacity={0.75} onPress={onPress}><View style={styles.settingIcon}><Ionicons name={icon} size={20} color={Theme.colors.goldLight} /></View><Text style={styles.settingLabel}>{label}</Text><View style={styles.settingMeta}><Text style={styles.settingValue}>{value}</Text><Ionicons name="chevron-forward" size={18} color="#B7B7B7" /></View></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.28 }, backgroundDark: { opacity: 0.1 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" }, overlayDark: { backgroundColor: "rgba(0,0,0,0.86)" }, content: { paddingHorizontal: 20, paddingTop: 34, paddingBottom: 128 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 12, lineHeight: 20 }, sectionLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: 20, marginBottom: 9 }, settingsCard: { borderRadius: 24, paddingHorizontal: 14, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, settingRow: { minHeight: 58, flexDirection: "row", alignItems: "center" }, disabled: { opacity: 0.42 }, settingIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.09)", marginRight: 11 }, settingLabel: { flex: 1, color: "#fff", fontWeight: "800" }, settingMeta: { width: 112, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }, settingValue: { color: "#C8C8C8", fontSize: 11, marginRight: 5, textAlign: "right" }, separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)", marginLeft: 49 },
  pushCard: { padding: 16, borderRadius: 24, backgroundColor: "rgba(10,10,10,0.92)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, diagnosticRow: { minHeight: 34, flexDirection: "row", alignItems: "center" }, statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 }, statusOk: { backgroundColor: "#55D187" }, statusBad: { backgroundColor: "#FF7B7B" }, diagnosticLabel: { flex: 1, color: "#EAEAEA", fontSize: 12, fontWeight: "700" }, diagnosticValue: { color: "#FF9B9B", fontSize: 11, fontWeight: "900", textAlign: "right" }, diagnosticValueOk: { color: "#7BE6A7" }, pushWarning: { marginTop: 10, color: "#FFD978", fontSize: 11, lineHeight: 16 }, pushError: { marginTop: 8, color: "#FF9B9B", fontSize: 11, lineHeight: 16 }, pushButtons: { flexDirection: "row", gap: 10, marginTop: 14 }, secondaryButton: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(224,184,67,0.35)", backgroundColor: "rgba(224,184,67,0.08)" }, secondaryButtonText: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" }, testButton: { minHeight: 44, marginTop: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, testButtonText: { color: "#090909", fontSize: 12, fontWeight: "900" },
  updateCard: { padding: 16, borderRadius: 24, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, updateHeader: { flexDirection: "row", alignItems: "center" }, updateText: { flex: 1, marginLeft: 12 }, updateTitle: { color: "#fff", fontWeight: "900" }, updateSubtitle: { color: "#C8C8C8", fontSize: 11, marginTop: 4, lineHeight: 16 }, releaseNotes: { marginTop: 13, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" }, releaseNotesTitle: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 7 }, releaseNote: { color: "#D5D5D5", fontSize: 11, lineHeight: 17, marginBottom: 3 }, updateButton: { minHeight: 44, marginTop: 13, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, updateButtonText: { color: "#090909", fontSize: 12, fontWeight: "900" }, logoutButton: { minHeight: 48, borderRadius: 18, marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(130,20,20,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,100,100,0.22)" }, logoutText: { color: "#FF8585", fontWeight: "900" },
});