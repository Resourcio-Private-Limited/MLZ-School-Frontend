"use client";

import { use, useId, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useGetAttendanceByDateQuery, useGetAttendanceHistoryQuery, useGetClassDetailsQuery, useGetTeacherClassesQuery, type AttendanceDay } from "@/redux/api/teacherApi";
import { heroGradient } from "@/components/teacher/brand";
import { AttendanceBadge, EmptyState, FilterChips, PageHeader, Pager, Skeleton, focusRing, paginate, secondaryBtn } from "@/components/teacher/ui";

type Filter = "ALL" | "MARKED" | "UNMARKED";

// Day keys are "YYYY-MM-DD"; noon keeps them on the same calendar day in any time zone.
const asDate = (key: string) => new Date(`${key}T12:00:00`);
const longDay = (key: string) => asDate(key).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
const monthName = (year: number, month: number) => new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
const todayKey = () => new Date().toISOString().slice(0, 10);

const stepBtn = `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 motion-safe:transition ${focusRing}`;

export default function AttendanceHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const dialogTitle = useId();
    const now = new Date();
    const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
    const [filter, setFilter] = useState<Filter>("ALL");
    const [page, setPage] = useState(1);
    const [viewDate, setViewDate] = useState<string | null>(null);
    const [dayFilter, setDayFilter] = useState<"ALL" | "PRESENT" | "ABSENT">("ALL");

    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const { data: details } = useGetClassDetailsQuery(classroomId);
    const className = myClasses.find((c) => c.id === classroomId)?.name ?? details?.className ?? "Classroom";

    const { data: history, isLoading, isFetching, isError, refetch } = useGetAttendanceHistoryQuery({ classroomId, month: ym.month, year: ym.year });
    const dayQ = useGetAttendanceByDateQuery({ classroomId, date: viewDate ?? "" }, { skip: !viewDate });

    const isThisMonth = ym.year === now.getFullYear() && ym.month === now.getMonth() + 1;
    const shift = (delta: number) => {
        setYm(({ year, month }) => {
            const d = new Date(year, month - 1 + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() + 1 };
        });
        setPage(1);
    };

    // Days up to today, newest first. Future days are left out.
    const today = todayKey();
    const days = (history?.days ?? []).filter((d) => d.date <= today).reverse();
    const marked = days.filter((d) => d.isMarked);
    const visible = days.filter((d) => filter === "ALL" || (filter === "MARKED" ? d.isMarked : !d.isMarked));
    const { pageCount, current, pageRows } = paginate(visible, page);
    const loading = isLoading || isFetching;
    const label = monthName(ym.year, ym.month);

    const download = () => {
        if (!history) return;
        const rows: (string | number)[][] = [["Date", "Day", "Students", "Present", "Absent", "Status"]];
        days.slice().reverse().forEach((d) => rows.push([d.date, d.dayName, d.totalStudents, d.present, d.absent, d.isMarked ? "Marked" : "Not marked"]));
        rows.push([], ["Average attendance", `${history.avgAttendance}%`], ["Days marked", history.totalWorkingDays], ["Students", history.totalStudents]);
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, "Attendance");
        XLSX.writeFile(book, `Attendance_${className.replace(/[^\w]+/g, "_")}_${label.replace(" ", "_")}.xlsx`);
        toast.success(`${label} downloaded.`);
    };

    const openDay = (d: AttendanceDay) => {
        setDayFilter("ALL");
        setViewDate(d.date);
    };
    const records = (dayQ.data?.records ?? []).filter((r) => dayFilter === "ALL" || r.status === dayFilter);

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Attendance history"
                crumb={{ href: `/teacher/classroom/${classroomId}/attendance`, label: "Attendance" }}
                subtitle={`${className}. Pick a month, then open a day to see who was absent.`}
                actions={
                    <button type="button" onClick={download} disabled={!history || loading} className={`${secondaryBtn} h-10`}>
                        <Download size={16} aria-hidden="true" />
                        Download {label}
                    </button>
                }
            />

            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className={stepBtn}>
                    <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <p aria-live="polite" className="min-w-36 text-center text-base font-semibold tabular-nums text-gray-900">{label}</p>
                <button type="button" onClick={() => shift(1)} disabled={isThisMonth} aria-label="Next month" className={stepBtn}>
                    <ChevronRight size={18} aria-hidden="true" />
                </button>
                {!isThisMonth && (
                    <button type="button" onClick={() => { setYm({ year: now.getFullYear(), month: now.getMonth() + 1 }); setPage(1); }} className={`${secondaryBtn} ml-1`}>
                        This month
                    </button>
                )}
            </div>

            <section aria-labelledby="month-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <h2 id="month-summary" className="px-4 pt-5 text-base font-semibold sm:px-6">{label}</h2>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm text-slate-300">Average attendance</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loading ? <Skeleton onDark className="h-7 w-14 align-middle" /> : marked.length ? `${history?.avgAttendance ?? 0}%` : <span className="text-slate-400">—</span>}
                        </dd>
                        {!loading && history && marked.length > 0 && (
                            <div aria-hidden="true" className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                                <span className="block h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, history.avgAttendance)}%` }} />
                            </div>
                        )}
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Days marked</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : history?.totalWorkingDays ?? 0}
                            {!loading && days.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">of {days.length} days so far</span>}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Students</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : history?.totalStudents ?? "—"}
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-label="Days" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
                    <FilterChips
                        label="Show days"
                        layoutId="teacher-history-filter"
                        value={filter}
                        onChange={(v) => { setFilter(v); setPage(1); }}
                        options={[
                            { value: "ALL", label: "All days", count: days.length },
                            { value: "MARKED", label: "Marked", count: marked.length },
                            { value: "UNMARKED", label: "Not marked", count: days.length - marked.length },
                        ]}
                    />
                </div>

                {loading ? (
                    <div aria-hidden="true" className="space-y-3 px-4 py-5 sm:px-6">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-11 w-full" />)}
                    </div>
                ) : isError ? (
                    <EmptyState title={`${label} couldn't be loaded.`} hint="Check your connection, then try again." action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>} />
                ) : visible.length === 0 ? (
                    <EmptyState
                        icon={<CalendarDays size={28} />}
                        title={days.length === 0 ? `${label} hasn't started yet.` : filter === "MARKED" ? `No register was marked in ${label}.` : "Every day so far has been marked."}
                        action={filter !== "ALL" ? <button type="button" onClick={() => setFilter("ALL")} className={secondaryBtn}>Show all days</button> : undefined}
                    />
                ) : (
                    <>
                        <ul className="divide-y divide-gray-100 xl:hidden">
                            {pageRows.map((d) => (
                                <li key={d.date}>
                                    <DayCard day={d} onOpen={() => openDay(d)} />
                                </li>
                            ))}
                        </ul>
                        <table className="hidden w-full text-left text-sm xl:table">
                            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium">Date</th>
                                    <th scope="col" className="px-6 py-3 text-right font-medium">Present</th>
                                    <th scope="col" className="px-6 py-3 text-right font-medium">Absent</th>
                                    <th scope="col" className="w-64 px-6 py-3 font-medium">Attendance</th>
                                    <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pageRows.map((d) => {
                                    const pct = d.isMarked ? Math.round((d.present / Math.max(1, d.present + d.absent)) * 100) : null;
                                    return (
                                        <tr key={d.date} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{longDay(d.date)}</td>
                                            <td className="px-6 py-3 text-right tabular-nums text-gray-700">{d.isMarked ? d.present : "—"}</td>
                                            <td className={`px-6 py-3 text-right tabular-nums ${d.absent ? "font-medium text-red-700" : "text-gray-700"}`}>{d.isMarked ? d.absent : "—"}</td>
                                            <td className="px-6 py-3">{pct === null ? <span className="text-gray-400">Not marked</span> : <Meter pct={pct} />}</td>
                                            <td className="px-6 py-3 text-right">
                                                {d.isMarked && (
                                                    <button type="button" onClick={() => openDay(d)} className={`rounded-lg px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 motion-safe:transition-colors ${focusRing}`}>
                                                        View register<span className="sr-only"> for {longDay(d.date)}</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <Pager total={visible.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </section>

            <Dialog open={!!viewDate} onClose={() => setViewDate(null)} labelledBy={dialogTitle} className="sm:max-w-lg">
                {viewDate && (
                    <>
                        <DialogHeader accent="emerald" id={dialogTitle} title={longDay(viewDate)} subtitle={className} onClose={() => setViewDate(null)} />
                        {dayQ.isFetching && !dayQ.data ? (
                            <p className="px-6 py-16 text-center text-sm text-gray-500">Loading the register…</p>
                        ) : dayQ.isError ? (
                            <p className="px-6 py-16 text-center text-sm text-gray-500">The register couldn&apos;t be loaded. Close this and try again.</p>
                        ) : dayQ.data ? (
                            <>
                                <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
                                    <FilterChips
                                        label="Show"
                                        layoutId="teacher-day-filter"
                                        value={dayFilter}
                                        onChange={setDayFilter}
                                        options={[
                                            { value: "ALL", label: "Everyone", count: dayQ.data.total },
                                            { value: "PRESENT", label: "Present", count: dayQ.data.present },
                                            { value: "ABSENT", label: "Absent", count: dayQ.data.absent },
                                        ]}
                                    />
                                </div>
                                <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                                    {records.length === 0 ? (
                                        <li className="px-6 py-10 text-center text-sm text-gray-500">{dayFilter === "ABSENT" ? "No one was absent." : "No one in this group."}</li>
                                    ) : (
                                        records.map((r) => (
                                            <li key={r.studentId} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                                <span className="w-10 shrink-0 text-sm tabular-nums text-gray-500">{r.rollNumber}</span>
                                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{r.fullName}</span>
                                                <AttendanceBadge status={r.status} />
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </>
                        ) : null}
                    </>
                )}
            </Dialog>
        </div>
    );
}

function Meter({ pct }: { pct: number }) {
    return (
        <span className="flex items-center gap-3">
            <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-red-100">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </span>
            <span className="w-10 text-right text-sm tabular-nums text-gray-700">{pct}%</span>
        </span>
    );
}

function DayCard({ day, onOpen }: { day: AttendanceDay; onOpen: () => void }) {
    const pct = day.isMarked ? Math.round((day.present / Math.max(1, day.present + day.absent)) * 100) : null;
    const body = (
        <>
            <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-gray-900">{longDay(day.date)}</span>
                {!day.isMarked && <span className="text-sm text-gray-400">Not marked</span>}
            </span>
            {pct !== null && (
                <>
                    <span className="mt-1 block text-sm tabular-nums text-gray-600">
                        {day.present} present, <span className={day.absent ? "font-medium text-red-700" : ""}>{day.absent} absent</span>
                    </span>
                    <span className="mt-2 block">
                        <Meter pct={pct} />
                    </span>
                </>
            )}
        </>
    );
    return day.isMarked ? (
        <button type="button" onClick={onOpen} className={`block w-full px-4 py-3.5 text-left hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}>
            {body}
            <span className="sr-only">View register</span>
        </button>
    ) : (
        <div className="px-4 py-3.5 sm:px-6">{body}</div>
    );
}
