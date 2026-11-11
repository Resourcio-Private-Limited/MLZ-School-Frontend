"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { useGetDashboardQuery, useGetMessageRecipientsQuery } from "@/redux/api/studentApi";
import { useGetAnnouncementsQuery, useGetClassroomTeachersQuery } from "@/redux/api/operationsApi";
import { heroGradient } from "@/components/student/brand";
import { PageHeader, Panel, Skeleton, focusRing, linkClass, linkOnDark, shortDate } from "@/components/student/ui";

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

export default function ClassroomPage() {
    const dashQ = useGetDashboardQuery();
    const classroom = dashQ.data?.classroom;
    const classroomId = classroom?.id ?? "";

    const annQ = useGetAnnouncementsQuery(classroomId, { skip: !classroomId });
    const teachersQ = useGetClassroomTeachersQuery(classroomId, { skip: !classroomId });
    const { data: recipients = [] } = useGetMessageRecipientsQuery();

    const announcements = [...(annQ.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const teachers = [...(teachersQ.data ?? [])].sort((a, b) => Number(b.isClassTeacher) - Number(a.isClassTeacher) || a.fullName.localeCompare(b.fullName));
    // Teachers come from the classroom; messaging needs their user id, which the recipients list carries. Match on name.
    const recipientFor = (name: string) => recipients.find((r) => r.name === name)?.id;

    const announcementsHref = `/student/classroom/announcements${classroomId ? `?classroomId=${classroomId}` : ""}`;
    const loadingLists = dashQ.isLoading || (!!classroomId && (annQ.isLoading || teachersQ.isLoading));

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Classroom" subtitle="Your class, your teachers and their announcements." />

            {dashQ.isError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    Your classroom couldn&apos;t be loaded. Check your connection, then reload the page.
                </div>
            )}

            <section aria-labelledby="class-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                    <h2 id="class-summary" className="text-base font-semibold">
                        {dashQ.isLoading ? <Skeleton onDark className="h-5 w-40 align-middle" /> : classroom?.name ?? "Your classroom"}
                    </h2>
                    <Link href="/student/classroom/messages" className={linkOnDark}>Message a teacher</Link>
                </div>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-3">
                    <div className="min-w-0">
                        <dt className="text-sm text-slate-300">Class teacher</dt>
                        <dd className="mt-1 truncate text-2xl font-semibold tracking-tight">
                            {dashQ.isLoading ? <Skeleton onDark className="h-7 w-40 align-middle" /> : classroom?.classTeacher ?? "Not assigned yet"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Subjects</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {dashQ.isLoading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : classroom?.subjectCount ?? "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Teachers</dt>
                        <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                            {loadingLists ? <Skeleton onDark className="h-7 w-12 align-middle" /> : teachers.length || "—"}
                        </dd>
                    </div>
                </dl>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <Panel
                    title="Latest announcements"
                    subtitle="Posted by your teachers"
                    action={<Link href={announcementsHref} className={linkClass}>All announcements</Link>}
                    className="lg:col-span-2"
                >
                    <div className="mt-3">
                        {loadingLists ? (
                            <div className="space-y-3 px-4 pb-5 pt-2 sm:px-6">
                                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-10 w-full" />)}
                            </div>
                        ) : annQ.isError ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">Announcements couldn&apos;t be loaded. Check your connection, then reload the page.</p>
                        ) : announcements.length === 0 ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">No announcements yet. When a teacher posts one, it appears here.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                {announcements.slice(0, 4).map((a) => (
                                    <li key={a.id} className="grid gap-x-6 gap-y-0.5 px-4 py-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:px-6">
                                        <time dateTime={a.createdAt} className="text-sm tabular-nums text-gray-500">{shortDate(a.createdAt)}</time>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{a.title}</p>
                                            <p className="text-xs text-gray-500">{a.teacher.fullName}</p>
                                            <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{a.content}</p>
                                            {a.fileUrl && (
                                                <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline underline-offset-4 ${focusRing}`}>
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

                <Panel title="Your teachers">
                    <div className="mt-3">
                        {loadingLists ? (
                            <div className="space-y-3 px-4 pb-5 pt-2 sm:px-6">
                                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-9 w-full" />)}
                            </div>
                        ) : teachers.length === 0 ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">No teachers are assigned to your class yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                {teachers.map((t) => {
                                    const userId = recipientFor(t.fullName);
                                    return (
                                        <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-semibold text-sky-700">
                                                {initials(t.fullName)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-gray-900">{t.fullName}</span>
                                                <span className="block truncate text-xs text-gray-500">
                                                    {t.isClassTeacher ? "Class teacher" : t.designation ?? "Teacher"}
                                                </span>
                                            </span>
                                            {userId && (
                                                <Link
                                                    href={`/student/classroom/messages?to=${encodeURIComponent(userId)}`}
                                                    aria-label={`Message ${t.fullName}`}
                                                    className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 motion-safe:transition-colors ${focusRing}`}
                                                >
                                                    Message
                                                </Link>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>
        </div>
    );
}
