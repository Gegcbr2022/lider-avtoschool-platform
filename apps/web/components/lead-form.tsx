"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { branches, defaultLocale, leadFormSchema, type Locale } from "@lider/shared";
import { Button, cn } from "@lider/ui";
import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { trackEvent } from "../lib/analytics";

type LeadFormValues = z.infer<typeof leadFormSchema>;
type LeadFormProps = {
  variant?: "page" | "popup";
  className?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  analyticsSource?: string;
  locale?: Locale;
  onSuccess?: () => void;
};

const categoryOptions: LeadFormValues["category"][] = ["A", "A1", "B", "C", "CE"];
const requestTypes: Array<{ value: LeadFormValues["requestType"]; label: string }> = [
  { value: "application", label: "Залишити заявку" },
  { value: "callback", label: "Замовити зворотний дзвінок" },
  { value: "consultation", label: "Отримати консультацію" },
  { value: "documents", label: "Подати документи онлайн" },
  { value: "category-picker", label: "Обрати категорію" }
];
const contactMethods: Array<{ value: LeadFormValues["contactMethod"]; label: string }> = [
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Зворотний дзвінок" },
  { value: "email", label: "Email" },
  { value: "any", label: "Як зручно менеджеру" }
];

const formCopy: Record<
  Locale,
  {
    requestType: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    category: string;
    branch: string;
    contactMethod: string;
    documents: string;
    documentsHint: string;
    chooseFiles: string;
    comment: string;
    consent: string;
    namePlaceholder: string;
    cityPlaceholder: string;
    messagePlaceholder: string;
    saving: string;
    saved: string;
    error: string;
    errors: {
      name: string;
      phone: string;
      email: string;
      city: string;
      consent: string;
    };
  }
> = {
  uk: {
    requestType: "Що потрібно зробити?",
    name: "Ім'я",
    phone: "Телефон",
    email: "Email",
    city: "Місто",
    category: "Категорія",
    branch: "Філія",
    contactMethod: "Зручний спосіб зв'язку",
    documents: "Подати документи онлайн",
    documentsHint: "Можна прикріпити фото паспорта/ID, коду, довідки або написати, що підготуєте їх у Telegram.",
    chooseFiles: "Обрати файли",
    comment: "Коментар",
    consent: "Погоджуюсь на обробку контактних даних і зв'язок щодо навчання.",
    namePlaceholder: "Марія",
    cityPlaceholder: "Київ",
    messagePlaceholder: "Наприклад: хочу записатися через Telegram, уточнити ціну або подати документи",
    saving: "Відправляємо...",
    saved: "Заявку прийнято. Менеджер зв'яжеться з вами.",
    error: "Не вдалося відправити заявку.",
    errors: {
      name: "Вкажіть ім'я мінімум з 2 символів.",
      phone: "Вкажіть коректний номер телефону.",
      email: "Вкажіть коректний email або залиште поле порожнім.",
      city: "Вкажіть місто або населений пункт.",
      consent: "Потрібна згода на обробку контактних даних."
    }
  },
  ru: {
    requestType: "Что нужно сделать?",
    name: "Имя",
    phone: "Телефон",
    email: "Email",
    city: "Город",
    category: "Категория",
    branch: "Филиал",
    contactMethod: "Удобный способ связи",
    documents: "Подать документы онлайн",
    documentsHint: "Можно прикрепить фото паспорта/ID, кода, справки или написать, что подготовите их в Telegram.",
    chooseFiles: "Выбрать файлы",
    comment: "Комментарий",
    consent: "Согласен на обработку контактных данных и связь по поводу обучения.",
    namePlaceholder: "Мария",
    cityPlaceholder: "Киев",
    messagePlaceholder: "Например: хочу записаться через Telegram, уточнить цену или подать документы",
    saving: "Отправляем...",
    saved: "Заявка принята. Менеджер свяжется с вами.",
    error: "Не удалось отправить заявку.",
    errors: {
      name: "Укажите имя минимум из 2 символов.",
      phone: "Укажите корректный номер телефона.",
      email: "Укажите корректный email или оставьте поле пустым.",
      city: "Укажите город или населенный пункт.",
      consent: "Нужно согласие на обработку контактных данных."
    }
  },
  en: {
    requestType: "What do you need?",
    name: "Name",
    phone: "Phone",
    email: "Email",
    city: "City",
    category: "Category",
    branch: "Branch",
    contactMethod: "Preferred contact method",
    documents: "Send documents online",
    documentsHint: "You can attach photos of ID, tax code, medical certificate or note that you will send them in Telegram.",
    chooseFiles: "Choose files",
    comment: "Comment",
    consent: "I agree to contact data processing and communication about training.",
    namePlaceholder: "Maria",
    cityPlaceholder: "Kyiv",
    messagePlaceholder: "For example: I want to apply via Telegram, check the price or send documents",
    saving: "Sending...",
    saved: "Request received. A manager will contact you.",
    error: "Could not send the request.",
    errors: {
      name: "Enter a name with at least 2 characters.",
      phone: "Enter a valid phone number.",
      email: "Enter a valid email or leave the field empty.",
      city: "Enter a city or town.",
      consent: "Consent to contact data processing is required."
    }
  }
};

export function LeadForm({
  variant = "page",
  className,
  title,
  description,
  submitLabel = "Отримати консультацію",
  analyticsSource = "lead-form",
  locale = defaultLocale,
  onSuccess
}: LeadFormProps) {
  const copy = formCopy[locale];
  const formId = useId();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [documentFiles, setDocumentFiles] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      category: "B",
      branchId: "kyiv",
      requestType: "application",
      contactMethod: "telegram",
      preferredContactMethod: "telegram",
      documentFiles: [],
      documents: [],
      language: locale,
      source: analyticsSource === "popup" ? "popup" : "website",
      consentAccepted: false
    }
  });

  async function onSubmit(values: LeadFormValues) {
    setStatus("saving");
    const leadContext = getLeadContext(locale, analyticsSource);
    const payload = {
      ...values,
      ...leadContext,
      preferredContactMethod: values.contactMethod,
      documentFiles,
      documents: documentFiles.map((name) => ({ name, status: "pending_upload" as const })),
      message: [values.message, documentFiles.length ? `Фото документів: ${documentFiles.join(", ")}` : ""]
        .filter(Boolean)
        .join("\n")
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }
    } catch {
      setStatus("error");
      return;
    }

    reset({
      category: "B",
      branchId: "kyiv",
      requestType: "application",
      contactMethod: "telegram",
      preferredContactMethod: "telegram",
      documentFiles: [],
      documents: [],
      name: "",
      phone: "",
      email: "",
      city: "",
      message: "",
      consentAccepted: false
    });
    setDocumentFiles([]);
    window.localStorage.setItem("lider-lead-submitted", "true");
    window.dispatchEvent(new CustomEvent("lider-lead-created"));
    trackEvent(analyticsSource === "popup" ? "popup_lead_created" : "lead_created", {
      source: analyticsSource,
      city: values.city,
      category: values.category
    });
    setStatus("saved");
    onSuccess?.();
  }

  const isPopup = variant === "popup";

  function onDocumentFilesChange(files: FileList | null) {
    const names = Array.from(files ?? [])
      .slice(0, 8)
      .map((file) => file.name);

    setDocumentFiles(names);
    setValue("documentFiles", names, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn(
        "grid gap-4 rounded-[22px] bg-white p-5 shadow-soft",
        isPopup && "rounded-[18px] border border-lider-line p-4 shadow-none sm:p-5",
        className
      )}
    >
      {title || description ? (
        <div>
          {title ? <h3 className="text-xl font-semibold tracking-[-0.01em] text-lider-graphite">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-lider-muted">{description}</p> : null}
        </div>
      ) : null}
      <div>
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-requestType`}>
          {copy.requestType}
        </label>
        <select
          id={`${formId}-requestType`}
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
          {...register("requestType")}
        >
          {requestTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-name`}>
          {copy.name}
        </label>
        <input
          id={`${formId}-name`}
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
          placeholder={copy.namePlaceholder}
          {...register("name")}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{copy.errors.name}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-phone`}>
            {copy.phone}
          </label>
          <input
            id={`${formId}-phone`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder="050 000 00 00"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{copy.errors.phone}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-email`}>
            {copy.email}
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{copy.errors.email}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-city`}>
            {copy.city}
          </label>
          <input
            id={`${formId}-city`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder={copy.cityPlaceholder}
            {...register("city")}
          />
          {errors.city ? <p className="mt-1 text-xs text-red-600">{copy.errors.city}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-category`}>
            {copy.category}
          </label>
          <select
            id={`${formId}-category`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            {...register("category")}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {copy.category} {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-branchId`}>
            {copy.branch}
          </label>
          <select
            id={`${formId}-branchId`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            {...register("branchId")}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.city}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-contactMethod`}>
          {copy.contactMethod}
        </label>
        <select
          id={`${formId}-contactMethod`}
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
          {...register("contactMethod")}
        >
          {contactMethods.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rounded-[16px] border border-dashed border-lider-red/35 bg-[#fff7f7] p-4">
        <label
          className="flex cursor-pointer flex-col gap-3 text-sm font-semibold text-lider-graphite sm:flex-row sm:items-center sm:justify-between"
          htmlFor={`${formId}-documents`}
        >
          <span>
            <span className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-lider-red" aria-hidden />
              {copy.documents}
            </span>
            <span className="mt-1 block text-xs font-medium leading-5 text-lider-muted">
              {copy.documentsHint}
            </span>
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-lider-red shadow-sm">
            {copy.chooseFiles}
          </span>
        </label>
        <input
          id={`${formId}-documents`}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="sr-only"
          onChange={(event) => onDocumentFilesChange(event.target.files)}
        />
        {documentFiles.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {documentFiles.map((file) => (
              <span key={file} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-lider-muted">
                {file}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div>
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-message`}>
          {copy.comment}
        </label>
        <textarea
          id={`${formId}-message`}
          className={cn(
            "mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red",
            "transition focus:ring-4 focus:ring-lider-red/10",
            isPopup ? "min-h-20" : "min-h-24"
          )}
          placeholder={copy.messagePlaceholder}
          {...register("message")}
        />
      </div>
      <label className="flex items-start gap-3 rounded-[16px] bg-lider-background p-4 text-sm font-semibold leading-6 text-lider-muted">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-lider-line text-lider-red focus:ring-lider-red"
          {...register("consentAccepted")}
        />
        <span>{copy.consent}</span>
      </label>
      {errors.consentAccepted ? <p className="-mt-3 text-xs text-red-600">{copy.errors.consent}</p> : null}
      <Button type="submit" disabled={status === "saving"} className="w-full">
        {status === "saving" ? copy.saving : submitLabel}
      </Button>
      {status === "saved" ? (
        <p className="text-sm font-medium text-[#14733d]">{copy.saved}</p>
      ) : null}
      {status === "error" ? <p className="text-sm font-medium text-red-600">{copy.error}</p> : null}
    </form>
  );
}

function getLeadContext(locale: Locale, analyticsSource: string) {
  if (typeof window === "undefined") {
    return { language: locale };
  }

  const params = new URLSearchParams(window.location.search);
  const telegramStartParam = params.get("start") ?? params.get("tg_start") ?? params.get("telegramStartParam") ?? undefined;
  const referralCode = params.get("ref") ?? params.get("referral") ?? params.get("referralCode") ?? telegramStartParam;

  return {
    language: locale,
    page: `${window.location.pathname}${window.location.search}`,
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
    source: inferLeadSource(analyticsSource, window.location.pathname, referralCode),
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    referralCode,
    telegramStartParam
  };
}

function inferLeadSource(analyticsSource: string, pathname: string, referralCode?: string): LeadFormValues["source"] {
  if (analyticsSource === "popup") {
    return "popup";
  }

  if (referralCode) {
    return "referral";
  }

  if (pathname.includes("categories")) {
    return "category-page";
  }

  if (pathname.includes("documents")) {
    return "documents-page";
  }

  if (pathname.includes("contacts")) {
    return "contacts-page";
  }

  return "website";
}
