import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, ImageBackground, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import DashboardCommandCenter from "../../components/dyno/DashboardCommandCenter";
import { Theme } from "../../constants/theme";
import { getAppSettings } from "../../services/appSettings";
import { getMatches, Match, subscribeToMatches, toMatchDate } from "../../services/matchStore";
import { getUnreadNotificationCount } from "../../services/notificationCenterStore";
import { getRoster, RosterPlayer, subscribeToRoster } from "../../services/rosterStore";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

function formatTime(value?: string) { return value ? value.replace(":", "h") : "--h--"; }
function formatTimeOptions(first?: string, second?: string) {
  if (!first) return "--h--";
  return second ? `${formatTime(first)} / ${formatTime(second)}` : formatTime(first);
}
function formatDateLabel(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}
function getDateParts(value?: string) {
  if (!value) return { month: "---", day: "--" };
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "---", day: "--" };
  return { month: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "").toUpperCase(), day: String(date.getDate()).padStart(2, "0") };
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshText, setRefreshText] = useState("Tire vers le bas pour actualiser");
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [firebaseReady, setFirebaseReady] = useState<boolean | undefined>(undefined);
  const [notificationsReady, setNotificationsReady] = useState<boolean | undefined>(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([getMatches(), getRoster(), getAppSettings()])
      .then(([matchItems, rosterItems, settings]) => {
        if (!active) return;
        setMatches(matchItems);
        setPlayers(rosterItems);
        setNotificationsReady(settings.notificationsEnabled);
        setFirebaseReady(true);
      })
      .catch(() => active && setFirebaseReady(false));
    const unsubscribeMatches = subscribeToMatches(setMatches);
    const unsubscribeRoster = subscribeToRoster(setPlayers);
    return () => { active = false; unsubscribeMatches(); unsubscribeRoster(); };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getUnreadNotificationCount(matches)
        .then((count) => { if (active) setUnreadNotifications(count); })
        .catch(() => null);
      return () => { active = false; };
    }, [matches]),
  );

  useEffect(() => {
    if (!Updates.isEnabled) return;
    let cancelled = false;
    const checkInBackground = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable || cancelled) return;
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        Alert.alert(
          "Mise à jour DYNO prête",
          "La mise à jour a été téléchargée directement dans l'application. Redémarre DYNO pour l'appliquer.",
          [{ text: "Plus tard", style: "cancel" }, { text: "Redémarrer", onPress: () => void Updates.reloadAsync() }],
        );
      } catch {
        // La vérification reste silencieuse : l'application continue de fonctionner normalement.
      }
    };
    const timer = setTimeout(() => void checkInBackground(), 1800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const upcomingMatches = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((match) => {
        const date = toMatchDate(match);
        return Boolean(date && date.getTime() >= now && match.status !== "Annulé");
      })
      .sort((a, b) => (toMatchDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER) - (toMatchDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER));
  }, [matches]);

  const nextMatch = upcomingMatches[0];
  const responsePlayers = useMemo(() => {
    const seen = new Set<string>();
    return (nextMatch?.responses ?? []).filter((response) => {
      const key = (response.uid || response.player).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [nextMatch]);
  const fallbackPlayers: RosterPlayer[] = responsePlayers.map((response, index) => ({ id: response.uid || `response-${index}`, nickname: response.player, createdAt: "" }));
  const displayedPlayers = players.length ? players : fallbackPlayers;
  const answeredCount = responsePlayers.filter((response) => response.status !== "En attente").length;
  const availableCount = responsePlayers.filter((response) => response.status === "Disponible").length;
  const playerCount = Math.max(displayedPlayers.length, answeredCount);
  const pendingCount = nextMatch ? Math.max(playerCount - answeredCount, 0) : 0;
  const dateParts = getDateParts(nextMatch?.date);
  const stats = [
    { icon: "people" as const, value: String(playerCount), label: "Joueurs", detail: "dans l'équipe" },
    { icon: "checkmark-circle" as const, value: String(availableCount), label: "Disponibles", detail: nextMatch ? "au prochain match" : "aucun match prévu" },
    { icon: "calendar" as const, value: String(upcomingMatches.length), label: "À venir", detail: "matchs planifiés" },
    { icon: "help-circle" as const, value: String(pendingCount), label: "En attente", detail: "réponses joueurs" },
  ];

  const refreshApp = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true); setRefreshText("Synchronisation des données…");
    try {
      const [matchItems, rosterItems, settings] = await Promise.all([getMatches(), getRoster(), getAppSettings()]);
      setMatches(matchItems); setPlayers(rosterItems); setNotificationsReady(settings.notificationsEnabled); setFirebaseReady(true);
      setUnreadNotifications(await getUnreadNotificationCount(matchItems));
      if (!Updates.isEnabled) { setRefreshText("Données actualisées"); return; }
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) { setRefreshText("Application et données actualisées"); return; }
      await Updates.fetchUpdateAsync();
      Alert.alert("Mise à jour prête", "La mise à jour a été téléchargée dans DYNO.", [{ text: "Redémarrer", onPress: () => Updates.reloadAsync() }]);
    } catch { setFirebaseReady(false); setRefreshText("Actualisation impossible"); }
    finally { setRefreshing(false); setTimeout(() => setRefreshText("Tire vers le bas pour actualiser"), 3500); }
  }, [refreshing]);

  const notificationLabel = unreadNotifications > 9 ? "9+" : String(unreadNotifications);

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.backgroundShade} />
        <View style={styles.marbleLight} />
        <View style={styles.goldVein} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshApp} tintColor={Theme.colors.goldLight} colors={[Theme.colors.gold]} progressBackgroundColor="#151515" />}>
          <Text style={styles.refreshHint}>{refreshText}</Text>
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={unreadNotifications ? `${unreadNotifications} notifications non lues` : "Notifications"}
              style={styles.roundButton}
              activeOpacity={0.8}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name={unreadNotifications ? "notifications" : "notifications-outline"} size={23} color="#fff" />
              {unreadNotifications > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationLabel}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <View style={styles.brand}><Image source={logoSource} style={styles.logo} resizeMode="contain" /><View><Text style={styles.brandName}>DYNO</Text><Text style={styles.brandSub}>ESPORT MANAGER</Text></View></View>
            <View style={styles.headerSpacer} />
          </View>

          <DashboardCommandCenter
            opponent={nextMatch?.opponent}
            dateLabel={formatDateLabel(nextMatch?.date)}
            matchTime={nextMatch?.matchTime ? formatTimeOptions(nextMatch.matchTime, nextMatch.matchTimeAlt) : undefined}
            arena={nextMatch?.arena}
            available={availableCount}
            pending={pendingCount}
            firebaseReady={firebaseReady}
            notificationsReady={notificationsReady}
            onOpenAgenda={() => router.push("/(tabs)/planning")}
            onCreateScrim={() => router.push("/(tabs)/scrims")}
            onOpenTeam={() => router.push("/(tabs)/team")}
          />

          {nextMatch ? (
            <View style={styles.heroCard}>
              <View style={styles.heroMarbleGlow} />
              <View style={styles.goldHairline} />
              <View style={styles.heroTop}><View style={styles.dateBadge}><Text style={styles.dateMonth}>{dateParts.month}</Text><Text style={styles.dateDay}>{dateParts.day}</Text></View><View style={styles.heroText}><Text style={styles.eyebrow}>{`PROCHAIN ${nextMatch.type.toUpperCase()}`}</Text><Text style={styles.confirmedSmall}>{nextMatch.status.toUpperCase()}</Text></View></View>
              <View style={styles.versusRow}><Text style={styles.teamName}>DYNO</Text><Text style={styles.vs}>VS</Text><Text style={styles.teamName}>{nextMatch.opponent.toUpperCase()}</Text></View>
              <View style={styles.metaRow}>
                <Meta icon="time-outline" value={formatTimeOptions(nextMatch.matchTime, nextMatch.matchTimeAlt)} label="Horaires possibles" />
                <Meta icon="business-outline" value={nextMatch.arena ?? "--"} label={`Mode : ${nextMatch.type}`} />
              </View>
              <View style={styles.confirmButton}><Ionicons name={nextMatch.status === "Confirmé" ? "checkmark" : "hourglass-outline"} size={24} color="#92DD54" /><Text style={styles.confirmText}>{nextMatch.status}</Text></View>
            </View>
          ) : (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ouvrir l'agenda" activeOpacity={0.82} style={styles.emptyScheduleCard} onPress={() => router.push("/(tabs)/planning")}>
              <View style={styles.emptyScheduleIcon}><Ionicons name="calendar-clear-outline" size={25} color={Theme.colors.goldLight} /></View>
              <View style={styles.emptyScheduleText}>
                <Text style={styles.emptyScheduleTitle}>Agenda libre</Text>
                <Text style={styles.emptyScheduleSubtitle}>Aucun rendez-vous à venir. Consulte l’historique ou planifie le prochain scrim.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.goldLight} />
            </TouchableOpacity>
          )}

          <View style={styles.statsGrid}>{stats.map((stat) => <View key={stat.label} style={styles.statCard}><View style={styles.cardSheen} /><Ionicons name={stat.icon} size={24} color={Theme.colors.goldLight} /><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text><Text style={styles.statDetail}>{stat.detail}</Text></View>)}</View>
          <View style={styles.sectionCard}><View style={styles.cardSheen} /><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>JOUEURS DE L'ÉQUIPE</Text><Text style={styles.seeAll}>{playerCount} joueur{playerCount > 1 ? "s" : ""}</Text></View>{displayedPlayers.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false}>{displayedPlayers.map((player) => <View key={player.id} style={styles.player}><View style={styles.avatar}><Text style={styles.avatarInitial}>{player.nickname.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.playerName}>{player.nickname}</Text></View>)}</ScrollView> : <Text style={styles.emptyRoster}>Aucun joueur ajouté.</Text>}</View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Meta({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) { return <View style={styles.metaItem}><Ionicons name={icon} size={22} color={Theme.colors.goldLight} /><Text style={styles.metaValue}>{value}</Text><Text style={styles.metaLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  background: { flex: 1 },
  backgroundImage: { opacity: Theme.opacity.marble },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: Theme.colors.overlay },
  marbleLight: { position: "absolute", top: -120, right: -90, width: 280, height: 420, borderRadius: 160, backgroundColor: "rgba(255,255,255,0.08)", transform: [{ rotate: "18deg" }] },
  goldVein: { position: "absolute", top: 64, right: 46, width: 1, height: 310, backgroundColor: "rgba(246,215,106,0.3)", transform: [{ rotate: "24deg" }] },
  content: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 116 },
  refreshHint: { color: "rgba(246,215,106,0.9)", fontSize: 10, textAlign: "center", textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 },
  header: { minHeight: 84, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  roundButton: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.surfaceElevated, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold },
  notificationBadge: { position: "absolute", right: -2, top: -2, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#E84B4B", borderWidth: 2, borderColor: "#111111" },
  notificationBadgeText: { color: "#FFFFFF", fontSize: 9, lineHeight: 12, fontWeight: "900" },
  headerSpacer: { width: 50 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 44, height: 44, borderRadius: 12 },
  brandName: { color: "#fff", fontSize: 27, fontWeight: "900", letterSpacing: 2.7, textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 7 },
  brandSub: { color: Theme.colors.marbleWhite, fontSize: 8, fontWeight: "800", letterSpacing: 2.1, textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 5 },
  heroCard: { overflow: "hidden", borderRadius: 26, padding: 18, backgroundColor: "rgba(7,7,7,0.7)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold, shadowColor: "#000", shadowOpacity: 0.34, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  heroMarbleGlow: { position: "absolute", top: -60, right: -50, width: 220, height: 280, borderRadius: 120, backgroundColor: "rgba(255,255,255,0.075)", transform: [{ rotate: "18deg" }] },
  goldHairline: { position: "absolute", top: 0, left: 34, right: 34, height: 1, backgroundColor: "rgba(255,218,104,0.72)" },
  heroTop: { flexDirection: "row", alignItems: "center" },
  heroText: { flex: 1 },
  dateBadge: { width: 64, height: 74, borderRadius: 17, backgroundColor: "rgba(245,241,232,0.94)", alignItems: "center", justifyContent: "center", marginRight: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(212,175,55,0.5)" },
  dateMonth: { color: "#725C1D", fontSize: 12, fontWeight: "900" },
  dateDay: { color: "#111", fontSize: 30, fontWeight: "900" },
  eyebrow: { color: Theme.colors.goldLight, fontSize: 15, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 4 },
  confirmedSmall: { color: "#91D653", fontSize: 12, fontWeight: "900", marginTop: 6 },
  versusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 28 },
  teamName: { color: "#fff", fontSize: 27, fontWeight: "900", maxWidth: "42%", textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 7 },
  vs: { color: Theme.colors.gold, fontSize: 19, fontWeight: "900" },
  metaRow: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.18)", paddingTop: 17 },
  metaItem: { flex: 1, alignItems: "center" },
  metaValue: { color: "#fff", fontSize: 14, fontWeight: "900", marginTop: 6 },
  metaLabel: { color: Theme.colors.textMuted, fontSize: 10, textAlign: "center", marginTop: 3 },
  confirmButton: { alignSelf: "center", minWidth: 190, height: 48, borderRadius: 24, marginTop: 19, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(4,4,4,0.76)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)" },
  confirmText: { color: "#92DD54", fontSize: 17, fontWeight: "900" },
  emptyScheduleCard: { minHeight: 104, marginTop: 2, borderRadius: 23, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: "rgba(7,7,7,0.72)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.28)" },
  emptyScheduleIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.09)" },
  emptyScheduleText: { flex: 1 },
  emptyScheduleTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  emptyScheduleSubtitle: { color: "#C7C7C7", fontSize: 11, lineHeight: 16, marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14 },
  statCard: { overflow: "hidden", width: "48.4%", minHeight: 132, borderRadius: 22, padding: 14, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border, marginBottom: 11 },
  cardSheen: { position: "absolute", top: -55, right: -35, width: 120, height: 190, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.045)", transform: [{ rotate: "20deg" }] },
  statValue: { color: "#fff", fontSize: 29, fontWeight: "900", marginTop: 6 },
  statLabel: { color: "#fff", fontSize: 14, fontWeight: "900" },
  statDetail: { color: Theme.colors.textMuted, fontSize: 10, marginTop: 5 },
  sectionCard: { overflow: "hidden", borderRadius: 24, padding: 16, backgroundColor: Theme.colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" },
  seeAll: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: "800" },
  player: { width: 72, alignItems: "center", marginRight: 12 },
  avatar: { width: 59, height: 59, borderRadius: 30, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,18,18,0.78)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold },
  avatarInitial: { color: "#fff", fontSize: 22, fontWeight: "900" },
  playerName: { color: "#fff", fontSize: 11, fontWeight: "900", marginTop: 7 },
  emptyRoster: { color: Theme.colors.textMuted, textAlign: "center", paddingVertical: 16 },
});
