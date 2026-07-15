import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Theme } from "../../constants/theme";
import { canCreateScrim } from "../../services/accessControl";
import { getStoredSession } from "../../services/authService";
import { getMatches, subscribeToMatches } from "../../services/matchStore";
import type { AuthSession } from "../../services/authService";
import type { Match } from "../../services/matchStore";

function CenterAction({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.centerGlow, focused && styles.centerGlowActive]}>
      <View style={styles.centerButton}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const [allowedToCreate, setAllowedToCreate] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    void canCreateScrim().then(setAllowedToCreate);
    void getStoredSession().then(setSession);
    void getMatches().then(setMatches);
    return subscribeToMatches(setMatches);
  }, []);

  const pendingCount = useMemo(() => {
    if (!session) return 0;
    return matches.filter((match) => match.status !== "Annulé" && !match.responses.some((response) => response.uid === session.localId && response.status !== "En attente")).length;
  }, [matches, session]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.goldLight,
        tabBarInactiveTintColor: "#929292",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "800", marginTop: 1 },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 10,
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
          borderRadius: 24,
          backgroundColor: "rgba(7,7,7,0.985)",
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(255,255,255,0.1)",
          shadowColor: "#000000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 12,
        },
        tabBarItemStyle: { borderRadius: 20 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Accueil", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="planning" options={{ title: "Agenda", tabBarBadge: pendingCount || undefined, tabBarBadgeStyle: { backgroundColor: "#E84B4B", color: "#fff", fontSize: 9 }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="scrims" options={{ href: allowedToCreate ? "/scrims" : null, title: "", tabBarLabel: () => null, tabBarIcon: ({ focused }) => <CenterAction focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ title: "Équipe", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Plus", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={focused ? size + 1 : size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerGlow: { width: 52, height: 52, borderRadius: 26, marginTop: -15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,175,49,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(241,205,97,0.32)", shadowColor: Theme.colors.goldLight, shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  centerGlowActive: { transform: [{ scale: 1.03 }], backgroundColor: "rgba(217,175,49,0.14)" },
  centerButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,10,10,0.99)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,122,0.42)" },
});