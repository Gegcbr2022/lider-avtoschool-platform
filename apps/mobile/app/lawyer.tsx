// ─── Автоюрист: інфо-розділ + шаблони звернень ───────────────────────────────
// ТЗ п.4: доступ до правових роз'яснень, шаблони звернень, контакт з юристом.
// Поточний стан: інформаційний екран + шаблони + кнопки зв'язку.
// Підписка та голосовий чат з юристом — після підключення партнера.
import { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme, radii, spacing } from "../lib/theme";

// ─── Legal topics data ─────────────────────────────────────────────────────

type LegalTopic = {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  details: string;
};

const LEGAL_TOPICS: LegalTopic[] = [
  {
    id: "police",
    emoji: "👮",
    title: "Зупинка поліцією",
    summary: "Ваші права при контакті з правоохоронцями",
    details:
      "При зупинці ТЗ поліцейський зобов'язаний:\n" +
      "• Назвати своє прізвище, посаду та причину зупинки.\n" +
      "• Пред'явити службове посвідчення на вимогу.\n\n" +
      "Ви маєте право:\n" +
      "• Відео/аудіофіксувати спілкування з поліцією.\n" +
      "• Не давати пояснень без адвоката (ст.63 Конституції).\n" +
      "• Отримати копію протоколу чи постанови.\n\n" +
      "Ви зобов'язані:\n" +
      "• Пред'явити посвідчення водія, реєстраційний документ, поліс.\n" +
      "• Виконувати законні вимоги поліцейського.",
  },
  {
    id: "dtp",
    emoji: "🚧",
    title: "Дорожньо-транспортна пригода",
    summary: "Що робити при ДТП — покроково",
    details:
      "Одразу після ДТП:\n" +
      "1. Зупинитись, увімкнути аварійку, виставити знак (не менше 20м у нас. пункті / 40м поза).\n" +
      "2. Переконатися у безпеці людей. При постраждалих — викликати 103.\n" +
      "3. Зателефонувати до поліції (102) якщо є постраждалі або значна шкода.\n" +
      "4. Сфотографувати місце, ушкодження, держ. номери.\n" +
      "5. Обмінятися даними з іншим водієм (ПІБ, держ. номер, поліс ОСЦПВ).\n\n" +
      "Євро-протокол (без виклику поліції): тільки якщо 2 учасники, немає постраждалих, обидва погоджуються зі схемою.",
  },
  {
    id: "speeding",
    emoji: "⚡",
    title: "Перевищення швидкості",
    summary: "Штрафи та оскарження постанов",
    details:
      "Розміри штрафів (2024–2025):\n" +
      "• 1–20 км/год — попередження або 255 грн\n" +
      "• 21–50 км/год — 1 360 грн\n" +
      "• 51–100 км/год — 3 400 грн + позбавлення на 6 міс\n" +
      "• 101+ км/год — 5 100 грн + позбавлення на 1 рік\n\n" +
      "Оскарження постанови:\n" +
      "Подати скаргу до суду або до органу, що виніс постанову, протягом 10 днів. Суд зобов'язаний розглянути.",
  },
  {
    id: "alcohol",
    emoji: "🚫",
    title: "Алкоголь за кермом",
    summary: "Наслідки та права водія при огляді",
    details:
      "Норма: 0,2‰ (проміле) алкоголю в крові — 0,0‰ де-факто через допуск приладу.\n\n" +
      "При першому порушенні:\n" +
      "• Позбавлення прав на 1 рік + штраф 10 200 грн.\n\n" +
      "При повторному (протягом 1 року):\n" +
      "• Позбавлення на 2 роки + кримінальна відповідальність при ДТП.\n\n" +
      "При відмові від огляду:\n" +
      "• Відмова прирівнюється до підтвердженого сп'яніння — покарання аналогічне.\n\n" +
      "Ваше право: вимагати направлення до медустанови для аналізу крові, якщо сумніваєтесь у правильності показань приладу.",
  },
  {
    id: "insurance",
    emoji: "📋",
    title: "ОСЦПВ та відшкодування",
    summary: "Виплати за страховкою після ДТП",
    details:
      "Максимальне відшкодування за ОСЦПВ:\n" +
      "• Шкода майну: до 160 000 грн.\n" +
      "• Шкода здоров'ю/життю: до 320 000 грн.\n\n" +
      "Порядок отримання виплати:\n" +
      "1. Повідомте свою страхову компанію протягом 3 робочих днів.\n" +
      "2. Зберіть документи: копія протоколу або Євро-протокол, довідки з поліції (якщо були).\n" +
      "3. Страхова компанія повинна виплатити протягом 90 днів.\n\n" +
      "При відмові виплатити — скарга до МТСБУ або до суду.",
  },
];

// ─── Templates ────────────────────────────────────────────────────────────

type Template = {
  id: string;
  title: string;
  text: string;
};

const TEMPLATES: Template[] = [
  {
    id: "dispute_fine",
    title: "⚖️ Оскарження постанови про штраф",
    text: `До [назва суду/органу]
від [ПІБ], [адреса], тел. [телефон]

СКАРГА
на постанову у справі про адміністративне правопорушення

[дата] інспектором [ПІБ інспектора] стосовно мене було складено постанову №[номер] за порушення [стаття].

Вважаю постанову незаконною, оскільки: [вкажіть причину: не виконано вимоги щодо оформлення, свідки заперечують, технічна помилка приладу тощо].

На підставі ст.287 КУпАП прошу скасувати постанову.

[дата]               [підпис]`,
  },
  {
    id: "dtp_statement",
    title: "🚧 Заява про ДТП до страхової",
    text: `До [назва страхової компанії]
від [ПІБ], [номер полісу ОСЦПВ]

ЗАЯВА
про дорожньо-транспортну пригоду

[дата] о [час] за адресою [місце ДТП] сталась ДТП за участю:
- мого ТЗ: [марка, модель, держ. номер]
- ТЗ другого учасника: [марка, модель, держ. номер, поліс]

Обставини: [опис].

Прошу провести страхове відшкодування згідно з договором ОСЦПВ.

Додатки: фото з місця ДТП, копія протоколу/Євро-протоколу.

[дата]               [підпис]`,
  },
  {
    id: "complaint_police",
    title: "📝 Скарга на дії поліцейського",
    text: `До [назва підрозділу / прокуратури]
від [ПІБ], [адреса]

СКАРГА
на неправомірні дії поліцейського

[дата] о [час] поліцейський [ПІБ/звання, за наявності] вчинив такі дії: [опис].

Вважаю ці дії такими, що порушують [стаття КУпАП / ЗУ «Про Національну поліцію»].

Прошу: провести перевірку та притягнути до відповідальності.

[дата]               [підпис]`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export default function LawyerScreen() {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"topics" | "templates">("topics");

  function toggleTopic(id: string) {
    setExpandedTopic((prev) => (prev === id ? null : id));
  }
  function toggleTemplate(id: string) {
    setExpandedTemplate((prev) => (prev === id ? null : id));
  }

  function callLawyer() {
    // Redirect to chat manager which acts as first-line legal contact
    router.push("/(tabs)/chat");
  }

  function openTelegram() {
    Linking.openURL("https://t.me/lider_avtoschool").catch(() => {
      Alert.alert("Не вдалося відкрити Telegram");
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.headerRow}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Text style={[s.backArrow, { color: colors.red }]}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Автоюрист ⚖️</Text>
          <Text style={s.headerSubtitle}>Правова допомога водіям</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: 16 }}
      >
        {/* ─── Contact CTA ────────────────────────────────────────────── */}
        <View style={[s.heroCard, { backgroundColor: colors.red }]}>
          <Text style={s.heroTitle}>Потрібна юридична допомога?</Text>
          <Text style={s.heroSubtitle}>
            Напишіть менеджеру — передамо запит юристу автошколи.
          </Text>
          <View style={s.ctaRow}>
            <Pressable style={s.ctaBtn} onPress={callLawyer}>
              <Text style={s.ctaBtnText}>💬 Написати</Text>
            </Pressable>
            <Pressable style={[s.ctaBtn, s.ctaBtnOutline]} onPress={openTelegram}>
              <Text style={[s.ctaBtnText, { color: colors.red }]}>✈️ Telegram</Text>
            </Pressable>
          </View>
        </View>

        {/* ─── Subscription note ──────────────────────────────────────── */}
        <View style={s.noticeCard}>
          <Text style={s.noticeTitle}>📋 Підписка на автоюриста</Text>
          <Text style={s.noticeText}>
            Щомісячна підписка з необмеженими консультаціями та викликом юриста на місце ДТП — у розробці.
            Слідкуйте за оновленнями.
          </Text>
        </View>

        {/* ─── Tab selector ───────────────────────────────────────────── */}
        <View style={s.tabRow}>
          <Pressable
            style={[s.tab, activeTab === "topics" && s.tabActive]}
            onPress={() => setActiveTab("topics")}
          >
            <Text style={[s.tabText, activeTab === "topics" && s.tabTextActive]}>
              Роз'яснення
            </Text>
          </Pressable>
          <Pressable
            style={[s.tab, activeTab === "templates" && s.tabActive]}
            onPress={() => setActiveTab("templates")}
          >
            <Text style={[s.tabText, activeTab === "templates" && s.tabTextActive]}>
              Шаблони
            </Text>
          </Pressable>
        </View>

        {/* ─── Legal topics ───────────────────────────────────────────── */}
        {activeTab === "topics" &&
          LEGAL_TOPICS.map((topic) => {
            const isOpen = expandedTopic === topic.id;
            return (
              <Pressable
                key={topic.id}
                style={s.topicCard}
                onPress={() => toggleTopic(topic.id)}
              >
                <View style={s.topicHeader}>
                  <Text style={{ fontSize: 22 }}>{topic.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.topicTitle}>{topic.title}</Text>
                    <Text style={s.topicSummary}>{topic.summary}</Text>
                  </View>
                  <Text style={[s.chevron, { color: colors.textTertiary }]}>
                    {isOpen ? "▲" : "▼"}
                  </Text>
                </View>
                {isOpen && (
                  <View style={s.topicDetails}>
                    <Text style={s.topicDetailsText}>{topic.details}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}

        {/* ─── Templates ──────────────────────────────────────────────── */}
        {activeTab === "templates" && (
          <>
            <View style={s.templatesHint}>
              <Text style={s.noticeTitle}>📋 Готові шаблони</Text>
              <Text style={s.noticeText}>
                Натисніть на шаблон, щоб розгорнути текст. Скопіюйте та заповніть свої дані у дужках.
              </Text>
            </View>
            {TEMPLATES.map((tpl) => {
              const isOpen = expandedTemplate === tpl.id;
              return (
                <View key={tpl.id} style={s.topicCard}>
                  <Pressable
                    style={s.topicHeader}
                    onPress={() => toggleTemplate(tpl.id)}
                  >
                    <Text style={s.topicTitle}>{tpl.title}</Text>
                    <Text style={[s.chevron, { color: colors.textTertiary }]}>
                      {isOpen ? "▲" : "▼"}
                    </Text>
                  </Pressable>
                  {isOpen && (
                    <View style={s.topicDetails}>
                      <Text
                        selectable
                        style={[s.topicDetailsText, s.templateText]}
                      >
                        {tpl.text}
                      </Text>
                      <Text style={s.selectHint}>↑ Утримуйте для копіювання тексту</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
    heroCard: {
      borderRadius: radii.lg,
      padding: 20,
      gap: 8,
    },
    heroTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
    heroSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 18 },
    ctaRow: { flexDirection: "row", gap: 10, marginTop: 4 },
    ctaBtn: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: radii.md,
      paddingVertical: 10,
      alignItems: "center",
    },
    ctaBtnOutline: {
      backgroundColor: "#fff",
    },
    ctaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
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
    tabRow: {
      flexDirection: "row",
      backgroundColor: colors.bgCard,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
    },
    tabActive: { backgroundColor: colors.red },
    tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" },
    tabTextActive: { color: "#fff" },
    topicCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    topicHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
    },
    topicTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
    topicSummary: { color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },
    chevron: { fontSize: 12 },
    topicDetails: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 14,
    },
    topicDetailsText: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    templateText: {
      fontFamily: (Platform.OS === "ios" ? "Menlo" : "monospace") as string,
      fontSize: 12,
      lineHeight: 18,
      backgroundColor: colors.bgElevated,
      padding: 10,
      borderRadius: radii.sm,
    },
    selectHint: {
      color: colors.textTertiary,
      fontSize: 11,
      marginTop: 8,
      textAlign: "center",
    },
    templatesHint: {
      borderRadius: radii.md,
      padding: 14,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
  });

