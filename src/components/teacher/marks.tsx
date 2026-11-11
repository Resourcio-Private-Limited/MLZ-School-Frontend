"use client";

import { useId, useState } from "react";
import { Lock, Pencil } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "./brand";
import { EmptyState, FilterChips, Pager, SearchBox, Skeleton, focusRing, initials, inputClass, paginate, primaryBtn, secondaryBtn } from "./ui";

// Shared marks list, summary and entry dialog for the class teacher's exam page and the subject marks entry page.

export type MarkRow = { studentId: string; rollNumber: string | null; fullName: string; score: number | null; max: number };

export const PRIMARY_GRADES = ["A1", "A2", "B1", "B2", "C1", "C2", "D"] as const;
// Primary classes are graded, not marked. Each grade is stored as the middle of its band.
export const PRIMARY_GRADE_SCORE: Record<string, number> = { A1: 95, A2: 85, B1: 75, B2: 65, C1: 55, C2: 45, D: 35 };

export function primaryGrade(score: number | null) {
    if (score === null) return null;
    if (score >= 90) return "A1";
    if (score >= 80) return "A2";
    if (score >= 70) return "B1";
    if (score >= 60) return "B2";
    if (score >= 50) return "C1";
    if (score >= 40) return "C2";
    return "D";
}

export function letterGrade(pct: number | null) {
    if (pct === null) return null;
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "F";
}

const pctOf = (r: MarkRow) => (r.score === null ? null : Math.round((r.score / Math.max(1, r.max)) * 1000) / 10);
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
export const byRoll = (a: MarkRow, b: MarkRow) => (a.rollNumber ?? "~").localeCompare(b.rollNumber ?? "~", "en-IN", { numeric: true }) || a.fullName.localeCompare(b.fullName);

function GradeBadge({ row, primary }: { row: MarkRow; primary: boolean }) {
    if (row.score === null) return <span className="text-sm text-gray-400">Not entered</span>;
    const pct = pctOf(row) ?? 0;
    const grade = primary ? primaryGrade(pct) : letterGrade(pct);
    const fail = !primary && pct < 40;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${fail ? "bg-red-50 text-red-800 ring-red-100" : "bg-gray-50 text-gray-800 ring-gray-200"}`}>
            {fail ? `${grade}, below pass` : grade}
        </span>
    );
}

/** Gradient summary: how many marks are in, and the class average, highest and lowest. */
export function MarksSummary({ title, rows, loading, primary, note }: { title: string; rows: MarkRow[]; loading: boolean; primary: boolean; note?: string }) {
    const entered = rows.filter((r) => r.score !== null);
    const pcts = entered.map((r) => pctOf(r) ?? 0);
    const avg = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
    const share = rows.length ? Math.round((entered.length / rows.length) * 100) : 0;
    const show = (n: number | null) => (n === null ? <span className="text-slate-400">—</span> : primary ? primaryGrade(n) : `${fmt(n)}%`);
    const figures = [
        { label: "Average", value: show(avg) },
        { label: "Highest", value: show(pcts.length ? Math.max(...pcts) : null) },
        { label: "Lowest", value: show(pcts.length ? Math.min(...pcts) : null) },
    ];
    return (
        <section aria-labelledby="marks-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-5 sm:px-6">
                <h2 id="marks-summary" className="text-base font-semibold">{title}</h2>
                {note && <p className="text-sm text-slate-300">{note}</p>}
            </div>
            <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                <div>
                    <dt className="text-sm text-slate-300">Marks entered</dt>
                    <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                        {loading ? <Skeleton onDark className="h-7 w-16 align-middle" /> : entered.length}
                        {!loading && <span className="ml-1.5 text-sm font-normal text-slate-400">of {rows.length}</span>}
                    </dd>
                    {!loading && rows.length > 0 && (
                        <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${share}%` }} />
                        </div>
                    )}
                </div>
                {figures.map((f) => (
                    <div key={f.label}>
                        <dt className="text-sm text-slate-300">{f.label}</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{loading ? <Skeleton onDark className="h-7 w-14 align-middle" /> : f.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

type Filter = "ALL" | "ENTERED" | "MISSING";

/** Student marks list: filter, search, cards below xl, table from xl, 10 per page. */
export function MarksList({
    rows,
    loading,
    error,
    onRetry,
    primary,
    canEdit,
    lockedReason,
    onEdit,
}: {
    rows: MarkRow[];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
    primary: boolean;
    canEdit: boolean;
    lockedReason: string;
    onEdit: (row: MarkRow) => void;
}) {
    const [filter, setFilter] = useState<Filter>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const q = search.trim().toLowerCase();
    const sorted = [...rows].sort(byRoll);
    const visible = sorted.filter((r) => (filter === "ALL" || (filter === "ENTERED" ? r.score !== null : r.score === null)) && (!q || r.fullName.toLowerCase().includes(q) || (r.rollNumber ?? "").toLowerCase().includes(q)));
    const { pageCount, current, pageRows } = paginate(visible, page);
    const entered = rows.filter((r) => r.score !== null).length;
    const scoreText = (r: MarkRow) => (r.score === null ? null : primary ? primaryGrade(pctOf(r)) : `${fmt(r.score)} / ${r.max}`);

    const editBtn = (r: MarkRow, compact = false) =>
        canEdit ? (
            <button
                type="button"
                onClick={() => onEdit(r)}
                aria-label={compact ? `${r.score === null ? "Enter" : "Edit"} marks for ${r.fullName}` : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 motion-safe:transition-colors ${focusRing}`}
            >
                <Pencil size={14} aria-hidden="true" />
                {!compact && (r.score === null ? "Enter" : "Edit")}
                {!compact && <span className="sr-only"> marks for {r.fullName}</span>}
            </button>
        ) : (
            <span title={lockedReason} className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Lock size={12} aria-hidden="true" />
                Locked
            </span>
        );

    return (
        <section aria-label="Student marks" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <FilterChips
                    label="Show"
                    layoutId="teacher-marks-filter"
                    value={filter}
                    onChange={(v) => { setFilter(v); setPage(1); }}
                    options={[
                        { value: "ALL", label: "All", count: rows.length },
                        { value: "ENTERED", label: "Entered", count: entered },
                        { value: "MISSING", label: "Not entered", count: rows.length - entered },
                    ]}
                />
                <SearchBox id="marks-search" label="Search students" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or roll number" className="lg:w-72" />
            </div>

            {loading ? (
                <div aria-hidden="true" className="space-y-3 px-4 py-5 sm:px-6">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-11 w-full" />)}
                </div>
            ) : error ? (
                <EmptyState title="Marks couldn't be loaded." hint="Check your connection, then try again." action={<button type="button" onClick={onRetry} className={secondaryBtn}>Try again</button>} />
            ) : rows.length === 0 ? (
                <EmptyState title="No students are enrolled in this class yet." />
            ) : visible.length === 0 ? (
                <EmptyState
                    title={q ? `No students match “${search.trim()}”.` : filter === "MISSING" ? "Every student has marks." : "No marks entered yet."}
                    action={<button type="button" onClick={() => { setSearch(""); setFilter("ALL"); }} className={secondaryBtn}>Show all students</button>}
                />
            ) : (
                <>
                    <ul className="divide-y divide-gray-100 xl:hidden">
                        {pageRows.map((r) => (
                            <li key={r.studentId} className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
                                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">{initials(r.fullName)}</span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-gray-900">{r.fullName}</span>
                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-gray-500">
                                        <span>Roll {r.rollNumber ?? "not set"}</span>
                                        {scoreText(r) && <span className="font-medium text-gray-900">{scoreText(r)}</span>}
                                        <GradeBadge row={r} primary={primary} />
                                    </span>
                                </span>
                                {editBtn(r, true)}
                            </li>
                        ))}
                    </ul>
                    <table className="hidden w-full text-left text-sm xl:table">
                        <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                            <tr>
                                <th scope="col" className="w-24 px-6 py-3 font-medium">Roll</th>
                                <th scope="col" className="px-6 py-3 font-medium">Student</th>
                                <th scope="col" className="px-6 py-3 text-right font-medium">{primary ? "Grade entered" : "Marks"}</th>
                                <th scope="col" className="px-6 py-3 font-medium">{primary ? "Band" : "Grade"}</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pageRows.map((r) => (
                                <tr key={r.studentId} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 tabular-nums text-gray-600">{r.rollNumber ?? "—"}</td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{r.fullName}</td>
                                    <td className="px-6 py-3 text-right font-medium tabular-nums text-gray-900">{scoreText(r) ?? <span className="font-normal text-gray-400">—</span>}</td>
                                    <td className="px-6 py-3"><GradeBadge row={r} primary={primary} /></td>
                                    <td className="px-6 py-3 text-right">{editBtn(r)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pager total={visible.length} page={current} pageCount={pageCount} onPage={setPage} />
                </>
            )}
        </section>
    );
}

/** Marks entry dialog: a number for secondary classes, grade chips for primary. "Save and next" moves down the roll. */
export function MarksDialog(props: {
    row: MarkRow | null;
    context: string;
    primary: boolean;
    saving: boolean;
    hasNext: boolean;
    onClose: () => void;
    onSave: (score: number, next: boolean) => void;
}) {
    const titleId = useId();
    const { row, saving, onClose } = props;
    return (
        <Dialog open={!!row} onClose={() => !saving && onClose()} labelledBy={titleId} className="sm:max-w-md">
            {/* Keyed by student, so the field starts fresh for each one. */}
            {row && <MarksForm key={row.studentId} {...props} row={row} titleId={titleId} />}
        </Dialog>
    );
}

function MarksForm({
    row,
    context,
    primary,
    saving,
    hasNext,
    onClose,
    onSave,
    titleId,
}: {
    row: MarkRow;
    context: string;
    primary: boolean;
    saving: boolean;
    hasNext: boolean;
    onClose: () => void;
    onSave: (score: number, next: boolean) => void;
    titleId: string;
}) {
    const [value, setValue] = useState(() => (row.score === null ? "" : primary ? primaryGrade(row.score) ?? "" : String(row.score)));
    const [touched, setTouched] = useState(false);

    const max = row.max;
    const num = Number(value);
    const error = primary
        ? !value ? "Choose a grade." : null
        : value.trim() === "" ? "Enter the marks." : !Number.isFinite(num) || num < 0 || num > max ? `Enter a number from 0 to ${max}.` : null;

    const submit = (next: boolean) => {
        setTouched(true);
        if (error || saving) return;
        onSave(primary ? PRIMARY_GRADE_SCORE[value] : num, next);
    };

    return (
        <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
                e.preventDefault();
                submit(hasNext);
            }}
        >
            <DialogHeader accent="emerald" id={titleId} title={row.fullName} subtitle={`${row.rollNumber ? `Roll ${row.rollNumber}, ` : ""}${context}`} onClose={() => !saving && onClose()} />
            <div className="space-y-3 px-4 py-5 sm:px-6">
                {primary ? (
                    <fieldset>
                        <legend className="text-sm font-medium text-gray-700">Grade</legend>
                        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
                            {PRIMARY_GRADES.map((g) => (
                                <label key={g} className="relative">
                                    <input type="radio" name="grade" value={g} checked={value === g} onChange={() => setValue(g)} className="peer sr-only" />
                                    <span className="flex h-10 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-1 motion-safe:transition-colors">
                                        {g}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                ) : (
                    <label className="block text-sm font-medium text-gray-700">
                        Marks out of {max}
                        <input
                            autoFocus
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={max}
                            step="0.5"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            aria-invalid={touched && !!error}
                            className={`${inputClass} mt-1.5 text-lg font-semibold tabular-nums`}
                        />
                    </label>
                )}
                <p className={`text-sm ${touched && error ? "text-red-700" : "text-gray-500"}`}>
                    {touched && error
                        ? error
                        : primary
                          ? "Primary classes use grades A1 to D."
                          : value && !error
                            ? `${fmt((num / max) * 100)}%, grade ${letterGrade((num / max) * 100)}${num / max < 0.4 ? ", below the pass mark" : ""}.`
                            : `Pass mark is ${Math.round(max * 0.4)}.`}
                </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={onClose} disabled={saving} className={`${secondaryBtn} h-10`}>Cancel</button>
                {hasNext && (
                    <button type="button" onClick={() => submit(false)} disabled={saving} className={`${secondaryBtn} h-10`}>Save</button>
                )}
                <button type="submit" disabled={saving} className={primaryBtn}>
                    {saving ? "Saving…" : hasNext ? "Save and next" : "Save marks"}
                </button>
            </div>
        </form>
    );
}
