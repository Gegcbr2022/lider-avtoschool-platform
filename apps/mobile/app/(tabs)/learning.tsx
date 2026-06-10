import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { router, type Href } from "expo-router";
import { useState } from "react";
import {
  Card,
  Label,
  Pill,
  Row,
  Screen,
} from "../../components/mobile-ui";
import { LidikGuide } from "../../components/lidik-guide";
import { mobileServices } from "../../lib/mobile-data";
import { PDR_QUESTIONS } from "../../lib/pdr-questions";
import { useTheme, radii, shadows, spacing } from "../../lib/theme";
import { useAuth } from "../../lib/auth";

export default function LearningTab() {
  const { colors } = useTheme();
  const { mode } = useAuth();
  const isAuth = mode === "authenticated";
  
  return (
    <Screen title="Навчання" subtitle="Твоя дорожня карта до посвідчення водія.">
      
      {/* ─── Hero Roadmap ────────────────────────────────────────────────────── */}
      <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadows.card, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success }} />
            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: "800" }}>Теорія: вивчення</Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>Крок 1 з 4</Text>
        </View>

        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden", marginBottom: 16 }}>
          <View style={{ width: "25%", height: "100%", backgroundColor: colors.red, borderRadius: 3 }} />
        </View>

        <LidikGuide 
          variant="inline"
          text="Почни з маленького кроку — 5 хвилин тренування вже дадуть результат."
          style={{ marginBottom: 16 }}
        />

        <Pressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{ backgroundColor: colors.red, borderRadius: radii.md, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>Продовжити навчання</Text>
        </Pressable>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 8 }}>Твій план</Text>
      
      <View style={{ gap: 10 }}>
        <Pressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.redSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Тренування ПДР</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Тести по темам та марафон</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Мої слабкі теми</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Питання, де ти помилявся</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/tests")}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🎓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Пробний іспит</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>20 питань за 20 хвилин</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/assistant")}
          style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}
        >
          <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.infoSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "800" }}>Поставити питання Лідику</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>AI-помічник 24/7</Text>
          </View>
          <Text style={{ color: colors.textTertiary, fontSize: 20 }}>›</Text>
        </Pressable>
      </View>

      {/* ─── Практичне водіння ─────────────────────────────────────────────── */}
      {isAuth && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "800", marginLeft: 4, marginBottom: 8 }}>Практика</Text>
          <Pressable onPress={() => router.push("/booking" as Href)}>
            <View style={{ backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, ...shadows.card }}>
              <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.bgElevated, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 22 }}>🚗</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textPrimary }}>Практичне водіння</Text>
                <Text style={{ marginTop: 3, fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>Обери інструктора та запишись</Text>
              </View>
              <Text style={{ fontSize: 20, color: colors.textTertiary }}>›</Text>
            </View>
          </Pressable>
        </View>
      )}

      <View style={{ height: 40 }} />
    </Screen>
  );
}
