"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { branches, leadFormSchema } from "@lider/shared";
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
  { value: "any", label: "Як зручно менеджеру" }
];

export function LeadForm({
  variant = "page",
  className,
  title,
  description,
  submitLabel = "Отримати консультацію",
  analyticsSource = "lead-form",
  onSuccess
}: LeadFormProps) {
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
      documentFiles: []
    }
  });

  async function onSubmit(values: LeadFormValues) {
    setStatus("saving");
    const payload = {
      ...values,
      documentFiles,
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
      documentFiles: [],
      name: "",
      phone: "",
      city: "",
      message: ""
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
          Що потрібно зробити?
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
          Ім'я
        </label>
        <input
          id={`${formId}-name`}
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
          placeholder="Марія"
          {...register("name")}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">Вкажіть ім'я мінімум з 2 символів.</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-phone`}>
            Телефон
          </label>
          <input
            id={`${formId}-phone`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder="050 000 00 00"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">Вкажіть коректний номер телефону.</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-city`}>
            Місто
          </label>
          <input
            id={`${formId}-city`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            placeholder="Київ"
            {...register("city")}
          />
          {errors.city ? <p className="mt-1 text-xs text-red-600">Вкажіть місто або населений пункт.</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-category`}>
            Категорія
          </label>
          <select
            id={`${formId}-category`}
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none transition focus:border-lider-red focus:ring-4 focus:ring-lider-red/10"
            {...register("category")}
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                Категорія {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-branchId`}>
            Філія
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
          Зручний спосіб зв'язку
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
              Подати документи онлайн
            </span>
            <span className="mt-1 block text-xs font-medium leading-5 text-lider-muted">
              Можна прикріпити фото паспорта/ID, коду, довідки або написати, що підготуєте їх у Telegram.
            </span>
          </span>
          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-lider-red shadow-sm">
            Обрати файли
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
          Коментар
        </label>
        <textarea
          id={`${formId}-message`}
          className={cn(
            "mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red",
            "transition focus:ring-4 focus:ring-lider-red/10",
            isPopup ? "min-h-20" : "min-h-24"
          )}
          placeholder="Наприклад: хочу записатися через Telegram, уточнити ціну або подати документи"
          {...register("message")}
        />
      </div>
      <Button type="submit" disabled={status === "saving"} className="w-full">
        {status === "saving" ? "Відправляємо..." : submitLabel}
      </Button>
      {status === "saved" ? (
        <p className="text-sm font-medium text-[#14733d]">Заявку прийнято. Менеджер зв'яжеться з вами.</p>
      ) : null}
      {status === "error" ? <p className="text-sm font-medium text-red-600">Не вдалося відправити заявку.</p> : null}
    </form>
  );
}
