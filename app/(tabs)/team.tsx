import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";
import {
  addRosterPlayer,
  deleteRosterPlayer,
  getRoster,
  PlayerRole,
  PlayerStatus,
  RosterPlayer,
  subscribeToRoster,
} from "../../services/rosterStore";

const marbleSource = require("../../assets/images/background-marble.jpg");
const roles: PlayerRole[] = ["Coach", "Manager", "Capitaine", "Joueur", "Remplaçant"];
const statuses: PlayerStatus[] = ["Disponible", "Absent", "En vacances"];

export default function TeamScreen() {
  const [members, setMembers] = useState<RosterPlayer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [rank, setRank] = useState("");
  const [role, setRole] = useState<PlayerRole>("Joueur");
  const [status, setStatus] = useState<PlayerStatus>("Disponible");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getRoster().then((items) => active && setMembers(items));
    const unsubscribe = subscribeToRoster(setMembers);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function addPlayer() {
    if (saving) return;
    setSaving(true);
    try {
      await addRosterPlayer({ nickname, rank: rank.trim() || undefined, role, status });
      setNickname("");
      setRank("");
      setRole("Joueur");
      setStatus("Disponible");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Équipe", error instanceof Error ? error.message : "Ajout impossible.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(member: RosterPlayer) {
    Alert.alert("Retirer le joueur", `Retirer ${member.nickname} de l'équipe ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: () => {
          void deleteRosterPlayer(member.id).catch((error) => {
            Alert.alert("Équipe", error instanceof Error ? error.message : "Suppression impossible.");
          });
        },
      },
    ]);
  }

  const available = members.filter((member) => member.status === "Disponible").length;

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
              <Text style={styles.title}>Équipe</Text>
              <Text style={styles.subtitle}>Roster partagé, rôles et disponibilités.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
              <Ionicons name="person-add" size={22} color="#111" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{members.length}</Text><Text style={styles.summaryLabel}>Membres</Text></View>
            <View style={styles.separator} />
            <View style={styles.summaryItem}><Text style={styles.summaryValue}>{available}</Text><Text style={styles.summaryLabel}>Disponibles</Text></View>
          </View>

          {members.map((member) => {
            const isAvailable = member.status === "Disponible";
            return (
              <Pressable key={member.id} style={styles.card} onLongPress={() => confirmDelete(member)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.nickname.slice(0, 1).toUpperCase()}</Text>
                  <View style={[styles.statusDot, !isAvailable && styles.offlineDot]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.name}>{member.nickname}</Text>
                  <Text style={styles.role}>{member.role}{member.rank ? ` · ${member.rank}` : ""}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Ionicons name={isAvailable ? "checkmark-circle" : "moon-outline"} size={15} color={isAvailable ? "#7DD853" : "#B9B9B9"} />
                  <Text style={styles.statusText}>{member.status}</Text>
                </View>
              </Pressable>
            );
          })}

          {!members.length && <Text style={styles.empty}>Aucun joueur dans le roster.</Text>}
          <Text style={styles.hint}>Maintiens un joueur appuyé pour le retirer.</Text>
        </ScrollView>
      </ImageBackground>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un joueur</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={25} color="#fff" /></TouchableOpacity>
            </View>

            <TextInput value={nickname} onChangeText={setNickname} placeholder="Pseudo EVA" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" />
            <TextInput value={rank} onChangeText={setRank} placeholder="Niveau / classement (optionnel)" placeholderTextColor="#777" style={styles.input} />

            <Text style={styles.fieldLabel}>Rôle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {roles.map((item) => <Chip key={item} label={item} active={role === item} onPress={() => setRole(item)} />)}
            </ScrollView>

            <Text style={styles.fieldLabel}>Statut</Text>
            <View style={styles.chipsWrap}>{statuses.map((item) => <Chip key={item} label={item} active={status === item} onPress={() => setStatus(item)} />)}</View>

            <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={addPlayer} disabled={saving}>
              <Text style={styles.saveText}>{saving ? "Enregistrement…" : "Ajouter au roster"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" }, background: { flex: 1 }, backgroundImage: { opacity: 0.6 }, overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.58)" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 130 }, headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headingText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 }, title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#D0D0D0", marginTop: 7, marginBottom: 22, lineHeight: 20 },
  addButton: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginLeft: 12 },
  summaryCard: { flexDirection: "row", alignItems: "center", borderRadius: 24, padding: 18, marginBottom: 16, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" }, summaryItem: { flex: 1, alignItems: "center" }, summaryValue: { color: "#fff", fontSize: 28, fontWeight: "900" }, summaryLabel: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "800", marginTop: 4 }, separator: { width: 1, height: 42, backgroundColor: "rgba(255,255,255,0.12)" },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 22, padding: 15, marginBottom: 13, backgroundColor: "rgba(8,8,8,0.76)", borderWidth: 1, borderColor: "rgba(224,184,67,0.34)" }, avatar: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#151515", borderWidth: 1, borderColor: Theme.colors.goldLight }, avatarText: { color: "#fff", fontSize: 22, fontWeight: "900" }, statusDot: { position: "absolute", right: 1, bottom: 2, width: 13, height: 13, borderRadius: 7, backgroundColor: "#45D15A", borderWidth: 2, borderColor: "#0A0A0A" }, offlineDot: { backgroundColor: "#777" }, memberInfo: { flex: 1, marginLeft: 13 }, name: { color: "#fff", fontWeight: "900", fontSize: 17 }, role: { color: Theme.colors.goldLight, marginTop: 4, fontSize: 12, fontWeight: "700" }, statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" }, statusText: { color: "#D4D4D4", fontSize: 10, fontWeight: "700" }, empty: { color: "#bbb", textAlign: "center", paddingVertical: 30 }, hint: { color: "#777", fontSize: 10, textAlign: "center", marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }, modalCard: { backgroundColor: "#111", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 22, paddingBottom: 34, borderWidth: 1, borderColor: "rgba(224,184,67,0.4)" }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900" }, input: { height: 50, borderRadius: 16, paddingHorizontal: 15, marginBottom: 12, color: "#fff", backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "rgba(224,184,67,0.3)" }, fieldLabel: { color: Theme.colors.goldLight, fontWeight: "900", fontSize: 12, marginTop: 4, marginBottom: 9 }, chips: { gap: 8, paddingBottom: 8 }, chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: "#1B1B1B", borderWidth: 1, borderColor: "#333" }, chipActive: { backgroundColor: Theme.colors.goldLight, borderColor: Theme.colors.goldLight }, chipText: { color: "#ddd", fontSize: 11, fontWeight: "800" }, chipTextActive: { color: "#111" }, saveButton: { height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginTop: 22 }, disabled: { opacity: 0.55 }, saveText: { color: "#111", fontWeight: "900", fontSize: 15 },
});