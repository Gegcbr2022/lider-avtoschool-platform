/**
 * Onboarding carousel.
 *
 * Bulletproof cross-platform pattern (Android + iOS):
 *   - A horizontal, paging ScrollView with an explicit `flex: 1` so it has a
 *     bounded viewport (the old bug: an unbounded ScrollView broke both the
 *     slide layout and programmatic `scrollTo`).
 *   - `indexRef` tracks the live page index so `next()` never reads stale state
 *     from a closure (the previous "Taps: 0 / button does nothing" symptom).
 *   - Manual swipes sync the index via `onMomentumScrollEnd`; the "Далі" button
 *     drives it via `scrollTo`. Both paths converge on the same index.
 *   - Dots animate from the live scroll position for a smooth, premium feel.
 */
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth";
import { darkColors as colors, radii, spacing } from "../lib/theme";

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
  const { width: W } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = current === SLIDES.length - 1;

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, SLIDES.length - 1));
    indexRef.current = clamped;
    scrollRef.current?.scrollTo({ x: clamped * W, animated: true });
    setCurrent(clamped);
  }

  // Keep state in sync with manual swipes.
  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== indexRef.current) {
      indexRef.current = idx;
      setCurrent(idx);
    }
  }

  function next() {
    if (indexRef.current >= SLIDES.length - 1) {
      router.push("/auth?mode=register");
    } else {
      goTo(indexRef.current + 1);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header: brand + skip */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image source={MASCOT} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>Лідер</Text>
        </View>
        {!isLast && (
          <Pressable hitSlop={12} onPress={() => router.push("/auth")}>
            <Text style={styles.skip}>Пропустити</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {SLIDES.map((item) => (
          <View key={item.id} style={[styles.slide, { width: W }]}>
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
          const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.35, 1, 0.35],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isLast ? (
          <Pressable
            style={styles.btnPrimary}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.btnPrimaryText}>🚗 Навчатися онлайн</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.btnPrimary} onPress={next}>
            <Text style={styles.btnPrimaryText}>Далі</Text>
          </Pressable>
        )}

        <Pressable style={styles.btnGhost} onPress={signInAsGuest}>
          <Text style={styles.btnGhostText}>Продовжити як гість</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  skip: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },

  scroll: { flex: 1 },

  slide: {
    flexGrow: 1,
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
    alignItems: "center",
    paddingVertical: spacing.lg,
    height: 8 + spacing.lg * 2,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },

  actions: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: colors.red,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
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
