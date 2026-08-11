import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

export default function AuthVisualGuide({ mode }: { mode: "login" | "register" }) {
  const items = mode === "login"
    ? [
        { icon: "flash-outline" as const, text: "Scrims & disponibilités" },
        { icon: "people-outline" as const, text: "Roster synchronisé" },
        { icon: "notifications-outline" as const, text: "Alertes équipe" },
      ]
    : [
        { icon: "person-add-outline" as const, text: "Compte joueur" },
        { icon: "link-outline" as const, text: "Ajout au roster" },
        { icon: "shield-checkmark-outline" as const, text: "Accès sécurisé" },
      ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.text} style={styles.item}>
          <Ionicons name={item.icon} size={14} color={Theme.colors.goldLight} />
          <Text style={styles.text} numberOfLines={2}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 7, marginBottom: 18 },
  item: { flex: 1, minHeight: 48, borderRadius: 14, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.035)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(246,215,106,0.13)" },
  text: { color: "#BFBFBF", fontSize: 7, lineHeight: 10, fontWeight: "800", textAlign: "center" },
});
