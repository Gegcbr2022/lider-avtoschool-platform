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
    "Автошкола Лідер: категорії A, A1, B, C, CE, онлайн-теорія, практика з інструктором, філії, документи і супровід до іспиту.",
  openGraph: {
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Курси категорій A, A1, B, C, CE у Києві, Слов'янську, Краматорську, Дніпрі та Добропіллі.",
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
    description: "Онлайн-заявка, практика, документи, філії та підтримка менеджера від першої консультації до іспиту.",
    images: ["/images/lesson-premium.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
