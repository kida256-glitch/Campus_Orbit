import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, resolving conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Absolute URL helper, used for auth redirects and shareable portfolio links. */
export function absoluteUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Initials for avatar fallbacks: "Aisha Nakato" -> "AN". */
export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Time-of-day greeting used by the dashboard header. */
export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Turn a full name into a stable, URL-safe portfolio slug candidate. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Clamp a number into an inclusive range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Whole-number percentage, guarding against division by zero. */
export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Days until a deadline. Negative means the deadline has passed. */
export function daysUntil(date: string | Date) {
  const target = typeof date === "string" ? new Date(date) : date;
  const ms = target.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/** Format a stored `HH:MM:SS` time as `9:00 AM`. */
export function formatTime(value?: string | null) {
  if (!value) return "";
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mRaw ?? "00"} ${suffix}`;
}
