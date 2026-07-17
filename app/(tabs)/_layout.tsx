import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";

import { Theme } from "../../constants/theme";
import { canCreateScrim } from "../../services/accessControl";
import { checkForAppUpdate, openAppUpdate } from "../../services/appUpdateService";
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

    if (Platform.OS === "android") {
      void checkForAppUpdate().then((info) => {
        if (!info.updateAvailable) return;
        const notes = info.releaseNotes.length ? `\n\n${info.releaseNotes.slice(0, 3).map((note) => `• ${note}`).join("\n")}` : "";
        Alert.alert(
          "Mise à jour DYNO disponible",
          `La version ${info.latestVersion} est disponible. Tu utilises actuellement la version ${info.installedVersion}.${notes}`,
          [
            { text: "Plus tard", style: "cancel" },
            { text: "Télécharger", onPress: () => void openAppUpdate(info).catch(() => Alert.alert("Mise à jour", "Le téléchargement n'a pas pu être ouvert.")) },
          ],
        );
      }).catch(() => null);
    }

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
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800", marginTop: 1 },
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
      <Tabs.Screen name="support" options={{ title: "Support", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "help-buoy" : "help-buoy-outline"} color={color} size={focused ? size + 1 : size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Plus", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={focused ? size + 1 : size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerGlow: { width: 52, height: 52, borderRadius: 26, marginTop: -15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,175,49,0.08)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(241,205,97,0.32)", shadowColor: Theme.colors.goldLight, shadowOpacity: 0.22, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  centerGlowActive: { transform: [{ scale: 1.03 }], backgroundColor: "rgba(217,175,49,0.14)" },
  centerButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,10,10,0.99)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,224,122,0.42)" },
});