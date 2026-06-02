import {
  admissionDocuments,
  branches,
  defaultLocale,
  graduateReviews,
  homeFaq,
  importantStudyNotes,
  locales,
  priceFootnote,
  pridePhotos,
  services,
  siteBrand,
  socialLinks,
  socialProofStats,
  type Locale,
} from "@lider/shared";
import { MetricCard, SectionHeader, StatusPill } from "@lider/ui";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  FileCheck2,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { BrandLogo } from "../components/brand-logo";
import { BranchSelector } from "../components/branch-selector";
import { ConversionWidgets } from "../components/conversion-widgets";
import { FaqAccordion } from "../components/faq-accordion";
import { LanguageSwitcher } from "../components/language-switcher";
import { MobileMenu } from "../components/mobile-menu";
import { ReviewsCarousel } from "../components/reviews-carousel";
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
      { href: "/branches", label: "Філіали" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Контакти" }
    ],
    heroBadge: "Підготовка до прав A, A1, B, C, CE",
    heroTitle: "Права без хаосу",
    heroText:
      "Оберіть категорію й залиште телефон. Менеджер підкаже ціну, документи та найближчий старт.",
    heroHighlights: ["1 хвилина", "Документи онлайн", "Підтримка до іспиту"],
    primaryCta: "Залишити заявку",
    telegramCta: "Запис через Telegram",
    headerCta: "Запис у Telegram"
  },
  ru: {
    navItems: [
      { href: "/categories", label: "Категории" },
      { href: "/documents", label: "Документы" },
      { href: "/branches", label: "Филиалы" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Контакты" }
    ],
    heroBadge: "Подготовка к правам A, A1, B, C, CE",
    heroTitle: "Права без хаоса",
    heroText:
      "Выберите категорию и оставьте телефон. Менеджер подскажет цену, документы и ближайший старт.",
    heroHighlights: ["1 минута", "Документы онлайн", "Поддержка до экзамена"],
    primaryCta: "Оставить заявку",
    telegramCta: "Запись через Telegram",
    headerCta: "Запись в Telegram"
  },
  en: {
    navItems: [
      { href: "/categories", label: "Categories" },
      { href: "/documents", label: "Documents" },
      { href: "/branches", label: "Branches" },
      { href: "/faq", label: "FAQ" },
      { href: "/contacts", label: "Contacts" }
    ],
    heroBadge: "Driving licence training A, A1, B, C, CE",
    heroTitle: "Driving licence without chaos",
    heroText:
      "Choose a category and leave your phone. A manager will explain price, documents and the nearest start.",
    heroHighlights: ["1-minute request", "Online documents", "Exam support"],
    primaryCta: "Send request",
    telegramCta: "Apply via Telegram",
    headerCta: "Apply in Telegram"
  }
};

const sectionCopy: Record<
  Locale,
  {
    servicesEyebrow: string;
    servicesTitle: string;
    servicesDesc: string;
    serviceCta: string;
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
    prideEyebrow: string;
    prideTitle: string;
    prideDesc: string;
    prideNote: string;
    prideGalleryLink: string;
    graduatesEyebrow: string;
    graduatesTitle: string;
    graduatesDesc: string;
    branchesEyebrow: string;
    branchesTitle: string;
    branchesDesc: string;
    faqEyebrow: string;
    faqTitle: string;
    faqDesc: string;
    signupEyebrow: string;
    signupTitle: string;
    signupDesc: string;
    footerDesc: string;
    footerPrivacy: string;
    footerTerms: string;
    servicesViewAll: string;
    servicesViewAllHint: string;
  }
> = {
  uk: {
    servicesEyebrow: "Категорії та ціни",
    servicesTitle: "Оберіть програму під вашу ціль",
    servicesDesc: "Для першого авто, роботи, мотоцикла або відкриття додаткової категорії. Заявка займає менше хвилини.",
    serviceCta: "Заявка",
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
    prideEyebrow: "Гордість Лідера",
    prideTitle: "Реальні випускники з правами, а не красиві слова",
    prideDesc: "Щороку сотні учнів проходять шлях від першого заняття до посвідчення водія. Ось їхні обличчя й категорії — живий доказ, що маршрут справді спрацьовує.",
    prideNote: "Кожне посвідчення — це не «кейс», а чийсь новий рівень свободи: робота, родина, подорожі, перша самостійна дорога.",
    prideGalleryLink: "Вся галерея",
    graduatesEyebrow: "Відгуки",
    graduatesTitle: "Учні довіряють не обіцянкам, а спокійному процесу",
    graduatesDesc: "Короткі відгуки допомагають швидко зрозуміти, як проходить навчання: графік, інструктор, документи, практика і підготовка до іспиту.",
    branchesEyebrow: "Філіали",
    branchesTitle: "Оберіть місто та зручний маршрут",
    branchesDesc: "Активний філіал показує адресу, маршрут, графік і форму для швидкої заявки.",
    faqEyebrow: "FAQ",
    faqTitle: "Коротко про головне перед стартом",
    faqDesc: "Зібрали питання, які найчастіше ставлять перед записом: документи, строки, оплата, іспит і вибір категорії.",
    signupEyebrow: "Заявка",
    signupTitle: "Готові почати навчання?",
    signupDesc: "Залиште номер — менеджер підкаже категорію, філіал і наступний набір.",
    footerDesc: "Курси водіння, практика, підготовка до іспиту та консультація щодо вибору категорії.",
    footerPrivacy: "Конфіденційність",
    footerTerms: "Умови",
    servicesViewAll: "Усі категорії та ціни",
    servicesViewAllHint: "Детальні програми, строки і умови перепідготовки"
  },
  ru: {
    servicesEyebrow: "Категории и цены",
    servicesTitle: "Выберите программу под вашу цель",
    servicesDesc: "Для первого авто, работы, мотоцикла или открытия дополнительной категории. Заявка занимает меньше минуты.",
    serviceCta: "Заявка",
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
    prideEyebrow: "Гордость Лидера",
    prideTitle: "Реальные выпускники с правами, а не красивые слова",
    prideDesc: "Каждый год сотни учеников проходят путь от первого занятия до водительского удостоверения. Вот их лица и категории — живое доказательство, что маршрут действительно работает.",
    prideNote: "Каждое удостоверение — это не «кейс», а чей-то новый уровень свободы: работа, семья, путешествия, первая самостоятельная дорога.",
    prideGalleryLink: "Вся галерея",
    graduatesEyebrow: "Отзывы",
    graduatesTitle: "Ученики доверяют не обещаниям, а спокойному процессу",
    graduatesDesc: "Короткие отзывы помогают понять, как проходит обучение: расписание, инструктор, документы, практика и подготовка к экзамену.",
    branchesEyebrow: "Филиалы",
    branchesTitle: "Выберите город и удобный маршрут",
    branchesDesc: "Активный филиал показывает адрес, маршрут, график и форму для быстрой заявки.",
    faqEyebrow: "FAQ",
    faqTitle: "Коротко о главном перед стартом",
    faqDesc: "Собрали вопросы, которые чаще всего задают перед записью: документы, сроки, оплата, экзамен и выбор категории.",
    signupEyebrow: "Заявка",
    signupTitle: "Готовы начать обучение?",
    signupDesc: "Оставьте номер — менеджер подскажет категорию, филиал и ближайший набор.",
    footerDesc: "Курсы вождения, практика, подготовка к экзамену и консультация по выбору категории.",
    footerPrivacy: "Конфиденциальность",
    footerTerms: "Условия",
    servicesViewAll: "Все категории и цены",
    servicesViewAllHint: "Подробные программы, сроки и условия переподготовки"
  },
  en: {
    servicesEyebrow: "Categories & prices",
    servicesTitle: "Choose a programme for your goal",
    servicesDesc: "For your first car, work, motorbike or an additional category. The request takes less than a minute.",
    serviceCta: "Apply",
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
    prideEyebrow: "Leader Pride",
    prideTitle: "Real graduates with licences, not just words",
    prideDesc: "Every year hundreds of students complete the journey from their first lesson to a driving licence. These are their faces and categories — proof that the route really works.",
    prideNote: "Each licence is not a 'case study' — it's someone's new level of freedom: work, family, travel, the first solo drive.",
    prideGalleryLink: "Full gallery",
    graduatesEyebrow: "Reviews",
    graduatesTitle: "Students trust the calm process, not promises",
    graduatesDesc: "Short reviews help quickly understand the training: schedule, instructor, documents, practice and exam preparation.",
    branchesEyebrow: "Branches",
    branchesTitle: "Choose your city and a convenient route",
    branchesDesc: "An active branch shows the address, route, schedule and a quick request form.",
    faqEyebrow: "FAQ",
    faqTitle: "Key facts before you start",
    faqDesc: "Common questions asked before signing up: documents, duration, payment, exam and category choice.",
    signupEyebrow: "Request",
    signupTitle: "Ready to start training?",
    signupDesc: "Leave your number — a manager will suggest the category, branch and nearest group.",
    footerDesc: "Driving courses, practice, exam preparation and category consultation.",
    footerPrivacy: "Privacy",
    footerTerms: "Terms",
    servicesViewAll: "All categories & prices",
    servicesViewAllHint: "Full programmes, duration and retraining conditions"
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
        {/* Hero */}
        <section className="motion-section relative border-b border-lider-line bg-[linear-gradient(180deg,#ffffff_0%,#fff8f8_100%)]">
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
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -right-8 top-10 h-44 w-44 rounded-full bg-lider-red/16 blur-3xl" />
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

        {/* Social proof stats */}
        <section className="motion-section border-b border-lider-line bg-white py-6 sm:py-8">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {socialProofStats.map((stat) => (
              <MetricCard key={stat.value} value={stat.value} label={stat.label} detail={stat.detail} />
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="motion-section bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeader
                eyebrow={sc.servicesEyebrow}
                title={sc.servicesTitle}
                description={sc.servicesDesc}
              />
              <a
                href={withLocale("/categories", activeLocale)}
                className="hidden shrink-0 items-center gap-2 rounded-full border border-lider-line px-5 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red lg:inline-flex"
              >
                {sc.servicesViewAll}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {services.filter((s) => !s.retraining).slice(0, 4).map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col justify-between rounded-[24px] border border-lider-line bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-lider-red/40 hover:shadow-premium"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-lider-red">
                        {service.category}
                      </p>
                      <span className="rounded-full bg-lider-background px-2.5 py-1 text-xs font-black text-lider-graphite">
                        {service.duration}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-black text-lider-graphite">{service.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-lider-muted line-clamp-3">
                      {service.summary}
                    </p>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-muted">
                      {sc.priceLabel}
                    </p>
                    <p className="mt-1 text-2xl font-black text-lider-graphite">
                      від {service.priceFrom.toLocaleString("uk-UA")} грн
                    </p>
                    <a
                      href="#signup"
                      className="tap-target mt-4 flex items-center justify-center rounded-2xl border border-lider-red/25 bg-lider-background px-4 py-3 text-sm font-black text-lider-red transition hover:border-lider-red hover:bg-[#fff5f5]"
                    >
                      {sc.serviceCta}
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold leading-6 text-lider-muted">
                * {priceFootnote}
              </p>
              <a
                href={withLocale("/categories", activeLocale)}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-lider-line bg-lider-background px-5 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
              >
                {sc.servicesViewAll}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        {/* Documents */}
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

        {/* Benefits */}
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

        {/* Pride gallery */}
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

        {/* Reviews */}
        <section id="graduates" className="motion-section bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow={sc.graduatesEyebrow}
              title={sc.graduatesTitle}
              description={sc.graduatesDesc}
            />
            <div className="mt-8">
              <ReviewsCarousel />
            </div>
          </div>
        </section>

        {/* Branches */}
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

        {/* FAQ */}
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

        {/* Final CTA */}
        <section id="signup" className="motion-section bg-white pb-20 pt-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div id="contacts" className="overflow-hidden rounded-[30px] border border-lider-line bg-lider-graphite p-6 text-white shadow-[0_28px_90px_rgba(26,26,26,0.18)] sm:p-8 lg:p-10">
              <StatusPill tone="warning">{sc.signupEyebrow}</StatusPill>
              <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                    {sc.signupTitle}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-white/70">
                    {sc.signupDesc}
                  </p>
                </div>
                <a
                  href="#signup"
                  className="red-cta tap-target w-full rounded-2xl px-6 py-4 text-base font-black sm:w-auto"
                >
                  {copy.primaryCta}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </a>
              </div>
            </div>
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
            {telegram ? (
              <a
                href={telegram.href}
                target="_blank"
                rel="noreferrer"
                className="tap-target flex items-center justify-center gap-2 rounded-2xl bg-[#229ED9] px-4 py-3 text-sm font-black text-white"
              >
                <Send className="h-4 w-4" aria-hidden />
                Telegram
              </a>
            ) : null}
            <a
              href="#signup"
              className="tap-target red-cta flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black"
            >
              {copy.primaryCta}
            </a>
            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.filter((s) => s.id !== "telegram").map((s) => (
                <a
                  key={s.id}
                  href={s.href}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={s.label}
                  className="rounded-xl bg-white/[0.07] px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white/90"
                >
                  {s.label}
                </a>
              ))}
            </div>
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
        leadPopupDelayMs={process.env.NODE_ENV === "production" ? 45000 : 1500}
        reopenAfterMs={15 * 60 * 1000}
      />
    </>
  );
}
