"use client";

import { use, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Megaphone, Paperclip, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateAnnouncementMutation, useGetAnnouncementsQuery, type Announcement } from "@/redux/api/operationsApi";
import { useGetTeacherClassesQuery } from "@/redux/api/teacherApi";
import {
    EASE_OUT,
    EmptyState,
    PageHeader,
    Pager,
    SearchBox,
    clock,
    errorMessage,
    focusRing,
    groupByDay,
    hostname,
    inputClass,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/teacher/ui";

const TITLE_MAX = 120;

function validUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function AnnouncementItem({ a }: { a: Pick<Announcement, "title" | "content" | "fileUrl" | "createdAt"> & { teacher?: { fullName: string } } }) {
    return (
        <article className="grid gap-x-6 gap-y-1 px-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-6">
            <time dateTime={a.createdAt} className="text-sm tabular-nums text-gray-500 sm:pt-0.5">{clock(a.createdAt)}</time>
            <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-gray-900">{a.title || "Untitled announcement"}</h3>
                {a.teacher?.fullName && <p className="mt-0.5 text-xs text-gray-500">Posted by {a.teacher.fullName}</p>}
                <p className="mt-3 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed text-gray-700">{a.content}</p>
                {a.fileUrl && (
                    <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-3 inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline ${focusRing}`}
                    >
                        <Paperclip size={14} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{hostname(a.fileUrl)}</span>
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                )}
            </div>
        </article>
    );
}

export default function TeacherAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const reduceMotion = useReducedMotion();
    // Portal layouts render pages only after their auth check, so localStorage is safe here.
    const [teacherId] = useState<string | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("authUser") || "{}").teacher?.id ?? null;
        } catch {
            return null;
        }
    });

    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const className = myClasses.find((c) => c.id === classroomId)?.name ?? "Classroom";
    const { data: announcements = [], isLoading, isError, refetch } = useGetAnnouncementsQuery(classroomId);
    const [createAnnouncement, { isLoading: posting }] = useCreateAnnouncementMutation();

    const [composing, setComposing] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [touched, setTouched] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const linkError = fileUrl.trim() && !validUrl(fileUrl.trim()) ? "Enter a full link that starts with https://" : null;
    const canPost = title.trim() && content.trim() && !linkError && !posting;

    const sorted = [...announcements].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const q = search.trim().toLowerCase();
    const visible = sorted.filter((a) => !q || [a.title, a.content, a.teacher?.fullName ?? ""].some((v) => v.toLowerCase().includes(q)));
    const { pageCount, current, pageRows } = paginate(visible, page);
    const groups = groupByDay(pageRows, (a) => a.createdAt);

    const reset = () => {
        setTitle("");
        setContent("");
        setFileUrl("");
        setTouched(false);
        setComposing(false);
    };

    const post = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!canPost) return;
        if (!teacherId) {
            toast.error("Your teacher record wasn't found. Log out, log in again, then post.");
            return;
        }
        try {
            await createAnnouncement({ title: title.trim(), content: content.trim(), fileUrl: fileUrl.trim() || undefined, teacherId, classroomId }).unwrap();
            toast.success(`Announcement posted to ${className}.`);
            reset();
            setPage(1);
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Announcement not posted. Check your connection and try again."));
        }
    };

    return (
        <div className="max-w-5xl space-y-6">
            <PageHeader
                title="Announcements"
                crumb={{ href: `/teacher/classroom/${classroomId}`, label: className }}
                subtitle="Every student in this class sees what you post here."
                actions={
                    !composing && (
                        <button type="button" onClick={() => setComposing(true)} className={primaryBtn}>
                            <Plus size={18} aria-hidden="true" />
                            New announcement
                        </button>
                    )
                }
            />

            <AnimatePresence initial={false}>
                {composing && (
                    <motion.section
                        aria-labelledby="compose-title"
                        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                        <h2 id="compose-title" className="border-b border-gray-100 px-4 py-4 text-base font-semibold text-gray-900 sm:px-6">New announcement</h2>
                        <form onSubmit={post} className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Title
                                    <input
                                        autoFocus
                                        value={title}
                                        maxLength={TITLE_MAX}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="For example, Science project due on Friday"
                                        aria-invalid={touched && !title.trim()}
                                        className={`${inputClass} mt-1.5`}
                                    />
                                    <span className="mt-1 flex justify-between text-xs font-normal text-gray-500">
                                        <span className={touched && !title.trim() ? "text-red-700" : ""}>{touched && !title.trim() ? "Add a title." : "Keep it short and specific."}</span>
                                        <span className="tabular-nums">{title.length}/{TITLE_MAX}</span>
                                    </span>
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Message
                                    <textarea
                                        rows={6}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="What do students need to know or do?"
                                        aria-invalid={touched && !content.trim()}
                                        className={`${inputClass} mt-1.5 resize-y`}
                                    />
                                    {touched && !content.trim() && <span className="mt-1 block text-xs font-normal text-red-700">Write the message.</span>}
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Attachment link <span className="font-normal text-gray-500">(optional)</span>
                                    <input
                                        type="url"
                                        inputMode="url"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                        placeholder="https://drive.google.com/…"
                                        aria-invalid={!!linkError}
                                        className={`${inputClass} mt-1.5`}
                                    />
                                    <span className={`mt-1 block text-xs font-normal ${linkError ? "text-red-700" : "text-gray-500"}`}>
                                        {linkError ?? "A worksheet, a slide deck or a form. Students open it in a new tab."}
                                    </span>
                                </label>
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700">Preview</p>
                                <div className="mt-1.5 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                                    {title.trim() || content.trim() ? (
                                        <AnnouncementItem a={{ title: title.trim(), content: content.trim() || "Your message appears here.", fileUrl: !linkError && fileUrl.trim() ? fileUrl.trim() : null, createdAt: new Date().toISOString() }} />
                                    ) : (
                                        <p className="px-6 py-12 text-center text-sm text-gray-500">Start typing to see how students will see it.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end lg:col-span-2">
                                <button type="button" onClick={reset} className={`${secondaryBtn} h-10`}>Discard</button>
                                <button type="submit" disabled={posting} className={primaryBtn}>
                                    <Send size={16} aria-hidden="true" />
                                    {posting ? "Posting…" : "Post announcement"}
                                </button>
                            </div>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            <section aria-label="Posted announcements" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium tabular-nums text-gray-900">{isLoading ? "…" : announcements.length}</span> posted
                    </p>
                    <SearchBox id="announcement-search" label="Search announcements" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search announcements" className="sm:w-72" />
                </div>

                {isLoading ? (
                    <div aria-hidden="true" className="divide-y divide-gray-100">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="space-y-2 px-6 py-5">
                                <span className="block h-4 w-2/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                                <span className="block h-3.5 w-4/5 rounded bg-gray-100 motion-safe:animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <EmptyState title="Announcements couldn't be loaded." hint="It might be a temporary problem — try again in a moment." action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>} />
                ) : announcements.length === 0 ? (
                    <EmptyState
                        icon={<Megaphone size={28} />}
                        title="Nothing posted to this class yet."
                        hint="Homework reminders, test dates and links to worksheets work well here."
                        action={!composing ? <button type="button" onClick={() => setComposing(true)} className={primaryBtn}>Write the first one</button> : undefined}
                    />
                ) : visible.length === 0 ? (
                    <EmptyState title={`No announcements match “${search.trim()}”.`} action={<button type="button" onClick={() => setSearch("")} className={secondaryBtn}>Clear search</button>} />
                ) : (
                    <>
                        {groups.map((g, gi) => (
                            <section key={g.label} aria-label={g.label}>
                                <h3 className={`border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 sm:px-6 ${gi > 0 ? "border-t" : ""}`}>{g.label}</h3>
                                <ul className="divide-y divide-gray-100">
                                    {g.items.map((a) => (
                                        <li key={a.id}>
                                            <AnnouncementItem a={a} />
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
