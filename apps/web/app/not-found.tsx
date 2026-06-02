import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-lider-background px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lider-red">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-lider-graphite">Сторінку не знайдено</h1>
        <p className="mt-4 text-lider-muted">Поверніться на головну або залиште заявку на консультацію.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-[12px] bg-lider-red px-5 py-3 text-sm font-semibold text-white"
        >
          На головну
        </Link>
      </section>
    </main>
  );
}
