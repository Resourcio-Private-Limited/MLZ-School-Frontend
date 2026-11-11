"use client";

import { use } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronRight, FileSpreadsheet, Megaphone, MessageSquare, Paperclip, Users, type LucideIcon } from "lucide-react";
import { useGetClassDetailsQuery, useGetTeacherClassesQuery } from "@/redux/api/teacherApi";
import { useGetAnnouncementsQuery } from "@/redux/api/operationsApi";
import { heroGradient } from "@/components/teacher/brand";
import { PageHeader, Panel, Skeleton, focusRing, linkClass, linkOnDark, shortDate } from "@/components/teacher/ui";

type Tool = { href: string; label: string; hint: string; icon: LucideIcon };

export default function TeacherClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const { data: details, isLoading, isError } = useGetClassDetailsQuery(classroomId);
    const annQ = useGetAnnouncementsQuery(classroomId);

    const mine = myClasses.find((c) => c.id === classroomId);
    const isClassTeacher = !!mine?.isClassTeacher;
    const title = mine?.name ?? details?.className ?? "Classroom";
    const base = `/teacher/classroom/${classroomId}`;
    const announcements = [...(annQ.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

    const tools: Tool[] = [
        { href: `${base}/attendance`, label: "Attendance", hint: isClassTeacher ? "Mark today's register and see past days" : "See today's register and past days", icon: CalendarCheck },
        { href: `${base}/students`, label: "Students", hint: "Class list with attendance and latest grades", icon: Users },
        { href: `${base}/announcements`, label: "Announcements", hint: "Post updates that every student in the class sees", icon: Megaphone },
        { href: `/teacher/classroom/${classroomId}/messages`, label: "Messages", hint: "Write to a student in this class", icon: MessageSquare },
        { href: `${base}/exams`, label: "Exam marks", hint: isClassTeacher ? "Enter half-yearly and final marks (or grades) for every subject" : "Enter half-yearly and final marks (or grades) for your subjects", icon: FileSpreadsheet },
    ];

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title={title} crumb={{ href: "/teacher", label: "My classes" }} subtitle={isClassTeacher ? "You are the class teacher." : mine?.subjects.length ? `You teach ${mine.subjects.join(", ")}.` : undefined} />

            {isError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    This class couldn&apos;t be loaded. Check your connection, then reload the page.
                </div>
            )}

            <section aria-labelledby="class-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                    <h2 id="class-summary" className="text-base font-semibold">
                        {isLoading ? <Skeleton onDark className="h-5 w-40 align-middle" /> : details ? `${details.className}, section ${details.section}` : title}
                    </h2>
                    <Link href={`${base}/students`} className={linkOnDark}>View the class list</Link>
                </div>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm text-slate-300">Students</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {isLoading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : details?.totalStudents.toLocaleString("en-IN") ?? "—"}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-sm text-slate-300">Class teacher</dt>
                        <dd className="mt-1 truncate text-2xl font-semibold tracking-tight">
                            {isLoading ? <Skeleton onDark className="h-7 w-40 align-middle" /> : details?.classTeacherName ?? <span className="text-slate-400">Not assigned</span>}
                        </dd>
                    </div>
                    <div className="min-w-0">
                        <dt className="text-sm text-slate-300">Your role</dt>
                        <dd className="mt-1 truncate text-2xl font-semibold tracking-tight">{isClassTeacher ? "Class teacher" : "Subject teacher"}</dd>
                    </div>
                </dl>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <Panel title="Class tools">
                    <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                        {tools.map((t) => {
                            const Icon = t.icon;
                            return (
                                <li key={t.label}>
                                    <Link href={t.href} className={`group flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}>
                                        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                            <Icon size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-gray-900">{t.label}</span>
                                            <span className="block text-sm text-gray-500">{t.hint}</span>
                                        </span>
                                        <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-gray-300 group-hover:text-gray-500 motion-safe:transition motion-safe:group-hover:translate-x-0.5" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>

                <Panel title="Latest announcements" subtitle="Posted to this class" action={<Link href={`${base}/announcements`} className={linkClass}>All announcements</Link>} className="lg:col-span-2">
                    <div className="mt-3">
                        {annQ.isLoading ? (
                            <div className="space-y-3 px-4 pb-5 pt-2 sm:px-6">
                                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-10 w-full" />)}
                            </div>
                        ) : annQ.isError ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">Announcements couldn&apos;t be loaded. Check your connection, then reload the page.</p>
                        ) : announcements.length === 0 ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">
                                Nothing posted yet.{" "}
                                <Link href={`${base}/announcements`} className={linkClass}>Post the first announcement</Link>
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                {announcements.map((a) => (
                                    <li key={a.id} className="grid gap-x-6 gap-y-0.5 px-4 py-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:px-6">
                                        <time dateTime={a.createdAt} className="text-sm tabular-nums text-gray-500">{shortDate(a.createdAt)}</time>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500">{a.teacher?.fullName}</p>
                                            <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{a.content}</p>
                                            {a.fileUrl && (
                                                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline ${focusRing}`}>
                                                    <Paperclip size={14} aria-hidden="true" />
                                                    Attachment
                                                    <span className="sr-only">(opens in a new tab)</span>
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
