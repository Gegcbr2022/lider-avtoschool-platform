import type { TrainingCategory } from "@lider/types";
import type { Locale } from "@lider/shared";

export type ContentPage = {
  slug: string;
  title: string;
  summary: string;
  eyebrow?: string;
  kind?: "standard" | "city" | "category" | "documents" | "pride" | "app" | "contacts" | "legal";
  branchId?: string;
  category?: TrainingCategory;
  highlights?: readonly string[];
  checklist?: readonly string[];
  cta?: string;
};

export const contentPages: readonly ContentPage[] = [
  {
    slug: "about",
    title: "Про нас",
    summary:
      "Найкраща автошкола України: понад 10 років досвіду, 15 000+ випускників, інструктор-чемпіон, власний автодром у Слов'янську та філіал у Краматорську.",
    eyebrow: "Про нас",
    highlights: ["10+ років досвіду", "15 000+ випускників", "Інструктор-чемпіон"],
    checklist: ["Команда професіоналів", "Власний автодром", "Реальні фото буднів"]
  },
  {
    slug: "branches",
    title: "Філіали",
    summary: "Адреси, графік роботи, контакти та маршрут до кожної філії.",
    eyebrow: "Міста навчання",
    highlights: ["5 активних філій", "Швидкий зв'язок", "Контакти і маршрути"],
    checklist: ["Оберіть найближче місто", "Зв'яжіться з менеджером", "Підготуйте документи"]
  },
  {
    slug: "categories",
    title: "Категорії",
    summary: "Окремі програми для A, A1, B, C, CE і перепідготовки.",
    eyebrow: "Програми навчання",
    highlights: ["A, A1, B, C, CE", "Перепідготовка", "ПДР-тренажер"],
    checklist: ["Порівняйте категорії", "Уточніть практику", "Залиште заявку"]
  },
  {
    slug: "prices",
    title: "Ціни",
    summary: "Прозорі пакети, часткова оплата, історія платежів і квитанції.",
    eyebrow: "Вартість навчання",
    highlights: ["Теорія від 4 000 грн", "Практика окремо", "Зручна оплата"],
    checklist: ["Оберіть категорію", "Уточніть місто", "Отримайте розрахунок"]
  },
  {
    slug: "documents",
    title: "Документи",
    summary: "Перелік документів, завантаження файлів і перевірка менеджером.",
    eyebrow: "Документи",
    kind: "documents",
    highlights: ["Паспорт", "ІПН", "Медична довідка"],
    checklist: ["Підготуйте копії", "Завантажте файли", "Дочекайтесь перевірки"]
  },
  {
    slug: "faq",
    title: "FAQ",
    summary: "Відповіді на часті питання про навчання, іспити, практику та оплату.",
    eyebrow: "Питання і відповіді",
    highlights: ["Формат навчання", "Іспити", "Оплата"],
    checklist: ["Перевірте умови", "Поставте питання менеджеру", "Забронюйте консультацію"]
  },
  {
    slug: "contacts",
    title: "Контакти",
    summary: "Телефони філій, email, Telegram і форма зворотного зв'язку.",
    eyebrow: "Зв'язок",
    kind: "contacts",
    highlights: ["Телефон", "Email", "Онлайн-заявка"],
    checklist: ["Оберіть філію", "Напишіть або залиште заявку", "Отримайте консультацію"]
  },
  {
    slug: "pride",
    title: "Гордість Лідера",
    summary: "Реальні випускники з правами: нейтральні підписи, живі фото і повага до людей у кадрі.",
    eyebrow: "Наша гордість",
    kind: "pride",
    highlights: ["Реальні фото", "Без вигаданих імен", "Адаптивна галерея"],
    checklist: ["Подивіться результати", "Оберіть категорію", "Залиште заявку"],
    cta: "Стати наступним випускником"
  },
  {
    slug: "news",
    title: "Новини",
    summary: "Оновлення автошколи, графіки наборів, акції та корисні повідомлення.",
    eyebrow: "Оновлення",
    highlights: ["Набори груп", "Акції", "Новини філій"],
    checklist: ["Стежте за наборами", "Перевіряйте акції", "Плануйте старт"]
  },
  {
    slug: "blog",
    title: "Блог",
    summary: "Матеріали про ПДР, підготовку до іспиту та безпечне керування.",
    eyebrow: "Корисні матеріали",
    highlights: ["ПДР", "Підготовка до іспиту", "Безпечне водіння"],
    checklist: ["Читайте теми", "Тренуйтесь у тестах", "Питайте інструктора"]
  },
  {
    slug: "reviews",
    title: "Відгуки",
    summary: "Історії студентів і результати навчання у філіях.",
    eyebrow: "Соціальний доказ",
    highlights: ["Випускники", "Історії учнів", "Результати"],
    checklist: ["Подивіться історії", "Оберіть філію", "Станьте наступним випускником"]
  },
  {
    slug: "online-application",
    title: "Онлайн-заявка",
    summary: "Швидкий запис на консультацію з вибором категорії та філії.",
    eyebrow: "Швидкий старт",
    highlights: ["1 хвилина", "Категорія і місто", "Відповідь менеджера"],
    checklist: ["Вкажіть контакт", "Оберіть категорію", "Отримайте відповідь"],
    cta: "Заповнити заявку"
  },
  {
    slug: "account",
    title: "Особистий кабінет",
    summary: "Профіль, прогрес, платежі, документи, заняття та сповіщення.",
    eyebrow: "Кабінет учня",
    highlights: ["Прогрес", "Практика", "Документи"],
    checklist: ["Стежте за уроками", "Записуйтесь на практику", "Перевіряйте платежі"]
  },
  {
    slug: "app",
    title: "Застосунок і клуб учня",
    summary: "Майбутній мобільний кабінет не закінчується після заявки: прогрес, ПДР, реферали, клуб випускників і корисні підказки.",
    eyebrow: "Мобільний формат",
    kind: "app",
    highlights: ["ПДР щодня", "Referral бонуси", "Клуб випускників"],
    checklist: ["Слідкуйте за прогресом", "Запрошуйте друзів", "Повертайтесь за підказками"],
    cta: "Дізнатися про застосунок"
  },
  {
    slug: "privacy",
    title: "Політика конфіденційності",
    summary: "Правила обробки персональних даних студентів і клієнтів.",
    eyebrow: "Дані і приватність",
    kind: "legal",
    highlights: ["Персональні дані", "Контактні дані", "Заявки"],
    checklist: ["Читайте правила", "Не передавайте паролі", "Звертайтесь для видалення даних"]
  },
  {
    slug: "offer",
    title: "Публічна оферта",
    summary: "Умови надання послуг, оплати, повернень і відповідальності сторін.",
    eyebrow: "Умови послуг",
    highlights: ["Оплата", "Повернення", "Права сторін"],
    checklist: ["Ознайомтесь з умовами", "Уточніть деталі", "Підтвердіть навчання"]
  },
  {
    slug: "terms",
    title: "Умови використання",
    summary: "Правила використання сайту, кабінету учня та мобільного застосунку.",
    eyebrow: "Правила платформи",
    kind: "legal",
    highlights: ["Сайт", "Кабінет", "Мобільний застосунок"],
    checklist: ["Користуйтесь сервісом коректно", "Захищайте доступ", "Повідомляйте про помилки"]
  },
  {
    slug: "avtoshkola-kyiv",
    title: "Автошкола Київ",
    summary: "Навчання водінню у Києві: категорії A, A1, B, C, CE, онлайн-теорія, практика і супровід документів.",
    eyebrow: "Навчання у місті",
    kind: "city",
    branchId: "kyiv",
    highlights: ["Філія біля ТРК Аркадія", "Онлайн-теорія", "Практика за графіком"],
    checklist: ["Оберіть категорію", "Уточніть найближчий набір", "Підготуйте документи"],
    cta: "Записатися у Києві"
  },
  {
    slug: "avtoshkola-dnipro",
    title: "Автошкола Дніпро",
    summary: "Курси водіння у Дніпрі з онлайн-теорією, практикою, підтримкою менеджера і підготовкою до іспиту.",
    eyebrow: "Навчання у місті",
    kind: "city",
    branchId: "dnipro",
    highlights: ["Філія на Олександра Поля", "Категорії B, C, CE", "Підтримка менеджера"],
    checklist: ["Оберіть філію", "Уточніть графік", "Залиште заявку"],
    cta: "Записатися у Дніпрі"
  },
  {
    slug: "avtoshkola-kramatorsk",
    title: "Автошкола Краматорськ",
    summary: "Автошкола у Краматорську: теорія, практика, категорії водіння, консультація і документи онлайн.",
    eyebrow: "Навчання у місті",
    kind: "city",
    branchId: "kramatorsk",
    highlights: ["Філія на Ювілейній", "Категорії A-CE", "Документи і консультація"],
    checklist: ["Залиште контакт", "Погодьте графік", "Почніть теорію"],
    cta: "Записатися у Краматорську"
  },
  {
    slug: "avtoshkola-sloviansk",
    title: "Автошкола Слов'янськ",
    summary: "Курси водіння у Слов'янську: онлайн-теорія, практика, підготовка до ТСЦ і підтримка менеджера.",
    eyebrow: "Навчання у місті",
    kind: "city",
    branchId: "sloviansk",
    highlights: ["Філія на Центральній", "Гнучкий старт", "Онлайн-теорія"],
    checklist: ["Оберіть категорію", "Підготуйте документи", "Запишіться на консультацію"],
    cta: "Записатися у Слов'янську"
  },
  {
    slug: "avtoshkola-dobropillia",
    title: "Автошкола Добропілля",
    summary: "Навчання водінню у Добропіллі: категорії, онлайн-теорія, практика і супровід до отримання прав.",
    eyebrow: "Навчання у місті",
    kind: "city",
    branchId: "dobropillia",
    highlights: ["Філія на проспекті Шевченка", "Категорії A-CE", "Підтримка документів"],
    checklist: ["Залиште заявку", "Уточніть графік", "Почніть навчання"],
    cta: "Записатися у Добропіллі"
  },
  {
    slug: "kategoriia-a",
    title: "Категорія A",
    summary: "Курс для мотоциклів: онлайн-теорія, ПДР-тести, документи і підготовка до іспиту.",
    eyebrow: "Категорія навчання",
    kind: "category",
    category: "A",
    highlights: ["9 тижнів", "Мотоцикли", "Підготовка до ТСЦ"],
    checklist: ["Перевірте документи", "Пройдіть теорію", "Заплануйте практику"],
    cta: "Записатися на категорію A"
  },
  {
    slug: "kategoriia-b",
    title: "Категорія B",
    summary: "Категорія B для легкових авто: онлайн-теорія, практика, інструктори, документи і ПДР-тренажер.",
    eyebrow: "Категорія навчання",
    kind: "category",
    category: "B",
    highlights: ["10 тижнів", "Легкові авто", "МКП / АКП"],
    checklist: ["Оберіть філію", "Пройдіть теорію", "Запишіться на практику"],
    cta: "Записатися на категорію B"
  },
  {
    slug: "kategoriia-c",
    title: "Категорія C",
    summary: "Підготовка водіїв вантажного транспорту: теорія, практика, документи і супровід до іспиту.",
    eyebrow: "Категорія навчання",
    kind: "category",
    category: "C",
    highlights: ["13 тижнів", "Вантажний транспорт", "Професійна підготовка"],
    checklist: ["Уточніть вимоги", "Пройдіть теорію", "Підготуйтеся до практики"],
    cta: "Записатися на категорію C"
  },
  {
    slug: "kategoriia-ce",
    title: "Категорія CE",
    summary: "Курс CE для керування вантажними авто з причепом: практика, документи і підготовка до ТСЦ.",
    eyebrow: "Категорія навчання",
    kind: "category",
    category: "CE",
    highlights: ["До 6 тижнів", "Причеп", "Професійний маршрут"],
    checklist: ["Уточніть базову категорію", "Підготуйте документи", "Заплануйте практику"],
    cta: "Записатися на категорію CE"
  }
] as const;

export type ContentPageSlug = (typeof contentPages)[number]["slug"];

type LocalizedPageFields = Partial<Pick<ContentPage, "title" | "summary" | "eyebrow" | "highlights" | "checklist" | "cta">>;

const localizedPages: Partial<Record<Locale, Record<string, LocalizedPageFields>>> = {
  ru: {
    about: {
      title: "О нас",
      summary:
        "Лучшая автошкола Украины: более 10 лет опыта, 15 000+ выпускников, инструктор-чемпион, собственный автодром в Славянске и филиал в Краматорске.",
      eyebrow: "О нас",
      highlights: ["10+ лет опыта", "15 000+ выпускников", "Инструктор-чемпион"],
      checklist: ["Команда профессионалов", "Собственный автодром", "Реальные фото будней"]
    },
    branches: {
      title: "Филиалы",
      summary: "Адреса, часы работы, контакты и маршрут до каждого филиала.",
      eyebrow: "Города обучения",
      highlights: ["5 активных филиалов", "Быстрая связь", "Контакты и маршруты"],
      checklist: ["Выберите ближайший город", "Свяжитесь с менеджером", "Подготовьте документы"]
    },
    categories: {
      title: "Категории",
      summary: "Программы для A, A1, B, C, CE и переподготовки: сроки, цены, возраст и условия.",
      eyebrow: "Программы обучения",
      highlights: ["A, A1, B, C, CE", "Переподготовка", "ПДР-тренажер"],
      checklist: ["Сравните категории", "Уточните практику", "Оставьте заявку"]
    },
    documents: {
      title: "Документы",
      summary: "Список документов для поступления, онлайн-подача файлов и проверка менеджером.",
      eyebrow: "Подготовка к старту",
      highlights: ["Паспорт", "ИНН", "Медицинская справка"],
      checklist: ["Подготовьте копии", "Загрузите файлы", "Дождитесь проверки"]
    },
    pride: {
      title: "Гордость Лидера",
      summary: "Реальные выпускники с правами: нейтральные подписи, живые фото и уважение к людям в кадре.",
      eyebrow: "Наша гордость",
      highlights: ["Реальные фото", "Без выдуманных имен", "Адаптивная галерея"],
      checklist: ["Посмотрите результаты", "Выберите категорию", "Оставьте заявку"],
      cta: "Стать следующим выпускником"
    },
    contacts: {
      title: "Контакты",
      summary: "Филиалы, Telegram-бот, форма заявки, обратная связь и удобный канал для консультации.",
      eyebrow: "Связь",
      highlights: ["Telegram", "Email", "Онлайн-заявка"],
      checklist: ["Выберите филиал", "Напишите или оставьте заявку", "Получите консультацию"]
    },
    app: {
      title: "Приложение и клуб ученика",
      summary: "Мобильный кабинет не заканчивается после заявки: прогресс, ПДР, рефералы, клуб выпускников и полезные подсказки.",
      eyebrow: "Мобильный формат",
      highlights: ["ПДР каждый день", "Referral-бонусы", "Клуб выпускников"],
      checklist: ["Следите за прогрессом", "Приглашайте друзей", "Возвращайтесь за подсказками"]
    },
    privacy: {
      title: "Политика конфиденциальности",
      summary: "Как автошкола обрабатывает контактные данные, заявки, документы и обращения.",
      eyebrow: "Данные и приватность"
    },
    terms: {
      title: "Условия использования",
      summary: "Правила использования сайта, форм заявки, кабинета ученика и будущего мобильного приложения.",
      eyebrow: "Правила платформы"
    },
    faq: {
      title: "FAQ",
      summary: "Ответы на частые вопросы об обучении, документах, экзаменах, практике и оплате."
    }
  },
  en: {
    about: {
      title: "About us",
      summary:
        "Ukraine's finest driving school: 10+ years of experience, 15,000+ graduates, a champion instructor, our own training ground in Sloviansk and a branch in Kramatorsk.",
      eyebrow: "About us",
      highlights: ["10+ years of experience", "15,000+ graduates", "A champion instructor"],
      checklist: ["A team of professionals", "Our own training ground", "Real photos of daily life"]
    },
    branches: {
      title: "Branches",
      summary: "Addresses, working hours, contacts and directions to each branch.",
      eyebrow: "Training cities",
      highlights: ["5 active branches", "Quick contact", "Contacts and directions"],
      checklist: ["Choose the nearest city", "Contact a manager", "Prepare documents"]
    },
    categories: {
      title: "Categories",
      summary: "Programs for A, A1, B, C, CE and retraining: duration, prices, age and conditions.",
      eyebrow: "Training programs",
      highlights: ["A, A1, B, C, CE", "Retraining", "Road rules practice"],
      checklist: ["Compare categories", "Clarify practice", "Send a request"]
    },
    documents: {
      title: "Documents",
      summary: "Admission document list, online file submission and manager verification.",
      eyebrow: "Start preparation",
      highlights: ["Passport or ID", "Tax number", "Medical certificate"],
      checklist: ["Prepare copies", "Upload files", "Wait for verification"]
    },
    pride: {
      title: "Leader Pride",
      summary: "Real graduates with driving licences: neutral captions, live photos and respect for people in frame.",
      eyebrow: "Our pride",
      highlights: ["Real photos", "No invented names", "Responsive gallery"],
      checklist: ["See results", "Choose a category", "Send a request"],
      cta: "Become the next graduate"
    },
    contacts: {
      title: "Contacts",
      summary: "Branches, Telegram bot, request form, callback and a convenient consultation channel.",
      eyebrow: "Contact",
      highlights: ["Telegram", "Email", "Online request"],
      checklist: ["Choose a branch", "Message us or send a request", "Get consultation"]
    },
    app: {
      title: "Student App and Club",
      summary: "The mobile cabinet does not end after the request: progress, road rules, referrals, graduate club and useful reminders.",
      eyebrow: "Mobile format",
      highlights: ["Daily road rules", "Referral bonuses", "Graduate club"],
      checklist: ["Track progress", "Invite friends", "Return for useful tips"]
    },
    privacy: {
      title: "Privacy Policy",
      summary: "How the driving school processes contact data, requests, documents and messages.",
      eyebrow: "Data and privacy"
    },
    terms: {
      title: "Terms of Use",
      summary: "Rules for using the website, request forms, student cabinet and future mobile app.",
      eyebrow: "Platform rules"
    },
    faq: {
      title: "FAQ",
      summary: "Answers to common questions about training, documents, exams, practice and payment."
    }
  }
};

export function getLocalizedContentPage(slug: string, locale: Locale) {
  const page = contentPages.find((item) => item.slug === slug);

  if (!page) {
    return undefined;
  }

  return {
    ...page,
    ...(localizedPages[locale]?.[slug] ?? {})
  };
}
