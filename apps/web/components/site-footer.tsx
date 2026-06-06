import { siteBrand, socialLinks, type Locale } from "@lider/shared";
import { SocialIconRow } from "./social-icon";

const footerCopy: Record<Locale, { desc: string; privacy: string; terms: string; rights: string; follow: string }> = {
  uk: {
    desc: "Курси водіння, практика з інструктором і підготовка до іспиту.",
    privacy: "Конфіденційність",
    terms: "Умови",
    rights: "Всі права захищено.",
    follow: "Ми в соцмережах"
  },
  ru: {
    desc: "Курсы вождения, практика с инструктором и подготовка к экзамену.",
    privacy: "Конфиденциальность",
    terms: "Условия",
    rights: "Все права защищены.",
    follow: "Мы в соцсетях"
  },
  en: {
    desc: "Driving courses, practice with an instructor and exam preparation.",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved.",
    follow: "Find us online"
  }
};

function withLocale(href: string, locale: Locale) {
  return href.startsWith("/") ? `${href}?lang=${locale}` : href;
}

export function SiteFooter({ activeLocale }: { activeLocale: Locale }) {
  const copy = footerCopy[activeLocale] ?? footerCopy.uk;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 text-white" style={{ background: "#004d40" }}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xl font-black">{siteBrand.name}</p>
            <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-white/55">{copy.desc}</p>
            <nav aria-label={activeLocale === "en" ? "Legal" : "Правова інформація"} className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              <a href={withLocale("/privacy", activeLocale)} className="text-xs font-semibold text-white/45 transition hover:text-white">
                {copy.privacy}
              </a>
              <a href={withLocale("/terms", activeLocale)} className="text-xs font-semibold text-white/45 transition hover:text-white">
                {copy.terms}
              </a>
              <a href={`mailto:${siteBrand.email}`} className="text-xs font-semibold text-white/45 transition hover:text-white">
                {siteBrand.email}
              </a>
            </nav>
          </div>
          <div className="sm:text-right">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-white/40">{copy.follow}</p>
            <SocialIconRow links={socialLinks} className="sm:justify-end" />
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-3 sm:px-6">
        <p className="mx-auto max-w-7xl text-center text-xs font-semibold text-white/30">
          © {year} {siteBrand.name}. {copy.rights}
        </p>
      </div>
    </footer>
  );
}
