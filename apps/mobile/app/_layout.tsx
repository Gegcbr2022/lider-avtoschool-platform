import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Expo Router built-in ErrorBoundary: export this component and expo-router
// will use it as the error boundary for this layout segment.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errWrap}>
      <Text style={styles.errEmoji}>🚧</Text>
      <Text style={styles.errTitle}>Лідик загубив конус</Text>
      <Text style={styles.errMsg}>Щось пішло не так. Спробуй перезапустити додаток.</Text>
      <ScrollView style={styles.errDetail}>
        <Text style={styles.errDetailText}>{error.message}</Text>
      </ScrollView>
      <TouchableOpacity style={styles.errBtn} onPress={retry}>
        <Text style={styles.errBtnText}>Спробувати ще раз</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errWrap: {
    flex: 1,
    backgroundColor: "#f7fbf9",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errEmoji: { fontSize: 56, marginBottom: 16 },
  errTitle: { fontSize: 22, fontWeight: "900", color: "#004d40", marginBottom: 8 },
  errMsg: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 16 },
  errDetail: {
    maxHeight: 120,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  errDetailText: { fontSize: 11, color: "#b00000" },
  errBtn: {
    backgroundColor: "#004d40",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  errBtnText: { color: "#ffd600", fontWeight: "900", fontSize: 15 },
});

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f7fbf9" },
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}
