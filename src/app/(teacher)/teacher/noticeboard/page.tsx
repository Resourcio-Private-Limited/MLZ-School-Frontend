"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bell, ExternalLink, Paperclip, Search, X } from "lucide-react";
import { useGetNoticesQuery, type Notice, type NoticeTag } from "@/redux/api/operationsApi";
import { EmptyState, PageHeader, Pager, clock, fileName, focusRing, groupByDay, hostname, inputClass, paginate, secondaryBtn } from "@/components/teacher/ui";

type Category = Exclude<NoticeTag, "ALL_NOTICES">;

const CATEGORIES: { tag: Category; label: string; dot: string }[] = [
    { tag: "GENERAL", label: "General", dot: "bg-gray-400" },
    { tag: "HOLIDAYS", label: "Holidays", dot: "bg-emerald-500" },
    { tag: "EVENTS", label: "Events", dot: "bg-sky-500" },
    { tag: "EXAMS", label: "Exams", dot: "bg-violet-500" },
    { tag: "EMERGENCY", label: "Emergency", dot: "bg-red-600" },
];

// Older notices may carry the legacy ALL_NOTICES tag; they are shown and filtered as General.
const categoryOf = (tag: NoticeTag): Category => (tag === "ALL_NOTICES" ? "GENERAL" : tag);
const categoryMeta = (tag: NoticeTag) => CATEGORIES.find((c) => c.tag === categoryOf(tag)) ?? CATEGORIES[0];

function NoticeItem({ notice }: { notice: Notice }) {
    const meta = categoryMeta(notice.tag);
    const emergency = meta.tag === "EMERGENCY";
    return (
        <article className="relative grid gap-x-6 gap-y-1 px-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-6">
            {emergency && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-red-600" />}
            <time dateTime={notice.createdAt} className="text-sm tabular-nums text-gray-500 sm:pt-0.5">{clock(notice.createdAt)}</time>
            <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{notice.title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${emergency ? "text-red-700" : "text-gray-700"}`}>
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                    </span>
                    <span>Posted by {notice.senderName}</span>
                </p>
                <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-gray-700">{notice.content}</p>
                {(notice.link || notice.file) && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        {notice.link && (
                            <a
                                href={notice.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline ${focusRing}`}
                            >
                                <ExternalLink size={14} aria-hidden="true" />
                                {hostname(notice.link)}
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        )}
                        {notice.file && (
                            <a
                                href={notice.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline ${focusRing}`}
                            >
                                <Paperclip size={14} aria-hidden="true" className="shrink-0" />
                                <span className="truncate">{fileName(notice.file)}</span>
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

export default function TeacherNoticeBoardPage() {
    const reduceMotion = useReducedMotion();
    const [filter, setFilter] = useState<Category | "ALL">("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: notices = [], isLoading, isError, refetch } = useGetNoticesQuery();

    const sorted = [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const countFor = (tag: Category) => notices.filter((n) => categoryOf(n.tag) === tag).length;
    const q = search.trim().toLowerCase();
    const visible = sorted.filter(
        (n) => (filter === "ALL" || categoryOf(n.tag) === filter) && (!q || [n.title, n.content, n.senderName].some((v) => v.toLowerCase().includes(q)))
    );
    const { pageCount, current, pageRows } = paginate(visible, page);
    const groups = groupByDay(pageRows, (n) => n.createdAt);

    const filters: { value: Category | "ALL"; label: string; count: number }[] = [
        { value: "ALL", label: "All", count: notices.length },
        ...CATEGORIES.map((c) => ({ value: c.tag, label: c.label, count: countFor(c.tag) })),
    ];
    const pickFilter = (f: Category | "ALL") => {
        setFilter(f);
        setPage(1);
    };
    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Notice board" subtitle="Holidays, events, exams and other news from the school office." />

            <section aria-label="Notices" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div role="group" aria-label="Filter by category" className="-mx-1 flex gap-1 overflow-x-auto px-1 py-0.5">
                        {filters.map((f) => {
                            const active = filter === f.value;
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => pickFilter(f.value)}
                                    className={`relative inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="teacher-notice-filter"
                                            className="absolute inset-0 rounded-md bg-emerald-50 ring-1 ring-emerald-100"
                                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                    <span className="relative">{f.label}</span>
                                    <span className={`relative text-xs tabular-nums ${active ? "text-emerald-700" : "text-gray-400"}`}>{isLoading ? "…" : f.count}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="relative lg:w-72">
                        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <label htmlFor="notice-search" className="sr-only">Search notices</label>
                        <input
                            id="notice-search"
                            type="search"
                            value={search}
                            onChange={(e) => updateSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") updateSearch(""); }}
                            placeholder="Search notices"
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

                {isLoading ? (
                    <div aria-hidden="true" className="divide-y divide-gray-100">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="grid gap-x-6 gap-y-2 px-6 py-5 sm:grid-cols-[5rem_minmax(0,1fr)]">
                                <span className="h-4 w-14 rounded bg-gray-100 motion-safe:animate-pulse" />
                                <div className="space-y-2">
                                    <span className="block h-4 w-2/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                                    <span className="block h-3 w-1/4 rounded bg-gray-100 motion-safe:animate-pulse" />
                                    <span className="block h-3.5 w-4/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <EmptyState
                        title="Notices couldn't be loaded."
                        hint="It might be a temporary problem — try again in a moment."
                        action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                    />
                ) : visible.length === 0 ? (
                    notices.length === 0 ? (
                        <EmptyState icon={<Bell size={28} />} title="No notices yet." hint="When the school publishes a notice, it appears here." />
                    ) : (
                        <EmptyState
                            title={q ? `No notices match “${search.trim()}”${filter !== "ALL" ? ` in ${categoryMeta(filter).label}` : ""}.` : `No ${categoryMeta(filter as Category).label.toLowerCase()} notices.`}
                            action={<button type="button" onClick={() => { updateSearch(""); pickFilter("ALL"); }} className={secondaryBtn}>Show all notices</button>}
                        />
                    )
                ) : (
                    <>
                        {groups.map((g, gi) => (
                            <section key={g.label} aria-label={g.label}>
                                <h2 className={`border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 sm:px-6 ${gi > 0 ? "border-t" : ""}`}>{g.label}</h2>
                                <ul className="divide-y divide-gray-100">
                                    {g.items.map((n) => (
                                        <li key={n.id}>
                                            <NoticeItem notice={n} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                        <Pager total={visible.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </section>
        </div>
    );
}
