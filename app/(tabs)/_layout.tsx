import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { Tabs, usePathname } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AppState, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Theme } from "../../constants/theme";
import { canCreateScrim } from "../../services/accessControl";
import { getStoredSession } from "../../services/authService";
import { getMatches, subscribeToMatches, toMatchDate } from "../../services/matchStore";
import type { AuthSession } from "../../services/authService";
import type { Match } from "../../services/matchStore";

function CenterAction({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.centerGlow, focused && styles.centerGlowActive]}>
      <View style={styles.centerButton}>
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </View>
    </View>
  );
}

function NavIcon({
  focused,
  color,
  size,
  active,
  inactive,
}: {
  focused: boolean;
  color: string;
  size: number;
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.iconSlot, focused && styles.iconSlotActive]}>
      <Ionicons name={focused ? active : inactive} color={color} size={focused ? size + 1 : size} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [allowedToCreate, setAllowedToCreate] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  const refreshCreateAccess = useCallback(() => {
    void canCreateScrim()
      .then(setAllowedToCreate)
      .catch(() => setAllowedToCreate(false));
  }, []);

  useEffect(() => {
    refreshCreateAccess();
  }, [pathname, refreshCreateAccess]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshCreateAccess();
    });
    return () => subscription.remove();
  }, [refreshCreateAccess]);

  useEffect(() => {
    void getStoredSession().then(setSession);
    void getMatches().then(setMatches);

    if (Platform.OS === "android" && Updates.isEnabled) {
      void Updates.checkForUpdateAsync()
        .then(async (update) => {
          if (!update.isAvailable) return;
          await Updates.fetchUpdateAsync();
          Alert.alert(
            "Mise à jour DYNO prête",
            "La mise à jour a été téléchargée directement dans l'application. Redémarre DYNO pour l'appliquer.",
            [
              { text: "Plus tard", style: "cancel" },
              { text: "Redémarrer", onPress: () => void Updates.reloadAsync() },
            ],
          );
        })
        .catch(() => null);
    }

    return subscribeToMatches(setMatches);
  }, []);

  const pendingCount = useMemo(() => {
    if (!session) return 0;
    const now = Date.now();
    return matches.filter((match) => {
      if (match.status === "Annulé") return false;
      const date = toMatchDate(match);
      if (!date || date.getTime() < now) return false;
      const response = match.responses.find((item) => item.uid === session.localId)?.status ?? "En attente";
      return response === "En attente";
    }).length;
  }, [matches, session]);

  // Sur Android la barre système est déjà opaque : réinjecter tout l'inset dans
  // la tab bar créait une seconde grosse zone noire au-dessus des boutons système.
  const safeBottom = Platform.OS === "android" ? 6 : Math.max(insets.bottom, 6);
  const tabBarHeight = 56 + safeBottom;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.goldLight,
        tabBarInactiveTintColor: "#C8C8C8",
        tabBarActiveBackgroundColor: "rgba(246,215,106,0.07)",
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "900", marginTop: -1 },
        tabBarIconStyle: { marginTop: 0 },
        tabBarStyle: {
          position: "absolute",
          left: 6,
          right: 6,
          bottom: 0,
          height: tabBarHeight,
          paddingTop: 4,
          paddingBottom: safeBottom,
          borderRadius: 20,
          backgroundColor: "rgba(6,6,6,0.985)",
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(246,215,106,0.24)",
          shadowColor: "#000000",
          shadowOpacity: 0.3,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 4 },
          elevation: 14,
        },
        tabBarItemStyle: { borderRadius: 15, minHeight: 46, marginHorizontal: 1 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Accueil", tabBarIcon: ({ color, size, focused }) => <NavIcon focused={focused} color={color} size={size} active="home" inactive="home-outline" /> }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="planning" options={{ title: "Agenda", tabBarBadge: pendingCount || undefined, tabBarBadgeStyle: { backgroundColor: "#E84B4B", color: "#fff", fontSize: 9, fontWeight: "900" }, tabBarIcon: ({ color, size, focused }) => <NavIcon focused={focused} color={color} size={size} active="calendar" inactive="calendar-outline" /> }} />
      <Tabs.Screen name="scrims" options={{ href: allowedToCreate ? "/scrims" : null, title: "", tabBarLabel: () => null, tabBarIcon: ({ focused }) => <CenterAction focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ title: "Équipe", tabBarIcon: ({ color, size, focused }) => <NavIcon focused={focused} color={color} size={size} active="people" inactive="people-outline" /> }} />
      <Tabs.Screen name="support" options={{ title: "Support", tabBarIcon: ({ color, size, focused }) => <NavIcon focused={focused} color={color} size={size} active="help-circle" inactive="help-circle-outline" /> }} />
      <Tabs.Screen name="profile" options={{ title: "Plus", tabBarIcon: ({ color, size, focused }) => <NavIcon focused={focused} color={color} size={size} active="settings" inactive="settings-outline" /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconSlot: { width: 32, height: 28, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  iconSlotActive: { backgroundColor: "rgba(246,215,106,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.18)" },
  centerGlow: { width: 46, height: 46, borderRadius: 23, marginTop: -10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,175,49,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(241,205,97,0.38)", shadowColor: Theme.colors.goldLight, shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 9 },
  centerGlowActive: { transform: [{ scale: 1.04 }], backgroundColor: "rgba(217,175,49,0.17)", borderColor: "rgba(255,226,128,0.7)" },
  centerButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,10,10,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,122,0.5)" },
});