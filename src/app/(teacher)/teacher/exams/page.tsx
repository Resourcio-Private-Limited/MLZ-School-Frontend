"use client";

import Link from "next/link";
import { ChevronRight, FileSpreadsheet, School } from "lucide-react";
import { useGetTeacherClassesQuery } from "@/redux/api/teacherApi";
import { EmptyState, PageHeader, Skeleton, focusRing, secondaryBtn } from "@/components/teacher/ui";

// Marks are entered per class (Classroom → Exam marks). This page is the sidebar's shortcut:
// pick a class and go straight to its marks, for every subject you teach there.
export default function MarksEntryPage() {
    const { data: classes = [], isLoading, isError, refetch } = useGetTeacherClassesQuery();
    const sorted = [...classes].sort((a, b) => Number(b.isClassTeacher) - Number(a.isClassTeacher) || a.name.localeCompare(b.name, "en-IN", { numeric: true }));

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Marks entry" subtitle="Pick a class to enter its half-yearly and final marks. You can enter marks for the subjects you teach there, or every subject in your own class." />

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-28 w-full rounded-xl" />)}
                </div>
            ) : isError ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState title="Your classes couldn't be loaded." hint="It might be a temporary problem — try again in a moment." action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>} />
                </section>
            ) : sorted.length === 0 ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState icon={<School size={28} />} title="You aren't assigned to any class yet." hint="The principal assigns teachers to classes and subjects. Your classes will appear here once that's done." />
                </section>
            ) : (
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sorted.map((c) => (
                        <li key={c.id}>
                            <Link
                                href={`/teacher/classroom/${c.id}/exams`}
                                className={`group flex h-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-emerald-300 motion-safe:transition-colors ${focusRing}`}
                            >
                                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                    <FileSpreadsheet size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-gray-900">{c.name}</span>
                                    <span className="mt-0.5 block text-sm text-gray-500">
                                        {c.isClassTeacher ? "Your class: every subject" : c.subjects.length ? `Your subjects: ${c.subjects.join(", ")}` : "No subjects assigned to you"}
                                    </span>
                                    <span className="mt-2 block text-sm tabular-nums text-gray-500">{c.studentCount.toLocaleString("en-IN")} {c.studentCount === 1 ? "student" : "students"}</span>
                                </span>
                                <ChevronRight size={18} aria-hidden="true" className="mt-1 shrink-0 text-gray-300 group-hover:text-gray-500" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
