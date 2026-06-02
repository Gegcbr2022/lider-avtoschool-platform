import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

export const designTokens = {
  colors: {
    green900: "#084737",
    green800: "#0b5c4a",
    green700: "#14733d",
    yellow: "#ffd600",
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
        "inline-flex items-center justify-center rounded-[16px] px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0b5c4a] focus:ring-offset-2",
        variant === "primary" && "bg-[#0b5c4a] text-white hover:bg-[#084737]",
        variant === "secondary" && "bg-[#1a1a1a] text-white hover:bg-[#2a2a2a]",
        variant === "ghost" && "bg-transparent text-[#0b5c4a] hover:bg-[#e6f4ef]",
        className
      )}
      {...props}
    />
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card rounded-[22px] border border-[#e5e5e5] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#666666]">{label}</p>
      <strong className="metric-value mt-2 block text-2xl font-semibold text-[#171b1a]">{value}</strong>
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
        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[#0b5c4a]">{eyebrow}</p>
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
        tone === "neutral" && "bg-[#f1f4f3] text-[#315d50]",
        tone === "success" && "bg-[#e6f4ef] text-[#0b5c4a]",
        tone === "warning" && "bg-[#f4f4f4] text-[#1a1a1a]"
      )}
    >
      {children}
    </span>
  );
}
