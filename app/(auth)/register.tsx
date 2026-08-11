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

  const passwordLongEnough = password.length >= 6;
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const complete = Boolean(nickname.trim() && email.trim() && passwordLongEnough && passwordsMatch);

  async function handleRegister() {
    if (!nickname.trim() || !email.trim() || !password || !confirmPassword) return Alert.alert("Champs requis", "Complète le pseudo, l'adresse e-mail et les mots de passe.");
    if (!passwordLongEnough) return Alert.alert("Mot de passe trop court", "Utilise au moins 6 caractères.");
    if (!passwordsMatch) return Alert.alert("Mot de passe", "Les mots de passe ne correspondent pas.");

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
        <View style={styles.goldGlow} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <View style={styles.logoShell}><Image source={logoSource} style={styles.logo} resizeMode="contain" /></View>
              <View><Text style={styles.brandName}>DYNO</Text><Text style={styles.brandSub}>REJOINS L’ÉQUIPE</Text></View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.statePill}><Ionicons name="person-add-outline" size={13} color={Theme.colors.goldLight} /><Text style={styles.stateText}>NOUVEAU MEMBRE</Text></View>
                <Text style={styles.title}>Créer mon accès</Text>
                <Text style={styles.subtitle}>Ton compte sera directement associé à ton pseudo dans le roster DYNO.</Text>
              </View>

              <Field icon="game-controller-outline" label="PSEUDO JOUEUR" placeholder="Ton pseudo" value={nickname} onChangeText={setNickname} />
              <Field icon="mail-outline" label="ADRESSE E-MAIL" placeholder="nom@exemple.fr" value={email} onChangeText={setEmail} keyboardType="email-address" />

              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}><Ionicons name="lock-closed-outline" size={18} color={Theme.colors.goldLight} /></View>
                <TextInput placeholder="6 caractères minimum" placeholderTextColor="#777" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} style={styles.input} />
                <TouchableOpacity accessibilityRole="button" style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)}><Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color="#BEBEBE" /></TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>CONFIRMATION</Text>
              <View style={[styles.inputWrap, confirmPassword && (passwordsMatch ? styles.inputValid : styles.inputError)]}>
                <View style={styles.inputIcon}><Ionicons name="shield-checkmark-outline" size={18} color={passwordsMatch ? "#83DD57" : Theme.colors.goldLight} /></View>
                <TextInput placeholder="Confirme ton mot de passe" placeholderTextColor="#777" secureTextEntry={!showPassword} value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} returnKeyType="done" onSubmitEditing={() => void handleRegister()} />
              </View>

              <View style={styles.requirements}>
                <Requirement ok={passwordLongEnough} label="6 caractères minimum" />
                <Requirement ok={passwordsMatch} label="Mots de passe identiques" />
              </View>

              <TouchableOpacity activeOpacity={0.86} disabled={loading || !complete} onPress={() => void handleRegister()} style={[styles.button, (loading || !complete) && styles.buttonDisabled]}>
                {loading ? <ActivityIndicator color="#080808" /> : <><Text style={styles.buttonText}>CRÉER LE COMPTE</Text><Ionicons name="arrow-forward" size={18} color="#080808" /></>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} style={styles.linkButton}><Text style={styles.linkMuted}>Déjà membre ? </Text><Text style={styles.link}>Se connecter</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Field({ icon, label, placeholder, value, onChangeText, keyboardType = "default" }: { icon: keyof typeof Ionicons.glyphMap; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: "default" | "email-address" }) {
  return <><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputWrap}><View style={styles.inputIcon}><Ionicons name={icon} size={18} color={Theme.colors.goldLight} /></View><TextInput autoCapitalize="none" autoCorrect={false} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor="#777" value={value} onChangeText={onChangeText} style={styles.input} /></View></>;
}

function Requirement({ ok, label }: { ok: boolean; label: string }) {
  return <View style={styles.requirement}><Ionicons name={ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={ok ? "#83DD57" : "#777"} /><Text style={[styles.requirementText, ok && styles.requirementTextOk]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, flex: { flex: 1 }, background: { flex: 1 }, backgroundImage: { opacity: 0.34 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.74)" },
  goldGlow: { position: "absolute", top: -120, right: -130, width: 330, height: 330, borderRadius: 170, backgroundColor: "rgba(246,215,106,0.045)" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 18, paddingHorizontal: 3 }, logoShell: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.24)" }, logo: { width: 43, height: 43, borderRadius: 13 }, brandName: { color: "#fff", fontSize: 24, fontWeight: "900", letterSpacing: 3.2 }, brandSub: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  card: { backgroundColor: "rgba(7,7,7,0.9)", borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.18)", padding: 19, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, elevation: 8 }, cardHeader: { marginBottom: 18 }, statePill: { alignSelf: "flex-start", minHeight: 25, paddingHorizontal: 9, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(246,215,106,0.065)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.2)" }, stateText: { color: Theme.colors.goldLight, fontSize: 8, fontWeight: "900", letterSpacing: 1 }, title: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 10 }, subtitle: { color: "#C8C8C8", marginTop: 6, fontSize: 12.5, lineHeight: 18 },
  fieldLabel: { color: "#999", fontSize: 8, fontWeight: "900", letterSpacing: 1, marginBottom: 6, marginLeft: 2 }, inputWrap: { minHeight: 51, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)", borderRadius: 15, paddingHorizontal: 10, marginBottom: 12 }, inputValid: { borderColor: "rgba(131,221,87,0.38)", backgroundColor: "rgba(131,221,87,0.035)" }, inputError: { borderColor: "rgba(255,119,119,0.34)" }, inputIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.06)" }, input: { flex: 1, color: "#fff", fontSize: 13.5, paddingVertical: 13 }, eyeButton: { width: 33, height: 33, alignItems: "center", justifyContent: "center" },
  requirements: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 13, marginTop: -1 }, requirement: { flexDirection: "row", alignItems: "center", gap: 4 }, requirementText: { color: "#7F7F7F", fontSize: 8.5, fontWeight: "800" }, requirementTextOk: { color: "#91D975" },
  button: { minHeight: 53, backgroundColor: Theme.colors.goldLight, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 2, shadowColor: Theme.colors.goldLight, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 }, buttonDisabled: { opacity: 0.48, shadowOpacity: 0 }, buttonText: { color: "#080808", fontWeight: "900", letterSpacing: 1, fontSize: 12 }, linkButton: { flexDirection: "row", justifyContent: "center", marginTop: 18, paddingVertical: 4 }, linkMuted: { color: "#B8B8B8", fontSize: 12, fontWeight: "600" }, link: { color: Theme.colors.goldLight, fontSize: 12, fontWeight: "900" },
});