/**
 * Alternative onboarding carousel using ScrollView instead of FlatList
 * Fallback if FlatList scrolling is broken
 */
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { darkColors as colors, radii, spacing } from "../lib/theme";

const { width: W } = Dimensions.get("window");

const MASCOT = require("../assets/mascot.png") as number;

type Slide = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    emoji: "🚗",
    title: "Навчайся онлайн",
    subtitle: "Теорія, ПДР-тести та практика — все в одному додатку. Вчись де зручно.",
    accent: colors.red,
  },
  {
    id: "2",
    emoji: "📝",
    title: "Проходь тести ПДР",
    subtitle: "Понад 800 питань із поясненнями. Відстежуй слабкі теми і вчись на помилках.",
    accent: "#e53e3e",
  },
  {
    id: "3",
    emoji: "🏆",
    title: "Нагороди та прогрес",
    subtitle: "Серії занять, бейджі, досягнення. Навчання стає цікавим коли бачиш результат.",
    accent: colors.red,
  },
  {
    id: "4",
    emoji: "🎓",
    title: "Готуйся впевнено",
    subtitle: "Лідик допоможе підготуватись до іспиту. 15 000+ випускників вже отримали права.",
    accent: "#cc0000",
  },
];

export default function OnboardingScreen() {
  const { signInAsGuest } = useAuth();
  const [current, setCurrent] = useState(0);
  const [taps, setTaps] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  function animateDot(index: number) {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotAnim[i], {
        toValue: i === index ? 1 : 0,
        useNativeDriver: false,
      }).start();
    });
  }

  function next() {
    setTaps(prev => prev + 1);
    setCurrent(prev => {
      const nextIndex = prev + 1;
      if (nextIndex < SLIDES.length) {
        const offset = nextIndex * W;
        console.log("[OnboardingAlt] Scrolling to offset:", offset);
        scrollRef.current?.scrollTo({ x: offset, animated: true });
        animateDot(nextIndex);
        return nextIndex;
      } else {
        router.push("/auth");
        return prev;
      }
    });
  }

  function goGuest() {
    signInAsGuest();
  }

  const isLast = current === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Debug: Show current slide and taps */}
      <View style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <Text style={{ fontSize: 10, color: colors.red, fontWeight: "bold" }}>
          Slide: {current + 1}/{SLIDES.length}
        </Text>
        <Text style={{ fontSize: 10, color: colors.red }}>
          Taps: {taps}
        </Text>
      </View>

      {/* Logo/brand */}
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Image source={MASCOT} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brandName}>Лідер</Text>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {SLIDES.map((item) => (
          <View key={item.id} style={styles.slide}>
            <View style={[styles.emojiWrap, { backgroundColor: item.accent + "22" }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => {
          const w = dotAnim[i].interpolate({
            inputRange: [0, 1],
            outputRange: [8, 24],
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { width: w, backgroundColor: i === current ? colors.red : colors.border },
              ]}
            />
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isLast ? (
          <>
            <Pressable
              style={styles.btnPrimary}
              onPress={() => router.push("/auth?mode=register")}
            >
              <Text style={styles.btnPrimaryText}>Почати навчання</Text>
            </Pressable>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => router.push("/auth?mode=login")}
            >
              <Text style={styles.btnSecondaryText}>Увійти</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.btnPrimary} onPress={next}>
            <Text style={styles.btnPrimaryText}>Далі</Text>
          </Pressable>
        )}

        <Pressable style={styles.btnGhost} onPress={goGuest}>
          <Text style={styles.btnGhostText}>Продовжити як гість</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.redSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 32, height: 32 },
  brandName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  slide: {
    width: W,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  emojiWrap: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 64 },
  slideTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.md,
  },
  slideSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  dots: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },

  actions: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: colors.red,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "600",
  },
  btnSecondary: {
    backgroundColor: colors.inputBg,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: "center",
  },
  btnSecondaryText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  btnGhost: {
    paddingVertical: 12,
    alignItems: "center",
  },
  btnGhostText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});
