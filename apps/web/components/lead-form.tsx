"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { assessLeadRisk, branches, defaultLocale, hashLeadRiskKey, leadFormSchema, leadSources, type Locale } from "@lider/shared";
import { Button, cn } from "@lider/ui";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { trackEvent } from "../lib/analytics";
import {
  isStorageConfigured,
  uploadLeadDocuments,
  validateFiles,
  type UploadedDocument
} from "../lib/storage-upload";
import { TurnstileWidget } from "./turnstile-widget";

type LeadFormValues = z.infer<typeof leadFormSchema>;
type LeadFormInitialContext = {
  source?: string;
  city?: string;
  branchId?: string;
  branch?: string;
  category?: LeadFormValues["category"];
};
type LeadFormProps = {
  variant?: "page" | "popup";
  className?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  analyticsSource?: string;
  locale?: Locale;
  initialContext?: LeadFormInitialContext;
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
  { value: "phone", label: "Зворотний дзвінок" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "any", label: "Як зручно менеджеру" }
];

const LEAD_RISK_SESSION_KEY = "lider-lead-risk";
const HAS_TURNSTILE_SITE_KEY = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

type LeadRiskSession = {
  attempts: number;
  validationErrors: number;
  popupOpens: number;
  lastSubmitAt?: number;
  phoneHashes: Record<string, number>;
};

const formCopy: Record<
  Locale,
  {
    requestType: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    fallbackName: string;
    category: string;
    branch: string;
    contactMethod: string;
    documents: string;
    documentsHint: string;
    chooseFiles: string;
    comment: string;
    consent: string;
    consentPrivacy: string;
    consentAnd: string;
    consentTerms: string;
    consentSuffix: string;
    namePlaceholder: string;
    popupNamePlaceholder: string;
    phonePlaceholder: string;
    cityPlaceholder: string;
    messagePlaceholder: string;
    captchaPrompt: string;
    captchaMissingKey: string;
    captchaFailed: string;
    captchaRetry: string;
    rateLimitError: string;
    saving: string;
    uploading: string;
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
    fallbackName: "Клієнт Лідер",
    category: "Категорія",
    branch: "Філія",
    contactMethod: "Зручний спосіб зв'язку",
    documents: "Подати документи онлайн",
    documentsHint: "Можна прикріпити фото паспорта/ID, коду, довідки або написати, що підготуєте їх у Telegram.",
    chooseFiles: "Обрати файли",
    comment: "Коментар",
    consent: "Погоджуюсь з обробкою контактних даних відповідно до",
    consentPrivacy: "Політики конфіденційності",
    consentAnd: "та",
    consentTerms: "Умов використання",
    consentSuffix: "і даю згоду на зв'язок щодо навчання.",
    namePlaceholder: "Марія",
    popupNamePlaceholder: "Ваше ім’я",
    phonePlaceholder: "Номер телефону",
    cityPlaceholder: "Київ",
    messagePlaceholder: "Наприклад: хочу записатися через Telegram, уточнити ціну або подати документи",
    captchaPrompt: "Підтвердьте, що ви не робот",
    captchaMissingKey: "Перевірка тимчасово недоступна. Спробуйте ще раз або напишіть у Telegram.",
    captchaFailed: "Не вдалося підтвердити перевірку. Оновіть CAPTCHA і спробуйте ще раз.",
    captchaRetry: "Після підтвердження натисніть кнопку ще раз.",
    rateLimitError: "Забагато спроб. Зачекайте хвилину і спробуйте ще раз.",
    saving: "Відправляємо...",
    uploading: "Завантажуємо файли",
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
    fallbackName: "Клиент Лидер",
    category: "Категория",
    branch: "Филиал",
    contactMethod: "Удобный способ связи",
    documents: "Подать документы онлайн",
    documentsHint: "Можно прикрепить фото паспорта/ID, кода, справки или написать, что подготовите их в Telegram.",
    chooseFiles: "Выбрать файлы",
    comment: "Комментарий",
    consent: "Согласен на обработку контактных данных в соответствии с",
    consentPrivacy: "Политикой конфиденциальности",
    consentAnd: "и",
    consentTerms: "Условиями использования",
    consentSuffix: "и даю согласие на связь по поводу обучения.",
    namePlaceholder: "Мария",
    popupNamePlaceholder: "Ваше имя",
    phonePlaceholder: "Номер телефона",
    cityPlaceholder: "Киев",
    messagePlaceholder: "Например: хочу записаться через Telegram, уточнить цену или подать документы",
    captchaPrompt: "Подтвердите, что вы не робот",
    captchaMissingKey: "Проверка временно недоступна. Попробуйте ещё раз или напишите в Telegram.",
    captchaFailed: "Не удалось подтвердить проверку. Обновите CAPTCHA и попробуйте ещё раз.",
    captchaRetry: "После подтверждения нажмите кнопку ещё раз.",
    rateLimitError: "Слишком много попыток. Подождите минуту и попробуйте ещё раз.",
    saving: "Отправляем...",
    uploading: "Загружаем файлы",
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
    fallbackName: "Leader client",
    category: "Category",
    branch: "Branch",
    contactMethod: "Preferred contact method",
    documents: "Send documents online",
    documentsHint: "You can attach photos of ID, tax code, medical certificate or note that you will send them in Telegram.",
    chooseFiles: "Choose files",
    comment: "Comment",
    consent: "I agree to contact data processing in accordance with the",
    consentPrivacy: "Privacy Policy",
    consentAnd: "and",
    consentTerms: "Terms of Use",
    consentSuffix: "and consent to being contacted about training.",
    namePlaceholder: "Maria",
    popupNamePlaceholder: "Your name",
    phonePlaceholder: "Phone number",
    cityPlaceholder: "Kyiv",
    messagePlaceholder: "For example: I want to apply via Telegram, check the price or send documents",
    captchaPrompt: "Please confirm you are not a robot",
    captchaMissingKey: "Verification is temporarily unavailable. Try again or message us in Telegram.",
    captchaFailed: "Verification failed. Refresh CAPTCHA and try again.",
    captchaRetry: "After confirming, submit the form again.",
    rateLimitError: "Too many attempts. Please wait a minute and try again.",
    saving: "Sending...",
    uploading: "Uploading files",
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
  initialContext,
  onSuccess
}: LeadFormProps) {
  const copy = formCopy[locale];
  const formId = useId();
  const isPopup = variant === "popup";
  const contextKey = [
    initialContext?.source ?? "",
    initialContext?.city ?? "",
    initialContext?.branchId ?? "",
    initialContext?.branch ?? "",
    initialContext?.category ?? ""
  ].join("|");
  const contextHint = getPopupContextHint(locale, initialContext);
  const [status, setStatus] = useState<"idle" | "saving" | "uploading" | "saved" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [documentFiles, setDocumentFiles] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const rawFilesRef = useRef<File[]>([]);
  const formStartedAtRef = useRef(Date.now());
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: buildLeadFormDefaults({ analyticsSource, copy, initialContext, isPopup, locale })
  });

  useEffect(() => {
    if (!isPopup) {
      return;
    }

    reset(buildLeadFormDefaults({ analyticsSource, copy, initialContext, isPopup, locale }));
    rawFilesRef.current = [];
    setDocumentFiles([]);
    setStatus("idle");
    setUploadProgress(null);
    setTurnstileToken(null);
    setCaptchaVisible(false);
    setServerError(null);
    formStartedAtRef.current = Date.now();
  }, [analyticsSource, contextKey, copy, initialContext, isPopup, locale, reset]);

  useEffect(() => {
    formStartedAtRef.current = Date.now();

    if (isPopup) {
      recordLeadPopupOpen();
    }
  }, [contextKey, isPopup]);

  async function onSubmit(values: LeadFormValues) {
    setServerError(null);
    const leadContext = getLeadContext(locale, analyticsSource, initialContext);
    const rawFiles = rawFilesRef.current;

    if (rawFiles.length > 0) {
      const validationError = validateFiles(rawFiles);
      if (validationError) {
        setStatus("error");
        return;
      }
    }

    const formStartedAt = formStartedAtRef.current;
    const payload = {
      ...values,
      ...leadContext,
      name: values.name?.trim() || copy.fallbackName,
      preferredContactMethod: values.contactMethod,
      formStartedAt,
      documentFiles,
      documents: documentFiles.map((name) => ({ name, status: "pending_upload" as const })),
      message: [values.message, documentFiles.length ? `Фото документів: ${documentFiles.join(", ")}` : ""]
        .filter(Boolean)
        .join("\n"),
      ...(turnstileToken ? { turnstileToken } : {})
    };
    const riskSession = readLeadRiskSession();
    const phoneHash = hashLeadRiskKey(values.phone, "phone");
    const clientRisk = assessLeadRisk({
      payload,
      now: Date.now(),
      ipAttempts: riskSession.attempts,
      phoneAttempts: phoneHash ? riskSession.phoneHashes[phoneHash] ?? 0 : 0,
      lastSubmitAt: riskSession.lastSubmitAt,
      popupOpens: riskSession.popupOpens,
      validationErrors: riskSession.validationErrors,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined
    });

    if ((clientRisk.captchaRequired || captchaVisible) && !turnstileToken) {
      setCaptchaVisible(true);
      setServerError(HAS_TURNSTILE_SITE_KEY ? copy.captchaRetry : copy.captchaMissingKey);
      setStatus("idle");
      return;
    }

    recordLeadSubmissionAttempt(values.phone);
    setStatus("saving");

    let leadId: string | null = null;

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const apiError = await readLeadApiError(response);

        if (apiError === "captcha_required") {
          setCaptchaVisible(true);
          setServerError(HAS_TURNSTILE_SITE_KEY ? copy.captchaRetry : copy.captchaMissingKey);
          setStatus("idle");
          return;
        }

        if (apiError === "captcha_failed" || apiError === "captcha_unavailable") {
          setCaptchaVisible(true);
          setTurnstileToken(null);
          setCaptchaResetKey((key) => key + 1);
          setServerError(apiError === "captcha_unavailable" ? copy.captchaMissingKey : copy.captchaFailed);
          setStatus("error");
          return;
        }

        if (apiError === "too_many_requests") {
          setServerError(copy.rateLimitError);
        }

        setStatus("error");
        return;
      }

      const data: unknown = await response.json();
      if (data && typeof data === "object" && "id" in data && typeof (data as Record<string, unknown>).id === "string") {
        leadId = (data as Record<string, unknown>).id as string;
      }
    } catch {
      setStatus("error");
      return;
    }

    // Upload files to Firebase Storage if we have a leadId and files
    if (leadId && rawFiles.length > 0 && isStorageConfigured()) {
      setStatus("uploading");
      setUploadProgress({ done: 0, total: rawFiles.length });

      try {
        const uploaded: UploadedDocument[] = await uploadLeadDocuments(
          rawFiles,
          leadId,
          (done, total) => setUploadProgress({ done, total })
        );

        // Best-effort: update lead with real document metadata
        await fetch("/api/leads/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, documents: uploaded })
        }).catch(() => {
          // Non-critical: files are already in Storage, lead can be matched by path convention
        });
      } catch {
        // Upload failed but lead is already created — don't block success
        // Files can be requested via Telegram by manager
      } finally {
        setUploadProgress(null);
      }
    }

    reset(buildLeadFormDefaults({ analyticsSource, copy, initialContext, isPopup, locale }));
    rawFilesRef.current = [];
    setDocumentFiles([]);
    setTurnstileToken(null);
    setCaptchaVisible(false);
    setServerError(null);
    formStartedAtRef.current = Date.now();
    window.localStorage.setItem("lider-lead-submitted", "true");
    window.dispatchEvent(new CustomEvent("lider-lead-created"));
    trackEvent(analyticsSource === "popup" ? "popup_lead_created" : "lead_created", {
      source: payload.source,
      city: payload.city,
      branchId: payload.branchId,
      category: payload.category
    });
    setStatus("saved");
    onSuccess?.();
  }

  function onInvalidSubmit() {
    const session = recordLeadValidationError();

    if (session.validationErrors >= 2) {
      setCaptchaVisible(true);
      setServerError(HAS_TURNSTILE_SITE_KEY ? copy.captchaRetry : copy.captchaMissingKey);
    }
  }

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setServerError(null);
  }, []);

  const handleTurnstileReset = useCallback(() => {
    setTurnstileToken(null);
  }, []);

  function onDocumentFilesChange(files: FileList | null) {
    const list = Array.from(files ?? []).slice(0, 8);
    const names = list.map((file) => file.name);

    rawFilesRef.current = list;
    setDocumentFiles(names);
    setValue("documentFiles", names, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
      className={cn(
        "grid gap-4 rounded-[22px] bg-white p-5 shadow-soft",
        isPopup && "rounded-none border-0 p-0 shadow-none",
        className
      )}
    >
      {title || description ? (
        <div>
          {title ? <h3 className="text-xl font-semibold tracking-[-0.01em] text-lider-graphite">{title}</h3> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-lider-muted">{description}</p> : null}
        </div>
      ) : null}
      {isPopup && contextHint ? (
        <p className="rounded-[14px] bg-[#fff5f5] px-4 py-3 text-sm font-black text-lider-red">
          {contextHint}
        </p>
      ) : null}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${formId}-companyWebsite`}>Company website</label>
        <input
          id={`${formId}-companyWebsite`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("companyWebsite")}
        />
      </div>
      <div className={isPopup ? "hidden" : undefined}>
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
          placeholder={isPopup ? copy.popupNamePlaceholder : copy.namePlaceholder}
          {...register("name")}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{copy.errors.name}</p> : null}
      </div>
      <div className={cn("grid gap-4", isPopup ? "" : "md:grid-cols-3")}>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-phone`}>
            {copy.phone}
          </label>
          <input
            id={`${formId}-phone`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder={isPopup ? copy.phonePlaceholder : "050 000 00 00"}
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{copy.errors.phone}</p> : null}
        </div>
        <div className={isPopup ? "hidden" : undefined}>
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
        <div className={isPopup ? "hidden" : undefined}>
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
      <div className={isPopup ? "hidden" : "grid gap-4 md:grid-cols-2"}>
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
      <div className={isPopup ? "hidden" : undefined}>
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
      <div className={cn("rounded-[16px] border border-dashed border-lider-line bg-lider-background p-4", isPopup && "hidden")}>
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
      <div className={isPopup ? "hidden" : undefined}>
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
          className="mt-1 h-4 w-4 rounded border-lider-line accent-lider-red focus:ring-lider-red"
          {...register("consentAccepted")}
        />
        <span>
          {copy.consent}{" "}
          <a
            href={`/privacy?lang=${locale}`}
            target="_blank"
            rel="noreferrer"
            className="font-black text-lider-red underline decoration-lider-red/30 underline-offset-2 transition hover:decoration-lider-red"
            onClick={(e) => e.stopPropagation()}
          >
            {copy.consentPrivacy}
          </a>{" "}
          {copy.consentAnd}{" "}
          <a
            href={`/terms?lang=${locale}`}
            target="_blank"
            rel="noreferrer"
            className="font-black text-lider-red underline decoration-lider-red/30 underline-offset-2 transition hover:decoration-lider-red"
            onClick={(e) => e.stopPropagation()}
          >
            {copy.consentTerms}
          </a>
          {copy.consentSuffix ? ` ${copy.consentSuffix}` : ""}
        </span>
      </label>
      {errors.consentAccepted ? <p className="-mt-3 text-xs text-red-600">{copy.errors.consent}</p> : null}
      {captchaVisible ? (
        <div className="grid gap-2">
          <TurnstileWidget
            label={copy.captchaPrompt}
            missingLabel={copy.captchaMissingKey}
            resetKey={captchaResetKey}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileReset}
            onError={handleTurnstileReset}
          />
          {serverError && (HAS_TURNSTILE_SITE_KEY || serverError !== copy.captchaMissingKey) ? (
            <p className="text-sm font-semibold text-lider-muted">{serverError}</p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" disabled={status === "saving" || status === "uploading"} className="w-full">
        {status === "saving" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {copy.saving}
          </span>
        ) : status === "uploading" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {copy.uploading} {uploadProgress ? `${uploadProgress.done}/${uploadProgress.total}` : ""}
          </span>
        ) : submitLabel}
      </Button>
      {status === "saved" ? (
        <p className="flex items-center gap-2 text-sm font-medium text-[#14733d]">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {copy.saved}
        </p>
      ) : null}
      {status === "error" && !(captchaVisible && serverError) ? (
        <p className="text-sm font-medium text-red-600">{serverError ?? copy.error}</p>
      ) : null}
    </form>
  );
}

function getLeadContext(locale: Locale, analyticsSource: string, initialContext?: LeadFormInitialContext) {
  if (typeof window === "undefined") {
    return { language: locale };
  }

  const params = new URLSearchParams(window.location.search);
  const telegramStartParam = params.get("start") ?? params.get("tg_start") ?? params.get("telegramStartParam") ?? undefined;
  const referralCode = params.get("ref") ?? params.get("referral") ?? params.get("referralCode") ?? telegramStartParam;
  const branch = resolveContextBranch(initialContext);
  const contextCity = initialContext?.city ?? branch?.city;
  const contextBranchId = initialContext?.branchId ?? branch?.id;
  const contextBranch = initialContext?.branch ?? branch?.city;

  return {
    language: locale,
    page: `${window.location.pathname}${window.location.search}`,
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
    source: normalizeLeadSource(initialContext?.source) ?? inferLeadSource(analyticsSource, window.location.pathname, referralCode),
    ...(contextCity ? { city: contextCity } : {}),
    ...(contextBranchId ? { branchId: contextBranchId } : {}),
    ...(contextBranch ? { branch: contextBranch } : {}),
    ...(initialContext?.category ? { category: initialContext.category } : {}),
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
  const normalizedSource = normalizeLeadSource(analyticsSource);

  if (normalizedSource) {
    return normalizedSource;
  }

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

function buildLeadFormDefaults({
  analyticsSource,
  copy,
  initialContext,
  isPopup,
  locale
}: {
  analyticsSource: string;
  copy: (typeof formCopy)[Locale];
  initialContext?: LeadFormInitialContext;
  isPopup: boolean;
  locale: Locale;
}): LeadFormValues {
  const branch = resolveContextBranch(initialContext) ?? branches.find((item) => item.id === "kyiv") ?? branches[0];
  const hasBranchContext = Boolean(initialContext?.city || initialContext?.branchId);
  const city = initialContext?.city ?? (hasBranchContext ? branch?.city : undefined) ?? (isPopup ? copy.cityPlaceholder : "");

  return {
    name: "",
    phone: "",
    email: "",
    city,
    category: initialContext?.category ?? "B",
    branchId: initialContext?.branchId ?? branch?.id ?? "kyiv",
    branch: initialContext?.branch ?? branch?.city,
    requestType: "application",
    contactMethod: "phone",
    preferredContactMethod: "phone",
    documentFiles: [],
    documents: [],
    message: "",
    language: locale,
    source: normalizeLeadSource(initialContext?.source) ?? normalizeLeadSource(analyticsSource) ?? (analyticsSource === "popup" ? "popup" : "website"),
    companyWebsite: "",
    consentAccepted: false
  };
}

function resolveContextBranch(initialContext?: LeadFormInitialContext) {
  if (!initialContext) {
    return undefined;
  }

  if (initialContext.branchId) {
    return branches.find((branch) => branch.id === initialContext.branchId);
  }

  if (initialContext.city) {
    const normalizedCity = initialContext.city.trim().toLowerCase();
    return branches.find((branch) => branch.city.toLowerCase() === normalizedCity);
  }

  return undefined;
}

function getPopupContextHint(locale: Locale, initialContext?: LeadFormInitialContext) {
  if (!initialContext?.city && !initialContext?.branchId && !initialContext?.category) {
    return "";
  }

  const branch = resolveContextBranch(initialContext);
  const labels = {
    branch: locale === "en" ? "Branch" : locale === "ru" ? "Филиал" : "Філія",
    category: locale === "en" ? "Category" : locale === "ru" ? "Категория" : "Категорія"
  };
  const parts = [
    branch || initialContext.city ? `${labels.branch}: ${initialContext.city ?? branch?.city}` : null,
    initialContext.category ? `${labels.category}: ${initialContext.category}` : null
  ].filter(Boolean);

  return parts.join(" · ");
}

function normalizeLeadSource(source?: string): LeadFormValues["source"] | undefined {
  if (!source) {
    return undefined;
  }

  const trimmed = source.trim();
  const candidates = [trimmed, trimmed.replace(/-/g, "_"), trimmed.replace(/_/g, "-")];
  const normalized = candidates.find((candidate) => (leadSources as readonly string[]).includes(candidate));

  if (normalized) {
    return normalized as LeadFormValues["source"];
  }

  return undefined;
}

function readLeadRiskSession(): LeadRiskSession {
  const fallback: LeadRiskSession = {
    attempts: 0,
    validationErrors: 0,
    popupOpens: 0,
    phoneHashes: {}
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(LEAD_RISK_SESSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LeadRiskSession>) : {};

    return {
      attempts: normalizeSessionNumber(parsed.attempts),
      validationErrors: normalizeSessionNumber(parsed.validationErrors),
      popupOpens: normalizeSessionNumber(parsed.popupOpens),
      lastSubmitAt: normalizeSessionTimestamp(parsed.lastSubmitAt),
      phoneHashes: sanitizePhoneHashes(parsed.phoneHashes)
    };
  } catch {
    return fallback;
  }
}

function writeLeadRiskSession(session: LeadRiskSession) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(LEAD_RISK_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Server-side risk checks still protect the endpoint if sessionStorage is unavailable.
  }
}

function updateLeadRiskSession(updater: (session: LeadRiskSession) => LeadRiskSession) {
  const next = updater(readLeadRiskSession());
  writeLeadRiskSession(next);
  return next;
}

function recordLeadPopupOpen() {
  updateLeadRiskSession((session) => ({
    ...session,
    popupOpens: Math.min(session.popupOpens + 1, 99)
  }));
}

function recordLeadValidationError() {
  return updateLeadRiskSession((session) => ({
    ...session,
    validationErrors: Math.min(session.validationErrors + 1, 99)
  }));
}

function recordLeadSubmissionAttempt(phone: string) {
  updateLeadRiskSession((session) => {
    const phoneKey = hashLeadRiskKey(phone, "phone");
    const phoneHashes = { ...session.phoneHashes };

    if (phoneKey) {
      phoneHashes[phoneKey] = Math.min((phoneHashes[phoneKey] ?? 0) + 1, 99);
    }

    return {
      ...session,
      attempts: Math.min(session.attempts + 1, 99),
      validationErrors: 0,
      lastSubmitAt: Date.now(),
      phoneHashes
    };
  });
}

async function readLeadApiError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" ? payload.error : undefined;
  } catch {
    return undefined;
  }
}

function normalizeSessionNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 99) : 0;
}

function normalizeSessionTimestamp(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function sanitizePhoneHashes(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, count]) => key.startsWith("phone_") && typeof count === "number" && Number.isFinite(count))
      .slice(-20)
      .map(([key, count]) => [key, Math.min(Math.floor(count as number), 99)])
  );
}
