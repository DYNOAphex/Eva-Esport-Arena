import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
};

export function SectionTitle({ title, actionLabel }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  action: {
    color: Theme.colors.gold,
    fontSize: 13,
    fontWeight: "700",
  },
});
