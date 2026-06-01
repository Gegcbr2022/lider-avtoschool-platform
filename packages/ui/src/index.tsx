import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

export const designTokens = {
  colors: {
    green900: "#00362d",
    green800: "#004d40",
    green700: "#00695c",
    yellow: "#ffd600",
    graphite: "#171b1a",
    muted: "#5f6f6a",
    line: "#dce7e3",
    background: "#f7fbf9",
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
        "inline-flex items-center justify-center rounded-[12px] px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#ffd600] focus:ring-offset-2",
        variant === "primary" && "bg-[#ffd600] text-[#0f1714] hover:bg-[#ffdf33]",
        variant === "secondary" && "bg-[#004d40] text-white hover:bg-[#00695c]",
        variant === "ghost" && "bg-transparent text-[#004d40] hover:bg-[#eaf4f1]",
        className
      )}
      {...props}
    />
  );
}

export function MetricCard({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[14px] border border-[#dce7e3] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f6f6a]">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold text-[#171b1a]">{value}</strong>
      <span className="mt-1 block text-sm text-[#5f6f6a]">{detail}</span>
    </article>
  );
}

export function SectionHeader({
  title,
  description,
  align = "left"
}: {
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#171b1a] md:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#5f6f6a] md:text-lg">{description}</p>
    </div>
  );
}

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-[#edf5f2] text-[#004d40]",
        tone === "success" && "bg-[#e2f7ea] text-[#14733d]",
        tone === "warning" && "bg-[#fff5be] text-[#785f00]"
      )}
    >
      {children}
    </span>
  );
}
