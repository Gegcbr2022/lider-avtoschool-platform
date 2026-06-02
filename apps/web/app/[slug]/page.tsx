import {
  admissionDocuments,
  branches,
  defaultLocale,
  homeFaq,
  importantStudyNotes,
  locales,
  priceFootnote,
  pridePhotos,
  retentionFeatures,
  services,
  siteBrand,
  socialLinks,
  type Locale
} from "@lider/shared";
import { SectionHeader, StatusPill } from "@lider/ui";
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, MapPin, Phone, Send, Smartphone } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LanguageSwitcher } from "../../components/language-switcher";
import { LeadForm } from "../../components/lead-form";
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

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.summary,
    openGraph: {
      title: page.title,
      description: page.summary,
      type: "website"
    }
  };
}

export default async function ContentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const activeLocale = normalizeLocale(query.lang);
  const page = getLocalizedContentPage(slug, activeLocale);

  if (!page) {
    notFound();
  }

  const branch = page.branchId ? branches.find((item) => item.id === page.branchId) : undefined;
  const relatedServices = page.category
    ? services.filter((service) => service.category === page.category)
    : services.slice(0, 4);
  const jsonLd = buildJsonLd(page, branch);

  return (
    <main className="min-h-screen bg-lider-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-white/70 bg-lider-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href={`/?lang=${activeLocale}`} className="inline-flex items-center gap-2 font-semibold text-lider-graphite">
            <ArrowLeft size={16} />
            {siteBrand.name}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher activeLocale={activeLocale} />
            <Link
              href={`/?lang=${activeLocale}#signup`}
              className="rounded-[12px] bg-lider-red px-4 py-2 text-sm font-semibold text-white"
            >
              {activeLocale === "en" ? "Apply" : activeLocale === "ru" ? "Записаться" : "Записатися"}
            </Link>
          </div>
        </div>
      </header>

      <section className="premium-surface soft-grid px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.78fr] lg:items-center">
          <div className="reveal-up">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lider-red">
              {page.eyebrow ?? "Автошкола Лідер"}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-lider-graphite md:text-6xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-lider-muted">{page.summary}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#application"
                className="inline-flex items-center justify-center rounded-[12px] bg-lider-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-lider-redDark"
              >
                {page.cta ?? "Отримати консультацію"}
              </Link>
              <Link
                href={`/?lang=${activeLocale}`}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-lider-red transition hover:bg-[#fff1f1]"
              >
                {activeLocale === "en" ? "Home" : activeLocale === "ru" ? "На главную" : "На головну"} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <aside className="rounded-[22px] border border-white bg-white/92 p-5 shadow-soft backdrop-blur">
            <p className="text-sm font-semibold text-lider-graphite">Коротко</p>
            <div className="mt-4 grid gap-3">
              {(page.highlights ?? ["Онлайн-заявка", "Підтримка менеджера", "Підготовка до іспиту"]).map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[14px] border border-lider-line bg-white px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-lider-red" />
                  <span className="text-sm font-semibold text-lider-graphite">{item}</span>
                </div>
              ))}
            </div>
            {branch ? (
              <div className="mt-5 rounded-[16px] bg-lider-red p-4 text-white">
                <MapPin className="h-5 w-5 text-white" />
                <p className="mt-3 text-lg font-semibold">{branch.city}</p>
                <p className="mt-1 text-sm text-white/72">{branch.address}</p>
                <a
                  href={`tel:${branch.phone}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/30 underline-offset-4"
                >
                  <Phone size={15} />
                  {branch.phone}
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1fr]">
          <div>
            <SectionHeader
              title={page.kind === "category" ? "Що входить у курс" : "Як це працює"}
              description="Кожна сторінка допомагає швидко зрозуміти маршрут: що підготувати, з ким зв'язатися і як почати навчання без зайвих кроків."
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(page.checklist ?? ["Залиште заявку", "Отримайте відповідь", "Почніть навчання"]).map((item, index) => (
              <article key={item} className="rounded-[18px] border border-lider-line bg-white p-5 shadow-sm">
                <span className="text-sm font-semibold text-lider-red">0{index + 1}</span>
                <h2 className="mt-3 text-lg font-semibold text-lider-graphite">{item}</h2>
                <p className="mt-2 text-sm leading-6 text-lider-muted">
                  Менеджер автошколи допоможе пройти цей крок без зайвих дзвінків і дублювання інформації.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title={page.kind === "city" ? "Доступні категорії у філії" : "Програми навчання"}
            description="Ціни, категорії та тривалість подані однаково на всіх сторінках, щоб перед заявкою не було плутанини."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {relatedServices.map((service) => (
              <article key={service.id} className="rounded-[18px] border border-lider-line bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-lider-graphite">{service.title}</h2>
                  <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                    {service.retraining ? "Перепідготовка" : service.category}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-lider-muted">{service.summary}</p>
                <p className="mt-5 text-lg font-semibold text-lider-red">
                  від {service.priceFrom.toLocaleString("uk-UA")} грн
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SpecializedPageSection slug={slug} locale={activeLocale} />

      <section id="application" className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1fr]">
          <div>
            <SectionHeader
              title="Залиште заявку"
              description="Залиште телефон, місто та категорію. Менеджер уточнить деталі, підкаже документи і допоможе обрати найближчий старт."
            />
            <div className="mt-8 space-y-4">
              {homeFaq.slice(0, 3).map((item) => (
                <article key={item.question} className="rounded-[16px] border border-lider-line bg-white p-4">
                  <h2 className="font-semibold text-lider-graphite">{item.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <LeadForm locale={activeLocale} submitLabel={page.cta ?? "Отримати консультацію"} />
        </div>
      </section>
    </main>
  );
}

function SpecializedPageSection({ slug, locale }: { slug: string; locale: Locale }) {
  if (slug === "categories" || slug === "prices") {
    return (
      <section className="bg-lider-background px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow={locale === "en" ? "Full list" : locale === "ru" ? "Полный список" : "Повний список"}
            title={locale === "en" ? "Categories, duration and price" : locale === "ru" ? "Категории, сроки и цены" : "Категорії, строки та ціни"}
            description={priceFootnote}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-[20px] border border-lider-line bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-lider-red">{service.category}</p>
                    <h2 className="mt-2 text-2xl font-black text-lider-graphite">{service.title}</h2>
                  </div>
                  <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                    {service.retraining ? "retraining" : service.duration}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-lider-muted">{service.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.outcomes.map((item) => (
                    <span key={item} className="rounded-full bg-lider-background px-3 py-2 text-xs font-black text-lider-graphite">
                      {item}
                    </span>
                  ))}
                </div>
                {service.condition ? <p className="mt-4 rounded-2xl bg-[#fff7f7] p-4 text-xs font-bold leading-5 text-lider-muted">{service.condition}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slug === "documents") {
    return (
      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <article className="rounded-[22px] border border-lider-line bg-lider-background p-6">
            <FileCheck2 className="h-9 w-9 text-lider-red" aria-hidden />
            <h2 className="mt-5 text-3xl font-black text-lider-graphite">
              {locale === "en" ? "Admission documents" : locale === "ru" ? "Документы для поступления" : "Документи для вступу"}
            </h2>
            <div className="mt-5 grid gap-3">
              {admissionDocuments.map((item) => (
                <p key={item} className="rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-lider-graphite">{item}</p>
              ))}
            </div>
          </article>
          <article className="rounded-[22px] bg-lider-graphite p-6 text-white">
            <h2 className="text-3xl font-black">
              {locale === "en" ? "Important after training" : locale === "ru" ? "Важно после обучения" : "Важливо після навчання"}
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

  if (slug === "pride") {
    return (
      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow={locale === "en" ? "Gallery" : locale === "ru" ? "Галерея" : "Галерея"}
            title={locale === "en" ? "Real graduate photos" : locale === "ru" ? "Реальные фото выпускников" : "Реальні фото випускників"}
            description={locale === "en" ? "Neutral captions, no invented personal data, lazy-loaded images." : locale === "ru" ? "Нейтральные подписи, без выдуманных персональных данных, lazy loading." : "Нейтральні підписи, без вигаданих персональних даних, lazy loading."}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

  if (slug === "app" || slug === "account") {
    return (
      <section className="bg-lider-background px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Smartphone className="h-10 w-10 text-lider-red" aria-hidden />
            <h2 className="mt-5 text-4xl font-black text-lider-graphite">
              {locale === "en" ? "Not a one-time app" : locale === "ru" ? "Не одноразовое приложение" : "Не одноразовий застосунок"}
            </h2>
            <p className="mt-4 text-base font-semibold leading-7 text-lider-muted">
              {locale === "en"
                ? "The roadmap keeps students and graduates engaged after the exam."
                : locale === "ru"
                  ? "Roadmap удерживает ученика и выпускника после экзамена."
                  : "Roadmap утримує учня і випускника після іспиту."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {retentionFeatures.map((feature) => (
              <div key={feature} className="rounded-2xl bg-white p-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-lider-red" aria-hidden />
                <p className="mt-3 text-sm font-bold leading-6 text-lider-muted">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slug === "contacts") {
    const telegram = socialLinks.find((item) => item.id === "telegram");
    return (
      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {branches.map((branch) => (
            <article key={branch.id} className="rounded-[20px] border border-lider-line bg-lider-background p-5">
              <MapPin className="h-6 w-6 text-lider-red" aria-hidden />
              <h2 className="mt-4 text-2xl font-black text-lider-graphite">{branch.city}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-lider-muted">{branch.address}</p>
              <p className="mt-3 text-sm font-black text-lider-graphite">{branch.workingHours}</p>
            </article>
          ))}
        </div>
        {telegram ? (
          <div className="mx-auto mt-8 max-w-7xl">
            <a href={telegram.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-black text-white">
              <Send className="h-4 w-4" aria-hidden />
              Telegram
            </a>
          </div>
        ) : null}
      </section>
    );
  }

  if (slug === "privacy" || slug === "terms" || slug === "offer") {
    return (
      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[22px] border border-lider-line bg-lider-background p-6">
          <h2 className="text-3xl font-black text-lider-graphite">
            {locale === "en" ? "Production legal draft" : locale === "ru" ? "Юридический draft для production" : "Юридичний draft для production"}
          </h2>
          <div className="mt-5 space-y-4 text-sm font-semibold leading-7 text-lider-muted">
            <p>
              {locale === "en"
                ? "This page records the current data-processing, communication and platform-use rules. Final legal review is still required before treating it as a signed public policy."
                : locale === "ru"
                  ? "Эта страница фиксирует текущие правила обработки данных, связи и использования платформы. Перед финальным запуском нужен юридический review."
                  : "Ця сторінка фіксує поточні правила обробки даних, зв'язку та використання платформи. Перед фінальним запуском потрібен юридичний review."}
            </p>
            <p>
              {locale === "en"
                ? "Forms store consent, page language, source and request metadata so the team can process each request transparently."
                : locale === "ru"
                  ? "Формы сохраняют согласие, язык страницы, источник и метаданные заявки, чтобы команда прозрачно обрабатывала обращения."
                  : "Форми зберігають згоду, мову сторінки, джерело та метадані заявки, щоб команда прозоро обробляла звернення."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

function normalizeLocale(value: string | string[] | undefined): Locale {
  const nextValue = Array.isArray(value) ? value[0] : value;
  return locales.includes(nextValue as Locale) ? (nextValue as Locale) : defaultLocale;
}

function buildJsonLd(page: (typeof contentPages)[number], branch?: (typeof branches)[number]) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Головна",
        item: "/"
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: `/${page.slug}`
      }
    ]
  };

  if (page.kind === "city" && branch) {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        "@type": "DrivingSchool",
        name: `${siteBrand.name} ${branch.city}`,
        address: branch.address,
        telephone: branch.phone,
        areaServed: branch.city,
        url: `/${page.slug}`
      }
    ];
  }

  if (page.kind === "category") {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        "@type": "Course",
        name: page.title,
        description: page.summary,
        provider: {
          "@type": "DrivingSchool",
          name: siteBrand.name
        }
      }
    ];
  }

  return [
    breadcrumb,
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.summary
    }
  ];
}
