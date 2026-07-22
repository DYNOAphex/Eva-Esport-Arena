import { Ionicons } from "@expo/vector-icons";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Theme } from "../../constants/theme";

type PlayerResponse = {
  id: string;
  nickname: string;
  status: "Disponible" | "Indisponible" | "En attente" | "Sans réponse";
};

type ScrimDetailSheetProps = {
  visible: boolean;
  opponent: string;
  type: string;
  status: string;
  dateLabel: string;
  arrivalTime: string;
  matchTime: string;
  arena: string;
  notes?: string;
  responses: PlayerResponse[];
  onClose: () => void;
};

export default function ScrimDetailSheet({
  visible,
  opponent,
  type,
  status,
  dateLabel,
  arrivalTime,
  matchTime,
  arena,
  notes,
  responses,
  onClose,
}: ScrimDetailSheetProps) {
  const available = responses.filter((item) => item.status === "Disponible");
  const unavailable = responses.filter((item) => item.status === "Indisponible");
  const pending = responses.filter((item) => item.status === "En attente" || item.status === "Sans réponse");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{type.toUpperCase()}</Text>
              <Text style={styles.title} numberOfLines={1}>DYNO VS {opponent.toUpperCase()}</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Fermer le détail" style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusBadge}><Text style={styles.statusText}>{status}</Text></View>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>

          <View style={styles.infoGrid}>
            <Info icon="people-outline" label="RENDEZ-VOUS" value={arrivalTime} />
            <Info icon="time-outline" label="MATCH" value={matchTime} />
            <Info icon="business-outline" label="ARÈNE" value={arena} />
          </View>

          <View style={styles.counters}>
            <Counter value={available.length} label="Disponibles" tone="positive" />
            <Counter value={unavailable.length} label="Indisponibles" tone="negative" />
            <Counter value={pending.length} label="Sans réponse" tone="pending" />
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <ResponseSection title="DISPONIBLES" items={available} empty="Aucun joueur disponible." />
            <ResponseSection title="INDISPONIBLES" items={unavailable} empty="Aucun joueur indisponible." />
            <ResponseSection title="SANS RÉPONSE" items={pending} empty="Tout le monde a répondu." />
            {notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.sectionTitle}>NOTES</Text>
                <Text style={styles.notes}>{notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={17} color={Theme.colors.goldLight} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function Counter({ value, label, tone }: { value: number; label: string; tone: "positive" | "negative" | "pending" }) {
  return (
    <View style={styles.counter}>
      <Text style={[styles.counterValue, tone === "positive" && styles.positive, tone === "negative" && styles.negative, tone === "pending" && styles.pending]}>{value}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

function ResponseSection({ title, items, empty }: { title: string; items: PlayerResponse[]; empty: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length ? items.map((item) => (
        <View key={item.id} style={styles.playerRow}>
          <Text style={styles.playerName}>{item.nickname}</Text>
          <Text style={styles.playerStatus}>{item.status === "Sans réponse" ? "En attente" : item.status}</Text>
        </View>
      )) : <Text style={styles.empty}>{empty}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.82)" },
  sheet: { maxHeight: "88%", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, backgroundColor: "#0D0D0D", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.14)" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "900", marginTop: 5 },
  closeButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(246,215,106,0.1)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.42)" },
  statusText: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900" },
  date: { flex: 1, color: "#D7D7D7", fontSize: 12, fontWeight: "800", textAlign: "right", textTransform: "capitalize" },
  infoGrid: { flexDirection: "row", gap: 8, marginTop: 15 },
  infoItem: { flex: 1, minWidth: 0, minHeight: 56, borderRadius: 15, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  infoText: { flex: 1, minWidth: 0 },
  infoLabel: { color: "#858585", fontSize: 7, fontWeight: "900" },
  infoValue: { color: "#F2F2F2", fontSize: 10, fontWeight: "900", marginTop: 3 },
  counters: { flexDirection: "row", gap: 8, marginTop: 15 },
  counter: { flex: 1, minWidth: 0, paddingVertical: 12, borderRadius: 16, alignItems: "center", backgroundColor: "rgba(255,255,255,0.045)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)" },
  counterValue: { fontSize: 22, fontWeight: "900" },
  counterLabel: { color: "#A4A4A4", fontSize: 8, fontWeight: "800", marginTop: 3 },
  positive: { color: "#83DD57" },
  negative: { color: "#FF7777" },
  pending: { color: Theme.colors.goldLight },
  list: { marginTop: 16 },
  listContent: { paddingBottom: 12 },
  section: { marginBottom: 16 },
  sectionTitle: { color: Theme.colors.goldLight, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  playerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.09)" },
  playerName: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  playerStatus: { color: "#BDBDBD", fontSize: 10, fontWeight: "800" },
  empty: { color: "#8D8D8D", fontSize: 11, marginTop: 9 },
  notesBox: { padding: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)" },
  notes: { color: "#D4D4D4", fontSize: 12, lineHeight: 18, marginTop: 8 },
});