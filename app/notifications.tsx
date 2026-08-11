import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationCenter, { DynoNotificationItem } from "../components/dyno/NotificationCenter";
import MarbleScreen from "../components/dyno/MarbleScreen";
import { Theme } from "../constants/theme";
import { getMatches, Match, subscribeToMatches } from "../services/matchStore";
import { getNotificationCenterItems, markAllNotificationsRead, markNotificationRead } from "../services/notificationCenterStore";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<Match[]>([]);
  const [items, setItems] = useState<DynoNotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (source?: Match[]) => {
    const matchItems = source ?? await getMatches();
    setMatches(matchItems);
    setItems(await getNotificationCenterItems(matchItems));
  }, []);

  useEffect(() => {
    let active = true;
    void getMatches().then(async (matchItems) => {
      if (!active) return;
      setMatches(matchItems);
      setItems(await getNotificationCenterItems(matchItems));
    });
    const unsubscribe = subscribeToMatches((matchItems) => {
      if (!active) return;
      void load(matchItems);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); }
    finally { setRefreshing(false); }
  }, [load]);

  const openItem = useCallback(async (item: DynoNotificationItem) => {
    await markNotificationRead(item.id);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
    if (item.matchId) router.push("/(tabs)/planning");
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead(items);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }, [items]);

  const unread = items.filter((item) => !item.read).length;

  return (
    <MarbleScreen strongerOverlay contentStyle={[styles.screen, { paddingTop: Math.max(insets.top, 18) }]}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Retour" style={styles.backButton} onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>DYNO · CENTRE D’ACTIVITÉ</Text>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.subtitleRow}>
            <View style={[styles.headerStateDot, unread ? styles.headerStateDotAction : styles.headerStateDotOk]} />
            <Text style={styles.subtitle}>{unread ? `${unread} élément${unread > 1 ? "s" : ""} demande${unread > 1 ? "nt" : ""} ton attention` : "Aucune action en attente"}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Theme.colors.goldLight} colors={[Theme.colors.gold]} progressBackgroundColor="#151515" />}
      >
        <NotificationCenter items={items} onOpenNotification={openItem} onMarkAllRead={markAllRead} />
        <View style={styles.infoBox}>
          <View style={styles.infoIcon}><Ionicons name="shield-checkmark-outline" size={17} color="#83DD57" /></View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Lecture locale et privée</Text>
            <Text style={styles.infoText}>L’état lu/non lu reste enregistré sur cet appareil. DYNO n’envoie aucune donnée privée supplémentaire.</Text>
          </View>
        </View>
      </ScrollView>
    </MarbleScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 13, paddingBottom: 15 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,8,0.72)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#FFFFFF", fontSize: 29, fontWeight: "900", marginTop: 3 },
  subtitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  headerStateDot: { width: 7, height: 7, borderRadius: 99 },
  headerStateDotAction: { backgroundColor: "#FFCB6B" },
  headerStateDotOk: { backgroundColor: "#83DD57" },
  subtitle: { flex: 1, color: "#B8B8B8", fontSize: 10 },
  content: { paddingTop: 2 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 15, backgroundColor: "rgba(131,221,87,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(131,221,87,0.17)" },
  infoIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(131,221,87,0.07)" },
  infoCopy: { flex: 1 },
  infoTitle: { color: "#CFEAC2", fontSize: 9, fontWeight: "900" },
  infoText: { color: "#AEBBA9", fontSize: 9, lineHeight: 14, marginTop: 3 },
});
