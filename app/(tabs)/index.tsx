import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";

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
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.marbleBand, styles.marbleBandOne]} />
        <View style={[styles.marbleBand, styles.marbleBandTwo]} />
        <View style={[styles.goldVein, styles.goldVeinOne]} />
        <View style={[styles.goldVein, styles.goldVeinTwo]} />
      </View>

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
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <View style={styles.brand}>
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoLetter}>D</Text>
            </View>
            <View>
              <Text style={styles.brandName}>DYNO</Text>
              <Text style={styles.brandSub}>ESPORT MANAGER</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.coachBadge} activeOpacity={0.8}>
            <Ionicons name="diamond" size={14} color={Theme.colors.goldLight} />
            <Text style={styles.coachLetter}>C</Text>
            <Text style={styles.coachRole}>Coach</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.whiteMarblePatch} />
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
              <Ionicons name={stat.icon} size={27} color={Theme.colors.goldLight} />
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
                  <Ionicons name="person" size={27} color="#E8E8E8" />
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
              <Ionicons name="megaphone-outline" size={34} color={Theme.colors.goldLight} />
            </View>
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>Scrim contre TITANS confirmé !</Text>
              <Text style={styles.announcementText}>Rendez-vous à 20h30 pour le lobby.</Text>
              <Text style={styles.announcementTime}>Il y a 2h</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  content: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 120 },
  refreshHint: { color: "rgba(246,215,106,0.72)", fontSize: 10, textAlign: "center", marginBottom: 2 },
  marbleBand: { position: "absolute", width: 260, height: 820, backgroundColor: "rgba(238,238,238,0.06)", borderRadius: 120 },
  marbleBandOne: { top: -80, right: -130, transform: [{ rotate: "28deg" }] },
  marbleBandTwo: { top: 720, left: -150, transform: [{ rotate: "-31deg" }] },
  goldVein: { position: "absolute", height: 1, backgroundColor: "rgba(220,177,62,0.38)" },
  goldVeinOne: { width: 500, top: 270, left: -120, transform: [{ rotate: "-38deg" }] },
  goldVeinTwo: { width: 540, top: 930, right: -180, transform: [{ rotate: "31deg" }] },
  header: { minHeight: 104, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  roundButton: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,15,15,0.94)", borderWidth: 1, borderColor: "rgba(212,175,55,0.5)" },
  notificationDot: { position: "absolute", right: 7, top: 7, width: 11, height: 11, borderRadius: 6, backgroundColor: Theme.colors.gold },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoPlaceholder: { width: 45, height: 45, borderRadius: 13, backgroundColor: "#0D0D0D", borderWidth: 1, borderColor: Theme.colors.gold, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  logoLetter: { color: Theme.colors.goldLight, fontSize: 30, fontWeight: "900", fontStyle: "italic" },
  brandName: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 3 },
  brandSub: { color: "#BFBFBF", fontSize: 9, fontWeight: "800", letterSpacing: 2.3 },
  coachBadge: { width: 60, height: 78, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,15,15,0.95)", borderWidth: 1, borderColor: "rgba(212,175,55,0.52)" },
  coachLetter: { color: "#fff", fontSize: 23, fontWeight: "900" },
  coachRole: { color: "#BDBDBD", fontSize: 10, fontWeight: "700" },
  heroCard: { overflow: "hidden", borderRadius: 27, padding: 18, backgroundColor: "rgba(15,15,15,0.94)", borderWidth: 1, borderColor: "rgba(212,175,55,0.55)", shadowColor: Theme.colors.gold, shadowOpacity: 0.22, shadowRadius: 18, elevation: 9 },
  whiteMarblePatch: { position: "absolute", top: -30, right: -55, width: 245, height: 360, borderRadius: 120, backgroundColor: "rgba(245,245,245,0.08)", transform: [{ rotate: "15deg" }] },
  heroTop: { flexDirection: "row", alignItems: "center" },
  dateBadge: { width: 64, height: 74, borderRadius: 17, backgroundColor: "#F5F1E8", alignItems: "center", justifyContent: "center", marginRight: 16 },
  dateMonth: { color: "#725C1D", fontSize: 12, fontWeight: "900" },
  dateDay: { color: "#111", fontSize: 30, lineHeight: 32, fontWeight: "900" },
  eyebrow: { color: Theme.colors.goldLight, fontSize: 15, fontWeight: "900", letterSpacing: 1.1 },
  confirmedSmall: { color: "#91D653", fontSize: 12, fontWeight: "900", marginTop: 6 },
  versusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 28 },
  teamName: { color: "#fff", fontSize: 31, fontWeight: "900", letterSpacing: 1 },
  vs: { color: Theme.colors.gold, fontSize: 19, fontWeight: "900" },
  metaRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 17 },
  metaItem: { flex: 1, alignItems: "center" },
  metaValue: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 6 },
  metaLabel: { color: "#BDBDBD", fontSize: 10, textAlign: "center", marginTop: 3 },
  divider: { width: 1, height: 56, backgroundColor: "rgba(255,255,255,0.12)" },
  confirmButton: { alignSelf: "center", minWidth: 190, height: 48, borderRadius: 24, marginTop: 19, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(7,7,7,0.9)", borderWidth: 1, borderColor: "rgba(212,175,55,0.55)" },
  confirmText: { color: "#92DD54", fontSize: 17, fontWeight: "900" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 },
  statCard: { width: "48.4%", minHeight: 154, borderRadius: 23, padding: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(16,16,16,0.93)", borderWidth: 1, borderColor: "rgba(212,175,55,0.32)", marginBottom: 12 },
  statValue: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 8 },
  statLabel: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 2 },
  statDetail: { color: "#BDBDBD", fontSize: 11, marginTop: 6 },
  green: { color: "#8ED653" },
  sectionCard: { borderRadius: 24, padding: 16, backgroundColor: "rgba(15,15,15,0.93)", borderWidth: 1, borderColor: "rgba(212,175,55,0.34)", marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  onlineTitle: { flexDirection: "row", alignItems: "center" },
  onlineDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#7AD351", marginRight: 8 },
  sectionTitle: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900", letterSpacing: 0.7 },
  seeAll: { color: Theme.colors.gold, fontSize: 12, fontWeight: "800" },
  playersRow: { gap: 15, paddingRight: 8 },
  player: { width: 65, alignItems: "center" },
  avatar: { width: 59, height: 59, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#232323", borderWidth: 1, borderColor: Theme.colors.gold },
  playerDot: { position: "absolute", right: 1, bottom: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: "#37CA4C", borderWidth: 2, borderColor: "#111" },
  playerName: { color: "#fff", fontSize: 11, fontWeight: "900", marginTop: 7 },
  playerStatus: { color: "#83D354", fontSize: 9, marginTop: 2 },
  announcement: { flexDirection: "row", alignItems: "center" },
  announcementIcon: { width: 72, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(212,175,55,0.08)", borderWidth: 1, borderColor: "rgba(212,175,55,0.45)", marginRight: 14 },
  announcementContent: { flex: 1 },
  announcementTitle: { color: "#fff", fontSize: 14, fontWeight: "900" },
  announcementText: { color: "#BDBDBD", fontSize: 12, lineHeight: 18, marginTop: 5 },
  announcementTime: { color: "#777", fontSize: 10, marginTop: 5 },
});
