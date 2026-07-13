import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppLinks } from "../constants/links";
import { Theme } from "../constants/theme";

export default function HomeScreen() {
  async function handleInstall() {
    if (!AppLinks.install) {
      Alert.alert(
        "Installation bientôt disponible",
        "Le lien d'installation sera activé dès que la première version Android sera publiée.",
      );
      return;
    }

    const supported = await Linking.canOpenURL(AppLinks.install);

    if (!supported) {
      Alert.alert("Lien indisponible", "Impossible d'ouvrir le lien d'installation.");
      return;
    }

    await Linking.openURL(AppLinks.install);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Text style={styles.logo}>EVA</Text>
        <Text style={styles.title}>ESPORT ARENA</Text>
        <Text style={styles.subtitle}>
          Gérez vos scrims, votre planning et votre équipe.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.button}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.buttonText}>COMMENCER</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.installButton}
          onPress={handleInstall}
        >
          <Text style={styles.installButtonText}>INSTALLER L'APPLICATION</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 24,
    paddingVertical: 56,
    justifyContent: "space-between",
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: Theme.colors.gold,
    fontSize: 68,
    fontWeight: "900",
    letterSpacing: 8,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 10,
  },
  subtitle: {
    color: Theme.colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 22,
    maxWidth: 280,
  },
  actions: {
    gap: 12,
  },
  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: Theme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  installButton: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  installButtonText: {
    color: Theme.colors.gold,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
});
