import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getStoredSession } from "../../services/authService";
import { getMatches, Match, subscribeToMatches } from "../../services/matchStore";
import {
  addRosterPlayer,
  deleteRosterPlayer,
  ensureCurrentAccountRosterPlayer,
  getRoster,
  linkCurrentAccountToPlayer,
  RosterPlayer,
  subscribeToRoster,
  unlinkPlayerAccount,
} from "../../services/rosterStore";
import { updateCurrentRosterNickname } from "../../services/rosterProfile";

const marbleSource = require("../../assets/images/background-marble.jpg");

type ModalMode = "add" | "edit";

export default function TeamScreen() {
  const [members, setMembers] = useState<RosterPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getRoster().then((items) => active && setMembers(items));
    void getMatches().then((items) => active && setMatches(items));
    void getStoredSession().then(async (session) => {
      if (!session) return;
      setCurrentUid(session.localId);
      const provisionalNickname = session.email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Joueur DYNO";
      const player = await ensureCurrentAccountRosterPlayer(provisionalNickname).catch(() => null);
      if (player && active) setMembers((items) => items.some((item) => item.id === player.id) ? items.map((item) => item.id === player.id ? player : item) : [...items, player]);
    });
    const unsubscribeRoster = subscribeToRoster(setMembers);
    const unsubscribeMatches = subscribeToMatches(setMatches);
    return () => { active = false; unsubscribeRoster(); unsubscribeMatches(); };
  }, []);

  function openAddModal() {
    setModalMode("add");
    setNickname("");
    setModalVisible(true);
  }

  function openEditModal(member: RosterPlayer) {
    setModalMode("edit");
    setNickname(member.nickname);
    setModalVisible(true);
  }

  async function savePlayer() {
    if (saving) return;
    setSaving(true);
    try {
      if (modalMode === "edit") {
        const result = await updateCurrentRosterNickname(nickname);
        setMembers((items) => items.map((item) => item.id === result.player.id ? result.player : item));
        Alert.alert("Pseudo modifié", result.cloudSynced ? "Le nouveau pseudo est synchronisé." : "Le pseudo est enregistré sur ce téléphone et sera synchronisé plus tard.");
      } else {
        const player = await addRosterPlayer({ nickname });
        setMembers((items) => items.some((item) => item.id === player.id) ? items : [...items, player]);
      }
      setNickname("");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Équipe", error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally { setSaving(false); }
  }

  function confirmDelete(member: RosterPlayer) {
    Alert.alert("Retirer le joueur", `Retirer ${member.nickname} de l'équipe ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => void deleteRosterPlayer(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Suppression impossible.")) },
    ]);
  }

  function openMemberActions(member: RosterPlayer) {
    const isCurrentUser = member.accountUid === currentUid;
    const actions = [
      ...(isCurrentUser ? [{ text: "Modifier mon pseudo", onPress: () => openEditModal(member) }] : []),
      ...(member.accountUid
        ? [{ text: "Dissocier le compte", onPress: () => void unlinkPlayerAccount(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Dissociation impossible.")) }]
        : [{ text: "Associer mon compte", onPress: () => void linkCurrentAccountToPlayer(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Association impossible.")) }]),
      { text: "Retirer de l'équipe", style: "destructive" as const, onPress: () => confirmDelete(member) },
      { text: "Fermer", style: "cancel" as const },
    ];
    Alert.alert(member.nickname, member.accountUid ? "Compte lié" : "Aucun compte associé", actions);
  }

  function getAttendance(member: RosterPlayer) {
    const nicknameKey = member.nickname.trim().toLowerCase();
    const responses = matches
      .filter((match) => match.status !== "Annulé")
      .flatMap((match) => match.responses)
      .filter((response) => (member.accountUid ? response.uid === member.accountUid : response.player.trim().toLowerCase() === nicknameKey) && response.status !== "En attente");
    const present = responses.filter((response) => response.status === "Disponible").length;
    const total = responses.length;
    return { present, total, rate: total ? Math.round((present / total) * 100) : 0 };
  }

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
              <Text style={styles.title}>Équipe</Text>
              <Text style={styles.subtitle}>Gère les pseudos et les statistiques de présence.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal} activeOpacity={0.85}><Ionicons name="person-add" size={22} color="#111" /></TouchableOpacity>
          </View>

          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{members.length}</Text><Text style={styles.summaryLabel}>MEMBRES</Text></View>

          {members.map((member) => {
            const attendance = getAttendance(member);
            const isCurrentUser = member.accountUid === currentUid;
            return (
              <Pressable key={member.id} style={[styles.card, isCurrentUser && styles.currentCard]} onPress={() => openMemberActions(member)}>
                <View style={styles.memberHeader}>
                  <Text style={styles.name}>{member.nickname}</Text>
                  <View style={[styles.linkBadge, member.accountUid && styles.linkBadgeActive]}>
                    <Ionicons name={member.accountUid ? "link" : "unlink"} size={13} color={member.accountUid ? "#84D956" : "#A8A8A8"} />
                    <Text style={[styles.linkText, member.accountUid && styles.linkTextActive]}>{isCurrentUser ? "Mon compte" : member.accountUid ? "Compte lié" : "À associer"}</Text>
                  </View>
                </View>
                <Text style={styles.presenceLabel}>PRÉSENCE</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${attendance.rate}%` }]} /></View>
                <Text style={styles.presenceText}>{attendance.total ? `${attendance.present}/${attendance.total} réponses positives · ${attendance.rate}%` : "Aucune réponse enregistrée"}</Text>
                {isCurrentUser ? <Text style={styles.editHint}>Appuie pour modifier ton pseudo</Text> : null}
              </Pressable>
            );
          })}

          {!members.length && <Text style={styles.empty}>Aucun joueur dans l'équipe.</Text>}
          <Text style={styles.hint}>Appuie sur un joueur pour gérer son compte.</Text>
        </ScrollView>
      </ImageBackground>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>{modalMode === "edit" ? "Modifier mon pseudo" : "Ajouter un joueur"}</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={25} color="#fff" /></TouchableOpacity></View>
          <TextInput value={nickname} onChangeText={setNickname} placeholder="Pseudo" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" maxLength={24} />
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={savePlayer} disabled={saving}><Text style={styles.saveText}>{saving ? "Enregistrement…" : modalMode === "edit" ? "Enregistrer le pseudo" : "Ajouter à l'équipe"}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.28 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 150 }, headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headingText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 }, addButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginLeft: 12 },
  summaryCard: { alignItems: "center", borderRadius: 24, padding: 16, marginBottom: 14, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, summaryValue: { color: "#fff", fontSize: 28, fontWeight: "900" }, summaryLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "800", marginTop: 4 },
  card: { borderRadius: 24, padding: 17, marginBottom: 12, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, currentCard: { borderColor: "rgba(132,217,86,0.35)" }, memberHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, name: { flex: 1, color: "#fff", fontWeight: "900", fontSize: 18 }, linkBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, minHeight: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)" }, linkBadgeActive: { backgroundColor: "rgba(132,217,86,0.1)" }, linkText: { color: "#A8A8A8", fontSize: 10, fontWeight: "800" }, linkTextActive: { color: "#84D956" }, presenceLabel: { color: Theme.colors.goldLight, marginTop: 13, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", marginTop: 7, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 4, backgroundColor: Theme.colors.goldLight }, presenceText: { color: "#C8C8C8", marginTop: 7, fontSize: 11, fontWeight: "700" }, editHint: { color: "#84D956", fontSize: 10, marginTop: 10, fontWeight: "800" },
  empty: { color: "#C8C8C8", textAlign: "center", paddingVertical: 30 }, hint: { color: "#8E8E8E", fontSize: 10, textAlign: "center", marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.76)" }, modalCard: { backgroundColor: "#111", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900" }, input: { height: 50, borderRadius: 16, paddingHorizontal: 15, color: "#fff", backgroundColor: "#1A1A1A", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, saveButton: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginTop: 16 }, disabled: { opacity: 0.55 }, saveText: { color: "#111", fontWeight: "900", fontSize: 15 },
});