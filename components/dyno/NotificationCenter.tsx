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

const filters: Array<{ key: "toutes" | DynoNotificationCategory; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "toutes", label: "Toutes", icon: "apps-outline" },
  { key: "scrim", label: "Scrims", icon: "game-controller-outline" },
  { key: "rappel", label: "Rappels", icon: "alarm-outline" },
  { key: "équipe", label: "Équipe", icon: "people-outline" },
  { key: "système", label: "Système", icon: "settings-outline" },
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
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>CENTRE DE NOTIFICATIONS</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{unreadCount ? `${unreadCount} à consulter` : "Tout est à jour"}</Text>
            <View style={[styles.statePill, unreadCount ? styles.statePillAction : styles.statePillOk]}>
              <Ionicons name={unreadCount ? "alert-circle" : "checkmark-circle"} size={12} color={unreadCount ? "#FFCB6B" : "#83DD57"} />
              <Text style={[styles.stateText, unreadCount ? styles.stateTextAction : styles.stateTextOk]}>{unreadCount ? "ACTION" : "À JOUR"}</Text>
            </View>
          </View>
        </View>
        {unreadCount > 0 && onMarkAllRead ? (
          <TouchableOpacity accessibilityRole="button" onPress={onMarkAllRead} style={styles.markAllButton} activeOpacity={0.82}>
            <Ionicons name="checkmark-done" size={16} color={Theme.colors.goldLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => {
          const active = item.key === filter;
          return (
            <TouchableOpacity key={item.key} accessibilityRole="button" onPress={() => setFilter(item.key)} style={[styles.filter, active && styles.filterActive]} activeOpacity={0.82}>
              <Ionicons name={item.icon} size={13} color={active ? "#090909" : "#BEBEBE"} />
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
                  <Ionicons name={categoryIcon(item.category)} size={17} color={categoryColor(item.category)} />
                </View>
                <View style={styles.notificationText}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={[styles.notificationTitle, !item.read && styles.notificationTitleUnread]} numberOfLines={1}>{item.title}</Text>
                    {!item.read ? <View style={styles.smallDot} /> : null}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.time}>{item.timeLabel}</Text>
                    <Text style={styles.categoryLabel}>{categoryLabel(item.category)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={17} color="#777777" />
              </TouchableOpacity>
              {index < visibleItems.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-off-outline" size={25} color="#929292" /></View>
          <Text style={styles.emptyTitle}>Rien ici pour le moment</Text>
          <Text style={styles.emptyText}>Les scrims, rappels et informations d’équipe apparaîtront automatiquement ici.</Text>
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
function categoryLabel(category: DynoNotificationCategory) {
  if (category === "scrim") return "SCRIM";
  if (category === "rappel") return "RAPPEL";
  if (category === "équipe") return "ÉQUIPE";
  return "SYSTÈME";
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
  card: { marginBottom: 16, padding: 15 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerCopy: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1.15 },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  statePill: { minHeight: 24, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: StyleSheet.hairlineWidth },
  statePillAction: { backgroundColor: "rgba(255,203,107,0.08)", borderColor: "rgba(255,203,107,0.24)" },
  statePillOk: { backgroundColor: "rgba(131,221,87,0.08)", borderColor: "rgba(131,221,87,0.24)" },
  stateText: { fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  stateTextAction: { color: "#FFCB6B" },
  stateTextOk: { color: "#83DD57" },
  markAllButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.28)", backgroundColor: "rgba(246,215,106,0.05)" },
  filters: { gap: 7, paddingTop: 14, paddingBottom: 11 },
  filter: { minHeight: 34, paddingHorizontal: 11, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.10)" },
  filterActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight },
  filterText: { color: "#BEBEBE", fontSize: 8, fontWeight: "900" },
  filterTextActive: { color: "#090909" },
  list: { borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.025)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.07)" },
  notification: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 11, paddingVertical: 10 },
  notificationUnread: { backgroundColor: "rgba(246,215,106,0.045)" },
  categoryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryScrim: { backgroundColor: "rgba(246,215,106,0.08)" },
  categoryReminder: { backgroundColor: "rgba(255,203,107,0.08)" },
  categoryTeam: { backgroundColor: "rgba(131,221,87,0.08)" },
  categorySystem: { backgroundColor: "rgba(138,184,255,0.08)" },
  notificationText: { flex: 1, minWidth: 0 },
  notificationTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notificationTitle: { flexShrink: 1, color: "#DADADA", fontSize: 11, fontWeight: "800" },
  notificationTitleUnread: { color: "#FFFFFF", fontWeight: "900" },
  smallDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Theme.colors.goldLight },
  notificationMessage: { color: "#BEBEBE", fontSize: 9, lineHeight: 14, marginTop: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  time: { color: "#888888", fontSize: 8, fontWeight: "800" },
  categoryLabel: { color: "#737373", fontSize: 7, fontWeight: "900", letterSpacing: 0.65 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.07)", marginLeft: 57 },
  empty: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 18, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.025)" },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)" },
  emptyTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", marginTop: 10 },
  emptyText: { color: "#A5A5A5", fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 5 },
});
