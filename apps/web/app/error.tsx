"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-lider-background px-6">
      <section className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lider-green">500</p>
        <h1 className="mt-4 text-4xl font-semibold text-lider-graphite">Щось пішло не так</h1>
        <p className="mt-4 text-lider-muted">Ми вже знаємо про помилку. Спробуйте оновити сторінку.</p>
        <button
          onClick={reset}
          className="mt-8 inline-flex rounded-[12px] bg-lider-yellow px-5 py-3 text-sm font-semibold text-lider-graphite"
        >
          Спробувати ще раз
        </button>
      </section>
    </main>
  );
}
