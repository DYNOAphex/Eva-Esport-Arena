import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Theme } from "../../constants/theme";

type Props = { step: number; total?: number };

export default function ScrimFormProgress({ step, total = 4 }: Props) {
  const labels = ["Type", "Adversaire", "Horaire", "Validation"];
  return (
    <View style={{ marginTop: 18, marginBottom: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {labels.slice(0, total).map((label, index) => {
          const current = index + 1;
          const done = current < step;
          const active = current === step;
          return (
            <View key={label} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: done || active ? Theme.colors.goldLight : "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: done || active ? Theme.colors.goldLight : "rgba(255,255,255,0.12)" }}>
                {done ? <Ionicons name="checkmark" size={15} color="#080808" /> : <Text style={{ color: active ? "#080808" : "#999", fontSize: 11, fontWeight: "900" }}>{current}</Text>}
              </View>
              {current < total ? <View style={{ flex: 1, height: 1, marginHorizontal: 6, backgroundColor: current < step ? Theme.colors.goldLight : "rgba(255,255,255,0.10)" }} /> : null}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", marginTop: 7 }}>
        {labels.slice(0, total).map((label, index) => <Text key={label} style={{ flex: 1, color: index + 1 === step ? Theme.colors.goldLight : "#777", fontSize: 8, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>)}
      </View>
    </View>
  );
}
