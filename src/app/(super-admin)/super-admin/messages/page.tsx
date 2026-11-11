"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, MessageSquare, Plus, Search, Send } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/apiError";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useGetAllUsersQuery } from "@/redux/api/superAdminApi";
import {
    useGetConversationQuery,
    useGetConversationsQuery,
    useSendMessageMutation,
    type ConversationItem,
} from "@/redux/api/operationsApi";

type Role = "PRINCIPAL" | "ACCOUNTANT" | "TEACHER" | "STUDENT";
type Contact = { id: string; name: string; role: Role; classroom?: string };

const TABS: { key: Role; label: string; singular: string }[] = [
    { key: "PRINCIPAL", label: "Principals", singular: "principal" },
    { key: "ACCOUNTANT", label: "Accountants", singular: "accountant" },
    { key: "TEACHER", label: "Teachers", singular: "teacher" },
    { key: "STUDENT", label: "Students", singular: "student" },
];
const ROLE_LABEL: Record<Role, string> = { PRINCIPAL: "Principal", ACCOUNTANT: "Accountant", TEACHER: "Teacher", STUDENT: "Student" };

const NO_CLASS = "No class assigned";
const PAGE_SIZE = 10;
const RECENT = "__recent__";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";
const pageBtn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:active:scale-100 motion-safe:transition ${focusRing} focus-visible:ring-offset-1`;
const fieldClass =
    "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30";

const initials = (name: string) =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
const describe = (c: Contact) => (c.role === "STUDENT" && c.classroom ? `Student, ${c.classroom}` : ROLE_LABEL[c.role]);
const byName = (a: Contact, b: Contact) => a.name.localeCompare(b.name);
// Natural order: Class 2 before Class 10; unassigned students last.
const byClass = (a: string, b: string) =>
    a === NO_CLASS ? 1 : b === NO_CLASS ? -1 : a.localeCompare(b, undefined, { numeric: true });

// "Class 7 - Section B" -> { grade: "Class 7", section: "B" }; anything else is a grade with no section.
function parseClass(classroom: string) {
    const m = classroom.match(/^(.*?)\s*-\s*Section\s+(.+)$/i);
    return m ? { grade: m[1].trim(), section: m[2].trim() } : { grade: classroom, section: "" };
}

function getPageItems(current: number, total: number): (number | "gap")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
    if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "gap", current - 1, current, current + 1, "gap", total];
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysAgo = (value: string) => Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / 86_400_000);
const clock = (value: string) =>
    new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function listDate(value: string) {
    const diff = daysAgo(value);
    if (diff === 0) return clock(value);
    if (diff === 1) return "Yesterday";
    const d = new Date(value);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

function dayHeading(value: string) {
    const diff = daysAgo(value);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    const d = new Date(value);
    return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
    });
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <span
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-center rounded-full bg-rose-50 font-semibold text-rose-700 ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}
        >
            {initials(name)}
        </span>
    );
}

function PersonRow({ contact, conv, showClass, onOpen }: { contact: Contact; conv?: ConversationItem; showClass: boolean; onOpen: () => void }) {
    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className={`group flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-gray-50 motion-safe:transition-colors ${focusRing} focus-visible:ring-inset`}
            >
                <Avatar name={contact.name} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                        <span className="min-w-0 truncate text-sm">
                            <span className="font-medium text-gray-900">{contact.name}</span>
                            {showClass && contact.classroom && <span className="ml-2 text-gray-500">{contact.classroom}</span>}
                        </span>
                        {conv && (
                            <time dateTime={conv.lastMessageAt} className="shrink-0 text-xs tabular-nums text-gray-500">
                                {listDate(conv.lastMessageAt)}
                            </time>
                        )}
                    </span>
                    <span className={`mt-0.5 block truncate text-sm ${conv ? "text-gray-600" : "text-gray-500"}`}>
                        {conv ? `${conv.direction === "sent" ? "You: " : ""}${conv.lastMessage}` : "No messages yet"}
                    </span>
                </span>
                <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-gray-300 group-hover:text-gray-500 motion-safe:transition motion-safe:group-hover:translate-x-0.5"
                />
            </button>
        </li>
    );
}

function SubHeading({ children, count }: { children: React.ReactNode; count: number }) {
    return (
        <h3 className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-2 text-xs font-semibold text-gray-600">
            {children}
            <span className="font-normal tabular-nums text-gray-500">{count.toLocaleString("en-IN")}</span>
        </h3>
    );
}

export default function SuperAdminMessagesPage() {
    const reduceMotion = useReducedMotion();
    const threadTitleId = useId();
    const composeTitleId = useId();
    // The super-admin layout renders children client-side only (after its auth check), so localStorage is available here.
    const [currentUserId] = useState<string>(() => {
        try {
            return JSON.parse(localStorage.getItem("authUser") || "{}").id ?? "";
        } catch {
            return "";
        }
    });

    const [tab, setTab] = useState<Role>("PRINCIPAL");
    const [search, setSearch] = useState("");
    const [grade, setGrade] = useState("");
    const [section, setSection] = useState("");
    const [page, setPage] = useState(1);

    // Conversation dialog
    const [threadId, setThreadId] = useState<string | null>(null);
    const [reply, setReply] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);

    // New message dialog
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeRole, setComposeRole] = useState<Role>("PRINCIPAL");
    const [composeClass, setComposeClass] = useState("");
    const [composeTo, setComposeTo] = useState("");
    const [composeText, setComposeText] = useState("");

    const { data: allUsers, isLoading: usersLoading } = useGetAllUsersQuery();
    const { data: conversations = [] } = useGetConversationsQuery(currentUserId, {
        skip: !currentUserId,
        pollingInterval: 30000,
        skipPollingIfUnfocused: true,
    });
    const { data: messages = [], isLoading: threadLoading } = useGetConversationQuery(
        { userId: currentUserId, otherUserId: threadId ?? "" },
        { skip: !currentUserId || !threadId, pollingInterval: 5000, skipPollingIfUnfocused: true }
    );
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    const contacts = useMemo<Contact[]>(() => {
        if (!allUsers) return [];
        return [
            ...allUsers.principals.map((u) => ({ id: u.userId, name: u.fullName, role: "PRINCIPAL" as const })),
            ...allUsers.staff.filter((u) => u.role === "ACCOUNTANT").map((u) => ({ id: u.userId, name: u.fullName, role: "ACCOUNTANT" as const })),
            ...allUsers.teachers.map((u) => ({ id: u.userId, name: u.fullName, role: "TEACHER" as const })),
            ...allUsers.students.map((u) => ({ id: u.userId, name: u.fullName, role: "STUDENT" as const, classroom: u.classroom || NO_CLASS })),
        ];
    }, [allUsers]);
    const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
    const convById = useMemo(() => new Map(conversations.map((c) => [c.otherUserId, c])), [conversations]);

    const q = search.trim().toLowerCase();
    const matches = (c: Contact) => !q || c.name.toLowerCase().includes(q) || (c.classroom?.toLowerCase().includes(q) ?? false);
    const countFor = (role: Role) => contacts.filter((c) => c.role === role && matches(c)).length;

    // People with a conversation come first, newest first; everyone else alphabetically.
    const byRecent = (a: Contact, b: Contact) => {
        const ta = convById.get(a.id)?.lastMessageAt ?? "";
        const tb = convById.get(b.id)?.lastMessageAt ?? "";
        return ta === tb ? byName(a, b) : tb.localeCompare(ta);
    };

    const current = TABS.find((t) => t.key === tab)!;
    const visible = contacts.filter((c) => c.role === tab && matches(c));
    const otherTabWithMatches = q ? TABS.find((t) => t.key !== tab && countFor(t.key) > 0) : undefined;

    // Students tab: pick a class, then a section. "Recent" lists students you have a conversation with.
    const students = useMemo(
        () => contacts.filter((c) => c.role === "STUDENT").map((c) => ({ ...c, ...parseClass(c.classroom ?? NO_CLASS) })),
        [contacts]
    );
    const grades = useMemo(() => [...new Set(students.map((s) => s.grade))].sort(byClass), [students]);
    const hasRecent = students.some((s) => convById.has(s.id));
    const activeGrade = grade === RECENT && hasRecent ? RECENT : grades.includes(grade) ? grade : grades[0] ?? "";
    const sections = [...new Set(students.filter((s) => s.grade === activeGrade).map((s) => s.section))].sort();
    const activeSection = sections.includes(section) ? section : sections[0] ?? "";
    const inClass = students.filter((s) => s.grade === activeGrade && s.section === activeSection);

    let rows: Contact[];
    let listTitle = "";
    if (tab !== "STUDENT") rows = [...visible].sort(byRecent);
    else if (q) {
        rows = [...visible].sort(byRecent);
        listTitle = `Results for \u201c${search.trim()}\u201d`;
    } else if (activeGrade === RECENT) {
        rows = students.filter((s) => convById.has(s.id)).sort(byRecent);
        listTitle = "Recent conversations";
    } else {
        rows = inClass.sort(byRecent);
        listTitle = inClass[0]?.classroom ?? activeGrade;
    }
    const showClass = tab === "STUDENT" && (!!q || activeGrade === RECENT);
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const switchTab = (key: Role) => {
        setTab(key);
        setPage(1);
    };
    const pickGrade = (g: string) => {
        setGrade(g);
        setSection("");
        setPage(1);
    };

    const thread = threadId ? contactById.get(threadId) : undefined;

    // Keep the newest message in view when a conversation opens or a message arrives.
    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, threadId]);

    const openThread = (id: string) => {
        setReply("");
        setThreadId(id);
    };

    const sendReply = async () => {
        const text = reply.trim();
        if (!text || !threadId || sending) return;
        try {
            await sendMessage({ receiverId: threadId, content: text }).unwrap();
            setReply("");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    const openCompose = () => {
        setComposeRole(tab);
        setComposeClass("");
        setComposeTo("");
        setComposeText("");
        setComposeOpen(true);
    };

    const composeTab = TABS.find((t) => t.key === composeRole)!;
    const composeClasses = useMemo(
        () => [...new Set(contacts.filter((c) => c.role === "STUDENT").map((c) => c.classroom ?? NO_CLASS))].sort(byClass),
        [contacts]
    );
    const composeOptions = contacts
        .filter((c) => c.role === composeRole && (composeRole !== "STUDENT" || c.classroom === composeClass))
        .sort(byName);
    const needsClass = composeRole === "STUDENT" && !composeClass;

    const sendCompose = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = composeText.trim();
        if (!composeTo || !text || sending) return;
        try {
            await sendMessage({ receiverId: composeTo, content: text }).unwrap();
            const name = contactById.get(composeTo)?.name;
            setComposeOpen(false);
            toast.success(name ? `Message sent to ${name}.` : "Message sent.");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    const emptyState = (
        <div className="px-6 py-16 text-center">
            <MessageSquare size={28} aria-hidden="true" className="mx-auto text-gray-300" />
            {q ? (
                <>
                    <p className="mt-3 text-sm font-medium text-gray-900">
                        No {current.label.toLowerCase()} match &ldquo;{search.trim()}&rdquo;
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
                        {otherTabWithMatches && (
                            <button
                                type="button"
                                onClick={() => switchTab(otherTabWithMatches.key)}
                                className={`rounded-lg bg-rose-50 px-3 py-1.5 font-medium text-rose-700 hover:bg-rose-100 motion-safe:transition-colors ${focusRing}`}
                            >
                                Show {countFor(otherTabWithMatches.key).toLocaleString("en-IN")} in {otherTabWithMatches.label}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setPage(1);
                            }}
                            className={`rounded-lg px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 motion-safe:transition-colors ${focusRing}`}
                        >
                            Clear search
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p className="mt-3 text-sm font-medium text-gray-900">No {current.label.toLowerCase()} yet</p>
                    <p className="mt-1 text-sm text-gray-500">Add a {current.singular} in User Management to message them here.</p>
                </>
            )}
        </div>
    );

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Messages</h1>
                    <p className="mt-1 text-sm text-gray-500">Write to the principal, accountants, teachers and students.</p>
                </div>
                <button
                    type="button"
                    onClick={openCompose}
                    disabled={usersLoading}
                    className={`inline-flex h-10 items-center gap-2 self-start rounded-lg bg-rose-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 active:scale-[0.97] disabled:opacity-50 motion-safe:transition sm:self-auto ${focusRing} focus-visible:ring-offset-2`}
                >
                    <Plus size={18} aria-hidden="true" />
                    New message
                </button>
            </header>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {/* Toolbar: one tab per recipient type, search beside them */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div role="tablist" aria-label="Recipient type" className="-mb-px flex gap-6 overflow-x-auto">
                        {TABS.map((t) => {
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => switchTab(t.key)}
                                    className={`relative flex shrink-0 items-center gap-2 rounded-sm py-4 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                                >
                                    {t.label}
                                    <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums motion-safe:transition-colors ${active ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600"}`}>
                                        {usersLoading ? "…" : countFor(t.key).toLocaleString("en-IN")}
                                    </span>
                                    {active && (
                                        <motion.span
                                            layoutId="messages-tab-underline"
                                            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-rose-600"
                                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="pb-3 lg:w-72 lg:pb-0">
                        <div className="relative">
                            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <label htmlFor="message-search" className="sr-only">Search people</label>
                            <input
                                id="message-search"
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by name or class"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                            />
                        </div>
                    </div>
                </div>

                {tab === "STUDENT" && !q && !usersLoading && grades.length > 0 && (
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="shrink-0 text-sm text-gray-500">Class</span>
                            <div className="-my-1 flex min-w-0 gap-1 overflow-x-auto py-1">
                                {grades.map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => pickGrade(g)}
                                        aria-pressed={activeGrade === g}
                                        aria-label={g}
                                        className={`h-8 min-w-8 shrink-0 rounded-lg px-2.5 text-sm font-medium tabular-nums motion-safe:transition-colors ${focusRing} ${activeGrade === g ? "bg-rose-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                                    >
                                        {g === NO_CLASS ? "Unassigned" : g.replace(/^class\s+/i, "")}
                                    </button>
                                ))}
                                {hasRecent && (
                                    <>
                                        <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-gray-200" />
                                        <button
                                            type="button"
                                            onClick={() => pickGrade(RECENT)}
                                            aria-pressed={activeGrade === RECENT}
                                            className={`h-8 shrink-0 rounded-lg px-2.5 text-sm font-medium motion-safe:transition-colors ${focusRing} ${activeGrade === RECENT ? "bg-rose-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                                        >
                                            Recent
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {activeGrade !== RECENT && sections.length > 1 && (
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-sm text-gray-500">Section</span>
                                <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
                                    {sections.map((sec) => (
                                        <button
                                            key={sec}
                                            type="button"
                                            onClick={() => {
                                                setSection(sec);
                                                setPage(1);
                                            }}
                                            aria-pressed={activeSection === sec}
                                            aria-label={`Section ${sec}`}
                                            className={`h-7 min-w-9 rounded-md px-2.5 text-sm font-medium motion-safe:transition ${focusRing} ${activeSection === sec ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                                        >
                                            {sec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div role="tabpanel" aria-label={current.label}>
                    {usersLoading ? (
                        <ul aria-hidden="true" className="divide-y divide-gray-100">
                            {Array.from({ length: 6 }, (_, i) => (
                                <li key={i} className="flex items-center gap-4 px-6 py-4">
                                    <span className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                                    <span className="flex-1 space-y-2">
                                        <span className="block h-3 w-40 animate-pulse rounded bg-gray-100" />
                                        <span className="block h-3 w-64 max-w-full animate-pulse rounded bg-gray-100" />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : visible.length === 0 ? (
                        emptyState
                    ) : (
                        <>
                            {listTitle && <SubHeading count={rows.length}>{listTitle}</SubHeading>}
                            <ul className="divide-y divide-gray-100">
                                {pageRows.map((c) => (
                                    <PersonRow key={c.id} contact={c} conv={convById.get(c.id)} showClass={showClass} onOpen={() => openThread(c.id)} />
                                ))}
                            </ul>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-6 py-4">
                                <p className="whitespace-nowrap text-sm tabular-nums text-gray-500">
                                    Showing{" "}
                                    <span className="font-medium text-gray-700">
                                        {(currentPage - 1) * PAGE_SIZE + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, rows.length)}
                                    </span>
                                    {" of "}
                                    <span className="font-medium text-gray-700">{rows.length.toLocaleString("en-IN")}</span>
                                </p>
                                {pageCount > 1 && (
                                    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                                        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className={pageBtn}>
                                            Prev
                                        </button>
                                        {getPageItems(currentPage, pageCount).map((n, i) =>
                                            n === "gap" ? (
                                                <span key={`gap-${i}`} aria-hidden="true" className="flex h-9 w-9 select-none items-center justify-center text-sm text-gray-500">
                                                    &hellip;
                                                </span>
                                            ) : (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setPage(n)}
                                                    aria-label={`Page ${n}`}
                                                    aria-current={currentPage === n ? "page" : undefined}
                                                    className={`h-9 w-9 rounded-lg border text-sm font-medium tabular-nums active:scale-[0.95] motion-safe:transition ${focusRing} focus-visible:ring-offset-1 ${
                                                        currentPage === n
                                                            ? "border-rose-600 bg-rose-600 text-white"
                                                            : "border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                                                    }`}
                                                >
                                                    {n}
                                                </button>
                                            )
                                        )}
                                        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className={pageBtn}>
                                            Next
                                        </button>
                                    </nav>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Conversation */}
            <Dialog open={!!thread} onClose={() => setThreadId(null)} labelledBy={threadTitleId} className="sm:max-w-2xl">
                {thread && (
                    <>
                        <DialogHeader id={threadTitleId} title={thread.name} subtitle={describe(thread)} leading={<Avatar name={thread.name} size="lg" />} onClose={() => setThreadId(null)} />
                        <div ref={threadRef} className="min-h-64 flex-1 overflow-y-auto bg-gray-50 px-6 py-5">
                            {threadLoading ? (
                                <p className="py-16 text-center text-sm text-gray-500">Loading conversation…</p>
                            ) : messages.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-sm font-medium text-gray-900">No messages with {thread.name} yet</p>
                                    <p className="mt-1 text-sm text-gray-500">Your first message will appear here.</p>
                                </div>
                            ) : (
                                <ol className="space-y-2" aria-live="polite">
                                    {messages.map((m, i) => {
                                        const mine = m.senderId === currentUserId;
                                        const newDay = i === 0 || startOfDay(new Date(messages[i - 1].createdAt)) !== startOfDay(new Date(m.createdAt));
                                        return (
                                            <li key={m.id}>
                                                {newDay && (
                                                    <div className="my-4 flex items-center gap-3 text-xs text-gray-500">
                                                        <span aria-hidden="true" className="h-px flex-1 bg-gray-200" />
                                                        {dayHeading(m.createdAt)}
                                                        <span aria-hidden="true" className="h-px flex-1 bg-gray-200" />
                                                    </div>
                                                )}
                                                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                                    <div
                                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-rose-600 text-white" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"}`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                                                        <time
                                                            dateTime={m.createdAt}
                                                            className={`mt-1 block text-right text-[11px] tabular-nums ${mine ? "text-rose-100" : "text-gray-500"}`}
                                                        >
                                                            {clock(m.createdAt)}
                                                        </time>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                        </div>
                        <form
                            className="border-t border-gray-200 bg-white px-6 py-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendReply();
                            }}
                        >
                            <label htmlFor="reply" className="sr-only">Message {thread.name}</label>
                            <textarea
                                id="reply"
                                autoFocus
                                rows={3}
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        sendReply();
                                    }
                                }}
                                placeholder={`Write to ${thread.name}`}
                                className="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                            />
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="hidden text-xs text-gray-500 sm:block">Press Enter to send. Shift + Enter starts a new line.</p>
                                <button
                                    type="submit"
                                    disabled={!reply.trim() || sending}
                                    className={`ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-500 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                                >
                                    <Send size={16} aria-hidden="true" />
                                    {sending ? "Sending…" : "Send"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </Dialog>

            {/* New message */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} labelledBy={composeTitleId} className="sm:max-w-lg">
                <DialogHeader id={composeTitleId} title="New message" onClose={() => setComposeOpen(false)} />
                <form onSubmit={sendCompose} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto px-6 py-5">
                        <div className={`grid gap-4 ${composeRole === "STUDENT" ? "sm:grid-cols-2" : ""}`}>
                            <label className="block text-sm font-medium text-gray-700">
                                Send to
                                <select
                                    autoFocus
                                    value={composeRole}
                                    onChange={(e) => {
                                        setComposeRole(e.target.value as Role);
                                        setComposeClass("");
                                        setComposeTo("");
                                    }}
                                    className={fieldClass}
                                >
                                    {TABS.map((t) => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                    ))}
                                </select>
                            </label>
                            {composeRole === "STUDENT" && (
                                <label className="block text-sm font-medium text-gray-700">
                                    Class
                                    <select
                                        value={composeClass}
                                        onChange={(e) => {
                                            setComposeClass(e.target.value);
                                            setComposeTo("");
                                        }}
                                        className={fieldClass}
                                    >
                                        <option value="">Choose a class</option>
                                        {composeClasses.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </label>
                            )}
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Recipient
                            <select
                                value={composeTo}
                                onChange={(e) => setComposeTo(e.target.value)}
                                disabled={needsClass || composeOptions.length === 0}
                                className={fieldClass}
                            >
                                <option value="">
                                    {needsClass
                                        ? "Choose a class first"
                                        : composeOptions.length === 0
                                          ? `No ${composeTab.label.toLowerCase()} to choose from`
                                          : `Choose a ${composeTab.singular}`}
                                </option>
                                {composeOptions.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Message
                            <textarea
                                rows={6}
                                value={composeText}
                                onChange={(e) => setComposeText(e.target.value)}
                                placeholder="Write your message"
                                className={`${fieldClass} resize-none`}
                            />
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <button
                            type="button"
                            onClick={() => setComposeOpen(false)}
                            className={`h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 motion-safe:transition-colors ${focusRing}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!composeTo || !composeText.trim() || sending}
                            className={`inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-500 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                        >
                            <Send size={16} aria-hidden="true" />
                            {sending ? "Sending…" : "Send message"}
                        </button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}
