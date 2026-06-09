import { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView, Text, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import {
  createBooking,
  getAvailableBookingSlots,
  getInstructors,
  getMyBookings,
  type BookingDoc,
  type BookingSlotDoc,
  type Instructor,
} from "../lib/firestore";
import { scheduleLocalNotification, syncEngagementNotifications } from "../lib/notifications";
import { useTheme, radii, spacing } from "../lib/theme";
import { crashError, crashLog } from "../lib/crashlytics";

const WEEKDAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const STATUS_LABEL: Record<string, string> = {
  pending: "Очікує підтвердження",
  confirmed: "Підтверджено",
  completed: "Проведено",
  cancelled: "Скасовано",
  done: "Проведено",
};

function fmtBookingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtSlotDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Дата";
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtSlotTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function slotDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function groupSlots(slots: BookingSlotDoc[]): Array<{ key: string; label: string; slots: BookingSlotDoc[] }> {
  const map = new Map<string, BookingSlotDoc[]>();
  for (const slot of slots) {
    const key = slotDayKey(slot.startsAt);
    map.set(key, [...(map.get(key) ?? []), slot]);
  }
  return Array.from(map.entries()).map(([key, rows]) => ({
    key,
    label: fmtSlotDay(rows[0]?.startsAt ?? key),
    slots: rows,
  }));
}

function statusColor(status: string, colors: ReturnType<typeof useTheme>["colors"]) {
  if (status === "confirmed") return colors.success;
  if (status === "completed") return colors.red;
  if (status === "cancelled") return colors.textTertiary;
  return colors.warning;
}

export default function BookingScreen() {
  const { colors } = useTheme();
  const { user, mode } = useAuth();
  const isGuest = mode !== "authenticated" || !user || user.isGuest;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [slots, setSlots] = useState<BookingSlotDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selInstructor, setSelInstructor] = useState<Instructor | null>(null);
  const [selSlot, setSelSlot] = useState<BookingSlotDoc | null>(null);
  const [booking, setBooking] = useState(false);

  const slotGroups = groupSlots(slots);

  async function reloadBookings() {
    if (!user?.id) return;
    const b = await getMyBookings(user.id);
    setBookings(b);
  }

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    Promise.all([getInstructors(), user?.id ? getMyBookings(user.id) : Promise.resolve([])])
      .then(([ins, bk]) => {
        setInstructors(ins);
        setBookings(bk);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isGuest, user?.id]);

  useEffect(() => {
    let cancelled = false;
    setSelSlot(null);
    if (!selInstructor) {
      setSlots([]);
      return () => {
        cancelled = true;
      };
    }

    setLoadingSlots(true);
    getAvailableBookingSlots(selInstructor.id)
      .then((rows) => {
        if (!cancelled) setSlots(rows);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selInstructor?.id]);

  async function handleBook() {
    if (!user?.id || !selInstructor || !selSlot) return;
    setBooking(true);
    try {
      const bookingId = await createBooking({
        studentId: user.id,
        studentName: user.name,
        studentPhone: user.phone,
        instructorId: selInstructor.id,
        instructorName: selInstructor.name,
        instructorUserId: selInstructor.accountUserId ?? selSlot.instructorUserId,
        slotId: selSlot.id,
        startsAt: selSlot.startsAt,
        endsAt: selSlot.endsAt,
        branchId: selSlot.branchId,
        carLabel: selSlot.carLabel,
      });
      await scheduleLocalNotification({
        id: `booking-created-${bookingId}`,
        title: "Запит на практику відправлено",
        body: `${selInstructor.name}: ${fmtBookingDate(selSlot.startsAt)}. Очікуємо підтвердження.`,
        data: { type: "booking", bookingId, status: "pending" },
      }).catch(() => {});
      void syncEngagementNotifications(user.id).catch(() => {});

      setSelInstructor(null);
      setSelSlot(null);
      setSlots([]);
      await reloadBookings();
      crashLog(`booking:created instructor=${selInstructor.id} slot=${selSlot.id}`);
      Alert.alert("Записано!", "Інструктор підтвердить заняття. Ми нагадаємо перед виїздом.");
    } catch (e) {
      crashError(e, "booking:create");
      Alert.alert("Слот уже недоступний", "Оберіть інший час або спробуйте оновити розклад.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard }}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={{ color: colors.red, fontSize: 24, fontWeight: "600" }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "900" }}>Запис на практику</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>Оберіть інструктора та вільний слот</Text>
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
          {bookings.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" }}>Мої заняття</Text>
              {bookings.map((b) => (
                <View key={b.id} style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 22 }}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: "800", fontSize: 14 }}>{b.instructorName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{fmtBookingDate(b.startsAt)}</Text>
                    {b.carLabel ? <Text style={{ color: colors.textTertiary, fontSize: 11, marginTop: 2 }}>{b.carLabel}</Text> : null}
                  </View>
                  <Text style={{ color: statusColor(b.status, colors), fontSize: 11, fontWeight: "800", maxWidth: 104, textAlign: "right" }}>{STATUS_LABEL[b.status] ?? b.status}</Text>
                </View>
              ))}
            </View>
          ) : null}

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
                onPress={() => setSelInstructor(selected ? null : ins)}
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

          {selInstructor ? (
            <>
              <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 }}>Вільні слоти</Text>
              {loadingSlots ? (
                <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: "center" }}>
                  <ActivityIndicator color={colors.red} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 10 }}>Оновлюємо розклад інструктора…</Text>
                </View>
              ) : slots.length === 0 ? (
                <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "900", fontSize: 15 }}>Вільних слотів поки немає</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 19 }}>
                    Розклад підтягнеться, коли менеджер відкриє доступний час для цього інструктора.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {slotGroups.map((group) => (
                    <View key={group.key} style={{ gap: 8 }}>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "800" }}>{group.label}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {group.slots.map((slot) => {
                          const selected = selSlot?.id === slot.id;
                          return (
                            <Pressable
                              key={slot.id}
                              onPress={() => setSelSlot(slot)}
                              style={{ minWidth: 96, paddingHorizontal: 14, paddingVertical: 11, borderRadius: radii.md, backgroundColor: selected ? colors.red : colors.bgCard, borderWidth: 1.5, borderColor: selected ? colors.red : colors.border }}
                            >
                              <Text style={{ fontSize: 15, fontWeight: "900", color: selected ? "#fff" : colors.textPrimary }}>{fmtSlotTime(slot.startsAt)}</Text>
                              {slot.carLabel ? <Text style={{ color: selected ? "rgba(255,255,255,0.82)" : colors.textTertiary, fontSize: 11, marginTop: 2 }}>{slot.carLabel}</Text> : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={handleBook}
                disabled={!selSlot || booking}
                style={{ backgroundColor: !selSlot ? colors.bgElevated : colors.red, borderRadius: radii.md, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
              >
                {booking ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ color: !selSlot ? colors.textTertiary : "#fff", fontWeight: "800", fontSize: 16 }}>
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
