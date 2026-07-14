import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";
import { getStoredSession, logout } from "../../services/authService";
import { getMatches, subscribeToMatches } from "../../services/matchStore";
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

  useEffect(() => {
    let active = true;
    void getStoredSession().then((value) => active && setSession(value));
    void getMatches().then((items) => active && setMatches(items));
    const unsubscribe = subscribeToMatches(setMatches);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    const uid = session?.localId;
    const responses = uid
      ? matches.flatMap((match) => match.responses.filter((response) => response.uid === uid))
      : [];
    const available = responses.filter((response) => response.status === "Disponible").length;
    const answered = responses.filter((response) => response.status !== "En attente").length;
    const presenceRate = answered ? Math.round((available / answered) * 100) : 0;
    const responseRate = matches.length ? Math.round((answered / matches.length) * 100) : 0;

    return {
      matches: matches.length,
      confirmed: matches.filter((match) => match.status === "Confirmé").length,
      presenceRate,
      responseRate,
    };
  }, [matches, session?.localId]);

  function confirmLogout() {
    Alert.alert("Se déconnecter", "Tu devras te reconnecter pour accéder à l'équipe.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: () => {
          void logout().then(() => router.replace("/(auth)/login"));
        },
      },
    ]);
  }

  const displayName = displayNameFromEmail(session?.email);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Ton identité, tes statistiques et les réglages de l'application.</Text>

          <View style={styles.profileCard}>
            <Image source={logoSource} style={styles.avatar} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.role}>Compte DYNO</Text>
              <Text style={styles.email} numberOfLines={1}>{session?.email ?? "Session en cours de chargement"}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Connecté</Text>
              </View>
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
            <Setting icon="notifications-outline" label="Notifications" value="À configurer" />
            <View style={styles.separator} />
            <Setting icon="color-palette-outline" label="Apparence" value="DYNO Or" />
            <View style={styles.separator} />
            <Setting icon="shield-checkmark-outline" label="Rôle" value="Non attribué" />
          </View>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF8585" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={Theme.colors.goldLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Setting({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.75}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={Theme.colors.goldLight} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color="#8C8C8C" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.6 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 24, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" },
  avatar: { width: 68, height: 68, borderRadius: 20, marginRight: 14 },
  profileInfo: { flex: 1 },
  name: { color: "#fff", fontSize: 22, fontWeight: "900" },
  role: { color: Theme.colors.goldLight, marginTop: 4, fontWeight: "700" },
  email: { color: "#BEBEBE", fontSize: 10, marginTop: 4, maxWidth: 210 },
  onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4AD45E", marginRight: 6 },
  onlineText: { color: "#BEBEBE", fontSize: 11 },
  sectionLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.3, marginTop: 24, marginBottom: 10 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "48.4%", minHeight: 125, borderRadius: 21, alignItems: "center", justifyContent: "center", marginBottom: 12, backgroundColor: "rgba(8,8,8,0.74)", borderWidth: 1, borderColor: "rgba(224,184,67,0.3)" },
  statValue: { color: "#fff", fontSize: 27, fontWeight: "900", marginTop: 8 },
  statLabel: { color: "#CFCFCF", fontSize: 11, marginTop: 3 },
  settingsCard: { borderRadius: 22, paddingHorizontal: 14, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.34)" },
  settingRow: { minHeight: 64, flexDirection: "row", alignItems: "center" },
  settingIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.09)", marginRight: 11 },
  settingLabel: { flex: 1, color: "#fff", fontWeight: "800" },
  settingValue: { color: "#AFAFAF", fontSize: 11, marginRight: 7 },
  separator: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 49 },
  logoutButton: { minHeight: 54, borderRadius: 18, marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(130,20,20,0.16)", borderWidth: 1, borderColor: "rgba(255,100,100,0.28)" },
  logoutText: { color: "#FF8585", fontWeight: "900" },
});