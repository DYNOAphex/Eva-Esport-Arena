import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ImageBackground, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PlusOverview from "../../components/dyno/PlusOverview";
import { Theme } from "../../constants/theme";
import { getAppSettings, updateAppSettings } from "../../services/appSettings";
import { checkForAppUpdate, getInstalledVersion, openAppUpdate } from "../../services/appUpdateService";
import { logout } from "../../services/authService";
import { registerForPushNotificationsAsync } from "../../services/notifications";
import { runSyncDiagnostic, SyncDiagnostic } from "../../services/syncDiagnostics";
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
  const [syncDiagnostic, setSyncDiagnostic] = useState<SyncDiagnostic | null>(null);
  const [syncing, setSyncing] = useState(false);

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
    void refreshSync(false);
    if (Platform.OS === "web") void refreshPushDiagnostic();
    return () => { active = false; };
  }, []);

  async function refreshSync(showConfirmation = true) {
    setSyncing(true);
    try {
      const diagnostic = await runSyncDiagnostic();
      setSyncDiagnostic(diagnostic);
      if (showConfirmation) {
        Alert.alert(
          diagnostic.firebase ? "Synchronisation réussie" : "Synchronisation incomplète",
          diagnostic.firebase
            ? `${diagnostic.members} membre(s) et ${diagnostic.matches} rendez-vous récupérés depuis Firebase.`
            : diagnostic.error ?? "Firebase est inaccessible.",
        );
      }
    } finally {
      setSyncing(false);
    }
  }

  async function refreshPushDiagnostic() {
    setCheckingPush(true);
    try { setPushDiagnostic(await getWebPushDiagnostic()); }
    finally { setCheckingPush(false); }
  }

  async function repairPush() {
    setActivatingPush(true);
    try {
      setPushDiagnostic(await repairWebPushSubscription());
      const settings = await updateAppSettings({ notificationsEnabled: true });
      setNotificationsEnabled(settings.notificationsEnabled);
      Alert.alert("Abonnement réparé", "Cet appareil est maintenant enregistré pour les notifications DYNO.");
    } catch (error) {
      Alert.alert("Réparation Web Push", error instanceof Error ? error.message : "Réparation impossible.");
      await refreshPushDiagnostic();
    } finally { setActivatingPush(false); }
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
          Alert.alert("Notifications web", "L’autorisation a été refusée ou DYNO n’est pas installé depuis l’écran d’accueil.");
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
      setNotificationsEnabled((await updateAppSettings({ notificationsEnabled: false })).notificationsEnabled);
      return;
    }
    const permission = await registerForPushNotificationsAsync();
    if (permission) {
      setNotificationsEnabled((await updateAppSettings({ notificationsEnabled: true })).notificationsEnabled);
      Alert.alert("Notifications activées", "Les notifications DYNO sont actives sur cet appareil.");
      return;
    }
    Alert.alert("Autoriser les notifications", "Android bloque les notifications DYNO.", [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les réglages", onPress: () => void Linking.openSettings() },
    ]);
  }

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
    Alert.alert("Se déconnecter", "Tu devras te reconnecter pour accéder à l’équipe.", [
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
          <Text style={styles.subtitle}>Gérez les préférences, la synchronisation et les mises à jour.</Text>

          <PlusOverview
            notificationsEnabled={notificationsEnabled}
            firebaseReady={syncDiagnostic?.firebase}
            installedVersion={getInstalledVersion()}
            updateAvailable={updateInfo?.updateAvailable}
          />

          <Text style={styles.sectionLabel}>CENTRE DE SYNCHRONISATION</Text>
          <View style={styles.syncCard}>
            <View style={styles.syncHeader}>
              <View style={[styles.syncIcon, syncDiagnostic?.firebase && styles.syncIconOk]}><Ionicons name={syncDiagnostic?.firebase ? "cloud-done-outline" : "cloud-offline-outline"} size={25} color={syncDiagnostic?.firebase ? "#78E29B" : "#FF8585"} /></View>
              <View style={styles.syncHeaderText}><Text style={styles.syncTitle}>{syncDiagnostic?.firebase ? "Données synchronisées" : syncing ? "Vérification en cours…" : "Synchronisation à vérifier"}</Text><Text style={styles.syncSubtitle}>{syncDiagnostic?.browser ?? (Platform.OS === "web" ? "Navigateur Web" : "Application")}</Text></View>
            </View>
            <DiagnosticRow label="Connexion Internet" value={syncDiagnostic?.online ? "Connecté" : "Hors ligne"} ok={syncDiagnostic?.online} />
            <DiagnosticRow label="Session utilisateur" value={syncDiagnostic?.authenticated ? "Active" : "Expirée"} ok={syncDiagnostic?.authenticated} />
            <DiagnosticRow label="Firebase" value={syncDiagnostic?.firebase ? "Accessible" : "Inaccessible"} ok={syncDiagnostic?.firebase} />
            <DiagnosticRow label="Données partagées" value={syncDiagnostic?.firebase ? `${syncDiagnostic.members} membres · ${syncDiagnostic.matches} RDV` : "Non chargées"} ok={syncDiagnostic?.firebase} />
            <DiagnosticRow label="Dernière synchronisation" value={formatSyncDate(syncDiagnostic?.lastSync)} ok={Boolean(syncDiagnostic?.lastSync)} />
            {syncDiagnostic?.error ? <Text style={styles.syncError}>{syncDiagnostic.error}</Text> : null}
            {Platform.OS === "web" ? <Text style={styles.syncHint}>Sur Safari, utilise ce bouton après une mise à jour ou lorsqu’une disponibilité semble bloquée.</Text> : null}
            <TouchableOpacity style={[styles.syncButton, syncing && styles.disabled]} disabled={syncing} onPress={() => void refreshSync(true)}><Ionicons name="refresh" size={18} color="#090909" /><Text style={styles.syncButtonText}>{syncing ? "Actualisation…" : "Actualiser maintenant"}</Text></TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>RÉGLAGES</Text>
          <View style={styles.settingsCard}>
            <Setting icon="notifications-outline" label={Platform.OS === "web" ? "Notifications sur cet appareil" : "Notifications"} value={activatingPush ? "Activation…" : Platform.OS === "web" ? "Activer" : notificationsEnabled ? "Activées" : "Désactivées"} onPress={() => void toggleNotifications()} />
            <View style={styles.separator} />
            <Setting icon="time-outline" label="Rappel 24 h avant" value={reminder24h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void updateAppSettings({ reminder24h: !reminder24h }).then((s) => setReminder24h(s.reminder24h))} />
            <View style={styles.separator} />
            <Setting icon="alarm-outline" label="Rappel 1 h avant" value={reminder1h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void updateAppSettings({ reminder1h: !reminder1h }).then((s) => setReminder1h(s.reminder1h))} />
            <View style={styles.separator} />
            <Setting icon="people-outline" label="Confirmation auto" value={`${confirmationThreshold} joueurs`} onPress={chooseThreshold} />
            <View style={styles.separator} />
            <Setting icon="color-palette-outline" label="Apparence" value={appearance === "gold" ? "DYNO Or" : "Sombre"} onPress={() => void updateAppSettings({ appearance: appearance === "gold" ? "dark" : "gold" }).then((s) => setAppearance(s.appearance))} />
          </View>

          {Platform.OS === "web" ? <><Text style={styles.sectionLabel}>DIAGNOSTIC WEB PUSH</Text><View style={styles.pushCard}>
            <DiagnosticRow label="Autorisation navigateur" value={pushDiagnostic?.permission === "granted" ? "OK" : pushDiagnostic?.permission === "denied" ? "Refusée" : "À autoriser"} ok={pushDiagnostic?.permission === "granted"} />
            <DiagnosticRow label="Service worker" value={stateLabel(pushDiagnostic?.serviceWorker)} ok={pushDiagnostic?.serviceWorker === "ready"} />
            <DiagnosticRow label="Abonnement Push" value={stateLabel(pushDiagnostic?.subscription, "Enregistré")} ok={pushDiagnostic?.subscription === "ready"} />
            <DiagnosticRow label="Enregistrement Firebase" value={stateLabel(pushDiagnostic?.firebase, "Enregistré")} ok={pushDiagnostic?.firebase === "ready"} />
            {pushDiagnostic?.error ? <Text style={styles.syncError}>{pushDiagnostic.error}</Text> : null}
            <View style={styles.buttonRow}><TouchableOpacity style={styles.secondaryButton} onPress={() => void refreshPushDiagnostic()}><Text style={styles.secondaryButtonText}>{checkingPush ? "Analyse…" : "Actualiser"}</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => void repairPush()}><Text style={styles.secondaryButtonText}>{activatingPush ? "Réparation…" : "Réparer"}</Text></TouchableOpacity></View>
            <TouchableOpacity style={styles.testButton} onPress={() => void testPush()}><Text style={styles.testButtonText}>{testingPush ? "Test en cours…" : "Envoyer une notification test"}</Text></TouchableOpacity>
          </View></> : null}

          <Text style={styles.sectionLabel}>MISE À JOUR</Text>
          <View style={styles.updateCard}>
            <View style={styles.updateHeader}><Ionicons name="cloud-download-outline" size={24} color={Theme.colors.goldLight} /><View style={styles.updateText}><Text style={styles.updateTitle}>Version installée : {getInstalledVersion()}</Text><Text style={styles.updateSubtitle}>{updateInfo?.updateAvailable ? `Version ${updateInfo.latestVersion} disponible` : "Vérifiez si une nouvelle version de DYNO est disponible."}</Text></View></View>
            <TouchableOpacity style={styles.mainButton} onPress={() => updateInfo?.updateAvailable ? void openAppUpdate(updateInfo) : void checkUpdate()}><Text style={styles.mainButtonText}>{updateInfo?.updateAvailable ? "Installer la mise à jour" : checkingUpdate ? "Vérification…" : "Vérifier les mises à jour"}</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}><Ionicons name="log-out-outline" size={20} color="#FF8585" /><Text style={styles.logoutText}>Se déconnecter</Text></TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function formatSyncDate(value?: string) {
  if (!value) return "Jamais";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Inconnue" : date.toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function stateLabel(state?: WebPushState, readyLabel = "OK") { return state === "ready" ? readyLabel : state === "missing" ? "Absent" : state === "error" ? "Erreur" : "Non compatible"; }
function DiagnosticRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) { return <View style={styles.diagnosticRow}><View style={[styles.statusDot, ok ? styles.statusOk : styles.statusBad]} /><Text style={styles.diagnosticLabel}>{label}</Text><Text style={[styles.diagnosticValue, ok && styles.diagnosticValueOk]}>{value}</Text></View>; }
function Setting({ icon, label, value, onPress, disabled = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void; disabled?: boolean }) { return <TouchableOpacity disabled={disabled} style={[styles.settingRow, disabled && styles.disabled]} onPress={onPress}><View style={styles.settingIcon}><Ionicons name={icon} size={20} color={Theme.colors.goldLight} /></View><Text style={styles.settingLabel}>{label}</Text><View style={styles.settingMeta}><Text style={styles.settingValue}>{value}</Text><Ionicons name="chevron-forward" size={18} color="#B7B7B7" /></View></TouchableOpacity>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.28 }, backgroundDark: { opacity: 0.1 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" }, overlayDark: { backgroundColor: "rgba(0,0,0,0.86)" }, content: { paddingHorizontal: 20, paddingTop: 34, paddingBottom: 128 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 12, lineHeight: 20 }, sectionLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: 20, marginBottom: 9 },
  syncCard: { padding: 17, borderRadius: 24, backgroundColor: "rgba(10,10,10,0.94)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,215,90,0.25)" }, syncHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 }, syncIcon: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,90,0.1)" }, syncIconOk: { backgroundColor: "rgba(85,209,135,0.12)" }, syncHeaderText: { flex: 1, marginLeft: 12 }, syncTitle: { color: "#fff", fontSize: 17, fontWeight: "900" }, syncSubtitle: { color: "#AFAFAF", marginTop: 3, fontSize: 11 }, syncError: { color: "#FF9B9B", fontSize: 11, lineHeight: 16, marginTop: 9 }, syncHint: { color: "#FFD978", fontSize: 11, lineHeight: 16, marginTop: 9 }, syncButton: { minHeight: 46, marginTop: 14, borderRadius: 15, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, syncButtonText: { color: "#090909", fontWeight: "900" },
  settingsCard: { borderRadius: 24, paddingHorizontal: 14, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, settingRow: { minHeight: 58, flexDirection: "row", alignItems: "center" }, disabled: { opacity: 0.42 }, settingIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.09)", marginRight: 11 }, settingLabel: { flex: 1, color: "#fff", fontWeight: "800" }, settingMeta: { width: 112, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }, settingValue: { color: "#C8C8C8", fontSize: 11, marginRight: 5, textAlign: "right" }, separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)", marginLeft: 49 },
  pushCard: { padding: 16, borderRadius: 24, backgroundColor: "rgba(10,10,10,0.92)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, diagnosticRow: { minHeight: 34, flexDirection: "row", alignItems: "center" }, statusDot: { width: 9, height: 9, borderRadius: 5, marginRight: 10 }, statusOk: { backgroundColor: "#55D187" }, statusBad: { backgroundColor: "#FF7B7B" }, diagnosticLabel: { flex: 1, color: "#EAEAEA", fontSize: 12, fontWeight: "700" }, diagnosticValue: { color: "#FF9B9B", fontSize: 11, fontWeight: "900", textAlign: "right" }, diagnosticValueOk: { color: "#7BE6A7" }, buttonRow: { flexDirection: "row", gap: 10, marginTop: 14 }, secondaryButton: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(224,184,67,0.35)", backgroundColor: "rgba(224,184,67,0.08)" }, secondaryButtonText: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" }, testButton: { minHeight: 44, marginTop: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, testButtonText: { color: "#090909", fontSize: 12, fontWeight: "900" },
  updateCard: { padding: 16, borderRadius: 24, backgroundColor: "rgba(10,10,10,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, updateHeader: { flexDirection: "row", alignItems: "center" }, updateText: { flex: 1, marginLeft: 12 }, updateTitle: { color: "#fff", fontWeight: "900" }, updateSubtitle: { color: "#C8C8C8", fontSize: 11, marginTop: 4, lineHeight: 16 }, mainButton: { minHeight: 44, marginTop: 13, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, mainButtonText: { color: "#090909", fontSize: 12, fontWeight: "900" }, logoutButton: { minHeight: 48, borderRadius: 18, marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(130,20,20,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,100,100,0.22)" }, logoutText: { color: "#FF8585", fontWeight: "900" },
});