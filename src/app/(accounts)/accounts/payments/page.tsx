"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { useGetLatestPaymentsQuery } from "@/redux/api/accountsApi";
import { heroGradient } from "@/components/accounts/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    Panel,
    SearchBox,
    Skeleton,
    clock,
    dayHeading,
    inr,
    linkClass,
    paginate,
    secondaryBtn,
} from "@/components/accounts/ui";

type Payment = NonNullable<ReturnType<typeof useGetLatestPaymentsQuery>["data"]>[number];

const NO_MODE = "NONE";
const modeKey = (p: Payment) => p.paymentMode?.toUpperCase() || NO_MODE;
function modeName(key: string) {
    if (key === NO_MODE) return "Not recorded";
    if (key === "NEFT" || key === "UPI") return key;
    return key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");
}

/** Groups an already-sorted page of payments under day headings. */
function byDay(rows: Payment[]) {
    const groups: { label: string; items: Payment[] }[] = [];
    for (const p of rows) {
        const label = dayHeading(p.paidAt);
        const last = groups[groups.length - 1];
        if (last?.label === label) last.items.push(p);
        else groups.push({ label, items: [p] });
    }
    return groups;
}

function ModeBadge({ mode }: { mode: string }) {
    return (
        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${mode === NO_MODE ? "bg-gray-100 text-gray-500" : "bg-gray-100 text-gray-700"}`}>
            {modeName(mode)}
        </span>
    );
}

function ReceiptLink({ p }: { p: Payment }) {
    if (!p.receiptUrl) return <span className="text-sm text-gray-500">No receipt</span>;
    return (
        <a href={p.receiptUrl} target="_blank" rel="noreferrer" className={`${linkClass} inline-flex items-center gap-1`}>
            Receipt
            <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only">for {p.student.fullName} (opens in a new tab)</span>
        </a>
    );
}

export default function LatestPaymentsPage() {
    const { data: payments = [], isLoading, isError, isFetching, refetch } = useGetLatestPaymentsQuery();
    const [mode, setMode] = useState("ALL");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    const sorted = [...payments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));

    // Headline figures cover every payment in the window, whatever the filters.
    const total = sorted.reduce((n, p) => n + p.amountPaid, 0);
    const annual = sorted.reduce((n, p) => n + (p.annualContribution || 0), 0);
    const students = new Set(sorted.map((p) => p.student.id)).size;
    const modeTotals = new Map<string, { amount: number; count: number }>();
    for (const p of sorted) {
        const k = modeKey(p);
        const cur = modeTotals.get(k) ?? { amount: 0, count: 0 };
        modeTotals.set(k, { amount: cur.amount + p.amountPaid, count: cur.count + 1 });
    }
    const modes = [...modeTotals.entries()].sort((a, b) => b[1].amount - a[1].amount);

    const q = query.trim().toLowerCase();
    const rows = sorted.filter(
        (p) =>
            (mode === "ALL" || modeKey(p) === mode) &&
            (!q ||
                p.student.fullName.toLowerCase().includes(q) ||
                p.student.admissionNumber.toLowerCase().includes(q) ||
                p.student.classroomName.toLowerCase().includes(q) ||
                (p.razorpayPaymentId ?? "").toLowerCase().includes(q))
    );
    const { pageCount, current, pageRows } = paginate(rows, page);
    const groups = byDay(pageRows);

    const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
        set(v);
        setPage(1);
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Latest payments"
                subtitle="Fee payments received in the last 10 days."
                actions={
                    <button type="button" onClick={() => refetch()} disabled={isFetching} className={`${secondaryBtn} disabled:cursor-wait`}>
                        <RefreshCw size={16} aria-hidden="true" className={isFetching && !isLoading ? "motion-safe:animate-spin" : ""} />
                        Refresh
                    </button>
                }
            />

            <section aria-labelledby="payments-summary" className={`overflow-hidden rounded-xl p-4 shadow-sm sm:p-6 ${heroGradient}`}>
                <h2 id="payments-summary" className="text-base font-semibold">Last 10 days</h2>
                <dl className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm text-slate-300">Received</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{isLoading ? <Skeleton onDark className="h-8 w-36 align-middle" /> : inr(total)}</dd>
                        <dd className="mt-1 min-h-5 text-sm text-slate-300">{!isLoading && annual > 0 && `Includes ${inr(annual)} of annual charges`}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Payments</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{isLoading ? <Skeleton onDark className="h-8 w-16 align-middle" /> : sorted.length.toLocaleString("en-IN")}</dd>
                        <dd className="mt-1 min-h-5 text-sm text-slate-300">{!isLoading && sorted.length > 0 && `From ${students.toLocaleString("en-IN")} ${students === 1 ? "student" : "students"}`}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">By payment mode</dt>
                        <dd className="mt-2">
                            {isLoading ? (
                                <Skeleton onDark className="h-12 w-full" />
                            ) : modes.length === 0 ? (
                                <span className="text-sm text-slate-300">No payments yet</span>
                            ) : (
                                <ul className="space-y-1.5 text-sm">
                                    {modes.map(([k, v]) => (
                                        <li key={k} className="flex items-baseline justify-between gap-4">
                                            <span className="text-slate-200">
                                                {modeName(k)} <span className="text-slate-400 tabular-nums">({v.count})</span>
                                            </span>
                                            <span className="font-medium tabular-nums">{inr(v.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </dd>
                    </div>
                </dl>
            </section>

            <Panel title="Payments" subtitle="Newest first, grouped by day.">
                <div className="space-y-3 px-4 pb-4 pt-4 sm:px-6">
                    <SearchBox id="payment-search" label="Search payments" value={query} onChange={resetPage(setQuery)} placeholder="Search student, admission no. or class" className="max-w-md" />
                    <FilterChips
                        label="Filter by payment mode"
                        value={mode}
                        layoutId="payments-mode"
                        onChange={resetPage(setMode)}
                        options={[{ value: "ALL", label: "All", count: sorted.length }, ...modes.map(([k, v]) => ({ value: k, label: modeName(k), count: v.count }))]}
                    />
                </div>

                {isLoading ? (
                    <div className="space-y-3 border-t border-gray-200 px-4 py-5 sm:px-6">
                        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="block h-10 w-full" />)}
                    </div>
                ) : isError ? (
                    <EmptyState
                        icon={<CreditCard size={36} />}
                        title="Payments couldn't be loaded"
                        hint="Check your connection, then try again."
                        action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                    />
                ) : sorted.length === 0 ? (
                    <EmptyState icon={<CreditCard size={36} />} title="No payments in the last 10 days" hint="Payments made online or recorded against a student's fees will appear here." />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title="No payments match"
                        hint="Try another name or admission number, or show every payment mode."
                        action={
                            <button type="button" onClick={() => { setQuery(""); setMode("ALL"); setPage(1); }} className={secondaryBtn}>
                                Clear filters
                            </button>
                        }
                    />
                ) : (
                    <>
                        {/* Cards below xl */}
                        <div className="border-t border-gray-200 xl:hidden">
                            {groups.map((g) => (
                                <section key={g.label} aria-label={g.label}>
                                    <h3 className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 sm:px-6">{g.label}</h3>
                                    <ul className="divide-y divide-gray-100">
                                        {g.items.map((p) => (
                                            <li key={p.id} className="px-4 py-4 sm:px-6">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-gray-900">{p.student.fullName}</p>
                                                        <p className="truncate text-sm text-gray-500">
                                                            {p.student.classroomName}, {p.student.admissionNumber}
                                                        </p>
                                                    </div>
                                                    <p className="shrink-0 text-base font-semibold tabular-nums text-gray-900">{inr(p.amountPaid)}</p>
                                                </div>
                                                {p.monthsPaid && <p className="mt-1 text-sm text-gray-600">For {p.monthsPaid}</p>}
                                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                                                    <span className="text-sm tabular-nums text-gray-500">{clock(p.paidAt)}</span>
                                                    <ModeBadge mode={modeKey(p)} />
                                                    {p.annualContribution > 0 && <span className="text-sm tabular-nums text-gray-500">Annual {inr(p.annualContribution)}</span>}
                                                    <span className="ml-auto">
                                                        <ReceiptLink p={p} />
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                        </div>

                        {/* Table from xl up */}
                        <div className="relative hidden overflow-x-auto border-t border-gray-200 xl:block">
                            <table className="w-full text-left text-sm">
                                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                                    <tr>
                                        <th scope="col" className="py-3 pl-6 pr-3 font-medium">Time</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Student</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Class and months</th>
                                        <th scope="col" className="px-3 py-3 text-right font-medium">Annual charges</th>
                                        <th scope="col" className="px-3 py-3 text-right font-medium">Amount</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Mode</th>
                                        <th scope="col" className="py-3 pl-3 pr-6 font-medium">Receipt</th>
                                    </tr>
                                </thead>
                                {groups.map((g) => (
                                    <tbody key={g.label} className="divide-y divide-gray-100 border-t border-gray-100">
                                        <tr>
                                            <th scope="colgroup" colSpan={7} className="bg-white px-6 pb-1 pt-4 text-left text-xs font-medium text-gray-500">
                                                {g.label}
                                            </th>
                                        </tr>
                                        {g.items.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/70">
                                                <td className="whitespace-nowrap py-3 pl-6 pr-3 tabular-nums text-gray-600">{clock(p.paidAt)}</td>
                                                <td className="px-3 py-3">
                                                    <p className="font-medium text-gray-900">{p.student.fullName}</p>
                                                    <p className="tabular-nums text-gray-500">{p.student.admissionNumber}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="text-gray-700">{p.student.classroomName}</p>
                                                    {p.monthsPaid && <p className="text-gray-500">{p.monthsPaid}</p>}
                                                </td>
                                                <td className="px-3 py-3 text-right tabular-nums text-gray-700">{p.annualContribution > 0 ? inr(p.annualContribution) : <span className="text-gray-500">None</span>}</td>
                                                <td className="px-3 py-3 text-right font-semibold tabular-nums text-gray-900">{inr(p.amountPaid)}</td>
                                                <td className="px-3 py-3">
                                                    <ModeBadge mode={modeKey(p)} />
                                                </td>
                                                <td className="py-3 pl-3 pr-6">
                                                    <ReceiptLink p={p} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))}
                            </table>
                        </div>

                        <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </Panel>
            <p className="sr-only" aria-live="polite">
                {!isLoading && `${rows.length} payments shown`}
            </p>
        </div>
    );
}
