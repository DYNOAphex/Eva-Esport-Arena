import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Platform, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getScrimPermissions } from "../../services/accessControl";
import { getAppSettings } from "../../services/appSettings";
import { getInstalledVersion } from "../../services/appUpdateService";
import { getValidSession } from "../../services/authService";
import { getWebPushDiagnostic } from "../../services/webPushDiagnostics";

export default function SupportScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function prepareDiagnostic() {
    const description = message.trim();
    if (!description) {
      Alert.alert("Décris le problème", "Écris quelques mots sur ce qui ne fonctionne pas avant d'envoyer le diagnostic.");
      return;
    }

    setBusy(true);
    try {
      const [session, permissions, settings, webPush] = await Promise.all([
        getValidSession(),
        getScrimPermissions(),
        getAppSettings(),
        Platform.OS === "web" ? getWebPushDiagnostic() : Promise.resolve(null),
      ]);

      const lines = [
        "Signalement DYNO Esport Manager",
        "",
        "PROBLÈME SIGNALÉ",
        description,
        "",
        "DIAGNOSTIC TECHNIQUE",
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

      const report = lines.join("\n");
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(report);
        Alert.alert("Signalement copié", "Le message et le diagnostic sont prêts à être collés dans Discord ou dans un message à l'administrateur.");
      } else {
        await Share.share({ title: "Signalement DYNO", message: report });
      }
    } catch (error) {
      Alert.alert("Support", error instanceof Error ? error.message : "Le diagnostic n'a pas pu être préparé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>Décris ton problème. DYNO ajoutera automatiquement les informations techniques utiles, sans mot de passe ni jeton secret.</Text>

        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="help-buoy-outline" size={28} color={Theme.colors.goldLight} /></View>
          <Text style={styles.cardTitle}>Signaler un problème</Text>
          <Text style={styles.inputLabel}>QUE S'EST-IL PASSÉ ?</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Exemple : je ne reçois pas la notification du nouveau scrim…"
            placeholderTextColor="#777"
            multiline
            maxLength={1200}
            textAlignVertical="top"
            style={styles.input}
          />
          <Text style={styles.counter}>{message.length}/1200</Text>
          <Text style={styles.cardText}>Le signalement inclura aussi la version, la plateforme, ton rôle et l'état des notifications.</Text>
          <TouchableOpacity style={[styles.button, (!message.trim() || busy) && styles.buttonDisabled]} disabled={!message.trim() || busy} onPress={() => void prepareDiagnostic()}>
            <Ionicons name={Platform.OS === "web" ? "copy-outline" : "share-social-outline"} size={18} color="#080808" />
            <Text style={styles.buttonText}>{busy ? "Préparation…" : Platform.OS === "web" ? "Copier le signalement" : "Partager le signalement"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 140 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#CFCFCF", marginTop: 8, lineHeight: 20 },
  card: { marginTop: 24, padding: 20, borderRadius: 24, backgroundColor: "rgba(15,15,15,0.96)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" },
  icon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(224,184,67,0.1)" },
  cardTitle: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 16 },
  inputLabel: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginTop: 18, marginBottom: 8 },
  input: { minHeight: 145, borderRadius: 18, paddingHorizontal: 15, paddingVertical: 14, color: "#fff", fontSize: 15, lineHeight: 21, backgroundColor: "rgba(255,255,255,0.055)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.16)" },
  counter: { color: "#777", fontSize: 10, textAlign: "right", marginTop: 5 },
  cardText: { color: "#C8C8C8", marginTop: 12, lineHeight: 19 },
  button: { marginTop: 18, minHeight: 50, borderRadius: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.gold },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#080808", fontWeight: "900" },
});