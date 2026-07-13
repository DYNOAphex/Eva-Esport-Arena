import { Ionicons } from "@expo/vector-icons";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Theme } from "../../constants/theme";

const stats = [
  { icon: "people", value: "6", label: "Joueurs", detail: "dans l'équipe" },
  { icon: "checkmark-circle", value: "5", label: "Présents", detail: "au scrim" },
  { icon: "trophy", value: "2-0", label: "Dernier match", detail: "Victoire" },
  { icon: "trending-up", value: "68%", label: "Winrate", detail: "saison actuelle" },
] as const;

const players = ["KroxX", "Neazy", "Zerox", "Venom", "Lyzen", "Skyzz"];

function MarbleVeins() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.vein, styles.veinOne]} />
      <View style={[styles.vein, styles.veinTwo]} />
      <View style={[styles.vein, styles.veinThree]} />
      <View style={[styles.vein, styles.veinFour]} />
      <View style={styles.marbleGlow} />
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <MarbleVeins />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={23} color={Theme.colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>

          <View style={styles.brandWrap}>
            <Text style={styles.brandMark}>D</Text>
            <View>
              <Text style={styles.brandTitle}>DYNO</Text>
              <Text style={styles.brandSubtitle}>ESPORT MANAGER</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.profileBadge} activeOpacity={0.8}>
            <Ionicons name="diamond" size={14} color={Theme.colors.goldLight} />
            <Text style={styles.profileLetter}>C</Text>
            <Text style={styles.profileRole}>Coach</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scrimCard}>
          <View style={styles.scrimOverlay} />
          <View style={styles.scrimTopRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateMonth}>JUIL.</Text>
              <Text style={styles.dateDay}>17</Text>
            </View>
            <View style={styles.scrimHeading}>
              <Text style={styles.sectionEyebrow}>PROCHAIN SCRIM</Text>
              <Text style={styles.scrimStatus}>CONFIRMÉ</Text>
            </View>
          </View>

          <View style={styles.matchRow}>
            <Text style={styles.teamName}>DYNO</Text>
            <Text style={styles.vs}>VS</Text>
            <Text style={styles.teamName}>TITANS</Text>
          </View>

          <View style={styles.matchMetaRow}>
            <View style={styles.matchMeta}>
              <Ionicons name="time-outline" size={22} color={Theme.colors.goldLight} />
              <View>
                <Text style={styles.matchMetaValue}>20h30</Text>
                <Text style={styles.matchMetaLabel}>Lobby</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.matchMeta}>
              <Ionicons name="locate-outline" size={22} color={Theme.colors.goldLight} />
              <View>
                <Text style={styles.matchMetaValue}>21h00</Text>
                <Text style={styles.matchMetaLabel}>Début du match</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.matchMeta}>
              <Ionicons name="business-outline" size={22} color={Theme.colors.goldLight} />
              <View>
                <Text style={styles.matchMetaValue}>Arène 2</Text>
                <Text style={styles.matchMetaLabel}>Mode : Scrim</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={22} color="#9BE15D" />
            <Text style={styles.confirmText}>Confirmé</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={24} color={Theme.colors.goldLight} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statDetail, stat.detail === "Victoire" && styles.successText]}>
                {stat.detail}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.glassSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.onlinePulse} />
              <Text style={styles.sectionTitle}>DERNIERS JOUEURS CONNECTÉS</Text>
            </View>
            <Text style={styles.seeAll}>Voir tout ›</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playersRow}>
            {players.map((player, index) => (
              <View key={player} style={styles.playerItem}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={28} color={index % 2 === 0 ? "#DADADA" : Theme.colors.goldLight} />
                  </View>
                  <View style={styles.playerOnlineDot} />
                </View>
                <Text style={styles.playerName}>{player}</Text>
                <Text style={styles.playerStatus}>En ligne</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.glassSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ANNONCES RÉCENTES</Text>
            <Text style={styles.seeAll}>Voir tout ›</Text>
          </View>

          <View style={styles.announcementRow}>
            <View style={styles.announcementIcon}>
              <Ionicons name="megaphone-outline" size={34} color={Theme.colors.goldLight} />
            </View>
            <View style={styles.announcementContent}>
              <Text style={styles.announcementTitle}>Scrim contre TITANS confirmé !</Text>
              <Text style={styles.announcementText}>Rendez-vous à 20h30 pour le lobby.</Text>
              <Text style={styles.announcementTime}>Il y a 2h</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080808",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
  },
  vein: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.23)",
    shadowColor: Theme.colors.gold,
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  veinOne: { width: 360, top: 170, left: -80, transform: [{ rotate: "-35deg" }] },
  veinTwo: { width: 420, top: 460, right: -150, transform: [{ rotate: "28deg" }] },
  veinThree: { width: 300, top: 850, left: -90, transform: [{ rotate: "42deg" }] },
  veinFour: { width: 380, top: 1180, right: -130, transform: [{ rotate: "-30deg" }] },
  marbleGlow: {
    position: "absolute",
    top: 120,
    right: -110,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  header: {
    minHeight: 104,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(20,20,20,0.88)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    right: 8,
    top: 7,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.gold,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandMark: {
    color: Theme.colors.goldLight,
    fontSize: 42,
    fontWeight: "900",
    fontStyle: "italic",
    transform: [{ skewX: "-10deg" }],
  },
  brandTitle: {
    color: Theme.colors.text,
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 3,
  },
  brandSubtitle: {
    color: Theme.colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginTop: 2,
  },
  profileBadge: {
    width: 58,
    height: 74,
    borderRadius: 20,
    backgroundColor: "rgba(20,20,20,0.92)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileLetter: {
    color: Theme.colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  profileRole: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  scrimCard: {
    overflow: "hidden",
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(18,18,18,0.94)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.44)",
    shadowColor: Theme.colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  scrimOverlay: {
    position: "absolute",
    top: -45,
    right: -55,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  scrimTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBadge: {
    width: 58,
    height: 64,
    borderRadius: 14,
    backgroundColor: "#F5F0E7",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  dateMonth: {
    color: "#6F5B1D",
    fontSize: 11,
    fontWeight: "800",
  },
  dateDay: {
    color: "#121212",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 29,
  },
  scrimHeading: { flex: 1 },
  sectionEyebrow: {
    color: Theme.colors.goldLight,
    fontWeight: "900",
    letterSpacing: 1.1,
    fontSize: 13,
  },
  scrimStatus: {
    color: "#8FD15B",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 26,
  },
  teamName: {
    color: Theme.colors.text,
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 1,
  },
  vs: {
    color: Theme.colors.gold,
    fontSize: 18,
    fontWeight: "900",
  },
  matchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 16,
  },
  matchMeta: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  matchMetaValue: {
    color: Theme.colors.text,
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
  },
  matchMetaLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 46,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  confirmButton: {
    alignSelf: "center",
    marginTop: 18,
    minWidth: 178,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(9,9,9,0.88)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.48)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: {
    color: "#9BE15D",
    fontWeight: "900",
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },
  statCard: {
    width: "48.3%",
    minHeight: 150,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(20,20,20,0.9)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.26)",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    color: Theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
  },
  statLabel: {
    color: Theme.colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  statDetail: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 5,
  },
  successText: { color: "#8FD15B" },
  glassSection: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(18,18,18,0.91)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    marginTop: 4,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  onlinePulse: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#86D957",
    marginRight: 8,
  },
  sectionTitle: {
    color: Theme.colors.goldLight,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  seeAll: {
    color: Theme.colors.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  playersRow: { gap: 16, paddingRight: 10 },
  playerItem: { alignItems: "center", width: 64 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#232323",
    borderWidth: 1,
    borderColor: Theme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  playerOnlineDot: {
    position: "absolute",
    right: 1,
    bottom: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#35C94A",
    borderWidth: 2,
    borderColor: "#101010",
  },
  playerName: {
    color: Theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 7,
  },
  playerStatus: {
    color: "#86D957",
    fontSize: 9,
    marginTop: 2,
  },
  announcementRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  announcementIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.42)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  announcementContent: { flex: 1 },
  announcementTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  announcementText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  announcementTime: {
    color: "#777",
    fontSize: 10,
    marginTop: 5,
  },
});
