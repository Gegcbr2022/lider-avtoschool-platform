import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
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
  const flatRef = useRef<FlatList<Slide>>(null);
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  function animateDot(index: number) {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotAnim[i], {
        toValue: i === index ? 1 : 0,
        useNativeDriver: false,
      }).start();
    });
  }

  function onScroll(e: { nativeEvent: { contentOffset: { x: number } } }) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    if (idx !== current) {
      setCurrent(idx);
      animateDot(idx);
    }
  }

  function next() {
    if (current < SLIDES.length - 1) {
      const offset = (current + 1) * W;
      flatRef.current?.scrollToOffset({ offset, animated: true });
    } else {
      router.push("/auth");
    }
  }

  function goGuest() {
    signInAsGuest();
  }

  const isLast = current === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Logo/brand */}
      <View style={styles.brand}>
        <View style={styles.logoWrap}>
          <Image source={MASCOT} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brandName}>Лідер</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.emojiWrap, { backgroundColor: item.accent + "22" }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

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
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  slideSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.lg,
  },
  dot: { height: 8, borderRadius: radii.full },

  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.red,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: { color: colors.white, fontSize: 17, fontWeight: "800" },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnSecondaryText: { color: colors.textSecondary, fontSize: 16, fontWeight: "700" },
  btnGhost: { alignItems: "center", paddingVertical: 10 },
  btnGhostText: { color: colors.textTertiary, fontSize: 14 },
});
