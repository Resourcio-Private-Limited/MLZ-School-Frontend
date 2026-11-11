"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useGetExpensesQuery, useGetIncomesQuery, useGetProfitAndLossQuery } from "@/redux/api/accountsApi";
import { heroGradient } from "@/components/accounts/brand";
import { EASE_OUT, FilterChips, PageHeader, Pager, Panel, Skeleton, focusRing, inr, linkClass, paginate, secondaryBtn } from "@/components/accounts/ui";

// Chart series colours: teal = income, violet = expenses. Validated with the dataviz palette checker against the
// yellow accent (teal/violet ΔE 21, worst pair with yellow ΔE 16.6). Emerald, orange and red stay reserved for good,
// warning and bad states.
const INCOME_BAR = "bg-teal-600";
const EXPENSE_BAR = "bg-violet-600";

const iconBtn = `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`;

const signedInr = (n: number) => `${n < 0 ? "−" : ""}${inr(Math.abs(n))}`;
// Axis labels in Indian units: ₹1.2L, ₹45k, ₹2Cr.
function shortInr(n: number) {
    const trim = (v: number) => (v >= 10 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));
    if (n >= 1e7) return `₹${trim(n / 1e7)}Cr`;
    if (n >= 1e5) return `₹${trim(n / 1e5)}L`;
    if (n >= 1e3) return `₹${trim(n / 1e3)}k`;
    return `₹${Math.round(n)}`;
}
const titleCase = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const modeLabel = (m: string) => (m === "NEFT" ? "NEFT" : titleCase(m).toLowerCase());

type Ym = { y: number; m: number }; // m is 1–12
const ymKey = ({ y, m }: Ym) => `${y}-${String(m).padStart(2, "0")}`;
const shiftYm = ({ y, m }: Ym, by: number): Ym => {
    const d = new Date(y, m - 1 + by, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
};
const monthName = ({ y, m }: Ym, style: "long" | "short" = "long") => new Date(y, m - 1, 1).toLocaleString("en-IN", { month: style });
// Records carry an ISO date; the first seven characters are the calendar month.
const recordYm = (date: string) => date.slice(0, 7);

// Round the chart ceiling up to 1, 2, 2.5 or 5 × a power of ten.
function niceCeil(n: number) {
    if (n <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(n));
    const f = n / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

/** "↑ 12% more than October", coloured by whether the change is good news. Styled for the gradient band. */
function Change({ curr, prev, prevLabel, upIsGood, money = false }: { curr: number; prev: number; prevLabel: string; upIsGood: boolean; money?: boolean }) {
    if (curr === prev) return <p className="mt-1 text-sm text-slate-300">Same as {prevLabel}</p>;
    const up = curr > prev;
    const good = up === upIsGood;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    let text: string;
    // A % change of a balance that can go negative misleads, so net balance shows the rupee difference.
    if (money) text = `${inr(Math.abs(curr - prev))} ${up ? "better" : "worse"} than ${prevLabel}`;
    else if (prev === 0) text = `Up from nothing in ${prevLabel}`;
    else {
        const pct = Math.abs(((curr - prev) / prev) * 100);
        text = `${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}% ${up ? "more" : "less"} than ${prevLabel}`;
    }
    return (
        <p className={`mt-1 flex items-center gap-1 text-sm ${good ? "text-emerald-300" : "text-rose-300"}`}>
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            {text}
        </p>
    );
}

function CategoryBreakdown({ rows, total, barClass, loading, empty }: { rows: { name: string; amount: number }[]; total: number; barClass: string; loading: boolean; empty: string }) {
    if (loading)
        return (
            <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-8 w-full" />)}
            </div>
        );
    if (rows.length === 0) return <p className="px-4 pb-6 pt-3 text-sm text-gray-500 sm:px-6">{empty}</p>;
    const max = rows[0].amount;
    return (
        <ul className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
            {rows.map((r) => (
                <li key={r.name}>
                    <div className="flex items-baseline justify-between gap-4 text-sm">
                        <span className="min-w-0 truncate text-gray-700">{r.name}</span>
                        <span className="shrink-0 tabular-nums">
                            <span className="font-medium text-gray-900">{inr(r.amount)}</span>
                            <span className="ml-2 inline-block w-10 text-right text-gray-500">{total > 0 ? Math.round((r.amount / total) * 100) : 0}%</span>
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max((r.amount / max) * 100, 1)}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

type TxnKind = "income" | "expense";
type Filter = "all" | TxnKind;
type Txn = { id: string; date: string; createdAt: string; label: string; detail: string; mode: string; amount: number; kind: TxnKind };

const CHART_MONTHS = 6;

export default function AnalysisPage() {
    const reduceMotion = useReducedMotion();
    const today = new Date();
    const thisMonth: Ym = { y: today.getFullYear(), m: today.getMonth() + 1 };

    const [selected, setSelected] = useState<Ym>(thisMonth);
    const [filter, setFilter] = useState<Filter>("all");
    const [page, setPage] = useState(1);
    const [hovered, setHovered] = useState<string | null>(null);

    const prev = shiftYm(selected, -1);
    const isCurrent = ymKey(selected) === ymKey(thisMonth);
    const label = `${monthName(selected)} ${selected.y}`;
    const prevLabel = prev.y === selected.y ? monthName(prev) : `${monthName(prev)} ${prev.y}`;

    // The chart reads the same P&L endpoint as the headline, one call per month, so bars and totals always agree.
    const months = Array.from({ length: CHART_MONTHS }, (_, i) => shiftYm(selected, i - (CHART_MONTHS - 1)));
    const q0 = useGetProfitAndLossQuery({ month: months[0].m, year: months[0].y });
    const q1 = useGetProfitAndLossQuery({ month: months[1].m, year: months[1].y });
    const q2 = useGetProfitAndLossQuery({ month: months[2].m, year: months[2].y });
    const q3 = useGetProfitAndLossQuery({ month: months[3].m, year: months[3].y });
    const prevQ = useGetProfitAndLossQuery({ month: months[4].m, year: months[4].y });
    const plQ = useGetProfitAndLossQuery({ month: months[5].m, year: months[5].y });
    const trendQs = [q0, q1, q2, q3, prevQ, plQ];
    const incQ = useGetIncomesQuery();
    const expQ = useGetExpensesQuery();
    const incomes = incQ.data ?? [];
    const expenses = expQ.data ?? [];
    const recordsLoading = incQ.isLoading || expQ.isLoading;
    const trendLoading = trendQs.some((q) => q.isLoading);

    const all = [...trendQs, incQ, expQ];
    const refreshing = all.some((q) => q.isFetching && !q.isLoading);
    const failed = all.some((q) => q.isError);
    const refreshAll = () => all.forEach((q) => q.refetch());

    const goTo = (ym: Ym) => {
        setSelected(ym);
        setPage(1);
    };

    const income = plQ.data?.totalIncome ?? 0;
    const spent = plQ.data?.totalExpenses ?? 0;
    const net = plQ.data?.netBalance ?? income - spent;
    const spentPct = income > 0 ? Math.round((spent / income) * 100) : spent > 0 ? 100 : 0;
    const barPct = Math.min(spentPct, 100);
    // Orange, not yellow, for the warning band: yellow is this portal's accent.
    const meterColor = spentPct >= 100 ? "bg-red-400" : spentPct > 80 ? "bg-orange-400" : "bg-emerald-400";

    const trend = months.map((ym, i) => ({
        ym,
        key: ymKey(ym),
        income: trendQs[i].data?.totalIncome ?? 0,
        expense: trendQs[i].data?.totalExpenses ?? 0,
    }));
    const ceiling = niceCeil(Math.max(...trend.map((t) => Math.max(t.income, t.expense))));

    // Category breakdown and entries for the selected month, from the recorded entries.
    const selKey = ymKey(selected);
    const monthIncomes = incomes.filter((r) => recordYm(r.date) === selKey);
    const monthExpenses = expenses.filter((r) => recordYm(r.date) === selKey);
    const groupBy = (rows: { amount: number; name: string }[]) => {
        const map = new Map<string, number>();
        for (const r of rows) map.set(r.name, (map.get(r.name) ?? 0) + r.amount);
        const sorted = [...map.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
        // Keep the list short: anything past the fifth category folds into "Everything else".
        if (sorted.length <= 6) return sorted;
        return [...sorted.slice(0, 5), { name: "Everything else", amount: sorted.slice(5).reduce((n, r) => n + r.amount, 0) }];
    };
    const incomeCats = groupBy(monthIncomes.map((r) => ({ amount: r.amount, name: r.categoryName || titleCase(r.category) })));
    const expenseCats = groupBy(monthExpenses.map((r) => ({ amount: r.amount, name: r.categoryName || titleCase(r.category) })));
    const monthIncomeTotal = monthIncomes.reduce((n, r) => n + r.amount, 0);
    const monthExpenseTotal = monthExpenses.reduce((n, r) => n + r.amount, 0);

    const allEntries: Txn[] = [
        ...monthIncomes.map((r) => ({
            id: `i-${r.id}`, date: r.date, createdAt: r.createdAt, label: r.source,
            detail: r.categoryName || titleCase(r.category), mode: r.paymentMode, amount: r.amount, kind: "income" as const,
        })),
        ...monthExpenses.map((r) => ({
            id: `e-${r.id}`, date: r.date, createdAt: r.createdAt, label: r.reason,
            detail: r.partyName || r.categoryName || titleCase(r.category), mode: r.paymentMode, amount: r.amount, kind: "expense" as const,
        })),
    ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    const entries = allEntries.filter((t) => filter === "all" || t.kind === filter);
    const { pageCount, current, pageRows } = paginate(entries, page);

    const figures = [
        { label: "Income", value: income, node: <Change curr={income} prev={prevQ.data?.totalIncome ?? 0} prevLabel={prevLabel} upIsGood /> },
        { label: "Expenses", value: spent, node: <Change curr={spent} prev={prevQ.data?.totalExpenses ?? 0} prevLabel={prevLabel} upIsGood={false} /> },
        { label: "Net balance", value: net, node: <Change curr={net} prev={prevQ.data?.netBalance ?? 0} prevLabel={prevLabel} upIsGood money /> },
    ];

    return (
        <MotionConfig reducedMotion="user">
            <div className="max-w-7xl space-y-6">
                <PageHeader
                    title="Analysis"
                    subtitle="Income and expenses for the school, month by month."
                    actions={
                        <>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => goTo(prev)} aria-label={`Show ${prevLabel}`} className={iconBtn}>
                                    <ChevronLeft size={18} aria-hidden="true" />
                                </button>
                                <p aria-live="polite" className="min-w-32 text-center text-sm font-semibold tabular-nums text-gray-900 sm:min-w-36">{label}</p>
                                <button type="button" onClick={() => goTo(shiftYm(selected, 1))} disabled={isCurrent} aria-label="Show next month" className={iconBtn}>
                                    <ChevronRight size={18} aria-hidden="true" />
                                </button>
                                {!isCurrent && (
                                    <button type="button" onClick={() => goTo(thisMonth)} className={`h-9 rounded-lg px-3 text-sm font-medium text-yellow-800 hover:bg-yellow-50 motion-safe:transition-colors ${focusRing}`}>
                                        This month
                                    </button>
                                )}
                            </div>
                            <button type="button" onClick={refreshAll} disabled={refreshing || plQ.isLoading} className={`${secondaryBtn} disabled:cursor-wait`}>
                                <RefreshCw size={16} aria-hidden="true" className={refreshing ? "motion-safe:animate-spin" : ""} />
                                Refresh
                            </button>
                        </>
                    }
                />

                {failed && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        Some figures couldn&apos;t be loaded. Check your connection, then select Refresh.
                    </div>
                )}

                {/* Month summary */}
                <section aria-labelledby="month-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                    <h2 id="month-summary" className="px-4 pt-5 text-base font-semibold sm:px-6">{label}</h2>
                    <div className="px-4 pb-6 pt-4 sm:px-6">
                        <dl className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {figures.map((f) => (
                                <div key={f.label}>
                                    <dt className="text-sm text-slate-300">{f.label}</dt>
                                    <dd className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${f.label === "Net balance" ? (f.value < 0 ? "text-rose-300" : "text-emerald-300") : "text-white"}`}>
                                        {plQ.isLoading ? <Skeleton onDark className="h-8 w-32 align-middle" /> : f.label === "Net balance" ? signedInr(f.value) : inr(f.value)}
                                    </dd>
                                    <dd className="min-h-5">{plQ.isLoading || prevQ.isLoading ? null : f.node}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-6">
                            <div
                                role="meter"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={barPct}
                                aria-label={`Share of ${monthName(selected)} income spent`}
                                className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
                            >
                                {!plQ.isLoading && (
                                    <motion.div
                                        className={`h-full rounded-full ${meterColor} motion-safe:transition-colors motion-safe:duration-500`}
                                        initial={{ width: reduceMotion ? `${barPct}%` : 0 }}
                                        animate={{ width: `${barPct}%` }}
                                        transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT }}
                                    />
                                )}
                            </div>
                            <p className="mt-2 min-h-5 text-sm text-slate-300">
                                {plQ.isLoading
                                    ? null
                                    : income === 0 && spent === 0
                                      ? `Nothing recorded for ${label}.`
                                      : spent > income
                                        ? `Spending was ${inr(spent - income)} more than income in ${monthName(selected)}.`
                                        : `${spentPct}% of ${monthName(selected)}'s income was spent.`}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Six-month trend. Visible overflow so the tooltip can rise above the panel. */}
                <section className="relative z-10 rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                        <h2 className="text-base font-semibold text-gray-900">Last six months</h2>
                        <ul className="flex items-center gap-4 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${INCOME_BAR}`} />
                                Income
                            </li>
                            <li className="flex items-center gap-2">
                                <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${EXPENSE_BAR}`} />
                                Expenses
                            </li>
                        </ul>
                    </div>
                    <div className="px-4 pb-5 pt-6 sm:px-6">
                        {trendLoading ? (
                            <Skeleton className="block h-56 w-full" />
                        ) : (
                            <>
                                <div className="flex">
                                    {/* Y axis */}
                                    <div aria-hidden="true" className="relative h-48 w-12 shrink-0 text-right text-xs tabular-nums text-gray-500 sm:w-14">
                                        {[1, 0.5, 0].map((f) => (
                                            <span key={f} className="absolute right-2 -translate-y-1/2 sm:right-3" style={{ top: `${(1 - f) * 100}%` }}>
                                                {shortInr(ceiling * f)}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative min-w-0 flex-1">
                                        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48">
                                            {[0, 0.5, 1].map((f) => (
                                                <span key={f} className={`absolute inset-x-0 border-t ${f === 1 ? "border-gray-300" : "border-dashed border-gray-200"}`} style={{ top: `${f * 100}%` }} />
                                            ))}
                                        </div>
                                        <div className="relative flex">
                                            {trend.map((t, i) => {
                                                const active = t.key === selKey;
                                                const showYear = i === 0 || t.ym.m === 1;
                                                const tip = hovered === t.key;
                                                return (
                                                    <div key={t.key} className="relative min-w-0 flex-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => goTo(t.ym)}
                                                            onMouseEnter={() => setHovered(t.key)}
                                                            onMouseLeave={() => setHovered(null)}
                                                            onFocus={() => setHovered(t.key)}
                                                            onBlur={() => setHovered(null)}
                                                            aria-pressed={active}
                                                            aria-label={`${monthName(t.ym)} ${t.ym.y}: income ${inr(t.income)}, expenses ${inr(t.expense)}`}
                                                            className={`group relative block w-full rounded-lg ${focusRing}`}
                                                        >
                                                            {active && (
                                                                <motion.span
                                                                    layoutId="accounts-month-band"
                                                                    aria-hidden="true"
                                                                    className="absolute inset-x-0.5 inset-y-0 rounded-lg bg-yellow-50 sm:inset-x-1"
                                                                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}
                                                                />
                                                            )}
                                                            <span aria-hidden="true" className={`absolute inset-x-0.5 inset-y-0 rounded-lg sm:inset-x-1 ${active ? "" : "group-hover:bg-gray-50"}`} />
                                                            <span className="relative flex h-48 items-end justify-center gap-0.5">
                                                                {[
                                                                    { v: t.income, cls: INCOME_BAR },
                                                                    { v: t.expense, cls: EXPENSE_BAR },
                                                                ].map((b, j) => (
                                                                    <motion.span
                                                                        key={j}
                                                                        aria-hidden="true"
                                                                        className={`block w-2.5 origin-bottom rounded-t sm:w-5 ${b.cls}`}
                                                                        style={{ height: b.v > 0 ? `max(2px, ${(b.v / ceiling) * 100}%)` : 0 }}
                                                                        initial={reduceMotion ? false : { scaleY: 0 }}
                                                                        animate={{ scaleY: 1 }}
                                                                        transition={{ duration: 0.6, delay: 0.05 * i, ease: EASE_OUT }}
                                                                    />
                                                                ))}
                                                            </span>
                                                            <span className={`relative block pb-1 pt-2 text-center text-xs tabular-nums ${active ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                                                                {monthName(t.ym, "short")}
                                                                {showYear && <span className="block font-normal text-gray-500">{t.ym.y}</span>}
                                                            </span>
                                                        </button>
                                                        <AnimatePresence>
                                                            {tip && (
                                                                <motion.div
                                                                    role="presentation"
                                                                    initial={{ opacity: 0, y: 4 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0 }}
                                                                    transition={{ duration: 0.12 }}
                                                                    // Sit just above the taller of the two bars (the plot is 12rem tall).
                                                                    style={{ top: `calc(${(1 - Math.max(t.income, t.expense) / ceiling) * 12}rem - 0.5rem)` }}
                                                                    className={`pointer-events-none absolute z-20 w-44 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg ${i === 0 ? "left-0" : i === trend.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                                                                >
                                                                    <p className="font-semibold">{monthName(t.ym)} {t.ym.y}</p>
                                                                    <dl className="mt-1.5 space-y-1 tabular-nums">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <dt className="flex items-center gap-1.5 text-gray-300"><span className={`h-2 w-2 rounded-sm ${INCOME_BAR}`} />Income</dt>
                                                                            <dd>{inr(t.income)}</dd>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <dt className="flex items-center gap-1.5 text-gray-300"><span className={`h-2 w-2 rounded-sm ${EXPENSE_BAR}`} />Expenses</dt>
                                                                            <dd>{inr(t.expense)}</dd>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3 border-t border-white/15 pt-1">
                                                                            <dt className="text-gray-300">Net</dt>
                                                                            <dd>{signedInr(t.income - t.expense)}</dd>
                                                                        </div>
                                                                    </dl>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs text-gray-500">Select a month to see its figures.</p>
                            </>
                        )}
                    </div>
                </section>

                {/* Category breakdown */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel title="Income by category" subtitle="From the income entries recorded this month.">
                        <CategoryBreakdown rows={incomeCats} total={monthIncomeTotal} barClass={INCOME_BAR} loading={recordsLoading} empty={`No income was recorded in ${label}.`} />
                    </Panel>
                    <Panel title="Expenses by category" subtitle="From the expense entries recorded this month.">
                        <CategoryBreakdown rows={expenseCats} total={monthExpenseTotal} barClass={EXPENSE_BAR} loading={recordsLoading} empty={`No expenses were recorded in ${label}.`} />
                    </Panel>
                </div>

                {/* Entries */}
                <Panel
                    title={`Entries in ${monthName(selected)}`}
                    action={
                        <FilterChips
                            label="Show entries"
                            value={filter}
                            layoutId="accounts-analysis-filter"
                            onChange={(f) => {
                                setFilter(f);
                                setPage(1);
                            }}
                            options={[
                                { value: "all", label: "All", count: allEntries.length },
                                { value: "income", label: "Income", count: monthIncomes.length },
                                { value: "expense", label: "Expenses", count: monthExpenses.length },
                            ]}
                        />
                    }
                >
                    {recordsLoading ? (
                        <div className="space-y-3 px-4 pb-5 pt-4 sm:px-6">
                            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-5 w-full" />)}
                        </div>
                    ) : entries.length === 0 ? (
                        <p className="px-4 pb-6 pt-3 text-sm text-gray-500 sm:px-6">
                            {filter === "income" ? `No income was recorded in ${label}.` : filter === "expense" ? `No expenses were recorded in ${label}.` : `Nothing was recorded in ${label}.`}
                        </p>
                    ) : (
                        <>
                            <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                                {pageRows.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={t.kind === "income" ? "/accounts/income" : "/accounts/expenses"}
                                            className={`group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 motion-safe:transition-colors sm:gap-4 sm:px-6 ${focusRing} focus-visible:ring-inset`}
                                        >
                                            <time dateTime={t.date.slice(0, 10)} className="w-12 shrink-0 text-sm tabular-nums text-gray-500 sm:w-14">
                                                {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                            </time>
                                            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-sm ${t.kind === "income" ? INCOME_BAR : EXPENSE_BAR}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900 group-hover:text-yellow-800 motion-safe:transition-colors">{t.label}</p>
                                                <p className="truncate text-xs text-gray-500">
                                                    {t.detail}, paid by {modeLabel(t.mode)}
                                                </p>
                                            </div>
                                            <p className={`shrink-0 text-sm font-semibold tabular-nums ${t.kind === "income" ? "text-emerald-700" : "text-gray-900"}`}>
                                                <span className="sr-only">{t.kind === "income" ? "Income" : "Expense"} </span>
                                                {t.kind === "income" ? "+" : "−"}
                                                {inr(t.amount)}
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <Pager total={entries.length} page={current} pageCount={pageCount} onPage={setPage} />
                        </>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6">
                        <Link href="/accounts/income" className={linkClass}>Open income</Link>
                        <Link href="/accounts/expenses" className={linkClass}>Open expenses</Link>
                    </div>
                </Panel>
            </div>
        </MotionConfig>
    );
}
