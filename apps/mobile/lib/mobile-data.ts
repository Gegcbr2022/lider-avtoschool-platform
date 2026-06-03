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

export type ClubAwardGroup = "streak" | "tests" | "community" | "safety" | "graduation";

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
