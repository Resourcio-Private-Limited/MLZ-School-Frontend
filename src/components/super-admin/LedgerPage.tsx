"use client";

import { useId, useState } from "react";
import { MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient as roseGradient } from "@/components/super-admin/brand";
import { heroGradient as yellowGradient } from "@/components/accounts/brand";
import type { PaymentMode } from "@/redux/api/accountsApi";
import { apiErrorMessage } from "@/lib/apiError";
import { todayLocal } from "@/lib/dates";

/** One income or expense entry, in the shape this page works with. */
export type LedgerRecord = {
    id: string;
    date: string;
    createdAt: string;
    title: string;
    party?: string | null;
    category: string;
    categoryName: string | null;
    amount: number;
    paymentMode: string;
    chequeNumber: string | null;
    addedBy: string;
};

export type LedgerDraft = {
    title: string;
    party: string;
    amount: number;
    date: string;
    category: string;
    paymentMode: PaymentMode;
    chequeNumber?: string;
};

export type LedgerCategory = { key: string; label: string; swatch: string };

export type LedgerConfig = {
    noun: "income" | "expense";
    title: string;
    subtitle: string;
    /** "Received" or "Spent", used in the summary heading. */
    verb: string;
    titleLabel: string;
    titlePlaceholder: string;
    titleColumn: string;
    /** Optional second text field, e.g. who an expense was paid to. */
    partyLabel?: string;
    partyPlaceholder?: string;
    categories: LedgerCategory[];
    summaryNote?: string;
    emptyHint: string;
    searchPlaceholder: string;
};

const PAYMENT_MODES: { key: PaymentMode; label: string }[] = [
    { key: "CASH", label: "Cash" },
    { key: "ONLINE", label: "Online" },
    { key: "NEFT", label: "NEFT" },
    { key: "CARD", label: "Card" },
    { key: "CHEQUE", label: "Cheque" },
];
const PAYMENT_LABEL: Record<string, string> = Object.fromEntries(PAYMENT_MODES.map((p) => [p.key, p.label]));

type Period = "month" | "year" | "all";
type SortKey = "date" | "amount";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const PAGE_SIZE = 10;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export type LedgerAccent = "rose" | "yellow";

/**
 * Every accent-coloured class, per portal, as literal strings so Tailwind keeps them.
 * Rose is the Super Admin look. Yellow (Accounts) puts dark text on yellow-400, because white on yellow fails contrast.
 */
const THEMES = {
    rose: {
        gradient: roseGradient,
        focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
        inputFocus: "focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30",
        primary: "bg-rose-600 font-medium text-white hover:bg-rose-700",
        softHover: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700",
        currentPage: "border-rose-600 bg-rose-600 text-white",
        chipOn: "border-rose-600 bg-rose-50 text-rose-800",
        chipFocus: "peer-focus-visible:ring-rose-500",
        sortIcon: "text-rose-600",
        tabCount: "bg-rose-50 text-rose-700",
        underline: "bg-rose-600",
        textButton: "text-rose-700 hover:bg-rose-50",
    },
    yellow: {
        gradient: yellowGradient,
        focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600",
        inputFocus: "focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30",
        primary: "bg-yellow-400 font-semibold text-yellow-950 hover:bg-yellow-300",
        softHover: "hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800",
        currentPage: "border-yellow-400 bg-yellow-400 text-yellow-950",
        chipOn: "border-yellow-500 bg-yellow-50 text-yellow-900",
        chipFocus: "peer-focus-visible:ring-yellow-600",
        sortIcon: "text-yellow-600",
        tabCount: "bg-yellow-50 text-yellow-800",
        underline: "bg-yellow-500",
        textButton: "text-yellow-800 hover:bg-yellow-50",
    },
} as const;
type Theme = (typeof THEMES)[LedgerAccent];

export const inr = (n: number) => `${n < 0 ? "\u2212" : ""}₹${Math.abs(Math.round(n)).toLocaleString("en-IN")}`;
// Local date, not UTC: before 5:30 am in India the UTC date is still yesterday.
const todayIso = todayLocal;

// Indian schools run April to March, so "this year" means the academic year.
function academicYear(d = new Date()) {
    const start = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return { start: `${start}-04-01`, end: `${start + 1}-03-31`, label: `${start}–${String((start + 1) % 100).padStart(2, "0")}` };
}

function getPageItems(current: number, total: number): (number | "gap")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
    if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "gap", current - 1, current, current + 1, "gap", total];
}

function downloadCsv(rows: (string | number)[][], filename: string) {
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    // Leading BOM so Excel reads the ₹ sign and Indian names correctly.
    const blob = new Blob(["﻿" + rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function Skeleton({ className = "" }: { className?: string }) {
    return <span aria-hidden="true" className={`inline-block rounded bg-white/10 motion-safe:animate-pulse ${className}`} />;
}

function ChoiceChips<T extends string>({ legend, name, options, value, onChange, theme }: { legend: string; name: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void; theme: Theme }) {
    return (
        <fieldset>
            <legend className="text-sm font-medium text-gray-700">{legend}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
                {options.map((o) => (
                    <label key={o.key} className="cursor-pointer">
                        <input type="radio" name={name} value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} className="peer sr-only" />
                        <span
                            className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium motion-safe:transition-colors peer-focus-visible:ring-2 ${theme.chipFocus} peer-focus-visible:ring-offset-1 ${value === o.key ? theme.chipOn : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                        >
                            {o.label}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

function SortHeader({ k, sort, onSort, children, align = "left", theme }: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: string; align?: "left" | "right"; theme: Theme }) {
    const active = sort.key === k;
    const Icon = active && sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
        <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={`px-6 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
            <button
                type="button"
                onClick={() => onSort(k)}
                className={`group inline-flex items-center gap-1 rounded-sm hover:text-gray-900 ${theme.focusRing} ${active ? "text-gray-900" : ""}`}
            >
                {children}
                <Icon size={14} aria-hidden="true" className={active ? theme.sortIcon : "opacity-0 group-hover:opacity-50"} />
            </button>
        </th>
    );
}

type Form = { title: string; party: string; amount: string; date: string; category: string; paymentMode: PaymentMode; chequeNumber: string };

export default function LedgerPage({
    config,
    records,
    isLoading,
    isError,
    refetch,
    onCreate,
    onUpdate,
    onDelete,
    saving,
    accent = "rose",
}: {
    config: LedgerConfig;
    records: LedgerRecord[];
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
    onCreate: (draft: LedgerDraft) => Promise<unknown>;
    /** When given, each entry gets an Edit button that reopens the form prefilled. */
    onUpdate?: (id: string, draft: LedgerDraft) => Promise<unknown>;
    /** When given, each entry gets a Delete button with a confirmation. */
    onDelete?: (id: string) => Promise<unknown>;
    saving: boolean;
    /** The portal accent. Rose (Super Admin) by default. */
    accent?: LedgerAccent;
}) {
    const reduceMotion = useReducedMotion();
    const dialogTitleId = useId();
    const deleteTitleId = useId();
    const theme = THEMES[accent];
    const { focusRing } = theme;
    const inputBase = `block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 ${theme.inputFocus}`;
    const fieldClass = `mt-1.5 ${inputBase}`;
    const pageBtn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 ${theme.softHover} active:scale-[0.97] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-1`;
    const editable = !!onUpdate || !!onDelete;
    const columns = editable ? 7 : 6;
    const ay = academicYear();
    const monthKey = todayIso().slice(0, 7);
    const monthLabel = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
    const noun = config.noun;
    const categoryLabel: Record<string, string> = Object.fromEntries(config.categories.map((c) => [c.key, c.label]));
    const emptyForm = (): Form => ({ title: "", party: "", amount: "", date: todayIso(), category: config.categories[0].key, paymentMode: "CASH", chequeNumber: "" });

    const [period, setPeriod] = useState<Period>("year");
    const [category, setCategory] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<Sort>({ key: "date", dir: "desc" });
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<Form>(emptyForm);
    // The entry being edited (the form is in edit mode) and the one waiting for delete confirmation.
    const [editing, setEditing] = useState<LedgerRecord | null>(null);
    const [deleting, setDeleting] = useState<LedgerRecord | null>(null);
    const [removing, setRemoving] = useState(false);

    const PERIODS: { key: Period; label: string; short: string; heading: string }[] = [
        { key: "month", label: "This month", short: "This month", heading: `${config.verb} in ${monthLabel}` },
        { key: "year", label: `Academic year ${ay.label}`, short: ay.label, heading: `${config.verb} in ${ay.label}` },
        { key: "all", label: "All time", short: "All time", heading: `${config.verb} to date` },
    ];
    const activePeriod = PERIODS.find((p) => p.key === period)!;

    const inPeriod = records.filter((r) => {
        const d = r.date.slice(0, 10);
        if (period === "month") return d.slice(0, 7) === monthKey;
        if (period === "year") return d >= ay.start && d <= ay.end;
        return true;
    });
    const periodTotal = inPeriod.reduce((n, r) => n + r.amount, 0);
    const split = config.categories.map((c) => {
        const rows = inPeriod.filter((r) => r.category === c.key);
        return { ...c, amount: rows.reduce((n, r) => n + r.amount, 0), count: rows.length };
    });

    const q = search.trim().toLowerCase();
    const rows = inPeriod
        .filter((r) => category === "ALL" || r.category === category)
        .filter(
            (r) =>
                !q ||
                r.title.toLowerCase().includes(q) ||
                (r.party ?? "").toLowerCase().includes(q) ||
                r.addedBy.toLowerCase().includes(q) ||
                (r.categoryName ?? "").toLowerCase().includes(q) ||
                (r.chequeNumber ?? "").includes(q)
        )
        .sort((a, b) => {
            const diff = sort.key === "amount" ? a.amount - b.amount : a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
            return sort.dir === "asc" ? diff : -diff;
        });
    const rowsTotal = rows.reduce((n, r) => n + r.amount, 0);
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const resetPage = () => setPage(1);
    const toggleSort = (key: SortKey) => {
        setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
        resetPage();
    };

    const exportRows = () => {
        downloadCsv(
            [
                ["Date", config.titleColumn, ...(config.partyLabel ? [config.partyLabel] : []), "Category", "Amount (INR)", "Payment mode", "Cheque number", "Added by"],
                ...rows.map((r) => [
                    r.date.slice(0, 10),
                    r.title,
                    ...(config.partyLabel ? [r.party ?? ""] : []),
                    categoryLabel[r.category] ?? r.category,
                    r.amount,
                    PAYMENT_LABEL[r.paymentMode] ?? r.paymentMode,
                    r.chequeNumber ?? "",
                    r.addedBy,
                ]),
            ],
            `${noun}-${period === "month" ? monthKey : period === "year" ? ay.label.replace("–", "-") : "all"}.csv`
        );
    };

    const amount = Number(form.amount);
    const formError = !form.title.trim()
        ? `Add what the money was ${noun === "income" ? "received" : "spent"} for.`
        : !(amount > 0)
          ? "Enter an amount above ₹0."
          : form.paymentMode === "CHEQUE" && !form.chequeNumber.trim()
            ? "Add the cheque number."
            : null;

    const openForm = () => {
        setEditing(null);
        setForm(emptyForm());
        setOpen(true);
    };

    const openEdit = (r: LedgerRecord) => {
        setEditing(r);
        setForm({
            title: r.title,
            party: r.party ?? "",
            amount: String(r.amount),
            date: r.date.slice(0, 10),
            category: r.category,
            paymentMode: (PAYMENT_LABEL[r.paymentMode] ? r.paymentMode : "CASH") as PaymentMode,
            chequeNumber: r.chequeNumber ?? "",
        });
        setOpen(true);
    };

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formError || saving) return;
        const draft: LedgerDraft = {
            title: form.title.trim(),
            party: form.party.trim(),
            amount,
            date: form.date,
            category: form.category,
            paymentMode: form.paymentMode,
            chequeNumber: form.paymentMode === "CHEQUE" ? form.chequeNumber.trim() : undefined,
        };
        if (editing && onUpdate) {
            try {
                await onUpdate(editing.id, draft);
                setOpen(false);
                setEditing(null);
                toast.success(`“${draft.title}” updated.`);
                refetch();
            } catch (err) {
                toast.error(apiErrorMessage(err, "Changes not saved. Check your connection and try again."));
            }
            return;
        }
        try {
            await onCreate(draft);
            setOpen(false);
            toast.success(`${inr(amount)} recorded.`);
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, `${noun === "income" ? "Income" : "Expense"} not recorded. Check your connection and try again.`));
        }
    };

    const confirmDelete = async () => {
        if (!deleting || !onDelete || removing) return;
        setRemoving(true);
        try {
            await onDelete(deleting.id);
            toast.success(`“${deleting.title}” deleted.`);
            setDeleting(null);
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Entry not deleted. Check your connection and try again."));
        } finally {
            setRemoving(false);
        }
    };

    const shortDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const iconBtn = `inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 motion-safe:transition-colors ${focusRing}`;
    const rowActions = (r: LedgerRecord) => (
        <span className="flex items-center gap-0.5">
            {onUpdate && (
                <button type="button" onClick={() => openEdit(r)} aria-label={`Edit “${r.title}”`} title="Edit" className={iconBtn}>
                    <Pencil size={15} aria-hidden="true" />
                </button>
            )}
            {onDelete && (
                <button type="button" onClick={() => setDeleting(r)} aria-label={`Delete “${r.title}”`} title="Delete" className={`${iconBtn} hover:bg-red-50 hover:text-red-700`}>
                    <Trash2 size={15} aria-hidden="true" />
                </button>
            )}
        </span>
    );

    const recordLabel = `Record ${noun}`;
    const filtered = !!q || category !== "ALL";

    return (
        <MotionConfig reducedMotion="user">
            <div className="max-w-7xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{config.title}</h1>
                        <p className="mt-1 text-sm text-gray-500">{config.subtitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={exportRows}
                            disabled={rows.length === 0}
                            className={`inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                        >
                            <Download size={16} aria-hidden="true" />
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={openForm}
                            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm shadow-sm active:scale-[0.97] motion-safe:transition ${theme.primary} ${focusRing} focus-visible:ring-offset-2`}
                        >
                            <Plus size={18} aria-hidden="true" />
                            {recordLabel}
                        </button>
                    </div>
                </header>

                {isError && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {config.title} entries couldn&apos;t be loaded. Check your connection and try again.
                        <button type="button" onClick={() => refetch()} className={`font-medium underline underline-offset-2 ${focusRing}`}>
                            Try again
                        </button>
                    </div>
                )}

                {/* Period + summary */}
                <section aria-labelledby={`${noun}-summary`} className={`overflow-hidden rounded-xl shadow-sm ${theme.gradient}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
                        <div role="group" aria-label="Period" className="grid w-full grid-cols-3 rounded-lg bg-white/10 p-0.5 sm:inline-flex sm:w-auto">
                            {PERIODS.map((p) => {
                                const active = p.key === period;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => {
                                            setPeriod(p.key);
                                            resetPage();
                                        }}
                                        className={`relative rounded-md px-3 py-1.5 text-xs font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${active ? "text-slate-900" : "text-slate-300 hover:text-white"}`}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId={`${noun}-period`}
                                                className="absolute inset-0 rounded-md bg-white shadow-sm"
                                                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                                            />
                                        )}
                                        <span className="relative sm:hidden">{p.short}</span>
                                        <span className="relative hidden sm:inline">{p.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {config.summaryNote && <p className="text-xs text-slate-400">{config.summaryNote}</p>}
                    </div>

                    <div className="grid gap-6 px-4 py-5 sm:gap-8 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
                        <div>
                            <h2 id={`${noun}-summary`} className="text-sm text-slate-300">{activePeriod.heading}</h2>
                            <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                                {isLoading ? <Skeleton className="h-12 w-48 align-middle" /> : inr(periodTotal)}
                            </p>
                            <p className="mt-2 text-sm tabular-nums text-slate-300">
                                {isLoading ? " " : inPeriod.length === 0 ? "Nothing recorded yet." : `${inPeriod.length.toLocaleString("en-IN")} ${inPeriod.length === 1 ? "entry" : "entries"}`}
                            </p>
                        </div>

                        <div>
                            <div
                                role="img"
                                aria-label={`By category: ${split.map((s) => `${s.label} ${inr(s.amount)}`).join(", ")}`}
                                className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-white/10"
                            >
                                {!isLoading &&
                                    periodTotal > 0 &&
                                    split.map((s) =>
                                        s.amount > 0 ? (
                                            <motion.span
                                                key={s.key}
                                                className={`h-full ${s.swatch}`}
                                                initial={false}
                                                animate={{ width: `${(s.amount / periodTotal) * 100}%` }}
                                                transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE_OUT }}
                                            />
                                        ) : null
                                    )}
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))]">
                                {split.map((s) => (
                                    <div key={s.key} className="min-w-0">
                                        <dt className="flex items-center gap-2 text-sm text-slate-300">
                                            <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-sm ${s.swatch}`} />
                                            {s.label}
                                        </dt>
                                        <dd className="mt-1 truncate text-lg font-semibold tabular-nums">{isLoading ? <Skeleton className="h-6 w-20" /> : inr(s.amount)}</dd>
                                        <dd className="text-xs tabular-nums text-slate-400">
                                            {!isLoading && periodTotal > 0 ? `${Math.round((s.amount / periodTotal) * 100)}% of total` : " "}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </section>

                {/* Entries */}
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <div role="tablist" aria-label="Category" className="-mb-px flex gap-6 overflow-x-auto">
                            {[{ key: "ALL", label: "All", count: inPeriod.length }, ...split.map((s) => ({ key: s.key, label: s.label, count: s.count }))].map((t) => {
                                const active = category === t.key;
                                return (
                                    <button
                                        key={t.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => {
                                            setCategory(t.key);
                                            resetPage();
                                        }}
                                        className={`relative flex shrink-0 items-center gap-2 rounded-sm py-4 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                                    >
                                        {t.label}
                                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? theme.tabCount : "bg-gray-100 text-gray-600"}`}>
                                            {isLoading ? "…" : t.count.toLocaleString("en-IN")}
                                        </span>
                                        {active && (
                                            <motion.span
                                                layoutId={`${noun}-tab-underline`}
                                                className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full ${theme.underline}`}
                                                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-2 pb-3 lg:w-80 lg:shrink-0 lg:pb-0">
                            <div className="relative min-w-0 flex-1">
                                <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <label htmlFor={`${noun}-search`} className="sr-only">Search {noun}</label>
                                <input
                                    id={`${noun}-search`}
                                    type="search"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        resetPage();
                                    }}
                                    placeholder={config.searchPlaceholder}
                                    className={`h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 ${theme.inputFocus}`}
                                />
                            </div>
                            {/* Phones have no column headers to click, so sorting lives here. */}
                            <label className="xl:hidden">
                                <span className="sr-only">Sort</span>
                                <select
                                    value={`${sort.key}-${sort.dir}`}
                                    onChange={(e) => {
                                        const [key, dir] = e.target.value.split("-") as [SortKey, "asc" | "desc"];
                                        setSort({ key, dir });
                                        resetPage();
                                    }}
                                    className={`h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 ${theme.inputFocus}`}
                                >
                                    <option value="date-desc">Newest</option>
                                    <option value="date-asc">Oldest</option>
                                    <option value="amount-desc">Largest</option>
                                    <option value="amount-asc">Smallest</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {/* Phones and tablets: stacked entries instead of a wide table */}
                    <div className="xl:hidden">
                        {isLoading ? (
                            <ul aria-hidden="true" className="divide-y divide-gray-100">
                                {Array.from({ length: 5 }, (_, i) => (
                                    <li key={i} className="space-y-2 px-4 py-4">
                                        <span className="block h-4 w-2/3 rounded bg-gray-100 motion-safe:animate-pulse" />
                                        <span className="block h-3 w-1/2 rounded bg-gray-100 motion-safe:animate-pulse" />
                                    </li>
                                ))}
                            </ul>
                        ) : rows.length === 0 ? (
                            <div className="px-4 py-14 text-center text-sm">
                                {filtered ? (
                                    <>
                                        <p className="font-medium text-gray-900">No entries match these filters</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch("");
                                                setCategory("ALL");
                                                resetPage();
                                            }}
                                            className={`mt-3 rounded-lg px-3 py-1.5 font-medium ${theme.textButton} ${focusRing}`}
                                        >
                                            Clear filters
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-medium text-gray-900">
                                            No {noun === "income" ? "income" : "expenses"} recorded {period === "month" ? "this month" : period === "year" ? `in ${ay.label}` : "yet"}
                                        </p>
                                        <p className="mt-1 text-gray-500">{config.emptyHint}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y divide-gray-100">
                                    {pageRows.map((r) => (
                                        <li key={r.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">{r.title}</p>
                                                {r.party && <p className="truncate text-xs text-gray-600">Paid to {r.party}</p>}
                                                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 tabular-nums">
                                                    <time dateTime={r.date.slice(0, 10)}>
                                                        {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </time>
                                                    <span>{categoryLabel[r.category] ?? r.category}</span>
                                                    <span>
                                                        {PAYMENT_LABEL[r.paymentMode] ?? r.paymentMode}
                                                        {r.chequeNumber && ` no. ${r.chequeNumber}`}
                                                    </span>
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">Added by {r.addedBy}</p>
                                            </div>
                                            {editable ? (
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <p className="text-sm font-semibold tabular-nums text-gray-900">{inr(r.amount)}</p>
                                                    <span className="-mr-1.5">{rowActions(r)}</span>
                                                </div>
                                            ) : (
                                                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{inr(r.amount)}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                                    <span className="text-gray-600">
                                        Total of {rows.length.toLocaleString("en-IN")} {rows.length === 1 ? "entry" : "entries"}
                                    </span>
                                    <span className="font-semibold tabular-nums text-gray-900">{inr(rowsTotal)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hidden overflow-x-auto xl:block">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500">
                                <tr>
                                    <SortHeader k="date" sort={sort} onSort={toggleSort} theme={theme}>Date</SortHeader>
                                    <th scope="col" className="px-6 py-3 text-left font-medium">{config.titleColumn}</th>
                                    <th scope="col" className="px-6 py-3 text-left font-medium">Category</th>
                                    <th scope="col" className="px-6 py-3 text-left font-medium">Payment</th>
                                    <th scope="col" className="px-6 py-3 text-left font-medium">Added by</th>
                                    <SortHeader k="amount" align="right" sort={sort} onSort={toggleSort} theme={theme}>Amount</SortHeader>
                                    {editable && (
                                        <th scope="col" className="w-px py-3 pl-2 pr-4">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array.from({ length: 5 }, (_, i) => (
                                        <tr key={i} aria-hidden="true">
                                            {Array.from({ length: columns }, (_, j) => (
                                                <td key={j} className="px-6 py-4">
                                                    <span className="block h-4 w-full max-w-32 rounded bg-gray-100 motion-safe:animate-pulse" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns} className="px-6 py-16 text-center">
                                            {filtered ? (
                                                <>
                                                    <p className="font-medium text-gray-900">No entries match these filters</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSearch("");
                                                            setCategory("ALL");
                                                            resetPage();
                                                        }}
                                                        className={`mt-3 rounded-lg px-3 py-1.5 font-medium ${theme.textButton} ${focusRing}`}
                                                    >
                                                        Clear filters
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="font-medium text-gray-900">
                                                        No {noun === "income" ? "income" : "expenses"} recorded {period === "month" ? "this month" : period === "year" ? `in ${ay.label}` : "yet"}
                                                    </p>
                                                    <p className="mt-1 text-gray-500">{config.emptyHint}</p>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    pageRows.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 motion-safe:transition-colors">
                                            <td className="whitespace-nowrap px-6 py-3.5 tabular-nums text-gray-600">
                                                <time dateTime={r.date.slice(0, 10)}>
                                                    {new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </time>
                                            </td>
                                            <td className="max-w-xs px-6 py-3.5">
                                                <p className="truncate font-medium text-gray-900">{r.title}</p>
                                                {r.party && <p className="truncate text-xs text-gray-500">Paid to {r.party}</p>}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">
                                                {categoryLabel[r.category] ?? r.category}
                                                {r.categoryName && r.categoryName !== r.title && r.categoryName !== categoryLabel[r.category] && (
                                                    <span className="block text-xs text-gray-500">{r.categoryName}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">
                                                {PAYMENT_LABEL[r.paymentMode] ?? r.paymentMode}
                                                {r.chequeNumber && <span className="block text-xs tabular-nums text-gray-500">No. {r.chequeNumber}</span>}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">{r.addedBy}</td>
                                            <td className="whitespace-nowrap px-6 py-3.5 text-right font-semibold tabular-nums text-gray-900">{inr(r.amount)}</td>
                                            {editable && <td className="whitespace-nowrap py-2 pl-2 pr-4">{rowActions(r)}</td>}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!isLoading && rows.length > 0 && (
                                <tfoot className="border-t border-gray-200 bg-gray-50">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-3 text-gray-600">
                                            Total of {rows.length.toLocaleString("en-IN")} {rows.length === 1 ? "entry" : "entries"}
                                            {filtered && " shown"}
                                        </td>
                                        <td className="px-6 py-3 text-right font-semibold tabular-nums text-gray-900">{inr(rowsTotal)}</td>
                                        {editable && <td aria-hidden="true" />}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {!isLoading && rows.length > PAGE_SIZE && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:px-6">
                            <p className="whitespace-nowrap text-sm tabular-nums text-gray-500">
                                Showing{" "}
                                <span className="font-medium text-gray-700">
                                    {(currentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, rows.length)}
                                </span>
                                {" of "}
                                <span className="font-medium text-gray-700">{rows.length.toLocaleString("en-IN")}</span>
                            </p>
                            <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                                <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={pageBtn}>
                                    Prev
                                </button>
                                {getPageItems(currentPage, pageCount).map((n, i) =>
                                    n === "gap" ? (
                                        <span key={`gap-${i}`} aria-hidden="true" className="flex h-9 w-9 select-none items-center justify-center text-sm text-gray-500">
                                            &hellip;
                                        </span>
                                    ) : (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setPage(n)}
                                            aria-label={`Page ${n}`}
                                            aria-current={currentPage === n ? "page" : undefined}
                                            className={`h-9 w-9 rounded-lg border text-sm font-medium tabular-nums active:scale-[0.95] motion-safe:transition ${focusRing} focus-visible:ring-offset-1 ${
                                                currentPage === n ? theme.currentPage : `border-gray-300 bg-white text-gray-700 ${theme.softHover}`
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    )
                                )}
                                <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className={pageBtn}>
                                    Next
                                </button>
                            </nav>
                        </div>
                    )}
                </section>

                <Dialog open={open} onClose={() => setOpen(false)} labelledBy={dialogTitleId} className="sm:max-w-lg">
                    <DialogHeader
                        id={dialogTitleId}
                        title={editing ? `Edit ${noun}` : recordLabel}
                        subtitle={editing ? `Added by ${editing.addedBy}` : config.subtitle}
                        onClose={() => setOpen(false)}
                        accent={accent}
                    />
                    <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
                        <div className="space-y-5 overflow-y-auto px-6 py-5">
                            <label className="block text-sm font-medium text-gray-700">
                                {config.titleLabel}
                                <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={config.titlePlaceholder} className={fieldClass} />
                            </label>
                            {config.partyLabel && (
                                <label className="block text-sm font-medium text-gray-700">
                                    {config.partyLabel} <span className="font-normal text-gray-500">(optional)</span>
                                    <input value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder={config.partyPlaceholder} className={fieldClass} />
                                </label>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount
                                    <span className="relative mt-1.5 block">
                                        <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                        <input
                                            inputMode="decimal"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })}
                                            placeholder="0"
                                            className={`${inputBase} pl-7 tabular-nums`}
                                        />
                                    </span>
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Date
                                    <input type="date" value={form.date} max={todayIso()} onChange={(e) => setForm({ ...form, date: e.target.value })} className={fieldClass} />
                                </label>
                            </div>
                            <ChoiceChips legend="Category" name={`${noun}-category`} options={config.categories} value={form.category} onChange={(v) => setForm({ ...form, category: v })} theme={theme} />
                            <ChoiceChips legend="Paid by" name={`${noun}-payment`} options={PAYMENT_MODES} value={form.paymentMode} onChange={(v) => setForm({ ...form, paymentMode: v })} theme={theme} />
                            {form.paymentMode === "CHEQUE" && (
                                <label className="block text-sm font-medium text-gray-700">
                                    Cheque number
                                    <input value={form.chequeNumber} onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} inputMode="numeric" className={`${fieldClass} tabular-nums`} />
                                </label>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                            {formError && (form.title || form.amount) && <p className="mr-auto text-sm text-gray-500">{formError}</p>}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className={`h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 motion-safe:transition-colors ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!!formError || saving}
                                className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-500 motion-safe:transition ${theme.primary} ${focusRing} focus-visible:ring-offset-2`}
                            >
                                {editing ? (saving ? "Saving…" : "Save changes") : saving ? "Recording…" : recordLabel}
                            </button>
                        </div>
                    </form>
                </Dialog>

                {onDelete && (
                    <Dialog open={!!deleting} onClose={() => !removing && setDeleting(null)} labelledBy={deleteTitleId} className="sm:max-w-md">
                        <DialogHeader id={deleteTitleId} title="Delete this entry?" subtitle="This can't be undone." onClose={() => setDeleting(null)} accent={accent} />
                        {deleting && (
                            <div className="px-6 py-5">
                                <dl className="rounded-lg border border-gray-200 px-4 py-3 text-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="min-w-0">
                                            <span className="block truncate font-medium text-gray-900">{deleting.title}</span>
                                            <span className="block text-gray-500 tabular-nums">
                                                {shortDate(deleting.date)}, {categoryLabel[deleting.category] ?? deleting.category}
                                            </span>
                                        </dt>
                                        <dd className="shrink-0 font-semibold tabular-nums text-gray-900">{inr(deleting.amount)}</dd>
                                    </div>
                                </dl>
                                <p className="mt-3 text-sm text-gray-600">
                                    The {noun === "income" ? "income" : "expense"} totals and the financial overview will no longer include it.
                                </p>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setDeleting(null)}
                                className={`h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 motion-safe:transition-colors ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={removing}
                                className={`inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-500 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                                {removing ? "Deleting…" : "Delete entry"}
                            </button>
                        </div>
                    </Dialog>
                )}
            </div>
        </MotionConfig>
    );
}
