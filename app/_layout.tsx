import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Theme } from "../constants/theme";
import { getAppSettings } from "../services/appSettings";
import { registerForPushNotificationsAsync } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    void getAppSettings().then((settings) => {
      if (!settings.notificationsEnabled) return;
      return registerForPushNotificationsAsync();
    }).catch(() => {
      // The app remains usable if notification permission is refused or unavailable.
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background },
        }}
      />
    </SafeAreaProvider>
  );
}
