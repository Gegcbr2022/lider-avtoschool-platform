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
import { ConversionWidgets } from "../../components/conversion-widgets";
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
      <ConversionWidgets activeLocale={activeLocale} leadPopupDelayMs={45_000} reopenAfterMs={15 * 60 * 1000} />
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
                {service.condition ? <p className="mt-4 rounded-2xl bg-lider-background p-4 text-xs font-bold leading-5 text-lider-muted">{service.condition}</p> : null}
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

  if (slug === "privacy") {
    return <LegalSection slug="privacy" locale={locale} />;
  }

  if (slug === "terms" || slug === "offer") {
    return <LegalSection slug="terms" locale={locale} />;
  }

  return null;
}

const legalContent = {
  privacy: {
    uk: {
      disclaimer:
        "Цей текст є підготовчим чернетком і потребує юридичного підтвердження перед публікацією як остаточний документ.",
      sections: [
        {
          title: "Хто відповідає за обробку даних",
          body: "Автошкола «Лідер» — суб'єкт господарювання, що надає послуги підготовки водіїв. Контактна адреса: lideravtoshkola@gmail.com. Ми збираємо лише ті дані, які необхідні для запису на навчання та зворотного зв'язку."
        },
        {
          title: "Які дані ми збираємо",
          body: "Через форму заявки: ім'я, телефон, email (за бажанням), місто, обрана категорія, зручний спосіб зв'язку. Через Telegram-бота: Telegram-username та параметри старту. Через аналітику: сторінка переходу, джерело (utm), тип пристрою, мова браузера."
        },
        {
          title: "Для чого використовуються дані",
          body: "Ім'я і телефон — для зв'язку з менеджером і запису на навчання. Email — якщо вказаний, тільки для відповіді на заявку. Аналітичні дані — для розуміння ефективності каналів без ідентифікації особистості."
        },
        {
          title: "Де зберігаються дані",
          body: "Заявки зберігаються у Firebase Firestore (сервери Google, EU/USA). Файли документів — у Firebase Storage. Дані не передаються третім особам, крім технічних підрядників (Google, Telegram, OpenAI) на умовах їх власних угод."
        },
        {
          title: "Скільки зберігаються дані",
          body: "Заявки зберігаються протягом 2 років або до видалення за запитом. Навчальні документи — до завершення навчання і 6 місяців після."
        },
        {
          title: "Ваші права",
          body: "Ви маєте право запросити видалення ваших даних, виправлення або копію. Для цього напишіть на lideravtoshkola@gmail.com."
        },
        {
          title: "Cookies та аналітика",
          body: "Сайт може використовувати Google Analytics 4 та Meta Pixel для агрегованої статистики. Жодних персональних даних в аналітику не передається напряму."
        }
      ]
    },
    ru: {
      disclaimer:
        "Этот текст является подготовительным черновиком и требует юридического подтверждения перед публикацией как окончательный документ.",
      sections: [
        {
          title: "Кто отвечает за обработку данных",
          body: "Автошкола «Лидер» — субъект хозяйствования, предоставляющий услуги подготовки водителей. Контактный адрес: lideravtoshkola@gmail.com. Мы собираем только те данные, которые необходимы для записи на обучение и обратной связи."
        },
        {
          title: "Какие данные мы собираем",
          body: "Через форму заявки: имя, телефон, email (по желанию), город, выбранная категория, удобный способ связи. Через Telegram-бота: Telegram-username и параметры старта. Через аналитику: страница перехода, источник (utm), тип устройства, язык браузера."
        },
        {
          title: "Для чего используются данные",
          body: "Имя и телефон — для связи с менеджером и записи на обучение. Email — если указан, только для ответа на заявку. Аналитические данные — для понимания эффективности каналов без идентификации личности."
        },
        {
          title: "Где хранятся данные",
          body: "Заявки хранятся в Firebase Firestore (серверы Google, EU/USA). Файлы документов — в Firebase Storage. Данные не передаются третьим лицам, кроме технических подрядчиков (Google, Telegram, OpenAI) на условиях их соглашений."
        },
        {
          title: "Сколько хранятся данные",
          body: "Заявки хранятся в течение 2 лет или до удаления по запросу. Учебные документы — до завершения обучения и 6 месяцев после."
        },
        {
          title: "Ваши права",
          body: "Вы имеете право запросить удаление данных, их исправление или копию. Для этого напишите на lideravtoshkola@gmail.com."
        },
        {
          title: "Cookies и аналитика",
          body: "Сайт может использовать Google Analytics 4 и Meta Pixel для агрегированной статистики. Персональные данные в аналитику напрямую не передаются."
        }
      ]
    },
    en: {
      disclaimer:
        "This text is a preparatory draft and requires legal review before being published as a final document.",
      sections: [
        {
          title: "Data controller",
          body: "Leader Driving School — a business entity providing driver training services. Contact: lideravtoshkola@gmail.com. We collect only the data required for enrolment and communication."
        },
        {
          title: "What data we collect",
          body: "Through the request form: name, phone, email (optional), city, selected category, preferred contact method. Through the Telegram bot: Telegram username and start parameters. Through analytics: referral page, source (utm), device type, browser language."
        },
        {
          title: "How data is used",
          body: "Name and phone — to contact the manager and enrol you. Email — if provided, only to respond to your request. Analytics data — to understand channel effectiveness without identifying individuals."
        },
        {
          title: "Where data is stored",
          body: "Requests are stored in Firebase Firestore (Google servers, EU/USA). Document files in Firebase Storage. Data is not shared with third parties except technical subcontractors (Google, Telegram, OpenAI) under their own agreements."
        },
        {
          title: "Retention period",
          body: "Requests are retained for 2 years or until deleted on request. Training documents — until training completion and 6 months thereafter."
        },
        {
          title: "Your rights",
          body: "You have the right to request deletion, correction, or a copy of your data. Write to lideravtoshkola@gmail.com."
        },
        {
          title: "Cookies and analytics",
          body: "The site may use Google Analytics 4 and Meta Pixel for aggregate statistics. No personal data is passed directly to analytics."
        }
      ]
    }
  },
  terms: {
    uk: {
      disclaimer:
        "Цей текст є підготовчим чернетком і потребує юридичного підтвердження перед публікацією як остаточний документ.",
      sections: [
        {
          title: "Предмет",
          body: "Ці умови регулюють використання сайту lider.bdslab.net, форм заявок, майбутнього кабінету учня та мобільного застосунку автошколи «Лідер»."
        },
        {
          title: "Форма заявки",
          body: "Надсилаючи заявку, ви надаєте згоду на зв'язок щодо навчання. Заявка не є договором і не гарантує зарахування без підтвердження менеджера і підписання договору."
        },
        {
          title: "Завантаження документів",
          body: "Файли, надіслані через форму, зберігаються у Firebase Storage і доступні тільки менеджерам автошколи. Дозволені формати: JPG, PNG, PDF. Максимальний розмір файлу: 10 МБ."
        },
        {
          title: "Telegram-бот",
          body: "Telegram-бот надає довідкову інформацію та можливість записатися. Переписка в Telegram не є юридично значущим документом."
        },
        {
          title: "Відповідальність сайту",
          body: "Автошкола не несе відповідальності за технічні збої сторонніх сервісів (Google, Telegram, Vercel) або за дії третіх осіб. Ми зобов'язуємося усувати власні технічні проблеми в розумні строки."
        },
        {
          title: "Актуальність цін",
          body: "Ціни на сайті є орієнтовними. Точна вартість підтверджується менеджером перед підписанням договору і може відрізнятися залежно від міста, категорії та поточних умов."
        },
        {
          title: "Зміни в умовах",
          body: "Ми можемо оновлювати ці умови без попереднього повідомлення. Актуальна версія завжди доступна на цій сторінці."
        }
      ]
    },
    ru: {
      disclaimer:
        "Этот текст является подготовительным черновиком и требует юридического подтверждения перед публикацией как окончательный документ.",
      sections: [
        {
          title: "Предмет",
          body: "Эти условия регулируют использование сайта lider.bdslab.net, форм заявок, будущего кабинета ученика и мобильного приложения автошколы «Лидер»."
        },
        {
          title: "Форма заявки",
          body: "Отправляя заявку, вы соглашаетесь на связь по поводу обучения. Заявка не является договором и не гарантирует зачисление без подтверждения менеджером и подписания договора."
        },
        {
          title: "Загрузка документов",
          body: "Файлы, отправленные через форму, хранятся в Firebase Storage и доступны только менеджерам автошколы. Разрешённые форматы: JPG, PNG, PDF. Максимальный размер файла: 10 МБ."
        },
        {
          title: "Telegram-бот",
          body: "Telegram-бот предоставляет справочную информацию и возможность записаться. Переписка в Telegram не является юридически значимым документом."
        },
        {
          title: "Ответственность сайта",
          body: "Автошкола не несёт ответственности за технические сбои сторонних сервисов (Google, Telegram, Vercel) или действия третьих лиц. Мы обязуемся устранять собственные технические проблемы в разумные сроки."
        },
        {
          title: "Актуальность цен",
          body: "Цены на сайте являются ориентировочными. Точная стоимость подтверждается менеджером перед подписанием договора и может отличаться в зависимости от города, категории и условий."
        },
        {
          title: "Изменения в условиях",
          body: "Мы можем обновлять эти условия без предварительного уведомления. Актуальная версия всегда доступна на этой странице."
        }
      ]
    },
    en: {
      disclaimer:
        "This text is a preparatory draft and requires legal review before being published as a final document.",
      sections: [
        {
          title: "Scope",
          body: "These terms govern use of lider.bdslab.net, request forms, the future student cabinet and the mobile application of Leader Driving School."
        },
        {
          title: "Request form",
          body: "By submitting a request you consent to being contacted about training. A request is not a contract and does not guarantee enrolment without manager confirmation and a signed agreement."
        },
        {
          title: "Document uploads",
          body: "Files sent via the form are stored in Firebase Storage and accessible only to school managers. Permitted formats: JPG, PNG, PDF. Maximum file size: 10 MB."
        },
        {
          title: "Telegram bot",
          body: "The Telegram bot provides reference information and enrolment. Telegram correspondence does not constitute a legally significant document."
        },
        {
          title: "Liability",
          body: "The school is not liable for technical failures of third-party services (Google, Telegram, Vercel) or third-party actions. We commit to resolving our own technical issues within a reasonable timeframe."
        },
        {
          title: "Pricing accuracy",
          body: "Prices on the site are indicative. Exact cost is confirmed by a manager before signing a contract and may vary by city, category and current conditions."
        },
        {
          title: "Updates to these terms",
          body: "We may update these terms without prior notice. The current version is always available on this page."
        }
      ]
    }
  }
} as const;

type LegalSlug = "privacy" | "terms";

function LegalSection({ slug, locale }: { slug: LegalSlug; locale: Locale }) {
  const content = legalContent[slug][locale];

  return (
    <section className="bg-white px-5 py-16 lg:px-8">
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
            {locale === "en"
              ? "Questions about your data or these terms: "
              : locale === "ru"
                ? "Вопросы о данных или условиях: "
                : "Питання про дані або умови: "}
            <a href="mailto:lideravtoshkola@gmail.com" className="font-black text-lider-red">
              lideravtoshkola@gmail.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
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
