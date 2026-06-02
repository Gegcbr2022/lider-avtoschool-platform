import {
  branches,
  commercialAdvantages,
  graduateStories,
  homeFaq,
  instructorProfiles,
  learningSteps,
  services,
  siteBrand,
  vehicleFleet
} from "@lider/shared";
import { MetricCard, SectionHeader, StatusPill } from "@lider/ui";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  GraduationCap,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UsersRound
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "../components/lead-form";
import { LeadPopup } from "../components/lead-popup";
import { contentPages } from "../lib/site-pages";

const navItems = [
  ["Категорії", "#services"],
  ["Етапи", "#process"],
  ["Випускники", "#graduates"],
  ["Філіали", "#branches"],
  ["Контакти", "#lead"]
] as const;

const trustFacts = [
  ["10+ років", "команда навчає водіїв і супроводжує документи"],
  ["15000+", "учнів уже отримали права за підтримки автошколи"],
  ["5 філій", "Київ, Слов'янськ, Краматорськ, Дніпро, Добропілля"],
  ["A-CE", "мото, легкові авто, вантажні категорії і перепідготовка"]
] as const;

const platformItems = [
  {
    icon: GraduationCap,
    title: "LMS і ПДР тренажер",
    text: "Уроки, відео, домашні завдання, екзаменаційний режим та статистика спроб."
  },
  {
    icon: CalendarDays,
    title: "Запис на практику",
    text: "Календар інструкторів, авто, вільні слоти, підтвердження та нагадування."
  },
  {
    icon: CreditCard,
    title: "Платежі",
    text: "Абстрактний платіжний шар для LiqPay, Fondy і Monobank з webhook та квитанціями."
  },
  {
    icon: Bell,
    title: "Push і Telegram",
    text: "Події заявки, оплати, уроку, практики, акції та персональні нагадування."
  },
  {
    icon: FileCheck2,
    title: "Документи",
    text: "Завантаження файлів, перевірка менеджером, статуси та історія документів."
  },
  {
    icon: ShieldCheck,
    title: "Безпека",
    text: "RBAC, валідація, аудит-логи, rate limiting і правила доступу Firebase."
  }
];

const quickLinks = [
  ["Автошкола Київ", "/avtoshkola-kyiv"],
  ["Автошкола Дніпро", "/avtoshkola-dnipro"],
  ["Категорія B", "/kategoriia-b"],
  ["Категорія CE", "/kategoriia-ce"]
] as const;

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "DrivingSchool",
      name: siteBrand.name,
      email: siteBrand.email,
      telephone: siteBrand.phoneLabel,
      image: "/images/hero-driving-school.png",
      areaServed: branches.map((branch) => branch.city),
      department: branches.map((branch) => ({
        "@type": "LocalBusiness",
        name: `${siteBrand.name} ${branch.city}`,
        address: branch.address,
        telephone: branch.phone
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: homeFaq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer
        }
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Головна",
          item: "/"
        }
      ]
    }
  ];

  return (
    <main className="overflow-hidden bg-lider-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b border-white/60 bg-lider-background/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt={siteBrand.name} width={96} height={41} priority className="shrink-0" />
            <span className="hidden text-base font-semibold text-lider-graphite sm:inline">{siteBrand.name}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-lider-muted lg:flex">
            {navItems.map(([label, href]) => (
              <Link key={label} href={href} className="transition hover:text-lider-green">
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="#lead"
            className="rounded-[12px] bg-lider-yellow px-4 py-2.5 text-sm font-semibold text-lider-graphite shadow-sm transition hover:-translate-y-0.5 hover:bg-[#ffdf33]"
          >
            Записатися
          </Link>
        </div>
      </header>

      <section className="premium-surface soft-grid relative px-5 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto grid min-h-[calc(100vh-110px)] max-w-7xl items-center gap-12 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="reveal-up max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-lider-line bg-white/88 px-3 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-lider-green shadow-sm">
              <Sparkles size={14} />
              Автошкола нового рівня
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-lider-graphite md:text-7xl">
              Отримайте права без хаосу, зайвих дзвінків і втрачених документів
            </h1>
            <p className="mt-6 text-lg leading-8 text-lider-muted md:text-xl">
              Теорія онлайн, практика з інструктором, філії у 5 містах, супровід до ТСЦ, CRM, кабінет учня і мобільний
              застосунок в одній цифровій системі.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#lead"
                className="inline-flex items-center justify-center rounded-[12px] bg-lider-yellow px-5 py-3 text-sm font-semibold text-[#0f1714] transition hover:-translate-y-0.5 hover:bg-[#ffdf33]"
              >
                Підібрати курс
              </Link>
              <Link
                href="#process"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-lider-green transition hover:bg-[#eaf4f1]"
              >
                Як проходить навчання <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {quickLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-full border border-lider-line bg-white/80 px-4 py-2 text-sm font-semibold text-lider-green transition hover:border-lider-green"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-44 w-44 rounded-full bg-lider-yellow/45 blur-3xl" />
            <div className="absolute -right-12 bottom-12 h-52 w-52 rounded-full bg-lider-green/18 blur-3xl" />
            <div className="float-slow relative overflow-hidden rounded-[26px] border border-white bg-white shadow-soft">
              <Image
                src="/images/hero-driving-school.png"
                alt="Інструктор та студент біля навчального автомобіля"
                width={1600}
                height={1000}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-7 left-4 right-4 rounded-[18px] border border-lider-line bg-white/95 p-4 shadow-soft backdrop-blur md:left-8 md:right-8">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                {["Менеджер закріплений", "Практика в календарі", "ПДР тренажер"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 font-semibold text-lider-graphite">
                    <CheckCircle2 className="h-4 w-4 text-lider-green" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
            <MetricCard label="Філії" value="5" detail="Київ, Дніпро, Донеччина" />
            <MetricCard label="Категорії" value="A-CE" detail="Плюс перепідготовка" />
            <MetricCard label="Випускники" value="15k+" detail="учнів за 10+ років" />
          </div>
        </div>
      </section>

      <section className="border-y border-lider-line bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustFacts.map(([value, detail]) => (
            <article
              key={value}
              className="rounded-[14px] border border-lider-line p-5 transition hover:-translate-y-1 hover:shadow-soft"
            >
              <strong className="text-2xl font-semibold text-lider-green">{value}</strong>
              <p className="mt-2 text-sm leading-6 text-lider-muted">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Категорії навчання без дрібного шрифту"
            description="Для кожної категорії є прозора ціна теоретичної частини, опис результату, тривалість і шлях до заявки. Практичні заняття менеджер уточнює за містом і графіком."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="group rounded-[18px] border border-lider-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-lider-green/40 hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-lider-graphite">{service.title}</h3>
                  <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                    {service.retraining ? "Перепідготовка" : service.category}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 text-lider-muted">{service.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {service.outcomes.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#edf5f2] px-3 py-1 text-xs font-semibold text-lider-green"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-end justify-between border-t border-lider-line pt-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lider-muted">Тривалість</p>
                    <p className="mt-1 font-semibold text-lider-graphite">{service.duration}</p>
                  </div>
                  <p className="text-lg font-semibold text-lider-green">
                    від {service.priceFrom.toLocaleString("uk-UA")} грн
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start">
            <SectionHeader
              title="Шість кроків до посвідчення водія"
              description="Ідея етапів є сильною у конкурентів, але тут вона прив'язана до реального цифрового процесу: заявка, документи, LMS, практика, іспит і результат."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {learningSteps.map((step) => (
                <article key={step.number} className="rounded-[18px] border border-lider-line bg-white p-5 shadow-sm">
                  <span className="text-sm font-semibold text-lider-green">{step.number}</span>
                  <h3 className="mt-3 text-lg font-semibold text-lider-graphite">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-lider-green px-5 py-24 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-yellow">Онлайн-навчання</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              Теорія, тести і нагадування не губляться між месенджерами
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/74">
              Учень бачить прогрес, домашні завдання, платежі, документи і найближчу практику. Менеджер не збирає
              інформацію вручну, а веде клієнта по статусах.
            </p>
            <Link
              href="#lead"
              className="mt-8 inline-flex items-center gap-2 rounded-[12px] bg-lider-yellow px-5 py-3 text-sm font-semibold text-lider-graphite"
            >
              Почати онлайн <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {commercialAdvantages.map((item, index) => (
              <article key={item} className="rounded-[18px] border border-white/15 bg-white/8 p-5">
                <span className="text-sm font-semibold text-lider-yellow">0{index + 1}</span>
                <p className="mt-3 text-sm leading-6 text-white/78">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="graduates" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionHeader
              title="Наші випускники"
              description="Аналог блока «Гордість», але у сучасному форматі: структуровані історії, дати, міста, категорії і короткі відгуки. Реальні фото можна підключити після юридичного погодження."
            />
            <Link href="/reviews" className="inline-flex items-center gap-2 font-semibold text-lider-green">
              Більше історій <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {graduateStories.map((story) => (
              <article
                key={story.id}
                className="rounded-[18px] border border-lider-line bg-[#f9fcfa] p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-lider-green text-lg font-semibold text-lider-yellow">
                    {story.initials}
                  </div>
                  <StatusPill tone="success">Категорія {story.category}</StatusPill>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-lider-graphite">{story.name}</h3>
                <p className="mt-1 text-sm font-medium text-lider-muted">
                  {story.city} · {story.date}
                </p>
                <p className="mt-4 text-sm leading-6 text-lider-muted">“{story.quote}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[24px] border border-lider-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-green">Команда</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-lider-graphite">
                  Інструктори, з якими спокійніше
                </h2>
              </div>
              <UsersRound className="h-8 w-8 text-lider-green" />
            </div>
            <div className="mt-6 grid gap-4">
              {instructorProfiles.map((instructor) => (
                <article key={instructor.name} className="rounded-[16px] border border-lider-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-lider-graphite">{instructor.name}</h3>
                    <span className="text-sm font-semibold text-lider-green">{instructor.city}</span>
                  </div>
                  <p className="mt-2 text-sm text-lider-muted">
                    {instructor.experience} · {instructor.gearbox}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{instructor.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-lider-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-green">Автопарк</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-lider-graphite">
                  Авто для різних сценаріїв
                </h2>
              </div>
              <Star className="h-8 w-8 text-lider-yellow" />
            </div>
            <div className="mt-6 grid gap-4">
              {vehicleFleet.map((vehicle) => (
                <article key={vehicle.model} className="rounded-[16px] border border-lider-line bg-[#f9fcfa] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-lider-graphite">{vehicle.model}</h3>
                    <StatusPill>{vehicle.category}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-lider-green">{vehicle.gearbox}</p>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{vehicle.feature}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Одна система для заявки, навчання і продажів"
            description="Архітектура покриває публічний сайт, CRM, кабінет студента, мобільний застосунок, Firebase API, платежі, push, Telegram і AI-консультанта."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {platformItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-[18px] border border-lider-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
                >
                  <Icon className="h-6 w-6 text-lider-green" />
                  <h3 className="mt-5 text-lg font-semibold text-lider-graphite">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-lider-muted">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="branches" className="bg-lider-green px-5 py-24 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-yellow">Філії</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
                Поруч з учнем, але в єдиному цифровому процесі
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/75">
                Дані філій використовуються в SEO, формах, мапах і повідомленнях. Це спрощує масштабування без
                дублювання контенту.
              </p>
            </div>
            <Link href="/branches" className="inline-flex items-center gap-2 font-semibold text-lider-yellow">
              Усі контакти <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {branches.map((branch) => (
              <article key={branch.id} className="rounded-[18px] border border-white/15 bg-white/8 p-5">
                <MapPin className="h-5 w-5 text-lider-yellow" />
                <h3 className="mt-4 text-xl font-semibold">{branch.city}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{branch.address}</p>
                <a className="mt-4 block font-semibold text-lider-yellow" href={`tel:${branch.phone}`}>
                  {branch.phone}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="lead" className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-lider-green">
              <MessageCircle size={14} />
              Консультація
            </p>
            <SectionHeader
              title="Запишіться на консультацію"
              description="Форма валідована Zod, готова до передачі в CRM і в production працює через Firebase Cloud Functions або інший API за змінною API_URL."
            />
            <div className="mt-10 space-y-4">
              {homeFaq.map((item) => (
                <article key={item.question} className="border-b border-lider-line pb-4">
                  <h3 className="font-semibold text-lider-graphite">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
          <LeadForm
            title="Підберемо курс і філію"
            description="Залиште контакт, а менеджер уточнить категорію, місто, графік і документи."
            submitLabel="Отримати консультацію"
          />
        </div>
      </section>

      <section className="px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[24px] bg-lider-graphite p-6 text-white shadow-soft md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-lider-yellow">
                <Trophy size={14} />
                Наступний випускник
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
                Нехай наступна історія з правами буде вашою
              </h2>
              <p className="mt-4 max-w-3xl text-white/70">
                Оберіть категорію, місто і зручний формат. Решту маршруту менеджер розкладе по кроках.
              </p>
            </div>
            <Link
              href="#lead"
              className="inline-flex items-center justify-center rounded-[12px] bg-lider-yellow px-6 py-3 text-sm font-semibold text-lider-graphite"
            >
              Залишити заявку
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-lider-line bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt={siteBrand.name} width={86} height={37} className="shrink-0" />
            <div>
              <p className="font-semibold text-lider-graphite">{siteBrand.name}</p>
              <p className="mt-2 text-sm text-lider-muted">{siteBrand.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-lider-muted">
            {contentPages.slice(0, 10).map((page) => (
              <Link key={page.slug} href={`/${page.slug}`} className="hover:text-lider-green">
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
      <LeadPopup delayMs={process.env.NODE_ENV === "production" ? 60_000 : 1_500} />
    </main>
  );
}
