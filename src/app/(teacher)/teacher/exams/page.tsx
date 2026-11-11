"use client";

import { useState } from "react";
import { ClipboardList, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useGetExamMarksQuery, useGetExamTypesForTeacherQuery, useUpdateStudentMarksMutation } from "@/redux/api/academicApi";
import { MarksDialog, MarksList, MarksSummary, byRoll, type MarkRow } from "@/components/teacher/marks";
import { EmptyState, FilterChips, PageHeader, Skeleton, errorMessage, inputClass, readAuthUser, secondaryBtn, shortDate } from "@/components/teacher/ui";

export default function TeacherMarksEntryPage() {
    const [{ teacherId }] = useState(readAuthUser);
    const classesQ = useGetExamTypesForTeacherQuery(teacherId, { skip: !teacherId });
    const classrooms = [...(classesQ.data ?? [])].sort((a, b) => a.classroomName.localeCompare(b.classroomName, "en-IN", { numeric: true }));

    const [pickedClass, setPickedClass] = useState<string | null>(null);
    const [pickedExam, setPickedExam] = useState<string | null>(null);
    const classroom = classrooms.find((c) => c.classroomId === pickedClass) ?? classrooms[0];
    const exams = [...(classroom?.exams ?? [])].sort((a, b) => b.examDate.localeCompare(a.examDate));
    // Open on an exam that's taking marks, if there is one.
    const exam = exams.find((e) => e.examId === pickedExam) ?? exams.find((e) => e.submissionOpen) ?? exams[0];
    const examNames = [...new Set(exams.map((e) => e.examName))];

    const marksQ = useGetExamMarksQuery(exam?.examId ?? "", { skip: !exam });
    const [updateStudentMarks, { isLoading: saving }] = useUpdateStudentMarksMutation();

    const rows: MarkRow[] = (marksQ.data?.records ?? []).map((r) => ({ studentId: r.studentId, rollNumber: r.rollNumber || null, fullName: r.fullName, score: r.marksObtained, max: r.totalMarks || 100 })).sort(byRoll);
    const open = !!exam?.submissionOpen;
    const label = exam ? `${exam.examName}${exam.subjectName ? `, ${exam.subjectName}` : ""}` : "";
    const lockedReason = "Marks entry for this exam is closed.";

    const [editing, setEditing] = useState<MarkRow | null>(null);
    const nextAfter = (r: MarkRow) => rows[rows.findIndex((x) => x.studentId === r.studentId) + 1] ?? null;

    const save = async (score: number, goNext: boolean) => {
        if (!editing || !exam) return;
        try {
            await updateStudentMarks({ examId: exam.examId, studentId: editing.studentId, score }).unwrap();
            toast.success(`Marks saved for ${editing.fullName}.`);
            marksQ.refetch();
            setEditing(goNext ? nextAfter(editing) : null);
        } catch (err) {
            toast.error(errorMessage(err, "Marks not saved. Check your connection and try again."));
        }
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Marks entry" subtitle="Enter marks for the subjects you teach. Pick a class, then an exam." />

            {classesQ.isLoading ? (
                <Skeleton className="block h-24 w-full" />
            ) : classesQ.isError ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState title="Your exams couldn't be loaded." hint="Check your connection, then try again." action={<button type="button" onClick={() => classesQ.refetch()} className={secondaryBtn}>Try again</button>} />
                </section>
            ) : classrooms.length === 0 ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState icon={<ClipboardList size={28} />} title="No classes or subjects are assigned to you yet." hint="Ask the principal or the school office to assign your subjects." />
                </section>
            ) : (
                <>
                    <section aria-label="Choose a class and exam" className="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                            <p className="w-16 shrink-0 text-sm font-medium text-gray-700">Class</p>
                            <FilterChips
                                label="Class"
                                layoutId="teacher-marks-class"
                                value={classroom?.classroomId ?? ""}
                                onChange={(v) => { setPickedClass(v); setPickedExam(null); }}
                                options={classrooms.map((c) => ({ value: c.classroomId, label: c.classroomName }))}
                            />
                        </div>
                        <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                            <span className="w-16 shrink-0 text-sm font-medium text-gray-700">Exam</span>
                            <select value={exam?.examId ?? ""} onChange={(e) => setPickedExam(e.target.value)} disabled={exams.length === 0} className={`${inputClass} sm:max-w-md`}>
                                {exams.length === 0 && <option value="">No exams for this class yet</option>}
                                {examNames.map((n) => (
                                    <optgroup key={n} label={n}>
                                        {exams.filter((e) => e.examName === n).map((e) => (
                                            <option key={e.examId} value={e.examId}>
                                                {e.subjectName ?? n}, {shortDate(e.examDate)}{e.submissionOpen ? "" : " (closed)"}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </label>
                    </section>

                    {!exam ? (
                        <section className="rounded-xl border border-gray-200 bg-white">
                            <EmptyState icon={<ClipboardList size={28} />} title={`No exams are scheduled for ${classroom?.classroomName ?? "this class"} yet.`} hint="Exams appear here once the school schedules them." />
                        </section>
                    ) : (
                        <>
                            {!open && (
                                <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                                    <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                    {lockedReason} You can see the marks, but only the principal can reopen it.
                                </p>
                            )}
                            <MarksSummary title={label} note={`${classroom?.classroomName}, held ${shortDate(exam.examDate)}`} rows={rows} loading={marksQ.isLoading || marksQ.isFetching} primary={false} />
                            <MarksList key={exam.examId} rows={rows} loading={marksQ.isLoading} error={marksQ.isError} onRetry={() => marksQ.refetch()} primary={false} canEdit={open} lockedReason={lockedReason} onEdit={setEditing} />
                        </>
                    )}
                </>
            )}

            <MarksDialog row={editing} context={label} primary={false} saving={saving} hasNext={!!editing && !!nextAfter(editing)} onClose={() => setEditing(null)} onSave={save} />
        </div>
    );
}
