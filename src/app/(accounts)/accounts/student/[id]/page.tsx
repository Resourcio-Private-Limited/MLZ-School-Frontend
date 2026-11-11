"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, Bus, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, IndianRupee, RefreshCw, Users, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetClassroomsWithFeesQuery,
    useGetStudentFeesQuery,
    useUpdateExamEligibilityMutation,
    type StudentFeeRecord,
} from "@/redux/api/accountsApi";
import { heroGradient } from "@/components/accounts/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    Panel,
    SearchBox,
    Skeleton,
    errorMessage,
    focusRing,
    initials,
    inr,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/accounts/ui";
import { RecordPaymentDialog } from "../../feeForms";

const payBtn = primaryBtn.replace("h-10", "h-8").replace("px-4", "px-3");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type FeeStatus = "paid" | "partial" | "unpaid";
type Filter = "all" | FeeStatus;

function statusOf(s: StudentFeeRecord): FeeStatus {
    if (s.isPaid) return "paid";
    if (s.paidAmount > 0) return "partial";
    return "unpaid";
}

// Roll numbers are strings; sort "2" before "10", and fall back to text order.
function compareRoll(a: string, b: string) {
    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b, "en-IN", { numeric: true });
}

export default function ClassFeesPage() {
    const params = useParams();
    const classroomId = Array.isArray(params.id) ? params.id[0] : (params.id as string) ?? "";

    const today = new Date();
    const thisMonth = { month: today.getMonth() + 1, year: today.getFullYear() };
    const [period, setPeriod] = useState(thisMonth);
    const isThisMonth = period.month === thisMonth.month && period.year === thisMonth.year;
    // Months that haven't started can't be paid yet, so unpaid there reads "Due" rather than "Unpaid".
    const isPastMonth = period.year < thisMonth.year || (period.year === thisMonth.year && period.month < thisMonth.month);

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [page, setPage] = useState(1);
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [paying, setPaying] = useState<StudentFeeRecord | null>(null);
    const router = useRouter();

    const { data: classrooms = [] } = useGetClassroomsWithFeesQuery();
    const { data: records = [], isLoading, isFetching, isError, refetch } = useGetStudentFeesQuery(
        { classroomId, month: period.month, year: period.year },
        { skip: !classroomId }
    );
    const [updateEligibility] = useUpdateExamEligibilityMutation();

    const classroom = classrooms.find((c) => c.classroomId === classroomId);
    const className = classroom?.className ?? records[0]?.classroomName ?? "Class";

    const sorted = useMemo(() => [...records].sort((a, b) => compareRoll(a.rollNumber ?? "", b.rollNumber ?? "")), [records]);

    const counts = useMemo(() => {
        const c = { all: sorted.length, paid: 0, partial: 0, unpaid: 0 };
        for (const s of sorted) c[statusOf(s)]++;
        return c;
    }, [sorted]);

    const billed = sorted.reduce((sum, s) => sum + (s.totalAmount ?? 0), 0);
    const collected = sorted.reduce((sum, s) => sum + (s.paidAmount ?? 0), 0);
    const share = billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0;

    const q = query.trim().toLowerCase();
    const rows = sorted.filter((s) => (filter === "all" || statusOf(s) === filter) && (!q || s.fullName.toLowerCase().includes(q) || (s.rollNumber ?? "").toLowerCase().includes(q)));
    const { pageCount, current, pageRows } = paginate(rows, page);

    const step = (delta: number) => {
        setPage(1);
        setPeriod((p) => {
            const d = new Date(p.year, p.month - 1 + delta, 1);
            return { month: d.getMonth() + 1, year: d.getFullYear() };
        });
    };

    const toggleEligibility = async (s: StudentFeeRecord) => {
        const next = !s.examEligibility;
        setPendingId(s.studentId);
        try {
            await updateEligibility({ studentId: s.studentId, examEligibility: next }).unwrap();
            toast.success(next ? `${s.fullName} is now eligible for exams.` : `${s.fullName} is no longer eligible for exams.`);
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Exam eligibility wasn't changed. Check your connection and try again."));
        } finally {
            setPendingId(null);
        }
    };

    const periodLabel = `${MONTHS[period.month - 1]} ${period.year}`;
    const detailHref = (s: StudentFeeRecord) => `/accounts/student/${classroomId}/details/${s.studentId}`;

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title={className}
                subtitle="Each student's fees for the month. Open a student for their full year, or record a payment here."
                crumb={{ href: "/accounts", label: "Fee management" }}
                actions={
                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1" role="group" aria-label="Month">
                        <button type="button" onClick={() => step(-1)} aria-label="Previous month" className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 ${focusRing}`}>
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <p aria-live="polite" className="min-w-[8.5rem] text-center text-sm font-medium tabular-nums text-gray-900">{periodLabel}</p>
                        <button
                            type="button"
                            onClick={() => step(1)}
                            disabled={isThisMonth}
                            aria-label="Next month"
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent ${focusRing}`}
                        >
                            <ChevronRight size={18} aria-hidden="true" />
                        </button>
                        {!isThisMonth && (
                            <button type="button" onClick={() => { setPage(1); setPeriod(thisMonth); }} className={`h-8 rounded-md px-2.5 text-sm font-medium text-yellow-800 hover:bg-yellow-50 ${focusRing}`}>
                                This month
                            </button>
                        )}
                    </div>
                }
            />

            {/* Headline: what was billed for the month and how much of it has come in */}
            <section aria-label={`Fees for ${periodLabel}`} className={`overflow-hidden rounded-xl p-5 sm:p-6 ${heroGradient}`}>
                <p className="text-sm text-slate-300">Collected for {periodLabel}</p>
                {isLoading ? (
                    <div className="mt-2 space-y-3">
                        <Skeleton onDark className="h-9 w-56" />
                        <Skeleton onDark className="h-2 w-full" />
                    </div>
                ) : (
                    <>
                        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                            <span className="text-3xl font-bold sm:text-4xl">{inr(collected)}</span>
                            <span className="text-slate-300">of {inr(billed)} billed</span>
                        </p>
                        <div
                            role="meter"
                            aria-label="Share of the month's fees collected"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={share}
                            className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                        >
                            <div className="h-full rounded-full bg-yellow-400 motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${share}%` }} />
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                            {billed === 0 ? "Nothing has been billed for this month yet." : `${share}% collected, ${inr(Math.max(0, billed - collected))} still to come in.`}
                        </p>
                    </>
                )}
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5 lg:grid-cols-4">
                    <Figure label="Students" value={counts.all} loading={isLoading} />
                    <Figure label="Paid" value={counts.paid} loading={isLoading} tone="text-emerald-300" />
                    <Figure label="Part paid" value={counts.partial} loading={isLoading} tone={counts.partial ? "text-orange-300" : undefined} />
                    <Figure label={isPastMonth ? "Unpaid" : "Not paid yet"} value={counts.unpaid} loading={isLoading} tone={counts.unpaid ? (isPastMonth ? "text-rose-300" : "text-orange-300") : undefined} />
                </dl>
            </section>

            <Panel
                title="Students"
                subtitle={isLoading ? "Loading…" : `${counts.all} in this class, in roll order`}
                action={
                    isFetching && !isLoading ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                            <RefreshCw size={14} aria-hidden="true" className="motion-safe:animate-spin" />
                            Updating
                        </span>
                    ) : undefined
                }
            >
                <div className="space-y-3 px-4 pb-4 pt-4 sm:px-6">
                    <SearchBox
                        id="class-fee-search"
                        label="Search students"
                        value={query}
                        onChange={(v) => {
                            setQuery(v);
                            setPage(1);
                        }}
                        placeholder="Search by name or roll number"
                        className="sm:max-w-sm"
                    />
                    <FilterChips<Filter>
                        label="Filter by fee status"
                        value={filter}
                        onChange={(v) => {
                            setFilter(v);
                            setPage(1);
                        }}
                        layoutId="class-fee-filter"
                        options={[
                            { value: "all", label: "All", count: counts.all },
                            { value: "paid", label: "Paid", count: counts.paid },
                            { value: "partial", label: "Part paid", count: counts.partial },
                            { value: "unpaid", label: isPastMonth ? "Unpaid" : "Not paid yet", count: counts.unpaid },
                        ]}
                    />
                </div>

                {isLoading ? (
                    <ul aria-hidden="true" className="divide-y divide-gray-100 border-t border-gray-200">
                        {Array.from({ length: 5 }, (_, i) => (
                            <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : isError ? (
                    <EmptyState
                        icon={<XCircle size={32} />}
                        title="The fee list didn't load"
                        hint="It might be a temporary problem — try again in a moment."
                        action={
                            <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                                Try again
                            </button>
                        }
                    />
                ) : sorted.length === 0 ? (
                    <EmptyState icon={<Users size={32} />} title="No students in this class" hint="Students show here once the principal admits them to this class." />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title="No students match"
                        hint="Try another name or roll number, or show every status."
                        action={
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery("");
                                    setFilter("all");
                                }}
                                className={secondaryBtn}
                            >
                                Clear filters
                            </button>
                        }
                    />
                ) : (
                    <>
                        {/* Cards below xl */}
                        <ul className="divide-y divide-gray-100 border-t border-gray-200 xl:hidden">
                            {pageRows.map((s) => (
                                <li key={s.studentId} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-start gap-3">
                                        <Avatar name={s.fullName} />
                                        <div className="min-w-0 flex-1">
                                            <Link href={detailHref(s)} className={`block truncate rounded-sm font-medium text-gray-900 hover:text-yellow-800 ${focusRing}`}>
                                                {s.fullName}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                Roll <span className="tabular-nums">{s.rollNumber || "not set"}</span>
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <StatusBadge status={statusOf(s)} past={isPastMonth} />
                                                <TransportTag opted={s.transportOpted} />
                                            </div>
                                            <p className="mt-2 text-sm tabular-nums text-gray-700">
                                                <Amount s={s} />
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pl-12">
                                        <EligibilitySwitch s={s} pending={pendingId === s.studentId} onToggle={() => toggleEligibility(s)} />
                                        <div className="flex flex-wrap gap-2">
                                            {!s.isPaid && (
                                                <button type="button" onClick={() => setPaying(s)} aria-label={`Record payment for ${s.fullName}`} className={payBtn}>
                                                    <IndianRupee size={14} aria-hidden="true" />
                                                    Record payment
                                                </button>
                                            )}
                                            <Link href={detailHref(s)} className={`${secondaryBtn} h-8`} aria-label={`View fees for ${s.fullName}`}>
                                                View fees
                                                <ChevronRight size={14} aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Table from xl up */}
                        <div className="relative hidden overflow-x-auto border-t border-gray-200 xl:block">
                            <table className="w-full text-left text-sm">
                                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                                    <tr>
                                        <th scope="col" aria-sort="ascending" className="py-3 pl-6 pr-3 font-medium">Roll</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Student</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Transport</th>
                                        <th scope="col" className="px-3 py-3 text-right font-medium">Billed</th>
                                        <th scope="col" className="px-3 py-3 text-right font-medium">Paid</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Status</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Exams</th>
                                        <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((s) => (
                                        <tr
                                            key={s.studentId}
                                            // A click anywhere on the row opens the student's fees, except on its own controls.
                                            onClick={(e) => !(e.target as HTMLElement).closest("a, button") && router.push(detailHref(s))}
                                            className="cursor-pointer hover:bg-yellow-50/40"
                                        >
                                            <td className="py-3 pl-6 pr-3 tabular-nums text-gray-900">{s.rollNumber || <span className="text-gray-500">None</span>}</td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={s.fullName} />
                                                    <Link href={detailHref(s)} className={`max-w-[14rem] truncate rounded-sm font-medium text-gray-900 hover:text-yellow-800 hover:underline underline-offset-4 2xl:max-w-xs ${focusRing}`}>
                                                        {s.fullName}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <TransportTag opted={s.transportOpted} />
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-900">{inr(s.totalAmount)}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-700">{s.paidAmount > 0 ? inr(s.paidAmount) : <span className="text-gray-500">None</span>}</td>
                                            <td className="px-3 py-3">
                                                <StatusBadge status={statusOf(s)} past={isPastMonth} />
                                            </td>
                                            <td className="px-3 py-3">
                                                <EligibilitySwitch s={s} pending={pendingId === s.studentId} onToggle={() => toggleEligibility(s)} />
                                            </td>
                                            <td className="py-3 pl-3 pr-6">
                                                <div className="flex justify-end gap-2">
                                                    {!s.isPaid && (
                                                        <button type="button" onClick={() => setPaying(s)} aria-label={`Record payment for ${s.fullName}`} className={`${payBtn} whitespace-nowrap`}>
                                                            <IndianRupee size={14} aria-hidden="true" />
                                                            Record payment
                                                        </button>
                                                    )}
                                                    <Link href={detailHref(s)} className={`${secondaryBtn} h-8 whitespace-nowrap`} aria-label={`View fees for ${s.fullName}`}>
                                                        View fees
                                                        <ChevronRight size={14} aria-hidden="true" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </Panel>

            <RecordPaymentDialog
                student={paying}
                classroomId={classroomId}
                month={period.month}
                year={period.year}
                onClose={() => setPaying(null)}
                onDone={() => {
                    setPaying(null);
                    refetch();
                }}
            />
        </div>
    );
}

function Figure({ label, value, loading, tone }: { label: string; value: number; loading: boolean; tone?: string }) {
    return (
        <div>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className={`mt-0.5 text-2xl font-semibold tabular-nums ${tone ?? "text-white"}`}>{loading ? <Skeleton onDark className="h-7 w-10" /> : value.toLocaleString("en-IN")}</dd>
        </div>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-xs font-semibold text-yellow-800 ring-1 ring-yellow-100">
            {initials(name)}
        </span>
    );
}

function Amount({ s }: { s: StudentFeeRecord }) {
    const status = statusOf(s);
    if (status === "paid") return <>{inr(s.paidAmount || s.totalAmount)} paid</>;
    if (status === "partial") return <>{inr(s.paidAmount)} of {inr(s.totalAmount)} paid</>;
    return <>{inr(s.totalAmount)} billed</>;
}

/** Paid, part paid or not paid, always with an icon and a word. */
function StatusBadge({ status, past }: { status: FeeStatus; past: boolean }) {
    if (status === "paid")
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                <CheckCircle2 size={13} aria-hidden="true" />
                Paid
            </span>
        );
    if (status === "partial")
        return (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-100">
                <CircleDashed size={13} aria-hidden="true" />
                Part paid
            </span>
        );
    return past ? (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-100">
            <XCircle size={13} aria-hidden="true" />
            Unpaid
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-100">
            <AlertTriangle size={13} aria-hidden="true" />
            Not paid yet
        </span>
    );
}

function TransportTag({ opted }: { opted: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${opted ? "bg-gray-100 text-gray-700" : "text-gray-500"}`}>
            <Bus size={13} aria-hidden="true" />
            {opted ? "Transport" : "No transport"}
        </span>
    );
}

function EligibilitySwitch({ s, pending, onToggle }: { s: StudentFeeRecord; pending: boolean; onToggle: () => void }) {
    const on = s.examEligibility;
    return (
        <span className="inline-flex items-center gap-2">
            <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Exam eligibility for ${s.fullName}`}
                disabled={pending}
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full motion-safe:transition-colors disabled:cursor-wait disabled:opacity-60 ${focusRing} focus-visible:ring-offset-2 ${on ? "bg-emerald-600" : "bg-gray-300"}`}
            >
                <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
            </button>
            <span className={`whitespace-nowrap text-sm ${on ? "text-gray-700" : "text-red-700"}`}>{on ? "Eligible" : "Not eligible"}</span>
        </span>
    );
}
