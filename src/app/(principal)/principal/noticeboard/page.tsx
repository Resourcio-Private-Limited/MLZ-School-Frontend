"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Edit2, ExternalLink, Paperclip, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Tooltip } from "@/components/ui/tooltip";
import { Dialog } from "@/components/ui/dialog";
import {
    useGetNoticesQuery,
    useCreateNoticeMutation,
    useUpdateNoticeMutation,
    useDeleteNoticeMutation,
    type NoticeTag,
    type Notice,
} from "@/redux/api/operationsApi";
import {
    EASE_OUT,
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    SearchBox,
    clock,
    errorMessage,
    fileName,
    focusRing,
    groupByDay,
    hostname,
    inputClass,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/principal/ui";

type Category = Exclude<NoticeTag, "ALL_NOTICES">;

// One map for every category's label and colour, so the tag shown always matches the tag saved.
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

const SENDER = "Principal's Desk";
const iconBtn = `inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95 motion-safe:transition ${focusRing}`;

function isValidUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

type NoticeForm = { title: string; tag: Category; content: string; link: string };
const emptyForm: NoticeForm = { title: "", tag: "GENERAL", content: "", link: "" };

function NoticeItem({
    notice,
    highlight = false,
    preview = false,
    onEdit,
    onDelete,
}: {
    notice: Pick<Notice, "title" | "content" | "senderName" | "link" | "file" | "tag" | "createdAt">;
    highlight?: boolean;
    preview?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    const reduceMotion = useReducedMotion();
    const meta = categoryMeta(notice.tag);
    const emergency = meta.tag === "EMERGENCY";
    const title = notice.title.trim() || "Untitled notice";

    return (
        <motion.article
            initial={highlight && !reduceMotion ? { backgroundColor: "rgba(250,245,255,1)" } : false}
            animate={{ backgroundColor: "rgba(250,245,255,0)" }}
            transition={{ duration: 2.4, delay: 0.5, ease: "easeOut" }}
            className="relative grid gap-x-6 gap-y-1 px-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-6"
        >
            {emergency && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-red-600" />}
            <time dateTime={notice.createdAt} className="text-sm tabular-nums text-gray-500 sm:pt-0.5">
                {clock(notice.createdAt)}
            </time>
            <div className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <h3 className={`min-w-0 break-words text-base font-semibold ${notice.title.trim() ? "text-gray-900" : "text-gray-400"}`}>{title}</h3>
                    {!preview && (
                        <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-0.5">
                            <Tooltip content="Edit notice" side="top">
                                <button type="button" onClick={onEdit} aria-label={`Edit “${title}”`} className={iconBtn}>
                                    <Edit2 size={15} aria-hidden="true" />
                                </button>
                            </Tooltip>
                            <Tooltip content="Delete notice" side="top">
                                <button type="button" onClick={onDelete} aria-label={`Delete “${title}”`} className={`${iconBtn} hover:bg-red-50 hover:text-red-700`}>
                                    <Trash2 size={15} aria-hidden="true" />
                                </button>
                            </Tooltip>
                        </div>
                    )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${emergency ? "text-red-700" : "text-gray-700"}`}>
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                    </span>
                    <span>Posted by {notice.senderName}</span>
                </p>
                <p className={`mt-3 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed ${notice.content.trim() ? "text-gray-700" : "text-gray-400"}`}>
                    {notice.content.trim() || "Your message will appear here."}
                </p>
                {(notice.link || notice.file) && (
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                        {notice.link && (
                            <a
                                href={notice.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-purple-700 underline-offset-4 hover:text-purple-800 hover:underline ${focusRing}`}
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
                                className={`inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-purple-700 underline-offset-4 hover:text-purple-800 hover:underline ${focusRing}`}
                            >
                                <Paperclip size={14} aria-hidden="true" className="shrink-0" />
                                <span className="truncate">{fileName(notice.file)}</span>
                                <span className="sr-only">(opens in a new tab)</span>
                            </a>
                        )}
                    </div>
                )}
            </div>
        </motion.article>
    );
}

export default function PrincipalNoticeBoardPage() {
    const reduceMotion = useReducedMotion();
    const [filter, setFilter] = useState<Category | "ALL">("ALL");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
    const [form, setForm] = useState<NoticeForm>(emptyForm);
    const [highlight, setHighlight] = useState<{ id: string; n: number } | null>(null);
    const composerRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    const { data: notices = [], isLoading, isError, refetch } = useGetNoticesQuery();
    const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
    const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();
    const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();

    const sorted = [...notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const countFor = (tag: Category) => notices.filter((n) => categoryOf(n.tag) === tag).length;
    const q = search.trim().toLowerCase();
    const visible = sorted.filter(
        (n) => (filter === "ALL" || categoryOf(n.tag) === filter) && (!q || [n.title, n.content, n.senderName].some((v) => v.toLowerCase().includes(q)))
    );
    const { pageCount, current, pageRows } = paginate(visible, page);
    const groups = groupByDay(pageRows, (n) => n.createdAt);

    // Bring the composer into view and focus the title whenever it opens (new or edit).
    useEffect(() => {
        if (!showForm) return;
        composerRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        titleRef.current?.focus({ preventScroll: true });
    }, [showForm, editingNotice, reduceMotion]);

    const linkInvalid = form.link.trim() !== "" && !isValidUrl(form.link.trim());
    const canSubmit = form.title.trim() !== "" && form.content.trim() !== "" && !linkInvalid && !isCreating && !isUpdating;

    const closeForm = () => {
        setShowForm(false);
        setEditingNotice(null);
        setForm(emptyForm);
    };

    const openCreate = () => {
        setEditingNotice(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setForm({ title: notice.title, tag: categoryOf(notice.tag), content: notice.content, link: notice.link ?? "" });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        const payload = { title: form.title.trim(), content: form.content.trim(), tag: form.tag, link: form.link.trim() || undefined };
        try {
            if (editingNotice) {
                await updateNotice({ noticeId: editingNotice.id, data: payload }).unwrap();
                setHighlight({ id: editingNotice.id, n: Date.now() });
                toast.success("Changes saved.");
            } else {
                const created = await createNotice({ ...payload, senderName: SENDER }).unwrap();
                if (created?.id) setHighlight({ id: created.id, n: Date.now() });
                setFilter("ALL");
                setSearch("");
                setPage(1);
                toast.success("Notice published.");
            }
            closeForm();
        } catch (err) {
            toast.error(
                errorMessage(
                    err,
                    editingNotice ? "Couldn't save your changes. Check your connection and try again." : "Couldn't publish the notice. Check your connection and try again."
                )
            );
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteNotice(deleteTarget.id).unwrap();
            if (editingNotice?.id === deleteTarget.id) closeForm();
            setDeleteTarget(null);
            toast.success("Notice deleted.");
        } catch (err) {
            toast.error(errorMessage(err, "Couldn't delete the notice. Check your connection and try again."));
        }
    };

    const filters: { value: Category | "ALL"; label: string; count?: number }[] = [
        { value: "ALL", label: "All", count: isLoading ? undefined : notices.length },
        ...CATEGORIES.map((c) => ({ value: c.tag, label: c.label, count: isLoading ? undefined : countFor(c.tag) })),
    ];

    const changeFilter = (v: Category | "ALL") => {
        setFilter(v);
        setPage(1);
    };
    const changeSearch = (v: string) => {
        setSearch(v);
        setPage(1);
    };
    const changePage = (n: number) => {
        setPage(n);
        document.getElementById("published-notices")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Notice board"
                subtitle="Notices published here appear in every portal."
                actions={
                    <button type="button" onClick={openCreate} className={primaryBtn}>
                        <Plus size={18} aria-hidden="true" />
                        New notice
                    </button>
                }
            />

            {/* Composer with live preview */}
            <AnimatePresence initial={false}>
                {showForm && (
                    <motion.section
                        ref={composerRef}
                        key="composer"
                        aria-labelledby="composer-heading"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
                        className="scroll-mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-6">
                                <h2 id="composer-heading" className="text-base font-semibold text-gray-900">
                                    {editingNotice ? "Edit notice" : "New notice"}
                                </h2>
                                <button type="button" onClick={closeForm} aria-label="Close" className={iconBtn}>
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2">
                                <div className="space-y-5 px-4 py-5 sm:px-6">
                                    <div>
                                        <label htmlFor="notice-title" className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
                                        <input
                                            ref={titleRef}
                                            id="notice-title"
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            placeholder="e.g. School closed on Friday for Diwali"
                                            className={inputClass}
                                        />
                                    </div>

                                    <fieldset>
                                        <legend className="mb-1.5 block text-sm font-medium text-gray-700">Category</legend>
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORIES.map((c) => (
                                                <label key={c.tag} className="cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="notice-category"
                                                        value={c.tag}
                                                        checked={form.tag === c.tag}
                                                        onChange={() => setForm({ ...form, tag: c.tag })}
                                                        className="peer sr-only"
                                                    />
                                                    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:border-gray-400 peer-checked:border-gray-900 peer-checked:bg-gray-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2 motion-safe:transition">
                                                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${c.dot}`} />
                                                        {c.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>

                                    <div>
                                        <label htmlFor="notice-content" className="mb-1.5 block text-sm font-medium text-gray-700">Message</label>
                                        <textarea
                                            id="notice-content"
                                            value={form.content}
                                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                                            placeholder="What should students, parents and staff know?"
                                            rows={5}
                                            className={`${inputClass} resize-y leading-relaxed`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="notice-link" className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Link <span className="font-normal text-gray-500">(optional)</span>
                                        </label>
                                        <input
                                            id="notice-link"
                                            type="url"
                                            inputMode="url"
                                            value={form.link}
                                            onChange={(e) => setForm({ ...form, link: e.target.value })}
                                            placeholder="https://"
                                            aria-invalid={linkInvalid}
                                            aria-describedby={linkInvalid ? "notice-link-error" : undefined}
                                            className={`${inputClass} ${linkInvalid ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                                        />
                                        {linkInvalid && (
                                            <p id="notice-link-error" className="mt-1.5 text-xs text-red-700">
                                                Enter a full link starting with https://
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 bg-gray-50 px-4 py-5 sm:px-6 lg:border-l lg:border-t-0">
                                    <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
                                    <div aria-live="polite" className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        <NoticeItem
                                            preview
                                            notice={{
                                                title: form.title,
                                                content: form.content,
                                                senderName: editingNotice?.senderName ?? SENDER,
                                                link: form.link.trim() && !linkInvalid ? form.link.trim() : null,
                                                file: editingNotice?.file ?? null,
                                                tag: form.tag,
                                                createdAt: editingNotice?.createdAt ?? new Date().toISOString(),
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-4 py-4 sm:px-6">
                                <button type="button" onClick={closeForm} className={secondaryBtn}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={!canSubmit} className={primaryBtn}>
                                    {editingNotice ? (isUpdating ? "Saving…" : "Save changes") : isCreating ? "Publishing…" : "Publish notice"}
                                </button>
                            </div>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            <section id="published-notices" aria-label="Published notices" className="scroll-mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <FilterChips label="Filter by category" value={filter} options={filters} onChange={changeFilter} layoutId="principal-notice-filter" />
                    <SearchBox id="notice-search" label="Search notices" value={search} onChange={changeSearch} placeholder="Search notices" className="lg:w-72" />
                </div>

                {isLoading ? (
                    <div aria-hidden="true" className="divide-y divide-gray-100">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="grid gap-x-6 gap-y-2 px-4 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:px-6">
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
                        action={
                            <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                                Try again
                            </button>
                        }
                    />
                ) : groups.length === 0 ? (
                    notices.length === 0 ? (
                        <EmptyState
                            icon={<Bell size={32} />}
                            title="No notices yet."
                            hint="Publish the first one and it will appear in every portal."
                            action={
                                <button type="button" onClick={openCreate} className={primaryBtn}>
                                    <Plus size={16} aria-hidden="true" />
                                    New notice
                                </button>
                            }
                        />
                    ) : (
                        <EmptyState
                            title={
                                q
                                    ? `No notices match “${search.trim()}”${filter !== "ALL" ? ` in ${categoryMeta(filter).label}` : ""}.`
                                    : `No ${categoryMeta(filter as Category).label.toLowerCase()} notices.`
                            }
                            action={
                                <button type="button" onClick={() => { changeSearch(""); changeFilter("ALL"); }} className={secondaryBtn}>
                                    Show all notices
                                </button>
                            }
                        />
                    )
                ) : (
                    <>
                        {groups.map((g, gi) => (
                            <section key={g.label} aria-label={g.label}>
                                <h2 className={`border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 sm:px-6 ${gi > 0 ? "border-t" : ""}`}>{g.label}</h2>
                                <ul className="divide-y divide-gray-100">
                                    <AnimatePresence initial={false}>
                                        {g.items.map((n) => (
                                            <motion.li
                                                key={n.id}
                                                layout={!reduceMotion}
                                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                                transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
                                                className="overflow-hidden"
                                            >
                                                <NoticeItem
                                                    key={highlight?.id === n.id ? `${n.id}-${highlight.n}` : n.id}
                                                    notice={n}
                                                    highlight={highlight?.id === n.id}
                                                    onEdit={() => openEdit(n)}
                                                    onDelete={() => setDeleteTarget(n)}
                                                />
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            </section>
                        ))}
                        <Pager total={visible.length} page={current} pageCount={pageCount} onPage={changePage} />
                    </>
                )}
            </section>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} labelledBy="delete-heading" className="sm:max-w-md">
                <div className="px-6 pb-6 pt-6">
                    <h2 id="delete-heading" className="text-base font-semibold text-gray-900">Delete this notice?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        “{deleteTarget?.title}” will be removed from every portal. This can&apos;t be undone.
                    </p>
                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" autoFocus onClick={() => setDeleteTarget(null)} className={secondaryBtn}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2`}
                        >
                            {isDeleting ? "Deleting…" : "Delete notice"}
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
