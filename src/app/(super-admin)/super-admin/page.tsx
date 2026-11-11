"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
    useGetDashboardKpisQuery,
    useGetSuperAdminIncomesQuery,
    useGetSuperAdminExpensesQuery,
} from "@/redux/api/superAdminApi";
import { useGetProfitAndLossQuery } from "@/redux/api/accountsApi";
import { heroGradient } from "@/components/super-admin/brand";
import { todayLocal } from "@/lib/dates";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const titleCase = (s: string) =>
    s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

// Underline draws in from the left on hover/focus instead of snapping on.
const linkClass =
    `text-sm font-medium text-rose-700 hover:text-rose-800 rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 ${focusRing} focus-visible:ring-offset-2`;

// Same underline, tuned for white text on the gradient band.
const linkOnDark =
    `text-sm font-medium text-rose-200 hover:text-white rounded-sm bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[position:0_100%] bg-[length:0%_1px] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] motion-safe:transition-[background-size,color] motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`;

function Skeleton({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
    return <span aria-hidden="true" className={`inline-block rounded ${onDark ? "bg-white/10" : "bg-gray-100"} motion-safe:animate-pulse ${className}`} />;
}

function Panel({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
            <div className="flex items-center justify-between gap-4 px-6 pt-5">
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}

type TxnKind = "income" | "expense";
type Txn = { id: string; date: string; createdAt: string; label: string; detail: string; amount: number; kind: TxnKind };
type Filter = "all" | TxnKind;

const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "income", label: "Income" },
    { value: "expense", label: "Expenses" },
];

function FilterSwitch({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
    return (
        <div role="group" aria-label="Show transactions" className="relative inline-flex rounded-lg bg-gray-100 p-0.5">
            {FILTERS.map((f) => {
                const active = f.value === value;
                return (
                    <button
                        key={f.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(f.value)}
                        className={`relative rounded-md px-3 py-1 text-xs font-medium transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        {active && (
                            <motion.span
                                layoutId="txn-filter"
                                className="absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-gray-200"
                                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                            />
                        )}
                        <span className="relative">{f.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default function SuperAdminDashboard() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = now.toLocaleString("en-IN", { month: "long" });

    const kpiQ = useGetDashboardKpisQuery();
    const plQ = useGetProfitAndLossQuery({ month, year });
    const incQ = useGetSuperAdminIncomesQuery();
    const expQ = useGetSuperAdminExpensesQuery();

    const kpis = kpiQ.data;
    const pl = plQ.data;
    const incomes = incQ.data ?? [];
    const expenses = expQ.data ?? [];

    const [filter, setFilter] = useState<Filter>("all");
    const reduceMotion = useReducedMotion();

    const refreshing = [kpiQ, plQ, incQ, expQ].some((q) => q.isFetching && !q.isLoading);
    const refreshAll = () => {
        kpiQ.refetch();
        plQ.refetch();
        incQ.refetch();
        expQ.refetch();
    };
    const updatedAt = kpiQ.fulfilledTimeStamp
        ? new Date(kpiQ.fulfilledTimeStamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
        : null;

    const income = pl?.totalIncome ?? 0;
    const spent = pl?.totalExpenses ?? 0;
    const net = pl?.netBalance ?? income - spent;
    const spentPct = income > 0 ? Math.round((spent / income) * 100) : spent > 0 ? 100 : 0;
    const barPct = Math.min(spentPct, 100);
    const barColor = spentPct >= 100 ? "bg-red-400" : spentPct > 80 ? "bg-amber-400" : "bg-emerald-400";

    const ratio = kpis && kpis.totalTeachers > 0 ? Math.round(kpis.totalStudents / kpis.totalTeachers) : null;

    const transactions: Txn[] = [
        ...incomes.map((r) => ({
            id: `i-${r.id}`, date: r.date, createdAt: r.createdAt, label: r.source,
            detail: r.categoryName ?? titleCase(r.category), amount: r.amount, kind: "income" as const,
        })),
        ...expenses.map((r) => ({
            id: `e-${r.id}`, date: r.date, createdAt: r.createdAt, label: r.reason,
            detail: r.partyName || r.categoryName || titleCase(r.category), amount: r.amount, kind: "expense" as const,
        })),
    ]
        .filter((t) => filter === "all" || t.kind === filter)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6);

    const people: { label: string; value: number | null | undefined; hint: string; tab?: string }[] = [
        { label: "Students", value: kpis?.totalStudents, hint: "Enrolled across all classes", tab: "students" },
        { label: "Teachers", value: kpis?.totalTeachers, hint: "Active faculty", tab: "teachers" },
        { label: "Administrative staff", value: kpis?.administrativeStaff, hint: "Principal, accountant and admin", tab: "staff" },
        { label: "Students per teacher", value: ratio, hint: "School-wide average" },
    ];

    return (
        <MotionConfig reducedMotion="user">
            <div className="max-w-7xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">Mount Litera Zee School</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <time dateTime={todayLocal()} className="block text-sm text-gray-700">
                                {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                            </time>
                            <p aria-live="polite" className="text-xs text-gray-500 tabular-nums">
                                {refreshing ? "Refreshing figures…" : updatedAt ? `Updated at ${updatedAt}` : " "}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={refreshAll}
                            disabled={refreshing || kpiQ.isLoading}
                            className={`inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                        >
                            <RefreshCw size={16} aria-hidden="true" className={refreshing ? "motion-safe:animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </header>

                {(kpiQ.isError || plQ.isError) && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        Some figures couldn&apos;t be loaded. Check your connection, then select Refresh.
                    </div>
                )}

                <section aria-labelledby="month-finances" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 pt-5">
                        <h2 id="month-finances" className="text-base font-semibold">{monthName} finances</h2>
                        <Link href="/super-admin/financial" className={linkOnDark}>Financial overview</Link>
                    </div>
                    <div className="px-6 pt-4 pb-6">
                        <dl className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div>
                                <dt className="text-sm text-slate-300">Income</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-white tabular-nums">
                                    {plQ.isLoading ? <Skeleton onDark className="h-8 w-32 align-middle" /> : inr(income)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-300">Expenses</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-white tabular-nums">
                                    {plQ.isLoading ? <Skeleton onDark className="h-8 w-32 align-middle" /> : inr(spent)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-300">Net balance</dt>
                                <dd className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${net < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                                    {plQ.isLoading ? <Skeleton onDark className="h-8 w-32 align-middle" /> : `${net < 0 ? "−" : ""}${inr(Math.abs(net))}`}
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-6">
                            <div
                                role="meter"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={barPct}
                                aria-label="Share of this month's income spent"
                                className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
                            >
                                {!plQ.isLoading && (
                                    <motion.div
                                        className={`h-full rounded-full ${barColor} motion-safe:transition-colors motion-safe:duration-500`}
                                        initial={{ width: reduceMotion ? `${barPct}%` : 0 }}
                                        animate={{ width: `${barPct}%` }}
                                        transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.15, ease: EASE_OUT }}
                                    />
                                )}
                            </div>
                            <p className="mt-2 min-h-5 text-sm text-slate-300">
                                {plQ.isLoading
                                    ? null
                                    : income === 0 && spent === 0
                                      ? `Nothing recorded for ${monthName} yet.`
                                      : spent > income
                                        ? `Spending is ${inr(spent - income)} more than income this month.`
                                        : `${spentPct}% of this month's income has been spent.`}
                            </p>
                        </div>
                    </div>
                </section>

                <Panel title="People" action={<Link href="/super-admin/users" className={linkClass}>Manage users</Link>}>
                    <dl className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
                        {people.map((p) => (
                            <div
                                key={p.label}
                                className={`group relative bg-white px-6 py-5 ${p.tab ? "hover:bg-gray-50 motion-safe:transition-colors" : ""}`}
                            >
                                <dt className={`text-sm text-gray-500 ${p.tab ? "group-hover:text-rose-700 motion-safe:transition-colors" : ""}`}>{p.label}</dt>
                                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                                    {kpiQ.isLoading ? <Skeleton className="h-8 w-16 align-middle" /> : p.value != null ? p.value.toLocaleString("en-IN") : "—"}
                                </dd>
                                <dd className="mt-1 text-xs text-gray-500">{p.hint}</dd>
                                {p.tab && (
                                    <Link
                                        href={`/super-admin/users?tab=${p.tab}`}
                                        className={`absolute inset-0 ${focusRing} focus-visible:ring-inset`}
                                    >
                                        <span className="sr-only">View {p.label.toLowerCase()}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </dl>
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <Panel
                        title="Latest transactions"
                        action={<FilterSwitch value={filter} onChange={setFilter} />}
                        className="lg:col-span-2"
                    >
                        <div className="mt-3">
                            {incQ.isLoading || expQ.isLoading ? (
                                <div className="space-y-3 px-6 pt-2 pb-5">
                                    {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-5 w-full" />)}
                                </div>
                            ) : transactions.length === 0 ? (
                                <p className="px-6 pt-2 pb-5 text-sm text-gray-500">
                                    {filter === "income"
                                        ? "No income recorded yet. Use Record income below to add the first entry."
                                        : filter === "expense"
                                          ? "No expenses recorded yet. Use Record expense below to add the first entry."
                                          : "No income or expenses recorded yet. Use the links below to add the first entry."}
                                </p>
                            ) : (
                                <ul className="relative divide-y divide-gray-100">
                                    <AnimatePresence initial={false} mode="popLayout">
                                        {transactions.map((t) => (
                                            <motion.li
                                                key={t.id}
                                                layout
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2, ease: EASE_OUT }}
                                            >
                                                <Link
                                                    href={t.kind === "income" ? "/super-admin/income" : "/super-admin/expenses"}
                                                    className={`group flex items-center gap-4 px-6 py-3 hover:bg-gray-50 motion-safe:transition-colors ${focusRing} focus-visible:ring-inset`}
                                                >
                                                    <time dateTime={t.date.slice(0, 10)} className="w-14 shrink-0 text-sm text-gray-500 tabular-nums">
                                                        {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </time>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900 group-hover:text-rose-700 motion-safe:transition-colors">{t.label}</p>
                                                        <p className="truncate text-xs text-gray-500">{t.detail}</p>
                                                    </div>
                                                    <p className={`shrink-0 text-sm font-semibold tabular-nums ${t.kind === "income" ? "text-emerald-700" : "text-gray-900"}`}>
                                                        <span className="sr-only">{t.kind === "income" ? "Income" : "Expense"} </span>
                                                        {t.kind === "income" ? "+" : "−"}{inr(t.amount)}
                                                    </p>
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
                            <Link href="/super-admin/income" className={linkClass}>Record income</Link>
                            <Link href="/super-admin/expenses" className={linkClass}>Record expense</Link>
                        </div>
                    </Panel>

                    <div className="space-y-6">
                        {/* The API's "pendingAdmissions" actually counts students admitted
                            this calendar year, and there is no approval flow in the app —
                            so the card says what the number really is. */}
                        <Panel title={`Admissions in ${new Date().getFullYear()}`}>
                            <div className="px-6 pt-3 pb-6">
                                <p className="text-4xl font-semibold tracking-tight text-gray-900 tabular-nums">
                                    {kpiQ.isLoading ? <Skeleton className="h-9 w-16" /> : (kpis?.pendingAdmissions ?? 0).toLocaleString("en-IN")}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    {!kpiQ.isLoading && (kpis?.pendingAdmissions ?? 0) === 0
                                        ? "No students have been admitted this year yet."
                                        : "Students admitted this year, from each classroom's admission form."}
                                </p>
                            </div>
                        </Panel>

                        <Panel title="Notice board" action={<Link href="/super-admin/noticeboard" className={linkClass}>Open</Link>}>
                            <div className="px-6 pt-3 pb-6">
                                <p className="text-4xl font-semibold tracking-tight text-gray-900 tabular-nums">
                                    {kpiQ.isLoading ? <Skeleton className="h-9 w-16" /> : (kpis?.activeNotices ?? 0).toLocaleString("en-IN")}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    {!kpiQ.isLoading && (kpis?.activeNotices ?? 0) === 0
                                        ? "No notices are published. Post one from the notice board."
                                        : "Notices currently published to the school."}
                                </p>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </MotionConfig>
    );
}
