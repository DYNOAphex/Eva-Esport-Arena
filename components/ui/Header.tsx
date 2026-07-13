import { StyleSheet, Text, View } from "react-native";

import { Theme } from "../../constants/theme";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
});
