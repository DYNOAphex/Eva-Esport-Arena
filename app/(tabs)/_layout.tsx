import { Ionicons } from "@expo/vector-icons";
import * as Updates from "expo-updates";
import { Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [allowedToCreate, setAllowedToCreate] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    void canCreateScrim().then(setAllowedToCreate);
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
    return matches.filter((match) => match.status !== "Annulé" && !match.responses.some((response) => response.uid === session.localId && response.status !== "En attente")).length;
  }, [matches, session]);

  const safeBottom = Math.max(insets.bottom, 8);
  const tabBarHeight = 58 + safeBottom;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.goldLight,
        tabBarInactiveTintColor: "#A5A5A5",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 9, fontWeight: "800", marginTop: -1 },
        tabBarIconStyle: { marginTop: 1 },
        tabBarStyle: {
          position: "absolute",
          left: 8,
          right: 8,
          bottom: 0,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: safeBottom,
          borderRadius: 22,
          backgroundColor: "rgba(7,7,7,0.97)",
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: Theme.colors.borderGold,
          shadowColor: "#000000",
          shadowOpacity: 0.28,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 14,
        },
        tabBarItemStyle: { borderRadius: 18, minHeight: 50 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Accueil", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="planning" options={{ title: "Agenda", tabBarBadge: pendingCount || undefined, tabBarBadgeStyle: { backgroundColor: "#E84B4B", color: "#fff", fontSize: 9 }, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="scrims" options={{ href: allowedToCreate ? "/scrims" : null, title: "", tabBarLabel: () => null, tabBarIcon: ({ focused }) => <CenterAction focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ title: "Équipe", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="support" options={{ title: "Support", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "help-buoy" : "help-buoy-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Plus", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={focused ? size + 1 : size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerGlow: { width: 50, height: 50, borderRadius: 25, marginTop: -12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,175,49,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(241,205,97,0.38)", shadowColor: Theme.colors.goldLight, shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 10 },
  centerGlowActive: { transform: [{ scale: 1.04 }], backgroundColor: "rgba(217,175,49,0.17)", borderColor: "rgba(255,226,128,0.7)" },
  centerButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,10,10,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,122,0.5)" },
});