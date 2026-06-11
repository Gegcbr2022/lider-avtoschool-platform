// ─── Страховка: КАСКО / ОСЦПВ ────────────────────────────────────────────────
// ТЗ п.3: ввод даних авто + фото + форма оплати.
// Поточний стан: збір даних у Firestore (insuranceRequests).
// Інтеграція з партнером-еквайрингом — після надання ключів власником.
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseApp } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { useTheme, radii, spacing } from "../lib/theme";

const db = getFirestore(firebaseApp);

// ─── Types ────────────────────────────────────────────────────────────────────

type InsuranceType = "osago" | "kasko";

const INSURANCE_LABELS: Record<InsuranceType, string> = {
  osago: "ОСЦПВ (обов'язкове)",
  kasko: "КАСКО (добровільне)",
};

// ─── Save insurance request to Firestore ─────────────────────────────────────

async function submitInsuranceRequest(data: {
  userId: string;
  userName: string;
  insuranceType: InsuranceType;
  licensePlate: string;
  vin: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  phone: string;
}): Promise<void> {
  await addDoc(collection(db, "insuranceRequests"), {
    ...data,
    status: "new",
    createdAt: serverTimestamp(),
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InsuranceScreen() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const s = makeStyles(colors);

  const [insuranceType, setInsuranceType] = useState<InsuranceType>("osago");
  const [licensePlate, setLicensePlate] = useState("");
  const [vin, setVin] = useState("");
  const [carBrand, setCarBrand] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!licensePlate.trim() || !carBrand.trim() || !carModel.trim() || !phone.trim()) {
      Alert.alert("Заповніть обов'язкові поля", "Номер авто, марка, модель та телефон — обов'язкові.");
      return;
    }
    if (mode !== "authenticated" || !user?.id) {
      Alert.alert("Потрібен вхід", "Увійдіть у свій акаунт для оформлення страховки.");
      return;
    }

    setSubmitting(true);
    try {
      await submitInsuranceRequest({
        userId: user.id,
        userName: user.name ?? "Клієнт",
        insuranceType,
        licensePlate: licensePlate.trim().toUpperCase(),
        vin: vin.trim().toUpperCase(),
        carBrand: carBrand.trim(),
        carModel: carModel.trim(),
        carYear: carYear.trim(),
        phone: phone.trim(),
      });
      setSubmitted(true);
    } catch {
      Alert.alert("Помилка", "Не вдалося надіслати заявку. Спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success state ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.headerRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Text style={[s.backArrow, { color: colors.red }]}>‹</Text>
          </Pressable>
          <Text style={s.headerTitle}>Страховка</Text>
        </View>
        <View style={s.successWrap}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
          <Text style={s.successTitle}>Заявку отримано!</Text>
          <Text style={s.successText}>
            Менеджер зв'яжеться з вами за номером {phone} протягом робочого дня для уточнення деталей та оплати.
          </Text>
          <Pressable style={s.primaryBtn} onPress={() => router.back()}>
            <Text style={s.primaryBtnText}>Повернутися</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.headerRow}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={[s.backArrow, { color: colors.red }]}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Страховка 🛡️</Text>
          <Text style={s.headerSubtitle}>ОСЦПВ та КАСКО для вашого авто</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ─── Info banner ──────────────────────────────────────────── */}
          <View style={s.infoBanner}>
            <Text style={s.infoBannerTitle}>Як це працює</Text>
            <Text style={s.infoBannerText}>
              1. Заповніть форму з даними авто.{"\n"}
              2. Менеджер підбере найкращий тариф.{"\n"}
              3. Оплата онлайн або в офісі — зручний для вас варіант.
            </Text>
          </View>

          {/* ─── Insurance type selector ──────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Тип страховки</Text>
            <View style={s.typeRow}>
              {(["osago", "kasko"] as InsuranceType[]).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    s.typeBtn,
                    insuranceType === t && { backgroundColor: colors.red, borderColor: colors.red },
                  ]}
                  onPress={() => setInsuranceType(t)}
                >
                  <Text style={[s.typeBtnText, insuranceType === t && { color: "#fff" }]}>
                    {INSURANCE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ─── Vehicle data ─────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Дані авто</Text>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Держ. номер *</Text>
              <TextInput
                style={s.input}
                placeholder="AA 1234 BB"
                placeholderTextColor={colors.textTertiary}
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>VIN-код</Text>
              <TextInput
                style={s.input}
                placeholder="17 символів (необов'язково)"
                placeholderTextColor={colors.textTertiary}
                value={vin}
                onChangeText={setVin}
                autoCapitalize="characters"
                maxLength={17}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>Марка *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Toyota"
                  placeholderTextColor={colors.textTertiary}
                  value={carBrand}
                  onChangeText={setCarBrand}
                />
              </View>
              <View style={[s.fieldGroup, { flex: 1 }]}>
                <Text style={s.label}>Модель *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Camry"
                  placeholderTextColor={colors.textTertiary}
                  value={carModel}
                  onChangeText={setCarModel}
                />
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.label}>Рік випуску</Text>
              <TextInput
                style={s.input}
                placeholder="2020"
                placeholderTextColor={colors.textTertiary}
                value={carYear}
                onChangeText={setCarYear}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          {/* ─── Contact ──────────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Контакт для зв'язку</Text>
            <View style={s.fieldGroup}>
              <Text style={s.label}>Телефон *</Text>
              <TextInput
                style={s.input}
                placeholder="+38 050 000 00 00"
                placeholderTextColor={colors.textTertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ─── Payment note ─────────────────────────────────────────── */}
          <View style={s.noticeCard}>
            <Text style={s.noticeTitle}>💳 Оплата</Text>
            <Text style={s.noticeText}>
              Безготівкова оплата (Visa / MasterCard, Apple Pay, Google Pay) або готівка в офісі автошколи.
              Менеджер запропонує доступні варіанти після підбору тарифу.
            </Text>
          </View>

          {/* ─── Submit ───────────────────────────────────────────────── */}
          <Pressable
            style={[s.primaryBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.primaryBtnText}>Надіслати заявку</Text>
            )}
          </Pressable>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof import("../lib/theme").useTheme>["colors"]) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    backArrow: { fontSize: 28, fontWeight: "600", lineHeight: 32 },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
    headerSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 1 },
    successWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    successTitle: { fontSize: 22, fontWeight: "900", color: colors.textPrimary, marginBottom: 12 },
    successText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
    },
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    infoBanner: {
      backgroundColor: colors.bgElevated,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.red,
      padding: 14,
      gap: 6,
    },
    infoBannerTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 14 },
    infoBannerText: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
    sectionLabel: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    typeRow: { flexDirection: "row", gap: 10 },
    typeBtn: {
      flex: 1,
      borderRadius: radii.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 10,
      alignItems: "center",
    },
    typeBtnText: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
    fieldGroup: { gap: 4 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
    input: {
      backgroundColor: colors.bgElevated,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 11,
      color: colors.textPrimary,
      fontSize: 15,
    },
    noticeCard: {
      borderRadius: radii.md,
      padding: 14,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    noticeTitle: { color: colors.textPrimary, fontWeight: "800", fontSize: 14 },
    noticeText: { color: colors.textSecondary, lineHeight: 20, fontSize: 13 },
    primaryBtn: {
      backgroundColor: colors.red,
      borderRadius: radii.md,
      paddingVertical: 15,
      alignItems: "center",
    },
    primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
