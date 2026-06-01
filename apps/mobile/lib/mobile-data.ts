import { branches, samplePayments, sampleProgress, sampleSlots, services } from "@lider/shared";

export const student = {
  name: "Марія Коваль",
  initials: "МК",
  category: "B",
  manager: "Олена",
  phone: "050 321 44 80"
} as const;

export const courseProgress = sampleProgress;

export const upcomingSlot = {
  ...sampleSlots[0],
  branch: branches.find((branch) => branch.id === sampleSlots[0].branchId)
};

export const mobileServices = services;

export const payments = samplePayments;

export const documents = [
  {
    id: "passport",
    title: "Паспорт",
    status: "Перевірено",
    detail: "Файл завантажено 30.05"
  },
  {
    id: "tax-id",
    title: "ІПН",
    status: "Очікує перевірку",
    detail: "Менеджер отримає сповіщення"
  },
  {
    id: "medical",
    title: "Медична довідка",
    status: "Потрібно додати",
    detail: "PDF або фото до 10 МБ"
  }
] as const;

export const notifications = [
  "Практичне заняття завтра о 17:00",
  "Нове домашнє завдання з теми перехрестя",
  "Оплата зарахована через LiqPay"
] as const;

export const testCategories = [
  "Знаки",
  "Розмітка",
  "Перехрестя",
  "Пріоритет",
  "Зупинка",
  "Стоянка",
  "Безпека",
  "Швидкість",
  "Обгін"
] as const;
