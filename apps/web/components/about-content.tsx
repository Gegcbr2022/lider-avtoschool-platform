import type { Locale } from "@lider/shared";
import { ArrowRight, CheckCircle2, MapPin, Trophy } from "lucide-react";
import Image from "next/image";

const AUTODROME_MAP = "https://goo.gl/maps/3UiN9nWWimAviDpH7";
// Properly formatted address with commas so Google Maps finds the exact location.
// The old URL had no commas and no "вул." abbreviation, which caused a generic city view.
const AUTODROME_EMBED = `https://www.google.com/maps?q=${encodeURIComponent("м. Слов'янськ, вул. Торгова, 46А, Україна")}&output=embed&hl=uk&z=17`;

const championThumbs = [
  "/about/instructor-8.jpg",
  "/about/instructor-6.jpg",
  "/about/instructor-7.jpg",
  "/about/instructor-4.jpg"
];
const autodromeThumbs = [
  "/about/autodrome-6.jpg",
  "/about/autodrome-5.jpg",
  "/about/autodrome-1.jpg",
  "/about/autodrome-3.jpg"
];
const lifePhotos = Array.from({ length: 11 }, (_, i) => `/about/life-${i + 1}.jpg`);
const kramatorskThumbs = [
  "/about/kramatorsk-3.jpg",
  "/about/kramatorsk-2.jpg",
  "/about/kramatorsk-1.jpg",
  "/about/kramatorsk-4.jpg",
  "/about/kramatorsk-5.jpg"
];

export function AboutContent({ locale }: { locale: Locale }) {
  const tk = (uk: string, ru: string, en: string) => (locale === "en" ? en : locale === "ru" ? ru : uk);

  const stats = [
    { value: "10+", label: tk("років досвіду", "лет опыта", "years of experience") },
    { value: "15 000+", label: tk("випускників з правами", "выпускников с правами", "licensed graduates") },
    { value: "5", label: tk("активних філій", "активных филиалов", "active branches") },
    { value: "A–CE", label: tk("категорії прав", "категории прав", "licence categories") }
  ];

  const values = [
    tk("Найнижчі ціни — якісне навчання без переплат 💰", "Самые низкие цены — качественное обучение без переплат 💰", "The best prices — quality training without overpaying 💰"),
    tk("Досвідчені інструктори, закохані у свою справу 👍", "Опытные инструкторы, влюблённые в своё дело 👍", "Experienced instructors who love what they do 👍"),
    tk("Гнучкий графік і онлайн-теорія, що економить час 📅", "Гибкий график и онлайн-теория, экономящая время 📅", "Flexible schedule and online theory that saves time 📅"),
    tk("Готуємо не просто водіїв, а впевнених колег на дорозі 🚘", "Готовим не просто водителей, а уверенных коллег на дороге 🚘", "We train confident colleagues on the road, not just drivers 🚘"),
    tk("Ми по-справжньому любимо своїх учнів 😊", "Мы по-настоящему любим своих учеников 😊", "We genuinely love our students 😊"),
    tk("Підтримка на кожному кроці — від заявки до прав 🤝", "Поддержка на каждом шаге — от заявки до прав 🤝", "Support at every step — from request to licence 🤝")
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="motion-section premium-surface px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
              {tk("Автошкола «Лідер»", "Автошкола «Лидер»", "Leader Driving School")}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-lider-graphite md:text-6xl">
              {tk("Найкраща автошкола України", "Лучшая автошкола Украины", "Ukraine's finest driving school")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-lider-muted">
              {tk(
                "Ми команда професіоналів, яка вже понад 10 років вчить людей і дарує їм свободу пересування. За цей час понад 15 000 учнів отримали права — і ми щиро пишаємось кожним із них. Будемо щасливі, якщо саме Ви долучитесь до нашої команди!",
                "Мы команда профессионалов, которая уже более 10 лет учит людей и дарит им свободу передвижения. За это время более 15 000 учеников получили права — и мы искренне гордимся каждым из них. Будем счастливы, если именно Вы присоединитесь к нашей команде!",
                "We are a team of professionals who have been teaching people for over 10 years and giving them the freedom to move. In that time more than 15,000 students earned their licence — and we are proud of every one of them. We'd be happy if you joined our team too!"
              )}
            </p>
            <a
              href="#application"
              data-lead-source="about"
              className="tap-target red-cta mt-8 inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-base font-black"
            >
              {tk("Залишити заявку", "Оставить заявку", "Send a request")}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </a>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[26px] border border-white bg-lider-graphite shadow-[0_30px_90px_rgba(26,26,26,0.2)]">
              <Image
                src="/about/autodrome-2.jpg"
                alt={tk("Навчальний автодром автошколи Лідер", "Учебный автодром автошколы Лидер", "Leader driving school training ground")}
                width={956}
                height={956}
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-4 rounded-2xl bg-white px-4 py-3 shadow-soft">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-lider-muted">
                {tk("Власний автодром", "Собственный автодром", "Own training ground")}
              </p>
              <p className="text-lg font-black text-lider-graphite">{tk("м. Слов'янськ", "г. Славянск", "Sloviansk")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="motion-section bg-white px-5 py-12 lg:px-8">
        <div className="stagger mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="rounded-[22px] border border-lider-line bg-lider-background p-5 text-center">
              <p className="text-4xl font-black text-lider-red">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-lider-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <section className="motion-section bg-white px-5 pb-4 pt-2 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-tight text-lider-graphite md:text-4xl">
            {tk("Чому нас обирають", "Почему выбирают нас", "Why people choose us")}
          </h2>
          <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((val) => (
              <div key={val} className="flex gap-3 rounded-[18px] border border-lider-line bg-lider-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-lider-red" aria-hidden />
                <p className="text-sm font-semibold leading-6 text-lider-graphite">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Champion instructor ──────────────────────────────────────────── */}
      <section className="motion-section bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-lider-graphite text-white">
          <div className="grid gap-8 p-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-lider-red/20 px-3 py-1.5">
                <Trophy className="h-4 w-4 text-lider-red" aria-hidden />
                <span className="text-xs font-black uppercase tracking-[0.14em] text-lider-red">
                  {tk("Чемпіон", "Чемпион", "Champion")}
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-black md:text-4xl">
                {tk("Наш інструктор — Чемпіон!", "Наш инструктор — Чемпион!", "Our instructor is a Champion!")}
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-white/75">
                {tk(
                  "Інструктор з водіння Щукін Денис Анатолійович — багаторазовий призер та переможець автозмагань регіонального й республіканського рівнів. Досвід безаварійного водіння, накопичений роками завзятих тренувань, він передає учням найкращої автошколи України.",
                  "Инструктор по вождению Щукин Денис Анатольевич — многократный призёр и победитель автосоревнований регионального и республиканского уровней. Опыт безаварийного вождения, накопленный годами упорных тренировок, он передаёт ученикам лучшей автошколы Украины.",
                  "Driving instructor Denys Shchukin is a multiple prize-winner and champion of regional and national driving competitions. The accident-free driving experience he has built through years of dedicated training is passed on to students of Ukraine's finest driving school."
                )}
              </p>
              <a
                href="#application"
                data-lead-source="about"
                className="tap-target red-cta mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black"
              >
                {tk("Записатись до Чемпіона", "Записаться к Чемпиону", "Train with the Champion")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div>
              <div className="overflow-hidden rounded-[22px] border border-white/10">
                <Image
                  src="/about/instructor-1.jpg"
                  alt={tk("Нагороди автошколи Лідер", "Награды автошколы Лидер", "Leader driving school awards")}
                  width={1280}
                  height={860}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="aspect-[3/2] w-full object-cover"
                />
              </div>
              <div className="stagger mt-3 grid grid-cols-4 gap-3">
                {championThumbs.map((src) => (
                  <div key={src} className="overflow-hidden rounded-[14px] border border-white/10">
                    <Image
                      src={src}
                      alt={tk("Автозмагання інструктора", "Автосоревнования инструктора", "Instructor at competitions")}
                      width={300}
                      height={300}
                      sizes="22vw"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Autodrome ────────────────────────────────────────────────────── */}
      <section className="motion-section bg-lider-background px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
                {tk("Автодром", "Автодром", "Training ground")}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-lider-graphite md:text-4xl">
                {tk("Найкращий автодром для ідеального навчання", "Лучший автодром для идеального обучения", "The best ground for perfect training")}
              </h2>
              <p className="mt-4 flex items-center gap-2 text-base font-semibold text-lider-muted">
                <MapPin className="h-5 w-5 shrink-0 text-lider-red" aria-hidden />
                {tk("м. Слов'янськ, вул. Торгова, 46А", "г. Славянск, ул. Торговая, 46А", "Sloviansk, Torhova St, 46A")}
              </p>
              <a
                href={AUTODROME_MAP}
                target="_blank"
                rel="noreferrer"
                className="tap-target mt-5 inline-flex items-center gap-2 rounded-2xl border border-lider-line bg-white px-5 py-3 text-sm font-black text-lider-graphite transition hover:border-lider-red hover:text-lider-red"
              >
                <MapPin className="h-4 w-4" aria-hidden />
                {tk("Відкрити на карті", "Открыть на карте", "Open in maps")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <div className="stagger mt-6 grid grid-cols-4 gap-3">
                {autodromeThumbs.map((src) => (
                  <div key={src} className="overflow-hidden rounded-[14px] border border-lider-line bg-white">
                    <Image
                      src={src}
                      alt={tk("Автодром автошколи Лідер", "Автодром автошколы Лидер", "Driving school training ground")}
                      width={300}
                      height={300}
                      sizes="22vw"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-lider-line shadow-soft">
              <iframe
                title={tk("Карта автодрому", "Карта автодрома", "Training ground map")}
                src={AUTODROME_EMBED}
                className="h-[300px] w-full border-0 lg:h-[360px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Daily life ───────────────────────────────────────────────────── */}
      <section className="motion-section bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-black tracking-tight text-lider-graphite md:text-4xl">
            {tk("Будні нашої автошколи :)", "Будни нашей автошколы :)", "Everyday life at our school :)")}
          </h2>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-lider-muted">
            {tk(
              "Живі моменти з занять, практики та подій — справжні люди й справжні емоції.",
              "Живые моменты с занятий, практики и событий — настоящие люди и настоящие эмоции.",
              "Real moments from lessons, practice and events — real people and real emotions."
            )}
          </p>
          <div className="stagger mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lifePhotos.map((src) => (
              <div key={src} className="overflow-hidden rounded-[16px] border border-lider-line bg-lider-background">
                <Image
                  src={src}
                  alt={tk("Будні автошколи Лідер", "Будни автошколы Лидер", "Daily life at the school")}
                  width={300}
                  height={400}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Kramatorsk branch ────────────────────────────────────────────── */}
      <section className="motion-section bg-lider-background px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lider-red">
                {tk("Філіал", "Филиал", "Branch")}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-lider-graphite md:text-4xl">
                {tk("Філіал автошколи «Лідер» у Краматорську", "Филиал автошколы «Лидер» в Краматорске", "Leader branch in Kramatorsk")}
              </h2>
              <p className="mt-4 text-base font-semibold leading-7 text-lider-muted">
                {tk(
                  "Запрошуємо на навчання у нашому Краматорському філіалі — той самий підхід, ті самі стандарти й тепле ставлення до кожного учня. Зручне розташування, сучасні класи та досвідчені інструктори.",
                  "Приглашаем на обучение в нашем Краматорском филиале — тот же подход, те же стандарты и тёплое отношение к каждому ученику. Удобное расположение, современные классы и опытные инструкторы.",
                  "Welcome to our Kramatorsk branch — the same approach, the same standards and warm care for every student. Convenient location, modern classrooms and experienced instructors."
                )}
              </p>
              <a
                href="#application"
                data-lead-source="branch_card"
                data-lead-city="Краматорськ"
                data-lead-branch-id="kramatorsk"
                data-lead-branch="Краматорськ"
                className="tap-target red-cta mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black"
              >
                {tk("Записатися у Краматорську", "Записаться в Краматорске", "Apply in Kramatorsk")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
            <div>
              <div className="overflow-hidden rounded-[22px] border border-lider-line shadow-soft">
                <Image
                  src="/about/kramatorsk-6.jpg"
                  alt={tk("Філіал у Краматорську", "Филиал в Краматорске", "Kramatorsk branch")}
                  width={384}
                  height={384}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
              <div className="stagger mt-3 grid grid-cols-5 gap-2">
                {kramatorskThumbs.map((src) => (
                  <div key={src} className="overflow-hidden rounded-[12px] border border-lider-line bg-white">
                    <Image
                      src={src}
                      alt={tk("Краматорський філіал автошколи", "Краматорский филиал автошколы", "Kramatorsk branch")}
                      width={200}
                      height={200}
                      sizes="18vw"
                      className="aspect-square w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
