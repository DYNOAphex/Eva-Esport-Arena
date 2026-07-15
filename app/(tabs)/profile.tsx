import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, ImageBackground, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getAppSettings, updateAppSettings } from "../../services/appSettings";
import { checkForAppUpdate, getInstalledVersion, openAppUpdate } from "../../services/appUpdateService";
import { getStoredSession, logout } from "../../services/authService";
import { getMatches, subscribeToMatches } from "../../services/matchStore";
import { registerForPushNotificationsAsync } from "../../services/notifications";
import type { AppearanceMode } from "../../services/appSettings";
import type { AppUpdateInfo } from "../../services/appUpdateService";
import type { AuthSession } from "../../services/authService";
import type { Match } from "../../services/matchStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
const logoSource = require("../../assets/images/logo-dyno.png");

function displayNameFromEmail(email?: string) {
  if (!email) return "MEMBRE DYNO";
  return email.split("@")[0].replace(/[._-]+/g, " ").trim().toUpperCase() || "MEMBRE DYNO";
}

export default function ProfileScreen() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(true);
  const [appearance, setAppearance] = useState<AppearanceMode>("gold");
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    let active = true;
    void getStoredSession().then((value) => active && setSession(value));
    void getMatches().then((items) => active && setMatches(items));
    void getAppSettings().then((settings) => {
      if (!active) return;
      setNotificationsEnabled(settings.notificationsEnabled);
      setReminder24h(settings.reminder24h);
      setReminder1h(settings.reminder1h);
      setAppearance(settings.appearance);
    });
    const unsubscribe = subscribeToMatches(setMatches);
    return () => { active = false; unsubscribe(); };
  }, []);

  const stats = useMemo(() => {
    const activeMatches = matches.filter((match) => match.status !== "Annulé");
    const uid = session?.localId;
    const responses = uid ? activeMatches.flatMap((match) => match.responses.filter((response) => response.uid === uid)) : [];
    const available = responses.filter((response) => response.status === "Disponible").length;
    const answered = responses.filter((response) => response.status !== "En attente").length;
    return {
      matches: activeMatches.length,
      confirmed: activeMatches.filter((match) => match.status === "Confirmé").length,
      presenceRate: answered ? Math.round((available / answered) * 100) : 0,
      responseRate: activeMatches.length ? Math.round((answered / activeMatches.length) * 100) : 0,
    };
  }, [matches, session?.localId]);

  async function toggleNotifications() {
    if (notificationsEnabled) {
      const settings = await updateAppSettings({ notificationsEnabled: false });
      setNotificationsEnabled(settings.notificationsEnabled);
      return;
    }
    const permission = await registerForPushNotificationsAsync();
    if (permission) {
      const settings = await updateAppSettings({ notificationsEnabled: true });
      setNotificationsEnabled(settings.notificationsEnabled);
      Alert.alert("Notifications activées", "Les notifications locales DYNO sont actives.");
      return;
    }
    Alert.alert("Autoriser les notifications", "Android bloque les notifications DYNO.", [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les réglages", onPress: () => void Linking.openSettings() },
    ]);
  }

  async function toggleReminder24h() {
    const settings = await updateAppSettings({ reminder24h: !reminder24h });
    setReminder24h(settings.reminder24h);
  }

  async function toggleReminder1h() {
    const settings = await updateAppSettings({ reminder1h: !reminder1h });
    setReminder1h(settings.reminder1h);
  }

  async function toggleAppearance() {
    const settings = await updateAppSettings({ appearance: appearance === "gold" ? "dark" : "gold" });
    setAppearance(settings.appearance);
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
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Ton identité, tes statistiques et les réglages de l'application.</Text>

          <View style={styles.profileCard}>
            <Image source={logoSource} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayNameFromEmail(session?.email)}</Text>
              <Text style={styles.email} numberOfLines={1}>{session?.email ?? "Session en cours de chargement"}</Text>
              <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Connecté automatiquement</Text></View>
            </View>
            <Ionicons name="diamond" size={22} color={Theme.colors.goldLight} />
          </View>

          <Text style={styles.sectionLabel}>STATISTIQUES RÉELLES</Text>
          <View style={styles.statsGrid}>
            <Stat icon="calendar" value={String(stats.matches)} label="Matchs" />
            <Stat icon="shield-checkmark" value={String(stats.confirmed)} label="Confirmés" />
            <Stat icon="checkmark-circle" value={`${stats.presenceRate}%`} label="Présence" />
            <Stat icon="chatbox-ellipses" value={`${stats.responseRate}%`} label="Réponses" />
          </View>

          <Text style={styles.sectionLabel}>RÉGLAGES</Text>
          <View style={styles.settingsCard}>
            <Setting icon="notifications-outline" label="Notifications" value={notificationsEnabled ? "Activées" : "Désactivées"} onPress={() => void toggleNotifications()} />
            <View style={styles.separator} />
            <Setting icon="time-outline" label="Rappel 24 h avant" value={reminder24h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void toggleReminder24h()} />
            <View style={styles.separator} />
            <Setting icon="alarm-outline" label="Rappel 1 h avant" value={reminder1h ? "Activé" : "Désactivé"} disabled={!notificationsEnabled} onPress={() => void toggleReminder1h()} />
            <View style={styles.separator} />
            <Setting icon="color-palette-outline" label="Apparence" value={appearance === "gold" ? "DYNO Or" : "Sombre"} onPress={() => void toggleAppearance()} />
          </View>

          <Text style={styles.sectionLabel}>MISE À JOUR</Text>
          <View style={styles.updateCard}>
            <View style={styles.updateHeader}>
              <Ionicons name="cloud-download-outline" size={24} color={Theme.colors.goldLight} />
              <View style={styles.updateText}>
                <Text style={styles.updateTitle}>Version installée {getInstalledVersion()}</Text>
                <Text style={styles.updateSubtitle}>{updateInfo?.updateAvailable ? `Version ${updateInfo.latestVersion} disponible` : "Vérifie les Releases GitHub DYNO."}</Text>
              </View>
            </View>
            {updateInfo?.releaseNotes.length ? <View style={styles.releaseNotes}><Text style={styles.releaseNotesTitle}>NOUVEAUTÉS</Text>{updateInfo.releaseNotes.map((note, index) => <Text key={`${note}-${index}`} style={styles.releaseNote}>• {note}</Text>)}</View> : null}
            <TouchableOpacity style={styles.updateButton} onPress={() => updateInfo?.updateAvailable ? void openAppUpdate(updateInfo) : void checkUpdate()}>
              <Text style={styles.updateButtonText}>{updateInfo?.updateAvailable ? "TÉLÉCHARGER LA MISE À JOUR" : checkingUpdate ? "VÉRIFICATION..." : "RECHERCHER UNE MISE À JOUR"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF8585" /><Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return <View style={styles.statCard}><Ionicons name={icon} size={22} color={Theme.colors.goldLight} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Setting({ icon, label, value, onPress, disabled = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void; disabled?: boolean }) {
  return <TouchableOpacity disabled={disabled} style={[styles.settingRow, disabled && styles.disabled]} activeOpacity={0.75} onPress={onPress}><View style={styles.settingIcon}><Ionicons name={icon} size={20} color={Theme.colors.goldLight} /></View><Text style={styles.settingLabel}>{label}</Text><Text style={styles.settingValue}>{value}</Text><Ionicons name="chevron-forward" size={18} color="#8C8C8C" /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.6 }, backgroundDark: { opacity: 0.18 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" }, overlayDark: { backgroundColor: "rgba(0,0,0,0.82)" }, content: { paddingHorizontal: 20, paddingTop: 42, paddingBottom: 150 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" }, avatar: { width: 68, height: 68, borderRadius: 20, marginRight: 14 }, profileInfo: { flex: 1 }, name: { color: "#fff", fontSize: 22, fontWeight: "900" }, email: { color: Theme.colors.goldLight, fontSize: 11, marginTop: 5, maxWidth: 210 }, onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 8 }, onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4AD45E", marginRight: 6 }, onlineText: { color: "#BEBEBE", fontSize: 11 },
  sectionLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: 24, marginBottom: 10 }, statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, statCard: { width: "48.4%", minHeight: 125, borderRadius: 21, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "rgba(8,8,8,0.74)", borderWidth: 1, borderColor: "rgba(224,184,67,0.3)" }, statValue: { color: "#fff", fontSize: 27, fontWeight: "900", marginTop: 8 }, statLabel: { color: "#CFCFCF", fontSize: 11, marginTop: 3 },
  settingsCard: { borderRadius: 22, paddingHorizontal: 14, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.34)" }, settingRow: { minHeight: 64, flexDirection: "row", alignItems: "center" }, disabled: { opacity: 0.42 }, settingIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.09)", marginRight: 11 }, settingLabel: { flex: 1, color: "#fff", fontWeight: "800" }, settingValue: { color: "#AFAFAF", fontSize: 11, marginRight: 7 }, separator: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 49 },
  updateCard: { padding: 17, borderRadius: 22, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.34)" }, updateHeader: { flexDirection: "row", alignItems: "center" }, updateText: { flex: 1, marginLeft: 12 }, updateTitle: { color: "#fff", fontWeight: "900" }, updateSubtitle: { color: "#AFAFAF", fontSize: 11, marginTop: 4 }, releaseNotes: { marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }, releaseNotesTitle: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 7 }, releaseNote: { color: "#D5D5D5", fontSize: 11, lineHeight: 17, marginBottom: 3 }, updateButton: { minHeight: 46, marginTop: 15, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold }, updateButtonText: { color: "#090909", fontSize: 11, fontWeight: "900" },
  logoutButton: { minHeight: 54, borderRadius: 18, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(130,20,20,0.16)", borderWidth: 1, borderColor: "rgba(255,100,100,0.28)" }, logoutText: { color: "#FF8585", fontWeight: "900" },
});