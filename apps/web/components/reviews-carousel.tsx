"use client";

import { graduateReviews } from "@lider/shared";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useState } from "react";

export function ReviewsCarousel() {
  const [index, setIndex] = useState(0);
  const review = graduateReviews[index];

  function shift(step: number) {
    setIndex((current) => (current + step + graduateReviews.length) % graduateReviews.length);
  }

  return (
    <section className="rounded-[28px] border border-lider-line bg-lider-background p-4 sm:p-6 lg:p-8" id="reviews">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lider-red">Відгуки</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-lider-graphite md:text-5xl">
            Учні довіряють не обіцянкам, а спокійному процесу
          </h2>
          <p className="mt-5 text-lg leading-8 text-lider-muted">
            Короткі відгуки допомагають швидко зрозуміти, як проходить навчання: графік, інструктор, документи,
            практика і підготовка до іспиту.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => shift(-1)}
              aria-label="Попередній відгук"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-lider-line bg-white text-lider-red transition hover:border-lider-red"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => shift(1)}
              aria-label="Наступний відгук"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-lider-line bg-white text-lider-red transition hover:border-lider-red"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-lider-line bg-white p-5 shadow-soft md:p-8">
          <AnimatePresence mode="wait">
            <motion.article
              key={review.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-lider-red text-xl font-black text-white">
                    {review.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-lider-graphite">{review.name}</h3>
                    <p className="mt-1 text-sm font-medium text-lider-muted">
                      {review.city} · {review.source}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 text-lider-red">
                  {Array.from({ length: review.rating }).map((_, itemIndex) => (
                    <Star key={itemIndex} size={18} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="mt-8 text-xl leading-9 text-lider-graphite">“{review.text}”</p>
              <div className="mt-8 flex gap-2">
                {graduateReviews.map((item, itemIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(itemIndex)}
                    aria-label={`Відкрити відгук ${itemIndex + 1}`}
                    className={`h-2.5 rounded-full transition ${
                      index === itemIndex ? "w-10 bg-lider-red" : "w-2.5 bg-lider-line"
                    }`}
                  />
                ))}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
