import { View, ActivityIndicator } from "react-native";
import { darkColors as colors } from "../lib/theme";

// Navigation is handled by onAuthStateChanged in _layout.tsx.
// This screen only shows during the brief Firebase auth resolution.
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.red} size="large" />
    </View>
  );
}
