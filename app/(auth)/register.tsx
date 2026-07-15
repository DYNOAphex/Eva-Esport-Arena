import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.brandBlock}><Image source={logoSource} style={styles.logo} resizeMode="contain" /><Text style={styles.brandName}>DYNO</Text><Text style={styles.brandSub}>REJOINS L'ÉQUIPE</Text></View>
            <View style={styles.card}>
              <Text style={styles.kicker}>CRÉE TON ACCÈS</Text><Text style={styles.title}>Inscription</Text><Text style={styles.subtitle}>Ton pseudo sera ajouté automatiquement à l'équipe.</Text>
              <View style={styles.inputWrap}><Ionicons name="game-controller-outline" size={20} color={Theme.colors.goldLight} /><TextInput autoCapitalize="none" autoCorrect={false} placeholder="Pseudo joueur" placeholderTextColor="#A8A8A8" value={nickname} onChangeText={setNickname} style={styles.input} /></View>
              <View style={styles.inputWrap}><Ionicons name="mail-outline" size={20} color={Theme.colors.goldLight} /><TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Adresse e-mail" placeholderTextColor="#A8A8A8" value={email} onChangeText={setEmail} style={styles.input} /></View>
              <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={20} color={Theme.colors.goldLight} /><TextInput placeholder="Mot de passe" placeholderTextColor="#A8A8A8" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} /><TouchableOpacity onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#BEBEBE" /></TouchableOpacity></View>
              <View style={styles.inputWrap}><Ionicons name="shield-checkmark-outline" size={20} color={Theme.colors.goldLight} /><TextInput placeholder="Confirmer le mot de passe" placeholderTextColor="#A8A8A8" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} /></View>
              <Text style={styles.passwordHint}>6 caractères minimum</Text>
              <TouchableOpacity activeOpacity={0.86} disabled={loading} onPress={handleRegister} style={[styles.button, loading && styles.buttonDisabled]}>{loading ? <ActivityIndicator color="#080808" /> : <><Text style={styles.buttonText}>CRÉER LE COMPTE</Text><Ionicons name="person-add-outline" size={19} color="#080808" /></>}</TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}><Text style={styles.linkMuted}>Déjà membre ? </Text><Text style={styles.link}>Se connecter</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, flex: { flex: 1 }, background: { flex: 1 }, backgroundImage: { opacity: 0.42 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.68)" }, scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 28 }, brandBlock: { alignItems: "center", marginBottom: 20 }, logo: { width: 78, height: 78, borderRadius: 22, marginBottom: 8 }, brandName: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 4 }, brandSub: { color: "#D6D6D6", fontSize: 9, fontWeight: "800", letterSpacing: 2.6, marginTop: 2 }, card: { backgroundColor: "rgba(8,8,8,0.9)", borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", padding: 22, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 }, kicker: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.7, marginBottom: 9 }, title: { color: "#fff", fontSize: 34, fontWeight: "900" }, subtitle: { color: "#CFCFCF", marginTop: 8, marginBottom: 22, fontSize: 15, lineHeight: 22 }, inputWrap: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(20,20,20,0.9)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", borderRadius: 18, paddingHorizontal: 16, marginBottom: 14 }, input: { flex: 1, color: "#fff", fontSize: 15, paddingVertical: 16 }, passwordHint: { color: "#BDBDBD", fontSize: 11, marginTop: -4, marginBottom: 10, marginLeft: 4 }, button: { minHeight: 58, backgroundColor: Theme.colors.gold, borderRadius: 19, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1.1 }, linkButton: { flexDirection: "row", justifyContent: "center", marginTop: 22 }, linkMuted: { color: "#C6C6C6", fontWeight: "600" }, link: { color: Theme.colors.goldLight, fontWeight: "900" },
});