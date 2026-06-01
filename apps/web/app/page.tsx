import { branches, services, siteBrand } from "@lider/shared";
import { MetricCard, SectionHeader, StatusPill } from "@lider/ui";
import { ArrowRight, Bell, CalendarDays, CreditCard, FileCheck2, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LeadForm } from "../components/lead-form";
import { contentPages } from "../lib/site-pages";

const navItems = [
  ["Категорії", "#services"],
  ["Філіали", "#branches"],
  ["Кабінет", "#platform"],
  ["Ціни", "/prices"],
  ["Контакти", "#lead"]
] as const;

const platformItems = [
  {
    icon: GraduationCap,
    title: "LMS і ПДР тренажер",
    text: "Уроки, відео, домашні завдання, 20 питань в екзаменаційному режимі та статистика спроб."
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
    text: "RBAC, валідація, аудит-логи, rate limiting, правила доступу Firebase та OWASP-підхід."
  }
];

const faq = [
  ["Чи можна подати заявку онлайн?", "Так. Форма створює заявку в CRM-потоці, а менеджер закріплює наступну дію."],
  ["Які категорії доступні?", "A, A1, B, C, CE, а також перепідготовка для A, A1, B і C."],
  ["Чи є особистий кабінет?", "Так. Кабінет включає прогрес навчання, платежі, документи, практику і сповіщення."]
] as const;

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: siteBrand.name,
    email: siteBrand.email,
    areaServed: branches.map((branch) => branch.city),
    department: branches.map((branch) => ({
      "@type": "LocalBusiness",
      name: `${siteBrand.name} ${branch.city}`,
      address: branch.address,
      telephone: branch.phone
    }))
  };

  return (
    <main className="overflow-hidden bg-lider-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="sticky top-0 z-40 border-b border-white/60 bg-lider-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-lider-green text-lg font-black text-lider-yellow">
              Л
            </span>
            <span className="text-base font-semibold text-lider-graphite">{siteBrand.name}</span>
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
            className="rounded-[12px] bg-lider-yellow px-4 py-2.5 text-sm font-semibold text-lider-graphite shadow-sm transition hover:bg-[#ffdf33]"
          >
            Записатися
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-semibold tracking-[-0.04em] text-lider-graphite md:text-7xl">
            Навчання водінню без хаосу в документах, графіку та оплатах
          </h1>
          <p className="mt-6 text-lg leading-8 text-lider-muted md:text-xl">
            Автошкола «Лідер» поєднує сайт, CRM, особистий кабінет, мобільний застосунок, LMS, платежі та запис на практику в одну цифрову систему.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#lead"
              className="inline-flex items-center justify-center rounded-[12px] bg-lider-yellow px-5 py-3 text-sm font-semibold text-[#0f1714] transition hover:bg-[#ffdf33]"
            >
              Залишити заявку
            </Link>
            <Link
              href="#platform"
              className="inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-3 text-sm font-semibold text-lider-green transition hover:bg-[#eaf4f1]"
            >
              Подивитися екосистему <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative lg:col-start-2 lg:row-span-2">
          <div className="absolute -left-8 top-12 h-44 w-44 rounded-full bg-lider-yellow/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-[26px] border border-white bg-white shadow-soft">
            <Image
              src="/images/hero-driving-school.png"
              alt="Інструктор та студент біля навчального автомобіля"
              width={1600}
              height={1000}
              priority
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-6 right-6 rounded-[18px] border border-lider-line bg-white p-4 shadow-soft">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <span className="font-semibold text-lider-graphite">Онлайн-заявка</span>
              <span className="font-semibold text-lider-graphite">Практика в календарі</span>
              <span className="font-semibold text-lider-graphite">ПДР тренажер</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-start-1 lg:row-start-2">
          <MetricCard label="Філії" value="4" detail="Київ, Дніпро, Донеччина" />
          <MetricCard label="Категорії" value="A-CE" detail="Плюс перепідготовка" />
          <MetricCard label="Кабінет" value="24/7" detail="Прогрес, оплати, практика" />
        </div>
      </section>

      <section id="services" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Категорії навчання"
            description="Для кожної категорії є окрема картка послуги, прозора ціна від, опис результату та шлях до заявки."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="rounded-[18px] border border-lider-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-lider-graphite">{service.title}</h3>
                  <StatusPill tone={service.retraining ? "warning" : "neutral"}>
                    {service.retraining ? "Перепідготовка" : service.category}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 text-lider-muted">{service.summary}</p>
                <div className="mt-6 flex items-end justify-between border-t border-lider-line pt-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-lider-muted">Тривалість</p>
                    <p className="mt-1 font-semibold text-lider-graphite">{service.duration}</p>
                  </div>
                  <p className="text-lg font-semibold text-lider-green">від {service.priceFrom.toLocaleString("uk-UA")} грн</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            title="Одна система для заявки, навчання і продажів"
            description="Архітектура покриває публічний сайт, CRM, кабінет студента, мобільний застосунок, Firebase API, платежі, push, Telegram і AI-консультанта."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {platformItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[18px] border border-lider-line bg-white p-6 shadow-sm">
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
              <h2 className="text-3xl font-semibold tracking-[-0.02em] md:text-5xl">Філіали з єдиним цифровим процесом</h2>
              <p className="mt-4 text-lg leading-8 text-white/75">
                Сайт, CRM і кабінет не прив'язані до одного домену чи міста. Дані філій зберігаються централізовано і використовуються в SEO, формах, мапах та повідомленнях.
              </p>
            </div>
            <Link href="/branches" className="inline-flex items-center gap-2 font-semibold text-lider-yellow">
              Усі контакти <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <SectionHeader
              title="Запишіться на консультацію"
              description="Форма валідована Zod, готова до передачі в CRM і може бути підключена до Firebase Cloud Functions або іншого API через змінну API_URL."
            />
            <div className="mt-10 space-y-4">
              {faq.map(([question, answer]) => (
                <article key={question} className="border-b border-lider-line pb-4">
                  <h3 className="font-semibold text-lider-graphite">{question}</h3>
                  <p className="mt-2 text-sm leading-6 text-lider-muted">{answer}</p>
                </article>
              ))}
            </div>
          </div>
          <LeadForm />
        </div>
      </section>

      <footer className="border-t border-lider-line bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-semibold text-lider-graphite">{siteBrand.name}</p>
            <p className="mt-2 text-sm text-lider-muted">{siteBrand.email}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-lider-muted">
            {contentPages.slice(0, 7).map((page) => (
              <Link key={page.slug} href={`/${page.slug}`} className="hover:text-lider-green">
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
