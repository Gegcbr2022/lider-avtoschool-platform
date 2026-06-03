import { branches, retentionFeatures, samplePayments, sampleProgress, sampleSlots, services } from "@lider/shared";

export const student = {
  name: "Марія Коваль",
  initials: "МК",
  category: "B",
  manager: "Олена",
  phone: "050 321 44 80",
  referralCode: "LIDER-MK-2026"
} as const;

export const courseProgress = sampleProgress;

export const upcomingSlot = {
  ...sampleSlots[0],
  branch: branches.find((branch) => branch.id === sampleSlots[0].branchId)
};

export const mobileServices = services;

export const payments = samplePayments;

export const documents = [
  {
    id: "passport",
    title: "Паспорт",
    status: "Перевірено",
    detail: "Файл завантажено 30.05"
  },
  {
    id: "tax-id",
    title: "ІПН",
    status: "Очікує перевірку",
    detail: "Менеджер отримає сповіщення"
  },
  {
    id: "medical",
    title: "Медична довідка",
    status: "Потрібно додати",
    detail: "PDF або фото до 10 МБ"
  }
] as const;

export const notifications = [
  "Практичне заняття завтра о 17:00",
  "Нове домашнє завдання з теми перехрестя",
  "Оплата зарахована через LiqPay"
] as const;

export const onboardingSteps = [
  {
    title: "Документи",
    detail: "Медична довідка ще очікує завантаження"
  },
  {
    title: "Теорія",
    detail: "Наступний урок: проїзд перехресть"
  },
  {
    title: "Практика",
    detail: "Підтвердіть заняття з інструктором"
  }
] as const;

export const quickActions = [
  {
    title: "Завантажити довідку",
    detail: "PDF або фото до 10 МБ"
  },
  {
    title: "Написати менеджеру",
    detail: "Олена відповість у робочий час"
  },
  {
    title: "Запросити друга",
    detail: "Бонус для родини або знайомих після підтвердження заявки"
  },
  {
    title: "Чек-лист водія",
    detail: "Що перевірити перед першою самостійною поїздкою"
  }
] as const;

export const retentionSignals = [
  {
    title: "ПДР-повторення",
    detail: "3 короткі сесії цього тижня підтримують готовність до іспиту",
    status: "сьогодні",
    tone: "success"
  },
  {
    title: "Реферальний код",
    detail: `${student.referralCode} для друзів, які хочуть отримати права без хаосу`,
    status: "активний",
    tone: "success"
  },
  {
    title: "Документи",
    detail: "Медична довідка ще потрібна для повного комплекту",
    status: "увага",
    tone: "warning"
  }
] as const;

export const retentionRoadmap = retentionFeatures;

// ─── Driver Club ─────────────────────────────────────────────────────────────

export type DailyChallenge = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
};

export type DriverClubBadge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: string;
};

export type DriverClubStreak = {
  current: number;
  best: number;
  lastActiveDate: string;
};

export type ClubAwardGroup = "streak" | "tests" | "learning" | "practice" | "community" | "safety" | "graduation";

export type ClubAward = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  earnedAt?: string;
  group: ClubAwardGroup;
};

export type ClubMascotMood = "happy" | "excited" | "gentle-reminder" | "encouraging";

export type ClubMascot = {
  mood: ClubMascotMood;
  message: string;
  emoji: string;
};

export type ClubPost = {
  id: string;
  author: string;
  role: string;
  content: string;
  tag: string;
  tagColor: string;
  timeAgo: string;
  likes: number;
  hasLiked: boolean;
};

export const driverClubStreak: DriverClubStreak = {
  current: 4,
  best: 12,
  lastActiveDate: "2026-06-03"
};

export const todayChallenge: DailyChallenge = {
  id: "ch-2026-06-03",
  question: "На якій відстані від пішохідного переходу забороняється зупинка транспортного засобу?",
  options: ["5 м", "10 м", "15 м", "20 м"],
  correctIndex: 1,
  explanation: "Відповідно до ПДР, зупинка забороняється ближче ніж за 10 м до пішохідного переходу.",
  category: "Зупинка та стоянка"
};

export const clubBadges: DriverClubBadge[] = [
  { id: "first-test",   title: "Перший тест",     description: "Пройдено перший щоденний тест",       earned: true,  icon: "🏁" },
  { id: "streak-3",     title: "3 дні поспіль",   description: "Тренування 3 дні без перерви",        earned: true,  icon: "🔥" },
  { id: "streak-7",     title: "Тижень",           description: "7 днів регулярного тренування",       earned: false, icon: "⭐" },
  { id: "streak-30",    title: "Місяць",           description: "30 днів у Клубі водія",               earned: false, icon: "🏆" },
  { id: "referral-1",   title: "Перший друг",      description: "Один друг записався за вашим кодом",  earned: false, icon: "👥" },
  { id: "checklist",    title: "Готовий водій",    description: "Виконано чек-лист водія",             earned: false, icon: "✅" }
];

export const clubAwards: ClubAward[] = [
  {
    id: "first-start",
    title: "Перший старт",
    description: "Пройдено перший щоденний тест ПДР",
    icon: "🏁",
    earned: true,
    earnedAt: "2026-06-01",
    group: "tests"
  },
  {
    id: "streak-3",
    title: "Серія 3 дні",
    description: "3 дні поспіль у Клубі водія",
    icon: "🔥",
    earned: true,
    earnedAt: "2026-06-03",
    group: "streak"
  },
  {
    id: "streak-7",
    title: "Серія 7 днів",
    description: "7 днів регулярного навчання",
    icon: "⭐",
    earned: false,
    progress: 4,
    maxProgress: 7,
    group: "streak"
  },
  {
    id: "expert-sign",
    title: "Знак знавця",
    description: "10 правильних відповідей поспіль",
    icon: "🎯",
    earned: false,
    progress: 3,
    maxProgress: 10,
    group: "tests"
  },
  {
    id: "safe-driver",
    title: "Спокійний водій",
    description: "Пройшов блок про безпечне водіння",
    icon: "🛡️",
    earned: false,
    group: "safety"
  },
  {
    id: "parking-master",
    title: "Майстер паркування",
    description: "Пройшов тест про паркування на 100%",
    icon: "🅿️",
    earned: false,
    group: "tests"
  },
  {
    id: "friend-of-lider",
    title: "Друг Лідера",
    description: "Запросив друга за реферальним кодом",
    icon: "👥",
    earned: false,
    group: "community"
  },
  {
    id: "pdr-ninja",
    title: "ПДР-ніндзя",
    description: "Пройшов 50 тестів ПДР",
    icon: "🥷",
    earned: false,
    progress: 4,
    maxProgress: 50,
    group: "tests"
  },
  {
    id: "no-panic",
    title: "Без паніки",
    description: "Правильно вирішив ситуацію дня",
    icon: "😎",
    earned: false,
    group: "safety"
  },
  {
    id: "road-colleague",
    title: "Дорожній колега",
    description: "30 днів у Клубі водія",
    icon: "🏆",
    earned: false,
    progress: 4,
    maxProgress: 30,
    group: "streak"
  },
  {
    id: "theory-champion",
    title: "Чемпіон теорії",
    description: "100% у тижневому тесті",
    icon: "📚",
    earned: false,
    group: "tests"
  },
  {
    id: "graduate",
    title: "Випускник клубу",
    description: "Отримав права і залишився в додатку",
    icon: "🎓",
    earned: false,
    group: "graduation"
  },
  // ── Learning ──
  {
    id: "first-lesson",
    title: "Перший урок",
    description: "Перше практичне заняття пройдено",
    icon: "🚗",
    earned: false,
    group: "learning"
  },
  {
    id: "theory-no-panic",
    title: "Теорія без паніки",
    description: "Тиша. Спокій. 20 питань теорії без помилок.",
    icon: "🧘",
    earned: false,
    group: "learning"
  },
  // ── Practice ──
  {
    id: "started-no-stall",
    title: "Рушив без стресу",
    description: "Перший старт на підйомі — і ніякого глухання.",
    icon: "⛰️",
    earned: false,
    group: "practice"
  },
  {
    id: "city-done",
    title: "Місто пройдено",
    description: "Перша самостійна поїздка по місту завершена.",
    icon: "🏙️",
    earned: false,
    group: "practice"
  },
  {
    id: "traffic-light-samurai",
    title: "Світлофорний самурай",
    description: "Навіть миготливий жовтий — не проблема.",
    icon: "🚦",
    earned: false,
    group: "practice"
  },
  // ── Community ──
  {
    id: "club-voice",
    title: "Клубний голос",
    description: "Перший пост у клубній стрічці",
    icon: "💬",
    earned: false,
    group: "community"
  },
  {
    id: "first-story",
    title: "Перша історія",
    description: "Поширив свій успіх у Лідер Stories",
    icon: "📸",
    earned: false,
    group: "community"
  },
  {
    id: "100-reactions",
    title: "100 реакцій",
    description: "Твої пости зібрали 100 реакцій від клубу",
    icon: "❤️",
    earned: false,
    progress: 24,
    maxProgress: 100,
    group: "community"
  },
  // ── Post-license ──
  {
    id: "license-in-diia",
    title: "Права в Дії",
    description: "Посвідчення водія з'явилося в застосунку Дія",
    icon: "🪪",
    earned: false,
    group: "graduation"
  },
  {
    id: "my-first-car",
    title: "Моя перша машина",
    description: "Перша власна машина — і ти за кермом",
    icon: "🚙",
    earned: false,
    group: "graduation"
  },
  {
    id: "first-route",
    title: "Перший маршрут",
    description: "Перша самостійна поїздка без інструктора",
    icon: "🗺️",
    earned: false,
    group: "graduation"
  },
  // ── Streak extras ──
  {
    id: "streak-14",
    title: "Два тижні",
    description: "14 днів без перерви в Клубі водія",
    icon: "💫",
    earned: false,
    progress: 4,
    maxProgress: 14,
    group: "streak"
  },
  {
    id: "streak-100",
    title: "Сотня",
    description: "Серія 100 днів. Легенда клубу.",
    icon: "💯",
    earned: false,
    progress: 4,
    maxProgress: 100,
    group: "streak"
  }
];

export function getMascotState(streak: DriverClubStreak): ClubMascot {
  const { current, best } = streak;

  if (current === 0) {
    return {
      mood: "gentle-reminder",
      message: "Гей! Я Лідик — твій провідник у Клубі 🚗  Не страшно, якщо пропустив. Починаємо сьогодні!",
      emoji: "🚗"
    };
  }

  if (current >= best && best > 3) {
    return {
      mood: "excited",
      message: `Неймовірно! ${current} днів — це новий особистий рекорд! Я пишаюся тобою 🏆`,
      emoji: "🏆"
    };
  }

  if (current >= 7) {
    return {
      mood: "happy",
      message: `${current} днів поспіль! Ти справжній Дорожній Лідер. Так тримати! 🔥`,
      emoji: "🔥"
    };
  }

  if (current >= 3) {
    return {
      mood: "happy",
      message: `${current} дні поспіль — відмінний ритм! До рекорду ще ${best - current} днів 💪`,
      emoji: "⭐"
    };
  }

  return {
    mood: "encouraging",
    message: `День ${current}! Молодець, що повернувся 🚗  Кожен тест — крок до впевненого водіння.`,
    emoji: "🚗"
  };
}

export const clubFeedPosts: ClubPost[] = [
  {
    id: "post-situation-1",
    author: "Інструктор Віталій",
    role: "Інструктор • Київ",
    content: "Ситуація дня: їдете вулицею, попереду пішохідний перехід. Справа стоїть автобус. Хто має перевагу і як правильно діяти?",
    tag: "Ситуація",
    tagColor: "#e8f5ee",
    timeAgo: "2 год тому",
    likes: 14,
    hasLiked: false
  },
  {
    id: "post-reminder-1",
    author: "Автошкола Лідер",
    role: "Офіційний канал",
    content: "Нагадуємо: перевірте термін дії страховки ОСЦПВ. Без чинного поліса — штраф і ризик. Законодавчий мінімум — поліс на рік.",
    tag: "Нагадування",
    tagColor: "#fff8ec",
    timeAgo: "вчора",
    likes: 8,
    hasLiked: true
  },
  {
    id: "post-tip-1",
    author: "Інструктор Наталія",
    role: "Інструктор • Дніпро",
    content: "Порада: якщо боїтесь рушати на підйомі — потренуйтесь на пустому паркінгу. 20 хвилин щодня дають впевненість за тиждень.",
    tag: "Порада",
    tagColor: "#eaf4f1",
    timeAgo: "2 дні тому",
    likes: 22,
    hasLiked: false
  },
  {
    id: "post-graduate-1",
    author: "Марія К.",
    role: "Випускник • Категорія B • Київ",
    content: "Сьогодні отримала права! 🎉 Дякую інструктору і всьому клубу за підтримку. Наступний крок — перша самостійна поїздка.",
    tag: "Випускник",
    tagColor: "#f0edff",
    timeAgo: "3 дні тому",
    likes: 31,
    hasLiked: false
  },
  {
    id: "post-meme-1",
    author: "Андрій С.",
    role: "Учень • Краматорськ",
    content: "Не заглохнемо — медитуємо на зчепленні 🧘 5 хвилин вранці подумати про перший урок — і вже не страшно.",
    tag: "Мем",
    tagColor: "#fef3f2",
    timeAgo: "4 дні тому",
    likes: 44,
    hasLiked: false
  },
  {
    id: "post-news-1",
    author: "Автошкола Лідер",
    role: "Офіційний канал",
    content: "Новий набір у Краматорську — старт 10 червня. Категорії A, B, C. Менеджер на зв'язку: @LiderDriveBot 🚀",
    tag: "Новини",
    tagColor: "#e8f5ee",
    timeAgo: "5 днів тому",
    likes: 19,
    hasLiked: false
  }
];

export const driverChecklist = [
  { id: "docs",        title: "Документи",        detail: "Посвідчення, техпаспорт, страховка",            done: true  },
  { id: "insurance",   title: "Страховка",         detail: "Перевірте термін дії ОСЦПВ",                   done: false },
  { id: "tyres",       title: "Шини",              detail: "Відповідний сезон і тиск",                     done: false },
  { id: "lights",      title: "Освітлення",        detail: "Перевірити ближнє/далеке та стоп-сигнали",      done: false },
  { id: "mirrors",     title: "Дзеркала",          detail: "Відрегульовані перед кожною поїздкою",          done: true  },
  { id: "phone",       title: "Телефон",           detail: "Тільки hands-free або тримач",                 done: true  }
] as const;

export const roadTips = [
  "У дощову погоду збільшуйте дистанцію вдвічі — гальмівний шлях зростає.",
  "Слідкуйте за знаком 5.47 (зупинка заборонена) і 5.48 (стоянка заборонена) — їх легко сплутати.",
  "На знак «Головна дорога» завжди пам'ятайте: він діє до наступного перехрестя.",
  "Перевіряйте тиск шин раз на місяць — низький тиск збільшує витрату пального на 3–5%.",
  "Режим «Eco» — корисний у місті, але на трасі він може гальмувати відклик двигуна."
] as const;

export const testCategories = [
  "Знаки",
  "Розмітка",
  "Перехрестя",
  "Пріоритет",
  "Зупинка",
  "Стоянка",
  "Безпека",
  "Швидкість",
  "Обгін"
] as const;

// ─── Stories ─────────────────────────────────────────────────────────────────

export type StoryTone = "green" | "yellow" | "red" | "dark";

export type ClubStory = {
  id: string;
  authorName: string;
  initials: string;
  city?: string;
  caption: string;
  musicTitle?: string;
  reactions: number;
  createdAt: string;
  tags: string[];
  templateId?: string;
  tone: StoryTone;
};

export const storyToneColors: Record<StoryTone, string> = {
  green:  "#004d40",
  yellow: "#a07800",
  red:    "#b91c1c",
  dark:   "#1a1a1a",
};

export const storyToneBg: Record<StoryTone, string> = {
  green:  "#004d40",
  yellow: "#ffd600",
  red:    "#e53e3e",
  dark:   "#1a1a1a",
};

export const mockMusicTracks = [
  { id: "drive-mood",   title: "Drive Mood"         },
  { id: "first-ride",   title: "First Ride"          },
  { id: "misto-che",    title: "Місто чекає"         },
  { id: "no-panic",     title: "No Panic Parking"    },
  { id: "prava-v-dii",  title: "Права в Дії"         },
] as const;

export const storyTemplates = [
  { id: "theory-passed",  label: "Я склав теорію",        emoji: "📚", tone: "green"  as StoryTone },
  { id: "first-lesson",   label: "Мій перший урок",       emoji: "🚗", tone: "dark"   as StoryTone },
  { id: "got-license",    label: "Я отримав права",       emoji: "🎓", tone: "yellow" as StoryTone },
  { id: "my-car",         label: "Моя машина",             emoji: "🚙", tone: "green"  as StoryTone },
  { id: "parking-won",    label: "Паркування переможено", emoji: "🅿️", tone: "red"    as StoryTone },
  { id: "tip-newbie",     label: "Порада новачкам",        emoji: "💡", tone: "yellow" as StoryTone },
] as const;

export const mockStories: ClubStory[] = [
  {
    id: "s1", authorName: "Марія", initials: "М", city: "Київ",
    caption: "Здала теорію з першого разу! 🎉",
    musicTitle: "Drive Mood", reactions: 24, createdAt: "2026-06-03",
    tags: ["теорія"], tone: "green", templateId: "theory-passed"
  },
  {
    id: "s2", authorName: "Олег", initials: "О", city: "Дніпро",
    caption: "Перша поїздка містом. Місто відкрилося по-новому!",
    musicTitle: "Місто чекає", reactions: 41, createdAt: "2026-06-03",
    tags: ["практика"], tone: "dark"
  },
  {
    id: "s3", authorName: "Аня", initials: "А", city: "Краматорськ",
    caption: "Права вже в Дії 🪪",
    reactions: 38, createdAt: "2026-06-02",
    tags: ["права"], tone: "yellow", templateId: "got-license"
  },
  {
    id: "s4", authorName: "Вова", initials: "В", city: "Слов'янськ",
    caption: "Паркування більше не страшне. Бос рівня пройдено!",
    musicTitle: "No Panic Parking", reactions: 19, createdAt: "2026-06-02",
    tags: ["паркування"], tone: "red", templateId: "parking-won"
  },
  {
    id: "s5", authorName: "Настя", initials: "Н", city: "Київ",
    caption: "Моя перша машина. Категорія B — це свобода.",
    reactions: 55, createdAt: "2026-06-01",
    tags: ["машина"], tone: "green", templateId: "my-car"
  },
];

// ─── Mascot states ────────────────────────────────────────────────────────────

export type MascotStateId =
  | "loading" | "error" | "empty" | "lost-streak"
  | "success" | "no-internet" | "test-failed" | "test-passed" | "story-posted";

export type MascotStateConfig = {
  emoji: string;
  title: string;
  message: string;
};

export const mascotStates: Record<MascotStateId, MascotStateConfig> = {
  loading:        { emoji: "🚗",  title: "Лідик їде...",      message: "Трохи терпіння — завантажуємо твій клуб." },
  error:          { emoji: "🚧",  title: "Ой, конус!",         message: "Лідик загубив конус. Спробуй ще раз." },
  empty:          { emoji: "🅿️",  title: "Тут ще пусто",      message: "Перший запис — найважчий. Ти вже в клубі!" },
  "lost-streak":  { emoji: "😔",  title: "Серія перервана",    message: "Не страшно, навіть інструктори колись глохли на старті. Починаємо знову!" },
  success:        { emoji: "🏁",  title: "Так тримати!",       message: "Лідик пишається тобою. Ще один крок до впевненого водіння." },
  "no-internet":  { emoji: "📡",  title: "Немає зв'язку",     message: "Лідик чекає сигналу. Перевір інтернет і спробуй знову." },
  "test-failed":  { emoji: "😤",  title: "Наступного разу!",  message: "Права люблять тих, хто повторює ПДР по 1 хвилині. Ще раз?" },
  "test-passed":  { emoji: "🔥",  title: "Правильно!",         message: "Лідик задоволений. Завтра новий тест — серія продовжується." },
  "story-posted": { emoji: "🎉",  title: "Поширено!",          message: "Твоя історія — натхнення для інших учнів." },
};

// ─── Mascot AI assistant ──────────────────────────────────────────────────────

export const mascotQuickPrompts = [
  "Поясни це правило ПДР",
  "Дай тест на 1 хвилину",
  "Як не боятися першого уроку?",
  "Що взяти на практику?",
  "Як підготуватися до іспиту?",
] as const;

export const mascotAiResponses: Record<string, string> = {
  "Поясни це правило ПДР": "Я поясню! Перейди на вкладку «Тести» — після відповіді є кнопка «Пояснити». Лідик розбере правило простими словами. 📚",
  "Дай тест на 1 хвилину": "Йдемо на «Тести» → «Почати тренування». Режим «5 питань» ідеальний перед сном або в дорозі. Удачі! 🚦",
  "Як не боятися першого уроку?": "Скажи інструктору, що це перший раз — вони це чули тисячу разів 😄  Дихай. Ти вже в Лідер Клубі — значить, готовий! 🚗",
  "Що взяти на практику?": "Документи + підтвердження запису. Зручне взуття без каблуків. Пляшка води. І хорошу музику на дорогу туди 🎵",
  "Як підготуватися до іспиту?": "За тиждень: 1 тест-екзамен на день. Звертай увагу на помилки — вони вилазять на іспиті. Серія тренувань важливіша за зубріння! 🏁",
};

// ─── Club threads (Threads/X-like community) ─────────────────────────────────

export type ClubThreadAuthorRole = "student" | "graduate" | "instructor" | "school";

export type ClubThreadPost = {
  id: string;
  authorName: string;
  authorInitials: string;
  role: ClubThreadAuthorRole;
  text: string;
  tags: string[];
  reactions: { like: number; fire: number; clap: number };
  commentsCount: number;
  createdAt: string;
};

export const clubThreadPosts: ClubThreadPost[] = [
  {
    id: "t1", authorName: "Інструктор Віталій", authorInitials: "В", role: "instructor",
    text: "Ситуація дня: їдете вулицею, попереду перехід. Справа стоїть автобус. Хто має перевагу? 🤔",
    tags: ["ситуація", "пріоритет"],
    reactions: { like: 14, fire: 8, clap: 3 }, commentsCount: 7,
    createdAt: "2026-06-03T10:00:00Z"
  },
  {
    id: "t2", authorName: "Автошкола Лідер", authorInitials: "Л", role: "school",
    text: "Нагадуємо: перевірте страховку ОСЦПВ. Без чинного поліса — штраф. Термін на рік — мінімум. 📄",
    tags: ["нагадування", "страховка"],
    reactions: { like: 8, fire: 2, clap: 12 }, commentsCount: 3,
    createdAt: "2026-06-02T15:00:00Z"
  },
  {
    id: "t3", authorName: "Інструктор Наталія", authorInitials: "Н", role: "instructor",
    text: "Боїтесь рушати на підйомі? 20 хвилин на пустому паркінгу щодня — і за тиждень впевненість гарантована 🚗",
    tags: ["порада", "практика"],
    reactions: { like: 22, fire: 18, clap: 9 }, commentsCount: 11,
    createdAt: "2026-06-01T12:00:00Z"
  },
  {
    id: "t4", authorName: "Марія К.", authorInitials: "М", role: "graduate",
    text: "Сьогодні отримала права! 🎉 Для всіх хто ще навчається: воно варте того. Перша самостійна поїздка — окремий кайф.",
    tags: ["права", "випускник"],
    reactions: { like: 31, fire: 25, clap: 14 }, commentsCount: 16,
    createdAt: "2026-05-31T18:00:00Z"
  },
  {
    id: "t5", authorName: "Андрій С.", authorInitials: "А", role: "student",
    text: "Не заглохнемо — медитуємо на зчепленні 🧘 Серйозно, 5 хвилин вранці подумати про перший урок — і вже не страшно.",
    tags: ["мем", "лайфхак"],
    reactions: { like: 44, fire: 31, clap: 18 }, commentsCount: 22,
    createdAt: "2026-05-30T09:00:00Z"
  },
  {
    id: "t6", authorName: "Автошкола Лідер", authorInitials: "Л", role: "school",
    text: "Новий набір у Краматорську — старт 10 червня. Категорії A, B, C. Менеджер на зв'язку в Telegram: @LiderDriveBot 🚀",
    tags: ["набір", "краматорськ"],
    reactions: { like: 19, fire: 12, clap: 7 }, commentsCount: 5,
    createdAt: "2026-05-29T14:00:00Z"
  },
];

// ─── Music for Stories ────────────────────────────────────────────────────────

export type StoryMusicSource = "local" | "royalty_free" | "spotify_link" | "apple_music_link" | "custom_upload";

export type StoryMusicTrack = {
  id: string;
  title: string;
  artist?: string;
  source: StoryMusicSource;
  previewUrl?: string;
  externalUrl?: string;
  durationSec?: number;
  license: "mock" | "royalty_free" | "licensed" | "external_link_only";
  mood: "drive" | "calm" | "victory" | "city" | "meme";
};

export const storyMusicTracks: StoryMusicTrack[] = [
  { id: "drive-mood",   title: "Drive Mood",       artist: "Mock Track",  source: "local",        durationSec: 30, license: "mock", mood: "drive"   },
  { id: "first-ride",   title: "First Ride",        artist: "Mock Track",  source: "local",        durationSec: 28, license: "mock", mood: "calm"    },
  { id: "misto-che",    title: "Місто чекає",       artist: "Mock Track",  source: "local",        durationSec: 32, license: "mock", mood: "city"    },
  { id: "no-panic",     title: "No Panic Parking",  artist: "Mock Track",  source: "local",        durationSec: 25, license: "mock", mood: "meme"    },
  { id: "prava-v-dii",  title: "Права в Дії",       artist: "Mock Track",  source: "local",        durationSec: 30, license: "mock", mood: "victory" },
  { id: "pixabay-road", title: "Road Trip",         artist: "Pixabay",     source: "royalty_free", durationSec: 60, license: "royalty_free", mood: "drive", externalUrl: "https://pixabay.com/music" },
];
