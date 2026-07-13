import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Champs requis", "Renseigne ton e-mail et ton mot de passe.");
      return;
    }

    try {
      setLoading(true);
      const { loginWithEmail } = await import("../../services/authService");
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
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.brandBlock}>
              <Image source={logoSource} style={styles.logo} resizeMode="contain" />
              <Text style={styles.brandName}>DYNO</Text>
              <Text style={styles.brandSub}>ESPORT MANAGER</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.kicker}>BIENVENUE DANS L'ARÈNE</Text>
              <Text style={styles.title}>Connexion</Text>
              <Text style={styles.subtitle}>Accède à ton espace équipe et prépare tes prochains matchs.</Text>

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color={Theme.colors.goldLight} />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Adresse e-mail"
                  placeholderTextColor="#A8A8A8"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={Theme.colors.goldLight} />
                <TextInput
                  placeholder="Mot de passe"
                  placeholderTextColor="#A8A8A8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#BEBEBE" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.86} disabled={loading} onPress={handleLogin} style={[styles.button, loading && styles.buttonDisabled]}>
                {loading ? (
                  <ActivityIndicator color="#080808" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>SE CONNECTER</Text>
                    <Ionicons name="arrow-forward" size={19} color="#080808" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.linkButton}>
                <Text style={styles.linkMuted}>Pas encore membre ? </Text>
                <Text style={styles.link}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  flex: { flex: 1 },
  background: { flex: 1 },
  backgroundImage: { opacity: 0.82 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.56)" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 34 },
  brandBlock: { alignItems: "center", marginBottom: 24 },
  logo: { width: 88, height: 88, borderRadius: 24, marginBottom: 10 },
  brandName: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: 4 },
  brandSub: { color: "#D6D6D6", fontSize: 10, fontWeight: "800", letterSpacing: 2.8, marginTop: 2 },
  card: { backgroundColor: "rgba(8,8,8,0.78)", borderRadius: 28, borderWidth: 1, borderColor: "rgba(224,184,67,0.48)", padding: 22, shadowColor: Theme.colors.gold, shadowOpacity: 0.22, shadowRadius: 20, elevation: 10 },
  kicker: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.7, marginBottom: 9 },
  title: { color: "#fff", fontSize: 36, fontWeight: "900" },
  subtitle: { color: "#CFCFCF", marginTop: 8, marginBottom: 24, fontSize: 15, lineHeight: 22 },
  inputWrap: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(20,20,20,0.9)", borderWidth: 1, borderColor: "rgba(224,184,67,0.28)", borderRadius: 18, paddingHorizontal: 16, marginBottom: 14 },
  input: { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 16 },
  button: { minHeight: 58, backgroundColor: Theme.colors.gold, borderRadius: 19, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1.4 },
  linkButton: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  linkMuted: { color: "#C6C6C6", fontWeight: "600" },
  link: { color: Theme.colors.goldLight, fontWeight: "900" },
});
