"use client";

import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, ClipboardEdit, Eye, FileSpreadsheet, Lock, MessageSquareText, Save, X } from "lucide-react";
import {
    ClassAssessmentStudent,
    ClassAssessments,
    ExamTerm,
    PrimaryGradeCode,
    PrimaryGradeField,
    SecondaryComponentKey,
    SubjectAssessmentEntry,
    useGetClassAssessmentsQuery,
    useSaveStudentAssessmentMutation,
} from "@/redux/api/teacherApi";

const EXAM_TERMS: Array<{ value: ExamTerm; label: string }> = [
    { value: "HALF_YEARLY", label: "Half Yearly" },
    { value: "FINAL", label: "Final" },
];

type ProgressState = "complete" | "partial" | "empty";

/** A subject is complete when every grade / component for the term is filled. */
function subjectProgress(entry: SubjectAssessmentEntry | undefined, data: ClassAssessments): ProgressState {
    if (!entry) return "empty";
    const values = data.classType === "PRIMARY"
        ? data.gradeFields.map((field) => entry[field.key])
        : data.components.map((component) => entry[component.key]);
    const filled = values.filter((value) => value != null).length;
    if (filled === 0) return "empty";
    return filled === values.length ? "complete" : "partial";
}

function studentSummary(student: ClassAssessmentStudent, data: ClassAssessments) {
    const byId = new Map(student.assessments.map((entry) => [entry.subjectId, entry]));
    const states = data.subjects.map((subject) => subjectProgress(byId.get(subject.id), data));
    const completed = states.filter((state) => state === "complete").length;
    const started = states.some((state) => state !== "empty");
    const totals = student.assessments.map((entry) => entry.total).filter((total): total is number => total != null);
    return {
        completed,
        state: (data.subjects.length > 0 && completed === data.subjects.length ? "complete" : started ? "partial" : "empty") as ProgressState,
        obtained: totals.reduce((sum, total) => sum + total, 0),
        hasTotals: totals.length > 0,
    };
}

const formatMarks = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, ""));

export default function ExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [examType, setExamType] = useState<ExamTerm>("HALF_YEARLY");
    const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

    // Always refetch so a permission the principal just toggled is picked up.
    const { data, isLoading, isFetching, isError } = useGetClassAssessmentsQuery(
        { classroomId, examType },
        { refetchOnMountOrArgChange: true },
    );

    const summaries = useMemo(
        () => new Map((data?.students ?? []).map((student) => [student.studentId, studentSummary(student, data!)])),
        [data],
    );
    const counts = useMemo(() => {
        const values = [...summaries.values()];
        return {
            complete: values.filter((item) => item.state === "complete").length,
            partial: values.filter((item) => item.state === "partial").length,
            empty: values.filter((item) => item.state === "empty").length,
        };
    }, [summaries]);

    const activeStudent = data?.students.find((student) => student.studentId === activeStudentId) ?? null;
    const examLabel = EXAM_TERMS.find((term) => term.value === examType)?.label ?? "";
    const isPrimary = data?.classType === "PRIMARY";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <Link href={`/teacher/classroom/${classroomId}`} className="flex items-center gap-2 font-medium text-gray-600 transition-colors hover:text-emerald-600">
                        <ArrowLeft size={20} />
                        <span>Back to Classroom</span>
                    </Link>
                    <div className="hidden h-6 w-px bg-gray-300 sm:block" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Exam Marks</h1>
                        {data && <p className="text-sm text-gray-500">{data.classroomName} · {isPrimary ? "Primary (grades)" : "Secondary (marks)"} · Session {data.session}</p>}
                    </div>
                </div>

                <div role="tablist" aria-label="Exam" className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                    {EXAM_TERMS.map((term) => (
                        <button
                            key={term.value}
                            role="tab"
                            aria-selected={examType === term.value}
                            onClick={() => { setExamType(term.value); setActiveStudentId(null); }}
                            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${examType === term.value ? "bg-emerald-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}
                        >
                            {term.label} Exam
                        </button>
                    ))}
                </div>
            </div>

            {data && !data.entryEnabled && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <Lock size={20} className="mt-0.5 shrink-0" />
                    <p className="text-sm">The principal has not enabled marks entry for the <strong>{examLabel} exam</strong>. You can view the marks already entered, but changes cannot be saved until it is enabled.</p>
                </div>
            )}

            {data && isPrimary && <GradeLegend options={data.gradeOptions} />}

            {/* Statistics */}
            {data && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatCard label="Total Students" value={data.students.length} accent="border-blue-500" />
                    <StatCard label="Completed" value={counts.complete} accent="border-emerald-500" />
                    <StatCard label="In Progress" value={counts.partial} accent="border-amber-500" />
                    <StatCard label="Not Started" value={counts.empty} accent="border-gray-400" />
                </div>
            )}

            {/* Student list */}
            <div className="overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center gap-3 bg-linear-to-r from-emerald-600 to-teal-800 p-6 text-white">
                    <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm"><FileSpreadsheet size={24} /></div>
                    <div>
                        <h2 className="text-xl font-bold">{examLabel} Exam — Student Marks</h2>
                        <p className="text-sm text-emerald-100">
                            {data ? `${data.subjects.length} subject(s) · ` : ""}Open a student to enter marks for all subjects. Partial entries can be saved and completed later.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                        <p className="text-gray-500">Loading marks...</p>
                    </div>
                ) : isError || !data ? (
                    <div className="p-12 text-center text-gray-500">Unable to load marks for this classroom.</div>
                ) : data.subjects.length === 0 ? (
                    <EmptyState title="No subjects yet" text="Subjects must be added to this classroom before marks can be entered." />
                ) : data.students.length === 0 ? (
                    <EmptyState title="No students" text="There are no students in this classroom." />
                ) : (
                    <div className={`overflow-x-auto ${isFetching ? "opacity-60" : ""}`}>
                        <table className="w-full">
                            <thead className="border-b-2 border-gray-200 bg-gray-50">
                                <tr>
                                    <Th align="left">Roll No</Th>
                                    <Th align="left">Student Name</Th>
                                    <Th>Subjects Completed</Th>
                                    {!isPrimary && <Th>Total Marks</Th>}
                                    {data.showRemarks && <Th>Remarks</Th>}
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.students.map((student) => {
                                    const summary = summaries.get(student.studentId)!;
                                    const maxTotal = (data.subjectMaxMarks ?? 0) * data.subjects.length;
                                    return (
                                        <tr key={student.studentId} className="transition-colors hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{student.classRoll ?? student.rollNumber ?? "—"}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{student.fullName}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="mx-auto w-28">
                                                    <div className="mb-1 text-sm font-semibold text-gray-700">{summary.completed}/{data.subjects.length}</div>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(summary.completed / data.subjects.length) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            {!isPrimary && (
                                                <td className="whitespace-nowrap px-6 py-4 text-center text-sm">
                                                    {summary.hasTotals
                                                        ? <span className="font-semibold text-gray-900">{formatMarks(summary.obtained)}<span className="font-normal text-gray-500"> / {maxTotal}</span></span>
                                                        : <span className="text-gray-400">—</span>}
                                                </td>
                                            )}
                                            {data.showRemarks && (
                                                <td className="px-6 py-4 text-center">
                                                    {student.remarks
                                                        ? <MessageSquareText size={18} className="mx-auto text-emerald-600" aria-label="Remarks added" />
                                                        : <span className="text-sm text-gray-400">—</span>}
                                                </td>
                                            )}
                                            <td className="whitespace-nowrap px-6 py-4 text-center"><StatusBadge state={summary.state} /></td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setActiveStudentId(student.studentId)}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${data.entryEnabled ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                                                >
                                                    {data.entryEnabled ? <ClipboardEdit size={15} className="shrink-0" /> : <Eye size={15} className="shrink-0" />}
                                                    {data.entryEnabled ? "Enter Marks" : "View"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {data && activeStudent && (
                <StudentMarksModal
                    key={`${activeStudent.studentId}:${examType}`}
                    data={data}
                    student={activeStudent}
                    examLabel={examLabel}
                    onClose={() => setActiveStudentId(null)}
                />
            )}
        </div>
    );
}

// ─── Entry modal ───────────────────────────────────────────────────────────────

type DraftRow = Record<PrimaryGradeField, PrimaryGradeCode | ""> & Record<SecondaryComponentKey, string>;

function toDraft(entry: SubjectAssessmentEntry | undefined): DraftRow {
    const text = (value: number | null | undefined) => (value == null ? "" : String(value));
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

/** Returns null for empty, NaN for invalid, otherwise the number. */
function parseMarks(value: string, max: number): number | null {
    if (value.trim() === "") return null;
    const marks = Number(value);
    return Number.isFinite(marks) && marks >= 0 && marks <= max ? marks : NaN;
}

function StudentMarksModal({ data, student, examLabel, onClose }: {
    data: ClassAssessments;
    student: ClassAssessmentStudent;
    examLabel: string;
    onClose: () => void;
}) {
    const isPrimary = data.classType === "PRIMARY";
    const readOnly = !data.entryEnabled;
    const initialDrafts = useMemo(() => {
        const byId = new Map(student.assessments.map((entry) => [entry.subjectId, entry]));
        return Object.fromEntries(data.subjects.map((subject) => [subject.id, toDraft(byId.get(subject.id))])) as Record<string, DraftRow>;
    }, [data.subjects, student.assessments]);
    const [drafts, setDrafts] = useState(initialDrafts);
    const [remarks, setRemarks] = useState(student.remarks ?? "");
    const [saveAssessment, { isLoading: isSaving }] = useSaveStudentAssessmentMutation();

    const isDirty = JSON.stringify(drafts) !== JSON.stringify(initialDrafts) || (data.showRemarks && remarks !== (student.remarks ?? ""));
    const hasInvalid = !isPrimary && data.subjects.some((subject) =>
        data.components.some((component) => Number.isNaN(parseMarks(drafts[subject.id][component.key], component.maxMarks))));

    const requestClose = () => {
        if (isDirty && !window.confirm("Discard unsaved changes?")) return;
        onClose();
    };

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") requestClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const update = (subjectId: string, field: keyof DraftRow, value: string) =>
        setDrafts((current) => ({ ...current, [subjectId]: { ...current[subjectId], [field]: value } }));

    const subjectTotal = (subjectId: string) => {
        const values = data.components
            .map((component) => parseMarks(drafts[subjectId][component.key], component.maxMarks))
            .filter((value): value is number => value != null && !Number.isNaN(value));
        return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
    };
    const grandTotal = isPrimary ? null : data.subjects.reduce((sum, subject) => sum + (subjectTotal(subject.id) ?? 0), 0);

    const handleSave = async () => {
        if (readOnly || hasInvalid) return;
        const subjects = data.subjects.filter((subject) => subject.editable).map((subject) => {
            const draft = drafts[subject.id];
            return isPrimary
                ? { subjectId: subject.id, ...Object.fromEntries(data.gradeFields.map((field) => [field.key, draft[field.key] || null])) }
                : {
                    subjectId: subject.id,
                    ...Object.fromEntries(data.components.map((component) => [component.key, parseMarks(draft[component.key], component.maxMarks)])),
                };
        });
        try {
            await saveAssessment({
                classroomId: data.classroomId,
                examType: data.examType,
                studentId: student.studentId,
                subjects,
                ...(data.showRemarks ? { remarks: remarks.trim() || null } : {}),
            }).unwrap();
            toast.success(`Marks saved for ${student.fullName}`);
            onClose();
        } catch (err: unknown) {
            const message = (err as { data?: { message?: string | string[] } })?.data?.message;
            toast.error((Array.isArray(message) ? message.join(", ") : message) ?? "Failed to save marks");
        }
    };

    const inputClass = "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

    return (
        <div role="dialog" aria-modal="true" aria-label={`${examLabel} marks for ${student.fullName}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={requestClose}>
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{readOnly ? "View Marks" : "Enter Marks"} — {examLabel} Exam</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {student.fullName}{student.classRoll != null ? ` · Roll ${student.classRoll}` : ""} · {data.subjects.length} subject(s)
                        </p>
                    </div>
                    <button onClick={requestClose} aria-label="Close" className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                        <X size={22} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                    {readOnly && (
                        <p className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><Lock size={16} className="shrink-0" />Marks entry is closed for this exam. Showing saved marks only.</p>
                    )}
                    {isPrimary && <GradeLegend options={data.gradeOptions} compact />}

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                                <tr>
                                    <th className="min-w-36 px-4 py-3 text-left font-bold">Subject</th>
                                    {isPrimary ? (
                                        data.gradeFields.map((field) => <th key={field.key} className="min-w-40 px-4 py-3 text-left font-bold">{field.label}</th>)
                                    ) : (
                                        <>
                                            {data.components.map((component) => (
                                                <th key={component.key} className="min-w-28 px-3 py-3 text-left font-bold">
                                                    {component.label}<span className="block font-normal normal-case text-gray-400">out of {component.maxMarks}</span>
                                                </th>
                                            ))}
                                            <th className="px-3 py-3 text-center font-bold">Total<span className="block font-normal normal-case text-gray-400">out of {data.subjectMaxMarks}</span></th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.subjects.map((subject) => {
                                    const draft = drafts[subject.id];
                                    const disabled = readOnly || !subject.editable;
                                    const total = isPrimary ? null : subjectTotal(subject.id);
                                    return (
                                        <tr key={subject.id} className={subject.editable ? "" : "bg-gray-50/70"}>
                                            <td className="min-w-36 px-4 py-3 align-top">
                                                <span className="font-semibold text-gray-800">{subject.name}</span>
                                                {!subject.editable && <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500"><Lock size={12} className="shrink-0" />Another teacher&apos;s subject</span>}
                                            </td>
                                            {isPrimary ? (
                                                data.gradeFields.map(({ key: field, label }) => (
                                                    <td key={field} className="px-4 py-3">
                                                        <select
                                                            value={draft[field]}
                                                            disabled={disabled}
                                                            onChange={(event) => update(subject.id, field, event.target.value)}
                                                            aria-label={`${subject.name} ${label}`}
                                                            className={`${inputClass} border-gray-200 bg-white`}
                                                        >
                                                            <option value="">Not graded</option>
                                                            {data.gradeOptions.map((grade) => <option key={grade.code} value={grade.code}>{grade.code} — {grade.label}</option>)}
                                                        </select>
                                                    </td>
                                                ))
                                            ) : (
                                                <>
                                                    {data.components.map((component) => {
                                                        const invalid = Number.isNaN(parseMarks(draft[component.key], component.maxMarks));
                                                        return (
                                                            <td key={component.key} className="px-3 py-3 align-top">
                                                                <input
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    min={0}
                                                                    max={component.maxMarks}
                                                                    step="0.5"
                                                                    value={draft[component.key]}
                                                                    disabled={disabled}
                                                                    onChange={(event) => update(subject.id, component.key, event.target.value)}
                                                                    placeholder="—"
                                                                    aria-label={`${subject.name} ${component.label}`}
                                                                    aria-invalid={invalid}
                                                                    className={`${inputClass} ${invalid ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}
                                                                />
                                                                {invalid && <span className="mt-1 block text-xs text-red-600">0–{component.maxMarks}</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="whitespace-nowrap px-3 py-3 text-center align-top font-bold text-gray-900">
                                                        <span className="inline-block pt-2">{total == null ? <span className="font-normal text-gray-400">—</span> : formatMarks(total)}</span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {!isPrimary && (
                                <tfoot className="border-t-2 border-gray-200 bg-emerald-50/60">
                                    <tr>
                                        <td colSpan={data.components.length + 1} className="px-4 py-3 text-right font-semibold text-gray-700">Grand Total</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-center font-bold text-emerald-800">
                                            {formatMarks(grandTotal ?? 0)} / {(data.subjectMaxMarks ?? 0) * data.subjects.length}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {data.showRemarks && (
                        <div>
                            <label htmlFor="exam-remarks" className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <MessageSquareText size={16} className="shrink-0 text-emerald-600" />Class Teacher&apos;s Remarks
                                <span className="font-normal text-gray-400">(visible to the class teacher only)</span>
                            </label>
                            <textarea
                                id="exam-remarks"
                                value={remarks}
                                disabled={readOnly}
                                maxLength={1000}
                                rows={3}
                                onChange={(event) => setRemarks(event.target.value)}
                                placeholder="Overall remarks on the student's performance"
                                className={`${inputClass} border-gray-200 bg-white`}
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">{remarks.length}/1000</p>
                        </div>
                    )}

                    {!readOnly && <p className="text-xs text-gray-500">All fields are optional — save what you have now and complete the rest later. Clearing a field removes that mark.</p>}
                </div>

                <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-gray-200 bg-gray-50 p-5">
                    <button onClick={requestClose} className="rounded-lg border-2 border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-100">
                        {readOnly ? "Close" : "Cancel"}
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || hasInvalid || !isDirty}
                            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                            <Save size={18} className="shrink-0" />
                            {isSaving ? "Saving..." : "Save Marks"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Small pieces ──────────────────────────────────────────────────────────────

function GradeLegend({ options, compact }: { options: ClassAssessments["gradeOptions"]; compact?: boolean }) {
    return (
        <div className={`rounded-xl border border-gray-200 bg-white ${compact ? "p-3" : "p-4 shadow-sm"}`}>
            {!compact && <p className="mb-2 text-sm font-semibold text-gray-700">Grading scale (Primary)</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map((grade) => (
                    <div key={grade.code} className="flex items-center overflow-hidden rounded-lg border border-gray-200 text-sm">
                        <span className="w-14 shrink-0 bg-gray-100 px-3 py-2 text-center font-bold text-gray-800">{grade.code}</span>
                        <span className="px-3 py-2 font-medium uppercase tracking-wide text-gray-700">{grade.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
    return (
        <div className={`rounded-lg border-l-4 bg-white p-4 shadow-md ${accent}`}>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}

function StatusBadge({ state }: { state: ProgressState }) {
    const styles: Record<ProgressState, [string, string]> = {
        complete: ["Completed", "bg-emerald-50 text-emerald-700"],
        partial: ["In progress", "bg-amber-50 text-amber-700"],
        empty: ["Not started", "bg-gray-100 text-gray-600"],
    };
    const [label, className] = styles[state];
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
            {state === "complete" && <CheckCircle2 size={13} className="shrink-0" />}{label}
        </span>
    );
}

function Th({ children, align = "center" }: { children: ReactNode; align?: "left" | "center" }) {
    return <th className={`px-6 py-4 ${align === "left" ? "text-left" : "text-center"} text-xs font-bold uppercase tracking-wider text-gray-600`}>{children}</th>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
    return (
        <div className="p-12 text-center">
            <FileSpreadsheet size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-gray-700">{title}</p>
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    );
}
