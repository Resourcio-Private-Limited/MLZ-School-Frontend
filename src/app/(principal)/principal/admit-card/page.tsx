"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarDays, CheckCircle2, Download, Eye, FileText, Loader2, Pencil, Users } from "lucide-react";
import {
    useCreateAdmitCardMutation,
    useGetAllClassroomsQuery,
    useGetClassroomStudentsQuery,
    useGetExamScheduleQuery,
    useGetStudentAdmitCardPreviewQuery,
    useGetSubjectsByClassroomQuery,
    useSetExamScheduleMutation,
    useUpdateExamScheduleMutation,
    type ClassroomStudent,
    type ClassroomSummary,
} from "@/redux/api/principalApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "@/components/principal/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    Panel,
    SearchBox,
    Skeleton,
    errorMessage,
    inputClass,
    linkClass,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/principal/ui";

type ExamType = "HALF_YEARLY" | "FINAL";
type Eligibility = "all" | "eligible" | "ineligible";

const EXAMS: { value: ExamType; label: string; long: string }[] = [
    { value: "HALF_YEARLY", label: "Half-yearly", long: "Half-yearly examination" },
    { value: "FINAL", label: "Final", long: "Final examination" },
];

const examLong = (t: ExamType | "") => EXAMS.find((e) => e.value === t)?.long ?? "";

const toDateInputValue = (value: string | null | undefined) => (value ? value.slice(0, 10) : "");

/** "Thu 12 Mar 2027" for a yyyy-mm-dd value, read as a local date. */
function examDay(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// ─── Classes grouped the way the school talks about them ──────────────────
const LEVELS = ["Pre-primary", "Primary", "Middle school", "High school", "Senior secondary", "Other"] as const;

function gradeNumber(grade: string) {
    const g = grade.trim().toLowerCase();
    if (g === "nursery") return -2;
    if (g === "kg" || g === "lkg") return -1;
    if (g === "ukg") return 0;
    const n = parseInt(g, 10);
    return Number.isNaN(n) ? 99 : n;
}

function levelOf(grade: string): (typeof LEVELS)[number] {
    const n = gradeNumber(grade);
    if (n <= 0) return "Pre-primary";
    if (n <= 5) return "Primary";
    if (n <= 8) return "Middle school";
    if (n <= 10) return "High school";
    if (n <= 12) return "Senior secondary";
    return "Other";
}

function groupClassrooms(classrooms: ClassroomSummary[]) {
    const sorted = [...classrooms].sort((a, b) => gradeNumber(a.grade) - gradeNumber(b.grade) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
    return LEVELS.map((level) => ({ level, items: sorted.filter((c) => levelOf(c.grade) === level) })).filter((g) => g.items.length > 0);
}

function byRoll(a: ClassroomStudent, b: ClassroomStudent) {
    const ra = a.classRoll ?? Number.POSITIVE_INFINITY;
    const rb = b.classRoll ?? Number.POSITIVE_INFINITY;
    return ra - rb || a.fullName.localeCompare(b.fullName);
}

function saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const pdfName = (student: ClassroomStudent, exam: ExamType) => `AdmitCard_${student.fullName.replace(/[^\w-]+/g, "_").slice(0, 40)}_${exam}.pdf`;

export default function AdmitCardPage() {
    const [classroomId, setClassroomId] = useState("");
    const [examType, setExamType] = useState<ExamType | "">("");
    const scheduleKey = `${classroomId}:${examType}`;

    // Dates being edited for the current class and exam. Null means "show what the server has".
    const [draft, setDraft] = useState<{ key: string; dates: Record<string, string> } | null>(null);
    // Dates just saved, shown until the refetch catches up.
    const [justSaved, setJustSaved] = useState<{ key: string; dates: Record<string, string> } | null>(null);
    const [selection, setSelection] = useState<{ classroomId: string; ids: string[] }>({ classroomId: "", ids: [] });
    const [search, setSearch] = useState("");
    const [eligibility, setEligibility] = useState<Eligibility>("all");
    const [page, setPage] = useState(1);
    const [previewStudent, setPreviewStudent] = useState<ClassroomStudent | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

    const classroomsQ = useGetAllClassroomsQuery();
    const classrooms = useMemo(() => classroomsQ.data ?? [], [classroomsQ.data]);
    const studentsQ = useGetClassroomStudentsQuery(classroomId, { skip: !classroomId });
    const subjectsQ = useGetSubjectsByClassroomQuery(classroomId, { skip: !classroomId });
    const scheduleQ = useGetExamScheduleQuery({ classroomId, examType }, { skip: !classroomId || !examType });
    const [setExamSchedule, { isLoading: creatingSchedule }] = useSetExamScheduleMutation();
    const [updateExamSchedule, { isLoading: updatingSchedule }] = useUpdateExamScheduleMutation();
    const [createAdmitCard] = useCreateAdmitCardMutation();

    const subjects = useMemo(() => (classroomId ? subjectsQ.data ?? [] : []), [classroomId, subjectsQ.data]);
    const students = useMemo(() => (classroomId ? [...(studentsQ.data ?? [])].sort(byRoll) : []), [classroomId, studentsQ.data]);
    const classroom = classrooms.find((c) => c.id === classroomId);
    const groups = useMemo(() => groupClassrooms(classrooms), [classrooms]);

    // ─── Exam dates ──────────────────────────────────────────────
    const serverDates = useMemo(() => {
        const entries = examType && classroomId ? scheduleQ.data ?? [] : [];
        return Object.fromEntries(subjects.map((s) => [s.id, toDateInputValue(entries.find((e) => e.subjectId === s.id)?.examDate)]));
    }, [classroomId, examType, scheduleQ.data, subjects]);
    const savedDates = justSaved?.key === scheduleKey && scheduleQ.isFetching ? justSaved.dates : serverDates;
    const hasPersistedSchedule = subjects.length > 0 && subjects.every((s) => Boolean(savedDates[s.id]));
    const editing = draft?.key === scheduleKey;
    const dates = editing ? draft.dates : savedDates;
    const datesSet = subjects.filter((s) => Boolean(dates[s.id])).length;
    const scheduleComplete = subjects.length > 0 && datesSet === subjects.length;
    const scheduleSaved = hasPersistedSchedule && !editing;
    const showDateInputs = editing || !hasPersistedSchedule;
    const savingSchedule = creatingSchedule || updatingSchedule;
    const scheduleLoading = subjectsQ.isLoading || (scheduleQ.isFetching && !scheduleQ.data);

    const setDate = (subjectId: string, value: string) => setDraft({ key: scheduleKey, dates: { ...dates, [subjectId]: value } });

    const saveSchedule = async () => {
        if (!classroomId || !examType || !scheduleComplete) return;
        const payload = { classroomId, examType, schedule: subjects.map((s) => ({ subjectId: s.id, examDate: dates[s.id] })) };
        try {
            if (hasPersistedSchedule) await updateExamSchedule(payload).unwrap();
            else await setExamSchedule(payload).unwrap();
            setJustSaved({ key: scheduleKey, dates: { ...dates } });
            setDraft(null);
            toast.success(hasPersistedSchedule ? "Exam dates updated." : "Exam dates saved.");
        } catch (err) {
            toast.error(errorMessage(err, "Exam dates weren't saved. Check every date and try again."));
        }
    };

    // ─── Students ────────────────────────────────────────────────
    const eligible = students.filter((s) => s.examEligibility === true);
    const ineligibleCount = students.length - eligible.length;
    const selectedIds = selection.classroomId === classroomId ? selection.ids : [];
    const selectedSet = new Set(selectedIds);
    const allEligibleSelected = eligible.length > 0 && eligible.every((s) => selectedSet.has(s.id));

    const q = search.trim().toLowerCase();
    const filtered = students.filter((s) => {
        if (eligibility === "eligible" && s.examEligibility !== true) return false;
        if (eligibility === "ineligible" && s.examEligibility === true) return false;
        if (!q) return true;
        return [s.fullName, s.admissionNo, s.rollNumber ?? "", s.classRoll != null ? String(s.classRoll) : ""].some((v) => v.toLowerCase().includes(q));
    });
    const { pageCount, current, pageRows } = paginate(filtered, page);

    const canAct = Boolean(examType) && scheduleSaved;
    const blockedReason = !examType ? "Choose an exam to preview or download admit cards." : !scheduleSaved ? "Save the exam dates above before you preview or download admit cards." : null;

    const toggleStudent = (id: string) =>
        setSelection({ classroomId, ids: selectedSet.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id] });
    const toggleAllEligible = () => setSelection({ classroomId, ids: allEligibleSelected ? [] : eligible.map((s) => s.id) });

    const chooseClassroom = (id: string) => {
        setClassroomId(id);
        setDraft(null);
        setSearch("");
        setEligibility("all");
        setPage(1);
    };
    const chooseExam = (t: ExamType) => {
        setExamType(t);
        setDraft(null);
    };

    const downloadOne = async (student: ClassroomStudent) => {
        if (!examType || !canAct) return;
        setDownloadingId(student.id);
        try {
            const blob = await createAdmitCard({ studentId: student.id, examType }).unwrap();
            saveBlob(blob, pdfName(student, examType));
            toast.success(`Admit card for ${student.fullName} downloaded.`);
        } catch (err) {
            toast.error(errorMessage(err, `The admit card for ${student.fullName} wasn't downloaded. Try again in a moment.`));
        } finally {
            setDownloadingId(null);
        }
    };

    const downloadSelected = async () => {
        if (!examType || !canAct) return;
        const chosen = students.filter((s) => selectedSet.has(s.id) && s.examEligibility === true);
        if (chosen.length === 0) return;
        setBulk({ done: 0, total: chosen.length });
        const failed: ClassroomStudent[] = [];
        for (const [i, student] of chosen.entries()) {
            try {
                const blob = await createAdmitCard({ studentId: student.id, examType }).unwrap();
                saveBlob(blob, pdfName(student, examType));
            } catch {
                failed.push(student);
            }
            setBulk({ done: i + 1, total: chosen.length });
        }
        setBulk(null);
        const ok = chosen.length - failed.length;
        if (failed.length === 0) {
            toast.success(`${ok} admit card${ok === 1 ? "" : "s"} downloaded.`);
            setSelection({ classroomId, ids: [] });
        } else {
            // Keep only the failures selected so "Download" retries just those.
            setSelection({ classroomId, ids: failed.map((s) => s.id) });
            const names = failed.slice(0, 3).map((s) => s.fullName).join(", ");
            const msg = `${failed.length} admit card${failed.length === 1 ? " wasn't" : "s weren't"} downloaded (${names}${failed.length > 3 ? " and others" : ""}). ${failed.length === 1 ? "It's" : "They're"} still selected, so try again.`;
            if (ok > 0) toast.success(`${ok} admit card${ok === 1 ? "" : "s"} downloaded.`);
            toast.error(msg, { duration: 7000 });
        }
    };

    const busy = bulk !== null;

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Admit cards" subtitle="Set each subject's exam date, then preview and download admit cards for eligible students." />

            {/* Step 1: class and exam */}
            <Panel title="Class and exam" subtitle="Admit cards are made for one class and one exam at a time.">
                <div className="grid gap-5 px-4 pb-5 pt-4 sm:grid-cols-2 sm:px-6">
                    <div>
                        <label htmlFor="admit-class" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Class
                        </label>
                        {classroomsQ.isLoading ? (
                            <Skeleton className="h-10 w-full" />
                        ) : classroomsQ.isError ? (
                            <p className="text-sm text-red-700">
                                Classes didn&apos;t load.{" "}
                                <button type="button" onClick={() => classroomsQ.refetch()} className={linkClass}>
                                    Try again
                                </button>
                            </p>
                        ) : (
                            <select id="admit-class" value={classroomId} onChange={(e) => chooseClassroom(e.target.value)} className={`${inputClass} h-10 py-0`} disabled={busy}>
                                <option value="">Choose a class</option>
                                {groups.map((g) => (
                                    <optgroup key={g.level} label={g.level}>
                                        {g.items.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.total} students)
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <p className="mb-1.5 block text-sm font-medium text-gray-700">
                            Exam
                        </p>
                        <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50/60 px-1">
                            <FilterChips label="Exam" value={examType as ExamType} options={EXAMS.map((e) => ({ value: e.value, label: e.label }))} onChange={chooseExam} layoutId="admit-exam-chip" />
                        </div>
                    </div>
                </div>
            </Panel>

            {!classroomId ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState icon={<FileText size={36} />} title="Pick a class to see its students." hint="Then choose the exam, set each subject's date and download the admit cards." />
                </section>
            ) : (
                <>
                    {/* Headline summary */}
                    <section aria-label="Summary" className={`rounded-xl px-5 py-6 sm:px-6 ${heroGradient}`}>
                        <dl className="grid gap-6 lg:grid-cols-3">
                            <div className="min-w-0">
                                <dt className="text-sm text-slate-300">Class</dt>
                                <dd className="mt-1 truncate text-2xl font-semibold">{classroom?.name ?? <Skeleton onDark className="h-7 w-40" />}</dd>
                                <dd className="mt-1 truncate text-sm text-slate-400">{classroom?.classTeacher ? `Class teacher ${classroom.classTeacher.fullName}` : "No class teacher assigned"}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-sm text-slate-300">Exam dates</dt>
                                {!examType ? (
                                    <>
                                        <dd className="mt-1 text-2xl font-semibold">No exam chosen</dd>
                                        <dd className="mt-1 text-sm text-slate-400">Choose Half-yearly or Final above.</dd>
                                    </>
                                ) : scheduleLoading ? (
                                    <dd className="mt-2">
                                        <Skeleton onDark className="h-7 w-32" />
                                    </dd>
                                ) : (
                                    <>
                                        <dd className="mt-1 text-2xl font-semibold tabular-nums">
                                            {subjects.length === 0 ? "No subjects" : `${datesSet} of ${subjects.length} set`}
                                        </dd>
                                        <dd className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                                            <span
                                                className={`block h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${scheduleSaved ? "bg-emerald-300" : "bg-purple-300"}`}
                                                style={{ width: `${subjects.length ? (datesSet / subjects.length) * 100 : 0}%` }}
                                            />
                                        </dd>
                                        <dd className={`mt-1.5 text-sm ${scheduleSaved ? "text-emerald-300" : "text-slate-400"}`}>
                                            {examLong(examType)}, {scheduleSaved ? "dates saved" : "dates not saved yet"}
                                        </dd>
                                    </>
                                )}
                            </div>
                            <div className="min-w-0">
                                <dt className="text-sm text-slate-300">Eligible students</dt>
                                {studentsQ.isLoading ? (
                                    <dd className="mt-2">
                                        <Skeleton onDark className="h-7 w-24" />
                                    </dd>
                                ) : (
                                    <>
                                        <dd className="mt-1 text-2xl font-semibold tabular-nums">
                                            {eligible.length.toLocaleString("en-IN")}
                                            <span className="text-base font-normal text-slate-400"> of {students.length.toLocaleString("en-IN")}</span>
                                        </dd>
                                        <dd className={`mt-1 text-sm ${ineligibleCount > 0 ? "text-rose-300" : "text-slate-400"}`}>
                                            {ineligibleCount > 0 ? `${ineligibleCount} not eligible for exams` : "Everyone is eligible"}
                                        </dd>
                                    </>
                                )}
                            </div>
                        </dl>
                    </section>

                    {/* Step 2: exam dates */}
                    {examType && (
                        <Panel
                            title="Exam dates"
                            subtitle={scheduleSaved ? "These dates print on every admit card." : "Every subject needs a date before admit cards can be made."}
                            action={
                                scheduleSaved && subjects.length > 0 ? (
                                    <button type="button" onClick={() => setDraft({ key: scheduleKey, dates: { ...savedDates } })} className={secondaryBtn} disabled={busy}>
                                        <Pencil size={15} aria-hidden="true" />
                                        Edit dates
                                    </button>
                                ) : undefined
                            }
                        >
                            {scheduleLoading ? (
                                <div className="space-y-3 px-4 py-5 sm:px-6">
                                    {[0, 1, 2].map((i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : subjectsQ.isError || scheduleQ.isError ? (
                                <EmptyState
                                    icon={<CalendarDays size={32} />}
                                    title="Exam dates didn't load."
                                    hint="Check your connection, then try again."
                                    action={
                                        <button type="button" onClick={() => (subjectsQ.isError ? subjectsQ.refetch() : scheduleQ.refetch())} className={secondaryBtn}>
                                            Try again
                                        </button>
                                    }
                                />
                            ) : subjects.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarDays size={32} />}
                                    title="This class has no subjects yet."
                                    hint="Add subjects from the class's settings on the Classrooms page, then come back to set exam dates."
                                    action={
                                        <Link href="/principal" className={linkClass}>
                                            Go to Classrooms
                                        </Link>
                                    }
                                />
                            ) : (
                                <>
                                    <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
                                        {subjects.map((s) => {
                                            const value = dates[s.id] ?? "";
                                            return (
                                                <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
                                                    <label htmlFor={`date-${s.id}`} className="min-w-0 text-sm font-medium text-gray-900">
                                                        {s.name}
                                                        {s.teachers[0] && <span className="block text-xs font-normal text-gray-500">{s.teachers.map((t) => t.fullName).join(", ")}</span>}
                                                    </label>
                                                    {showDateInputs ? (
                                                        <input
                                                            id={`date-${s.id}`}
                                                            type="date"
                                                            value={value}
                                                            onChange={(e) => setDate(s.id, e.target.value)}
                                                            className={`${inputClass} h-10 w-full py-0 tabular-nums sm:w-48 ${value ? "" : "border-amber-300"}`}
                                                        />
                                                    ) : (
                                                        <span id={`date-${s.id}`} className="text-sm tabular-nums text-gray-700">
                                                            {value ? examDay(value) : "No date"}
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/60 px-4 py-4 sm:px-6">
                                        {showDateInputs ? (
                                            <>
                                                <p className="text-sm text-gray-500" aria-live="polite">
                                                    {scheduleComplete ? "All subjects have a date." : `${subjects.length - datesSet} subject${subjects.length - datesSet === 1 ? "" : "s"} still need${subjects.length - datesSet === 1 ? "s" : ""} a date.`}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {editing && hasPersistedSchedule && (
                                                        <button type="button" onClick={() => setDraft(null)} className={secondaryBtn} disabled={savingSchedule}>
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={saveSchedule} disabled={!scheduleComplete || savingSchedule} className={primaryBtn}>
                                                        {savingSchedule ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                                                        {savingSchedule ? "Saving…" : hasPersistedSchedule ? "Update exam dates" : "Save exam dates"}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="flex items-center gap-2 text-sm text-emerald-700">
                                                <CheckCircle2 size={16} aria-hidden="true" />
                                                Exam dates saved. Use Edit dates to change them.
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </Panel>
                    )}

                    {/* Step 3: students */}
                    <Panel
                        title="Students"
                        subtitle={classroom ? `${classroom.name}, in roll order` : undefined}
                        action={
                            eligible.length > 0 ? (
                                <button type="button" onClick={toggleAllEligible} className={secondaryBtn} disabled={busy}>
                                    {allEligibleSelected ? "Clear selection" : `Select all eligible (${eligible.length})`}
                                </button>
                            ) : undefined
                        }
                    >
                        <div className="flex flex-col gap-3 px-4 pb-4 pt-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                            <FilterChips<Eligibility>
                                label="Filter by exam eligibility"
                                value={eligibility}
                                onChange={(v) => {
                                    setEligibility(v);
                                    setPage(1);
                                }}
                                layoutId="admit-eligibility-chip"
                                options={[
                                    { value: "all", label: "All", count: students.length },
                                    { value: "eligible", label: "Eligible", count: eligible.length },
                                    { value: "ineligible", label: "Not eligible", count: ineligibleCount },
                                ]}
                            />
                            <SearchBox
                                id="admit-search"
                                label="Search students"
                                value={search}
                                onChange={(v) => {
                                    setSearch(v);
                                    setPage(1);
                                }}
                                placeholder="Search by name, admission or roll number"
                                className="w-full lg:w-80"
                            />
                        </div>

                        {blockedReason && students.length > 0 && (
                            <p className="mx-4 mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-100 sm:mx-6">
                                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                {blockedReason}
                            </p>
                        )}

                        {selectedIds.length > 0 && (
                            <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-purple-50 px-3 py-2.5 ring-1 ring-purple-100 sm:mx-6">
                                <p className="text-sm font-medium text-purple-900 tabular-nums" aria-live="polite">
                                    {bulk ? `Downloading ${Math.min(bulk.done + 1, bulk.total)} of ${bulk.total}…` : `${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"} selected`}
                                </p>
                                <button type="button" onClick={downloadSelected} disabled={!canAct || busy} className={primaryBtn}>
                                    {busy ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : <Download size={16} aria-hidden="true" />}
                                    Download {selectedIds.length} admit card{selectedIds.length === 1 ? "" : "s"}
                                </button>
                            </div>
                        )}

                        {studentsQ.isLoading ? (
                            <div className="space-y-3 border-t border-gray-100 px-4 py-5 sm:px-6">
                                {[0, 1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 w-full" />
                                ))}
                            </div>
                        ) : studentsQ.isError ? (
                            <EmptyState
                                icon={<Users size={32} />}
                                title="Students didn't load."
                                hint="Check your connection, then try again."
                                action={
                                    <button type="button" onClick={() => studentsQ.refetch()} className={secondaryBtn}>
                                        Try again
                                    </button>
                                }
                            />
                        ) : students.length === 0 ? (
                            <EmptyState icon={<Users size={32} />} title="No students in this class yet." hint="Admit students from the class's page on Classrooms." />
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                icon={<Users size={32} />}
                                title="No students match."
                                hint="Try a different name or number, or show all students."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setEligibility("all");
                                        }}
                                        className={secondaryBtn}
                                    >
                                        Show all students
                                    </button>
                                }
                            />
                        ) : (
                            <>
                                {/* Cards below xl */}
                                <ul className="divide-y divide-gray-100 border-t border-gray-100 xl:hidden">
                                    {pageRows.map((s) => (
                                        <li key={s.id} className="flex items-start gap-3 px-4 py-4 sm:px-6">
                                            <SelectBox student={s} checked={selectedSet.has(s.id)} onToggle={toggleStudent} disabled={busy} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <p className="truncate text-sm font-medium text-gray-900">{s.fullName}</p>
                                                    <EligibilityBadge eligible={s.examEligibility === true} />
                                                </div>
                                                <p className="mt-0.5 text-xs tabular-nums text-gray-500">
                                                    Roll {s.classRoll ?? s.rollNumber ?? "not set"}, admission no. {s.admissionNo}
                                                </p>
                                                <RowActions
                                                    student={s}
                                                    canAct={canAct && !busy}
                                                    downloading={downloadingId === s.id}
                                                    onPreview={() => setPreviewStudent(s)}
                                                    onDownload={() => downloadOne(s)}
                                                    className="mt-3"
                                                />
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Table from xl */}
                                <div className="hidden border-t border-gray-100 xl:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500">
                                            <tr>
                                                <th scope="col" className="w-12 py-3 pl-6 pr-2">
                                                    <span className="sr-only">Select</span>
                                                </th>
                                                <th scope="col" className="w-20 px-3 py-3 font-medium">Roll</th>
                                                <th scope="col" className="px-3 py-3 font-medium">Student</th>
                                                <th scope="col" className="px-3 py-3 font-medium">Admission no.</th>
                                                <th scope="col" className="px-3 py-3 font-medium">Exam eligibility</th>
                                                <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pageRows.map((s) => (
                                                <tr key={s.id} className={selectedSet.has(s.id) ? "bg-purple-50/40" : "hover:bg-gray-50/60"}>
                                                    <td className="py-3 pl-6 pr-2">
                                                        <SelectBox student={s} checked={selectedSet.has(s.id)} onToggle={toggleStudent} disabled={busy} />
                                                    </td>
                                                    <td className="px-3 py-3 tabular-nums text-gray-700">{s.classRoll ?? s.rollNumber ?? "–"}</td>
                                                    <td className="px-3 py-3 font-medium text-gray-900">{s.fullName}</td>
                                                    <td className="px-3 py-3 tabular-nums text-gray-600">{s.admissionNo}</td>
                                                    <td className="px-3 py-3">
                                                        <EligibilityBadge eligible={s.examEligibility === true} />
                                                    </td>
                                                    <td className="py-3 pl-3 pr-6">
                                                        <RowActions
                                                            student={s}
                                                            canAct={canAct && !busy}
                                                            downloading={downloadingId === s.id}
                                                            onPreview={() => setPreviewStudent(s)}
                                                            onDownload={() => downloadOne(s)}
                                                            className="justify-end"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Pager total={filtered.length} page={current} pageCount={pageCount} onPage={setPage} />
                            </>
                        )}

                        {ineligibleCount > 0 && classroomId && (
                            <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-6">
                                Students who aren&apos;t eligible can&apos;t get an admit card. You can change a student&apos;s eligibility from their details on the{" "}
                                <Link href={`/principal/classroom/${classroomId}`} className={linkClass}>
                                    class page
                                </Link>
                                .
                            </p>
                        )}
                    </Panel>
                </>
            )}

            <PreviewDialog
                student={previewStudent}
                examType={examType}
                classroomName={classroom?.name ?? ""}
                onClose={() => setPreviewStudent(null)}
                downloading={previewStudent !== null && downloadingId === previewStudent.id}
                onDownload={() => previewStudent && downloadOne(previewStudent)}
            />
        </div>
    );
}

// ─── Pieces ──────────────────────────────────────────────────────────

function SelectBox({ student, checked, onToggle, disabled }: { student: ClassroomStudent; checked: boolean; onToggle: (id: string) => void; disabled: boolean }) {
    const ineligible = student.examEligibility !== true;
    return (
        <input
            type="checkbox"
            checked={checked}
            disabled={ineligible || disabled}
            onChange={() => onToggle(student.id)}
            aria-label={ineligible ? `${student.fullName} isn't eligible for exams` : `Select ${student.fullName}`}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-purple-600 accent-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        />
    );
}

function EligibilityBadge({ eligible }: { eligible: boolean }) {
    return eligible ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
            <CheckCircle2 size={12} aria-hidden="true" />
            Eligible
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-100">
            <AlertTriangle size={12} aria-hidden="true" />
            Not eligible
        </span>
    );
}

function RowActions({
    student,
    canAct,
    downloading,
    onPreview,
    onDownload,
    className = "",
}: {
    student: ClassroomStudent;
    canAct: boolean;
    downloading: boolean;
    onPreview: () => void;
    onDownload: () => void;
    className?: string;
}) {
    const disabled = !canAct || student.examEligibility !== true;
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            <button type="button" onClick={onPreview} disabled={disabled} aria-label={`Preview admit card for ${student.fullName}`} className={secondaryBtn}>
                <Eye size={15} aria-hidden="true" />
                Preview
            </button>
            <button type="button" onClick={onDownload} disabled={disabled || downloading} aria-label={`Download admit card for ${student.fullName}`} className={secondaryBtn}>
                {downloading ? <Loader2 size={15} aria-hidden="true" className="motion-safe:animate-spin" /> : <Download size={15} aria-hidden="true" />}
                PDF
            </button>
        </div>
    );
}

function PreviewDialog({
    student,
    examType,
    classroomName,
    onClose,
    downloading,
    onDownload,
}: {
    student: ClassroomStudent | null;
    examType: ExamType | "";
    classroomName: string;
    onClose: () => void;
    downloading: boolean;
    onDownload: () => void;
}) {
    const titleId = useId();
    const previewQ = useGetStudentAdmitCardPreviewQuery({ studentId: student?.id ?? "", examType }, { skip: !student || !examType });
    const svg = previewQ.data?.svg;

    return (
        <Dialog open={student !== null} onClose={onClose} labelledBy={titleId} className="sm:max-w-3xl">
            {student && (
                <>
                    <DialogHeader id={titleId} title={`Admit card for ${student.fullName}`} subtitle={`${examLong(examType)}, ${classroomName}`} onClose={onClose} accent="purple" />
                    <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
                        {previewQ.isFetching ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-gray-500">
                                <Loader2 size={24} aria-hidden="true" className="text-purple-600 motion-safe:animate-spin" />
                                Preparing the preview…
                            </div>
                        ) : previewQ.isError ? (
                            <EmptyState
                                icon={<FileText size={32} />}
                                title="The preview didn't load."
                                hint={errorMessage(previewQ.error, "Check that the exam dates are saved, then try again.")}
                                action={
                                    <button type="button" onClick={() => previewQ.refetch()} className={secondaryBtn}>
                                        Try again
                                    </button>
                                }
                            />
                        ) : svg ? (
                            <div
                                role="img"
                                aria-label={`Admit card preview for ${student.fullName}`}
                                className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 [&>svg]:h-auto [&>svg]:w-full"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        ) : (
                            <EmptyState icon={<FileText size={32} />} title="No preview is available for this student." hint="You can still download the PDF." />
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
                        <button type="button" onClick={onClose} className={`${secondaryBtn} h-10`}>
                            Close
                        </button>
                        <button type="button" onClick={onDownload} disabled={downloading} className={primaryBtn}>
                            {downloading ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : <Download size={16} aria-hidden="true" />}
                            Download PDF
                        </button>
                    </div>
                </>
            )}
        </Dialog>
    );
}
