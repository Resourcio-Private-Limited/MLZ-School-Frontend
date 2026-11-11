"use client";

import { use, useId, useMemo, useState } from "react";
import { CheckCircle2, CircleDashed, Circle, ClipboardEdit, Eye, FileSpreadsheet, Lock, MessageSquareText } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetClassAssessmentsQuery,
    useGetTeacherClassesQuery,
    useSaveStudentAssessmentMutation,
    type ClassAssessmentStudent,
    type ClassAssessments,
    type ExamTerm,
    type PrimaryGradeCode,
    type PrimaryGradeField,
    type SecondaryComponentKey,
    type SubjectAssessmentEntry,
} from "@/redux/api/teacherApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "@/components/teacher/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    Panel,
    SearchBox,
    Skeleton,
    Tabs,
    errorMessage,
    focusRing,
    inputClass,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/teacher/ui";

// Marks are stored per subject and component (SubjectAssessment). Primary classes get grades
// (Half yearly: terms 1 and 2, Final: term 3); secondary classes get four components out of 100.
const EXAM_TERMS: { key: ExamTerm; label: string }[] = [
    { key: "HALF_YEARLY", label: "Half yearly" },
    { key: "FINAL", label: "Final" },
];

type Progress = "complete" | "partial" | "empty";
type ProgressFilter = "all" | Progress;

/** A subject is complete when every grade or component for the exam is filled. */
function subjectProgress(entry: SubjectAssessmentEntry | undefined, data: ClassAssessments): Progress {
    if (!entry) return "empty";
    const values = data.classType === "PRIMARY" ? data.gradeFields.map((f) => entry[f.key]) : data.components.map((c) => entry[c.key]);
    const filled = values.filter((v) => v != null).length;
    if (filled === 0) return "empty";
    return filled === values.length ? "complete" : "partial";
}

function studentSummary(student: ClassAssessmentStudent, data: ClassAssessments) {
    const byId = new Map(student.assessments.map((e) => [e.subjectId, e]));
    const states = data.subjects.map((s) => subjectProgress(byId.get(s.id), data));
    const completed = states.filter((s) => s === "complete").length;
    const started = states.some((s) => s !== "empty");
    const totals = student.assessments.map((e) => e.total).filter((t): t is number => t != null);
    const state: Progress = data.subjects.length > 0 && completed === data.subjects.length ? "complete" : started ? "partial" : "empty";
    return { completed, state, obtained: totals.reduce((a, b) => a + b, 0), hasTotals: totals.length > 0 };
}

const formatMarks = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, ""));

// Roll order: class roll first, then the roll number as text, then name.
function byRoll(a: ClassAssessmentStudent, b: ClassAssessmentStudent) {
    const ra = a.classRoll ?? Number.MAX_SAFE_INTEGER;
    const rb = b.classRoll ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return (a.rollNumber ?? "").localeCompare(b.rollNumber ?? "", "en-IN", { numeric: true }) || a.fullName.localeCompare(b.fullName);
}

export default function ClassExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [examType, setExamType] = useState<ExamTerm>("HALF_YEARLY");
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<ProgressFilter>("all");
    const [page, setPage] = useState(1);
    const [activeId, setActiveId] = useState<string | null>(null);

    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    // Always refetch, so a marks-entry switch the principal just changed is picked up.
    const { data, isLoading, isFetching, isError, refetch } = useGetClassAssessmentsQuery({ classroomId, examType }, { refetchOnMountOrArgChange: true });

    const className = data?.classroomName ?? myClasses.find((c) => c.id === classroomId)?.name ?? "Classroom";
    const examLabel = EXAM_TERMS.find((t) => t.key === examType)?.label ?? "";
    const isPrimary = data?.classType === "PRIMARY";

    const students = useMemo(() => [...(data?.students ?? [])].sort(byRoll), [data]);
    const summaries = useMemo(() => new Map(students.map((s) => [s.studentId, studentSummary(s, data!)])), [students, data]);
    const counts = useMemo(() => {
        const c = { all: students.length, complete: 0, partial: 0, empty: 0 };
        for (const s of summaries.values()) c[s.state]++;
        return c;
    }, [students, summaries]);
    const editableSubjects = data?.subjects.filter((s) => s.editable).length ?? 0;

    const q = query.trim().toLowerCase();
    const rows = students.filter(
        (s) => (filter === "all" || summaries.get(s.studentId)?.state === filter) && (!q || s.fullName.toLowerCase().includes(q) || String(s.classRoll ?? s.rollNumber ?? "").toLowerCase().includes(q))
    );
    const { pageCount, current, pageRows } = paginate(rows, page);
    const active = students.find((s) => s.studentId === activeId) ?? null;
    const nextAfter = (id: string) => rows[rows.findIndex((s) => s.studentId === id) + 1] ?? null;
    const maxTotal = (data?.subjectMaxMarks ?? 0) * (data?.subjects.length ?? 0);

    const changeExam = (v: ExamTerm) => {
        setExamType(v);
        setActiveId(null);
        setPage(1);
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Exam marks"
                crumb={{ href: `/teacher/classroom/${classroomId}`, label: className }}
                subtitle={data ? `${isPrimary ? "Primary class, entered as grades" : "Secondary class, entered as marks"}. Session ${data.session}.` : "Enter half-yearly and final marks for each student."}
            />

            <div className="border-b border-gray-200">
                <Tabs label="Exam" value={examType} onChange={changeExam} layoutId="teacher-exam-term" tabs={EXAM_TERMS} />
            </div>

            {data && !data.entryEnabled && (
                <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                    <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                    The principal hasn&apos;t opened marks entry for the {examLabel.toLowerCase()} exam. You can see the marks already entered, but you can&apos;t change them until it opens.
                </p>
            )}

            {/* Headline: how far the class has got for this exam */}
            <section aria-labelledby="marks-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 pt-5 sm:px-6">
                    <h2 id="marks-summary" className="text-base font-semibold">{examLabel} exam</h2>
                    {data && (
                        <p className="text-sm text-slate-300">
                            {data.subjects.length} {data.subjects.length === 1 ? "subject" : "subjects"}
                            {data.isClassTeacher ? ", you can enter all of them" : `, you can enter ${editableSubjects}`}
                        </p>
                    )}
                </div>
                <dl className="grid grid-cols-2 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-4">
                    <Figure label="Students" value={counts.all} loading={isLoading} />
                    <Figure label="Completed" value={counts.complete} loading={isLoading} tone="text-emerald-300" />
                    <Figure label="In progress" value={counts.partial} loading={isLoading} tone={counts.partial ? "text-amber-300" : undefined} />
                    <Figure label="Not started" value={counts.empty} loading={isLoading} />
                </dl>
            </section>

            {data && isPrimary && <GradeLegend options={data.gradeOptions} />}

            <Panel title="Students" subtitle="Open a student to enter marks for every subject you teach. You can save part of it now and finish later.">
                <div className="space-y-3 px-4 pb-4 pt-4 sm:px-6">
                    <SearchBox id="exam-marks-search" label="Search students" value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or roll number" className="sm:max-w-sm" />
                    <FilterChips<ProgressFilter>
                        label="Filter by progress"
                        value={filter}
                        onChange={(v) => { setFilter(v); setPage(1); }}
                        layoutId="exam-marks-filter"
                        options={[
                            { value: "all", label: "All", count: counts.all },
                            { value: "empty", label: "Not started", count: counts.empty },
                            { value: "partial", label: "In progress", count: counts.partial },
                            { value: "complete", label: "Completed", count: counts.complete },
                        ]}
                    />
                </div>

                {isLoading ? (
                    <div className="space-y-3 border-t border-gray-200 px-4 py-4 sm:px-6">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-12 w-full" />)}
                    </div>
                ) : isError || !data ? (
                    <EmptyState
                        icon={<FileSpreadsheet size={28} />}
                        title="Marks for this class couldn't be loaded."
                        hint="Check your connection, then try again."
                        action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                    />
                ) : data.subjects.length === 0 ? (
                    <EmptyState icon={<FileSpreadsheet size={28} />} title="No subjects in this class yet." hint="The principal adds subjects to a class. Marks can be entered once they exist." />
                ) : students.length === 0 ? (
                    <EmptyState title="No students in this class." hint="Students show here once the principal admits them." />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title="No students match."
                        hint="Try another name or progress filter."
                        action={<button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className={secondaryBtn}>Clear filters</button>}
                    />
                ) : (
                    <>
                        {/* Cards below xl */}
                        <ul className={`divide-y divide-gray-100 border-t border-gray-200 xl:hidden ${isFetching ? "opacity-60" : ""}`}>
                            {pageRows.map((s) => {
                                const sum = summaries.get(s.studentId)!;
                                return (
                                    <li key={s.studentId} className="px-4 py-4 sm:px-6">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900">{s.fullName}</p>
                                                <p className="text-sm tabular-nums text-gray-500">Roll {s.classRoll ?? s.rollNumber ?? "not set"}</p>
                                            </div>
                                            <ProgressBadge state={sum.state} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
                                                <SubjectsDone done={sum.completed} total={data.subjects.length} />
                                                {!isPrimary && sum.hasTotals && (
                                                    <span className="tabular-nums">
                                                        <span className="font-semibold text-gray-900">{formatMarks(sum.obtained)}</span> of {maxTotal}
                                                    </span>
                                                )}
                                                {data.showRemarks && s.remarks && (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700">
                                                        <MessageSquareText size={14} aria-hidden="true" />
                                                        Remarks added
                                                    </span>
                                                )}
                                            </div>
                                            <OpenButton student={s} canEdit={data.entryEnabled} onOpen={() => setActiveId(s.studentId)} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Table from xl up */}
                        <div className={`relative hidden overflow-x-auto border-t border-gray-200 xl:block ${isFetching ? "opacity-60" : ""}`}>
                            <table className="w-full text-left text-sm">
                                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                                    <tr>
                                        <th scope="col" aria-sort="ascending" className="py-3 pl-6 pr-3 font-medium">Roll</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Student</th>
                                        <th scope="col" className="px-3 py-3 font-medium">Subjects done</th>
                                        {!isPrimary && <th scope="col" className="px-3 py-3 text-right font-medium">Total</th>}
                                        {data.showRemarks && <th scope="col" className="px-3 py-3 font-medium">Remarks</th>}
                                        <th scope="col" className="px-3 py-3 font-medium">Status</th>
                                        <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((s) => {
                                        const sum = summaries.get(s.studentId)!;
                                        return (
                                            <tr key={s.studentId} className="hover:bg-gray-50/70">
                                                <td className="py-3 pl-6 pr-3 tabular-nums text-gray-900">{s.classRoll ?? s.rollNumber ?? <span className="text-gray-400">None</span>}</td>
                                                <td className="px-3 py-3 font-medium text-gray-900">{s.fullName}</td>
                                                <td className="px-3 py-3"><SubjectsDone done={sum.completed} total={data.subjects.length} /></td>
                                                {!isPrimary && (
                                                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-gray-700">
                                                        {sum.hasTotals ? <><span className="font-semibold text-gray-900">{formatMarks(sum.obtained)}</span> / {maxTotal}</> : <span className="text-gray-400">None</span>}
                                                    </td>
                                                )}
                                                {data.showRemarks && (
                                                    <td className="px-3 py-3 text-gray-600">{s.remarks ? "Added" : <span className="text-gray-400">None</span>}</td>
                                                )}
                                                <td className="px-3 py-3"><ProgressBadge state={sum.state} /></td>
                                                <td className="py-3 pl-3 pr-6 text-right"><OpenButton student={s} canEdit={data.entryEnabled} onOpen={() => setActiveId(s.studentId)} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </Panel>

            <Dialog open={!!(data && active)} onClose={() => setActiveId(null)} labelledBy="marks-dialog-title" className="sm:max-w-4xl">
                {data && active && (
                    <MarksForm
                        key={`${active.studentId}:${examType}`}
                        data={data}
                        student={active}
                        examLabel={examLabel}
                        next={nextAfter(active.studentId)}
                        onClose={() => setActiveId(null)}
                        onNext={(id) => setActiveId(id)}
                    />
                )}
            </Dialog>
        </div>
    );
}

// ─── Marks dialog ──────────────────────────────────────────────────

type DraftRow = Record<PrimaryGradeField, PrimaryGradeCode | ""> & Record<SecondaryComponentKey, string>;

function toDraft(entry: SubjectAssessmentEntry | undefined): DraftRow {
    const text = (v: number | null | undefined) => (v == null ? "" : String(v));
    return {
        term1Grade: entry?.term1Grade ?? "",
        term2Grade: entry?.term2Grade ?? "",
        term3Grade: entry?.term3Grade ?? "",
        periodicTest: text(entry?.periodicTest),
        multipleAssessment: text(entry?.multipleAssessment),
        subjectEnrichment: text(entry?.subjectEnrichment),
        examMarks: text(entry?.examMarks),
    };
}

/** null for empty, NaN for out of range, otherwise the number. */
function parseMarks(value: string, max: number): number | null {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : NaN;
}

function MarksForm({
    data,
    student,
    examLabel,
    next,
    onClose,
    onNext,
}: {
    data: ClassAssessments;
    student: ClassAssessmentStudent;
    examLabel: string;
    next: ClassAssessmentStudent | null;
    onClose: () => void;
    onNext: (studentId: string) => void;
}) {
    const uid = useId();
    const isPrimary = data.classType === "PRIMARY";
    const readOnly = !data.entryEnabled;
    const initial = useMemo(() => {
        const byId = new Map(student.assessments.map((e) => [e.subjectId, e]));
        return Object.fromEntries(data.subjects.map((s) => [s.id, toDraft(byId.get(s.id))])) as Record<string, DraftRow>;
    }, [data.subjects, student.assessments]);
    const [drafts, setDrafts] = useState(initial);
    const [remarks, setRemarks] = useState(student.remarks ?? "");
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [save, { isLoading: saving }] = useSaveStudentAssessmentMutation();

    const dirty = JSON.stringify(drafts) !== JSON.stringify(initial) || (data.showRemarks && remarks !== (student.remarks ?? ""));
    const invalid = !isPrimary && data.subjects.some((s) => data.components.some((c) => Number.isNaN(parseMarks(drafts[s.id][c.key], c.maxMarks))));

    const update = (subjectId: string, field: keyof DraftRow, value: string) => setDrafts((d) => ({ ...d, [subjectId]: { ...d[subjectId], [field]: value } }));
    const subjectTotal = (subjectId: string) => {
        const values = data.components.map((c) => parseMarks(drafts[subjectId][c.key], c.maxMarks)).filter((v): v is number => v != null && !Number.isNaN(v));
        return values.length ? values.reduce((a, b) => a + b, 0) : null;
    };
    const grandTotal = data.subjects.reduce((sum, s) => sum + (subjectTotal(s.id) ?? 0), 0);

    const requestClose = () => (dirty && !readOnly ? setConfirmDiscard(true) : onClose());

    const submit = async (goNext: boolean) => {
        if (readOnly || invalid) return;
        const subjects = data.subjects
            .filter((s) => s.editable)
            .map((s) => {
                const d = drafts[s.id];
                return isPrimary
                    ? { subjectId: s.id, ...Object.fromEntries(data.gradeFields.map((f) => [f.key, d[f.key] || null])) }
                    : { subjectId: s.id, ...Object.fromEntries(data.components.map((c) => [c.key, parseMarks(d[c.key], c.maxMarks)])) };
            });
        try {
            await save({ classroomId: data.classroomId, examType: data.examType, studentId: student.studentId, subjects, ...(data.showRemarks ? { remarks: remarks.trim() || null } : {}) }).unwrap();
            toast.success(`Marks saved for ${student.fullName}.`);
            if (goNext && next) onNext(next.studentId);
            else onClose();
        } catch (err) {
            toast.error(errorMessage(err, "Marks not saved. Check your connection and try again."));
        }
    };

    const fieldClass = `${inputClass} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 disabled:opacity-70`;

    return (
        <>
            <DialogHeader
                id="marks-dialog-title"
                title={student.fullName}
                subtitle={`${examLabel} exam${student.classRoll != null ? `, roll ${student.classRoll}` : ""}, ${data.subjects.length} ${data.subjects.length === 1 ? "subject" : "subjects"}`}
                onClose={requestClose}
                accent="emerald"
            />
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                {readOnly && (
                    <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
                        <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                        Marks entry is closed for this exam, so these are the saved marks only.
                    </p>
                )}

                <ul className="space-y-3">
                    {data.subjects.map((s) => {
                        const d = drafts[s.id];
                        const disabled = readOnly || !s.editable;
                        const total = isPrimary ? null : subjectTotal(s.id);
                        return (
                            <li key={s.id} className={`rounded-lg border px-4 py-3 ${s.editable ? "border-gray-200" : "border-gray-100 bg-gray-50"}`}>
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                    <p className="font-medium text-gray-900">{s.name}</p>
                                    {!s.editable ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                            <Lock size={12} aria-hidden="true" />
                                            Another teacher&apos;s subject
                                        </span>
                                    ) : (
                                        !isPrimary && (
                                            <span className="text-sm tabular-nums text-gray-500">
                                                Total <span className="font-semibold text-gray-900">{total == null ? "–" : formatMarks(total)}</span> of {data.subjectMaxMarks}
                                            </span>
                                        )
                                    )}
                                </div>
                                <div className={`mt-3 grid gap-3 ${isPrimary ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
                                    {isPrimary
                                        ? data.gradeFields.map((f) => (
                                              <div key={f.key}>
                                                  <label htmlFor={`${uid}-${s.id}-${f.key}`} className="block text-sm text-gray-600">{f.label}</label>
                                                  <select id={`${uid}-${s.id}-${f.key}`} value={d[f.key]} disabled={disabled} onChange={(e) => update(s.id, f.key, e.target.value)} className={`${fieldClass} mt-1`}>
                                                      <option value="">Not graded</option>
                                                      {data.gradeOptions.map((g) => (
                                                          <option key={g.code} value={g.code}>{g.code}, {g.label.toLowerCase()}</option>
                                                      ))}
                                                  </select>
                                              </div>
                                          ))
                                        : data.components.map((c) => {
                                              const bad = Number.isNaN(parseMarks(d[c.key], c.maxMarks));
                                              const id = `${uid}-${s.id}-${c.key}`;
                                              return (
                                                  <div key={c.key}>
                                                      <label htmlFor={id} className="block text-sm text-gray-600">
                                                          {c.label} <span className="text-gray-400">/ {c.maxMarks}</span>
                                                      </label>
                                                      <input
                                                          id={id}
                                                          type="number"
                                                          inputMode="decimal"
                                                          min={0}
                                                          max={c.maxMarks}
                                                          step="0.5"
                                                          value={d[c.key]}
                                                          disabled={disabled}
                                                          onChange={(e) => update(s.id, c.key, e.target.value)}
                                                          aria-invalid={bad || undefined}
                                                          aria-describedby={bad ? `${id}-err` : undefined}
                                                          className={`${fieldClass} mt-1 tabular-nums ${bad ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                                                      />
                                                      {bad && <p id={`${id}-err`} className="mt-1 text-xs font-medium text-red-700">Enter 0 to {c.maxMarks}.</p>}
                                                  </div>
                                              );
                                          })}
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {!isPrimary && (
                    <p className="flex justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
                        <span className="font-medium">Grand total</span>
                        <span className="tabular-nums">
                            <span className="font-semibold">{formatMarks(grandTotal)}</span> of {(data.subjectMaxMarks ?? 0) * data.subjects.length}
                        </span>
                    </p>
                )}

                {data.showRemarks && (
                    <div>
                        <label htmlFor={`${uid}-remarks`} className="block text-sm font-medium text-gray-700">Class teacher&apos;s remarks</label>
                        <textarea
                            id={`${uid}-remarks`}
                            value={remarks}
                            disabled={readOnly}
                            maxLength={1000}
                            rows={3}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Overall remarks on the student's year"
                            className={`${fieldClass} mt-1.5`}
                        />
                        <p className="mt-1 text-right text-xs tabular-nums text-gray-500">{remarks.length}/1000</p>
                    </div>
                )}

                {!readOnly && <p className="text-xs text-gray-500">Every field is optional. Save what you have and finish the rest later; clearing a field removes that mark.</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                {confirmDiscard ? (
                    <>
                        <p className="text-sm text-gray-700 sm:mr-auto">You have unsaved changes.</p>
                        <button type="button" onClick={() => setConfirmDiscard(false)} className={secondaryBtn}>Keep editing</button>
                        <button type="button" onClick={onClose} className={`${secondaryBtn} border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50`}>Discard changes</button>
                    </>
                ) : readOnly ? (
                    <button type="button" onClick={onClose} className={secondaryBtn}>Close</button>
                ) : (
                    <>
                        <button type="button" onClick={requestClose} className={secondaryBtn}>Cancel</button>
                        {next && (
                            <button type="button" onClick={() => submit(true)} disabled={saving || invalid} className={secondaryBtn}>
                                Save and next
                            </button>
                        )}
                        <button type="button" onClick={() => submit(false)} disabled={saving || invalid || !dirty} className={primaryBtn}>
                            {saving ? "Saving…" : "Save marks"}
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

// ─── Small pieces ──────────────────────────────────────────────────

function Figure({ label, value, loading, tone }: { label: string; value: number; loading: boolean; tone?: string }) {
    return (
        <div>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${tone ?? ""}`}>{loading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : value.toLocaleString("en-IN")}</dd>
        </div>
    );
}

function GradeLegend({ options }: { options: ClassAssessments["gradeOptions"] }) {
    return (
        <section aria-labelledby="grade-scale" className="rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
            <h2 id="grade-scale" className="text-sm font-semibold text-gray-900">Grading scale for primary classes</h2>
            <dl className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {options.map((g) => (
                    <div key={g.code} className="flex gap-3">
                        <dt className="w-8 shrink-0 font-semibold text-gray-900">{g.code}</dt>
                        <dd className="text-gray-600">{g.label.charAt(0) + g.label.slice(1).toLowerCase()}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function SubjectsDone({ done, total }: { done: number; total: number }) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
        <span className="inline-flex items-center gap-2">
            <span role="meter" aria-label="Subjects completed" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-sm tabular-nums text-gray-600">{done} of {total}</span>
        </span>
    );
}

/** Completed / In progress / Not started, always with an icon and a word. */
function ProgressBadge({ state }: { state: Progress }) {
    const map = {
        complete: { label: "Completed", cls: "bg-emerald-50 text-emerald-800 ring-emerald-100", Icon: CheckCircle2 },
        partial: { label: "In progress", cls: "bg-amber-50 text-amber-800 ring-amber-100", Icon: CircleDashed },
        empty: { label: "Not started", cls: "bg-gray-100 text-gray-600 ring-gray-200", Icon: Circle },
    } as const;
    const { label, cls, Icon } = map[state];
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
            <Icon size={13} aria-hidden="true" />
            {label}
        </span>
    );
}

function OpenButton({ student, canEdit, onOpen }: { student: ClassAssessmentStudent; canEdit: boolean; onOpen: () => void }) {
    return (
        <button type="button" onClick={onOpen} aria-label={`${canEdit ? "Enter marks for" : "View marks for"} ${student.fullName}`} className={`${secondaryBtn} h-8 whitespace-nowrap ${focusRing}`}>
            {canEdit ? <ClipboardEdit size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
            {canEdit ? "Enter marks" : "View"}
        </button>
    );
}
