"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, Check, CheckCircle2, ChevronRight, CircleDashed, CirclePlus, School, Settings, UserSearch, Users, XCircle } from "lucide-react";
import {
    useApplyClassroomOtherFeesMutation,
    useGetClassroomsWithFeesQuery,
    useSearchStudentsFeesQuery,
    useUpsertClassroomFeesMutation,
    type ClassroomWithFees,
    type StudentFeeRecord,
} from "@/redux/api/accountsApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { heroGradient } from "@/components/accounts/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    SearchBox,
    Skeleton,
    errorMessage,
    focusRing,
    getPageItems,
    initials,
    inputClass,
    inr,
    primaryBtn,
    secondaryBtn,
} from "@/components/accounts/ui";
import { MoneyInput, MonthStepper, errorClass, hintClass, labelClass, monthLabel, parseMoney } from "./feeForms";

// ─── Levels ────────────────────────────────────────────────────────

const LEVELS = ["Pre-primary", "Primary", "Middle school", "High school", "Senior secondary", "Other"] as const;
type Level = (typeof LEVELS)[number];
type LevelFilter = "all" | Level;

function levelOf(grade: string): Level {
    const g = grade.trim().toLowerCase();
    if (/^(nursery|pre|kg|lkg|ukg)/.test(g)) return "Pre-primary";
    const num = parseInt(g.match(/\d+/)?.[0] ?? "", 10);
    if (Number.isNaN(num)) return "Other";
    if (num <= 5) return "Primary";
    if (num <= 8) return "Middle school";
    if (num <= 10) return "High school";
    return "Senior secondary";
}

const byName = (a: ClassroomWithFees, b: ClassroomWithFees) => a.className.localeCompare(b.className, "en-IN", { numeric: true });
const feesNotSet = (c: ClassroomWithFees) => !(c.tuitionFees > 0);
const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const longDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const shortDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// In "All levels" each level shows a preview; picking a level shows it in full, a page at a time.
const GROUP_PREVIEW = 6;
const PER_PAGE = 12;

const secondaryLg = secondaryBtn.replace("h-9", "h-10");
const iconBtn = `relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 motion-safe:transition-colors ${focusRing}`;

function NotSetBadge() {
    return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-100">
            <AlertTriangle size={13} aria-hidden="true" />
            Fees not set
        </span>
    );
}

type Actions = { onSettings: () => void; onOtherFees: () => void };

const classHref = (c: ClassroomWithFees) => `/accounts/student/${c.classroomId}`;

function ClassActions({ c, onSettings, onOtherFees }: Actions & { c: ClassroomWithFees }) {
    return (
        <div className="relative z-10 flex shrink-0 items-center gap-1">
            <Tooltip content="Fee settings" side="top">
                <button type="button" onClick={onSettings} aria-label={`Fee settings for ${c.className}`} className={iconBtn}>
                    <Settings size={17} aria-hidden="true" />
                </button>
            </Tooltip>
            <Tooltip content="Add other fees for the class" side="top">
                <button type="button" onClick={onOtherFees} aria-label={`Add other fees for ${c.className}`} className={iconBtn}>
                    <CirclePlus size={17} aria-hidden="true" />
                </button>
            </Tooltip>
            {/* The way into a class: its students, their fees, and Record payment. */}
            <Link href={classHref(c)} aria-label={`Open ${c.className}`} className={`${secondaryBtn} ml-1 whitespace-nowrap`}>
                Open class
                <ChevronRight size={15} aria-hidden="true" />
            </Link>
        </div>
    );
}

function ClassCard({ c, ...actions }: Actions & { c: ClassroomWithFees }) {
    const notSet = feesNotSet(c);
    return (
        <div className="relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 motion-safe:transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">
                        {/* The link stretches over the whole card; the buttons sit above it. */}
                        <Link href={classHref(c)} className={`rounded-sm after:absolute after:inset-0 after:rounded-xl hover:text-yellow-800 ${focusRing}`}>
                            {c.className}
                        </Link>
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm tabular-nums text-gray-500">
                        <Users size={14} aria-hidden="true" />
                        {c.totalStudents.toLocaleString("en-IN")} {c.totalStudents === 1 ? "student" : "students"}
                    </p>
                </div>
                {notSet && <NotSetBadge />}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-sm">
                <div>
                    <dt className="text-gray-500">Tuition</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-gray-900">{c.tuitionFees > 0 ? inr(c.tuitionFees) : <span className="text-gray-400">Not set</span>}</dd>
                </div>
                <div>
                    <dt className="text-gray-500">Late fee</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-gray-900">{inr(c.lateFees)}</dd>
                </div>
                <div>
                    <dt className="text-gray-500">Annual</dt>
                    <dd className="mt-0.5 font-medium tabular-nums text-gray-900">{inr(c.annualCharges)}</dd>
                </div>
            </dl>
            <p className="mt-3 text-sm text-gray-500">
                {c.annualFeeExpiryDate ? <>Annual fee until <span className="text-gray-700">{shortDate(c.annualFeeExpiryDate)}</span></> : "No annual fee end date"}
            </p>
            <div className="mt-auto flex justify-end pt-4">
                <ClassActions c={c} {...actions} />
            </div>
        </div>
    );
}

function ClassTable({ rows, actionsFor }: { rows: ClassroomWithFees[]; actionsFor: (c: ClassroomWithFees) => Actions }) {
    const router = useRouter();
    return (
        <div className="relative hidden overflow-x-auto rounded-xl border border-gray-200 bg-white xl:block">
            <table className="w-full text-left text-sm">
                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                    <tr>
                        <th scope="col" className="py-3 pl-6 pr-4 font-medium">Class</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Students</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Tuition a month</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Late fee</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Annual charges</th>
                        <th scope="col" className="px-4 py-3 font-medium">Annual fee until</th>
                        <th scope="col" className="py-3 pl-4 pr-6 text-right font-medium">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((c) => (
                        <tr
                            key={c.classroomId}
                            // A click anywhere on the row opens the class, except on its own buttons and links.
                            onClick={(e) => !(e.target as HTMLElement).closest("a, button") && router.push(classHref(c))}
                            className="cursor-pointer hover:bg-yellow-50/40"
                        >
                            <td className="py-3 pl-6 pr-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link href={classHref(c)} className={`rounded-sm font-medium text-gray-900 hover:text-yellow-800 hover:underline underline-offset-4 ${focusRing}`}>
                                        {c.className}
                                    </Link>
                                    {feesNotSet(c) && <NotSetBadge />}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{c.totalStudents.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-900">{c.tuitionFees > 0 ? inr(c.tuitionFees) : <span className="text-gray-400">Not set</span>}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{inr(c.lateFees)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">{inr(c.annualCharges)}</td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{c.annualFeeExpiryDate ? shortDate(c.annualFeeExpiryDate) : <span className="text-gray-400">Not set</span>}</td>
                            <td className="py-3 pl-4 pr-6">
                                <div className="flex justify-end">
                                    <ClassActions c={c} {...actionsFor(c)} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CardPager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (n: number) => void }) {
    if (pageCount <= 1) return null;
    const btn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 motion-safe:transition ${focusRing}`;
    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className={btn}>
                Prev
            </button>
            {getPageItems(page, pageCount).map((n, i) =>
                n === "gap" ? (
                    <span key={`gap-${i}`} aria-hidden="true" className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">
                        &hellip;
                    </span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onPage(n)}
                        aria-label={`Page ${n}`}
                        aria-current={page === n ? "page" : undefined}
                        className={`h-9 w-9 rounded-lg border text-sm font-medium tabular-nums motion-safe:transition ${focusRing} ${page === n ? "border-yellow-400 bg-yellow-400 text-yellow-950" : "border-gray-300 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800"}`}
                    >
                        {n}
                    </button>
                )
            )}
            <button type="button" onClick={() => onPage(page + 1)} disabled={page === pageCount} className={btn}>
                Next
            </button>
        </nav>
    );
}

// ─── Fee settings dialog ───────────────────────────────────────────

function FeeSettingsDialog({ classroom, onClose, onSaved }: { classroom: ClassroomWithFees | null; onClose: () => void; onSaved: () => void }) {
    const titleId = useId();
    return (
        <Dialog open={!!classroom} onClose={onClose} labelledBy={titleId} className="sm:max-w-lg">
            {classroom && <FeeSettingsForm key={classroom.classroomId} classroom={classroom} titleId={titleId} onClose={onClose} onSaved={onSaved} />}
        </Dialog>
    );
}

function FeeSettingsForm({ classroom, titleId, onClose, onSaved }: { classroom: ClassroomWithFees; titleId: string; onClose: () => void; onSaved: () => void }) {
    const id = useId();
    const [tuition, setTuition] = useState(classroom.tuitionFees ? String(classroom.tuitionFees) : "");
    const [late, setLate] = useState(classroom.lateFees ? String(classroom.lateFees) : "");
    const [annual, setAnnual] = useState(classroom.annualCharges ? String(classroom.annualCharges) : "");
    const [expiry, setExpiry] = useState(dateOnly(classroom.annualFeeExpiryDate));
    const [touched, setTouched] = useState(false);
    const [upsert, { isLoading }] = useUpsertClassroomFeesMutation();

    const t = parseMoney(tuition);
    const l = parseMoney(late);
    const a = parseMoney(annual);
    const tuitionError = t === null ? "Enter an amount of ₹0 or more." : t === 0 ? "Enter the monthly tuition fee." : null;
    const lateError = l === null ? "Enter an amount of ₹0 or more." : null;
    const annualError = a === null ? "Enter an amount of ₹0 or more." : null;
    const show = (e: string | null) => touched && e;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (tuitionError || lateError || annualError || t === null || l === null || a === null) return;
        try {
            await upsert({ classroomId: classroom.classroomId, tuitionFees: t, lateFees: l, annualCharges: a, annualFeeExpiryDate: expiry || undefined }).unwrap();
            toast.success(`Fee settings saved for ${classroom.className}.`);
            onSaved();
            onClose();
        } catch (err) {
            toast.error(errorMessage(err, "The fee settings weren't saved. Check your connection and try again."));
        }
    };

    const field = (key: string, label: string, value: string, set: (v: string) => void, error: string | null, hint: string, autoFocus?: boolean) => (
        <div>
            <label htmlFor={`${id}-${key}`} className={labelClass}>{label}</label>
            <MoneyInput id={`${id}-${key}`} value={value} onChange={set} invalid={!!show(error)} describedBy={`${id}-${key}-hint`} autoFocus={autoFocus} />
            <p id={`${id}-${key}-hint`} className={show(error) ? errorClass : hintClass}>{show(error) || hint}</p>
        </div>
    );

    return (
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <DialogHeader id={titleId} title="Fee settings" subtitle={`${classroom.className}, ${classroom.totalStudents.toLocaleString("en-IN")} students`} onClose={onClose} accent="yellow" />
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                {field("tuition", "Tuition fee a month", tuition, setTuition, tuitionError, "Charged to every student in the class each month.", true)}
                <div className="grid gap-5 sm:grid-cols-2">
                    {field("late", "Late fee", late, setLate, lateError, "Added to unpaid months after the due date.")}
                    {field("annual", "Annual charges", annual, setAnnual, annualError, "Charged once in the academic year.")}
                </div>
                <div>
                    <label htmlFor={`${id}-expiry`} className={labelClass}>
                        Annual fee end date <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <input id={`${id}-expiry`} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} aria-describedby={`${id}-expiry-hint`} className={`${inputClass} mt-1.5 tabular-nums`} />
                    <p id={`${id}-expiry-hint`} className={hintClass}>
                        {expiry ? `Annual charges apply until ${longDate(expiry)}.` : "Leave it empty if the annual charges don't have an end date."}
                    </p>
                </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={onClose} className={secondaryLg}>Cancel</button>
                <button type="submit" disabled={isLoading} className={primaryBtn}>{isLoading ? "Saving…" : "Save fee settings"}</button>
            </div>
        </form>
    );
}

// ─── Class-wide other fees dialog ──────────────────────────────────

function OtherFeesDialog({ classroom, onClose }: { classroom: ClassroomWithFees | null; onClose: () => void }) {
    const titleId = useId();
    return (
        <Dialog open={!!classroom} onClose={onClose} labelledBy={titleId} className="sm:max-w-lg">
            {classroom && <OtherFeesForm key={classroom.classroomId} classroom={classroom} titleId={titleId} onClose={onClose} />}
        </Dialog>
    );
}

function OtherFeesForm({ classroom, titleId, onClose }: { classroom: ClassroomWithFees; titleId: string; onClose: () => void }) {
    const id = useId();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [amount, setAmount] = useState("");
    const [remarks, setRemarks] = useState("");
    const [touched, setTouched] = useState(false);
    const [step, setStep] = useState<"form" | "confirm">("form");
    const [apply, { isLoading }] = useApplyClassroomOtherFeesMutation();

    const n = parseMoney(amount);
    const error = n === null ? "Enter an amount in rupees." : n <= 0 ? "Enter an amount above ₹0." : null;
    const period = monthLabel(month, year);

    const review = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!error) setStep("confirm");
    };

    const confirm = async () => {
        if (n === null) return;
        try {
            const res = await apply({ classroomId: classroom.classroomId, month, year, otherFees: n, otherFeesRemarks: remarks.trim() || undefined }).unwrap();
            const applied = `${inr(n)} other fees added for ${res.appliedCount} ${res.appliedCount === 1 ? "student" : "students"}.`;
            const skipped = res.skippedPaidCount ? ` ${res.skippedPaidCount} had already paid, so they were skipped.` : "";
            toast.success(applied + skipped);
            onClose();
        } catch (err) {
            toast.error(errorMessage(err, "The other fees weren't added. Check your connection and try again."));
        }
    };

    if (step === "confirm")
        return (
            <>
                <DialogHeader id={titleId} title="Add other fees?" subtitle={`${classroom.className}, ${period}`} onClose={onClose} accent="yellow" />
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                    <p className="text-sm text-gray-700">
                        <span className="font-semibold tabular-nums text-gray-900">{inr(n ?? 0)}</span>
                        {remarks.trim() ? <> for {remarks.trim()}</> : null} will be added to the {period} fees of every student in {classroom.className} who hasn&apos;t paid for that month.
                    </p>
                    <p className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                        <span>
                            This can reach up to {classroom.totalStudents.toLocaleString("en-IN")} students at once. Students who have already paid are skipped.
                        </span>
                    </p>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <button type="button" onClick={() => setStep("form")} className={secondaryLg}>Back</button>
                    <button type="button" onClick={confirm} disabled={isLoading} className={primaryBtn}>{isLoading ? "Adding…" : "Add other fees"}</button>
                </div>
            </>
        );

    return (
        <form onSubmit={review} noValidate className="flex min-h-0 flex-1 flex-col">
            <DialogHeader id={titleId} title="Other fees for the class" subtitle={classroom.className} onClose={onClose} accent="yellow" />
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-600">Add the same one-off charge to every student who hasn&apos;t paid for the month, such as an activity or exam fee.</p>
                <div>
                    <p className={labelClass}>Fee month</p>
                    <div className="mt-1.5">
                        <MonthStepper month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} label="Fee month" />
                    </div>
                </div>
                <div>
                    <label htmlFor={`${id}-amount`} className={labelClass}>Amount for each student</label>
                    <MoneyInput id={`${id}-amount`} value={amount} onChange={setAmount} invalid={touched && !!error} describedBy={`${id}-amount-hint`} autoFocus />
                    <p id={`${id}-amount-hint`} className={touched && error ? errorClass : hintClass}>{touched && error ? error : "Added on top of tuition for that month."}</p>
                </div>
                <div>
                    <label htmlFor={`${id}-remarks`} className={labelClass}>
                        What it&apos;s for <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <input id={`${id}-remarks`} type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="For example, annual activity fee" maxLength={120} className={`${inputClass} mt-1.5`} />
                    <p className={hintClass}>Shown on each student&apos;s fees for the month.</p>
                </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={onClose} className={secondaryLg}>Cancel</button>
                <button type="submit" className={primaryBtn}>Review</button>
            </div>
        </form>
    );
}

// ─── Page ──────────────────────────────────────────────────────────

export default function FeeManagementPage() {
    const { data: classrooms = [], isLoading, isError, refetch } = useGetClassroomsWithFeesQuery();

    const [level, setLevel] = useState<LevelFilter>("all");
    const [query, setQuery] = useState("");
    const [onlyNotSet, setOnlyNotSet] = useState(false);
    const [page, setPage] = useState(1);
    const [settingsFor, setSettingsFor] = useState<ClassroomWithFees | null>(null);
    const [otherFeesFor, setOtherFeesFor] = useState<ClassroomWithFees | null>(null);

    const totalStudents = classrooms.reduce((sum, c) => sum + (c.totalStudents ?? 0), 0);
    const notSet = classrooms.filter(feesNotSet);

    // The soonest annual-fee end date from today on, and how many classes share it.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const upcoming = classrooms.map((c) => dateOnly(c.annualFeeExpiryDate)).filter((d) => d && d >= today).sort();
    const nextExpiry = upcoming[0];
    const nextExpiryCount = upcoming.filter((d) => d === nextExpiry).length;

    const q = query.trim().toLowerCase();
    const matches = classrooms
        .filter((c) => !onlyNotSet || feesNotSet(c))
        .filter((c) => !q || c.className.toLowerCase().includes(q) || `${c.grade}${c.section}`.toLowerCase().includes(q.replace(/\s+/g, "")))
        .sort(byName);
    const levelCounts = new Map<Level, number>();
    for (const c of matches) levelCounts.set(levelOf(c.grade), (levelCounts.get(levelOf(c.grade)) ?? 0) + 1);
    const levelOptions: { value: LevelFilter; label: string; count?: number }[] = [
        { value: "all", label: "All levels", count: matches.length },
        ...LEVELS.filter((l) => levelCounts.has(l) || l === level).map((l) => ({ value: l as LevelFilter, label: l, count: levelCounts.get(l) ?? 0 })),
    ];

    const changeFilter = (fn: () => void) => {
        fn();
        setPage(1);
    };

    const levelRows = level === "all" ? [] : matches.filter((c) => levelOf(c.grade) === level);
    const pageCount = Math.max(1, Math.ceil(levelRows.length / PER_PAGE));
    const current = Math.min(page, pageCount);
    const pageRows = levelRows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

    const actionsFor = (c: ClassroomWithFees): Actions => ({
        onSettings: () => setSettingsFor(c),
        onOtherFees: () => setOtherFeesFor(c),
    });

    // Cards below xl, a table from xl up.
    const list = (rows: ClassroomWithFees[]) => (
        <>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:hidden">
                {rows.map((c) => (
                    <li key={c.classroomId}>
                        <ClassCard c={c} {...actionsFor(c)} />
                    </li>
                ))}
            </ul>
            <ClassTable rows={rows} actionsFor={actionsFor} />
        </>
    );

    const figure = "mt-1 text-2xl font-semibold tracking-tight tabular-nums";

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Fee management"
                subtitle={`Find a student, or open a class to see its students and record payments. ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
            />

            <StudentFinder />

            <section aria-labelledby="fees-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <h2 id="fees-summary" className="px-4 pt-5 text-base font-semibold sm:px-6">Fees at a glance</h2>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                    <div>
                        <dt className="text-sm text-slate-300">Classes</dt>
                        <dd className={figure}>{isLoading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : classrooms.length.toLocaleString("en-IN")}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Students</dt>
                        <dd className={figure}>{isLoading ? <Skeleton onDark className="h-7 w-16 align-middle" /> : totalStudents.toLocaleString("en-IN")}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Classes without a tuition fee</dt>
                        <dd className={figure}>
                            {isLoading ? (
                                <Skeleton onDark className="h-7 w-10 align-middle" />
                            ) : notSet.length === 0 ? (
                                <span className="text-emerald-300">None</span>
                            ) : (
                                <>
                                    <span className="text-rose-300">{notSet.length.toLocaleString("en-IN")}</span>
                                    <button
                                        type="button"
                                        onClick={() => changeFilter(() => { setOnlyNotSet(true); setLevel("all"); })}
                                        className="ml-3 rounded-sm align-middle text-sm font-medium text-yellow-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    >
                                        Show them
                                    </button>
                                </>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Next annual fee end date</dt>
                        <dd className={figure}>
                            {isLoading ? (
                                <Skeleton onDark className="h-7 w-28 align-middle" />
                            ) : nextExpiry ? (
                                <>
                                    <span className="text-xl">{shortDate(nextExpiry)}</span>
                                    <span className="mt-0.5 block text-sm font-normal text-slate-400">
                                        for {nextExpiryCount} {nextExpiryCount === 1 ? "class" : "classes"}
                                    </span>
                                </>
                            ) : (
                                <span className="text-xl text-slate-400">None set</span>
                            )}
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="classes-heading" className="space-y-4">
                <div>
                    <h2 id="classes-heading" className="text-base font-semibold text-gray-900">Classes</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Open a class to see each student&apos;s fees for the month and record payments. The gear sets the class&apos;s fees.</p>
                </div>

                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchBox id="fee-class-search" label="Search classes" value={query} onChange={(v) => changeFilter(() => setQuery(v))} placeholder="Search by class, for example 7B" className="sm:max-w-sm sm:flex-1" />
                        <button
                            type="button"
                            aria-pressed={onlyNotSet}
                            onClick={() => changeFilter(() => setOnlyNotSet(!onlyNotSet))}
                            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${onlyNotSet ? "border-yellow-500 bg-yellow-50 text-yellow-900" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                        >
                            {onlyNotSet && <Check size={15} aria-hidden="true" />}
                            Fees not set
                            <span className={`text-xs tabular-nums ${onlyNotSet ? "text-yellow-800" : "text-gray-400"}`}>{notSet.length}</span>
                        </button>
                    </div>
                    <FilterChips label="Filter by level" value={level} options={levelOptions} onChange={(v) => changeFilter(() => setLevel(v))} layoutId="accounts-level-chip" />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-52 w-full rounded-xl" />)}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState title="Classes couldn't be loaded." hint="Check your connection, then try again." action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>} />
                    </div>
                ) : classrooms.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState icon={<School size={28} />} title="No classes yet." hint="The principal creates classes. Once they exist, you can set their fees here." />
                    </div>
                ) : matches.length === 0 || (level !== "all" && levelRows.length === 0) ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState
                            title="No classes match."
                            hint="Try another search or level, or clear the filters."
                            action={<button type="button" onClick={() => changeFilter(() => { setQuery(""); setLevel("all"); setOnlyNotSet(false); })} className={secondaryBtn}>Clear filters</button>}
                        />
                    </div>
                ) : level === "all" ? (
                    <div className="space-y-8">
                        {LEVELS.map((l) => {
                            const rows = matches.filter((c) => levelOf(c.grade) === l);
                            if (!rows.length) return null;
                            const students = rows.reduce((sum, c) => sum + c.totalStudents, 0);
                            return (
                                <section key={l} aria-labelledby={`fee-level-${l}`} className="space-y-3">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 id={`fee-level-${l}`} className="text-sm font-semibold text-gray-900">
                                            {l}
                                            <span className="ml-2 font-normal tabular-nums text-gray-500">
                                                {rows.length} {rows.length === 1 ? "class" : "classes"}, {students.toLocaleString("en-IN")} students
                                            </span>
                                        </h3>
                                        {rows.length > GROUP_PREVIEW && (
                                            <button type="button" onClick={() => changeFilter(() => setLevel(l))} className={`rounded-sm text-sm font-medium text-yellow-800 underline-offset-4 hover:text-yellow-900 hover:underline ${focusRing}`}>
                                                Show all {rows.length}
                                            </button>
                                        )}
                                    </div>
                                    {list(rows.slice(0, GROUP_PREVIEW))}
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {list(pageRows)}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm tabular-nums text-gray-500">
                                Showing{" "}
                                <span className="font-medium text-gray-700">
                                    {(current - 1) * PER_PAGE + 1}&ndash;{Math.min(current * PER_PAGE, levelRows.length)}
                                </span>{" "}
                                of <span className="font-medium text-gray-700">{levelRows.length}</span>
                            </p>
                            <CardPager page={current} pageCount={pageCount} onPage={setPage} />
                        </div>
                    </div>
                )}
            </section>

            <FeeSettingsDialog classroom={settingsFor} onClose={() => setSettingsFor(null)} onSaved={() => refetch()} />
            <OtherFeesDialog classroom={otherFeesFor} onClose={() => setOtherFeesFor(null)} />
        </div>
    );
}

// ─── Find a student ────────────────────────────────────────────────

const FINDER_LIMIT = 8;

/** Search every class at once and jump straight to a student's fee page. */
function StudentFinder() {
    const [text, setText] = useState("");
    const [query, setQuery] = useState("");
    // Wait for a pause in typing before searching.
    useEffect(() => {
        const t = setTimeout(() => setQuery(text.trim()), 300);
        return () => clearTimeout(t);
    }, [text]);

    const ready = query.length >= 2;
    const { data: results = [], isFetching, isError, refetch } = useSearchStudentsFeesQuery({ query }, { skip: !ready });
    const shown = results.slice(0, FINDER_LIMIT);
    const waiting = text.trim().length >= 2 && (text.trim() !== query || isFetching);

    return (
        <section aria-labelledby="find-student" className="rounded-xl border border-gray-200 bg-white">
            <div className="px-4 pt-4 sm:px-6 sm:pt-5">
                <h2 id="find-student" className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <UserSearch size={18} aria-hidden="true" className="text-gray-400" />
                    Find a student
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">Search across all classes by name or roll number, then open their fees.</p>
                <SearchBox id="find-student-search" label="Find a student by name or roll number" value={text} onChange={setText} placeholder="Type a student's name or roll number" className="mt-3 pb-4 sm:max-w-xl" />
            </div>

            {text.trim().length > 0 && text.trim().length < 2 ? (
                <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:px-6">Keep typing: enter at least 2 letters.</p>
            ) : !ready && !waiting ? null : waiting && shown.length === 0 ? (
                <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:px-6">Searching…</p>
            ) : isError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm sm:px-6">
                    <p className="text-gray-700">The search didn&apos;t run. Check your connection and try again.</p>
                    <button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>
                </div>
            ) : results.length === 0 ? (
                <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:px-6">
                    No student matches &ldquo;{query}&rdquo;. Check the spelling, or open the class below.
                </p>
            ) : (
                <>
                    <ul aria-label="Matching students" className={`divide-y divide-gray-100 border-t border-gray-100 ${waiting ? "opacity-60" : ""}`}>
                        {shown.map((s) => (
                            <li key={s.studentId}>
                                <Link
                                    href={`/accounts/student/${s.classroomId}/details/${s.studentId}`}
                                    className={`flex items-center gap-3 px-4 py-3 hover:bg-yellow-50/50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}
                                >
                                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xs font-semibold text-yellow-900">
                                        {initials(s.fullName)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium text-gray-900">{s.fullName}</span>
                                        <span className="block truncate text-sm text-gray-500">
                                            {s.classroomName ?? "Class not set"}, roll <span className="tabular-nums">{s.rollNumber || "not set"}</span>
                                        </span>
                                    </span>
                                    <MonthStatus s={s} />
                                    <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-gray-400" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                    {results.length > FINDER_LIMIT && (
                        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500 sm:px-6">
                            Showing {FINDER_LIMIT} of {results.length.toLocaleString("en-IN")} matches. Type more of the name to narrow it down.
                        </p>
                    )}
                </>
            )}
        </section>
    );
}

/** This month's fee status for a search result, as an icon plus a word. */
function MonthStatus({ s }: { s: StudentFeeRecord }) {
    const [label, cls, Icon] = s.isPaid
        ? ["Paid this month", "bg-emerald-50 text-emerald-800 ring-emerald-100", CheckCircle2]
        : s.paidAmount > 0
          ? ["Part paid", "bg-orange-50 text-orange-800 ring-orange-100", CircleDashed]
          : ["Not paid this month", "bg-red-50 text-red-800 ring-red-100", XCircle];
    return (
        <span className={`hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 sm:inline-flex ${cls}`}>
            <Icon size={13} aria-hidden="true" />
            {label}
        </span>
    );
}
