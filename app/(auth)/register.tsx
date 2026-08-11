import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import AuthVisualGuide from "../../components/dyno/AuthVisualGuide";
import { Theme } from "../../constants/theme";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

export default function RegisterScreen() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!nickname.trim() || !email.trim() || !password || !confirmPassword) return Alert.alert("Champs requis", "Complète le pseudo, l'adresse e-mail et les mots de passe.");
    if (password.length < 6) return Alert.alert("Mot de passe trop court", "Utilise au moins 6 caractères.");
    if (password !== confirmPassword) return Alert.alert("Mot de passe", "Les mots de passe ne correspondent pas.");

    try {
      setLoading(true);
      const { registerWithEmail } = await import("../../services/authService");
      await registerWithEmail(email, password);
      const { ensureCurrentAccountRosterPlayer } = await import("../../services/rosterStore");
      await ensureCurrentAccountRosterPlayer(nickname);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Erreur d'inscription", error instanceof Error ? error.message : "Création du compte impossible.");
    } finally { setLoading(false); }
  }

  const passwordOk = password.length >= 6;
  const confirmationOk = Boolean(confirmPassword) && password === confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <View style={styles.whiteGlow} />
        <View style={styles.goldVein} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <TouchableOpacity accessibilityLabel="Retour à la connexion" onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>
              <View style={styles.logoWrap}><Image source={logoSource} style={styles.logo} resizeMode="contain" /></View>
              <View style={styles.brandText}><Text style={styles.brandName}>DYNO</Text><Text style={styles.brandSub}>REJOINS LE ROSTER</Text></View>
            </View>

            <View style={styles.card}>
              <Text style={styles.kicker}>NOUVEAU JOUEUR</Text>
              <Text style={styles.title}>Crée ton accès.</Text>
              <Text style={styles.subtitle}>Ton compte sera relié à ton pseudo et synchronisé avec les services de l’équipe.</Text>

              <AuthVisualGuide mode="register" />

              <Text style={styles.fieldLabel}>PSEUDO JOUEUR</Text>
              <View style={styles.inputWrap}><Ionicons name="game-controller-outline" size={18} color={Theme.colors.goldLight} /><TextInput autoCapitalize="none" autoCorrect={false} placeholder="Ton pseudo" placeholderTextColor="#777" value={nickname} onChangeText={setNickname} style={styles.input} maxLength={24} /></View>

              <Text style={styles.fieldLabel}>ADRESSE E-MAIL</Text>
              <View style={styles.inputWrap}><Ionicons name="mail-outline" size={18} color={Theme.colors.goldLight} /><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nom@exemple.fr" placeholderTextColor="#777" value={email} onChangeText={setEmail} style={styles.input} /></View>

              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={18} color={passwordOk ? "#83DD57" : Theme.colors.goldLight} /><TextInput placeholder="6 caractères minimum" placeholderTextColor="#777" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} /><TouchableOpacity accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color="#BEBEBE" /></TouchableOpacity></View>

              <Text style={styles.fieldLabel}>CONFIRMATION</Text>
              <View style={[styles.inputWrap, confirmationOk && styles.inputWrapOk]}><Ionicons name="shield-checkmark-outline" size={18} color={confirmationOk ? "#83DD57" : Theme.colors.goldLight} /><TextInput placeholder="Confirme le mot de passe" placeholderTextColor="#777" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} onSubmitEditing={() => void handleRegister()} returnKeyType="go" />{confirmationOk ? <Ionicons name="checkmark-circle" size={19} color="#83DD57" /> : null}</View>

              <View style={styles.passwordState}><View style={[styles.passwordDot, passwordOk && styles.passwordDotOk]} /><Text style={[styles.passwordHint, passwordOk && styles.passwordHintOk]}>{passwordOk ? "Mot de passe conforme" : "6 caractères minimum"}</Text></View>

              <TouchableOpacity activeOpacity={0.86} disabled={loading} onPress={() => void handleRegister()} style={[styles.button, loading && styles.buttonDisabled]}>{loading ? <ActivityIndicator color="#080808" /> : <><Text style={styles.buttonText}>CRÉER LE COMPTE</Text><Ionicons name="person-add-outline" size={18} color="#080808" /></>}</TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}><Text style={styles.loginMuted}>Déjà membre ? </Text><Text style={styles.loginText}>Se connecter</Text></TouchableOpacity>
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
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 22 },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 10 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  logoWrap: { width: 52, height: 52, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.22)" },
  logo: { width: 43, height: 43, borderRadius: 12 },
  brandText: { flex: 1 },
  brandName: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 3 },
  brandSub: { color: "#BDBDBD", fontSize: 7, fontWeight: "900", letterSpacing: 2, marginTop: 1 },
  card: { backgroundColor: "rgba(7,7,7,0.92)", borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.18)", padding: 19, shadowColor: "#000", shadowOpacity: 0.26, shadowRadius: 20, elevation: 10 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 5 },
  subtitle: { color: "#C8C8C8", marginTop: 7, marginBottom: 15, fontSize: 12, lineHeight: 18 },
  fieldLabel: { color: "#8F8F8F", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginLeft: 2 },
  inputWrap: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", borderRadius: 15, paddingHorizontal: 13, marginBottom: 11 },
  inputWrapOk: { borderColor: "rgba(131,221,87,0.28)", backgroundColor: "rgba(131,221,87,0.035)" },
  input: { flex: 1, color: "#fff", fontSize: 13, paddingVertical: 13 },
  eyeButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  passwordState: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -2, marginBottom: 11, marginLeft: 2 },
  passwordDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: "#8A8A8A" },
  passwordDotOk: { backgroundColor: "#83DD57" },
  passwordHint: { color: "#929292", fontSize: 9, fontWeight: "800" },
  passwordHintOk: { color: "#93D87A" },
  button: { minHeight: 53, backgroundColor: Theme.colors.goldLight, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1.1, fontSize: 12 },
  loginLink: { flexDirection: "row", justifyContent: "center", marginTop: 17 },
  loginMuted: { color: "#AFAFAF", fontSize: 11, fontWeight: "700" },
  loginText: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900" },
});
