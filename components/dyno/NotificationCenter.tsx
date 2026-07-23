import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import GlassCard from "./GlassCard";

export type DynoNotificationCategory = "scrim" | "rappel" | "équipe" | "système";

export type DynoNotificationItem = {
  id: string;
  title: string;
  message: string;
  timeLabel: string;
  category: DynoNotificationCategory;
  read?: boolean;
  matchId?: string;
};

type NotificationCenterProps = {
  items: DynoNotificationItem[];
  onOpenNotification?: (item: DynoNotificationItem) => void;
  onMarkAllRead?: () => void;
};

const filters: Array<{ key: "toutes" | DynoNotificationCategory; label: string }> = [
  { key: "toutes", label: "Toutes" },
  { key: "scrim", label: "Scrims" },
  { key: "rappel", label: "Rappels" },
  { key: "équipe", label: "Équipe" },
  { key: "système", label: "Système" },
];

export default function NotificationCenter({ items, onOpenNotification, onMarkAllRead }: NotificationCenterProps) {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("toutes");
  const unreadCount = items.filter((item) => !item.read).length;
  const visibleItems = useMemo(
    () => (filter === "toutes" ? items : items.filter((item) => item.category === filter)),
    [filter, items],
  );

  return (
    <GlassCard style={styles.card} strong>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="notifications-outline" size={22} color={Theme.colors.goldLight} />
          {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.kicker}>CENTRE DE NOTIFICATIONS</Text>
          <Text style={styles.title}>{unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est consulté"}</Text>
        </View>
        {unreadCount > 0 && onMarkAllRead ? (
          <TouchableOpacity accessibilityRole="button" onPress={onMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Tout lire</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => {
          const active = item.key === filter;
          return (
            <TouchableOpacity key={item.key} accessibilityRole="button" onPress={() => setFilter(item.key)} style={[styles.filter, active && styles.filterActive]}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visibleItems.length ? (
        <View style={styles.list}>
          {visibleItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.78}
                onPress={() => onOpenNotification?.(item)}
                style={[styles.notification, !item.read && styles.notificationUnread]}
              >
                <View style={[styles.categoryIcon, categoryStyle(item.category)]}>
                  <Ionicons name={categoryIcon(item.category)} size={18} color={categoryColor(item.category)} />
                </View>
                <View style={styles.notificationText}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.read ? <View style={styles.smallDot} /> : null}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.time}>{item.timeLabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#777777" />
              </TouchableOpacity>
              {index < visibleItems.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={28} color="#808080" />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptyText}>Les rappels, scrims et informations d’équipe apparaîtront ici.</Text>
        </View>
      )}
    </GlassCard>
  );
}

function categoryIcon(category: DynoNotificationCategory): keyof typeof Ionicons.glyphMap {
  if (category === "scrim") return "game-controller-outline";
  if (category === "rappel") return "alarm-outline";
  if (category === "équipe") return "people-outline";
  return "information-circle-outline";
}

function categoryColor(category: DynoNotificationCategory) {
  if (category === "scrim") return Theme.colors.goldLight;
  if (category === "rappel") return "#FFCB6B";
  if (category === "équipe") return "#83DD57";
  return "#8AB8FF";
}

function categoryStyle(category: DynoNotificationCategory) {
  if (category === "scrim") return styles.categoryScrim;
  if (category === "rappel") return styles.categoryReminder;
  if (category === "équipe") return styles.categoryTeam;
  return styles.categorySystem;
}

const styles = StyleSheet.create({
  card: { marginBottom: 18 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.08)" },
  unreadDot: { position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: 99, backgroundColor: "#FF7979" },
  headerText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.15 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900", marginTop: 4 },
  markAllButton: { minHeight: 34, paddingHorizontal: 11, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.35)" },
  markAllText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  filters: { gap: 8, paddingTop: 15, paddingBottom: 12 },
  filter: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  filterActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  filterText: { color: "#A7A7A7", fontSize: 9, fontWeight: "900" },
  filterTextActive: { color: "#090909" },
  list: { borderRadius: 18, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.025)" },
  notification: { minHeight: 84, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, paddingVertical: 11 },
  notificationUnread: { backgroundColor: "rgba(246,215,106,0.045)" },
  categoryIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  categoryScrim: { backgroundColor: "rgba(246,215,106,0.08)" },
  categoryReminder: { backgroundColor: "rgba(255,203,107,0.08)" },
  categoryTeam: { backgroundColor: "rgba(131,221,87,0.08)" },
  categorySystem: { backgroundColor: "rgba(138,184,255,0.08)" },
  notificationText: { flex: 1 },
  notificationTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  notificationTitle: { flexShrink: 1, color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  smallDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Theme.colors.goldLight },
  notificationMessage: { color: "#B6B6B6", fontSize: 10, lineHeight: 15, marginTop: 4 },
  time: { color: "#777777", fontSize: 8, fontWeight: "800", marginTop: 5 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginLeft: 63 },
  empty: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 18, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.025)" },
  emptyTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#929292", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 5 },
});
