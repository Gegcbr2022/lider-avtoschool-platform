// ─── Мої документи — сбор данных для внесения в НАІС МВС ─────────────────────────
// Текстовые поля + фото документов. Хранится в приватной коллекции naisData/{uid}
// (доступ только владелец + персонал) и Storage student-documents/{uid}/.
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../lib/auth";
import {
  getNaisData, saveNaisData, addNaisDocument,
  type NaisData, type NaisDocument,
} from "../lib/firestore";
import { uploadStudentDocument } from "../lib/storage";
import { useTheme, radii, spacing } from "../lib/theme";

type FieldKey = "fullName" | "birthDate" | "passportSeries" | "passportNumber" | "taxId" | "registrationAddress" | "medCertNumber";

const FIELDS: { key: FieldKey; label: string; placeholder: string; keyboard?: "default" | "numeric" }[] = [
  { key: "fullName", label: "Прізвище, ім'я, по батькові", placeholder: "Іваненко Іван Іванович" },
  { key: "birthDate", label: "Дата народження", placeholder: "01.01.2000" },
  { key: "passportSeries", label: "Паспорт: серія", placeholder: "АА (або ID-картка)" },
  { key: "passportNumber", label: "Паспорт: номер", placeholder: "123456" },
  { key: "taxId", label: "ІПН (код)", placeholder: "1234567890", keyboard: "numeric" },
  { key: "registrationAddress", label: "Адреса реєстрації (прописка)", placeholder: "м. Київ, вул. ..., буд. ..." },
  { key: "medCertNumber", label: "Медсправка №", placeholder: "якщо вже є" },
];

const DOC_KINDS: { kind: string; label: string; icon: string }[] = [
  { kind: "passport", label: "Фото паспорта / ID-картки", icon: "🪪" },
  { kind: "taxId", label: "Фото коду (ІПН)", icon: "🔢" },
  { kind: "registration", label: "Фото прописки", icon: "🏠" },
  { kind: "medCert", label: "Фото медсправки", icon: "🩺" },
];

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  const [values, setValues] = useState<NaisData>({});
  const [docs, setDocs] = useState<NaisDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest || !user?.id) { setLoading(false); return; }
    getNaisData(user.id).then((d) => {
      if (d) { setValues(d); setDocs(d.documents ?? []); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  function setField(key: FieldKey, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveNaisData(user.id, values);
      Alert.alert("Збережено", "Дані надіслані в автошколу для внесення в НАІС.");
    } catch {
      Alert.alert("Помилка", "Не вдалось зберегти. Перевір з'єднання.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind: string) {
    if (!user?.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Дозвіл потрібен", "Дозволь доступ до фото в налаштуваннях, щоб завантажити документ.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingKind(kind);
    try {
      const { storagePath, downloadURL } = await uploadStudentDocument(user.id, kind, result.assets[0].uri);
      const docEntry: NaisDocument = { kind, storagePath, downloadURL, uploadedAt: new Date().toISOString() };
      await addNaisDocument(user.id, docEntry);
      setDocs((prev) => [...prev.filter((d) => d.kind !== kind), docEntry]);
    } catch {
      Alert.alert("Помилка", "Не вдалось завантажити фото. Спробуй ще раз.");
    } finally {
      setUploadingKind(null);
    }
  }

  if (isGuest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <Header colors={colors} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔐</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900", textAlign: "center" }}>Увійди в акаунт</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Документи для НАІС доступні зареєстрованим учням.
          </Text>
          <Pressable onPress={() => router.push("/auth?mode=login")} style={{ marginTop: 20, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 36 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Увійти</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <Header colors={colors} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          {/* Privacy note */}
          <View style={{ backgroundColor: colors.bgElevated, borderRadius: radii.md, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 10 }}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
              Ці дані потрібні автошколі для внесення в базу НАІС МВС. Доступ мають лише ти та працівники школи.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={colors.red} />
            </View>
          ) : (
            <>
              {/* Text fields */}
              <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 14 }}>
                {FIELDS.map((f) => (
                  <View key={f.key} style={{ gap: 6 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "800" }}>{f.label}</Text>
                    <TextInput
                      value={(values[f.key] as string | undefined) ?? ""}
                      onChangeText={(v) => setField(f.key, v)}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.textTertiary}
                      keyboardType={f.keyboard ?? "default"}
                      style={{ backgroundColor: colors.bgElevated, borderRadius: radii.sm, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11, color: colors.textPrimary, fontSize: 15, fontWeight: "600" }}
                    />
                  </View>
                ))}
              </View>

              {/* Documents */}
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 }}>
                Фото документів
              </Text>
              <View style={{ gap: 10 }}>
                {DOC_KINDS.map((d) => {
                  const uploaded = docs.find((x) => x.kind === d.kind);
                  const busy = uploadingKind === d.kind;
                  return (
                    <Pressable
                      key={d.kind}
                      onPress={() => !busy && handleUpload(d.kind)}
                      style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1.5, borderColor: uploaded ? colors.success + "66" : colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
                    >
                      <Text style={{ fontSize: 24 }}>{d.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 14 }}>{d.label}</Text>
                        <Text style={{ color: uploaded ? colors.success : colors.textTertiary, fontSize: 12, marginTop: 2, fontWeight: "600" }}>
                          {busy ? "Завантаження..." : uploaded ? "✓ Завантажено" : "Натисни, щоб додати фото"}
                        </Text>
                      </View>
                      {busy ? <ActivityIndicator color={colors.red} /> :
                        uploaded?.downloadURL ? <Image source={{ uri: uploaded.downloadURL }} style={{ width: 44, height: 44, borderRadius: 8 }} /> :
                        <Text style={{ fontSize: 22, color: colors.textTertiary }}>＋</Text>}
                    </Pressable>
                  );
                })}
              </View>

              {/* Save */}
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", marginTop: 8, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Зберегти дані</Text>}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
      <Pressable hitSlop={12} onPress={() => router.back()}>
        <Text style={{ color: colors.red, fontSize: 24, fontWeight: "600" }}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>Мої документи</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Дані для НАІС МВС</Text>
      </View>
    </View>
  );
}
