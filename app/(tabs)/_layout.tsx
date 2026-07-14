import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Theme } from "../../constants/theme";

function CenterAction({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.centerGlow, focused && styles.centerGlowActive]}>
      <View style={styles.centerButton}>
        <Ionicons name="add" size={38} color="#FFFFFF" />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.goldLight,
        tabBarInactiveTintColor: "#929292",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 10,
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 30,
          backgroundColor: "rgba(7,7,7,0.96)",
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: "rgba(224,184,67,0.42)",
          shadowColor: Theme.colors.gold,
          shadowOpacity: 0.28,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 0 },
          elevation: 18,
        },
        tabBarItemStyle: {
          borderRadius: 22,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={focused ? size + 2 : size} /> }} />
      <Tabs.Screen name="planning" options={{ title: "Agenda", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={focused ? size + 2 : size} /> }} />
      <Tabs.Screen name="scrims" options={{ title: "Scrims", tabBarLabelStyle: { fontSize: 10, fontWeight: "800", marginTop: 10 }, tabBarIcon: ({ focused }) => <CenterAction focused={focused} /> }} />
      <Tabs.Screen name="team" options={{ title: "Équipe", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={focused ? size + 2 : size} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Plus", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={focused ? size + 2 : size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerGlow: { width: 66, height: 66, borderRadius: 33, marginTop: -23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(217,175,49,0.18)", borderWidth: 1, borderColor: "rgba(241,205,97,0.7)", shadowColor: Theme.colors.goldLight, shadowOpacity: 0.75, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 20 },
  centerGlowActive: { transform: [{ scale: 1.05 }], backgroundColor: "rgba(217,175,49,0.28)" },
  centerButton: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(10,10,10,0.98)", borderWidth: 1, borderColor: "rgba(255,224,122,0.72)" },
});
