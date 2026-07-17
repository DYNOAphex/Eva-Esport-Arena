import { Ionicons } from "@expo/vector-icons";
import { Platform, SafeAreaView, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { getAppSettings } from "../../services/appSettings";
import { getInstalledVersion } from "../../services/appUpdateService";
import { getValidSession } from "../../services/authService";
import { getWebPushDiagnostic } from "../../services/webPushDiagnostics";

export default function SupportScreen() {
  const [busy, setBusy] = useState(false);

  async function prepareDiagnostic() {
    setBusy(true);
    try {
      const [session, permissions, settings, webPush] = await Promise.all([
        getValidSession(),
        getScrimPermissions(),
        getAppSettings(),
        Platform.OS === "web" ? getWebPushDiagnostic() : Promise.resolve(null),
      ]);

      const lines = [
        "Diagnostic DYNO Esport Manager",
        `Version : ${getInstalledVersion()}`,
        `Plateforme : ${Platform.OS}`,
        `Compte : ${session?.email ?? "Non connecté"}`,
        `Rôle : ${permissions.canManage ? "Administrateur" : "Joueur"}`,
        `Notifications : ${settings.notificationsEnabled ? "activées" : "désactivées"}`,
        `Rappel 24 h : ${settings.reminder24h ? "activé" : "désactivé"}`,
        `Rappel 1 h : ${settings.reminder1h ? "activé" : "désactivé"}`,
        `Date : ${new Date().toLocaleString("fr-FR")}`,
      ];

      if (webPush) {
        lines.push(
          `Web Push - autorisation : ${webPush.permission}`,
          `Web Push - service worker : ${webPush.serviceWorker}`,
          `Web Push - abonnement : ${webPush.subscription}`,
          `Web Push - Firebase : ${webPush.firebase}`,
          `PWA installée : ${webPush.installed ? "oui" : "non"}`,
          `Erreur Web Push : ${webPush.error ?? "aucune"}`,
        );
      }

      const diagnostic = lines.join("\n");
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(diagnostic);
        window.alert("Diagnostic copié. Colle-le dans ton message au support DYNO.");
      } else {
        await Share.share({ title: "Diagnostic DYNO", message: diagnostic });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>En cas de problème, prépare un diagnostic complet sans mot de passe ni donnée sensible.</Text>

        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="help-buoy-outline" size={28} color={Theme.colors.goldLight} /></View>
          <Text style={styles.cardTitle}>Signaler un problème</Text>
          <Text style={styles.cardText}>Le diagnostic contient la version, la plateforme, ton rôle et l’état des notifications.</Text>
          <TouchableOpacity style={styles.button} disabled={busy} onPress={() => void prepareDiagnostic()}>
            <Ionicons name={Platform.OS === "web" ? "copy-outline" : "share-social-outline"} size={18} color="#080808" />
            <Text style={styles.buttonText}>{busy ? "Préparation…" : Platform.OS === "web" ? "Copier le diagnostic" : "Partager le diagnostic"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 120 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#CFCFCF", marginTop: 8, lineHeight: 20 },
  card: { marginTop: 24, padding: 20, borderRadius: 24, backgroundColor: "rgba(15,15,15,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.1)" },
  cardTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 16 },
  cardText: { color: "#C8C8C8", marginTop: 8, lineHeight: 19 },
  button: { marginTop: 18, minHeight: 48, borderRadius: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold },
  buttonText: { color: "#080808", fontWeight: "900" },
});