"use client";

import { use, useId, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, Download, History, Lock, Plus } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import {
    useGetAttendanceByDateQuery,
    useGetClassDetailsQuery,
    useGetClassStudentsQuery,
    useGetTeacherClassesQuery,
    useGetTeacherProfileQuery,
    useMarkAttendanceMutation,
    type AttendanceByDateRecord,
} from "@/redux/api/teacherApi";
import { heroGradient } from "@/components/teacher/brand";
import {
    AttendanceBadge,
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    SearchBox,
    Skeleton,
    errorMessage,
    focusRing,
    initials,
    paginate,
    primaryBtn,
    readAuthUser,
    secondaryBtn,
} from "@/components/teacher/ui";
import { todayLocal } from "@/lib/dates";

type Filter = "ALL" | "PRESENT" | "ABSENT";

// The backend groups attendance by the UTC calendar day, so "today" uses the same key.
// Local date, not UTC: before 5:30 am in India the UTC date is still yesterday.
const todayKey = () => todayLocal();
const byRoll = (a: { rollNumber: string | null; fullName: string }, b: { rollNumber: string | null; fullName: string }) =>
    (a.rollNumber ?? "~").localeCompare(b.rollNumber ?? "~", "en-IN", { numeric: true }) || a.fullName.localeCompare(b.fullName);

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full motion-safe:transition-colors ${focusRing} focus-visible:ring-offset-2 ${on ? "bg-emerald-600" : "bg-gray-300"}`}
        >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow motion-safe:transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
        </button>
    );
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const titleId = useId();
    const [{ teacherId }] = useState(readAuthUser);
    const date = todayKey();
    const dateLabel = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

    const { data: profile, isLoading: profileLoading } = useGetTeacherProfileQuery();
    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const { data: details } = useGetClassDetailsQuery(classroomId);
    const studentsQ = useGetClassStudentsQuery(classroomId);
    const todayQ = useGetAttendanceByDateQuery({ classroomId, date });
    const [markAttendance, { isLoading: saving }] = useMarkAttendanceMutation();

    const students = [...(studentsQ.data ?? [])].sort(byRoll);
    const className = myClasses.find((c) => c.id === classroomId)?.name ?? details?.className ?? "Classroom";
    const isClassTeacher = profile?.classTeacherOf?.id === classroomId;
    const records = [...(todayQ.data?.records ?? [])].map((r) => ({ ...r, rollNumber: r.rollNumber === "—" ? null : r.rollNumber })).sort(byRoll);
    const markedToday = records.length > 0;
    const loading = studentsQ.isLoading || todayQ.isLoading;

    // Register list
    const [filter, setFilter] = useState<Filter>("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const q = search.trim().toLowerCase();
    const visible = records.filter((r) => (filter === "ALL" || r.status === filter) && (!q || r.fullName.toLowerCase().includes(q) || (r.rollNumber ?? "").toLowerCase().includes(q)));
    const { pageCount, current, pageRows } = paginate(visible, page);

    // Marking dialog: everyone starts present; the teacher switches off the absentees.
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"mark" | "review">("mark");
    const [absent, setAbsent] = useState<Set<string>>(new Set());
    const [markSearch, setMarkSearch] = useState("");
    const mq = markSearch.trim().toLowerCase();
    const markRows = students.filter((s) => !mq || s.fullName.toLowerCase().includes(mq) || (s.rollNumber ?? "").toLowerCase().includes(mq));
    const absentees = students.filter((s) => absent.has(s.id));

    const openMarking = () => {
        setAbsent(new Set());
        setMarkSearch("");
        setStep("mark");
        setOpen(true);
    };
    const toggle = (id: string) =>
        setAbsent((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const save = async () => {
        try {
            await markAttendance(
                students.map((s) => ({ studentId: s.id, status: absent.has(s.id) ? ("ABSENT" as const) : ("PRESENT" as const), teacherId, classroomId }))
            ).unwrap();
            setOpen(false);
            toast.success(`Attendance saved: ${students.length - absent.size} present, ${absent.size} absent.`);
            todayQ.refetch();
            studentsQ.refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Attendance not saved. Check your connection and try again."));
            setStep("mark");
        }
    };

    const download = () => {
        const rows: (string | number)[][] = [["Roll", "Student", "Status", "Date"]];
        if (markedToday) records.forEach((r) => rows.push([r.rollNumber ?? "", r.fullName, r.status === "PRESENT" ? "Present" : "Absent", date]));
        else students.forEach((s) => rows.push([s.rollNumber ?? "", s.fullName, "Not marked", date]));
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        const book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(book, sheet, "Attendance");
        XLSX.writeFile(book, `Attendance_${className.replace(/[^\w]+/g, "_")}_${date}.xlsx`);
        toast.success("Register downloaded.");
    };

    const present = todayQ.data?.present ?? 0;
    const absentCount = todayQ.data?.absent ?? 0;
    const rate = markedToday ? Math.round((present / Math.max(1, records.length)) * 100) : null;

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Attendance"
                crumb={{ href: `/teacher/classroom/${classroomId}`, label: className }}
                subtitle={isClassTeacher ? "Mark the register once a day. A saved register can't be changed." : "Only the class teacher can mark attendance. You can view it here."}
                actions={
                    <>
                        <Link href={`/teacher/classroom/${classroomId}/attendance/history`} className={`${secondaryBtn} h-10`}>
                            <History size={16} aria-hidden="true" />
                            History
                        </Link>
                        <button type="button" onClick={download} disabled={loading || students.length === 0} className={`${secondaryBtn} h-10`}>
                            <Download size={16} aria-hidden="true" />
                            Download
                        </button>
                        {!profileLoading && isClassTeacher && (
                            <button type="button" onClick={openMarking} disabled={loading || markedToday || students.length === 0} className={primaryBtn}>
                                {markedToday ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                                {markedToday ? "Marked for today" : "Mark attendance"}
                            </button>
                        )}
                    </>
                }
            />

            <section aria-labelledby="today-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-5 sm:px-6">
                    <h2 id="today-summary" className="text-base font-semibold">Today, {dateLabel}</h2>
                    <p className="text-sm text-slate-300">
                        {loading ? <Skeleton onDark className="h-4 w-28 align-middle" /> : markedToday ? "Register saved" : "Not marked yet"}
                    </p>
                </div>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm text-slate-300">Present</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : markedToday ? present : <span className="text-slate-400">—</span>}
                            {rate !== null && <span className="ml-2 text-sm font-normal text-emerald-300">{rate}%</span>}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Absent</dt>
                        <dd className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${absentCount > 0 ? "text-rose-300" : ""}`}>
                            {loading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : markedToday ? absentCount : <span className="text-slate-400">—</span>}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Students in class</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : students.length}
                        </dd>
                    </div>
                </dl>
                {loading ? null : markedToday ? (
                    <div aria-hidden="true" className="flex h-1.5 bg-white/10">
                        <span className="bg-emerald-400" style={{ width: `${rate}%` }} />
                        <span className="bg-rose-400" style={{ width: `${100 - (rate ?? 0)}%` }} />
                    </div>
                ) : null}
            </section>

            <section aria-labelledby="register-title" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 id="register-title" className="text-base font-semibold text-gray-900">Today&apos;s register</h2>
                        {markedToday && (
                            <div className="mt-2">
                                <FilterChips
                                    label="Show"
                                    layoutId="teacher-register-filter"
                                    value={filter}
                                    onChange={(v) => { setFilter(v); setPage(1); }}
                                    options={[
                                        { value: "ALL", label: "All", count: records.length },
                                        { value: "PRESENT", label: "Present", count: present },
                                        { value: "ABSENT", label: "Absent", count: absentCount },
                                    ]}
                                />
                            </div>
                        )}
                    </div>
                    {markedToday && <SearchBox id="register-search" label="Search the register" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or roll number" className="lg:w-72" />}
                </div>

                {loading ? (
                    <div aria-hidden="true" className="space-y-3 px-4 py-5 sm:px-6">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-11 w-full" />)}
                    </div>
                ) : studentsQ.isError || todayQ.isError ? (
                    <EmptyState
                        title="Today's register couldn't be loaded."
                        hint="It might be a temporary problem — try again in a moment."
                        action={<button type="button" onClick={() => { studentsQ.refetch(); todayQ.refetch(); }} className={secondaryBtn}>Try again</button>}
                    />
                ) : students.length === 0 ? (
                    <EmptyState icon={<CalendarCheck size={28} />} title="No students are enrolled in this class yet." />
                ) : !markedToday ? (
                    isClassTeacher ? (
                        <EmptyState
                            icon={<CalendarCheck size={28} />}
                            title="Today's register hasn't been marked."
                            hint="Everyone starts as present. Switch off the students who are absent, then review and save."
                            action={<button type="button" onClick={openMarking} className={primaryBtn}>Mark attendance</button>}
                        />
                    ) : (
                        <EmptyState
                            icon={<Lock size={28} />}
                            title="Today's register hasn't been marked."
                            hint={`${details?.classTeacherName ?? "The class teacher"} marks attendance for this class. It will appear here once it's saved.`}
                        />
                    )
                ) : visible.length === 0 ? (
                    <EmptyState title={q ? `No students match “${search.trim()}”.` : "No students in this group."} action={<button type="button" onClick={() => { setSearch(""); setFilter("ALL"); }} className={secondaryBtn}>Show everyone</button>} />
                ) : (
                    <>
                        <RegisterList rows={pageRows} />
                        <Pager total={visible.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </section>

            <Dialog open={open} onClose={() => !saving && setOpen(false)} labelledBy={titleId} className="sm:max-w-2xl">
                <DialogHeader accent="emerald" id={titleId} title={step === "mark" ? "Mark attendance" : "Review and save"} subtitle={`${className}, ${dateLabel}`} onClose={() => !saving && setOpen(false)} />
                {step === "mark" ? (
                    <>
                        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <SearchBox id="mark-search" label="Find a student" value={markSearch} onChange={setMarkSearch} placeholder="Find a student" className="sm:w-64" />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setAbsent(new Set())} className={secondaryBtn}>All present</button>
                                <button type="button" onClick={() => setAbsent(new Set(students.map((s) => s.id)))} className={secondaryBtn}>All absent</button>
                            </div>
                        </div>
                        <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
                            {markRows.length === 0 ? (
                                <li className="px-6 py-10 text-center text-sm text-gray-500">No students match “{markSearch.trim()}”.</li>
                            ) : (
                                markRows.map((s) => {
                                    const isPresent = !absent.has(s.id);
                                    return (
                                        <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                            <span className="w-10 shrink-0 text-sm tabular-nums text-gray-500">{s.rollNumber ?? "—"}</span>
                                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{s.fullName}</span>
                                            <span className={`w-14 text-right text-sm font-medium ${isPresent ? "text-emerald-700" : "text-red-700"}`}>{isPresent ? "Present" : "Absent"}</span>
                                            <Switch on={isPresent} onToggle={() => toggle(s.id)} label={`${s.fullName} present`} />
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
                            <p className="text-sm tabular-nums text-gray-600">
                                <span className="font-medium text-emerald-700">{students.length - absent.size} present</span>
                                {", "}
                                <span className={absent.size ? "font-medium text-red-700" : ""}>{absent.size} absent</span>
                            </p>
                            <button type="button" onClick={() => setStep("review")} className={primaryBtn}>Review</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                            <dl className="grid grid-cols-3 gap-3 text-center">
                                {[
                                    { label: "Present", value: students.length - absent.size, tone: "text-emerald-700" },
                                    { label: "Absent", value: absent.size, tone: absent.size ? "text-red-700" : "text-gray-900" },
                                    { label: "Total", value: students.length, tone: "text-gray-900" },
                                ].map((f) => (
                                    <div key={f.label} className="rounded-lg bg-gray-50 px-3 py-3 ring-1 ring-gray-100">
                                        <dt className="text-xs text-gray-500">{f.label}</dt>
                                        <dd className={`text-xl font-semibold tabular-nums ${f.tone}`}>{f.value}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{absentees.length ? "Absent today" : "Everyone is present."}</p>
                                {absentees.length > 0 && (
                                    <ul className="mt-2 flex flex-wrap gap-2">
                                        {absentees.map((s) => (
                                            <li key={s.id} className="rounded-full bg-red-50 px-2.5 py-1 text-sm text-red-800 ring-1 ring-red-100">
                                                {s.rollNumber ? `${s.rollNumber}. ` : ""}
                                                {s.fullName}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
                                <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                                Once saved, today&apos;s register can&apos;t be changed.
                            </p>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button type="button" onClick={() => setStep("mark")} disabled={saving} className={`${secondaryBtn} h-10`}>Back to the register</button>
                            <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                                {saving ? "Saving…" : "Save attendance"}
                            </button>
                        </div>
                    </>
                )}
            </Dialog>
        </div>
    );
}

function RegisterList({ rows }: { rows: (Omit<AttendanceByDateRecord, "rollNumber"> & { rollNumber: string | null })[] }) {
    return (
        <>
            <ul className="divide-y divide-gray-100 xl:hidden">
                {rows.map((r) => (
                    <li key={r.studentId} className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">{initials(r.fullName)}</span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-gray-900">{r.fullName}</span>
                            <span className="block text-sm tabular-nums text-gray-500">Roll {r.rollNumber ?? "not set"}</span>
                        </span>
                        <AttendanceBadge status={r.status} />
                    </li>
                ))}
            </ul>
            <table className="hidden w-full text-left text-sm xl:table">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                    <tr>
                        <th scope="col" className="w-24 px-6 py-3 font-medium">Roll</th>
                        <th scope="col" className="px-6 py-3 font-medium">Student</th>
                        <th scope="col" className="px-6 py-3 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => (
                        <tr key={r.studentId} className="hover:bg-gray-50">
                            <td className="px-6 py-3 tabular-nums text-gray-600">{r.rollNumber ?? "—"}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{r.fullName}</td>
                            <td className="px-6 py-3"><AttendanceBadge status={r.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
