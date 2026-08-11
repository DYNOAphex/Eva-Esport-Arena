import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Theme } from "../../constants/theme";
export default function ScrimFormPreviewBadge({ ready }: { ready: boolean }) { return <View style={{flexDirection:"row",alignItems:"center",gap:5}}><Ionicons name={ready?"checkmark-circle":"ellipse-outline"} size={13} color={Theme.colors.goldLight}/><Text style={{color:Theme.colors.goldLight,fontSize:8,fontWeight:"900"}}>{ready?"PRÊT":"À COMPLÉTER"}</Text></View>; }
