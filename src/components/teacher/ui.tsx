"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

// Shared building blocks for the Teacher portal pages. Emerald is the portal accent.
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const PAGE_SIZE = 10;

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const primaryBtn = `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`;
export const secondaryBtn = `inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition ${focusRing}`;
export const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 motion-safe:transition";

// Underline draws in from the left on hover/focus instead of snapping on.
export const linkClass = `text-sm font-medium text-emerald-700 hover:text-emerald-800 rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 ${focusRing} focus-visible:ring-offset-2`;
// Same underline, tuned for white text on the gradient band.
export const linkOnDark =
    "text-sm font-medium text-emerald-200 hover:text-white rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export function Skeleton({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
    return <span aria-hidden="true" className={`inline-block rounded ${onDark ? "bg-white/10" : "bg-gray-100"} motion-safe:animate-pulse ${className}`} />;
}

export type Crumb = { href: string; label: string };

/** Standard page header: optional breadcrumb, h1, subtitle, actions on the right. */
export function PageHeader({ title, subtitle, crumb, actions }: { title: string; subtitle?: ReactNode; crumb?: Crumb; actions?: ReactNode }) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-gray-200 pb-6">
            <div className="min-w-0">
                {crumb && (
                    <nav aria-label="Breadcrumb" className="mb-1.5">
                        <ol className="flex items-center gap-1 text-sm text-gray-500">
                            <li>
                                <Link href={crumb.href} className={`rounded-sm hover:text-emerald-700 motion-safe:transition-colors ${focusRing}`}>
                                    {crumb.label}
                                </Link>
                            </li>
                            <li aria-hidden="true">
                                <ChevronRight size={14} />
                            </li>
                            <li aria-current="page" className="text-gray-700">{title}</li>
                        </ol>
                    </nav>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </header>
    );
}

export function Panel({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-5 sm:px-6">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

/** Empty, error and "nothing matches" states share one quiet layout. */
export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
    return (
        <div className="px-6 py-14 text-center">
            {icon && <div aria-hidden="true" className="mx-auto mb-3 flex justify-center text-gray-300">{icon}</div>}
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{hint}</p>}
            {action && <div className="mt-4 flex justify-center">{action}</div>}
        </div>
    );
}

export function getPageItems(current: number, total: number): (number | "gap")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
    if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "gap", current - 1, current, current + 1, "gap", total];
}

/** Slice a list into pages of PAGE_SIZE; the page is clamped when the list shrinks. */
export function paginate<T>(rows: T[], page: number) {
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(Math.max(1, page), pageCount);
    return { pageCount, current, pageRows: rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) };
}

const pageBtn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-1`;

/** "Showing 1–10 of 34" plus a windowed pager. */
export function Pager({ total, page, pageCount, onPage }: { total: number; page: number; pageCount: number; onPage: (n: number) => void }) {
    if (total === 0) return null;
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:px-6">
            <p className="whitespace-nowrap text-sm tabular-nums text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-700">
                    {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, total)}
                </span>
                {" of "}
                <span className="font-medium text-gray-700">{total.toLocaleString("en-IN")}</span>
            </p>
            {pageCount > 1 && (
                <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                    <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className={pageBtn}>
                        Prev
                    </button>
                    {getPageItems(page, pageCount).map((n, i) =>
                        n === "gap" ? (
                            <span key={`gap-${i}`} aria-hidden="true" className="flex h-9 w-9 select-none items-center justify-center text-sm text-gray-400">
                                &hellip;
                            </span>
                        ) : (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onPage(n)}
                                aria-label={`Page ${n}`}
                                aria-current={page === n ? "page" : undefined}
                                className={`h-9 w-9 rounded-lg border text-sm font-medium tabular-nums active:scale-[0.95] motion-safe:transition ${focusRing} focus-visible:ring-offset-1 ${
                                    page === n ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                            >
                                {n}
                            </button>
                        )
                    )}
                    <button type="button" onClick={() => onPage(page + 1)} disabled={page === pageCount} className={pageBtn}>
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
}

// ─── Dates ─────────────────────────────────────────────────────────

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const daysFromToday = (value: string) => Math.round((startOfDay(new Date(value)) - startOfDay(new Date())) / 86_400_000);
export const clock = (value: string) => new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

export function shortDate(value: string) {
    const d = new Date(value);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

export function longDate(value: string) {
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** "Today", "Yesterday", or "Monday 3 November" (year added when it isn't this year). */
export function dayHeading(value: string) {
    const diff = daysFromToday(value);
    if (diff === 0) return "Today";
    if (diff === -1) return "Yesterday";
    if (diff === 1) return "Tomorrow";
    const d = new Date(value);
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

/** "in 3 days", "tomorrow", "today", "2 days ago". */
export function relativeDay(value: string) {
    const diff = daysFromToday(value);
    if (diff === 0) return "today";
    if (diff === 1) return "tomorrow";
    if (diff === -1) return "yesterday";
    return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

/** Group an already-sorted list under day headings. */
export function groupByDay<T>(items: T[], dateOf: (item: T) => string) {
    const groups: { label: string; items: T[] }[] = [];
    for (const item of items) {
        const label = dayHeading(dateOf(item));
        const last = groups[groups.length - 1];
        if (last?.label === label) last.items.push(item);
        else groups.push({ label, items: [item] });
    }
    return groups;
}

export function hostname(value: string) {
    try {
        return new URL(value).hostname.replace(/^www\./, "");
    } catch {
        return value;
    }
}

export const fileName = (url: string) => decodeURIComponent(url.split("?")[0].split("/").pop() || "Attachment");

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

/** Reads the signed-in user from localStorage. Portal layouts render pages only after their auth check, so this is safe in a lazy useState. */
export function readAuthUser(): { id: string; teacherId: string } {
    try {
        const user = JSON.parse(localStorage.getItem("authUser") || "{}");
        return { id: user.id ?? "", teacherId: user.teacher?.id ?? user.id ?? "" };
    } catch {
        return { id: "", teacherId: "" };
    }
}

/** Pulls a readable message out of an RTK Query error, or falls back to the given text. */
export function errorMessage(err: unknown, fallback: string) {
    const e = err as { data?: { message?: string | string[] } };
    const m = e?.data?.message;
    return (Array.isArray(m) ? m[0] : m) || fallback;
}

/** Segmented filter with a sliding highlight. Buttons carry aria-pressed. */
export function FilterChips<T extends string>({
    label,
    value,
    options,
    onChange,
    layoutId,
}: {
    label: string;
    value: T;
    options: { value: T; label: string; count?: number }[];
    onChange: (v: T) => void;
    layoutId: string;
}) {
    return (
        <div role="group" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 py-0.5">
            {options.map((o) => {
                const active = value === o.value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(o.value)}
                        className={`relative inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                    >
                        {active && <ActiveChip layoutId={layoutId} />}
                        <span className="relative">{o.label}</span>
                        {o.count !== undefined && <span className={`relative text-xs tabular-nums ${active ? "text-emerald-700" : "text-gray-400"}`}>{o.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

function ActiveChip({ layoutId }: { layoutId: string }) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.span
            layoutId={layoutId}
            className="absolute inset-0 rounded-md bg-emerald-50 ring-1 ring-emerald-100"
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
        />
    );
}

/** Present / absent / not marked, always with a word, never colour alone. */
export function AttendanceBadge({ status }: { status: string | null | undefined }) {
    if (status === "PRESENT")
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Present
            </span>
        );
    if (status === "ABSENT")
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-100">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Absent
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Not marked
        </span>
    );
}

/** Underlined tabs with counts and a sliding underline. */
export function Tabs<T extends string>({
    label,
    value,
    tabs,
    onChange,
    layoutId,
    loading,
}: {
    label: string;
    value: T;
    tabs: { key: T; label: string; count?: number }[];
    onChange: (v: T) => void;
    layoutId: string;
    loading?: boolean;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <div role="tablist" aria-label={label} className="-mb-px flex gap-5 overflow-x-auto sm:gap-6">
            {tabs.map((t) => {
                const active = value === t.key;
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(t.key)}
                        className={`relative flex shrink-0 items-center gap-2 rounded-sm py-4 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        {t.label}
                        {t.count !== undefined && (
                            <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums motion-safe:transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                {loading ? "…" : t.count}
                            </span>
                        )}
                        {active && (
                            <motion.span
                                layoutId={layoutId}
                                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-emerald-600"
                                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** Search box with a clear button; Escape clears it. */
export function SearchBox({ id, label, value, onChange, placeholder, className = "" }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
    return (
        <div className={`relative ${className}`}>
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <label htmlFor={id} className="sr-only">{label}</label>
            <input
                id={id}
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") onChange("");
                }}
                placeholder={placeholder}
                className={`${inputClass} h-10 py-0 pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none`}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
                    className={`absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 ${focusRing}`}
                >
                    <X size={14} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

/** Classes are named like "Class 7 - Section B"; this gives a short form ("7B") for chips on phones. */
export function shortClass(name: string) {
    const m = name.match(/(\d+|nursery|lkg|ukg)\D*(?:section\s*)?([a-z])?\s*$/i);
    return m ? `${m[1].toUpperCase()}${m[2]?.toUpperCase() ?? ""}` : name;
}
