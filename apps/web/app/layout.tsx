import type { Metadata } from "next";
import "./globals.css";
import { getPublicRuntimeConfig } from "@lider/config";
import { siteBrand } from "@lider/shared";

const config = getPublicRuntimeConfig();

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${siteBrand.name} | Курси водіння та підготовка до прав`,
    template: `%s | ${siteBrand.name}`
  },
  description:
    "Автошкола «Лідер» — категорії A, A1, B, C, CE у Києві, Дніпрі, Слов'янську, Краматорську та Добропіллі. Онлайн-теорія, практика з інструктором, підготовка до ТСЦ МВС та супровід до отримання прав.",
  openGraph: {
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Категорії A, A1, B, C, CE у Києві, Дніпрі, Слов'янську, Краматорську та Добропіллі. Онлайн-теорія, практика, підготовка до ГСЦ МВС.",
    url: config.siteUrl,
    siteName: siteBrand.name,
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/images/lesson-premium.png",
        width: 1600,
        height: 1000,
        alt: "Практичне заняття автошколи Лідер"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Онлайн-заявка, практика з інструктором, документи і супровід до ТСЦ МВС. Категорії A, A1, B, C, CE у 5 містах України.",
    images: ["/images/lesson-premium.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
