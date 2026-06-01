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
    "Сучасна автошкола з онлайн-заявкою, особистим кабінетом, записом на практику, LMS, платежами та підтримкою менеджера.",
  openGraph: {
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Курси категорій A, A1, B, C, CE у Києві, Слов'янську, Краматорську та Дніпрі.",
    url: config.siteUrl,
    siteName: siteBrand.name,
    locale: "uk_UA",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteBrand.name} | Навчання водінню`,
    description: "Онлайн-заявка, практика, LMS, документи та платежі в одному кабінеті."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
