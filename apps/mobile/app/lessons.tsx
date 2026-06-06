// ─── Навчальні матеріали: відео-теорія + ПДР по розділах ────────────────────────
// Читает коллекцию lessons (type video|text). Видео открывает YouTube через Linking,
// ПДР-разделы — раскрываемый текст. Контент наполняет школа через Admin.
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getLessons, type Lesson } from "../lib/firestore";
import { useTheme, radii, spacing } from "../lib/theme";

export default function LessonsScreen() {
  const { colors } = useTheme();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    getLessons().then(setLessons).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const videos = lessons.filter((l) => l.type === "video");
  const texts = lessons.filter((l) => l.type === "text");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={{ color: colors.red, fontSize: 24, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>Навчальні матеріали</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Відео-теорія та ПДР по розділах</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.red} /></View>
      ) : lessons.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "800", textAlign: "center" }}>Матеріали готуються</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Автошкола незабаром додасть відео-уроки та розділи ПДР. Поки що тренуйся в ПДР Тренажері.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}>
          {/* Video lessons */}
          {videos.length > 0 ? (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>Відео-уроки</Text>
              {videos.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => l.videoUrl && Linking.openURL(l.videoUrl).catch(() => {})}
                  style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: radii.sm, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 22 }}>▶️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{l.title}</Text>
                    {l.description ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }} numberOfLines={2}>{l.description}</Text> : null}
                    {l.category ? <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 3 }}>{l.category}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 18, color: colors.textTertiary }}>›</Text>
                </Pressable>
              ))}
            </>
          ) : null}

          {/* ПДР text sections */}
          {texts.length > 0 ? (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 }}>ПДР по розділах</Text>
              {texts.map((l) => {
                const open = expanded === l.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setExpanded(open ? null : l.id)}
                    style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: open ? colors.red : colors.border, padding: 14, gap: open ? 10 : 0 }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Text style={{ fontSize: 22 }}>📖</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{l.title}</Text>
                        {l.description && !open ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{l.description}</Text> : null}
                      </View>
                      <Text style={{ fontSize: 16, color: colors.textTertiary }}>{open ? "▾" : "▸"}</Text>
                    </View>
                    {open ? (
                      <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 22 }}>{l.body || l.description || "Текст готується."}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
