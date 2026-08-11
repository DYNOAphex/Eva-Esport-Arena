import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import AuthVisualGuide from "../../components/dyno/AuthVisualGuide";
import { Theme } from "../../constants/theme";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert("Champs requis", "Renseigne ton e-mail et ton mot de passe.");
    try {
      setLoading(true);
      const { loginWithEmail } = await import("../../services/authService");
      const session = await loginWithEmail(email, password);
      const provisionalNickname = session.email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Joueur DYNO";
      const { ensureCurrentAccountRosterPlayer } = await import("../../services/rosterStore");
      await ensureCurrentAccountRosterPlayer(provisionalNickname).catch(() => null);
      router.replace("/(tabs)/home");
    } catch (error) {
      Alert.alert("Erreur de connexion", error instanceof Error ? error.message : "Connexion impossible.");
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <View style={styles.whiteGlow} />
        <View style={styles.goldVein} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <View style={styles.logoWrap}><Image source={logoSource} style={styles.logo} resizeMode="contain" /></View>
              <View style={styles.brandText}>
                <Text style={styles.brandName}>DYNO</Text>
                <Text style={styles.brandSub}>ESPORT MANAGER</Text>
              </View>
              <View style={styles.securePill}><View style={styles.secureDot} /><Text style={styles.secureText}>SÉCURISÉ</Text></View>
            </View>

            <View style={styles.card}>
              <Text style={styles.kicker}>CENTRE DE COMMANDE</Text>
              <Text style={styles.title}>Bon retour.</Text>
              <Text style={styles.subtitle}>Connecte-toi pour retrouver ton équipe, les scrims et tes disponibilités.</Text>

              <AuthVisualGuide mode="login" />

              <Text style={styles.fieldLabel}>ADRESSE E-MAIL</Text>
              <View style={styles.inputWrap}><Ionicons name="mail-outline" size={18} color={Theme.colors.goldLight} /><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nom@exemple.fr" placeholderTextColor="#777" value={email} onChangeText={setEmail} style={styles.input} /></View>

              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={18} color={Theme.colors.goldLight} /><TextInput placeholder="••••••••" placeholderTextColor="#777" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} onSubmitEditing={() => void handleLogin()} returnKeyType="go" /><TouchableOpacity accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color="#BEBEBE" /></TouchableOpacity></View>

              <TouchableOpacity activeOpacity={0.86} disabled={loading} onPress={() => void handleLogin()} style={[styles.button, loading && styles.buttonDisabled]}>{loading ? <ActivityIndicator color="#080808" /> : <><Text style={styles.buttonText}>SE CONNECTER</Text><Ionicons name="arrow-forward" size={18} color="#080808" /></>}</TouchableOpacity>

              <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>NOUVEAU SUR DYNO ?</Text><View style={styles.divider} /></View>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.secondaryButton}><Ionicons name="person-add-outline" size={17} color={Theme.colors.goldLight} /><Text style={styles.secondaryText}>Créer un compte joueur</Text></TouchableOpacity>
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
  backgroundImage: { opacity: 0.34 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.76)" },
  whiteGlow: { position: "absolute", top: -80, right: -110, width: 300, height: 360, borderRadius: 180, backgroundColor: "rgba(255,255,255,0.025)" },
  goldVein: { position: "absolute", top: 145, left: -70, width: 480, height: 1, backgroundColor: "rgba(246,215,106,0.24)", transform: [{ rotate: "-24deg" }] },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 24 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  logoWrap: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.22)" },
  logo: { width: 48, height: 48, borderRadius: 14 },
  brandText: { flex: 1, marginLeft: 12 },
  brandName: { color: "#fff", fontSize: 27, fontWeight: "900", letterSpacing: 3.2 },
  brandSub: { color: "#BDBDBD", fontSize: 8, fontWeight: "900", letterSpacing: 2.2, marginTop: 1 },
  securePill: { minHeight: 25, paddingHorizontal: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(131,221,87,0.05)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(131,221,87,0.18)" },
  secureDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#83DD57" },
  secureText: { color: "#9ADC7F", fontSize: 7, fontWeight: "900" },
  card: { backgroundColor: "rgba(7,7,7,0.91)", borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.18)", padding: 20, shadowColor: "#000", shadowOpacity: 0.26, shadowRadius: 20, elevation: 10 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#C8C8C8", marginTop: 7, marginBottom: 16, fontSize: 13, lineHeight: 19 },
  fieldLabel: { color: "#8F8F8F", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
  inputWrap: { minHeight: 53, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingHorizontal: 14, marginBottom: 13 },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 14 },
  eyeButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  button: { minHeight: 54, backgroundColor: Theme.colors.goldLight, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1.2, fontSize: 12 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 17 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.1)" },
  dividerText: { color: "#777", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  secondaryButton: { minHeight: 46, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(246,215,106,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.2)" },
  secondaryText: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900" },
});
