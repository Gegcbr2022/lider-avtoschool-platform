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
    mapQuery: "Київ Борщагівська 154А ТРК Аркадія",
    workingHours: "Пн-Сб 09:00-18:00",
    routeUrl: "https://maps.google.com/?q=Київ Борщагівська 154А ТРК Аркадія"
  },
  {
    id: "sloviansk",
    city: "Слов'янськ",
    address: "вул. Центральна, 39",
    phone: "0508050838",
    mapQuery: "Слов'янськ Центральна 39",
    workingHours: "Пн-Сб 09:00-18:00",
    routeUrl: "https://maps.google.com/?q=Слов'янськ Центральна 39"
  },
  {
    id: "kramatorsk",
    city: "Краматорськ",
    address: "вул. Ювілейна, 56",
    phone: "0504233022",
    mapQuery: "Краматорськ Ювілейна 56",
    workingHours: "Пн-Сб 09:00-18:00",
    routeUrl: "https://maps.google.com/?q=Краматорськ Ювілейна 56"
  },
  {
    id: "dnipro",
    city: "Дніпро",
    address: "вул. Олександра Поля, 82Г",
    phone: "0504229202",
    mapQuery: "Дніпро Олександра Поля 82Г",
    workingHours: "Пн-Сб 09:00-18:00",
    routeUrl: "https://maps.google.com/?q=Дніпро Олександра Поля 82Г"
  },
  {
    id: "dobropillia",
    city: "Добропілля",
    address: "проспект Шевченка, 1А",
    phone: "0504233032",
    mapQuery: "Добропілля проспект Шевченка 1А",
    workingHours: "Пн-Сб 09:00-18:00",
    routeUrl: "https://maps.google.com/?q=Добропілля проспект Шевченка 1А"
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
    minimumAge: "з 16 років",
    summary: "Курс для мотоциклів: теорія, підготовка до іспиту, супровід документів і зрозумілий старт практики.",
    outcomes: ["9 тижнів", "з 16 років", "від 4 000 грн*"]
  },
  {
    id: "cat-a1",
    title: "Категорія A1",
    category: "A1",
    retraining: false,
    duration: "9 тижнів",
    priceFrom: 4000,
    minimumAge: "з 16 років",
    summary: "Підготовка для легких мотоциклів і скутерів: онлайн-лекції, тести, документи й підтримка до ТСЦ.",
    outcomes: ["9 тижнів", "з 16 років", "від 4 000 грн*"]
  },
  {
    id: "cat-b",
    title: "Категорія B",
    category: "B",
    retraining: false,
    duration: "10 тижнів",
    priceFrom: 6500,
    minimumAge: "з 18 років",
    summary: "Найпопулярніша програма для легкового авто: теорія, матеріали, підбір практики й підтримка до іспиту.",
    outcomes: ["10 тижнів", "з 18 років", "від 6 500 грн*"]
  },
  {
    id: "cat-c",
    title: "Категорія C",
    category: "C",
    retraining: false,
    duration: "13 тижнів",
    priceFrom: 7500,
    minimumAge: "з 18 років",
    summary: "Підготовка водіїв вантажного транспорту з акцентом на безпеку, документи та практичний іспит.",
    outcomes: ["13 тижнів", "з 18 років", "від 7 500 грн*"]
  },
  {
    id: "cat-ce",
    title: "Категорія CE",
    category: "CE",
    retraining: false,
    duration: "до 6 тижнів",
    priceFrom: 7500,
    minimumAge: "з 19 років",
    condition: "Під час воєнного стану підтвердження стажу для CE скасовано.",
    summary: "Професійний курс для роботи з причепами та складними транспортними засобами.",
    outcomes: ["до 6 тижнів", "з 19 років", "від 7 500 грн*"]
  },
  {
    id: "retraining-a",
    title: "Перепідготовка A",
    category: "A",
    retraining: true,
    duration: "10 робочих днів",
    priceFrom: 2500,
    condition: "За наявності категорії B, C або C1.",
    summary: "Короткий курс для відкриття категорії A за наявності посвідчення B, C або C1.",
    outcomes: ["10 робочих днів", "за наявності B/C/C1", "від 2 500 грн*"]
  },
  {
    id: "retraining-a1",
    title: "Перепідготовка A1",
    category: "A1",
    retraining: true,
    duration: "10 робочих днів",
    priceFrom: 2500,
    condition: "За наявності категорії B, C або C1.",
    summary: "Курс перепідготовки для легких мотоциклів і скутерів за наявності іншої категорії.",
    outcomes: ["10 робочих днів", "за наявності B/C/C1", "від 2 500 грн*"]
  },
  {
    id: "retraining-b",
    title: "Перепідготовка B",
    category: "B",
    retraining: true,
    duration: "10 робочих днів",
    priceFrom: 3000,
    condition: "За наявності категорії C або C1.",
    summary: "Короткий курс для відкриття B за наявності вантажної категорії та швидкого повернення впевненості.",
    outcomes: ["10 робочих днів", "за наявності C/C1", "від 3 000 грн*"]
  },
  {
    id: "retraining-c",
    title: "Перепідготовка C",
    category: "C",
    retraining: true,
    duration: "10 тижнів",
    priceFrom: 7500,
    condition: "За наявності категорії A або B.",
    summary: "Перепідготовка на вантажний транспорт для водіїв з відкритими категоріями A або B.",
    outcomes: ["10 тижнів", "за наявності A/B", "від 7 500 грн*"]
  }
];

export const priceFootnote =
  "Ціни актуальні для філій Донецької області. Для інших областей України вартість уточнюється у регіональних представників." as const;

export const admissionDocuments = [
  "Паспорт: 1, 2 сторінки та сторінка з реєстрацією або фото ID-карти з обох сторін.",
  "Довідка з місцем реєстрації.",
  "Ідентифікаційний код.",
  "Медична довідка.",
  "4 кольорові фотографії 3,5 x 4,5."
] as const;

export const importantStudyNotes = [
  "Якщо після навчання учень не склав іспити в Сервісному Центрі, документ про закінчення автошколи дійсний протягом 2 років.",
  "У цей період можна отримати права в будь-якому Сервісному Центрі України без повторного проходження навчання.",
  "Права, отримані у «Лідера», автоматично з'являються у застосунку ДІЯ."
] as const;

export const pridePhotos = [
  {
    src: "/images/pride/pride-group-entrance.jpg",
    title: "Гордість Лідера",
    caption: "Наші випускники після успішного етапу навчання."
  },
  {
    src: "/images/pride/pride-driver-car.jpg",
    title: "Права отримано",
    caption: "Ще один водій впевнено робить перший самостійний крок."
  },
  {
    src: "/images/pride/pride-window-card.jpg",
    title: "Свій результат",
    caption: "Навчання завершується не папером, а відчуттям свободи."
  },
  {
    src: "/images/pride/pride-winter-student.jpg",
    title: "Наш випускник",
    caption: "Без вигаданих історій - просто реальні люди з реальним результатом."
  },
  {
    src: "/images/pride/pride-student-card.jpg",
    title: "Ще один крок",
    caption: "Підтримка автошколи поруч до фінального іспиту."
  },
  {
    src: "/images/pride/pride-young-driver.jpg",
    title: "Перші права",
    caption: "Категорія обрана, навчання пройдено, посвідчення в руках."
  },
  {
    src: "/images/pride/pride-certificate.jpg",
    title: "Результат команди",
    caption: "За кожним фото - робота інструктора, менеджера і самого учня."
  },
  {
    src: "/images/pride/pride-christmas-card.jpg",
    title: "Права отримано",
    caption: "Маленька картка, яка відкриває багато нових маршрутів."
  }
] as const;

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
    text: "Після успішного складання учень отримує права, а автошкола зберігає результат в історії випускника."
  }
] as const;

export const commercialAdvantages = [
  "Перший контакт без очікування: форма, Telegram і callback-заявка швидко приводять до консультації.",
  "Прозорі ціни на теорію і зрозуміле пояснення практичної частини для кожного міста.",
  "Онлайн-теорія, записи уроків і тренажер ПДР доступні з будь-якого місця.",
  "Філії, інструктори, документи, оплата та практика зібрані в одному зручному сервісі.",
  "Команда працює з категоріями A, A1, B, C, CE і перепідготовкою."
] as const;

export const socialLinks = [
  {
    id: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/groups/1968049130093845/",
    description: "спільнота учнів, новини наборів і живі обговорення"
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://instagram.com/lider_avtoshkola__/",
    description: "фото занять, випускників, автопарку та щоденні сторіс"
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://youtube.com/channel/UCc-RYjq2PWSPmX12hdWvQBw/featured",
    description: "відео про навчання, ПДР, маршрути і підготовку до іспиту"
  },
  {
    id: "telegram",
    label: "Telegram",
    href: "https://t.me/LiderDriveBot?start=AYYUTE",
    description: "швидкий запис, повідомлення менеджера і нагадування"
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "whatsapp://send/?phone=380504233022",
    description: "зручний канал для консультації в месенджері та передачі контакту менеджеру"
  }
] as const;

export const socialProofStats = [
  { value: "15 000+", label: "випускників", detail: "підтверджений масштаб діючого бренду" },
  { value: "10+ років", label: "навчання водіїв", detail: "стабільна команда і відпрацьовані процеси" },
  { value: "4.9/5", label: "середня оцінка", detail: "за відгуками учнів у цифрових каналах" },
  { value: "5 міст", label: "філіальна мережа", detail: "Київ, Дніпро, Слов'янськ, Краматорськ, Добропілля" }
] as const;

export const graduateStories = [
  {
    id: "graduate-maria",
    name: "Марія Коваль",
    initials: "МК",
    city: "Київ",
    category: "B",
    date: "28 травня 2026",
    badge: "Склала з першої спроби",
    photoTone: "from-[#e9f7ef] via-[#d7f0e3] to-[#ffd600]",
    quote: "Онлайн-теорія допомогла не випадати з графіка, а інструктор спокійно провів через складні маршрути."
  },
  {
    id: "graduate-andrii",
    name: "Андрій Шевченко",
    initials: "АШ",
    city: "Дніпро",
    category: "C",
    date: "24 травня 2026",
    badge: "Вантажна категорія для роботи",
    photoTone: "from-[#eaf4f1] via-[#b9d9cf] to-[#004d40]",
    quote: "Потрібна була вантажна категорія для роботи. Найбільше сподобався чіткий план і нагадування по документах."
  },
  {
    id: "graduate-oksana",
    name: "Оксана Романюк",
    initials: "ОР",
    city: "Краматорськ",
    category: "A1",
    date: "19 травня 2026",
    badge: "Повернула впевненість",
    photoTone: "from-[#fff6bf] via-[#f9fcfa] to-[#b9d9cf]",
    quote: "Тести в кабінеті показували слабкі теми, тому на іспит йшла вже без паніки."
  },
  {
    id: "graduate-serhii",
    name: "Сергій Данилюк",
    initials: "СД",
    city: "Слов'янськ",
    category: "CE",
    date: "15 травня 2026",
    badge: "Перепідготовка CE",
    photoTone: "from-[#0f1714] via-[#004d40] to-[#ffd600]",
    quote: "Практику підбирали під робочий графік. Усі дзвінки, слоти і платежі були зрозумілі."
  },
  {
    id: "graduate-anna",
    name: "Анна Мельник",
    initials: "АМ",
    city: "Добропілля",
    category: "B",
    date: "10 травня 2026",
    badge: "Перший самостійний маршрут",
    photoTone: "from-[#f7fbf9] via-[#d7f0e3] to-[#ffd600]",
    quote: "Філія поруч, менеджер завжди на зв'язку, а заняття можна було підлаштувати під роботу."
  },
  {
    id: "graduate-volodymyr",
    name: "Володимир Іванов",
    initials: "ВІ",
    city: "Київ",
    category: "A",
    date: "6 травня 2026",
    badge: "Мото з нуля",
    photoTone: "from-[#dbeafe] via-[#eaf4f1] to-[#004d40]",
    quote: "Категорію A пояснили без зайвої теорії: що потрібно, як скласти, коли починати практику."
  }
] as const;

export const graduateReviews = [
  {
    id: "review-anna",
    name: "Анна",
    city: "Київ",
    rating: 5,
    source: "відгук учня",
    text: "Сподобалося, що не довелося самій розбиратися з документами. Мені одразу пояснили порядок навчання, ціну і графік."
  },
  {
    id: "review-alina",
    name: "Аліна",
    city: "Дніпро",
    rating: 5,
    source: "відгук учня",
    text: "Інструктор дуже спокійний, практику планували за моїм графіком. Після тестів було видно, над чим працювати."
  },
  {
    id: "review-volodymyr",
    name: "Володимир",
    city: "Краматорськ",
    rating: 5,
    source: "відгук учня",
    text: "Потрібна була категорія для роботи, тому цінував чіткість: документи, оплата, заняття і підготовка до ТСЦ."
  },
  {
    id: "review-natalia",
    name: "Наталія",
    city: "Слов'янськ",
    rating: 5,
    source: "соцмережі",
    text: "Усе зібрано в одному місці: консультація, нагадування, теорія, практичні заняття і відповіді на питання."
  }
] as const;

export const mobileAppFeatures = [
  "ПДР-тести з поясненнями помилок і слабкими темами",
  "Запис на практику, нагадування і історія занять",
  "Документи, платежі, статус навчання і повідомлення менеджера",
  "Онлайн-помічник для категорій, філій, цін і підготовки до іспиту"
] as const;

export const retentionFeatures = [
  "Щоденні міні-тести ПДР на 5 хвилин.",
  "Прогрес навчання, слабкі теми й персональні нагадування.",
  "Клуб випускників з дорожніми підказками після отримання прав.",
  "Бонуси за рекомендації друзям і родині.",
  "Чек-листи водія: документи, сезонне обслуговування, перша поїздка.",
  "Оновлення правил, страхові пропозиції та корисні нагадування без спаму."
] as const;

export const appStoreLinks = {
  googlePlay: {
    label: "Google Play",
    status: "Скоро",
    href: ""
  },
  appStore: {
    label: "App Store",
    status: "Скоро",
    href: ""
  }
} as const;

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
  requestType: z
    .enum(["application", "callback", "consultation", "documents", "category-picker"])
    .default("application"),
  contactMethod: z.enum(["telegram", "phone", "whatsapp", "any"]).default("telegram"),
  documentFiles: z.array(z.string().max(160)).max(8).optional(),
  message: z.string().max(1400).optional()
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

export const aiLeadSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(9).max(30).optional(),
  telegram: z.string().max(80).optional(),
  city: z.string().min(2).max(80).optional(),
  category: z.enum(["A", "A1", "B", "C", "CE"]).optional(),
  question: z.string().max(1000).optional(),
  comment: z.string().max(1000).optional(),
  source: z.string().max(60).default("ai-chat")
});

export const aiChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1000)
});

export const aiChatRequestSchema = z.object({
  messages: z.array(aiChatMessageSchema).min(1).max(12),
  lead: aiLeadSchema.optional(),
  intent: z.enum(["consultation", "category-picker", "pdr-explain", "first-lesson"]).optional()
});
