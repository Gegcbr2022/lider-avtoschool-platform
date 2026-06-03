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

const legalContent = {
  privacy: {
    uk: {
      disclaimer: "Цей текст є підготовчим чернетком і потребує юридичного підтвердження перед публікацією як остаточний документ.",
      sections: [
        { title: "Хто відповідає за обробку даних", body: "Автошкола «Лідер» — суб'єкт господарювання, що надає послуги підготовки водіїв. Контактна адреса: lideravtoshkola@gmail.com. Ми збираємо лише ті дані, які необхідні для запису на навчання та зворотного зв'язку." },
        { title: "Які дані ми збираємо", body: "Через форму заявки: ім'я, телефон, email (за бажанням), місто, обрана категорія. Через Telegram-бота: Telegram-username та параметри старту. Через аналітику: сторінка переходу, джерело (utm), тип пристрою." },
        { title: "Для чого використовуються дані", body: "Ім'я і телефон — для зв'язку з менеджером і запису на навчання. Email — якщо вказаний, тільки для відповіді на заявку. Аналітичні дані — для розуміння ефективності каналів без ідентифікації особистості." },
        { title: "Де зберігаються дані", body: "Заявки зберігаються у Firebase Firestore (сервери Google, EU/USA). Файли документів — у Firebase Storage. Дані не передаються третім особам, крім технічних підрядників (Google, Telegram, OpenAI)." },
        { title: "Скільки зберігаються дані", body: "Заявки зберігаються протягом 2 років або до видалення за запитом. Навчальні документи — до завершення навчання і 6 місяців після." },
        { title: "Ваші права", body: "Ви маєте право запросити видалення ваших даних, виправлення або копію. Для цього напишіть на lideravtoshkola@gmail.com." },
        { title: "Cookies та аналітика", body: "Сайт може використовувати Google Analytics 4 та Meta Pixel для агрегованої статистики. Жодних персональних даних в аналітику не передається напряму." }
      ]
    },
    ru: {
      disclaimer: "Этот текст является подготовительным черновиком и требует юридического подтверждения перед публикацией как окончательный документ.",
      sections: [
        { title: "Кто отвечает за обработку данных", body: "Автошкола «Лидер» — субъект хозяйствования, предоставляющий услуги подготовки водителей. Контактный адрес: lideravtoshkola@gmail.com." },
        { title: "Какие данные мы собираем", body: "Через форму заявки: имя, телефон, email (по желанию), город, выбранная категория. Через Telegram-бота: Telegram-username. Через аналитику: источник, тип устройства." },
        { title: "Для чего используются данные", body: "Имя и телефон — для связи с менеджером и записи на обучение. Email — если указан, только для ответа на заявку." },
        { title: "Где хранятся данные", body: "Заявки хранятся в Firebase Firestore (серверы Google, EU/USA). Файлы документов — в Firebase Storage." },
        { title: "Сколько хранятся данные", body: "Заявки хранятся в течение 2 лет или до удаления по запросу." },
        { title: "Ваши права", body: "Вы имеете право запросить удаление данных, их исправление или копию. Напишите на lideravtoshkola@gmail.com." },
        { title: "Cookies и аналитика", body: "Сайт может использовать Google Analytics 4 и Meta Pixel для агрегированной статистики." }
      ]
    },
    en: {
      disclaimer: "This text is a preparatory draft and requires legal review before being published as a final document.",
      sections: [
        { title: "Data controller", body: "Leader Driving School — a business entity providing driver training services. Contact: lideravtoshkola@gmail.com." },
        { title: "What data we collect", body: "Through the request form: name, phone, email (optional), city, selected category. Through the Telegram bot: username. Through analytics: referral source, device type." },
        { title: "How data is used", body: "Name and phone — to contact the manager and enrol you. Email — if provided, only to respond to your request." },
        { title: "Where data is stored", body: "Requests are stored in Firebase Firestore (Google servers, EU/USA). Document files in Firebase Storage." },
        { title: "Retention period", body: "Requests are retained for 2 years or until deleted on request." },
        { title: "Your rights", body: "You have the right to request deletion, correction, or a copy of your data. Write to lideravtoshkola@gmail.com." },
        { title: "Cookies and analytics", body: "The site may use Google Analytics 4 and Meta Pixel for aggregate statistics." }
      ]
    }
  },
  terms: {
    uk: {
      disclaimer: "Цей текст є підготовчим чернетком і потребує юридичного підтвердження перед публікацією як остаточний документ.",
      sections: [
        { title: "Предмет", body: "Ці умови регулюють використання сайту lider.bdslab.net, форм заявок та мобільного застосунку автошколи «Лідер»." },
        { title: "Форма заявки", body: "Надсилаючи заявку, ви надаєте згоду на зв'язок щодо навчання. Заявка не є договором і не гарантує зарахування без підтвердження менеджера." },
        { title: "Завантаження документів", body: "Файли, надіслані через форму, зберігаються у Firebase Storage і доступні тільки менеджерам автошколи. Дозволені формати: JPG, PNG, PDF. Максимальний розмір файлу: 10 МБ." },
        { title: "Telegram-бот", body: "Telegram-бот надає довідкову інформацію та можливість записатися. Переписка в Telegram не є юридично значущим документом." },
        { title: "Актуальність цін", body: "Ціни на сайті є орієнтовними. Точна вартість підтверджується менеджером перед підписанням договору." },
        { title: "Зміни в умовах", body: "Ми можемо оновлювати ці умови без попереднього повідомлення. Актуальна версія завжди доступна на цій сторінці." }
      ]
    },
    ru: {
      disclaimer: "Этот текст является подготовительным черновиком и требует юридического подтверждения перед публикацией как окончательный документ.",
      sections: [
        { title: "Предмет", body: "Эти условия регулируют использование сайта lider.bdslab.net, форм заявок и мобильного приложения автошколы «Лидер»." },
        { title: "Форма заявки", body: "Отправляя заявку, вы соглашаетесь на связь по поводу обучения. Заявка не является договором и не гарантирует зачисление без подтверждения менеджером." },
        { title: "Загрузка документов", body: "Файлы хранятся в Firebase Storage и доступны только менеджерам автошколы. Разрешённые форматы: JPG, PNG, PDF. Максимальный размер: 10 МБ." },
        { title: "Telegram-бот", body: "Telegram-бот предоставляет справочную информацию и возможность записаться." },
        { title: "Актуальность цен", body: "Цены на сайте являются ориентировочными. Точная стоимость подтверждается менеджером перед подписанием договора." },
        { title: "Изменения в условиях", body: "Мы можем обновлять эти условия без предварительного уведомления." }
      ]
    },
    en: {
      disclaimer: "This text is a preparatory draft and requires legal review before being published as a final document.",
      sections: [
        { title: "Scope", body: "These terms govern use of lider.bdslab.net, request forms and the mobile application of Leader Driving School." },
        { title: "Request form", body: "By submitting a request you consent to being contacted about training. A request is not a contract and does not guarantee enrolment." },
        { title: "Document uploads", body: "Files are stored in Firebase Storage and accessible only to school managers. Permitted: JPG, PNG, PDF. Max size: 10 MB." },
        { title: "Telegram bot", body: "The Telegram bot provides reference information and enrolment. Telegram correspondence is not a legally significant document." },
        { title: "Pricing accuracy", body: "Prices are indicative. Exact cost is confirmed by a manager before signing a contract." },
        { title: "Updates", body: "We may update these terms without prior notice. The current version is always available here." }
      ]
    }
  }
} as const;

type LegalSlug = "privacy" | "terms";

function LegalSection({ slug, locale }: { slug: LegalSlug; locale: Locale }) {
  const content = legalContent[slug][locale];
  return (
    <section className="motion-section bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-2xl border border-lider-red/20 bg-lider-background px-5 py-4 text-sm font-semibold leading-6 text-lider-muted">
          ⚠ {content.disclaimer}
        </div>
        <div className="space-y-8">
          {content.sections.map((section, index) => (
            <article key={section.title}>
              <h2 className="flex items-center gap-3 text-xl font-black text-lider-graphite">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lider-red text-sm font-black text-white">
                  {index + 1}
                </span>
                {section.title}
              </h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-lider-muted">{section.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-lider-background p-5">
          <p className="text-sm font-semibold text-lider-muted">
            {locale === "en" ? "Questions: " : locale === "ru" ? "Вопросы: " : "Питання: "}
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
