"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, School, Users } from "lucide-react";
import { useGetTeacherClassesQuery, useGetTeacherProfileQuery, type TeacherClass } from "@/redux/api/teacherApi";
import { heroGradient } from "@/components/teacher/brand";
import { EmptyState, PageHeader, Skeleton, focusRing, linkOnDark, secondaryBtn } from "@/components/teacher/ui";

function ClassCard({ cls }: { cls: TeacherClass }) {
    return (
        <Link
            href={`/teacher/classroom/${cls.id}`}
            className={`group flex h-full flex-col overflow-hidden rounded-xl border border-t-4 bg-white shadow-sm motion-safe:transition-colors ${focusRing} ${cls.isClassTeacher ? "border-gray-200 border-t-emerald-500" : "border-gray-200 border-t-gray-200 hover:border-t-emerald-400"}`}
        >
            <div className="flex-1 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <span
                        aria-hidden="true"
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg motion-safe:transition-colors ${cls.isClassTeacher ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"}`}
                    >
                        <BookOpen size={22} />
                    </span>
                    {cls.isClassTeacher && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">Class teacher</span>
                    )}
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">{cls.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-emerald-700">{cls.subjects.length ? cls.subjects.join(", ") : "No subjects assigned"}</p>

                <p className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm tabular-nums text-gray-600">
                    <Users size={16} aria-hidden="true" className="text-gray-400" />
                    {cls.studentCount.toLocaleString("en-IN")} {cls.studentCount === 1 ? "student" : "students"}
                </p>
            </div>

            <div className="flex items-center justify-end border-t border-gray-100 bg-gray-50 px-5 py-3 sm:px-6">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 group-hover:text-emerald-800">
                    Open class
                    <ChevronRight size={16} aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
}

export default function TeacherHomePage() {
    const { data: classes = [], isLoading, isError, refetch } = useGetTeacherClassesQuery();
    const { data: profile } = useGetTeacherProfileQuery();

    // Your own class first, then by name.
    const sorted = [...classes].sort((a, b) => Number(b.isClassTeacher) - Number(a.isClassTeacher) || a.name.localeCompare(b.name, "en-IN", { numeric: true }));
    const students = classes.reduce((sum, c) => sum + c.studentCount, 0);
    const own = classes.find((c) => c.isClassTeacher);
    const subjects = new Set(classes.flatMap((c) => c.subjects)).size;
    const firstName = profile?.fullName?.split(/\s+/)[0];

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="My classes"
                subtitle={`${firstName ? `Welcome back, ${firstName}. ` : ""}${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
            />

            <section aria-labelledby="teaching-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                    <h2 id="teaching-summary" className="text-base font-semibold">Your teaching this year</h2>
                    {own && <Link href={`/teacher/classroom/${own.id}/attendance`} className={linkOnDark}>Mark today&apos;s attendance</Link>}
                </div>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm text-slate-300">Classes</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {isLoading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : classes.length}
                            {!isLoading && subjects > 0 && <span className="ml-2 text-sm font-normal text-slate-400">{subjects} {subjects === 1 ? "subject" : "subjects"}</span>}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Students you teach</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {isLoading ? <Skeleton onDark className="h-7 w-14 align-middle" /> : students.toLocaleString("en-IN")}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-sm text-slate-300">Class teacher of</dt>
                        <dd className="mt-1 truncate text-2xl font-semibold tracking-tight">
                            {isLoading ? <Skeleton onDark className="h-7 w-40 align-middle" /> : own?.name ?? profile?.classTeacherOf?.name ?? <span className="text-slate-400">No class</span>}
                        </dd>
                    </div>
                </dl>
            </section>

            <section aria-labelledby="your-classes" className="space-y-4">
                <div>
                    <h2 id="your-classes" className="text-base font-semibold text-gray-900">Your classes</h2>
                    <p className="mt-0.5 text-sm text-gray-500">Open a class to take attendance, post announcements or enter marks.</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-56 w-full rounded-xl" />)}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState
                            title="Your classes couldn't be loaded."
                            hint="Check your connection, then try again."
                            action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    </div>
                ) : classes.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState icon={<School size={28} />} title="No classes are assigned to you yet." hint="Ask the principal or the school office to assign your classes and subjects." />
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {sorted.map((c) => (
                            <li key={c.id}>
                                <ClassCard cls={c} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
