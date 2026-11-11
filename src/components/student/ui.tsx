"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Shared building blocks for the Student portal pages. Sky is the portal accent.
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const PAGE_SIZE = 10;

export const inr = (n: number) => `${n < 0 ? "\u2212" : ""}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;

export const primaryBtn = `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`;
export const secondaryBtn = `inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition ${focusRing}`;
export const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 motion-safe:transition";

// Underline draws in from the left on hover/focus instead of snapping on.
export const linkClass = `text-sm font-medium text-sky-700 hover:text-sky-800 rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 ${focusRing} focus-visible:ring-offset-2`;
// Same underline, tuned for white text on the gradient band.
export const linkOnDark =
    "text-sm font-medium text-sky-200 hover:text-white rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

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
                    <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-2">
                        <Link
                            href={crumb.href}
                            aria-label={`Back to ${crumb.label}`}
                            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-sky-700 motion-safe:transition-colors ${focusRing}`}
                        >
                            <ArrowLeft size={15} aria-hidden="true" />
                        </Link>
                        <ol className="flex items-center gap-1 text-sm text-gray-500">
                            <li>
                                <Link href={crumb.href} className={`rounded-sm hover:text-sky-700 motion-safe:transition-colors ${focusRing}`}>
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

const pageBtn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-1`;

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
                                    page === n ? "border-sky-600 bg-sky-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
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
