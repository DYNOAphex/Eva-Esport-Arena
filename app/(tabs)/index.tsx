import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

const stats = [
  { icon: "people" as const, value: "6", label: "Joueurs", detail: "dans l'équipe" },
  { icon: "checkmark-circle" as const, value: "5", label: "Présents", detail: "au scrim" },
  { icon: "trophy" as const, value: "2-0", label: "Dernier match", detail: "Victoire" },
  { icon: "trending-up" as const, value: "68%", label: "Winrate", detail: "saison actuelle" },
];

const players = ["KroxX", "Neazy", "Zerox", "Venom", "Lyzen", "Skyzz"];

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshText, setRefreshText] = useState("Tire vers le bas pour actualiser");

  const refreshApp = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    setRefreshText("Recherche d'une mise à jour…");

    try {
      if (!Updates.isEnabled) {
        setRefreshText("Application actualisée");
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) {
        setRefreshText("Tu as déjà la dernière version");
        return;
      }

      setRefreshText("Téléchargement de la mise à jour…");
      await Updates.fetchUpdateAsync();
      setRefreshText("Mise à jour installée");

      Alert.alert(
        "Mise à jour prête",
        "L'application va redémarrer pour appliquer la nouvelle version.",
        [{ text: "Redémarrer", onPress: () => Updates.reloadAsync() }],
        { cancelable: false },
      );
    } catch {
      setRefreshText("Actualisation impossible");
      Alert.alert("Actualisation", "Impossible de vérifier les mises à jour pour le moment.");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshText("Tire vers le bas pour actualiser"), 3500);
    }
  }, [refreshing]);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.backgroundShade} />
        <View style={styles.vignetteTop} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshApp}
              tintColor={Theme.colors.goldLight}
              colors={[Theme.colors.gold]}
              progressBackgroundColor="#151515"
              title={refreshText}
              titleColor={Theme.colors.goldLight}
            />
          }
        >
          <Text style={styles.refreshHint}>{refreshText}</Text>

          <View style={styles.header}>
            <TouchableOpacity style={styles.roundButton} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={23} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <View style={styles.brand}>
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
              <View>
                <Text style={styles.brandName}>DYNO</Text>
                <Text style={styles.brandSub}>ESPORT MANAGER</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.coachBadge} activeOpacity={0.8}>
              <Ionicons name="diamond" size={13} color={Theme.colors.goldLight} />
              <Text style={styles.coachLetter}>C</Text>
              <Text style={styles.coachRole}>Coach</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.whiteGlass} />
            <View style={styles.goldHairline} />

            <View style={styles.heroTop}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateMonth}>JUIL.</Text>
                <Text style={styles.dateDay}>17</Text>
              </View>
              <View>
                <Text style={styles.eyebrow}>PROCHAIN SCRIM</Text>
                <Text style={styles.confirmedSmall}>CONFIRMÉ</Text>
              </View>
            </View>

            <View style={styles.versusRow}>
              <Text style={styles.teamName}>DYNO</Text>
              <Text style={styles.vs}>VS</Text>
              <Text style={styles.teamName}>TITANS</Text>
            </View>

            <View style={styles.metaRow}>
              <Meta icon="time-outline" value="20h30" label="Lobby" />
              <View style={styles.divider} />
              <Meta icon="locate-outline" value="21h00" label="Début du match" />
              <View style={styles.divider} />
              <Meta icon="business-outline" value="Arène 2" label="Mode : Scrim" />
            </View>

            <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={24} color="#92DD54" />
              <Text style={styles.confirmText}>Confirmé</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Ionicons name={stat.icon} size={26} color={Theme.colors.goldLight} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statDetail, stat.detail === "Victoire" && styles.green]}>{stat.detail}</Text>
              </View>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.onlineTitle}>
                <View style={styles.onlineDot} />
                <Text style={styles.sectionTitle}>JOUEURS CONNECTÉS</Text>
              </View>
              <Text style={styles.seeAll}>Voir tout ›</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersRow}>
              {players.map((player) => (
                <View key={player} style={styles.player}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>{player.slice(0, 1)}</Text>
                    <View style={styles.playerDot} />
                  </View>
                  <Text style={styles.playerName}>{player}</Text>
                  <Text style={styles.playerStatus}>En ligne</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ANNONCES RÉCENTES</Text>
              <Text style={styles.seeAll}>Voir tout ›</Text>
            </View>
            <View style={styles.announcement}>
              <View style={styles.announcementIcon}>
                <Ionicons name="megaphone-outline" size={33} color={Theme.colors.goldLight} />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>Scrim contre TITANS confirmé !</Text>
                <Text style={styles.announcementText}>Rendez-vous à 20h30 pour le lobby.</Text>
                <Text style={styles.announcementTime}>Il y a 2h</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Meta({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={22} color={Theme.colors.goldLight} />
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070707" },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.76 },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.48)" },
  vignetteTop: { position: "absolute", top: 0, left: 0, right: 0, height: 190, backgroundColor: "rgba(0,0,0,0.24)" },
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 128 },
  refreshHint: { color: "rgba(246,215,106,0.82)", fontSize: 10, textAlign: "center", marginBottom: 1 },
  header: { minHeight: 96, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  roundButton: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,8,0.82)", borderWidth: 1, borderColor: "rgba(224,184,67,0.5)" },
  notificationDot: { position: "absolute", right: 7, top: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: Theme.colors.gold },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  brandName: { color: "#fff", fontSize: 27, fontWeight: "900", letterSpacing: 2.7 },
  brandSub: { color: "#D7D7D7", fontSize: 8, fontWeight: "800", letterSpacing: 2.1, marginTop: -1 },
  coachBadge: { width: 58, height: 74, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,8,0.84)", borderWidth: 1, borderColor: "rgba(224,184,67,0.5)" },
  coachLetter: { color: "#fff", fontSize: 22, fontWeight: "900" },
  coachRole: { color: "#D0D0D0", fontSize: 10, fontWeight: "700" },
  heroCard: { overflow: "hidden", borderRadius: 27, padding: 18, backgroundColor: "rgba(9,9,9,0.68)", borderWidth: 1, borderColor: "rgba(224,184,67,0.48)", shadowColor: Theme.colors.gold, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  whiteGlass: { position: "absolute", top: -50, right: -96, width: 270, height: 410, borderRadius: 135, backgroundColor: "rgba(255,255,255,0.13)", transform: [{ rotate: "13deg" }] },
  goldHairline: { position: "absolute", top: 0, left: 34, right: 34, height: 1, backgroundColor: "rgba(255,218,104,0.75)" },
  heroTop: { flexDirection: "row", alignItems: "center" },
  dateBadge: { width: 64, height: 74, borderRadius: 17, backgroundColor: "#F5F1E8", alignItems: "center", justifyContent: "center", marginRight: 16 },
  dateMonth: { color: "#725C1D", fontSize: 12, fontWeight: "900" },
  dateDay: { color: "#111", fontSize: 30, lineHeight: 32, fontWeight: "900" },
  eyebrow: { color: Theme.colors.goldLight, fontSize: 15, fontWeight: "900", letterSpacing: 1.1 },
  confirmedSmall: { color: "#91D653", fontSize: 12, fontWeight: "900", marginTop: 6 },
  versusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 28 },
  teamName: { color: "#fff", fontSize: 31, fontWeight: "900", letterSpacing: 1 },
  vs: { color: Theme.colors.gold, fontSize: 19, fontWeight: "900" },
  metaRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.13)", paddingTop: 17 },
  metaItem: { flex: 1, alignItems: "center" },
  metaValue: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 6 },
  metaLabel: { color: "#D1D1D1", fontSize: 10, textAlign: "center", marginTop: 3 },
  divider: { width: 1, height: 54, backgroundColor: "rgba(255,255,255,0.13)" },
  confirmButton: { alignSelf: "center", minWidth: 190, height: 48, borderRadius: 24, marginTop: 19, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(4,4,4,0.88)", borderWidth: 1, borderColor: "rgba(224,184,67,0.5)" },
  confirmText: { color: "#92DD54", fontSize: 17, fontWeight: "900" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 },
  statCard: { width: "48.4%", minHeight: 154, borderRadius: 23, padding: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,8,0.68)", borderWidth: 1, borderColor: "rgba(224,184,67,0.3)", marginBottom: 12 },
  statValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  statLabel: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 2 },
  statDetail: { color: "#D0D0D0", fontSize: 11, marginTop: 6 },
  green: { color: "#8ED653" },
  sectionCard: { borderRadius: 24, padding: 16, backgroundColor: "rgba(8,8,8,0.7)", borderWidth: 1, borderColor: "rgba(224,184,67,0.32)", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  onlineTitle: { flexDirection: "row", alignItems: "center" },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#7AD351", marginRight: 8 },
  sectionTitle: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900", letterSpacing: 0.7 },
  seeAll: { color: Theme.colors.gold, fontSize: 12, fontWeight: "800" },
  playersRow: { gap: 15, paddingRight: 8 },
  player: { width: 65, alignItems: "center" },
  avatar: { width: 59, height: 59, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,18,18,0.94)", borderWidth: 1, borderColor: "rgba(241,205,97,0.78)" },
  avatarInitial: { color: "#fff", fontSize: 22, fontWeight: "900" },
  playerDot: { position: "absolute", right: 1, bottom: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: "#37CA4C", borderWidth: 2, borderColor: "#111" },
  playerName: { color: "#fff", fontSize: 11, fontWeight: "900", marginTop: 7 },
  playerStatus: { color: "#83D354", fontSize: 9, marginTop: 2 },
  announcement: { flexDirection: "row", alignItems: "center" },
  announcementIcon: { width: 70, height: 70, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.09)", borderWidth: 1, borderColor: "rgba(224,184,67,0.42)", marginRight: 14 },
  announcementContent: { flex: 1 },
  announcementTitle: { color: "#fff", fontSize: 14, fontWeight: "900" },
  announcementText: { color: "#D0D0D0", fontSize: 12, lineHeight: 18, marginTop: 5 },
  announcementTime: { color: "#9A9A9A", fontSize: 10, marginTop: 5 },
});
