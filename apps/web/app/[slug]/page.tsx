import {
  admissionDocuments,
  branches,
  defaultLocale,
  homeFaq,
  importantStudyNotes,
  locales,
  priceFootnote,
  pridePhotos,
  services,
  siteBrand,
  socialLinks,
  type Locale
} from "@lider/shared";
import { SectionHeader, StatusPill } from "@lider/ui";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Phone,
  Route,
  Send
} from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LanguageSwitcher } from "../../components/language-switcher";
import { ConversionWidgets } from "../../components/conversion-widgets";
import { AboutContent } from "../../components/about-content";
import { SiteFooter } from "../../components/site-footer";
import { contentPages, getLocalizedContentPage } from "../../lib/site-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return contentPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const activeLocale = normalizeLocale(query.lang);
  const page = getLocalizedContentPage(slug, activeLocale);
  if (!page) return {};
  return {
    title: page.title,
    description: page.summary,
    openGraph: { title: page.title, description: page.summary, type: "website" }
  };
}

export default async function ContentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const activeLocale = normalizeLocale(query.lang);

  // Contacts → redirect to branches
  if (slug === "contacts") {
    redirect(`/branches?lang=${activeLocale}`);
  }

  const page = getLocalizedContentPage(slug, activeLocale);
  if (!page) notFound();

  const branch = page.branchId ? branches.find((item) => item.id === page.branchId) : undefined;
  const relatedServices = page.category
    ? services.filter((s) => s.category === page.category)
    : services.slice(0, 4);
  const jsonLd = buildJsonLd(page, branch);

  // Translation helpers
  const tk = (uk: string, ru: string, en: string) =>
    activeLocale === "en" ? en : activeLocale === "ru" ? ru : uk;

  const copy = {
    applyCta:    tk("Записатися", "Записаться", "Apply"),
    keyPoints:   tk("Деталі", "Детали", "Details"),
    progsTitle:  page.kind === "city"
                   ? tk("Доступні категорії у філії", "Доступные категории в филиале", "Available categories")
                   : tk("Програми навчання", "Программы обучения", "Training programmes"),
    progsDesc:   tk(
                   "Ціни, категорії та тривалість подані однаково на всіх сторінках.",
                   "Цены, категории и длительность представлены одинаково на всех страницах.",
                   "Prices, categories and duration are consistent across all pages."
                 ),
    ctaTitle:    tk("Залишити заявку", "Оставить заявку", "Send a request"),
    ctaDesc:     tk(
                   "Залиште телефон — менеджер уточнить деталі і підкаже найближчий старт.",
                   "Оставьте телефон — менеджер уточнит детали и подскажет ближайший старт.",
                   "Leave your phone — a manager will clarify details and suggest the nearest start."
                 ),
    ctaReady:    tk("Готові почати?", "Готовы начать?", "Ready to start?"),
    defaultHighlights: [
      tk("Онлайн-заявка",        "Онлайн-заявка",            "Online request"),
      tk("Підтримка менеджера",   "Поддержка менеджера",      "Manager support"),
      tk("Підготовка до іспиту",  "Подготовка к экзамену",    "Exam preparation")
    ],
    defaultCta:      tk("Отримати консультацію", "Получить консультацию", "Get a consultation"),
    defaultEyebrow:  tk("Автошкола Лідер",       "Автошкола Лидер",       "Leader Driving School"),
    retraining:      tk("Перепідготовка",         "Переподготовка",        "Retraining"),
    breadcrumbHome:  tk("Головна",                "Главная",               "Home"),
    routeLabel:      tk("Маршрут",                "Маршрут",               "Directions"),
    hoursLabel:      tk("Графік",                 "График",                "Hours"),
    emailShort:      "Email",
  };

  // Which sections to show
  const isLegal = page.kind === "legal";
  const isAbout = slug === "about";
  const isBranches = slug === "branches";
  const showServiceCards = !isLegal && !isAbout && !isBranches && (page.kind === "city" || page.kind === "category");
  const showCta = !isLegal;

  const telegram = socialLinks.find((s) => s.id === "telegram");
  const pageLeadSource =
    slug === "documents" ? "documents" :
    slug === "about" ? "about" :
    page.kind === "city" ? "branch_card" :
    page.kind === "category" ? "category_card" :
    "cta_link";
  const pageLeadData = {
    "data-lead-source": pageLeadSource,
    "data-lead-city": branch?.city,
    "data-lead-branch-id": branch?.id,
    "data-lead-branch": branch?.city,
    "data-lead-category": page.category
  };

  return (
    <main className="min-h-screen bg-lider-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Sub-page header — clean, no blur */}
      <header className="border-b border-lider-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href={`/?lang=${activeLocale}`} className="inline-flex items-center gap-2 text-sm font-semibold text-lider-graphite transition hover:text-lider-red">
            ← {siteBrand.shortName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher activeLocale={activeLocale} />
            <a
              href="#application"
              {...pageLeadData}
              className="tap-target rounded-[12px] bg-lider-red px-4 py-2 text-sm font-black text-white transition hover:bg-[#d81414]"
            >
              {copy.applyCta}
            </a>
          </div>
        </div>
      </header>

      {/* Hero — skipped for About (it renders its own custom hero) */}
      {!isAbout ? (
      <section className="motion-section premium-surface soft-grid px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
          <div className="reveal-up">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
              {page.eyebrow ?? copy.defaultEyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-lider-graphite md:text-6xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-lider-muted">{page.summary}</p>
            {!isLegal ? (
              <div className="mt-8">
                <a
                  href="#application"
                  {...pageLeadData}
                  className="tap-target red-cta inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black"
                >
                  {page.cta ?? copy.defaultCta}
                  <ArrowRight size={16} aria-hidden />
                </a>
              </div>
            ) : null}
          </div>

          {/* Aside — solid white, no blur */}
          <aside className="rounded-[22px] border border-lider-line bg-white p-5 shadow-soft">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-red">{copy.keyPoints}</p>
            <div className="mt-4 grid gap-3">
              {(page.highlights ?? copy.defaultHighlights).map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[14px] border border-lider-line bg-lider-background px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-lider-red" aria-hidden />
                  <span className="text-sm font-semibold text-lider-graphite">{item}</span>
                </div>
              ))}
            </div>
            {branch ? (
              <div className="mt-5 rounded-[16px] bg-lider-red p-4 text-white">
                <MapPin className="h-5 w-5" aria-hidden />
                <p className="mt-3 text-lg font-black">{branch.city}</p>
                <p className="mt-1 text-sm text-white/72">{branch.address}</p>
                <a href={`tel:${branch.phone}`} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-white">
                  <Phone size={15} aria-hidden />
                  {branch.phone}
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
      ) : null}

      {/* Service cards (city/category pages only) */}
      {showServiceCards ? (
        <section className="motion-section bg-white px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title={copy.progsTitle} description={copy.progsDesc} />
            <div className="stagger mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedServices.map((service) => (
                <article key={service.id} className="rounded-[18px] border border-lider-line bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black text-lider-graphite">{service.title}</h2>
                    <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                      {service.retraining ? copy.retraining : service.category}
                    </StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-lider-muted">{service.summary}</p>
                  <p className="mt-4 text-xl font-black text-lider-red">від {service.priceFrom.toLocaleString("uk-UA")} грн</p>
                  <a
                    href="#application"
                    data-lead-source={branch ? "branch_card" : "category_card"}
                    data-lead-city={branch?.city}
                    data-lead-branch-id={branch?.id}
                    data-lead-branch={branch?.city}
                    data-lead-category={service.category}
                    className="tap-target mt-4 flex items-center justify-center rounded-[14px] border border-lider-red/25 bg-lider-background px-3 py-3 text-sm font-black text-lider-red transition hover:bg-[#fff5f5]"
                  >
                    {copy.applyCta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Specialized content */}
      <SpecializedPageSection slug={slug} locale={activeLocale} copy={copy} telegram={telegram} />

      {/* Final CTA — popup trigger, replaces full LeadForm */}
      {showCta ? (
        <section id="application" className="motion-section bg-lider-graphite px-5 py-16 text-white lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <StatusPill tone="warning">{copy.ctaReady}</StatusPill>
            <h2 className="mt-5 text-4xl font-black">{copy.ctaTitle}</h2>
            <p className="mt-4 text-base font-semibold leading-7 text-white/70">{copy.ctaDesc}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href="#application"
                {...pageLeadData}
                className="tap-target red-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-black"
              >
                {page.cta ?? copy.defaultCta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </a>
              {telegram ? (
                <a
                  href={telegram.href}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.07] px-7 py-4 text-base font-black text-white transition hover:bg-white/[0.12]"
                >
                  <Send className="h-5 w-5" aria-hidden />
                  Telegram
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <SiteFooter activeLocale={activeLocale} />

      <ConversionWidgets activeLocale={activeLocale} leadPopupDelayMs={45_000} reopenAfterMs={15 * 60 * 1000} />
    </main>
  );
}

// ─── Specialized sections ────────────────────────────────────────────────────

type CopyMap = {
  routeLabel: string;
  hoursLabel: string;
  emailShort: string;
  applyCta: string;
  retraining: string;
};

function SpecializedPageSection({
  slug,
  locale,
  copy,
  telegram
}: {
  slug: string;
  locale: Locale;
  copy: CopyMap & Record<string, unknown>;
  telegram: (typeof socialLinks)[number] | undefined;
}) {
  const tk = (uk: string, ru: string, en: string) =>
    locale === "en" ? en : locale === "ru" ? ru : uk;

  // ── Categories / Prices ────────────────────────────────────────────────────
  if (slug === "categories" || slug === "prices") {
    return (
      <section className="motion-section bg-lider-background px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow={tk("Повний список", "Полный список", "Full list")}
            title={tk("Категорії, строки та ціни", "Категории, сроки и цены", "Categories, duration and prices")}
            description={priceFootnote}
          />
          <div className="stagger mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-[20px] border border-lider-line bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-lider-red">{service.category}</p>
                    <h2 className="mt-2 text-2xl font-black text-lider-graphite">{service.title}</h2>
                  </div>
                  <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                    {service.retraining ? copy.retraining as string : service.duration}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-lider-muted">{service.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.outcomes.map((item) => (
                    <span key={item} className="rounded-full bg-lider-background px-3 py-1.5 text-xs font-black text-lider-graphite">
                      {item}
                    </span>
                  ))}
                </div>
                {service.condition ? (
                  <p className="mt-4 rounded-2xl bg-lider-background p-4 text-xs font-bold leading-5 text-lider-muted">
                    {service.condition}
                  </p>
                ) : null}
                <p className="mt-5 text-2xl font-black text-lider-red">від {service.priceFrom.toLocaleString("uk-UA")} грн</p>
                <a
                  href="#application"
                  data-lead-source="category_card"
                  data-lead-category={service.category}
                  className="tap-target mt-3 flex items-center justify-center rounded-[14px] border border-lider-red/25 bg-lider-background px-3 py-3 text-sm font-black text-lider-red transition hover:bg-[#fff5f5]"
                >
                  {copy.applyCta as string}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Training format (theory + practice) ───────────────────────────────────
  if (slug === "training" || slug === "categories" || slug === "prices") {
    const theoryTitle   = tk("Теоретичний курс", "Теоретический курс", "Theory course");
    const theoryDesc    = tk(
      "Після подачі документів ви отримуєте повний доступ до всіх навчальних матеріалів.",
      "После подачи документов вы получаете полный доступ ко всем учебным материалам.",
      "After submitting your documents you get full access to all learning materials."
    );
    const practiceTitle = tk("Практичні заняття", "Практические занятия", "Practical lessons");
    const practiceDesc  = tk(
      "Після успішної здачі теоретичного іспиту розпочинаються практичні заняття — найцікавіша та найважливіша частина навчання.",
      "После успешной сдачи теоретического экзамена начинаются практические занятия — самая интересная и важная часть обучения.",
      "After passing the theory exam, practical lessons begin — the most engaging and essential part of your training."
    );

    type TrainingBlock = { icon: string; heading: string; items: string[] };

    const theoryBlocksMap: Record<string, TrainingBlock[]> = {
      uk: [
        { icon: "🎥", heading: "Живі заняття в Zoom", items: ["Лекції від викладача вищої категорії з 35-річним досвідом", "Онлайн-формат із можливістю ставити питання", "Графік: Пн–Пт 17:00–19:00 · Сб–Нд 12:00–14:00"] },
        { icon: "📺", heading: "Відеолекції на YouTube", items: ["Доступ до лекцій у зручний для вас час", "Можна переглядати будь-де й будь-коли"] },
        { icon: "📝", heading: "Тренажер для підготовки до іспиту", items: ["Спеціальна навчальна програма з усіма тестами", "Підготовка до іспиту в Сервісному центрі МВС", "Зручний формат для самостійного тренування"] }
      ],
      ru: [
        { icon: "🎥", heading: "Живые занятия в Zoom", items: ["Лекции от преподавателя высшей категории с 35-летним опытом", "Онлайн-формат с возможностью задавать вопросы", "График: Пн–Пт 17:00–19:00 · Сб–Вс 12:00–14:00"] },
        { icon: "📺", heading: "Видеолекции на YouTube", items: ["Доступ к лекциям в удобное для вас время", "Смотрите где и когда угодно"] },
        { icon: "📝", heading: "Тренажёр для подготовки к экзамену", items: ["Специальная учебная программа со всеми тестами", "Подготовка к экзамену в Сервисном центре МВД", "Удобный формат для самостоятельной тренировки"] }
      ],
      en: [
        { icon: "🎥", heading: "Live Zoom classes", items: ["Lectures by a top-category instructor with 35 years of experience", "Online format with live Q&A", "Schedule: Mon–Fri 17:00–19:00 · Sat–Sun 12:00–14:00"] },
        { icon: "📺", heading: "YouTube video lectures", items: ["Watch lectures at your own pace", "Available anywhere, anytime"] },
        { icon: "📝", heading: "Exam preparation simulator", items: ["Full test database with explanations", "Aligned with the MIA service centre exam format", "Self-paced, practice as much as you need"] }
      ]
    };

    const practiceBlocksMap: Record<string, TrainingBlock[]> = {
      uk: [
        { icon: "🚗", heading: "Заняття з інструктором", items: ["Навчання на авто відповідної категорії", "Старт, зупинка, розвороти, паркування, маневрування, обгони", "Місто, інтенсивний трафік, нерівні дороги, перехрестя"] },
        { icon: "👤", heading: "Інструктори", items: ["Пояснюють чітко та спокійно", "Підлаштовуються під ваш рівень і темп", "Підготовка до практичного іспиту в автошколі та СЦ МВС"] },
        { icon: "📍", heading: "Графік та локації", items: ["Гнучкий графік — ви обираєте зручний день і час", "Виїзди проходять у вашому місті", "Всі заняття індивідуальні — один учень, один інструктор"] }
      ],
      ru: [
        { icon: "🚗", heading: "Занятия с инструктором", items: ["Обучение на автомобиле соответствующей категории", "Старт, остановка, развороты, парковка, манёвры, обгоны", "Город, интенсивный трафик, неровные дороги, перекрёстки"] },
        { icon: "👤", heading: "Инструкторы", items: ["Объясняют чётко и спокойно", "Подстраиваются под ваш уровень и темп", "Подготовка к практическому экзамену в автошколе и СЦ МВД"] },
        { icon: "📍", heading: "График и локации", items: ["Гибкий график — выбираете удобный день и время", "Выезды в вашем городе", "Все занятия индивидуальные — один ученик, один инструктор"] }
      ],
      en: [
        { icon: "🚗", heading: "Lessons with an instructor", items: ["Training on the appropriate vehicle category", "Starts, stops, turns, parking, manoeuvres, overtaking", "City traffic, uneven roads, signalled and unsignalled junctions"] },
        { icon: "👤", heading: "Instructors", items: ["Clear and calm communication", "Adapts to your skill level and pace", "Prepares you for both the school and MIA service centre practical exam"] },
        { icon: "📍", heading: "Schedule and locations", items: ["Flexible schedule — choose your day and time", "Sessions in your city", "All lessons are individual — one student, one instructor"] }
      ]
    };

    const theoryBlocks  = (theoryBlocksMap[locale]  ?? theoryBlocksMap.uk)  as TrainingBlock[];
    const practiceBlocks = (practiceBlocksMap[locale] ?? practiceBlocksMap.uk) as TrainingBlock[];

    const goalText = tk(
      "Наша мета — не просто навчити вас керувати авто, а зробити вас впевненим, спокійним та безпечним водієм.",
      "Наша цель — не просто научить вас водить авто, а сделать вас уверенным, спокойным и безопасным водителем.",
      "Our goal is not just to teach you how to drive, but to make you a confident, calm and safe driver."
    );

    return (
      <section className="motion-section bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-16">
          {/* Theory */}
          <div>
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
                {tk("01 · Теорія", "01 · Теория", "01 · Theory")}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-lider-graphite">{theoryTitle}</h2>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-lider-muted">{theoryDesc}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {theoryBlocks.map((block) => (
                <div key={block.heading} className="rounded-2xl border border-lider-line bg-lider-background p-5">
                  <span className="text-2xl">{block.icon}</span>
                  <h3 className="mt-3 text-base font-black text-lider-graphite">{block.heading}</h3>
                  <ul className="mt-3 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-lider-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lider-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Practice */}
          <div>
            <div className="mb-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
                {tk("02 · Практика", "02 · Практика", "02 · Practice")}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-lider-graphite">{practiceTitle}</h2>
              <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-lider-muted">{practiceDesc}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {practiceBlocks.map((block) => (
                <div key={block.heading} className="rounded-2xl border border-lider-line bg-lider-background p-5">
                  <span className="text-2xl">{block.icon}</span>
                  <h3 className="mt-3 text-base font-black text-lider-graphite">{block.heading}</h3>
                  <ul className="mt-3 space-y-2">
                    {block.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-lider-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lider-red" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-base font-black text-lider-graphite">{goalText}</p>
          </div>
        </div>
      </section>
    );
  }

  // ── Documents ──────────────────────────────────────────────────────────────
  if (slug === "documents") {
    return (
      <section className="motion-section bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-[22px] border border-lider-line bg-lider-background p-6">
            <FileCheck2 className="h-9 w-9 text-lider-red" aria-hidden />
            <h2 className="mt-5 text-3xl font-black text-lider-graphite">
              {tk("Документи для вступу", "Документы для поступления", "Admission documents")}
            </h2>
            <div className="mt-5 grid gap-3">
              {admissionDocuments.map((item) => (
                <p key={item} className="rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-lider-graphite">{item}</p>
              ))}
            </div>
          </article>
          <article className="rounded-[22px] bg-lider-graphite p-6 text-white">
            <h2 className="text-3xl font-black">
              {tk("Важливо після навчання", "Важно после обучения", "Important after training")}
            </h2>
            <div className="mt-5 grid gap-3">
              {importantStudyNotes.map((item) => (
                <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-semibold leading-6 text-white/72">{item}</p>
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  // ── Pride ─────────────────────────────────────────────────────────────────
  if (slug === "pride") {
    return (
      <section className="motion-section bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow={tk("Галерея", "Галерея", "Gallery")}
            title={tk("Реальні фото випускників", "Реальные фото выпускников", "Real graduate photos")}
            description={tk(
              "Нейтральні підписи, без вигаданих персональних даних.",
              "Нейтральные подписи, без выдуманных персональных данных.",
              "Neutral captions, no invented personal data."
            )}
          />
          <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pridePhotos.map((photo) => (
              <article key={photo.src} className="overflow-hidden rounded-[20px] border border-lider-line bg-white shadow-soft">
                <Image src={photo.src} alt={photo.title} width={640} height={820} sizes="(max-width: 768px) 50vw, 25vw" className="aspect-[4/5] w-full object-cover" />
                <div className="p-4">
                  <h2 className="text-lg font-black text-lider-graphite">{photo.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">{photo.caption}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // About ─ handled by the dedicated <AboutContent/> component
  if (slug === "about") {
    return <AboutContent locale={locale} />;
  }

  // ── Branches ──────────────────────────────────────────────────────────────
  if (slug === "branches") {
    return (
      <section className="motion-section bg-lider-background px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="stagger grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {branches.map((b) => (
              <article key={b.id} className="overflow-hidden rounded-[26px] border border-lider-line bg-white shadow-soft">
                <iframe
                  title={`${tk("Карта", "Карта", "Map")} ${b.city}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(b.mapQuery)}&output=embed`}
                  className="h-[180px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-5">
                  <h2 className="text-2xl font-black text-lider-graphite">{b.city}</h2>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lider-red" aria-hidden />
                      <p className="text-sm font-semibold leading-6 text-lider-muted">{b.address}</p>
                    </div>
                    <a
                      href={`tel:${b.phone}`}
                      className="flex items-center gap-2 rounded-2xl bg-lider-background px-3 py-2 text-sm font-black text-lider-graphite transition hover:text-lider-red"
                    >
                      <Phone className="h-4 w-4 text-lider-red" aria-hidden />
                      {b.phone}
                    </a>
                    <a
                      href={`mailto:${siteBrand.email}`}
                      className="flex items-center gap-2 text-sm font-semibold text-lider-muted transition hover:text-lider-red"
                    >
                      <span className="text-xs font-black text-lider-red">{copy.emailShort as string}</span>
                      {siteBrand.email}
                    </a>
                    <p className="text-xs font-semibold text-lider-muted">
                      {copy.hoursLabel as string}: {b.workingHours}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <a
                      href={b.routeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="tap-target inline-flex items-center justify-center gap-2 rounded-[14px] bg-lider-background px-3 py-3 text-sm font-bold text-lider-graphite transition hover:bg-[#eee]"
                    >
                      <Route className="h-4 w-4" aria-hidden />
                      {copy.routeLabel as string}
                    </a>
                    <a
                      href="#application"
                      data-lead-source="branch_card"
                      data-lead-city={b.city}
                      data-lead-branch-id={b.id}
                      data-lead-branch={b.city}
                      className="tap-target red-cta inline-flex items-center justify-center rounded-[14px] px-3 py-3 text-sm font-black"
                    >
                      {copy.applyCta as string}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Privacy ───────────────────────────────────────────────────────────────
  if (slug === "privacy") {
    return <LegalSection slug="privacy" locale={locale} />;
  }

  // ── Terms / Offer ─────────────────────────────────────────────────────────
  if (slug === "terms" || slug === "offer") {
    return <LegalSection slug="terms" locale={locale} />;
  }

  return null;
}

// ─── Legal content ───────────────────────────────────────────────────────────

type LegalSlug = "privacy" | "terms";
type LegalSectionData = { title: string; body: string; bullets?: string[] };
type LegalDocData = { disclaimer: string; sections: LegalSectionData[] };

const legalContent: Record<LegalSlug, Record<Locale, LegalDocData>> = {
  privacy: {
    uk: {
      disclaimer: "Останнє оновлення: червень 2026 р. Автошкола «Лідер», lider.bdslab.net.",
      sections: [
        {
          title: "Загальні положення",
          body: "Ця Політика конфіденційності описує порядок збору, обробки та захисту персональних даних Користувачів сайту lider.bdslab.net та пов'язаних сервісів Автошколи «Лідер» (далі — «Адміністрація»). Надсилаючи заявку або використовуючи будь-яку форму на сайті, Ви підтверджуєте ознайомлення з цією Політикою та надаєте згоду на обробку персональних даних у зазначених цілях. Якщо Ви не погоджуєтесь — будь ласка, утримайтесь від надання персональних даних."
        },
        {
          title: "Адміністратор сайту",
          body: "Адміністратор — суб'єкт господарювання «Автошкола «Лідер»», що надає послуги підготовки та перепідготовки водіїв транспортних засобів. Адміністрація обробляє персональні дані відповідно до законодавства України, зокрема Закону України «Про захист персональних даних» від 01.06.2010 № 2297-VI. Контакт з питань приватності: lideravtoshkola@gmail.com."
        },
        {
          title: "Які дані ми збираємо",
          body: "Для надання послуг та зворотного зв'язку ми можемо збирати такі категорії даних:",
          bullets: [
            "Контактні дані: ім'я, номер телефону, email (за бажанням)",
            "Дані про запит: місто, обрана філія, категорія ВП, спосіб зв'язку, коментар",
            "Документи: скани або фото паспорту/ID, ідентифікаційного коду, медичної довідки — лише за Вашою ініціативою",
            "Telegram: username та start-параметр (при взаємодії через бот)",
            "Технічні дані: хеш IP-адреси (без можливості відновлення), User-Agent браузера, UTM-параметри, джерело переходу, тип пристрою"
          ]
        },
        {
          title: "Мета обробки даних",
          body: "Ваші персональні дані обробляються виключно з такими цілями:",
          bullets: [
            "Зворотний зв'язок та первинна консультація щодо навчання",
            "Запис на навчання в обраній філії та підтвердження групи",
            "Перевірка та обробка поданих документів менеджером",
            "Комунікація щодо статусу заявки та організаційних питань",
            "Покращення якості сайту та сервісу на основі агрегованої аналітики",
            "Захист від спаму, зловживань та несанкціонованого доступу"
          ]
        },
        {
          title: "Правові підстави обробки",
          body: "Обробка персональних даних здійснюється на таких підставах:",
          bullets: [
            "Згода Користувача — підтверджується чекбоксом при відправці форми заявки",
            "Виконання запиту — для надання консультації або запису на навчання",
            "Законні інтереси адміністрації — безпека сервісу та захист від зловживань",
            "Вимоги законодавства України — у передбачених нормативними актами випадках"
          ]
        },
        {
          title: "Зберігання документів і файлів",
          body: "Файли, завантажені через форму заявки, зберігаються у Firebase Storage (Google Cloud) за шляхом lead-documents/{leadId}. Доступ до файлів мають виключно менеджери Автошколи «Лідер» з відповідними правами. Публічне читання файлів заблоковано на рівні правил Firebase Storage. Прямі посилання для завантаження документів не генеруються і не передаються третім особам без Вашого запиту."
        },
        {
          title: "Передача третім сторонам",
          body: "Ми не продаємо та не передаємо персональні дані третім особам у комерційних цілях. Для забезпечення роботи сервісу залучаємо таких технічних підрядників:",
          bullets: [
            "Firebase / Google Cloud — зберігання заявок та файлів документів",
            "Vercel — хостинг веб-сайту",
            "Telegram API — сповіщення менеджерів про нові заявки",
            "Resend / SMTP-провайдер — email-сповіщення",
            "Google Analytics 4 — агрегована аналітика відвідувань",
            "Meta Pixel / TikTok Pixel — рекламна аналітика (якщо підключено)",
            "OpenAI — обробка запитів до AI-асистента (без збереження персональних даних з боку OpenAI)"
          ]
        },
        {
          title: "Захист даних",
          body: "Ми вживаємо розумних організаційних та технічних заходів захисту персональних даних:",
          bullets: [
            "IP-адреса зберігається лише у хешованому вигляді — відновлення неможливе",
            "Доступ до заявок обмежений ролями (admin / manager) через Firebase Auth custom claims",
            "Документи захищені правилами Firebase Storage без публічного читання",
            "Підключення до сайту та API захищено HTTPS",
            "Ключі та паролі зберігаються через environment variables, а не в коді"
          ]
        },
        {
          title: "Права Користувача",
          body: "Відповідно до Закону України «Про захист персональних даних» Ви маєте право:",
          bullets: [
            "Дізнатись, які дані про Вас зберігаються та як вони використовуються",
            "Вимагати виправлення неточних або застарілих даних",
            "Відкликати згоду на обробку (не скасовує законності попередньої обробки)",
            "Вимагати видалення персональних даних",
            "Отримати копію своїх даних у структурованому форматі"
          ]
        },
        {
          title: "Cookies та аналітика",
          body: "Сайт може використовувати файли cookie та аналітичні інструменти:",
          bullets: [
            "Технічні (сесійні) cookie — для коректної роботи форм та навігації",
            "Google Analytics 4 — агрегована статистика відвідувань без передачі особистих даних",
            "Meta Pixel / TikTok Pixel — поведінкова аналітика (якщо підключено)"
          ]
        },
        {
          title: "Строки зберігання даних",
          body: "Персональні дані зберігаються не довше, ніж необхідно для досягнення мети обробки:",
          bullets: [
            "Заявки (ліди) — до 2 років або до видалення за запитом Користувача",
            "Завантажені документи — до завершення навчання + 6 місяців, або до видалення за запитом",
            "Дані аналітики — відповідно до налаштувань платформ (зазвичай 26 місяців для GA4)",
            "Записи аудиту — відповідно до вимог внутрішньої безпеки"
          ]
        },
        {
          title: "Зміни Політики",
          body: "Ми можемо оновлювати цю Політику без попереднього повідомлення. Актуальна версія завжди доступна на сторінці /privacy. Продовжуючи використовувати сайт після змін, Ви погоджуєтесь з оновленою версією Політики. Рекомендуємо час від часу переглядати цю сторінку."
        },
        {
          title: "Контакти",
          body: "З питань конфіденційності та захисту персональних даних звертайтесь: lideravtoshkola@gmail.com (тема листа: «Персональні дані — запит»). Ми відповідаємо у робочі години (Пн–Сб 09:00–18:00)."
        }
      ]
    },
    ru: {
      disclaimer: "Последнее обновление: июнь 2026 г. Автошкола «Лидер», lider.bdslab.net.",
      sections: [
        {
          title: "Общие положения",
          body: "Эта Политика конфиденциальности описывает порядок сбора, обработки и защиты персональных данных Пользователей сайта lider.bdslab.net и связанных сервисов Автошколы «Лидер» (далее — «Администрация»). Отправляя заявку или используя любую форму на сайте, Вы подтверждаете ознакомление с этой Политикой и даёте согласие на обработку персональных данных."
        },
        {
          title: "Администратор сайта",
          body: "Администратор — субъект хозяйствования «Автошкола «Лидер»», предоставляющий услуги подготовки и переподготовки водителей. Обработка персональных данных осуществляется в соответствии с законодательством Украины, в частности Законом Украины «О защите персональных данных». Контакт: lideravtoshkola@gmail.com."
        },
        {
          title: "Какие данные мы собираем",
          body: "Для предоставления услуг и обратной связи мы можем собирать следующие категории данных:",
          bullets: [
            "Контактные данные: имя, номер телефона, email (по желанию)",
            "Данные о запросе: город, выбранный филиал, категория ВУ, способ связи, комментарий",
            "Документы: сканы или фото паспорта/ID, ИНН, медицинской справки — только по Вашей инициативе",
            "Telegram: username и start-параметр",
            "Технические данные: хеш IP, User-Agent, UTM-параметры, источник перехода, тип устройства"
          ]
        },
        {
          title: "Цели обработки данных",
          body: "Ваши персональные данные обрабатываются исключительно для следующих целей:",
          bullets: [
            "Обратная связь и первичная консультация по обучению",
            "Запись на обучение в выбранный филиал",
            "Проверка и обработка поданных документов менеджером",
            "Коммуникация по статусу заявки и организационным вопросам",
            "Улучшение качества сайта на основе агрегированной аналитики",
            "Защита от спама и злоупотреблений"
          ]
        },
        {
          title: "Правовые основания обработки",
          body: "Обработка персональных данных осуществляется на следующих основаниях:",
          bullets: [
            "Согласие Пользователя — подтверждается чекбоксом при отправке формы",
            "Исполнение запроса — для проведения консультации или записи",
            "Законные интересы администрации — безопасность и защита от злоупотреблений",
            "Требования законодательства Украины"
          ]
        },
        {
          title: "Хранение документов и файлов",
          body: "Файлы, загруженные через форму заявки, хранятся в Firebase Storage (Google Cloud). Доступ к файлам имеют только менеджеры автошколы с соответствующими правами. Публичное чтение файлов заблокировано. Прямые ссылки для скачивания не генерируются и не передаются третьим лицам."
        },
        {
          title: "Передача третьим лицам",
          body: "Мы не продаём и не передаём персональные данные третьим лицам в коммерческих целях. Технические подрядники, задействованные для работы сервиса:",
          bullets: [
            "Firebase / Google Cloud — хранение заявок и файлов",
            "Vercel — хостинг сайта",
            "Telegram API — уведомления менеджеров",
            "Resend / SMTP — email-уведомления",
            "Google Analytics 4 — агрегированная аналитика",
            "Meta Pixel / TikTok Pixel — рекламная аналитика (при подключении)",
            "OpenAI — AI-ассистент (без хранения персональных данных)"
          ]
        },
        {
          title: "Защита данных",
          body: "Мы принимаем разумные организационные и технические меры защиты:",
          bullets: [
            "IP-адрес хранится только в хешированном виде",
            "Доступ к заявкам ограничен ролями (admin / manager)",
            "Документы защищены правилами Firebase без публичного чтения",
            "Соединения защищены HTTPS, ключи хранятся через environment variables"
          ]
        },
        {
          title: "Ваши права",
          body: "В соответствии с Законом Украины «О защите персональных данных» Вы имеете право:",
          bullets: [
            "Узнать, какие данные о Вас хранятся и как они используются",
            "Потребовать исправления неточных или устаревших данных",
            "Отозвать согласие на обработку",
            "Потребовать удаления персональных данных",
            "Получить копию своих данных"
          ]
        },
        {
          title: "Cookies и аналитика",
          body: "Сайт может использовать файлы cookie и аналитические инструменты:",
          bullets: [
            "Технические cookie — для корректной работы форм и навигации",
            "Google Analytics 4 — агрегированная статистика без передачи личных данных",
            "Meta Pixel / TikTok Pixel — поведенческая аналитика (при подключении)"
          ]
        },
        {
          title: "Сроки хранения данных",
          body: "Персональные данные хранятся не дольше, чем необходимо:",
          bullets: [
            "Заявки — до 2 лет или до удаления по запросу",
            "Загруженные документы — до окончания обучения + 6 месяцев, или до удаления по запросу",
            "Данные аналитики — согласно настройкам платформ (обычно 26 месяцев для GA4)"
          ]
        },
        {
          title: "Изменения Политики",
          body: "Мы можем обновлять эту Политику без предварительного уведомления. Актуальная версия всегда доступна на странице /privacy. Продолжение использования сайта после изменений означает принятие обновлённой Политики."
        },
        {
          title: "Контакты",
          body: "По всем вопросам обработки персональных данных: lideravtoshkola@gmail.com (тема: «Персональные данные — запрос»). Отвечаем в рабочие часы (Пн–Сб 09:00–18:00)."
        }
      ]
    },
    en: {
      disclaimer: "Last updated: June 2026. Leader Driving School, lider.bdslab.net.",
      sections: [
        {
          title: "General provisions",
          body: "This Privacy Policy describes how Leader Driving School (the «Administrator») collects, processes and protects personal data of users of lider.bdslab.net and related services. By submitting a request form you confirm you have read this Policy and consent to processing your personal data as described herein."
        },
        {
          title: "Data controller",
          body: "The data controller is the business entity «Leader Driving School», providing driver preparation and retraining services. Personal data is processed in accordance with Ukrainian law, including the Law of Ukraine «On Personal Data Protection» (No. 2297-VI of 01.06.2010). Privacy contact: lideravtoshkola@gmail.com."
        },
        {
          title: "What data we collect",
          body: "To deliver services and respond to enquiries we may collect the following categories of data:",
          bullets: [
            "Contact details: name, phone number, email address (optional)",
            "Request data: city, chosen branch, licence category, contact method, message",
            "Documents: scans or photos of ID/passport, tax code, medical certificate — only at your initiative",
            "Telegram: username and start parameter",
            "Technical data: hashed IP address, User-Agent, UTM parameters, referral source, device type"
          ]
        },
        {
          title: "Purpose of processing",
          body: "Your personal data is processed exclusively for these purposes:",
          bullets: [
            "Responding to your enquiry and providing initial consultation",
            "Enrolling you at your chosen branch and confirming your group",
            "Reviewing and processing submitted documents",
            "Communicating about your application status",
            "Improving site quality using aggregate analytics",
            "Protecting against spam, abuse and unauthorised access"
          ]
        },
        {
          title: "Legal basis for processing",
          body: "Processing of personal data is carried out on the following legal grounds:",
          bullets: [
            "Consent — confirmed by checkbox when submitting a request form",
            "Performance of a request — to provide consultation or enrolment",
            "Legitimate interests — service security and protection against abuse",
            "Ukrainian legal requirements — where required by applicable law"
          ]
        },
        {
          title: "Storage of documents and files",
          body: "Files uploaded through the request form are stored in Firebase Storage (Google Cloud) at path lead-documents/{leadId}. Access is restricted to authorised school managers only. Public reading is disabled at the Firebase Storage rules level. Direct download links are not generated or shared with third parties without your request."
        },
        {
          title: "Sharing with third parties",
          body: "We do not sell or share personal data with third parties for commercial purposes. Technical processors engaged to operate the service:",
          bullets: [
            "Firebase / Google Cloud — request and document file storage",
            "Vercel — website hosting",
            "Telegram API — manager notifications for new requests",
            "Resend / SMTP provider — email notifications",
            "Google Analytics 4 — aggregate site analytics",
            "Meta Pixel / TikTok Pixel — advertising analytics (when enabled)",
            "OpenAI — AI assistant processing (no personal data stored by OpenAI)"
          ]
        },
        {
          title: "Data security",
          body: "We implement reasonable organisational and technical measures to protect your personal data:",
          bullets: [
            "IP addresses are stored in hashed form only — recovery is not possible",
            "Access to leads is role-restricted (admin / manager) via Firebase Auth custom claims",
            "Documents are protected by Firebase Storage rules with no public read access",
            "Connections to the site and API are secured by HTTPS",
            "Keys and passwords are stored via environment variables, not in source code"
          ]
        },
        {
          title: "Your rights",
          body: "Under the Law of Ukraine «On Personal Data Protection» you have the right to:",
          bullets: [
            "Know what data we hold about you and how it is used",
            "Request correction of inaccurate or outdated data",
            "Withdraw consent at any time (without affecting prior lawful processing)",
            "Request deletion of your personal data",
            "Receive a copy of your data in a structured format"
          ]
        },
        {
          title: "Cookies and analytics",
          body: "The site may use cookies and analytics tools:",
          bullets: [
            "Technical (session) cookies — for correct operation of forms and navigation",
            "Google Analytics 4 — aggregate visit statistics without passing personal data",
            "Meta Pixel / TikTok Pixel — behavioural analytics (when enabled)"
          ]
        },
        {
          title: "Retention periods",
          body: "Personal data is not retained longer than necessary for the processing purpose:",
          bullets: [
            "Applications (leads) — up to 2 years or until deleted on request",
            "Uploaded documents — until training completion + 6 months, or deleted on request",
            "Analytics data — per platform settings (typically 26 months for GA4)",
            "Audit records — in accordance with internal security requirements"
          ]
        },
        {
          title: "Changes to this Policy",
          body: "We may update this Policy without prior notice. The current version is always available at /privacy. Continued use of the site after changes constitutes acceptance of the updated Policy. We recommend reviewing this page periodically."
        },
        {
          title: "Contact",
          body: "For all privacy and personal data enquiries: lideravtoshkola@gmail.com (subject: «Personal Data — Request»). We respond during business hours (Mon–Sat 09:00–18:00)."
        }
      ]
    }
  },
  terms: {
    uk: {
      disclaimer: "Останнє оновлення: червень 2026 р. Автошкола «Лідер», lider.bdslab.net.",
      sections: [
        {
          title: "Загальні положення",
          body: "Ця Угода користувача (далі — «Угода») регулює умови використання сайту lider.bdslab.net, форм заявок, Telegram-бота та мобільного застосунку Автошколи «Лідер» (далі — «Сервіс»). Використовуючи Сервіс, Ви підтверджуєте ознайомлення з цією Угодою та погоджуєтесь дотримуватись її умов."
        },
        {
          title: "Предмет Угоди",
          body: "Сервіс надає такі можливості: залишити заявку на навчання або консультацію; отримати інформацію про послуги автошколи; завантажити документи онлайн; взаємодіяти з AI-асистентом та Telegram-ботом. Сервіс є інформаційним майданчиком. Укладення договору на навчання відбувається окремо — після підтвердження менеджером і підписання відповідних документів."
        },
        {
          title: "Використання сайту",
          body: "Ви погоджуєтесь використовувати Сервіс лише в законних цілях. Забороняється:",
          bullets: [
            "Надавати завідомо неправдиві персональні дані",
            "Здійснювати автоматизоване масове надсилання запитів (bot-трафік)",
            "Намагатися отримати несанкціонований доступ до систем Сервісу",
            "Завантажувати файли, що містять шкідливе програмне забезпечення"
          ]
        },
        {
          title: "Інформація про послуги автошколи",
          body: "Всі відомості на сайті (ціни, терміни навчання, категорії, програми) є інформаційними і не мають статусу публічної оферти у розумінні ст. 641 Цивільного кодексу України. Остаточні умови надання послуг підтверджуються менеджером і фіксуються у договорі."
        },
        {
          title: "Заявки, консультації та зворотний зв'язок",
          body: "Надіслана заявка — це запит на консультацію або запис. Вона не є договором і не гарантує зарахування без підтвердження менеджера. Відповідь надається у робочі години (Пн–Сб 09:00–18:00). Для екстреного зв'язку — телефонуйте безпосередньо у філію."
        },
        {
          title: "Подання документів через сайт",
          body: "Завантажуючи документи через форму заявки, Ви підтверджуєте:",
          bullets: [
            "Наявність права передавати такі документи",
            "Що документи не містять даних третіх осіб без їхньої згоди",
            "Ознайомлення з Політикою конфіденційності (/privacy)"
          ]
        },
        {
          title: "Вартість, строки та актуальність інформації",
          body: "Ціни на сайті є орієнтовними. Остаточна вартість підтверджується менеджером перед підписанням договору і може відрізнятися залежно від:",
          bullets: [
            "Регіону та обраної філії",
            "Поточних акцій або знижок",
            "Умов навчання: терміну, формату, кількості годин практики",
            "Змін вимог під час воєнного стану"
          ]
        },
        {
          title: "Обмеження відповідальності",
          body: "Сервіс надається «як є» (as is). Адміністрація не несе відповідальності за:",
          bullets: [
            "Технічні збої або недоступність сайту та API",
            "Неточність або застарілість інформації на сайті",
            "Дії або бездіяльність третіх осіб (месенджерів, платіжних систем, Google)",
            "Непрямі збитки, пов'язані з використанням Сервісу"
          ]
        },
        {
          title: "Права та обов'язки Користувача",
          body: "Користувач має право: використовувати Сервіс для отримання консультацій та запису на навчання; отримувати інформацію про послуги; звертатися до менеджера. Користувач зобов'язаний:",
          bullets: [
            "Надавати достовірні контактні дані",
            "Не зловживати Сервісом і не порушувати права третіх осіб",
            "Дотримуватись умов цієї Угоди та законодавства України"
          ]
        },
        {
          title: "Права та обов'язки Адміністрації",
          body: "Адміністрація має право: змінювати умови Угоди; відмовити у наданні послуг при порушенні умов. Адміністрація зобов'язана:",
          bullets: [
            "Обробляти персональні дані відповідно до Політики конфіденційності",
            "Відповідати на запити Користувача у розумні строки",
            "Вживати заходів для захисту даних відповідно до своїх можливостей"
          ]
        },
        {
          title: "Інтелектуальна власність",
          body: "Усі матеріали сайту (тексти, зображення, логотипи, дизайн) є власністю Автошколи «Лідер» або використовуються на законних підставах. Забороняється відтворювати, копіювати або розповсюджувати матеріали без письмового дозволу Адміністрації."
        },
        {
          title: "Зовнішні посилання",
          body: "Сайт може містити посилання на сторонні ресурси (Google Maps, соціальні мережі, месенджери). Адміністрація не несе відповідальності за зміст та дотримання приватності на сторонніх сайтах."
        },
        {
          title: "Персональні дані та конфіденційність",
          body: "Обробка персональних даних здійснюється відповідно до Політики конфіденційності, розміщеної за адресою /privacy. Відправляючи форму, Ви надаєте згоду на обробку персональних даних відповідно до зазначеної Політики."
        },
        {
          title: "Зміни умов",
          body: "Адміністрація залишає за собою право вносити зміни до цієї Угоди без попереднього повідомлення. Актуальна версія завжди доступна на сторінці /terms. Продовження використання Сервісу після змін означає прийняття оновленої Угоди."
        },
        {
          title: "Вирішення спорів",
          body: "Усі спори вирішуються відповідно до чинного законодавства України. Досудове врегулювання є обов'язковим — звертайтесь на lideravtoshkola@gmail.com. У разі неможливості досудового врегулювання спір передається до компетентного суду."
        },
        {
          title: "Контакти",
          body: "З усіх питань щодо цієї Угоди: lideravtoshkola@gmail.com (Пн–Сб 09:00–18:00)."
        }
      ]
    },
    ru: {
      disclaimer: "Последнее обновление: июнь 2026 г. Автошкола «Лидер», lider.bdslab.net.",
      sections: [
        {
          title: "Общие положения",
          body: "Это Пользовательское соглашение («Соглашение») регулирует условия использования сайта lider.bdslab.net, форм заявок, Telegram-бота и мобильного приложения Автошколы «Лидер» (далее — «Сервис»). Используя Сервис, Вы принимаете условия настоящего Соглашения."
        },
        {
          title: "Предмет Соглашения",
          body: "Сервис предоставляет возможность получить информацию об услугах автошколы, оставить заявку, записаться на консультацию, загрузить документы онлайн, взаимодействовать с AI-ассистентом и Telegram-ботом. Сервис является информационной площадкой. Договор на обучение заключается отдельно."
        },
        {
          title: "Использование сайта",
          body: "Запрещается:",
          bullets: [
            "Предоставлять заведомо ложные персональные данные",
            "Осуществлять автоматизированную массовую отправку запросов",
            "Пытаться получить несанкционированный доступ к системам Сервиса",
            "Загружать файлы с вредоносным программным обеспечением"
          ]
        },
        {
          title: "Информация об услугах автошколы",
          body: "Все сведения на сайте (цены, сроки, категории) носят информационный характер и не являются публичной офертой. Окончательные условия подтверждаются менеджером и фиксируются в договоре."
        },
        {
          title: "Заявки, консультации и обратная связь",
          body: "Отправленная заявка — это запрос на консультацию. Она не является договором и не гарантирует зачисление без подтверждения менеджера. Ответ предоставляется в рабочие часы (Пн–Сб 09:00–18:00)."
        },
        {
          title: "Подача документов через сайт",
          body: "Загружая документы, Вы подтверждаете:",
          bullets: [
            "Наличие права передавать такие документы",
            "Что документы не содержат данных третьих лиц без их согласия",
            "Ознакомление с Политикой конфиденциальности (/privacy)"
          ]
        },
        {
          title: "Стоимость, сроки и актуальность информации",
          body: "Цены на сайте ориентировочны. Окончательная стоимость подтверждается менеджером и может отличаться в зависимости от:",
          bullets: [
            "Региона и выбранного филиала",
            "Действующих акций или скидок",
            "Условий обучения: срока, формата, часов практики"
          ]
        },
        {
          title: "Ограничение ответственности",
          body: "Администрация не несёт ответственности за:",
          bullets: [
            "Технические сбои или недоступность сайта и API",
            "Неточность или устарелость информации на сайте",
            "Действия третьих лиц (мессенджеров, платёжных систем, Google)",
            "Косвенные убытки, связанные с использованием Сервиса"
          ]
        },
        {
          title: "Права и обязанности Пользователя",
          body: "Пользователь обязан:",
          bullets: [
            "Предоставлять достоверные контактные данные",
            "Не нарушать права третьих лиц",
            "Соблюдать условия настоящего Соглашения"
          ]
        },
        {
          title: "Права и обязанности Администрации",
          body: "Администрация обязана:",
          bullets: [
            "Обрабатывать персональные данные согласно Политике конфиденциальности",
            "Отвечать на запросы Пользователя в разумные сроки",
            "Принимать меры для защиты данных"
          ]
        },
        {
          title: "Интеллектуальная собственность",
          body: "Все материалы сайта являются собственностью Автошколы «Лидер» или используются на законных основаниях. Копирование без письменного разрешения запрещено."
        },
        {
          title: "Внешние ссылки",
          body: "Сайт может содержать ссылки на сторонние ресурсы. Администрация не несёт ответственности за их содержимое или соблюдение конфиденциальности."
        },
        {
          title: "Персональные данные и конфиденциальность",
          body: "Обработка персональных данных осуществляется в соответствии с Политикой конфиденциальности на странице /privacy. Отправляя форму, Вы соглашаетесь на обработку персональных данных."
        },
        {
          title: "Изменения условий",
          body: "Актуальная версия Соглашения всегда доступна на /terms. Продолжение использования Сервиса после изменений означает их принятие."
        },
        {
          title: "Разрешение споров",
          body: "Споры разрешаются в соответствии с законодательством Украины. Досудебное урегулирование обязательно: lideravtoshkola@gmail.com."
        },
        {
          title: "Контакты",
          body: "По всем вопросам: lideravtoshkola@gmail.com (Пн–Сб 09:00–18:00)."
        }
      ]
    },
    en: {
      disclaimer: "Last updated: June 2026. Leader Driving School, lider.bdslab.net.",
      sections: [
        {
          title: "General provisions",
          body: "This User Agreement («Agreement») governs use of lider.bdslab.net, request forms, the Telegram bot and the mobile application of Leader Driving School (the «Service»). Using the Service means you accept these terms."
        },
        {
          title: "Scope of the Agreement",
          body: "The Service allows you to obtain information about driving school services, submit a request or book a consultation, upload documents online, and interact with the AI assistant and Telegram bot. The Service is an information platform. A training contract is concluded separately after manager confirmation."
        },
        {
          title: "Use of the site",
          body: "Prohibited:",
          bullets: [
            "Submitting knowingly false personal data",
            "Automated bulk sending of requests (bot traffic)",
            "Attempting unauthorised access to Service systems",
            "Uploading files containing malicious software"
          ]
        },
        {
          title: "Information about driving school services",
          body: "All information on the site (prices, durations, categories, programmes) is informational and does not constitute a public offer under Ukrainian law. Final service terms are confirmed by a manager and recorded in a contract."
        },
        {
          title: "Requests, consultations and feedback",
          body: "A submitted request is an enquiry for a consultation or enrolment. It is not a contract and does not guarantee enrolment without manager confirmation. Responses are provided during business hours (Mon–Sat 09:00–18:00)."
        },
        {
          title: "Document uploads",
          body: "By uploading documents you confirm:",
          bullets: [
            "You have the right to transmit those documents",
            "The documents do not contain third-party personal data without consent",
            "You have read the Privacy Policy at /privacy"
          ]
        },
        {
          title: "Pricing, durations and accuracy of information",
          body: "Prices shown are indicative. Final cost is confirmed by a manager and may vary depending on:",
          bullets: [
            "Region and chosen branch",
            "Current promotions or discounts",
            "Training conditions: duration, format, number of practical hours"
          ]
        },
        {
          title: "Limitation of liability",
          body: "The Administrator is not liable for:",
          bullets: [
            "Technical failures or unavailability of the site or API",
            "Inaccuracy or outdatedness of site information",
            "Actions of third parties (messengers, payment systems, Google)",
            "Indirect damages related to using the Service"
          ]
        },
        {
          title: "User rights and obligations",
          body: "You are obliged to:",
          bullets: [
            "Provide accurate contact details",
            "Not violate third-party rights",
            "Comply with these terms and Ukrainian law"
          ]
        },
        {
          title: "Administrator rights and obligations",
          body: "The Administrator is obliged to:",
          bullets: [
            "Process personal data in accordance with the Privacy Policy",
            "Respond to user requests within a reasonable time",
            "Implement reasonable measures to protect data"
          ]
        },
        {
          title: "Intellectual property",
          body: "All site materials are owned by Leader Driving School or used on lawful grounds. Reproduction without written permission is prohibited."
        },
        {
          title: "External links",
          body: "The site may contain links to third-party resources. The Administrator is not responsible for their content or privacy practices."
        },
        {
          title: "Personal data and privacy",
          body: "Personal data is processed in accordance with the Privacy Policy at /privacy. By submitting a form you consent to processing of your personal data as described therein."
        },
        {
          title: "Changes to terms",
          body: "The current version is always available at /terms. Continued use of the Service after changes constitutes acceptance of the updated Agreement."
        },
        {
          title: "Dispute resolution",
          body: "Disputes are resolved under Ukrainian law. Pre-trial resolution is mandatory: lideravtoshkola@gmail.com. If pre-trial resolution is not possible, the dispute is referred to a competent court."
        },
        {
          title: "Contact",
          body: "For all enquiries regarding this Agreement: lideravtoshkola@gmail.com (Mon–Sat 09:00–18:00)."
        }
      ]
    }
  }
};

function LegalSection({ slug, locale }: { slug: LegalSlug; locale: Locale }) {
  const content = legalContent[slug][locale];
  const tocLabel = locale === "en" ? "Contents" : locale === "ru" ? "Содержание" : "Зміст";
  const contactLabel = locale === "en" ? "Questions:" : locale === "ru" ? "Вопросы:" : "Питання:";

  return (
    <section className="motion-section bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-8 text-xs font-semibold text-lider-muted">{content.disclaimer}</p>

        {/* Table of contents */}
        <nav className="mb-10 rounded-2xl bg-lider-background p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-lider-red">{tocLabel}</p>
          <ol className="grid gap-1 sm:grid-cols-2">
            {content.sections.map((section, index) => (
              <li key={section.title}>
                <a
                  href={`#legal-${index + 1}`}
                  className="text-sm font-semibold text-lider-muted transition hover:text-lider-red"
                >
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {content.sections.map((section, index) => (
            <article key={section.title} id={`legal-${index + 1}`} className="scroll-mt-20">
              <h2 className="flex items-start gap-3 text-xl font-black text-lider-graphite">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lider-red text-sm font-black text-white">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              {section.body ? (
                <p className="mt-4 text-sm font-semibold leading-7 text-lider-muted">{section.body}</p>
              ) : null}
              {section.bullets ? (
                <ul className="mt-3 space-y-2 pl-11">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm font-semibold leading-6 text-lider-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lider-red" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-lider-background p-5">
          <p className="text-sm font-semibold text-lider-muted">
            {contactLabel}{" "}
            <a href="mailto:lideravtoshkola@gmail.com" className="font-black text-lider-red">
              lideravtoshkola@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLocale(value: string | string[] | undefined): Locale {
  const v = Array.isArray(value) ? value[0] : value;
  return locales.includes(v as Locale) ? (v as Locale) : defaultLocale;
}

function buildJsonLd(page: (typeof contentPages)[number], branch?: (typeof branches)[number]) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Головна", item: "/" },
      { "@type": "ListItem", position: 2, name: page.title, item: `/${page.slug}` }
    ]
  };
  if (page.kind === "city" && branch) {
    return [
      breadcrumb,
      { "@context": "https://schema.org", "@type": "DrivingSchool", name: `${siteBrand.name} ${branch.city}`, address: branch.address, telephone: branch.phone, areaServed: branch.city }
    ];
  }
  if (page.kind === "category") {
    return [
      breadcrumb,
      { "@context": "https://schema.org", "@type": "Course", name: page.title, description: page.summary, provider: { "@type": "DrivingSchool", name: siteBrand.name } }
    ];
  }
  return [
    breadcrumb,
    { "@context": "https://schema.org", "@type": "WebPage", name: page.title, description: page.summary }
  ];
}
