import {
  appStoreLinks,
  branches,
  graduateReviews,
  homeFaq,
  mobileAppFeatures,
  services,
  siteBrand,
  socialLinks,
  socialProofStats,
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
  PhoneCall,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BranchSelector } from "../components/branch-selector";
import { ConversionWidgets } from "../components/conversion-widgets";
import { FaqAccordion } from "../components/faq-accordion";
import { GraduateShowcase } from "../components/graduate-showcase";
import { LeadForm } from "../components/lead-form";
import { MobileMenu } from "../components/mobile-menu";
import { ReviewsCarousel } from "../components/reviews-carousel";
import { contentPages } from "../lib/site-pages";

const navItems = [
  { href: "#services", label: "Категорії" },
  { href: "#benefits", label: "Переваги" },
  { href: "#graduates", label: "Випускники" },
  { href: "#branches", label: "Філіали" },
  { href: "#faq", label: "FAQ" },
  { href: "#contacts", label: "Контакти" },
];

const heroHighlights = [
  "Запис за 1 хвилину",
  "Підбір філіалу поруч",
  "Підтримка до іспиту",
];

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

const socialVisuals: Record<string, string> = {
  facebook: "bg-[#1877F2]",
  instagram: "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4]",
  youtube: "bg-[#FF0000]",
  telegram: "bg-[#229ED9]",
  whatsapp: "bg-[#25D366]",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "DrivingSchool",
      name: siteBrand.name,
      url: "https://lider-avtoschool-platform.vercel.app",
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
        item: `https://lider-avtoschool-platform.vercel.app/${page.slug}`,
      })),
    },
  ],
};

export default function HomePage() {
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
          <Link href="/" className="flex items-center gap-3" aria-label="На головну">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lider-red text-lg font-black text-white shadow-[0_18px_45px_rgba(255,30,30,0.22)]">
              Л
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black uppercase tracking-wide text-lider-graphite">
                Лідер
              </span>
              <span className="block text-xs font-semibold text-lider-muted">
                автошкола у вашому місті
              </span>
            </span>
          </Link>

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
            <a
              href={`tel:${primaryPhoneHref}`}
              className="tap-target rounded-full border border-lider-line px-4 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
            >
              {siteBrand.phoneLabel}
            </a>
            <a
              href="#signup"
              className="tap-target red-cta rounded-full px-5 py-3 text-sm font-black"
            >
              Записатися
            </a>
          </div>

          <MobileMenu navItems={navItems} />
        </div>
      </header>

      <main className="overflow-hidden bg-white pb-24 text-lider-graphite md:pb-0">
        <section className="relative border-b border-lider-line bg-[radial-gradient(circle_at_top_right,rgba(255,30,30,0.13),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f5f5f5_100%)]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-16">
            <div className="space-y-6">
              <StatusPill tone="success">Підготовка до прав A, B, C, D, E</StatusPill>
              <div className="relative overflow-hidden rounded-[24px] border border-white bg-lider-graphite shadow-[0_24px_70px_rgba(26,26,26,0.18)] lg:hidden">
                <Image
                  src="/images/lesson-premium.png"
                  alt="Практичне заняття автошколи Лідер з інструктором"
                  width={900}
                  height={650}
                  priority
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-muted">Категорія B</p>
                  <p className="text-lg font-black text-lider-graphite">від 6 500 грн</p>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-[2.05rem] font-black leading-[1.02] tracking-normal text-lider-graphite sm:text-6xl lg:text-7xl">
                  Права без хаосу: навчання, практика і підтримка до іспиту
                </h1>
                <p className="max-w-2xl text-[0.98rem] font-semibold leading-7 text-lider-muted sm:text-lg">
                  Автошкола «Лідер» допомагає пройти шлях від першої консультації
                  до водійського посвідчення: підберемо категорію, філіал, графік
                  занять і формат зв’язку.
                </p>
              </div>

              <div className="grid gap-3 sm:flex sm:flex-wrap">
                <a
                  href="#signup"
                  className="tap-target red-cta inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-black shadow-premium sm:rounded-full"
                >
                  Записатися на навчання
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </a>
                <a
                  href={`tel:${primaryPhoneHref}`}
                  className="tap-target hidden items-center justify-center gap-2 rounded-2xl border border-lider-line bg-white px-6 py-4 text-base font-black text-lider-graphite shadow-soft transition hover:border-lider-red hover:text-lider-red sm:inline-flex sm:rounded-full"
                >
                  <PhoneCall className="h-5 w-5" aria-hidden />
                  Швидкий дзвінок
                </a>
              </div>

              <div className="hidden grid-cols-3 gap-2 sm:grid sm:max-w-2xl sm:gap-3">
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
                  Найближчий філіал
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

        <section className="border-b border-lider-line bg-white py-6 sm:py-8">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {socialProofStats.map((stat) => (
              <MetricCard key={stat.value} value={stat.value} label={stat.label} detail={stat.detail} />
            ))}
          </div>
        </section>

        <section className="bg-lider-background py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <SectionHeader
                eyebrow="Ми поруч"
                title="Швидкий контакт там, де вам зручно"
                description="Поставте питання, забронюйте консультацію або одразу оберіть філіал. Всі кнопки великі й зручні для мобільного екрана."
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    className="group rounded-3xl border border-white bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-premium"
                  >
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg ${
                        socialVisuals[social.id] ?? "bg-lider-graphite"
                      }`}
                    >
                      {social.id === "youtube" ? (
                        <ArrowRight className="h-5 w-5 fill-current" aria-hidden />
                      ) : social.id === "facebook" || social.id === "instagram" ? (
                        <UsersRound className="h-5 w-5" aria-hidden />
                      ) : social.id === "telegram" ? (
                        <Send className="h-5 w-5" aria-hidden />
                      ) : (
                        <MessageCircle className="h-5 w-5" aria-hidden />
                      )}
                    </span>
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

        <section id="services" className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Категорії та ціни"
              title="Оберіть програму під вашу ціль"
              description="Для першого авто, роботи, мотоцикла або відкриття додаткової категорії. Заявка займає менше хвилини."
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
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-lider-muted">
                          Вартість
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
                        Записатися
                      </a>
                      <a
                        href={`tel:${primaryPhoneHref}`}
                        className="tap-target inline-flex items-center justify-center rounded-2xl border border-lider-line px-4 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
                      >
                        Дзвінок
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="bg-lider-graphite py-12 text-white sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div className="space-y-5">
                <StatusPill tone="warning">Преміальний підхід без зайвої складності</StatusPill>
                <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                  Не просто уроки, а зрозумілий маршрут до прав
                </h2>
                <p className="text-base font-semibold leading-7 text-white/68">
                  Ми прибрали зайвий шум: вам потрібні чітка ціна, нормальний
                  графік, хороший інструктор і швидкий контакт з автошколою.
                </p>
                <a
                  href="#signup"
                  className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-lider-graphite"
                >
                  Отримати консультацію
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

        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Як проходить навчання"
              title="Більше життя на сторінці: заняття, майданчик, випускники"
              description="Показуємо атмосферу навчання й реальні етапи, з яких складається шлях до водійського посвідчення."
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

        <section className="bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <StatusPill tone="success">Мобільний формат</StatusPill>
              <h2 className="text-4xl font-black leading-tight text-lider-graphite sm:text-5xl">
                Слідкуйте за навчанням прямо з телефона
              </h2>
              <p className="text-base font-semibold leading-7 text-lider-muted">
                Розклад, нагадування, матеріали й корисні підказки мають бути
                поруч. Ми будуємо сервіс так, щоб учню було легко рухатися від
                заняття до заняття без зайвих дзвінків.
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

        <section id="graduates" className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Соціальний доказ"
              title="Випускники, відгуки та історії навчання"
              description="Короткі історії людей, які вже пройшли теорію, практику й іспит разом з «Лідером»."
            />
            <div className="mt-8 space-y-8">
              <GraduateShowcase />
              <ReviewsCarousel />
            </div>
          </div>
        </section>

        <section className="bg-lider-graphite py-12 text-white sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.25)]">
              <Image
                src="/images/practice-ground-premium.png"
                alt="Практичний майданчик автошколи Лідер"
                width={1100}
                height={850}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="space-y-5">
              <StatusPill tone="warning">Результат</StatusPill>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                Сильна школа відчувається в деталях
              </h2>
              <p className="text-base font-semibold leading-7 text-white/68">
                Нам важливо, щоб учень розумів маршрут, бачив прогрес і мав
                поруч людей, які відповідають швидко та по суті.
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

        <section id="branches" className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeader
              eyebrow="Філіали"
              title="Оберіть місто та зручний маршрут"
              description="Активний філіал показує адресу, контакти та карту. Можна одразу зателефонувати або залишити заявку."
            />
            <div className="mt-8">
              <BranchSelector />
            </div>
          </div>
        </section>

        <section id="faq" className="bg-lider-background py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHeader
              eyebrow="FAQ"
              title="Коротко про головне перед стартом"
              description="Зібрали питання, які найчастіше ставлять перед записом: документи, строки, оплата, іспит і вибір категорії."
            />
            <FaqAccordion items={homeFaq} />
          </div>
        </section>

        <section id="signup" className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div id="contacts" className="space-y-6">
              <StatusPill tone="success">Заявка</StatusPill>
              <h2 className="text-4xl font-black leading-tight text-lider-graphite sm:text-5xl">
                Залиште контакт, і ми підберемо найкращий старт
              </h2>
              <p className="text-base font-semibold leading-7 text-lider-muted">
                Менеджер уточнить категорію, місто, графік, ціну та найближчу
                групу. Можна попросити відповідь дзвінком, у Telegram або WhatsApp.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <a
                  href={`tel:${primaryPhoneHref}`}
                  className="tap-target rounded-2xl bg-lider-graphite p-4 text-white"
                >
                  <PhoneCall className="h-6 w-6" aria-hidden />
                  <span className="mt-3 block text-sm font-black">Подзвонити</span>
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
            <LeadForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-lider-line bg-lider-graphite text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.2fr_0.8fr]">
          <div>
            <p className="text-2xl font-black">{siteBrand.name}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
              Курси водіння, практика, підготовка до іспиту та консультація щодо
              вибору категорії.
            </p>
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
      </footer>

      <ConversionWidgets
        leadPopupDelayMs={process.env.NODE_ENV === "production" ? 25000 : 1500}
        reopenAfterMs={35000}
      />
    </>
  );
}
