export const locales = ["uk", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uk";

export const dictionaries = {
  uk: {
    common: {
      brand: "Автошкола «Лідер»",
      apply: "Записатися",
      leaveRequest: "Залишити заявку",
      consultation: "Отримати консультацію",
      phone: "Телефон",
      city: "Місто",
      category: "Категорія",
      branch: "Філія",
      documents: "Документи",
      payments: "Платежі",
      practice: "Практика",
      learning: "Навчання"
    },
    web: {
      heroTitle: "Навчання водінню без хаосу в документах, графіку та оплатах",
      heroText:
        "Автошкола «Лідер» поєднує сайт, CRM, особистий кабінет, мобільний застосунок, LMS, платежі та запис на практику в одну цифрову систему."
    }
  },
  ru: {
    common: {
      brand: "Автошкола «Лидер»",
      apply: "Записаться",
      leaveRequest: "Оставить заявку",
      consultation: "Получить консультацию",
      phone: "Телефон",
      city: "Город",
      category: "Категория",
      branch: "Филиал",
      documents: "Документы",
      payments: "Платежи",
      practice: "Практика",
      learning: "Обучение"
    },
    web: {
      heroTitle: "Обучение вождению без хаоса в документах, графике и оплатах",
      heroText:
        "Автошкола «Лидер» объединяет сайт, CRM, личный кабинет, мобильное приложение, LMS, платежи и запись на практику в одну цифровую систему."
    }
  },
  en: {
    common: {
      brand: "Leader Driving School",
      apply: "Apply",
      leaveRequest: "Send request",
      consultation: "Get consultation",
      phone: "Phone",
      city: "City",
      category: "Category",
      branch: "Branch",
      documents: "Documents",
      payments: "Payments",
      practice: "Practice",
      learning: "Learning"
    },
    web: {
      heroTitle: "Driving education without chaos in documents, schedule and payments",
      heroText:
        "Leader Driving School connects the website, CRM, student account, mobile app, LMS, payments and practice booking into one digital system."
    }
  }
} as const;

export function getDictionary(locale: string = defaultLocale) {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale];
  }

  return dictionaries[defaultLocale];
}
