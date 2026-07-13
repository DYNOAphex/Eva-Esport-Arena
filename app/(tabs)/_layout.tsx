import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { Theme } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.colors.goldLight,
        tabBarInactiveTintColor: "#8A8A8A",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          marginTop: 2,
        },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          height: 74,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 28,
          backgroundColor: "rgba(12,12,12,0.97)",
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: "rgba(212,175,55,0.38)",
          shadowColor: Theme.colors.gold,
          shadowOpacity: 0.22,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 14,
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={focused ? size + 2 : size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={focused ? size + 2 : size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scrims"
        options={{
          title: "Scrims",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={focused ? size + 8 : size + 6} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Équipe",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} color={color} size={focused ? size + 2 : size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Plus",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={focused ? size + 2 : size} />
          ),
        }}
      />
    </Tabs>
  );
}
