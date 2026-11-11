"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Edit2, ExternalLink, Plus, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/apiError";
import { Tooltip } from "@/components/ui/tooltip";
import {
    useGetNoticesQuery,
    useCreateNoticeMutation,
    useUpdateNoticeMutation,
    useDeleteNoticeMutation,
    type NoticeTag,
    type Notice,
} from "@/redux/api/operationsApi";

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

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";
const iconBtn = `inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95 motion-safe:transition ${focusRing}`;
const inputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 motion-safe:transition";

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayLabel(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });
}

const timeLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function isValidUrl(value: string) {
    try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function hostname(value: string) {
    try {
        return new URL(value).hostname.replace(/^www\./, "");
    } catch {
        return value;
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
    notice: Pick<Notice, "title" | "content" | "senderName" | "link" | "tag" | "createdAt">;
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
            initial={highlight && !reduceMotion ? { backgroundColor: "rgba(255,241,242,1)" } : false}
            animate={{ backgroundColor: "rgba(255,241,242,0)" }}
            transition={{ duration: 2.4, delay: 0.5, ease: "easeOut" }}
            className="relative grid gap-x-6 gap-y-1 px-6 py-5 sm:grid-cols-[5rem_minmax(0,1fr)]"
        >
            {emergency && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-red-600" />}
            <time dateTime={notice.createdAt} className="text-sm text-gray-500 tabular-nums sm:pt-0.5">
                {timeLabel(notice.createdAt)}
            </time>
            <div className="min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <h3 className={`text-base font-semibold ${notice.title.trim() ? "text-gray-900" : "text-gray-500"}`}>{title}</h3>
                    {!preview && (
                        <div className="-mr-2 -mt-1 flex shrink-0 items-center gap-0.5">
                            <Tooltip content="Edit notice" side="top">
                                <button type="button" onClick={onEdit} aria-label={`Edit “${title}”`} className={iconBtn}>
                                    <Edit2 size={15} aria-hidden="true" />
                                </button>
                            </Tooltip>
                            <Tooltip content="Delete notice" side="top">
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    aria-label={`Delete “${title}”`}
                                    className={`${iconBtn} hover:bg-red-50 hover:text-red-700`}
                                >
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
                <p className={`mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed ${notice.content.trim() ? "text-gray-700" : "text-gray-500"}`}>
                    {notice.content.trim() || "Your message will appear here."}
                </p>
                {notice.link && (
                    <a
                        href={notice.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-rose-700 hover:text-rose-800 hover:underline underline-offset-4 ${focusRing}`}
                    >
                        <ExternalLink size={14} aria-hidden="true" />
                        {hostname(notice.link)}
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                )}
            </div>
        </motion.article>
    );
}

export default function SuperAdminNoticeBoardPage() {
    const reduceMotion = useReducedMotion();
    const [filter, setFilter] = useState<Category | "ALL">("ALL");
    const [search, setSearch] = useState("");
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
        (n) =>
            (filter === "ALL" || categoryOf(n.tag) === filter) &&
            (!q || [n.title, n.content, n.senderName].some((v) => v.toLowerCase().includes(q)))
    );

    const groups: { label: string; items: Notice[] }[] = [];
    for (const n of visible) {
        const label = dayLabel(n.createdAt);
        const last = groups[groups.length - 1];
        if (last?.label === label) last.items.push(n);
        else groups.push({ label, items: [n] });
    }

    // Bring the composer into view and focus the title whenever it opens (new or edit).
    useEffect(() => {
        if (!showForm) return;
        composerRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        titleRef.current?.focus({ preventScroll: true });
    }, [showForm, editingNotice, reduceMotion]);

    // Escape closes the delete dialog.
    useEffect(() => {
        if (!deleteTarget) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDeleteTarget(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [deleteTarget]);

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
        const payload = {
            title: form.title.trim(),
            content: form.content.trim(),
            tag: form.tag,
            link: form.link.trim() || undefined,
        };
        try {
            if (editingNotice) {
                await updateNotice({ noticeId: editingNotice.id, data: { ...payload, senderName: editingNotice.senderName } }).unwrap();
                setHighlight({ id: editingNotice.id, n: Date.now() });
                toast.success("Changes saved.");
            } else {
                const created = await createNotice({ ...payload, senderName: "Super Admin" }).unwrap();
                if (created?.id) setHighlight({ id: created.id, n: Date.now() });
                setFilter("ALL");
                setSearch("");
                toast.success("Notice published.");
            }
            closeForm();
        } catch (err) {
            toast.error(
                apiErrorMessage(
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
            toast.error(apiErrorMessage(err, "Couldn't delete the notice. Try again."));
        }
    };

    const filters: { value: Category | "ALL"; label: string; count: number }[] = [
        { value: "ALL", label: "All", count: notices.length },
        ...CATEGORIES.map((c) => ({ value: c.tag, label: c.label, count: countFor(c.tag) })),
    ];

    return (
        <div className="max-w-7xl space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Notice Board</h1>
                    <p className="mt-1 text-sm text-gray-500">Notices published here appear in every portal.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 active:scale-[0.97] motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                >
                    <Plus size={18} aria-hidden="true" />
                    New notice
                </button>
            </header>

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
                            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
                                <h2 id="composer-heading" className="text-base font-semibold text-gray-900">
                                    {editingNotice ? "Edit notice" : "New notice"}
                                </h2>
                                <button type="button" onClick={closeForm} aria-label="Close" className={iconBtn}>
                                    <X size={16} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2">
                                <div className="space-y-5 px-6 py-5">
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
                                                    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:border-gray-400 peer-checked:border-gray-900 peer-checked:bg-gray-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-rose-500 peer-focus-visible:ring-offset-2 motion-safe:transition">
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

                                <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 lg:border-l lg:border-t-0">
                                    <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
                                    <div aria-live="polite" className="-mx-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        <NoticeItem
                                            preview
                                            notice={{
                                                title: form.title,
                                                content: form.content,
                                                senderName: editingNotice?.senderName ?? "Super Admin",
                                                link: form.link.trim() && !linkInvalid ? form.link.trim() : null,
                                                tag: form.tag,
                                                createdAt: editingNotice?.createdAt ?? new Date().toISOString(),
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className={`inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={`inline-flex h-9 items-center rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                                >
                                    {editingNotice ? (isUpdating ? "Saving…" : "Save changes") : (isCreating ? "Publishing…" : "Publish notice")}
                                </button>
                            </div>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            <section aria-label="Published notices" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div role="group" aria-label="Filter by category" className="-mx-1 flex gap-1 overflow-x-auto px-1 py-0.5">
                        {filters.map((f) => {
                            const active = filter === f.value;
                            return (
                                <button
                                    key={f.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setFilter(f.value)}
                                    className={`relative inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="notice-filter"
                                            className="absolute inset-0 rounded-md bg-gray-100"
                                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                    <span className="relative">{f.label}</span>
                                    <span className={`relative text-xs tabular-nums ${active ? "text-gray-700" : "text-gray-500"}`}>
                                        {isLoading ? "…" : f.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative lg:w-72">
                        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <label htmlFor="notice-search" className="sr-only">Search notices</label>
                        <input
                            id="notice-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") setSearch(""); }}
                            placeholder="Search notices"
                            className={`${inputClass} h-9 py-0 pl-9 pr-9 [&::-webkit-search-cancel-button]:appearance-none`}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                                className={`absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${focusRing}`}
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
                    <div className="px-6 py-14 text-center">
                        <p className="text-sm font-medium text-gray-900">Notices couldn&apos;t be loaded.</p>
                        <p className="mt-1 text-sm text-gray-500">Check your connection, then try again.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className={`mt-4 inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                        >
                            Try again
                        </button>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        {notices.length === 0 ? (
                            <>
                                <p className="text-sm font-medium text-gray-900">No notices yet.</p>
                                <p className="mt-1 text-sm text-gray-500">Publish the first one and it will appear in every portal.</p>
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className={`mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    New notice
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-900">
                                    {q
                                        ? `No notices match “${search.trim()}”${filter !== "ALL" ? ` in ${categoryMeta(filter).label}` : ""}.`
                                        : `No ${categoryMeta(filter as Category).label.toLowerCase()} notices.`}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setSearch(""); setFilter("ALL"); }}
                                    className={`mt-4 inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                                >
                                    Show all notices
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    groups.map((g, gi) => (
                        <section key={g.label} aria-label={g.label}>
                            <h2 className={`border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs font-semibold text-gray-600 ${gi > 0 ? "border-t" : ""}`}>
                                {g.label}
                            </h2>
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
                    ))
                )}
            </section>

            {/* Delete confirmation */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        key="delete-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.15 }}
                        onClick={() => setDeleteTarget(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
                    >
                        <motion.div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="delete-heading"
                            aria-describedby="delete-body"
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                            transition={{ duration: reduceMotion ? 0 : 0.18, ease: EASE_OUT }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                        >
                            <h2 id="delete-heading" className="text-base font-semibold text-gray-900">Delete this notice?</h2>
                            <p id="delete-body" className="mt-2 text-sm leading-relaxed text-gray-600">
                                “{deleteTarget.title}” will be removed from every portal. This can&apos;t be undone.
                            </p>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    autoFocus
                                    onClick={() => setDeleteTarget(null)}
                                    className={`inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70 motion-safe:transition ${focusRing} focus-visible:ring-red-500 focus-visible:ring-offset-2`}
                                >
                                    {isDeleting ? "Deleting…" : "Delete notice"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
