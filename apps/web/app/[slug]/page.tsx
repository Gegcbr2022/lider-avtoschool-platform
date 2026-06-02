import { branches, homeFaq, services, siteBrand } from "@lider/shared";
import { SectionHeader, StatusPill } from "@lider/ui";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "../../components/lead-form";
import { contentPages } from "../../lib/site-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return contentPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = contentPages.find((item) => item.slug === slug);

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

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = contentPages.find((item) => item.slug === slug);

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
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lider-graphite">
            <ArrowLeft size={16} />
            {siteBrand.name}
          </Link>
          <Link
            href="/#signup"
            className="rounded-[12px] bg-lider-red px-4 py-2 text-sm font-semibold text-white"
          >
            Записатися
          </Link>
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
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white px-5 py-3 text-sm font-semibold text-lider-red transition hover:bg-[#fff1f1]"
              >
                На головну <ArrowRight size={16} />
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
          <LeadForm submitLabel={page.cta ?? "Отримати консультацію"} />
        </div>
      </section>
    </main>
  );
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
