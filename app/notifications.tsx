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
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
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
        <TouchableOpacity accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unread ? `${unread} information${unread > 1 ? "s" : ""} à consulter` : "Tu es à jour"}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Theme.colors.goldLight} colors={[Theme.colors.gold]} progressBackgroundColor="#151515" />}
      >
        <NotificationCenter items={items} onOpenNotification={openItem} onMarkAllRead={markAllRead} />
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={19} color="#83DD57" />
          <Text style={styles.infoText}>L’historique de lecture reste stocké sur cet appareil. Aucune donnée privée supplémentaire n’est envoyée.</Text>
        </View>
      </ScrollView>
    </MarbleScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 18 },
  backButton: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,8,8,0.76)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.borderGold },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: "#FFFFFF", fontSize: 31, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#B8B8B8", fontSize: 12, marginTop: 4 },
  content: { paddingTop: 4 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 16, backgroundColor: "rgba(131,221,87,0.055)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(131,221,87,0.22)" },
  infoText: { flex: 1, color: "#B9C5B4", fontSize: 10, lineHeight: 16 },
});
