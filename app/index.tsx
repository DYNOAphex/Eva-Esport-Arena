import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../constants/theme";

export default function HomeScreen() {
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

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.button}
        onPress={() => router.replace("/(auth)/login")}
      >
        <Text style={styles.buttonText}>COMMENCER</Text>
      </TouchableOpacity>
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
});
