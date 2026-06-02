import type { Metadata } from "next";
import "./globals.css";
import { getPublicRuntimeConfig } from "@lider/config";
import { siteBrand } from "@lider/shared";

const config = getPublicRuntimeConfig();

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${siteBrand.name} | Курси водіння та CRM-кабінет учня`,
    template: `%s | ${siteBrand.name}`
  },
  description:
    "Автошкола Лідер: категорії A, A1, B, C, CE, онлайн-теорія, практика з інструктором, філії, документи, кабінет учня і мобільний застосунок.",
  openGraph: {
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Курси категорій A, A1, B, C, CE у Києві, Слов'янську, Краматорську, Дніпрі та Добропіллі.",
    url: config.siteUrl,
    siteName: siteBrand.name,
    locale: "uk_UA",
    type: "website",
    images: [
      {
        url: "/images/hero-driving-school.png",
        width: 1600,
        height: 1000,
        alt: "Інструктор та студент автошколи Лідер"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Онлайн-заявка, практика, LMS, документи, філії та підтримка менеджера в одному цифровому процесі."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
