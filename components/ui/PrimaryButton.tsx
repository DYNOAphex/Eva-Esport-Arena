import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

import { Theme } from "../../constants/theme";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  icon?: ReactNode;
};

export function PrimaryButton({ title, onPress, style, icon }: PrimaryButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.button, style]}>
      {icon}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: Theme.colors.gold,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  text: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});
