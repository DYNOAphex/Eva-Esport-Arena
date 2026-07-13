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
import { registerWithEmail } from "../../services/authService";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert("Champs requis", "Complète tous les champs.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "Utilise au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mot de passe", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      await registerWithEmail(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Création du compte impossible.";
      Alert.alert("Erreur d'inscription", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.kicker}>EVA ESPORT ARENA</Text>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoins l'espace de ton équipe.</Text>

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

        <TextInput
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={Theme.colors.textMuted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading}
          onPress={handleRegister}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>CRÉER LE COMPTE</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>J'ai déjà un compte</Text>
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
    letterSpacing: 1.2,
  },
  link: {
    color: Theme.colors.goldLight,
    textAlign: "center",
    fontWeight: "700",
    marginTop: 22,
  },
});
