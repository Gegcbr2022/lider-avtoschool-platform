import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM | Автошкола Лідер",
  description: "Admin CRM for leads, students, payments, bookings and learning progress."
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
