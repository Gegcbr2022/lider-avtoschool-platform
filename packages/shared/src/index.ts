import { z } from "zod";
import type { BookingSlot, Branch, Lead, LessonProgress, Payment, ServiceCard } from "@lider/types";

export * from "./i18n";

export const siteBrand = {
  name: "Автошкола «Лідер»",
  shortName: "Лідер",
  email: "lideravtoshkola@gmail.com",
  defaultLocale: "uk-UA",
  phoneLabel: "050 738 30 33"
} as const;

export const branches: Branch[] = [
  {
    id: "kyiv",
    city: "Київ",
    address: "вул. Борщагівська, 154А, ТРК Аркадія",
    phone: "0507383033",
    mapQuery: "Київ Борщагівська 154А ТРК Аркадія"
  },
  {
    id: "sloviansk",
    city: "Слов'янськ",
    address: "вул. Центральна, 39",
    phone: "0508050838",
    mapQuery: "Слов'янськ Центральна 39"
  },
  {
    id: "kramatorsk",
    city: "Краматорськ",
    address: "вул. Ювілейна, 56",
    phone: "0504233022",
    mapQuery: "Краматорськ Ювілейна 56"
  },
  {
    id: "dnipro",
    city: "Дніпро",
    address: "вул. Олександра Поля, 82Г",
    phone: "0504229202",
    mapQuery: "Дніпро Олександра Поля 82Г"
  },
  {
    id: "dobropillia",
    city: "Добропілля",
    address: "проспект Шевченка, 1А",
    phone: "0504233032",
    mapQuery: "Добропілля проспект Шевченка 1А"
  }
];

export const services: ServiceCard[] = [
  {
    id: "cat-a",
    title: "Категорія A",
    category: "A",
    retraining: false,
    duration: "9 тижнів",
    priceFrom: 4000,
    summary: "Теоретичний курс для мотоциклів з підготовкою до іспиту та реєстрацією практичної частини.",
    outcomes: ["Онлайн-теорія", "ПДР-тести", "Підготовка до ТСЦ"]
  },
  {
    id: "cat-a1",
    title: "Категорія A1",
    category: "A1",
    retraining: false,
    duration: "9 тижнів",
    priceFrom: 4000,
    summary: "Курс для легких мотоциклів і скутерів з онлайн-лекціями, тестами та супроводом документів.",
    outcomes: ["Теорія онлайн", "Екзаменаційні тести", "Супровід документів"]
  },
  {
    id: "cat-b",
    title: "Категорія B",
    category: "B",
    retraining: false,
    duration: "10 тижнів",
    priceFrom: 6500,
    summary: "Повний теоретичний курс для легкових авто з LMS, онлайн-записом на практику та контролем прогресу.",
    outcomes: ["Особистий кабінет", "Календар практики", "Підтримка менеджера"]
  },
  {
    id: "cat-c",
    title: "Категорія C",
    category: "C",
    retraining: false,
    duration: "13 тижнів",
    priceFrom: 7500,
    summary: "Підготовка водіїв вантажного транспорту з акцентом на безпеку, документи та практичний іспит.",
    outcomes: ["Вантажний транспорт", "Документи онлайн", "Екзаменаційний режим"]
  },
  {
    id: "cat-ce",
    title: "Категорія CE",
    category: "CE",
    retraining: false,
    duration: "до 6 тижнів",
    priceFrom: 7500,
    summary: "Професійний курс для роботи з причепами та складними транспортними засобами.",
    outcomes: ["Практика з причепом", "Супровід документів", "Підготовка до роботи"]
  },
  {
    id: "retraining-a",
    title: "Перепідготовка A",
    category: "A",
    retraining: true,
    duration: "20 годин",
    priceFrom: 2500,
    summary: "Короткий курс для відкриття категорії A за наявності посвідчення B, C або C1.",
    outcomes: ["20 годин", "Індивідуальний план", "Підготовка до практики"]
  },
  {
    id: "retraining-a1",
    title: "Перепідготовка A1",
    category: "A1",
    retraining: true,
    duration: "20 годин",
    priceFrom: 2500,
    summary: "Курс перепідготовки для легких мотоциклів і скутерів за наявності іншої категорії.",
    outcomes: ["20 годин", "ПДР-тести", "Документи онлайн"]
  },
  {
    id: "retraining-b",
    title: "Перепідготовка B",
    category: "B",
    retraining: true,
    duration: "20 годин",
    priceFrom: 3000,
    summary: "Короткий курс для відновлення навичок і впевненості за кермом.",
    outcomes: ["Оцінка навичок", "Індивідуальний план", "Практика містом"]
  },
  {
    id: "retraining-c",
    title: "Перепідготовка C",
    category: "C",
    retraining: true,
    duration: "10 тижнів",
    priceFrom: 7500,
    summary: "Перепідготовка на вантажний транспорт для водіїв з відкритими категоріями A або B.",
    outcomes: ["Вантажний транспорт", "Супровід документів", "Підготовка до ТСЦ"]
  }
];

export const sampleLeads: Lead[] = [
  {
    id: "L-1048",
    name: "Марія Коваль",
    phone: "050 321 44 80",
    city: "Київ",
    category: "B",
    status: "consultation",
    source: "website",
    createdAt: "2026-05-30T09:20:00.000Z",
    manager: "Олена",
    nextAction: "Дзвінок о 16:00"
  },
  {
    id: "L-1047",
    name: "Андрій Шевченко",
    phone: "050 118 20 42",
    city: "Дніпро",
    category: "C",
    status: "paid",
    source: "telegram",
    createdAt: "2026-05-29T13:45:00.000Z",
    manager: "Ігор",
    nextAction: "Підтвердити документи"
  },
  {
    id: "L-1046",
    name: "Оксана Романюк",
    phone: "050 875 33 19",
    city: "Краматорськ",
    category: "A1",
    status: "new",
    source: "mobile",
    createdAt: "2026-05-29T08:10:00.000Z",
    manager: "Світлана",
    nextAction: "Призначити менеджера"
  }
];

export const sampleSlots: BookingSlot[] = [
  {
    id: "slot-1",
    branchId: "kyiv",
    instructor: "Віталій Мороз",
    vehicle: "Hyundai i30",
    startsAt: "2026-06-03T14:00:00.000Z",
    availableSeats: 1
  },
  {
    id: "slot-2",
    branchId: "dnipro",
    instructor: "Наталія Гнатюк",
    vehicle: "Renault Logan",
    startsAt: "2026-06-04T11:30:00.000Z",
    availableSeats: 2
  }
];

export const samplePayments: Payment[] = [
  {
    id: "P-502",
    provider: "liqpay",
    amount: 5000,
    currency: "UAH",
    status: "paid",
    studentName: "Марія Коваль",
    createdAt: "2026-05-30T10:05:00.000Z"
  },
  {
    id: "P-501",
    provider: "monobank",
    amount: 3500,
    currency: "UAH",
    status: "processing",
    studentName: "Андрій Шевченко",
    createdAt: "2026-05-29T15:42:00.000Z"
  }
];

export const sampleProgress: LessonProgress = {
  courseId: "course-b",
  title: "Категорія B",
  completedLessons: 12,
  totalLessons: 20,
  testScore: 84
};

export const learningSteps = [
  {
    number: "01",
    title: "Консультація і вибір категорії",
    text: "Менеджер допомагає обрати категорію, філію, формат теорії та зрозумілий графік старту."
  },
  {
    number: "02",
    title: "Документи без хаосу",
    text: "Учень отримує список документів, статус перевірки та нагадування у кабінеті або мобільному застосунку."
  },
  {
    number: "03",
    title: "Теорія онлайн або в групі",
    text: "Zoom-лекції, відеоматеріали, домашні завдання, ПДР-тести та контроль прогресу до теоретичного іспиту."
  },
  {
    number: "04",
    title: "Практика з інструктором",
    text: "Запис на вільні слоти, вибір філії, авто, коробки передач і push-нагадування перед заняттям."
  },
  {
    number: "05",
    title: "Підготовка до ТСЦ",
    text: "Фінальні тести, робота над слабкими темами, маршрути практики та супровід перед іспитом."
  },
  {
    number: "06",
    title: "Посвідчення водія",
    text: "Після успішного складання учень отримує права, а автошкола фіксує результат у CRM та історії випускника."
  }
] as const;

export const commercialAdvantages = [
  "Перший контакт без очікування: форма, Telegram і телефон ведуть у єдиний CRM-процес.",
  "Прозорі ціни на теорію і зрозуміле пояснення практичної частини для кожного міста.",
  "Онлайн-теорія, записи уроків і тренажер ПДР доступні з будь-якого місця.",
  "Філії, інструктори, документи, платежі та практика зібрані в одному цифровому контурі.",
  "Команда працює з категоріями A, A1, B, C, CE і перепідготовкою."
] as const;

export const graduateStories = [
  {
    id: "graduate-maria",
    name: "Марія Коваль",
    initials: "МК",
    city: "Київ",
    category: "B",
    date: "28 травня 2026",
    quote: "Онлайн-теорія допомогла не випадати з графіка, а інструктор спокійно провів через складні маршрути."
  },
  {
    id: "graduate-andrii",
    name: "Андрій Шевченко",
    initials: "АШ",
    city: "Дніпро",
    category: "C",
    date: "24 травня 2026",
    quote: "Потрібна була вантажна категорія для роботи. Найбільше сподобався чіткий план і нагадування по документах."
  },
  {
    id: "graduate-oksana",
    name: "Оксана Романюк",
    initials: "ОР",
    city: "Краматорськ",
    category: "A1",
    date: "19 травня 2026",
    quote: "Тести в кабінеті показували слабкі теми, тому на іспит йшла вже без паніки."
  },
  {
    id: "graduate-serhii",
    name: "Сергій Данилюк",
    initials: "СД",
    city: "Слов'янськ",
    category: "CE",
    date: "15 травня 2026",
    quote: "Практику підбирали під робочий графік. Усі дзвінки, слоти і платежі були зрозумілі."
  }
] as const;

export const instructorProfiles = [
  {
    name: "Віталій Мороз",
    city: "Київ",
    experience: "12 років",
    gearbox: "МКП / АКП",
    note: "Спокійна міська практика, маршрути ТСЦ і перші виїзди без стресу."
  },
  {
    name: "Наталія Гнатюк",
    city: "Дніпро",
    experience: "9 років",
    gearbox: "АКП",
    note: "Пояснює складні маневри простими кроками і працює з тривожністю новачків."
  },
  {
    name: "Ігор Литвин",
    city: "Краматорськ",
    experience: "15 років",
    gearbox: "C / CE",
    note: "Професійна підготовка для вантажних категорій і перепідготовки."
  }
] as const;

export const vehicleFleet = [
  {
    model: "Hyundai i30",
    category: "B",
    gearbox: "АКП",
    feature: "комфортна посадка і сучасні асистенти"
  },
  {
    model: "Renault Logan",
    category: "B",
    gearbox: "МКП",
    feature: "просте керування для відпрацювання базових навичок"
  },
  {
    model: "MAN навчальний",
    category: "C / CE",
    gearbox: "МКП",
    feature: "підготовка до професійних маршрутів і причепа"
  }
] as const;

export const homeFaq = [
  {
    question: "Чи можна почати навчання дистанційно?",
    answer: "Так. Теорію можна проходити онлайн, а практику планувати через менеджера або майбутній кабінет учня."
  },
  {
    question: "Скільки триває навчання на категорію B?",
    answer: "Орієнтовно 10 тижнів для теоретичної частини. Практика залежить від графіка, міста і кількості занять."
  },
  {
    question: "Чи допомагає автошкола з документами?",
    answer: "Так. Менеджер пояснює перелік документів, перевіряє статуси і нагадує про наступні кроки."
  },
  {
    question: "Чи можна обрати інструктора або коробку передач?",
    answer: "Так, під час консультації можна обговорити філію, інструктора, авто і механіку або автомат."
  }
] as const;

export const leadFormSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(9),
  city: z.string().min(2),
  category: z.enum(["A", "A1", "B", "C", "CE"]),
  branchId: z.string().min(2),
  message: z.string().max(1000).optional()
});

export const bookingRequestSchema = z.object({
  studentId: z.string().min(2),
  slotId: z.string().min(2),
  branchId: z.string().min(2)
});

export const paymentIntentSchema = z.object({
  studentId: z.string().min(2),
  provider: z.enum(["liqpay", "fondy", "monobank"]),
  amount: z.number().positive(),
  currency: z.literal("UAH")
});

export const aiProviderSchema = z.enum(["openai", "claude", "gemini", "openrouter", "local"]);
