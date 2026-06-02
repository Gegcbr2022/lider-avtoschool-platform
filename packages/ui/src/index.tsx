import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

export const designTokens = {
  colors: {
    green900: "#b80000",
    green800: "#ff1e1e",
    green700: "#ff4b4b",
    yellow: "#ff1e1e",
    graphite: "#1a1a1a",
    muted: "#666666",
    line: "#e5e5e5",
    background: "#f4f4f4",
    white: "#ffffff"
  },
  radius: {
    sm: "8px",
    md: "14px",
    lg: "22px"
  }
} as const;

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[16px] px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#ff1e1e] focus:ring-offset-2",
        variant === "primary" && "bg-[#ff1e1e] text-white hover:bg-[#d81414]",
        variant === "secondary" && "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]",
        variant === "ghost" && "bg-transparent text-[#ff1e1e] hover:bg-[#fff1f1]",
        className
      )}
      {...props}
    />
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#666666]">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold text-[#171b1a]">{value}</strong>
      <span className="mt-1 block text-sm text-[#666666]">{detail}</span>
    </article>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#ff1e1e]">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#171b1a] md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#666666] md:text-lg">{description}</p>
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-[#fff1f1] text-[#ff1e1e]",
        tone === "success" && "bg-[#fff1f1] text-[#d81414]",
        tone === "warning" && "bg-[#f4f4f4] text-[#1a1a1a]"
      )}
    >
      {children}
    </span>
  );
}
