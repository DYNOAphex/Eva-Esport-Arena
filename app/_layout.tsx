import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppUpdatePrompt from "../components/AppUpdatePrompt";
import WebInstallPrompt from "../components/WebInstallPrompt";
import { Theme } from "../constants/theme";
import { getAppSettings } from "../services/appSettings";
import { registerForPushNotificationsAsync } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web") {
      if (typeof document !== "undefined") {
        const manifest = document.querySelector('link[rel="manifest"]') ?? document.createElement("link");
        manifest.setAttribute("rel", "manifest");
        manifest.setAttribute("href", "/Eva-Esport-Arena/manifest.json?v=5");
        if (!manifest.parentNode) document.head.appendChild(manifest);

        const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') ?? document.createElement("link");
        appleIcon.setAttribute("rel", "apple-touch-icon");
        appleIcon.setAttribute("sizes", "512x512");
        appleIcon.setAttribute("href", "/Eva-Esport-Arena/pwa-512.png?v=5");
        if (!appleIcon.parentNode) document.head.appendChild(appleIcon);

        let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
        if (!appleMeta) {
          appleMeta = document.createElement("meta");
          appleMeta.setAttribute("name", "apple-mobile-web-app-capable");
          appleMeta.setAttribute("content", "yes");
          document.head.appendChild(appleMeta);
        }
      }

      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        void navigator.serviceWorker
          .register("/Eva-Esport-Arena/sw.js?v=5", { updateViaCache: "none" })
          .then(async (registration) => {
            await registration.update();
            if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
            if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
              await registerForPushNotificationsAsync().catch(() => null);
            }
          })
          .catch(() => null);
      }
      return;
    }

    void getAppSettings().then((settings) => {
      if (!settings.notificationsEnabled) return;
      return registerForPushNotificationsAsync();
    }).catch(() => null);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Theme.colors.background } }} />
      <AppUpdatePrompt />
      <WebInstallPrompt />
    </SafeAreaProvider>
  );
}
