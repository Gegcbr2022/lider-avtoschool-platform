"use client";

import { graduateStories } from "@lider/shared";
import { StatusPill } from "@lider/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";

const allCity = "Усі міста";
const allCategory = "Усі категорії";
const photoGradients: Record<string, string> = {
  "graduate-maria": "linear-gradient(135deg, #e9f7ef 0%, #d7f0e3 52%, #ffd600 100%)",
  "graduate-andrii": "linear-gradient(135deg, #eaf4f1 0%, #b9d9cf 50%, #004d40 100%)",
  "graduate-oksana": "linear-gradient(135deg, #fff6bf 0%, #f9fcfa 48%, #b9d9cf 100%)",
  "graduate-serhii": "linear-gradient(135deg, #0f1714 0%, #004d40 55%, #ffd600 100%)",
  "graduate-anna": "linear-gradient(135deg, #f7fbf9 0%, #d7f0e3 55%, #ffd600 100%)",
  "graduate-volodymyr": "linear-gradient(135deg, #dbeafe 0%, #eaf4f1 45%, #004d40 100%)"
};

export function GraduateShowcase() {
  const [city, setCity] = useState(allCity);
  const [category, setCategory] = useState(allCategory);

  const cities = useMemo(() => [allCity, ...Array.from(new Set(graduateStories.map((story) => story.city)))], []);
  const categories = useMemo(
    () => [allCategory, ...Array.from(new Set(graduateStories.map((story) => story.category)))],
    []
  );
  const visibleStories = graduateStories.filter((story) => {
    const cityMatch = city === allCity || story.city === city;
    const categoryMatch = category === allCategory || story.category === category;

    return cityMatch && categoryMatch;
  });

  return (
    <div className="mt-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {cities.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCity(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                city === item
                  ? "border-lider-green bg-lider-green text-white"
                  : "border-lider-line bg-white text-lider-green hover:border-lider-green"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                category === item
                  ? "border-lider-yellow bg-lider-yellow text-lider-graphite"
                  : "border-lider-line bg-white text-lider-muted hover:border-lider-yellow"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visibleStories.map((story) => (
            <motion.article
              layout
              key={story.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="group overflow-hidden rounded-[20px] border border-lider-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
            >
              <div
                className="relative h-44"
                style={{ background: photoGradients[story.id] ?? "linear-gradient(135deg, #eaf4f1, #ffd600)" }}
              >
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/50 bg-white/88 text-xl font-black text-lider-green shadow-sm backdrop-blur">
                    {story.initials}
                  </div>
                  <div className="rounded-full bg-white/88 px-3 py-1 text-xs font-bold text-lider-green shadow-sm backdrop-blur">
                    {story.date}
                  </div>
                </div>
                <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-lider-graphite/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  <Trophy size={13} className="text-lider-yellow" />
                  Наша гордість
                </div>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-lider-graphite">{story.name}</h3>
                  <StatusPill tone="success">Категорія {story.category}</StatusPill>
                </div>
                <p className="mt-1 text-sm font-medium text-lider-muted">{story.city}</p>
                <p className="mt-4 text-sm font-semibold text-lider-green">{story.badge}</p>
                <p className="mt-3 text-sm leading-6 text-lider-muted">“{story.quote}”</p>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {!visibleStories.length ? (
        <div className="mt-8 rounded-[18px] border border-dashed border-lider-line bg-white p-8 text-center text-sm text-lider-muted">
          Для цього фільтра ще немає історій. Структура готова для підключення реальних фото і нових випускників.
        </div>
      ) : null}
    </div>
  );
}
