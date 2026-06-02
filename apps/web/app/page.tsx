import {
  admissionDocuments,
  appStoreLinks,
  branches,
  defaultLocale,
  graduateReviews,
  homeFaq,
  importantStudyNotes,
  locales,
  mobileAppFeatures,
  priceFootnote,
  pridePhotos,
  retentionFeatures,
  services,
  siteBrand,
  socialLinks,
  socialProofStats,
  type Locale,
} from "@lider/shared";
import { MetricCard, SectionHeader, StatusPill } from "@lider/ui";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  MapPinned,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { BrandLogo } from "../components/brand-logo";
import { BranchSelector } from "../components/branch-selector";
import { ConversionWidgets } from "../components/conversion-widgets";
import { FaqAccordion } from "../components/faq-accordion";
import { GraduateShowcase } from "../components/graduate-showcase";
import { LanguageSwitcher } from "../components/language-switcher";
import { LeadForm } from "../components/lead-form";
import { MobileMenu } from "../components/mobile-menu";
import { ReviewsCarousel } from "../components/reviews-carousel";
import { SocialIcon } from "../components/social-icon";
import { contentPages } from "../lib/site-pages";

const homeCopy: Record<
  Locale,
  {
    navItems: Array<{ href: string; label: string }>;
    heroBadge: string;
    heroTitle: string;
    heroText: string;
    heroHighlights: string[];
    primaryCta: string;
    telegramCta: string;
    headerCta: string;
  }
> = {
  uk: {
    navItems: [
      { href: "/categories", label: "Категорії" },
      { href: "/documents", label: "Документи" },
      { href: "/pride", label: "Гордість" },
      { href: "/branches", label: "Філіали" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Контакти" }
    ],
    heroBadge: "Підготовка до прав A, A1, B, C, CE",
    heroTitle: "Права без хаосу: чесний маршрут від заявки до посвідчення",
    heroText:
      "Автошкола «Лідер» допомагає обрати категорію, подати документи, пройти теорію й підготуватися до іспиту без зайвого шуму. Менеджер поруч, Telegram-бот поруч, план навчання зрозумілий.",
    heroHighlights: ["Заявка за 1 хвилину", "Документи можна подати онлайн", "Підтримка до ТСЦ"],
    primaryCta: "Залишити заявку",
    telegramCta: "Запис через Telegram",
    headerCta: "Запис у Telegram"
  },
  ru: {
    navItems: [
      { href: "/categories", label: "Категории" },
      { href: "/documents", label: "Документы" },
      { href: "/pride", label: "Гордость" },
      { href: "/branches", label: "Филиалы" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Контакты" }
    ],
    heroBadge: "Подготовка к правам A, A1, B, C, CE",
    heroTitle: "Права без хаоса: понятный путь от заявки до удостоверения",
    heroText:
      "Автошкола «Лидер» помогает выбрать категорию, подать документы, пройти теорию и подготовиться к экзамену без лишней суеты. Менеджер рядом, Telegram-бот рядом, план обучения понятный.",
    heroHighlights: ["Заявка за 1 минуту", "Документы можно подать онлайн", "Поддержка до сервисного центра"],
    primaryCta: "Оставить заявку",
    telegramCta: "Запись через Telegram",
    headerCta: "Запись в Telegram"
  },
  en: {
    navItems: [
      { href: "/categories", label: "Categories" },
      { href: "/documents", label: "Documents" },
      { href: "/pride", label: "Pride" },
      { href: "/branches", label: "Branches" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Contacts" }
    ],
    heroBadge: "Driving licence training A, A1, B, C, CE",
    heroTitle: "A clear route from request to driving licence",
    heroText:
      "Leader Driving School helps you choose a category, prepare documents, study theory and get ready for the exam with a clear plan, a real manager and Telegram support.",
    heroHighlights: ["1-minute request", "Documents can be sent online", "Support until the exam"],
    primaryCta: "Send request",
    telegramCta: "Apply via Telegram",
    headerCta: "Apply in Telegram"
  }
};

const sectionCopy: Record<
  Locale,
  {
    contactTitle: string;
    contactDesc: string;
    servicesEyebrow: string;
    servicesTitle: string;
    servicesDesc: string;
    serviceCta: string;
    telegramShort: string;
    priceLabel: string;
    documentsEyebrow: string;
    documentsTitle: string;
    documentsDesc: string;
    admissionTitle: string;
    afterTitle: string;
    benefitsEyebrow: string;
    benefitsTitle: string;
    benefitsDesc: string;
    benefitsCta: string;
    storyEyebrow: string;
    storyTitle: string;
    storyDesc: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryDesc: string;
    mobileEyebrow: string;
    mobileTitle: string;
    mobileDesc: string;
    afterExamTitle: string;
    afterExamDesc: string;
    prideEyebrow: string;
    prideTitle: string;
    prideDesc: string;
    prideNote: string;
    prideGalleryLink: string;
    graduatesEyebrow: string;
    graduatesTitle: string;
    graduatesDesc: string;
    resultEyebrow: string;
    resultTitle: string;
    resultDesc: string;
    branchesEyebrow: string;
    branchesTitle: string;
    branchesDesc: string;
    faqEyebrow: string;
    faqTitle: string;
    faqDesc: string;
    signupEyebrow: string;
    signupTitle: string;
    signupDesc: string;
    callbackLabel: string;
    footerDesc: string;
    footerPrivacy: string;
    footerTerms: string;
    nearestBranch: string;
  }
> = {
  uk: {
    contactTitle: "Швидкий контакт там, де вам зручно",
    contactDesc: "Поставте питання, забронюйте консультацію або одразу оберіть філіал. Всі кнопки великі й зручні для мобільного екрана.",
    servicesEyebrow: "Категорії та ціни",
    servicesTitle: "Оберіть програму під вашу ціль",
    servicesDesc: "Для першого авто, роботи, мотоцикла або відкриття додаткової категорії. Заявка займає менше хвилини.",
    serviceCta: "Заявка",
    telegramShort: "Telegram",
    priceLabel: "Вартість",
    documentsEyebrow: "Документи",
    documentsTitle: "Що потрібно для вступу",
    documentsDesc: "Менеджер підкаже список і допоможе підготувати все без зайвих дзвінків.",
    admissionTitle: "Документи для вступу",
    afterTitle: "Важливо знати після навчання",
    benefitsEyebrow: "Преміальний підхід без зайвої складності",
    benefitsTitle: "Не просто уроки, а зрозумілий маршрут до прав",
    benefitsDesc: "Ми прибрали зайвий шум: вам потрібні чітка ціна, нормальний графік, хороший інструктор і швидкий контакт з автошколою.",
    benefitsCta: "Отримати консультацію",
    storyEyebrow: "Як проходить навчання",
    storyTitle: "Більше життя на сторінці: заняття, майданчик, випускники",
    storyDesc: "Показуємо атмосферу навчання й реальні етапи, з яких складається шлях до водійського посвідчення.",
    galleryEyebrow: "Візуально про шлях",
    galleryTitle: "Кожен етап навчання видно, а не тільки описано",
    galleryDesc: "Більше реальних сцен для довіри: салон авто, знаки, практичний майданчик, посвідчення, онлайн-формат і щасливий фінал.",
    mobileEyebrow: "Мобільний формат",
    mobileTitle: "Слідкуйте за навчанням прямо з телефона",
    mobileDesc: "Розклад, нагадування, матеріали й корисні підказки мають бути поруч. Ми будуємо сервіс так, щоб учню було легко рухатися від заняття до заняття без зайвих дзвінків.",
    afterExamTitle: "Додаток має залишатися корисним і після іспиту",
    afterExamDesc: "Після отримання прав",
    prideEyebrow: "Гордість Лідера",
    prideTitle: "Реальні випускники з правами, а не красиві слова",
    prideDesc: "Щороку сотні учнів проходять шлях від першого заняття до посвідчення водія. Ось їхні обличчя й категорії — живий доказ, що маршрут справді спрацьовує.",
    prideNote: "Кожне посвідчення - це не «кейс», а чийсь новий рівень свободи: робота, родина, подорожі, перша самостійна дорога.",
    prideGalleryLink: "Вся галерея",
    graduatesEyebrow: "Відгуки",
    graduatesTitle: "Учні довіряють не обіцянкам, а спокійному процесу",
    graduatesDesc: "Що найчастіше цінують ті, хто пройшов навчання: зрозумілий план, підтримка менеджера, адекватний інструктор і жодного хаосу з документами.",
    resultEyebrow: "Результат",
    resultTitle: "Сильна школа відчувається в деталях",
    resultDesc: "Нам важливо, щоб учень розумів маршрут, бачив прогрес і мав поруч людей, які відповідають швидко та по суті.",
    branchesEyebrow: "Філіали",
    branchesTitle: "Оберіть місто та зручний маршрут",
    branchesDesc: "Активний філіал показує адресу, маршрут, графік і форму для швидкої заявки.",
    faqEyebrow: "FAQ",
    faqTitle: "Коротко про головне перед стартом",
    faqDesc: "Зібрали питання, які найчастіше ставлять перед записом: документи, строки, оплата, іспит і вибір категорії.",
    signupEyebrow: "Заявка",
    signupTitle: "Залиште контакт, і ми підберемо найкращий старт",
    signupDesc: "Менеджер уточнить категорію, місто, графік, ціну та найближчу групу. Можна попросити відповідь дзвінком, у Telegram або WhatsApp.",
    callbackLabel: "Зворотний дзвінок",
    footerDesc: "Курси водіння, практика, підготовка до іспиту та консультація щодо вибору категорії.",
    footerPrivacy: "Конфіденційність",
    footerTerms: "Умови",
    nearestBranch: "Найближчий філіал"
  },
  ru: {
    contactTitle: "Быстрый контакт там, где вам удобно",
    contactDesc: "Задайте вопрос, забронируйте консультацию или сразу выберите филиал. Все кнопки крупные и удобные для мобильного экрана.",
    servicesEyebrow: "Категории и цены",
    servicesTitle: "Выберите программу под вашу цель",
    servicesDesc: "Для первого авто, работы, мотоцикла или открытия дополнительной категории. Заявка занимает меньше минуты.",
    serviceCta: "Заявка",
    telegramShort: "Telegram",
    priceLabel: "Стоимость",
    documentsEyebrow: "Документы",
    documentsTitle: "Что нужно для поступления",
    documentsDesc: "Менеджер подскажет список и поможет подготовить всё без лишних звонков.",
    admissionTitle: "Документы для поступления",
    afterTitle: "Важно знать после обучения",
    benefitsEyebrow: "Премиальный подход без лишней сложности",
    benefitsTitle: "Не просто уроки, а понятный маршрут к правам",
    benefitsDesc: "Мы убрали лишний шум: нужны чёткая цена, нормальный график, хороший инструктор и быстрый контакт с автошколой.",
    benefitsCta: "Получить консультацию",
    storyEyebrow: "Как проходит обучение",
    storyTitle: "Больше жизни на странице: занятия, площадка, выпускники",
    storyDesc: "Показываем атмосферу обучения и реальные этапы, из которых складывается путь к водительскому удостоверению.",
    galleryEyebrow: "Визуально о пути",
    galleryTitle: "Каждый этап обучения виден, а не только описан",
    galleryDesc: "Больше реальных сцен для доверия: салон авто, знаки, учебная площадка, удостоверение, онлайн-формат и счастливый финал.",
    mobileEyebrow: "Мобильный формат",
    mobileTitle: "Следите за обучением прямо с телефона",
    mobileDesc: "Расписание, напоминания, материалы и полезные подсказки должны быть рядом. Мы строим сервис так, чтобы ученику было легко двигаться от занятия к занятию без лишних звонков.",
    afterExamTitle: "Приложение должно оставаться полезным и после экзамена",
    afterExamDesc: "После получения прав",
    prideEyebrow: "Гордость Лидера",
    prideTitle: "Реальные выпускники с правами, а не красивые слова",
    prideDesc: "Каждый год сотни учеников проходят путь от первого занятия до водительского удостоверения. Вот их лица и категории — живое доказательство, что маршрут действительно работает.",
    prideNote: "Каждое удостоверение — это не «кейс», а чей-то новый уровень свободы: работа, семья, путешествия, первая самостоятельная дорога.",
    prideGalleryLink: "Вся галерея",
    graduatesEyebrow: "Отзывы",
    graduatesTitle: "Ученики доверяют не обещаниям, а спокойному процессу",
    graduatesDesc: "Что чаще всего ценят те, кто прошёл обучение: понятный план, поддержка менеджера, адекватный инструктор и никакого хаоса с документами.",
    resultEyebrow: "Результат",
    resultTitle: "Сильная школа чувствуется в деталях",
    resultDesc: "Нам важно, чтобы ученик понимал маршрут, видел прогресс и имел рядом людей, которые отвечают быстро и по существу.",
    branchesEyebrow: "Филиалы",
    branchesTitle: "Выберите город и удобный маршрут",
    branchesDesc: "Активный филиал показывает адрес, маршрут, график и форму для быстрой заявки.",
    faqEyebrow: "FAQ",
    faqTitle: "Коротко о главном перед стартом",
    faqDesc: "Собрали вопросы, которые чаще всего задают перед записью: документы, сроки, оплата, экзамен и выбор категории.",
    signupEyebrow: "Заявка",
    signupTitle: "Оставьте контакт, и мы подберём лучший старт",
    signupDesc: "Менеджер уточнит категорию, город, график, цену и ближайшую группу. Можно попросить ответ звонком, в Telegram или WhatsApp.",
    callbackLabel: "Обратный звонок",
    footerDesc: "Курсы вождения, практика, подготовка к экзамену и консультация по выбору категории.",
    footerPrivacy: "Конфиденциальность",
    footerTerms: "Условия",
    nearestBranch: "Ближайший филиал"
  },
  en: {
    contactTitle: "Quick contact wherever it's convenient",
    contactDesc: "Ask a question, book a consultation or choose a branch right away. All buttons are large and mobile-friendly.",
    servicesEyebrow: "Categories & prices",
    servicesTitle: "Choose a programme for your goal",
    servicesDesc: "For your first car, work, motorbike or an additional category. The request takes less than a minute.",
    serviceCta: "Apply",
    telegramShort: "Telegram",
    priceLabel: "Cost",
    documentsEyebrow: "Documents",
    documentsTitle: "What you need to enrol",
    documentsDesc: "A manager will guide you through the list and help prepare everything without unnecessary calls.",
    admissionTitle: "Admission documents",
    afterTitle: "Important to know after training",
    benefitsEyebrow: "Premium approach without extra complexity",
    benefitsTitle: "Not just lessons — a clear route to a licence",
    benefitsDesc: "We removed the noise: you need a clear price, a normal schedule, a good instructor and quick contact with the school.",
    benefitsCta: "Get a consultation",
    storyEyebrow: "How training works",
    storyTitle: "More life on the page: lessons, ground, graduates",
    storyDesc: "We show the training atmosphere and the real stages that make up the journey to a driving licence.",
    galleryEyebrow: "The journey in pictures",
    galleryTitle: "Every stage of training is visible, not just described",
    galleryDesc: "More real scenes for trust: the car interior, signs, the practice ground, the licence, online format and a happy finish.",
    mobileEyebrow: "Mobile format",
    mobileTitle: "Follow your training straight from your phone",
    mobileDesc: "Schedule, reminders, materials and useful tips should always be at hand. We build the service so students can move from lesson to lesson without extra calls.",
    afterExamTitle: "The app should stay useful after the exam too",
    afterExamDesc: "After getting the licence",
    prideEyebrow: "Leader Pride",
    prideTitle: "Real graduates with licences, not just words",
    prideDesc: "Every year hundreds of students complete the journey from their first lesson to a driving licence. These are their faces and categories — proof that the route really works.",
    prideNote: "Each licence is not a 'case study' — it's someone's new level of freedom: work, family, travel, the first solo drive.",
    prideGalleryLink: "Full gallery",
    graduatesEyebrow: "Reviews",
    graduatesTitle: "Students trust the calm process, not promises",
    graduatesDesc: "What graduates appreciate most: a clear plan, manager support, a sensible instructor and no document chaos.",
    resultEyebrow: "Result",
    resultTitle: "A strong school is felt in the details",
    resultDesc: "It matters to us that students understand the route, see progress and have people nearby who respond quickly and to the point.",
    branchesEyebrow: "Branches",
    branchesTitle: "Choose your city and a convenient route",
    branchesDesc: "An active branch shows the address, route, schedule and a quick request form.",
    faqEyebrow: "FAQ",
    faqTitle: "Key facts before you start",
    faqDesc: "Common questions asked before signing up: documents, duration, payment, exam and category choice.",
    signupEyebrow: "Request",
    signupTitle: "Leave your contact and we'll find the best start",
    signupDesc: "A manager will clarify category, city, schedule, price and the nearest group. You can ask for a reply by call, Telegram or WhatsApp.",
    callbackLabel: "Callback",
    footerDesc: "Driving courses, practice, exam preparation and category consultation.",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    nearestBranch: "Nearest branch"
  }
};

const premiumBenefits = [
  {
    title: "Пояснюємо простими словами",
    text: "Теорія без перевантаження: розбираємо правила, знаки й типові помилки так, щоб ними реально користуватись за кермом.",
    icon: BookOpenCheck,
  },
  {
    title: "Практика з інструктором",
    text: "Маршрути, паркування, місто й екзаменаційні ситуації проходите поступово, з фокусом на спокій і контроль.",
    icon: Car,
  },
  {
    title: "Документи під контролем",
    text: "Підкажемо, що підготувати, коли подати й як не загубитися між етапами навчання.",
    icon: FileCheck2,
  },
  {
    title: "Графік під ваш ритм",
    text: "Допоможемо підібрати заняття так, щоб навчання вписалося в роботу, навчання або сімейний графік.",
    icon: CalendarDays,
  },
  {
    title: "Підготовка до іспиту",
    text: "Тренуємо не тільки правила, а й впевненість: що робити на старті, як відповідати й як поводитися на маршруті.",
    icon: ShieldCheck,
  },
  {
    title: "Підтримка після заявки",
    text: "Менеджер швидко зорієнтує за ціною, філіалом, документами та найближчою групою.",
    icon: MessageCircle,
  },
];

const storyPhotos = [
  {
    src: "/images/lesson-premium.png",
    title: "Заняття з інструктором",
    text: "Спокійне пояснення, практика в місті та короткі підсумки після кожного виїзду.",
  },
  {
    src: "/images/practice-ground-premium.png",
    title: "Практика на майданчику",
    text: "Паркування, габарити, старт на підйомі та маневри перед міськими маршрутами.",
  },
  {
    src: "/images/graduates-premium.png",
    title: "Випускники після іспиту",
    text: "Реальні історії людей, які пройшли шлях від першого заняття до водійського посвідчення.",
  },
];

const learningGallery = [
  {
    src: "/images/car-interior-lesson.png",
    title: "Практика в салоні",
    text: "Інструктор показує дії на панелі й допомагає учню відчути автомобіль до виїзду в місто.",
  },
  {
    src: "/images/exam-road-signs.png",
    title: "Знаки та іспит",
    text: "Пояснюємо дорожні знаки, вправи на майданчику й типові питання без зайвого тиску.",
  },
  {
    src: "/images/license-success.png",
    title: "Посвідчення в руках",
    text: "Фінальна мета навчання - впевнено скласти іспит і отримати водійське посвідчення.",
  },
  {
    src: "/images/hero-driving-school.png",
    title: "Перший виїзд",
    text: "Поступовий старт для новачків: маршрут, посадка, дзеркала, базові маневри й спокій.",
  },
  {
    src: "/images/practice-ground-premium.png",
    title: "Навчальний майданчик",
    text: "Відпрацьовуємо паркування, габарити, старт і впевненість перед міським рухом.",
  },
  {
    src: "/images/graduates-premium.png",
    title: "Щасливі випускники",
    text: "Після навчання важлива не тільки оцінка, а й відчуття готовності самостійно їхати.",
  },
];

const SITE_URL = "https://lider.bdslab.net";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "DrivingSchool",
      name: siteBrand.name,
      url: SITE_URL,
      telephone: siteBrand.phoneLabel,
      areaServed: branches.map((branch) => branch.city),
      sameAs: socialLinks.map((link) => link.href),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "420",
      },
      review: graduateReviews.slice(0, 3).map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.name },
        reviewBody: review.text,
        reviewRating: { "@type": "Rating", ratingValue: "5" },
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: homeFaq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: contentPages.map((page, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: page.title,
        item: `${SITE_URL}/${page.slug}`,
      })),
    },
  ],
};

function normalizeLocale(value: string | string[] | undefined): Locale {
  const nextValue = Array.isArray(value) ? value[0] : value;
  return locales.includes(nextValue as Locale) ? (nextValue as Locale) : defaultLocale;
}

function withLocale(href: string, locale: Locale) {
  return href.startsWith("/") ? `${href}?lang=${locale}` : href;
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const activeLocale = normalizeLocale(params.lang);
  const copy = homeCopy[activeLocale];
  const sc = sectionCopy[activeLocale];
  const navItems = copy.navItems.map((item) => ({ ...item, href: withLocale(item.href, activeLocale) }));
  const heroHighlights = copy.heroHighlights;
  const telegram = socialLinks.find((item) => item.id === "telegram");
  const whatsapp = socialLinks.find((item) => item.id === "whatsapp");
  const primaryPhoneHref = siteBrand.phoneLabel.replace(/\s+/g, "");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-40 border-b border-lider-line bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo priority />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основна навігація">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold text-lider-muted transition hover:bg-lider-background hover:text-lider-graphite"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher activeLocale={activeLocale} />
            {telegram ? (
              <a
                href={telegram.href}
                target="_blank"
                rel="noreferrer"
                className="tap-target rounded-full border border-lider-line px-4 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
              >
                {copy.headerCta}
              </a>
            ) : null}
            <a
              href="#signup"
              className="tap-target red-cta rounded-full px-5 py-3 text-sm font-black"
            >
              {copy.primaryCta}
            </a>
          </div>

          <MobileMenu navItems={navItems} activeLocale={activeLocale} />
        </div>
      </header>

      <main className="overflow-hidden bg-white pb-24 text-lider-graphite md:pb-0">
        <section className="motion-section relative border-b border-lider-line bg-[radial-gradient(circle_at_top_right,rgba(255,30,30,0.13),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f5f5f5_100%)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-16">
            <div className="space-y-6">
              <StatusPill tone="success">{copy.heroBadge}</StatusPill>
              <div className="relative overflow-hidden rounded-[24px] border border-white bg-lider-graphite shadow-[0_24px_70px_rgba(26,26,26,0.18)] lg:hidden">
                <Image
                  src="/images/lesson-premium.png"
                  alt="Практичне заняття автошколи Лідер з інструктором"
                  width={900}
                  height={650}
                  priority
                  sizes="100vw"
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-muted">Категорія B</p>
                  <p className="text-lg font-black text-lider-graphite">від 6 500 грн</p>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-[2.05rem] font-black leading-[1.02] tracking-normal text-lider-graphite sm:text-6xl lg:text-7xl">
                  {copy.heroTitle}
                </h1>
                <p className="max-w-2xl text-[0.98rem] font-semibold leading-7 text-lider-muted sm:text-lg">
                  {copy.heroText}
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <a
                  href="#signup"
                  className="tap-target red-cta inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black shadow-premium sm:rounded-full"
                >
                  {copy.primaryCta}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </a>
                {telegram ? (
                <a
                  href={telegram.href}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target hidden items-center justify-center gap-2 rounded-2xl border border-lider-line bg-white px-6 py-4 text-base font-black text-lider-graphite shadow-soft transition hover:border-lider-red hover:text-lider-red sm:inline-flex sm:rounded-full"
                >
                  <Send className="h-5 w-5" aria-hidden />
                  {copy.telegramCta}
                </a>
                ) : null}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-3">
                {heroHighlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white bg-white/80 px-3 py-3 text-center text-xs font-black text-lider-graphite shadow-soft sm:px-4 sm:text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="hidden flex-wrap gap-3 sm:flex">
                {telegram ? (
                  <a
                    href={telegram.href}
                    className="tap-target inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-4 py-3 text-sm font-black text-white"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Telegram
                  </a>
                ) : null}
                {whatsapp ? (
                  <a
                    href={whatsapp.href}
                    className="tap-target inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-black text-white"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    WhatsApp
                  </a>
                ) : null}
                <a
                  href="#branches"
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-lider-graphite px-4 py-3 text-sm font-black text-white"
                >
                  <MapPinned className="h-4 w-4" aria-hidden />
                  {sc.nearestBranch}
                </a>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -right-8 top-10 h-44 w-44 rounded-full bg-lider-red/18 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-white bg-lider-graphite shadow-[0_30px_90px_rgba(26,26,26,0.22)]">
                <Image
                  src="/images/lesson-premium.png"
                  alt="Практичне заняття автошколи Лідер з інструктором"
                  width={1200}
                  height={900}
                  priority
                  sizes="48vw"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/72 to-transparent p-4 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                        Категорія B
                      </p>
                      <p className="text-2xl font-black text-white">від 6 500 грн</p>
                    </div>
                    <a
                      href="#services"
                      className="tap-target rounded-full bg-white px-4 py-3 text-sm font-black text-lider-graphite"
                    >
                      Дивитись ціни
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="motion-section border-b border-lider-line bg-white py-6 sm:py-8">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {socialProofStats.map((stat) => (
              <MetricCard key={stat.value} value={stat.value} label={stat.label} detail={stat.detail} />
            ))}
          </div>
        </section>

        <section className="motion-section bg-lider-background py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <SectionHeader
                eyebrow="Ми поруч"
                title={sc.contactTitle}
                description={sc.contactDesc}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    aria-label={`Відкрити ${social.label} автошколи Лідер`}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group rounded-3xl border border-white bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-premium"
                  >
                    <SocialIcon id={social.id} label={social.label} />
                    <span className="mt-4 block text-sm font-black text-lider-graphite">
                      {social.label}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-lider-muted">
                      перейти
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="motion-section bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={sc.servicesEyebrow}
              title={sc.servicesTitle}
              description={sc.servicesDesc}
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="group flex min-h-[260px] flex-col justify-between rounded-[24px] border border-lider-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-lider-red/40 hover:shadow-premium sm:p-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-lider-red">
                          {service.category}
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-lider-graphite">
                          {service.title}
                        </h3>
                      </div>
                      <span className="rounded-2xl bg-lider-background px-3 py-2 text-sm font-black text-lider-red">
                        {service.duration}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-6 text-lider-muted">
                      {service.summary}
                    </p>
                    <div className="grid gap-2">
                      {service.outcomes.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-2 rounded-full bg-lider-background px-3 py-2 text-xs font-black text-lider-graphite"
                        >
                          <CheckCircle2 className="h-4 w-4 text-lider-red" aria-hidden />
                          {item}
                        </span>
                      ))}
                    </div>
                    {service.condition ? (
                      <p className="rounded-2xl border border-lider-red/20 bg-[#fff7f7] px-4 py-3 text-xs font-bold leading-5 text-lider-muted">
                        {service.condition}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-lider-muted">
                          {sc.priceLabel}
                        </p>
                        <p className="text-3xl font-black text-lider-graphite">
                          від {service.priceFrom.toLocaleString("uk-UA")} грн
                        </p>
                      </div>
                      <Star className="h-6 w-6 fill-lider-red text-lider-red" aria-hidden />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href="#signup"
                        className="tap-target red-cta inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black"
                      >
                        {sc.serviceCta}
                      </a>
                      <a
                        href={telegram?.href ?? "#signup"}
                        target={telegram ? "_blank" : undefined}
                        rel={telegram ? "noreferrer" : undefined}
                        className="tap-target inline-flex items-center justify-center rounded-2xl border border-lider-line px-4 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
                      >
                        Telegram
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-5 rounded-2xl bg-lider-background px-4 py-3 text-sm font-semibold leading-6 text-lider-muted">
              * {priceFootnote}
            </p>
          </div>
        </section>

        <section id="documents" className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-5">
              <StatusPill tone="success">Документи без біганини</StatusPill>
              <h2 className="text-4xl font-black leading-tight text-lider-graphite sm:text-5xl">
                Подати документи можна спокійно: список, фото і заявка в одному місці
              </h2>
              <p className="text-base font-semibold leading-7 text-lider-muted">
                Якщо не хочете розбиратися самі, залиште заявку з фото документів або напишіть у Telegram-бот.
                Менеджер перевірить комплект і підкаже, чого не вистачає.
              </p>
              {telegram ? (
                <a
                  href={telegram.href}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-black text-white"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Подати через Telegram-бот
                </a>
              ) : null}
            </div>
            <div className="grid gap-4">
              <div className="rounded-[26px] border border-lider-line bg-white p-5 shadow-soft sm:p-6">
                <h3 className="text-2xl font-black text-lider-graphite">{sc.admissionTitle}</h3>
                <div className="mt-5 grid gap-3">
                  {admissionDocuments.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-lider-background p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lider-red" aria-hidden />
                      <p className="text-sm font-semibold leading-6 text-lider-graphite">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[26px] bg-lider-graphite p-5 text-white shadow-[0_24px_70px_rgba(26,26,26,0.18)] sm:p-6">
                <h3 className="text-2xl font-black">{sc.afterTitle}</h3>
                <div className="mt-5 grid gap-3">
                  {importantStudyNotes.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                      <p className="text-sm font-semibold leading-6 text-white/76">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="motion-section bg-lider-graphite py-12 text-white sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div className="space-y-5">
                <StatusPill tone="warning">{sc.benefitsEyebrow}</StatusPill>
                <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                  {sc.benefitsTitle}
                </h2>
                <p className="text-base font-semibold leading-7 text-white/68">
                  {sc.benefitsDesc}
                </p>
                <a
                  href="#signup"
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-lider-graphite"
                >
                  {sc.benefitsCta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {premiumBenefits.map((benefit) => (
                  <article
                    key={benefit.title}
                    className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur transition hover:bg-white/[0.1]"
                  >
                    <benefit.icon className="h-8 w-8 text-lider-red" aria-hidden />
                    <h3 className="mt-5 text-lg font-black text-white">{benefit.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                      {benefit.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="motion-section bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={sc.storyEyebrow}
              title={sc.storyTitle}
              description={sc.storyDesc}
            />
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {storyPhotos.map((photo) => (
                <article
                  key={photo.title}
                  className="overflow-hidden rounded-[26px] border border-lider-line bg-white shadow-soft"
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    width={900}
                    height={700}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="p-5">
                    <h3 className="text-xl font-black text-lider-graphite">{photo.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">
                      {photo.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={sc.galleryEyebrow}
              title={sc.galleryTitle}
              description={sc.galleryDesc}
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {learningGallery.map((photo, index) => (
                <article
                  key={photo.title}
                  className={`group overflow-hidden rounded-[24px] border border-lider-line bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:border-lider-red/35 hover:shadow-premium ${
                    index === 0 ? "md:col-span-2 xl:col-span-1" : ""
                  }`}
                >
                  <div className="relative overflow-hidden bg-lider-graphite">
                    <Image
                      src={photo.src}
                      alt={photo.title}
                      width={1100}
                      height={760}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent opacity-80" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-black text-lider-graphite">{photo.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">
                      {photo.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <StatusPill tone="success">{sc.mobileEyebrow}</StatusPill>
              <h2 className="text-4xl font-black leading-tight text-lider-graphite sm:text-5xl">
                {sc.mobileTitle}
              </h2>
              <p className="text-base font-semibold leading-7 text-lider-muted">
                {sc.mobileDesc}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {mobileAppFeatures.slice(0, 4).map((feature) => (
                  <div key={feature} className="rounded-2xl bg-white p-4 shadow-soft">
                    <CheckCircle2 className="h-5 w-5 text-lider-red" aria-hidden />
                    <p className="mt-3 text-sm font-black leading-6 text-lider-graphite">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-[26px] border border-lider-line bg-white p-5 shadow-soft">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-lider-red">
                  {sc.afterExamDesc}
                </p>
                <h3 className="mt-2 text-2xl font-black text-lider-graphite">
                  {sc.afterExamTitle}
                </h3>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {retentionFeatures.slice(0, 4).map((feature) => (
                    <div key={feature} className="rounded-2xl bg-lider-background px-4 py-3">
                      <p className="text-sm font-bold leading-6 text-lider-muted">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.values(appStoreLinks).map((store) => (
                  <span
                    key={store.label}
                    className="inline-flex items-center gap-2 rounded-full border border-lider-line bg-white px-4 py-3 text-sm font-black text-lider-graphite"
                  >
                    <Smartphone className="h-4 w-4 text-lider-red" aria-hidden />
                    {store.label}: {store.status}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[520px]">
              <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-lider-red/18 blur-3xl" />
              <div className="absolute left-[7%] top-16 w-[56%] max-w-[310px] -rotate-6 rounded-[34px] border-[10px] border-lider-graphite bg-lider-graphite shadow-[0_35px_90px_rgba(26,26,26,0.25)]">
                <div className="overflow-hidden rounded-[24px] bg-white">
                  <div className="bg-lider-red p-5 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                      сьогодні
                    </p>
                    <p className="mt-2 text-2xl font-black">Практика о 18:30</p>
                  </div>
                  <div className="space-y-3 p-5">
                    {["Паркування", "Міський маршрут", "Питання до іспиту"].map((item) => (
                      <div key={item} className="rounded-2xl bg-lider-background p-4">
                        <p className="text-sm font-black text-lider-graphite">{item}</p>
                        <p className="text-xs font-semibold text-lider-muted">готово до заняття</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 right-[4%] w-[58%] max-w-[320px] rotate-6 rounded-[34px] border-[10px] border-white bg-white shadow-[0_35px_90px_rgba(26,26,26,0.22)]">
                <div className="overflow-hidden rounded-[24px] bg-lider-graphite text-white">
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                      філіал
                    </p>
                    <p className="mt-2 text-2xl font-black">Київ, центр</p>
                    <div className="mt-5 rounded-2xl bg-white/10 p-4">
                      <p className="text-sm font-black">Менеджер на зв’язку</p>
                      <p className="mt-1 text-xs font-semibold text-white/62">
                        підкаже графік і документи
                      </p>
                    </div>
                  </div>
                  <div className="bg-lider-red p-5">
                    <p className="text-sm font-black">Записатися в один дотик</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pride" className="motion-section bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <SectionHeader
                eyebrow={sc.prideEyebrow}
                title={sc.prideTitle}
                description={sc.prideDesc}
              />
              <div className="rounded-[24px] bg-lider-background p-5">
                <p className="text-sm font-black uppercase tracking-[0.14em] text-lider-red">{sc.prideEyebrow}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">
                  {sc.prideNote}
                </p>
                <a
                  href={`/pride?lang=${activeLocale}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-black text-lider-red"
                >
                  {sc.prideGalleryLink}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
            <div className="pride-rail mt-8 flex snap-x gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {pridePhotos.slice(0, 8).map((photo) => (
                <article
                  key={photo.src}
                  className="group min-w-[76vw] snap-start overflow-hidden rounded-[24px] border border-lider-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-premium sm:min-w-[340px] lg:min-w-0"
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    width={640}
                    height={820}
                    sizes="(max-width: 768px) 76vw, (max-width: 1280px) 25vw, 300px"
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-black text-lider-graphite">{photo.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">{photo.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="graduates" className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Відгуки"
              title="Учні довіряють не обіцянкам, а спокійному процесу"
              description="Що найчастіше цінують ті, хто пройшов навчання: зрозумілий план, підтримка менеджера, адекватний інструктор і жодного хаосу з документами."
            />
            <div className="mt-8 space-y-8">
              <GraduateShowcase />
              <ReviewsCarousel />
            </div>
          </div>
        </section>

        <section className="motion-section bg-lider-graphite py-12 text-white sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
              <Image
                src="/images/practice-ground-premium.png"
                alt="Практичний майданчик автошколи Лідер"
                width={1100}
                height={850}
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="space-y-5">
              <StatusPill tone="warning">{sc.resultEyebrow}</StatusPill>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                {sc.resultTitle}
              </h2>
              <p className="text-base font-semibold leading-7 text-white/68">
                {sc.resultDesc}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Trophy, label: "Високий відсоток складання" },
                  { icon: Award, label: "Інструктори з досвідом" },
                  { icon: Clock3, label: "Групи стартують регулярно" },
                  { icon: GraduationCap, label: "Підтримка до іспиту" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/[0.07] p-4">
                    <item.icon className="h-6 w-6 text-lider-red" aria-hidden />
                    <p className="mt-3 text-sm font-black text-white">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="branches" className="motion-section bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={sc.branchesEyebrow}
              title={sc.branchesTitle}
              description={sc.branchesDesc}
            />
            <div className="mt-8">
              <BranchSelector />
            </div>
          </div>
        </section>

        <section id="faq" className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeader
              eyebrow={sc.faqEyebrow}
              title={sc.faqTitle}
              description={sc.faqDesc}
            />
            <FaqAccordion items={homeFaq} />
          </div>
        </section>

        <section id="signup" className="motion-section bg-white pb-28 pt-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div id="contacts" className="space-y-6">
              <StatusPill tone="success">{sc.signupEyebrow}</StatusPill>
              <h2 className="text-4xl font-black leading-tight text-lider-graphite sm:text-5xl">
                {sc.signupTitle}
              </h2>
              <p className="text-base font-semibold leading-7 text-lider-muted">
                {sc.signupDesc}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <a
                  href="#signup"
                  className="tap-target rounded-2xl bg-lider-graphite p-4 text-white"
                >
                  <MessageCircle className="h-6 w-6" aria-hidden />
                  <span className="mt-3 block text-sm font-black">{sc.callbackLabel}</span>
                </a>
                {telegram ? (
                  <a href={telegram.href} className="tap-target rounded-2xl bg-[#229ED9] p-4 text-white">
                    <Send className="h-6 w-6" aria-hidden />
                    <span className="mt-3 block text-sm font-black">Telegram</span>
                  </a>
                ) : null}
                {whatsapp ? (
                  <a href={whatsapp.href} className="tap-target rounded-2xl bg-[#25D366] p-4 text-white">
                    <MessageCircle className="h-6 w-6" aria-hidden />
                    <span className="mt-3 block text-sm font-black">WhatsApp</span>
                  </a>
                ) : null}
              </div>
            </div>
            <LeadForm locale={activeLocale} />
          </div>
        </section>
      </main>

      <footer className="border-t border-lider-line bg-lider-graphite text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.2fr_0.8fr]">
          <div>
            <p className="text-2xl font-black">{siteBrand.name}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
              {sc.footerDesc}
            </p>
            <nav aria-label="Правова інформація" className="mt-5 flex flex-wrap gap-3">
              <a
                href={withLocale("/privacy", activeLocale)}
                className="text-xs font-semibold text-white/45 transition hover:text-white/80"
              >
                {sc.footerPrivacy}
              </a>
              <a
                href={withLocale("/terms", activeLocale)}
                className="text-xs font-semibold text-white/45 transition hover:text-white/80"
              >
                {sc.footerTerms}
              </a>
              <a
                href={`mailto:${siteBrand.email}`}
                className="text-xs font-semibold text-white/45 transition hover:text-white/80"
              >
                {siteBrand.email}
              </a>
            </nav>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="space-y-3">
            <a
              href={`tel:${primaryPhoneHref}`}
              className="tap-target flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-lider-graphite"
            >
              {siteBrand.phoneLabel}
            </a>
            <a
              href="#signup"
              className="tap-target red-cta flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black"
            >
              Записатися
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 sm:px-6">
          <p className="mx-auto max-w-7xl text-center text-xs font-semibold text-white/35">
            © {new Date().getFullYear()} {siteBrand.name}. Всі права захищено.
          </p>
        </div>
      </footer>

      <ConversionWidgets
        activeLocale={activeLocale}
        leadPopupDelayMs={process.env.NODE_ENV === "production" ? 25000 : 1500}
        reopenAfterMs={35000}
      />
    </>
  );
}
