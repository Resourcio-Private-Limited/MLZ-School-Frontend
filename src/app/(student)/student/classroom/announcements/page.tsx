"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Paperclip, Search, X } from "lucide-react";
import { useGetAnnouncementsQuery, useGetClassroomTeachersQuery } from "@/redux/api/operationsApi";
import { useGetDashboardQuery } from "@/redux/api/studentApi";
import { EmptyState, PageHeader, Pager, clock, focusRing, groupByDay, inputClass, paginate, secondaryBtn } from "@/components/student/ui";

const ALL = "__all__";

function AnnouncementsContent() {
    const searchParams = useSearchParams();
    // The classroom page passes ?classroomId=; fall back to the student's own classroom when it's missing.
    const { data: dashboard, isLoading: dashLoading } = useGetDashboardQuery();
    const classroomId = searchParams.get("classroomId") || dashboard?.classroom?.id || "";

    const annQ = useGetAnnouncementsQuery(classroomId, { skip: !classroomId });
    const { data: teachers = [] } = useGetClassroomTeachersQuery(classroomId, { skip: !classroomId });

    const [teacher, setTeacher] = useState(ALL);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const announcements = [...(annQ.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    // Chips list teachers who have posted, plus any classroom teacher, so a chip never leads to an empty list without reason.
    const names = [...new Set([...announcements.map((a) => a.teacher.fullName), ...teachers.map((t) => t.fullName)])].sort((a, b) => a.localeCompare(b));
    const countFor = (name: string) => announcements.filter((a) => a.teacher.fullName === name).length;

    const q = search.trim().toLowerCase();
    const visible = announcements.filter(
        (a) => (teacher === ALL || a.teacher.fullName === teacher) && (!q || [a.title, a.content, a.teacher.fullName].some((v) => v.toLowerCase().includes(q)))
    );
    const { pageCount, current, pageRows } = paginate(visible, page);
    const groups = groupByDay(pageRows, (a) => a.createdAt);
    const loading = dashLoading || annQ.isLoading;

    const pickTeacher = (name: string) => {
        setTeacher(name);
        setPage(1);
    };
    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <section aria-label="Announcements" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div role="group" aria-label="Filter by teacher" className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 py-0.5">
                    {[ALL, ...names].map((name) => {
                        const active = teacher === name;
                        return (
                            <button
                                key={name}
                                type="button"
                                aria-pressed={active}
                                onClick={() => pickTeacher(name)}
                                className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "bg-sky-50 text-gray-900 ring-1 ring-sky-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                            >
                                {name === ALL ? "All teachers" : name}
                                <span className={`text-xs tabular-nums ${active ? "text-sky-700" : "text-gray-400"}`}>
                                    {loading ? "…" : name === ALL ? announcements.length : countFor(name)}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="relative shrink-0 lg:w-64">
                    <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <label htmlFor="announcement-search" className="sr-only">Search announcements</label>
                    <input
                        id="announcement-search"
                        type="search"
                        value={search}
                        onChange={(e) => updateSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") updateSearch(""); }}
                        placeholder="Search announcements"
                        className={`${inputClass} h-9 py-0 pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none`}
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => updateSearch("")}
                            aria-label="Clear search"
                            className={`absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 ${focusRing}`}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div aria-hidden="true" className="divide-y divide-gray-100">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="space-y-2 px-6 py-5">
                            <span className="block h-4 w-2/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                            <span className="block h-3.5 w-4/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : !classroomId ? (
                <EmptyState title="You aren't in a classroom yet." hint="Announcements appear once the school assigns you to a class." />
            ) : annQ.isError ? (
                <EmptyState
                    title="Announcements couldn't be loaded."
                    hint="Check your connection, then try again."
                    action={<button type="button" onClick={() => annQ.refetch()} className={secondaryBtn}>Try again</button>}
                />
            ) : visible.length === 0 ? (
                announcements.length === 0 ? (
                    <EmptyState icon={<MessageSquare size={28} />} title="No announcements yet." hint="When a teacher posts an announcement for your class, it appears here." />
                ) : (
                    <EmptyState
                        title={q ? `No announcements match “${search.trim()}”.` : `No announcements from ${teacher}.`}
                        action={<button type="button" onClick={() => { updateSearch(""); pickTeacher(ALL); }} className={secondaryBtn}>Show all announcements</button>}
                    />
                )
            ) : (
                <>
                    {groups.map((g, gi) => (
                        <section key={g.label} aria-label={g.label}>
                            <h2 className={`border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 sm:px-6 ${gi > 0 ? "border-t" : ""}`}>{g.label}</h2>
                            <ul className="divide-y divide-gray-100">
                                {g.items.map((a) => (
                                    <li key={a.id}>
                                        <article className="grid gap-x-6 gap-y-1 px-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-6">
                                            <time dateTime={a.createdAt} className="text-sm tabular-nums text-gray-500 sm:pt-0.5">{clock(a.createdAt)}</time>
                                            <div className="min-w-0">
                                                <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                                                <p className="mt-0.5 text-xs text-gray-500">Posted by {a.teacher.fullName}</p>
                                                <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-gray-700">{a.content}</p>
                                                {a.fileUrl && (
                                                    <a
                                                        href={a.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-sky-700 underline-offset-4 hover:text-sky-800 hover:underline ${focusRing}`}
                                                    >
                                                        <Paperclip size={14} aria-hidden="true" />
                                                        Open attachment
                                                        <span className="sr-only">(opens in a new tab)</span>
                                                    </a>
                                                )}
                                            </div>
                                        </article>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                    <Pager total={visible.length} page={current} pageCount={pageCount} onPage={setPage} />
                </>
            )}
        </section>
    );
}

export default function AnnouncementsPage() {
    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Announcements" subtitle="Updates your teachers have posted for your class." crumb={{ href: "/student/classroom", label: "Classroom" }} />
            <Suspense fallback={<div className="h-64 rounded-xl border border-gray-200 bg-white" />}>
                <AnnouncementsContent />
            </Suspense>
        </div>
    );
}
