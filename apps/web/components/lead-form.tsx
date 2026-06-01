"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { branches, leadFormSchema, services } from "@lider/shared";
import { Button } from "@lider/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type LeadFormValues = z.infer<typeof leadFormSchema>;

export function LeadForm() {
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
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    reset({ category: "B", branchId: "kyiv", name: "", phone: "", city: "", message: "" });
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-[22px] bg-white p-5 shadow-soft">
      <div>
        <label className="text-sm font-semibold text-lider-graphite" htmlFor="name">
          Ім'я
        </label>
        <input
          id="name"
          className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
          placeholder="Марія"
          {...register("name")}
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor="phone">
            Телефон
          </label>
          <input
            id="phone"
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
            placeholder="050 000 00 00"
            {...register("phone")}
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor="city">
            Місто
          </label>
          <input
            id="city"
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
            placeholder="Київ"
            {...register("city")}
          />
          {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city.message}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor="category">
            Категорія
          </label>
          <select
            id="category"
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
            {...register("category")}
          >
            {services.map((service) => (
              <option key={service.id} value={service.category}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-lider-graphite" htmlFor="branchId">
            Філія
          </label>
          <select
            id="branchId"
            className="mt-2 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
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
        <label className="text-sm font-semibold text-lider-graphite" htmlFor="message">
          Коментар
        </label>
        <textarea
          id="message"
          className="mt-2 min-h-24 w-full rounded-[12px] border border-lider-line px-4 py-3 text-sm outline-none focus:border-lider-green"
          placeholder="Зручний час для дзвінка"
          {...register("message")}
        />
      </div>
      <Button type="submit" disabled={status === "saving"} className="w-full">
        {status === "saving" ? "Відправляємо..." : "Отримати консультацію"}
      </Button>
      {status === "saved" ? (
        <p className="text-sm font-medium text-[#14733d]">Заявку прийнято. Менеджер зв'яжеться з вами.</p>
      ) : null}
      {status === "error" ? <p className="text-sm font-medium text-red-600">Не вдалося відправити заявку.</p> : null}
    </form>
  );
}
