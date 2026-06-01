import { branches, services, siteBrand } from "@lider/shared";
import { SectionHeader } from "@lider/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    description: page.summary
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = contentPages.find((item) => item.slug === slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-lider-background">
      <header className="border-b border-lider-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="font-semibold text-lider-graphite">
            {siteBrand.name}
          </Link>
          <Link href="/#lead" className="rounded-[12px] bg-lider-yellow px-4 py-2 text-sm font-semibold text-lider-graphite">
            Записатися
          </Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <SectionHeader title={page.title} description={page.summary} />
        <div className="mt-10 grid gap-5 lg:grid-cols-[0.7fr_0.3fr]">
          <article className="rounded-[18px] border border-lider-line bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-lider-graphite">Готовий розділ для production-контенту</h2>
            <p className="mt-4 leading-7 text-lider-muted">
              Ця сторінка підключена до sitemap, metadata і маршрутизації Next.js. Контент можна винести в CMS або Firestore без зміни URL-структури.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {services.slice(0, 4).map((service) => (
                <div key={service.id} className="rounded-[14px] border border-lider-line p-4">
                  <p className="font-semibold text-lider-graphite">{service.title}</p>
                  <p className="mt-2 text-sm text-lider-muted">{service.summary}</p>
                </div>
              ))}
            </div>
          </article>
          <aside className="rounded-[18px] border border-lider-line bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-lider-graphite">Філіали</h2>
            <div className="mt-4 space-y-4">
              {branches.map((branch) => (
                <div key={branch.id}>
                  <p className="font-medium text-lider-graphite">{branch.city}</p>
                  <p className="text-sm text-lider-muted">{branch.phone}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
