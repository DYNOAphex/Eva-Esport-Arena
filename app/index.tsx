import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Theme } from "../constants/theme";
import { getValidSession } from "../services/authService";

export default function HomeScreen() {
  useEffect(() => {
    let active = true;

    void getValidSession().then((session) => {
      if (!active) return;
      router.replace(session ? "/(tabs)/home" : "/(auth)/login");
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.logo}>DYNO</Text>
        <ActivityIndicator size="large" color={Theme.colors.gold} style={styles.loader} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: Theme.colors.gold,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 6,
  },
  loader: {
    marginTop: 28,
  },
});
