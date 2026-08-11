import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";

const logoSource = require("../../assets/images/logo-dyno.png");
const marbleSource = require("../../assets/images/background-marble.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const complete = Boolean(email.trim() && password);

  async function handleLogin() {
    if (!complete) return Alert.alert("Champs requis", "Renseigne ton e-mail et ton mot de passe.");
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
        <View style={styles.goldGlow} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <View style={styles.logoShell}><Image source={logoSource} style={styles.logo} resizeMode="contain" /></View>
              <View>
                <Text style={styles.brandName}>DYNO</Text>
                <Text style={styles.brandSub}>ESPORT MANAGER</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.statePill}><View style={styles.stateDot} /><Text style={styles.stateText}>ESPACE ÉQUIPE</Text></View>
                <Text style={styles.title}>Connexion</Text>
                <Text style={styles.subtitle}>Retrouve ton équipe, tes scrims et tes disponibilités depuis un seul espace.</Text>
              </View>

              <Text style={styles.fieldLabel}>ADRESSE E-MAIL</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}><Ionicons name="mail-outline" size={18} color={Theme.colors.goldLight} /></View>
                <TextInput autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="nom@exemple.fr" placeholderTextColor="#777" value={email} onChangeText={setEmail} style={styles.input} returnKeyType="next" />
              </View>

              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}><Ionicons name="lock-closed-outline" size={18} color={Theme.colors.goldLight} /></View>
                <TextInput placeholder="••••••••" placeholderTextColor="#777" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} returnKeyType="done" onSubmitEditing={() => void handleLogin()} />
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color="#BEBEBE" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.86} disabled={loading || !complete} onPress={() => void handleLogin()} style={[styles.button, (loading || !complete) && styles.buttonDisabled]}>
                {loading ? <ActivityIndicator color="#080808" /> : <><Text style={styles.buttonText}>ENTRER DANS DYNO</Text><Ionicons name="arrow-forward" size={18} color="#080808" /></>}
              </TouchableOpacity>

              <View style={styles.securityRow}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#83DD57" />
                <Text style={styles.securityText}>Connexion sécurisée à l’espace privé de l’équipe.</Text>
              </View>

              <TouchableOpacity onPress={() => router.push("/(auth)/register")} style={styles.linkButton}>
                <Text style={styles.linkMuted}>Pas encore membre ? </Text><Text style={styles.link}>Créer un compte</Text>
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
  backgroundImage: { opacity: 0.34 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.74)" },
  goldGlow: { position: "absolute", top: -120, right: -130, width: 330, height: 330, borderRadius: 170, backgroundColor: "rgba(246,215,106,0.045)" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 30 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 20, paddingHorizontal: 3 },
  logoShell: { width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.24)" },
  logo: { width: 46, height: 46, borderRadius: 14 },
  brandName: { color: "#fff", fontSize: 25, fontWeight: "900", letterSpacing: 3.2 },
  brandSub: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 2.1, marginTop: 2 },
  card: { backgroundColor: "rgba(7,7,7,0.9)", borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.18)", padding: 20, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, elevation: 8 },
  cardHeader: { marginBottom: 20 },
  statePill: { alignSelf: "flex-start", minHeight: 25, paddingHorizontal: 9, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(246,215,106,0.065)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.2)" },
  stateDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: Theme.colors.goldLight },
  stateText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#fff", fontSize: 33, fontWeight: "900", marginTop: 11 },
  subtitle: { color: "#C8C8C8", marginTop: 7, fontSize: 13, lineHeight: 19 },
  fieldLabel: { color: "#999", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 7, marginLeft: 2 },
  inputWrap: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingHorizontal: 11, marginBottom: 14 },
  inputIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.06)" },
  input: { flex: 1, color: "#fff", fontSize: 14, paddingVertical: 14 },
  eyeButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  button: { minHeight: 54, backgroundColor: Theme.colors.goldLight, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 3, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.22, shadowRadius: 10, elevation: 6 },
  buttonDisabled: { opacity: 0.48, shadowOpacity: 0 },
  buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1, fontSize: 12 },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 13 },
  securityText: { color: "#9FA99B", fontSize: 8.5, fontWeight: "700" },
  linkButton: { flexDirection: "row", justifyContent: "center", marginTop: 20, paddingVertical: 4 },
  linkMuted: { color: "#B8B8B8", fontSize: 12, fontWeight: "600" },
  link: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" },
});