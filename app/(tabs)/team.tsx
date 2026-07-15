import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Alert, ImageBackground, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";
import { getMatches, Match, subscribeToMatches } from "../../services/matchStore";
import {
  addRosterPlayer,
  deleteRosterPlayer,
  getRoster,
  linkCurrentAccountToPlayer,
  RosterPlayer,
  subscribeToRoster,
  unlinkPlayerAccount,
} from "../../services/rosterStore";

const marbleSource = require("../../assets/images/background-marble.jpg");

export default function TeamScreen() {
  const [members, setMembers] = useState<RosterPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getRoster().then((items) => active && setMembers(items));
    void getMatches().then((items) => active && setMatches(items));
    const unsubscribeRoster = subscribeToRoster(setMembers);
    const unsubscribeMatches = subscribeToMatches(setMatches);
    return () => { active = false; unsubscribeRoster(); unsubscribeMatches(); };
  }, []);

  async function addPlayer() {
    if (saving) return;
    setSaving(true);
    try {
      await addRosterPlayer({ nickname });
      setNickname("");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Équipe", error instanceof Error ? error.message : "Ajout impossible.");
    } finally { setSaving(false); }
  }

  function confirmDelete(member: RosterPlayer) {
    Alert.alert("Retirer le joueur", `Retirer ${member.nickname} de l'équipe ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => void deleteRosterPlayer(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Suppression impossible.")) },
    ]);
  }

  function openMemberActions(member: RosterPlayer) {
    const actions = member.accountUid
      ? [
          { text: "Dissocier le compte", onPress: () => void unlinkPlayerAccount(member.id).then(() => Alert.alert("Compte dissocié", `${member.nickname} n'est plus lié à un compte.`)).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Dissociation impossible.")) },
          { text: "Retirer de l'équipe", style: "destructive" as const, onPress: () => confirmDelete(member) },
          { text: "Fermer", style: "cancel" as const },
        ]
      : [
          { text: "Associer mon compte", onPress: () => void linkCurrentAccountToPlayer(member.id).then(() => Alert.alert("Compte associé", `Tes réponses utiliseront maintenant le pseudo ${member.nickname}.`)).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Association impossible.")) },
          { text: "Retirer de l'équipe", style: "destructive" as const, onPress: () => confirmDelete(member) },
          { text: "Fermer", style: "cancel" as const },
        ];
    Alert.alert(member.nickname, member.accountEmail ? `Compte lié : ${member.accountEmail}` : "Aucun compte associé", actions);
  }

  function getAttendance(member: RosterPlayer) {
    const nickname = member.nickname.trim().toLowerCase();
    const responses = matches
      .filter((match) => match.status !== "Annulé")
      .flatMap((match) => match.responses)
      .filter((response) => (member.accountUid ? response.uid === member.accountUid : response.player.trim().toLowerCase() === nickname) && response.status !== "En attente");
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
              <Text style={styles.subtitle}>Associe chaque compte à son pseudo pour fiabiliser les réponses.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}><Ionicons name="person-add" size={22} color="#111" /></TouchableOpacity>
          </View>

          <View style={styles.summaryCard}><Text style={styles.summaryValue}>{members.length}</Text><Text style={styles.summaryLabel}>MEMBRES</Text></View>

          {members.map((member) => {
            const attendance = getAttendance(member);
            return (
              <Pressable key={member.id} style={styles.card} onPress={() => openMemberActions(member)} onLongPress={() => confirmDelete(member)}>
                <View style={styles.memberHeader}>
                  <Text style={styles.name}>{member.nickname}</Text>
                  <View style={[styles.linkBadge, member.accountUid && styles.linkBadgeActive]}>
                    <Ionicons name={member.accountUid ? "link" : "unlink"} size={13} color={member.accountUid ? "#84D956" : "#A8A8A8"} />
                    <Text style={[styles.linkText, member.accountUid && styles.linkTextActive]}>{member.accountUid ? "Compte lié" : "À associer"}</Text>
                  </View>
                </View>
                {member.accountEmail ? <Text style={styles.accountEmail}>{member.accountEmail}</Text> : null}
                <Text style={styles.presenceLabel}>PRÉSENCE</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${attendance.rate}%` }]} /></View>
                <Text style={styles.presenceText}>{attendance.total ? `${attendance.present}/${attendance.total} réponses positives · ${attendance.rate}%` : "Aucune réponse enregistrée"}</Text>
              </Pressable>
            );
          })}

          {!members.length && <Text style={styles.empty}>Aucun joueur dans l'équipe.</Text>}
          <Text style={styles.hint}>Appuie sur un joueur pour gérer son association de compte.</Text>
        </ScrollView>
      </ImageBackground>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Text style={styles.modalTitle}>Ajouter un joueur</Text><TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={25} color="#fff" /></TouchableOpacity></View>
          <TextInput value={nickname} onChangeText={setNickname} placeholder="Pseudo" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" />
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={addPlayer} disabled={saving}><Text style={styles.saveText}>{saving ? "Enregistrement…" : "Ajouter à l'équipe"}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.28 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)" },
  content: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 150 }, headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headingText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 },
  addButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginLeft: 12 },
  summaryCard: { alignItems: "center", borderRadius: 24, padding: 16, marginBottom: 14, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, summaryValue: { color: "#fff", fontSize: 28, fontWeight: "900" }, summaryLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "800", marginTop: 4 },
  card: { borderRadius: 24, padding: 17, marginBottom: 12, backgroundColor: "rgba(8,8,8,0.88)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" }, memberHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, name: { flex: 1, color: "#fff", fontWeight: "900", fontSize: 18 }, linkBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, minHeight: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)" }, linkBadgeActive: { backgroundColor: "rgba(132,217,86,0.1)" }, linkText: { color: "#A8A8A8", fontSize: 10, fontWeight: "800" }, linkTextActive: { color: "#84D956" }, accountEmail: { color: "#C8C8C8", fontSize: 11, marginTop: 5 }, presenceLabel: { color: Theme.colors.goldLight, marginTop: 13, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)", marginTop: 7, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 4, backgroundColor: Theme.colors.goldLight }, presenceText: { color: "#C8C8C8", marginTop: 7, fontSize: 11, fontWeight: "700" },
  empty: { color: "#C8C8C8", textAlign: "center", paddingVertical: 30 }, hint: { color: "#8E8E8E", fontSize: 10, textAlign: "center", marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.76)" }, modalCard: { backgroundColor: "#111", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900" }, input: { height: 50, borderRadius: 16, paddingHorizontal: 15, color: "#fff", backgroundColor: "#1A1A1A", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.12)" }, saveButton: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginTop: 16 }, disabled: { opacity: 0.55 }, saveText: { color: "#111", fontWeight: "900", fontSize: 15 },
});