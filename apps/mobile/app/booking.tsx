// ─── Запис на практику ──────────────────────────────────────────────────────────
// Выбор инструктора → дата (7 дней) → время → бронь в Firestore bookings
// (правило createsOwnResource: studentId == uid). Статус "pending" до подтверждения школой.
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView, Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import {
  getInstructors, createBooking, getMyBookings,
  type Instructor, type BookingDoc,
} from "../lib/firestore";
import { useTheme, radii, spacing } from "../lib/theme";

const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
const WEEKDAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function next7Days(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function fmtBookingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Очікує підтвердження", confirmed: "Підтверджено", cancelled: "Скасовано", done: "Проведено",
};

export default function BookingScreen() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selInstructor, setSelInstructor] = useState<Instructor | null>(null);
  const [selDay, setSelDay] = useState<Date | null>(null);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const days = next7Days();

  async function reloadBookings() {
    if (!user?.id) return;
    const b = await getMyBookings(user.id);
    setBookings(b);
  }

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    Promise.all([getInstructors(), user?.id ? getMyBookings(user.id) : Promise.resolve([])])
      .then(([ins, bk]) => { setInstructors(ins); setBookings(bk); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleBook() {
    if (!user?.id || !selInstructor || !selDay || !selTime) return;
    setBooking(true);
    try {
      const [hh, mm] = selTime.split(":").map(Number);
      const startsAt = new Date(selDay.getFullYear(), selDay.getMonth(), selDay.getDate(), hh, mm).toISOString();
      await createBooking({
        studentId: user.id,
        studentName: user.name,
        instructorId: selInstructor.id,
        instructorName: selInstructor.name,
        startsAt,
      });
      setSelInstructor(null); setSelDay(null); setSelTime(null);
      await reloadBookings();
      Alert.alert("Записано!", "Інструктор підтвердить заняття. Деталі — в чаті «Інструктор».");
    } catch {
      Alert.alert("Помилка", "Не вдалось записатись. Спробуй ще раз.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={{ color: colors.red, fontSize: 24, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>Запис на практику</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Оберіть інструктора, дату й час</Text>
        </View>
      </View>

      {isGuest ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🚗</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900", textAlign: "center" }}>Увійди, щоб записатись</Text>
          <Pressable onPress={() => router.push("/auth?mode=login")} style={{ marginTop: 20, backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 36 }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Увійти</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={colors.red} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 48 }}>
          {/* My bookings */}
          {bookings.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>Мої заняття</Text>
              {bookings.map((b) => (
                <View key={b.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 22 }}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 14 }}>{b.instructorName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{fmtBookingDate(b.startsAt)}</Text>
                  </View>
                  <Text style={{ color: b.status === "confirmed" ? colors.success : colors.textTertiary, fontSize: 11, fontWeight: "700" }}>{STATUS_LABEL[b.status] ?? b.status}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Instructors */}
          <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>Оберіть інструктора</Text>
          {instructors.length === 0 ? (
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: "center" }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🧑‍🏫</Text>
              <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15, textAlign: "center" }}>Інструкторів ще не додано</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 }}>
                Зверніться до менеджера для запису на практику.
              </Text>
            </View>
          ) : instructors.map((ins) => {
            const selected = selInstructor?.id === ins.id;
            return (
              <Pressable
                key={ins.id}
                onPress={() => { setSelInstructor(selected ? null : ins); setSelDay(null); setSelTime(null); }}
                style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1.5, borderColor: selected ? colors.red : colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 24 }}>{ins.photoEmoji ?? "🧑‍🏫"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 15 }}>{ins.name}</Text>
                  {ins.description ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }} numberOfLines={2}>{ins.description}</Text> : null}
                  {ins.categories?.length ? <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 3 }}>Категорії: {ins.categories.join(", ")}</Text> : null}
                </View>
                {selected ? <Text style={{ color: colors.red, fontSize: 18 }}>✓</Text> : null}
              </Pressable>
            );
          })}

          {/* Date + time pickers (after instructor selected) */}
          {selInstructor ? (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 }}>Дата</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {days.map((d) => {
                    const sel = selDay?.getTime() === d.getTime();
                    return (
                      <Pressable key={d.toISOString()} onPress={() => setSelDay(d)}
                        style={{ width: 56, paddingVertical: 10, borderRadius: radii.md, alignItems: "center", backgroundColor: sel ? colors.red : colors.bgCard, borderWidth: 1.5, borderColor: sel ? colors.red : colors.border }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: sel ? "rgba(255,255,255,0.8)" : colors.textTertiary }}>{WEEKDAYS[d.getDay()]}</Text>
                        <Text style={{ fontSize: 18, fontWeight: "900", color: sel ? "#fff" : colors.textPrimary, marginTop: 2 }}>{d.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>

              {selDay ? (
                <>
                  <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 }}>Час</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {TIME_SLOTS.map((t) => {
                      const sel = selTime === t;
                      return (
                        <Pressable key={t} onPress={() => setSelTime(t)}
                          style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: radii.full, backgroundColor: sel ? colors.red : colors.bgCard, borderWidth: 1.5, borderColor: sel ? colors.red : colors.border }}>
                          <Text style={{ fontSize: 14, fontWeight: "800", color: sel ? "#fff" : colors.textPrimary }}>{t}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Pressable
                onPress={handleBook}
                disabled={!selDay || !selTime || booking}
                style={{ backgroundColor: !selDay || !selTime ? colors.bgElevated : colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
              >
                {booking ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ color: !selDay || !selTime ? colors.textTertiary : "#fff", fontWeight: "800", fontSize: 16 }}>
                    Записатись на заняття
                  </Text>
                )}
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
