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
