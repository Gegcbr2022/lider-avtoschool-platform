"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { branches, leadFormSchema } from "@lider/shared";
import { Button, cn } from "@lider/ui";
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      category: "B",
      branchId: "kyiv"
    }
  });

  async function onSubmit(values: LeadFormValues) {
    setStatus("saving");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }
    } catch {
      setStatus("error");
      return;
    }

    reset({ category: "B", branchId: "kyiv", name: "", phone: "", city: "", message: "" });
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
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-name`}>
          Ім'я
        </label>
        <input
          id={`${formId}-name`}
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red"
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
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red"
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
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red"
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
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red"
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
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red"
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
        <label className="text-sm font-semibold text-lider-graphite" htmlFor={`${formId}-message`}>
          Коментар
        </label>
        <textarea
          id={`${formId}-message`}
          className={cn(
            "mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-red",
            isPopup ? "min-h-20" : "min-h-24"
          )}
          placeholder="Зручний час для дзвінка"
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
