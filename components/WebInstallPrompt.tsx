import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../constants/theme";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: DeferredInstallPrompt;
  }
}

export default function WebInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<DeferredInstallPrompt | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(standalone));

    const onPrompt = (event: DeferredInstallPrompt) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (Platform.OS !== "web" || installed) return null;

  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  async function install() {
    if (installEvent) {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setInstallEvent(null);
      return;
    }
    setShowIosHelp(true);
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} style={styles.banner} onPress={() => void install()}>
        <View style={styles.icon}><Ionicons name="download-outline" size={21} color="#090909" /></View>
        <View style={styles.textWrap}><Text style={styles.title}>Installer DYNO</Text><Text style={styles.subtitle}>{isIos ? "Ajouter à l’écran d’accueil sur iPhone" : "Installer l’application sur ce téléphone"}</Text></View>
        <Ionicons name="chevron-forward" size={20} color="#090909" />
      </TouchableOpacity>

      <Modal visible={showIosHelp} transparent animationType="fade" onRequestClose={() => setShowIosHelp(false)}>
        <View style={styles.backdrop}><View style={styles.modal}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Installer DYNO sur iPhone</Text><TouchableOpacity onPress={() => setShowIosHelp(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity></View>
          <Text style={styles.step}>1. Ouvre ce lien dans Safari.</Text>
          <Text style={styles.step}>2. Appuie sur le bouton Partager en bas de Safari.</Text>
          <Text style={styles.step}>3. Choisis « Sur l’écran d’accueil ».</Text>
          <Text style={styles.step}>4. Appuie sur « Ajouter ».</Text>
          <Text style={styles.note}>Apple ne permet pas à un site de lancer automatiquement cette fenêtre : ces étapes sont obligatoires sur iPhone.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowIosHelp(false)}><Text style={styles.closeText}>J’ai compris</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: { position: "absolute", zIndex: 100, left: 16, right: 16, top: 12, minHeight: 62, borderRadius: 19, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", backgroundColor: Theme.colors.goldLight, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 12, elevation: 12 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.45)" }, textWrap: { flex: 1, marginHorizontal: 11 }, title: { color: "#090909", fontSize: 15, fontWeight: "900" }, subtitle: { color: "#393013", fontSize: 10, fontWeight: "700", marginTop: 2 },
  backdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(0,0,0,0.82)" }, modal: { borderRadius: 26, padding: 21, backgroundColor: "#101010", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.15)" }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, modalTitle: { color: "#fff", fontSize: 21, fontWeight: "900", flex: 1 }, step: { color: "#F0F0F0", fontSize: 14, lineHeight: 22, marginBottom: 8 }, note: { color: "#BEBEBE", fontSize: 11, lineHeight: 17, marginTop: 8 }, closeButton: { height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginTop: 18 }, closeText: { color: "#090909", fontWeight: "900" },
});
