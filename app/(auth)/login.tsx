import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";
import { loginWithEmail } from "../../services/authService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Champs requis", "Renseigne ton e-mail et ton mot de passe.");
      return;
    }

    try {
      setLoading(true);
      await loginWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connexion impossible.";
      Alert.alert("Erreur de connexion", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.kicker}>EVA ESPORT ARENA</Text>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Accède à ton espace équipe.</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Adresse e-mail"
          placeholderTextColor={Theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor={Theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading}
          onPress={handleLogin}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>SE CONNECTER</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  kicker: {
    color: Theme.colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: Theme.colors.textMuted,
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
  },
  input: {
    minHeight: 56,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 16,
    color: Theme.colors.text,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  button: {
    minHeight: 58,
    backgroundColor: Theme.colors.gold,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  link: {
    color: Theme.colors.goldLight,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 22,
  },
});
