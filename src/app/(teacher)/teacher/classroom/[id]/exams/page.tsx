"use client";

import { use, useState } from "react";
import { FileSpreadsheet, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useGetClassroomExamsQuery, useGetStudentMarksQuery, useGetTeacherClassesQuery, useGetTeacherProfileQuery, useSaveStudentMarksMutation } from "@/redux/api/teacherApi";
import { MarksDialog, MarksList, MarksSummary, byRoll, type MarkRow } from "@/components/teacher/marks";
import { EmptyState, FilterChips, PageHeader, Skeleton, errorMessage, shortDate } from "@/components/teacher/ui";

export default function ClassExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const { data: profile } = useGetTeacherProfileQuery();
    const examsQ = useGetClassroomExamsQuery(classroomId);
    const className = myClasses.find((c) => c.id === classroomId)?.name ?? "Classroom";

    // Each exam is one subject's paper. Pick the exam (Half yearly, Final…), then the subject.
    const exams = [...(examsQ.data ?? [])].sort((a, b) => b.examDate.localeCompare(a.examDate));
    const names = [...new Set(exams.map((e) => e.name))];
    const [pickedName, setPickedName] = useState<string | null>(null);
    const [pickedExam, setPickedExam] = useState<string | null>(null);
    // Open on the latest exam that has already been held; future papers can't have marks yet.
    const nowIso = new Date().toISOString();
    const name = pickedName && names.includes(pickedName) ? pickedName : exams.find((e) => e.examDate <= nowIso)?.name ?? names[0] ?? "";
    const papers = exams.filter((e) => e.name === name).sort((a, b) => a.subject.name.localeCompare(b.subject.name));
    const exam = papers.find((e) => e.id === pickedExam) ?? papers[0];

    const marksQ = useGetStudentMarksQuery({ classroomId, examId: exam?.id ?? "" }, { skip: !exam });
    const [saveStudentMarks, { isLoading: saving }] = useSaveStudentMarksMutation();

    const rows: MarkRow[] = (marksQ.data ?? []).map((s) => ({ studentId: s.studentId, rollNumber: s.rollNumber, fullName: s.fullName, score: s.subjects[0]?.score ?? null, max: s.subjects[0]?.maxScore ?? 100 })).sort(byRoll);
    const primary = marksQ.data?.[0]?.classType === "PRIMARY";
    const enabled = !!(name.toUpperCase().includes("FINAL") ? profile?.finalMarksEntryEnabled : profile?.halfYearlyMarksEntryEnabled);
    const lockedReason = `The principal hasn't opened marks entry for ${name || "this exam"}.`;

    const [editing, setEditing] = useState<MarkRow | null>(null);
    const nextAfter = (r: MarkRow) => rows[rows.findIndex((x) => x.studentId === r.studentId) + 1] ?? null;

    const save = async (score: number, goNext: boolean) => {
        if (!editing || !exam) return;
        try {
            await saveStudentMarks({ classroomId, examId: exam.id, marks: [{ studentId: editing.studentId, subjectId: exam.subjectId, score }] }).unwrap();
            toast.success(`Marks saved for ${editing.fullName}.`);
            marksQ.refetch();
            setEditing(goNext ? nextAfter(editing) : null);
        } catch (err) {
            toast.error(errorMessage(err, "Marks not saved. Check your connection and try again."));
        }
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Exam marks" crumb={{ href: `/teacher/classroom/${classroomId}`, label: className }} subtitle="Enter half-yearly and final marks for your class, one subject at a time." />

            {examsQ.isLoading ? (
                <Skeleton className="block h-24 w-full" />
            ) : examsQ.isError ? (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    This class&apos;s exams couldn&apos;t be loaded. Check your connection, then reload the page.
                </div>
            ) : exams.length === 0 ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState icon={<FileSpreadsheet size={28} />} title="No exams are set up for this class yet." hint="The principal or the school office creates exams. They will appear here once they are scheduled." />
                </section>
            ) : (
                <>
                    <section aria-label="Choose an exam" className="space-y-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                            <p className="w-16 shrink-0 text-sm font-medium text-gray-700">Exam</p>
                            <FilterChips label="Exam" layoutId="teacher-exam-name" value={name} onChange={(v) => { setPickedName(v); setPickedExam(null); }} options={names.map((n) => ({ value: n, label: n }))} />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                            <p className="w-16 shrink-0 text-sm font-medium text-gray-700">Subject</p>
                            <FilterChips label="Subject" layoutId="teacher-exam-subject" value={exam?.id ?? ""} onChange={setPickedExam} options={papers.map((p) => ({ value: p.id, label: p.subject.name }))} />
                        </div>
                    </section>

                    {!enabled && (
                        <p role="status" className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                            <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                            {lockedReason} You can see the marks, but you can&apos;t change them until it opens.
                        </p>
                    )}

                    <MarksSummary
                        title={exam ? `${exam.name}, ${exam.subject.name}` : "Marks"}
                        note={exam ? `Held ${shortDate(exam.examDate)}` : undefined}
                        rows={rows}
                        loading={marksQ.isLoading || marksQ.isFetching}
                        primary={primary}
                    />

                    <MarksList
                        key={exam?.id}
                        rows={rows}
                        loading={marksQ.isLoading}
                        error={marksQ.isError}
                        onRetry={() => marksQ.refetch()}
                        primary={primary}
                        canEdit={enabled}
                        lockedReason={lockedReason}
                        onEdit={setEditing}
                    />
                </>
            )}

            <MarksDialog
                row={editing}
                context={exam ? `${exam.name}, ${exam.subject.name}` : ""}
                primary={primary}
                saving={saving}
                hasNext={!!editing && !!nextAfter(editing)}
                onClose={() => setEditing(null)}
                onSave={save}
            />
        </div>
    );
}
