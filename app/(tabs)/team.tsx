import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Theme } from "../../constants/theme";
import { getPlayersScrimAccess, setPlayerScrimAccess } from "../../services/accessAdmin";
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
const OWNER_EMAIL = "thibaut.llorens@hotmail.com";

type ModalMode = "add" | "edit";
type MemberRole = "Administrateur" | "Créateur de scrims" | "Joueur";

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "DY";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState<RosterPlayer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [scrimAccess, setScrimAccess] = useState<Record<string, boolean>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<RosterPlayer | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [nickname, setNickname] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);

  useEffect(() => {
    let active = true;
    void getRoster().then((items) => active && setMembers(items));
    void getMatches().then((items) => active && setMatches(items));
    void getStoredSession().then(async (session) => {
      if (!session) return;
      setCurrentUid(session.localId);
      const owner = session.email.toLowerCase() === OWNER_EMAIL;
      setIsOwner(owner);
      const provisionalNickname = session.email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Joueur DYNO";
      const player = await ensureCurrentAccountRosterPlayer(provisionalNickname).catch(() => null);
      if (player && active) {
        setMembers((items) => items.some((item) => item.id === player.id)
          ? items.map((item) => item.id === player.id ? player : item)
          : [...items, player]);
      }
    });
    const unsubscribeRoster = subscribeToRoster(setMembers);
    const unsubscribeMatches = subscribeToMatches(setMatches);
    return () => { active = false; unsubscribeRoster(); unsubscribeMatches(); };
  }, []);

  useEffect(() => {
    if (!isOwner || !members.length) return;
    void getPlayersScrimAccess(members).then(setScrimAccess).catch(() => null);
  }, [isOwner, members]);

  function openAddModal() { setModalMode("add"); setNickname(""); setModalVisible(true); }
  function openEditModal(member: RosterPlayer) { setModalMode("edit"); setNickname(member.nickname); setModalVisible(true); }

  function getRole(member: RosterPlayer): MemberRole {
    if (member.accountEmail?.toLowerCase() === OWNER_EMAIL) return "Administrateur";
    if (member.accountUid && scrimAccess[member.accountUid]) return "Créateur de scrims";
    return "Joueur";
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    if (!query) return members;
    return members.filter((member) => member.nickname.toLocaleLowerCase("fr").includes(query));
  }, [members, search]);

  const linkedCount = useMemo(() => members.filter((member) => Boolean(member.accountUid)).length, [members]);
  const creatorCount = useMemo(() => members.filter((member) => getRole(member) === "Créateur de scrims").length, [members, scrimAccess]);

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

  function openPermissions(member: RosterPlayer) { setSelectedMember(member); setPermissionModalVisible(true); }

  async function updatePermission(enabled: boolean) {
    if (!selectedMember || savingPermission) return;
    setSavingPermission(true);
    try {
      await setPlayerScrimAccess(selectedMember, enabled);
      if (selectedMember.accountUid) setScrimAccess((current) => ({ ...current, [selectedMember.accountUid!]: enabled }));
      setPermissionModalVisible(false);
      Alert.alert("Droits mis à jour", enabled ? `${selectedMember.nickname} peut maintenant créer des scrims.` : `${selectedMember.nickname} est maintenant joueur.`);
    } catch (error) {
      Alert.alert("Droits", error instanceof Error ? error.message : "Modification impossible.");
    } finally { setSavingPermission(false); }
  }

  function openMemberActions(member: RosterPlayer) {
    const isCurrentUser = member.accountUid === currentUid;
    const actions = [
      ...(isCurrentUser ? [{ text: "Modifier mon pseudo", onPress: () => openEditModal(member) }] : []),
      ...(isOwner && member.accountUid && getRole(member) !== "Administrateur" ? [{ text: "Gérer les permissions", onPress: () => openPermissions(member) }] : []),
      ...(isOwner ? (member.accountUid
        ? [{ text: "Dissocier le compte", onPress: () => void unlinkPlayerAccount(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Dissociation impossible.")) }]
        : [{ text: "Associer mon compte", onPress: () => void linkCurrentAccountToPlayer(member.id).catch((error) => Alert.alert("Équipe", error instanceof Error ? error.message : "Association impossible.")) }]) : []),
      ...(isOwner && getRole(member) !== "Administrateur" ? [{ text: "Retirer de l'équipe", style: "destructive" as const, onPress: () => confirmDelete(member) }] : []),
      { text: "Fermer", style: "cancel" as const },
    ];
    Alert.alert(member.nickname, `${getRole(member)} · ${member.accountUid ? "Compte lié" : "Aucun compte associé"}`, actions);
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
    <View style={styles.container}>
      <ImageBackground source={marbleSource} style={styles.background} imageStyle={styles.backgroundImage}>
        <View style={styles.overlay} />
        <View style={styles.whiteGlow} />
        <View style={styles.goldVein} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 18) + 12, paddingBottom: Math.max(insets.bottom, 10) + 118 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.kicker}>DYNO ESPORT MANAGER</Text>
              <Text style={styles.title}>Équipe</Text>
              <Text style={styles.subtitle}>{isOwner ? "Pilote les membres, les comptes et les droits depuis un seul écran." : "Retrouve l'équipe et tes statistiques de présence."}</Text>
            </View>
            {isOwner ? (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ajouter un joueur" style={styles.addButton} onPress={openAddModal} activeOpacity={0.85}>
                <Ionicons name="person-add" size={21} color="#111" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}><Ionicons name="people" size={18} color={Theme.colors.goldLight} /></View>
              <Text style={styles.summaryValue}>{members.length}</Text>
              <Text style={styles.summaryLabel}>Membres</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}><Ionicons name="link" size={18} color="#84D956" /></View>
              <Text style={styles.summaryValue}>{linkedCount}</Text>
              <Text style={styles.summaryLabel}>Comptes liés</Text>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}><Ionicons name="flash" size={18} color="#7CCBFF" /></View>
              <Text style={styles.summaryValue}>{creatorCount}</Text>
              <Text style={styles.summaryLabel}>Créateurs</Text>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#BDBDBD" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un joueur"
              placeholderTextColor="#858585"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search ? (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Effacer la recherche" onPress={() => setSearch("")} style={styles.clearSearch}>
                <Ionicons name="close-circle" size={18} color="#AFAFAF" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ROSTER</Text>
            <Text style={styles.sectionCount}>{filteredMembers.length} affiché{filteredMembers.length > 1 ? "s" : ""}</Text>
          </View>

          {filteredMembers.map((member) => {
            const attendance = getAttendance(member);
            const isCurrentUser = member.accountUid === currentUid;
            const role = getRole(member);
            const roleIcon = role === "Administrateur" ? "shield-checkmark" : role === "Créateur de scrims" ? "flash" : "person";
            const roleColor = role === "Administrateur" ? "#FFD86A" : role === "Créateur de scrims" ? "#7CCBFF" : "#C7C7C7";
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${member.nickname}, ${role}`}
                key={member.id}
                style={({ pressed }) => [styles.card, isCurrentUser && styles.currentCard, pressed && styles.cardPressed]}
                onPress={() => openMemberActions(member)}
              >
                <View style={styles.cardVein} />
                <View style={styles.memberTop}>
                  <View style={[styles.avatar, isCurrentUser && styles.avatarCurrent]}>
                    <Text style={styles.avatarText}>{initials(member.nickname)}</Text>
                    {member.accountUid ? <View style={styles.linkDot} /> : null}
                  </View>
                  <View style={styles.memberIdentity}>
                    <View style={styles.nameRow}>
                      <Text numberOfLines={1} style={styles.name}>{member.nickname}</Text>
                      {isCurrentUser ? <View style={styles.meBadge}><Text style={styles.meText}>MOI</Text></View> : null}
                    </View>
                    <View style={styles.memberMetaRow}>
                      <View style={[styles.roleBadge, role === "Administrateur" ? styles.adminRole : role === "Créateur de scrims" ? styles.creatorRole : styles.playerRole]}>
                        <Ionicons name={roleIcon} size={12} color={roleColor} />
                        <Text style={[styles.roleText, { color: roleColor }]}>{role}</Text>
                      </View>
                      <View style={[styles.accountPill, member.accountUid && styles.accountPillLinked]}>
                        <Ionicons name={member.accountUid ? "checkmark-circle" : "unlink"} size={12} color={member.accountUid ? "#84D956" : "#A8A8A8"} />
                        <Text style={[styles.accountPillText, member.accountUid && styles.accountPillTextLinked]}>{member.accountUid ? "Compte lié" : "À associer"}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8C8C8C" />
                </View>

                <View style={styles.presenceHeader}>
                  <View>
                    <Text style={styles.presenceLabel}>PRÉSENCE</Text>
                    <Text style={styles.presenceText}>{attendance.total ? `${attendance.present}/${attendance.total} disponibilités positives` : "Aucune réponse enregistrée"}</Text>
                  </View>
                  <Text style={[styles.rate, attendance.total ? null : styles.rateMuted]}>{attendance.total ? `${attendance.rate}%` : "—"}</Text>
                </View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${attendance.rate}%` }]} /></View>

                <View style={styles.actionHintRow}>
                  <Ionicons name={isCurrentUser ? "create-outline" : isOwner ? "options-outline" : "information-circle-outline"} size={14} color={isCurrentUser ? "#84D956" : Theme.colors.goldLight} />
                  <Text style={[styles.actionHint, isCurrentUser && styles.actionHintCurrent]}>
                    {isCurrentUser ? "Modifier mon profil" : isOwner ? "Gérer ce membre" : "Voir les informations"}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          {!members.length ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Ionicons name="people-outline" size={28} color={Theme.colors.goldLight} /></View>
              <Text style={styles.emptyTitle}>Aucun joueur</Text>
              <Text style={styles.emptyText}>Ajoute les membres de DYNO pour commencer à suivre les rôles et les disponibilités.</Text>
            </View>
          ) : null}

          {members.length > 0 && !filteredMembers.length ? (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={26} color="#AFAFAF" />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptyText}>Aucun pseudo ne correspond à « {search.trim()} ».</Text>
            </View>
          ) : null}

          <Text style={styles.hint}>Les rôles et comptes liés sont synchronisés avec les services DYNO.</Text>
        </ScrollView>
      </ImageBackground>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) + 22 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View><Text style={styles.modalEyebrow}>ÉQUIPE DYNO</Text><Text style={styles.modalTitle}>{modalMode === "edit" ? "Modifier mon pseudo" : "Ajouter un joueur"}</Text></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fermer" style={styles.closeButton} onPress={() => setModalVisible(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
          </View>
          <TextInput value={nickname} onChangeText={setNickname} placeholder="Pseudo" placeholderTextColor="#777" style={styles.input} autoCapitalize="none" maxLength={24} />
          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={savePlayer} disabled={saving}><Text style={styles.saveText}>{saving ? "Enregistrement…" : modalMode === "edit" ? "Enregistrer le pseudo" : "Ajouter à l'équipe"}</Text></TouchableOpacity>
        </View></View>
      </Modal>

      <Modal visible={permissionModalVisible} transparent animationType="slide" onRequestClose={() => setPermissionModalVisible(false)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) + 22 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View><Text style={styles.modalEyebrow}>PERMISSIONS</Text><Text style={styles.modalTitle}>Gérer les droits</Text><Text style={styles.permissionName}>{selectedMember?.nickname}</Text></View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fermer" style={styles.closeButton} onPress={() => setPermissionModalVisible(false)}><Ionicons name="close" size={22} color="#fff" /></TouchableOpacity>
          </View>
          <Text style={styles.permissionIntro}>Choisis le niveau d'accès. Le changement est synchronisé sur Android et Safari.</Text>
          <TouchableOpacity style={[styles.permissionChoice, selectedMember?.accountUid && !scrimAccess[selectedMember.accountUid] && styles.permissionChoiceActive]} onPress={() => void updatePermission(false)} disabled={savingPermission}>
            <View style={styles.permissionIcon}><Ionicons name="person" size={22} color="#D0D0D0" /></View>
            <View style={styles.permissionText}><Text style={styles.permissionTitle}>Joueur</Text><Text style={styles.permissionDescription}>Consulte les rendez-vous et répond à ses disponibilités.</Text></View>
            {selectedMember?.accountUid && !scrimAccess[selectedMember.accountUid] ? <Ionicons name="checkmark-circle" size={22} color="#84D956" /> : null}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permissionChoice, selectedMember?.accountUid && scrimAccess[selectedMember.accountUid] && styles.permissionChoiceActive]} onPress={() => void updatePermission(true)} disabled={savingPermission}>
            <View style={[styles.permissionIcon, styles.creatorIcon]}><Ionicons name="flash" size={22} color="#7CCBFF" /></View>
            <View style={styles.permissionText}><Text style={styles.permissionTitle}>Créateur de scrims</Text><Text style={styles.permissionDescription}>Peut créer des scrims et des rendez-vous Replay / Strat.</Text></View>
            {selectedMember?.accountUid && scrimAccess[selectedMember.accountUid] ? <Ionicons name="checkmark-circle" size={22} color="#84D956" /> : null}
          </TouchableOpacity>
          {savingPermission ? <Text style={styles.savingPermission}>Mise à jour des droits…</Text> : null}
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  background: { flex: 1 },
  backgroundImage: { opacity: Theme.marble.imageOpacity },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: Theme.marble.overlay },
  whiteGlow: { position: "absolute", top: -80, right: -120, width: 330, height: 430, borderRadius: 190, backgroundColor: Theme.marble.whiteGlow, transform: [{ rotate: "-18deg" }] },
  goldVein: { position: "absolute", top: 120, left: -70, width: 520, height: 2, backgroundColor: Theme.marble.goldVein, transform: [{ rotate: "-23deg" }] },
  content: { paddingHorizontal: 18 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  headingText: { flex: 1 },
  kicker: { color: Theme.colors.goldLight, fontSize: 10, fontWeight: "900", letterSpacing: 1.8 },
  title: { color: "#fff", fontSize: 34, fontWeight: "900", marginTop: 4 },
  subtitle: { color: "#D5D5D5", marginTop: 7, lineHeight: 19, paddingRight: 8 },
  addButton: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginLeft: 12, shadowColor: Theme.colors.gold, shadowOpacity: 0.32, shadowRadius: 12, elevation: 8 },
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, minHeight: 98, borderRadius: 20, padding: 12, justifyContent: "center", backgroundColor: "rgba(10,10,10,0.79)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.glass.border },
  summaryIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.055)", marginBottom: 7 },
  summaryValue: { color: "#fff", fontSize: 24, fontWeight: "900" },
  summaryLabel: { color: "#BEBEBE", fontSize: 9, fontWeight: "800", marginTop: 2 },
  searchBox: { height: 48, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(8,8,8,0.82)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.2)", marginBottom: 18 },
  searchInput: { flex: 1, height: "100%", color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  clearSearch: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { color: Theme.colors.goldLight, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  sectionCount: { color: "#9D9D9D", fontSize: 10, fontWeight: "700" },
  card: { borderRadius: 22, padding: 15, marginBottom: 11, overflow: "hidden", backgroundColor: "rgba(8,8,8,0.8)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.glass.border, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  currentCard: { borderColor: "rgba(132,217,86,0.48)", backgroundColor: "rgba(9,15,7,0.82)" },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.995 }] },
  cardVein: { position: "absolute", top: 0, right: 22, width: 110, height: 1, backgroundColor: Theme.marble.goldVein },
  memberTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.25)" },
  avatarCurrent: { borderColor: "rgba(132,217,86,0.5)", backgroundColor: "rgba(132,217,86,0.08)" },
  avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.5 },
  linkDot: { position: "absolute", right: -2, bottom: -2, width: 13, height: 13, borderRadius: 7, backgroundColor: "#84D956", borderWidth: 2, borderColor: "#111" },
  memberIdentity: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  name: { flexShrink: 1, color: "#fff", fontWeight: "900", fontSize: 18 },
  meBadge: { paddingHorizontal: 7, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(132,217,86,0.12)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(132,217,86,0.32)" },
  meText: { color: "#84D956", fontSize: 8, fontWeight: "900" },
  memberMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, minHeight: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  adminRole: { backgroundColor: "rgba(224,184,67,0.12)", borderColor: "rgba(255,216,106,0.34)" },
  creatorRole: { backgroundColor: "rgba(80,160,220,0.12)", borderColor: "rgba(124,203,255,0.34)" },
  playerRole: { backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.12)" },
  roleText: { fontSize: 8, fontWeight: "900" },
  accountPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, minHeight: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  accountPillLinked: { backgroundColor: "rgba(132,217,86,0.055)", borderColor: "rgba(132,217,86,0.18)" },
  accountPillText: { color: "#A8A8A8", fontSize: 8, fontWeight: "800" },
  accountPillTextLinked: { color: "#9DDD7A" },
  presenceHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginTop: 16 },
  presenceLabel: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  presenceText: { color: "#BEBEBE", marginTop: 4, fontSize: 10, fontWeight: "700" },
  rate: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  rateMuted: { color: "#777" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", marginTop: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: Theme.colors.goldLight },
  actionHintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  actionHint: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "800" },
  actionHintCurrent: { color: "#84D956" },
  emptyCard: { alignItems: "center", padding: 24, borderRadius: 22, marginBottom: 12, backgroundColor: "rgba(8,8,8,0.72)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.glass.border },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,215,106,0.07)", marginBottom: 10 },
  emptyTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginTop: 8 },
  emptyText: { color: "#AAAAAA", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 5 },
  hint: { color: "#8F8F8F", fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 5 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.76)" },
  modalCard: { backgroundColor: "rgba(14,14,14,0.985)", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.glass.borderGold },
  modalHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 14 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  modalEyebrow: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.3, marginBottom: 3 },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  closeButton: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  input: { height: 50, borderRadius: 16, paddingHorizontal: 15, color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.glass.border },
  saveButton: { height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Theme.colors.goldLight, marginTop: 16 },
  disabled: { opacity: 0.55 },
  saveText: { color: "#111", fontWeight: "900", fontSize: 15 },
  permissionName: { color: Theme.colors.goldLight, fontWeight: "800", marginTop: 3 },
  permissionIntro: { color: "#D0D0D0", lineHeight: 19, marginBottom: 10 },
  permissionChoice: { minHeight: 82, borderRadius: 18, padding: 13, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: Theme.glass.border },
  permissionChoiceActive: { borderColor: "rgba(132,217,86,0.45)", backgroundColor: "rgba(132,217,86,0.06)" },
  permissionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  creatorIcon: { backgroundColor: "rgba(80,160,220,0.1)" },
  permissionText: { flex: 1 },
  permissionTitle: { color: "#fff", fontWeight: "900", fontSize: 15 },
  permissionDescription: { color: "#C4C4C4", fontSize: 11, lineHeight: 16, marginTop: 3 },
  savingPermission: { color: Theme.colors.goldLight, textAlign: "center", marginTop: 16, fontWeight: "800" },
});
