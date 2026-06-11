// ─── Сервісні центри МВС ────────────────────────────────────────────────────────
// Список СЦ по містах + маршрут/перегляд через Google Maps (deep link, без API-ключів).
// Контент у Firestore serviceCenters (редагує школа через Admin).
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getServiceCenters, type ServiceCenter } from "../lib/firestore";
import { useTheme, radii, spacing } from "../lib/theme";

function mapsQueryFor(c: ServiceCenter): string {
  return c.mapsQuery || `${c.name} ${c.address ?? ""} ${c.city}`.trim();
}
function openDirections(c: ServiceCenter) {
  const q = encodeURIComponent(mapsQueryFor(c));
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${q}`).catch(() => {});
}
function openOnMap(c: ServiceCenter) {
  const q = encodeURIComponent(mapsQueryFor(c));
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
}
function openNearestServiceCenter() {
  const q = encodeURIComponent("сервісний центр МВС поруч");
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {
    Alert.alert("Сервісні центри МВС", "Відкрийте Google Maps і знайдіть: сервісний центр МВС поруч");
  });
}

export default function ServiceCentersScreen() {
  const { colors } = useTheme();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>("Всі");

  useEffect(() => {
    getServiceCenters().then(setCenters).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cities = useMemo(() => ["Всі", ...Array.from(new Set(centers.map((c) => c.city))).sort()], [centers]);
  const filtered = city === "Всі" ? centers : centers.filter((c) => c.city === city);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={{ color: colors.red, fontSize: 24, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>Сервісні центри МВС</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Де отримати посвідчення водія + маршрут</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.red} /></View>
      ) : centers.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🗺️</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800", textAlign: "center" }}>Знайдіть найближчий сервісний центр</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Поки каталог автошколи порожній, відкрийте актуальні результати в Google Maps.
          </Text>
          <Pressable onPress={openNearestServiceCenter} style={{ marginTop: 18, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 13, paddingHorizontal: 18 }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Відкрити Google Maps</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}>
          {/* City filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {cities.map((c) => {
                const sel = city === c;
                return (
                  <Pressable key={c} onPress={() => setCity(c)}
                    style={{ borderRadius: radii.full, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: sel ? colors.red : colors.bgCard, borderWidth: 1.5, borderColor: sel ? colors.red : colors.border }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: sel ? "#fff" : colors.textSecondary }}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {filtered.map((c) => (
            <View key={c.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Text style={{ fontSize: 26 }}>🏛️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{c.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{c.address ? `${c.address}, ` : ""}{c.city}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => openDirections(c)} style={{ flex: 1, backgroundColor: colors.red, borderRadius: radii.sm, paddingVertical: 11, alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>🧭 Прокласти маршрут</Text>
                </Pressable>
                <Pressable onPress={() => openOnMap(c)} style={{ backgroundColor: colors.bgElevated, borderRadius: radii.sm, paddingVertical: 11, paddingHorizontal: 16, alignItems: "center", borderWidth: 1.5, borderColor: colors.border }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 14 }}>На карті</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
