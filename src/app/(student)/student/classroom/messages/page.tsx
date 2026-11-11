"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight, Lock, MessageSquare, Plus, Search, Send } from "lucide-react";
import { apiErrorMessage } from "@/lib/apiError";
import toast from "react-hot-toast";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useGetMessageRecipientsQuery } from "@/redux/api/studentApi";
import { useGetConversationQuery, useGetConversationsQuery, useSendMessageMutation, type ConversationItem } from "@/redux/api/operationsApi";
import { EmptyState, PageHeader, Pager, clock, dayHeading, focusRing, inputClass, paginate, primaryBtn, secondaryBtn, shortDate, startOfDay } from "@/components/student/ui";

type Group = "TEACHERS" | "PRINCIPAL" | "OFFICE";
type Contact = { id: string; name: string; role: string; group: Group; canSend: boolean };

const TABS: { key: Group; label: string }[] = [
    { key: "TEACHERS", label: "Teachers" },
    { key: "PRINCIPAL", label: "Principal" },
    { key: "OFFICE", label: "School office" },
];

const ROLE_LABEL: Record<string, string> = {
    TEACHER: "Teacher",
    "Class Teacher": "Class teacher",
    PRINCIPAL: "Principal",
    ACCOUNTANT: "Accountant",
    SUPER_ADMIN: "School administration",
};
// Students may write to teachers and the principal. The office can write to students, but replies are turned off.
const CAN_SEND_ROLES = ["TEACHER", "Class Teacher", "PRINCIPAL"];
const groupOf = (role: string): Group => (role === "PRINCIPAL" ? "PRINCIPAL" : role === "TEACHER" || role === "Class Teacher" ? "TEACHERS" : "OFFICE");

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

function listDate(value: string) {
    const d = new Date(value);
    const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
    if (diff === 0) return clock(value);
    if (diff === 1) return "Yesterday";
    return shortDate(value);
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-sky-50 font-semibold text-sky-700 ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}>
            {initials(name)}
        </span>
    );
}

function PersonRow({ contact, conv, onOpen }: { contact: Contact; conv?: ConversationItem; onOpen: () => void }) {
    return (
        <li>
            <button
                type="button"
                onClick={onOpen}
                className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}
            >
                <Avatar name={contact.name} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                        <span className="min-w-0 truncate text-sm">
                            <span className="font-medium text-gray-900">{contact.name}</span>
                            <span className="ml-2 text-gray-500">{ROLE_LABEL[contact.role] ?? contact.role}</span>
                        </span>
                        {conv && (
                            <time dateTime={conv.lastMessageAt} className="shrink-0 text-xs tabular-nums text-gray-500">
                                {listDate(conv.lastMessageAt)}
                            </time>
                        )}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                        {!contact.canSend && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                <Lock size={11} aria-hidden="true" />
                                Read only
                            </span>
                        )}
                        <span className={`min-w-0 truncate text-sm ${conv ? "text-gray-600" : "text-gray-500"}`}>
                            {conv ? `${conv.direction === "sent" ? "You: " : ""}${conv.lastMessage}` : "No messages yet"}
                        </span>
                    </span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-gray-300 group-hover:text-gray-500 motion-safe:transition motion-safe:group-hover:translate-x-0.5" />
            </button>
        </li>
    );
}

function MessagesContent() {
    const reduceMotion = useReducedMotion();
    const router = useRouter();
    const searchParams = useSearchParams();
    const threadTitleId = useId();
    const composeTitleId = useId();
    // Portal layouts render children only after their localStorage auth check, so this is safe.
    const [currentUserId] = useState<string>(() => {
        try {
            return JSON.parse(localStorage.getItem("authUser") || "{}").id ?? "";
        } catch {
            return "";
        }
    });

    const [tab, setTab] = useState<Group>("TEACHERS");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    // ?to=<userId> (from the Classroom page) opens that conversation straight away.
    const [threadId, setThreadId] = useState<string | null>(() => searchParams.get("to"));
    const [reply, setReply] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeText, setComposeText] = useState("");

    const { data: recipients = [], isLoading, isError, refetch } = useGetMessageRecipientsQuery();
    const { data: conversations = [] } = useGetConversationsQuery(currentUserId, { skip: !currentUserId, pollingInterval: 30000, skipPollingIfUnfocused: true });
    const { data: messages = [], isLoading: threadLoading } = useGetConversationQuery(
        { userId: currentUserId, otherUserId: threadId ?? "" },
        { skip: !currentUserId || !threadId, pollingInterval: 5000, skipPollingIfUnfocused: true }
    );
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    const contacts = useMemo<Contact[]>(
        () => recipients.map((r) => ({ id: r.id, name: r.name, role: r.role, group: groupOf(r.role), canSend: CAN_SEND_ROLES.includes(r.role) })),
        [recipients]
    );
    const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
    const convById = useMemo(() => new Map(conversations.map((c) => [c.otherUserId, c])), [conversations]);

    const q = search.trim().toLowerCase();
    const matches = (c: Contact) => !q || c.name.toLowerCase().includes(q) || (ROLE_LABEL[c.role] ?? c.role).toLowerCase().includes(q);
    const countFor = (g: Group) => contacts.filter((c) => c.group === g && matches(c)).length;
    // People with a conversation come first, newest first; everyone else alphabetically, class teacher on top.
    const byRecent = (a: Contact, b: Contact) => {
        const ta = convById.get(a.id)?.lastMessageAt ?? "";
        const tb = convById.get(b.id)?.lastMessageAt ?? "";
        if (ta !== tb) return tb.localeCompare(ta);
        if ((a.role === "Class Teacher") !== (b.role === "Class Teacher")) return a.role === "Class Teacher" ? -1 : 1;
        return a.name.localeCompare(b.name);
    };
    const rows = contacts.filter((c) => c.group === tab && matches(c)).sort(byRecent);
    const { pageCount, current, pageRows } = paginate(rows, page);
    const otherTabWithMatches = q ? TABS.find((t) => t.key !== tab && countFor(t.key) > 0) : undefined;

    const thread = threadId ? contactById.get(threadId) : undefined;

    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, threadId]);

    const switchTab = (key: Group) => {
        setTab(key);
        setPage(1);
    };
    const openThread = (id: string) => {
        setReply("");
        setThreadId(id);
    };
    const closeThread = () => {
        setThreadId(null);
        if (searchParams.get("to")) router.replace("/student/classroom/messages", { scroll: false });
    };

    const sendReply = async () => {
        const text = reply.trim();
        if (!text || !threadId || sending || !thread?.canSend) return;
        try {
            await sendMessage({ receiverId: threadId, content: text }).unwrap();
            setReply("");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    const sendable = contacts.filter((c) => c.canSend).sort((a, b) => a.name.localeCompare(b.name));
    const openCompose = () => {
        setComposeTo(thread?.canSend ? thread.id : "");
        setComposeText("");
        setComposeOpen(true);
    };
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

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="Messages"
                subtitle="For questions and formal requests to your teachers and the principal."
                actions={
                    <button type="button" onClick={openCompose} disabled={isLoading || sendable.length === 0} className={primaryBtn}>
                        <Plus size={18} aria-hidden="true" />
                        New message
                    </button>
                }
            />

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div role="tablist" aria-label="Recipient type" className="-mb-px flex gap-5 overflow-x-auto sm:gap-6">
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
                                    <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums motion-safe:transition-colors ${active ? "bg-sky-50 text-sky-700" : "bg-gray-100 text-gray-600"}`}>
                                        {isLoading ? "…" : countFor(t.key)}
                                    </span>
                                    {active && (
                                        <motion.span
                                            layoutId="student-messages-tab-underline"
                                            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-sky-600"
                                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="pb-3 lg:w-72 lg:pb-0">
                        <div className="relative">
                            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <label htmlFor="message-search" className="sr-only">Search people</label>
                            <input
                                id="message-search"
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by name or role"
                                className={`${inputClass} h-10 py-0 pl-9`}
                            />
                        </div>
                    </div>
                </div>

                {tab === "OFFICE" && !isLoading && rows.length > 0 && (
                    <p className="flex items-start gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 sm:px-6">
                        <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-400" />
                        You can read messages from the school office here. For fee questions, write to your class teacher.
                    </p>
                )}

                <div role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label}>
                    {isLoading ? (
                        <ul aria-hidden="true" className="divide-y divide-gray-100">
                            {Array.from({ length: 4 }, (_, i) => (
                                <li key={i} className="flex items-center gap-4 px-6 py-4">
                                    <span className="h-9 w-9 rounded-full bg-gray-100 motion-safe:animate-pulse" />
                                    <span className="flex-1 space-y-2">
                                        <span className="block h-3 w-40 rounded bg-gray-100 motion-safe:animate-pulse" />
                                        <span className="block h-3 w-64 max-w-full rounded bg-gray-100 motion-safe:animate-pulse" />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : isError ? (
                        <EmptyState
                            title="Your contacts couldn't be loaded."
                            hint="Check your connection, then try again."
                            action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    ) : rows.length === 0 ? (
                        q ? (
                            <EmptyState
                                icon={<MessageSquare size={28} />}
                                title={`No one here matches “${search.trim()}”`}
                                action={
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {otherTabWithMatches && (
                                            <button type="button" onClick={() => switchTab(otherTabWithMatches.key)} className={`rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 motion-safe:transition-colors ${focusRing}`}>
                                                Show {countFor(otherTabWithMatches.key)} in {otherTabWithMatches.label}
                                            </button>
                                        )}
                                        <button type="button" onClick={() => setSearch("")} className={secondaryBtn}>Clear search</button>
                                    </div>
                                }
                            />
                        ) : (
                            <EmptyState
                                icon={<MessageSquare size={28} />}
                                title={tab === "TEACHERS" ? "No teachers are linked to your class yet" : tab === "PRINCIPAL" ? "The principal isn't listed yet" : "No messages from the school office"}
                                hint={tab === "OFFICE" ? "Messages the accounts office sends you will appear here." : "Ask your class teacher or the school office to set this up."}
                            />
                        )
                    ) : (
                        <>
                            <ul className="divide-y divide-gray-100">
                                {pageRows.map((c) => (
                                    <PersonRow key={c.id} contact={c} conv={convById.get(c.id)} onOpen={() => openThread(c.id)} />
                                ))}
                            </ul>
                            <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                        </>
                    )}
                </div>
            </section>

            {/* Conversation */}
            <Dialog open={!!thread} onClose={closeThread} labelledBy={threadTitleId} className="sm:max-w-2xl">
                {thread && (
                    <>
                        <DialogHeader accent="sky" id={threadTitleId} title={thread.name} subtitle={ROLE_LABEL[thread.role] ?? thread.role} leading={<Avatar name={thread.name} size="lg" />} onClose={closeThread} />
                        <div ref={threadRef} className="min-h-64 flex-1 overflow-y-auto bg-gray-50 px-4 py-5 sm:px-6">
                            {threadLoading ? (
                                <p className="py-16 text-center text-sm text-gray-500">Loading conversation…</p>
                            ) : messages.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-sm font-medium text-gray-900">No messages with {thread.name} yet</p>
                                    <p className="mt-1 text-sm text-gray-500">{thread.canSend ? "Your first message will appear here." : "Messages they send you will appear here."}</p>
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
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-sky-600 text-white" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"}`}>
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                                                        <time dateTime={m.createdAt} className={`mt-1 block text-right text-[11px] tabular-nums ${mine ? "text-sky-100" : "text-gray-400"}`}>
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
                        {thread.canSend ? (
                            <form
                                className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6"
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
                                    className={`${inputClass} resize-none`}
                                />
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <p className="hidden text-xs text-gray-500 sm:block">Press Enter to send. Shift + Enter starts a new line.</p>
                                    <button type="submit" disabled={!reply.trim() || sending} className={`${primaryBtn} ml-auto`}>
                                        <Send size={16} aria-hidden="true" />
                                        {sending ? "Sending…" : "Send"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="flex items-start gap-2 border-t border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 sm:px-6">
                                <Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-400" />
                                Replies to the school office are turned off. For questions, write to your class teacher.
                            </p>
                        )}
                    </>
                )}
            </Dialog>

            {/* New message */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} labelledBy={composeTitleId} className="sm:max-w-lg">
                <DialogHeader accent="sky" id={composeTitleId} title="New message" onClose={() => setComposeOpen(false)} />
                <form onSubmit={sendCompose} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Send to
                            <select autoFocus value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose a teacher or the principal</option>
                                {TABS.filter((t) => t.key !== "OFFICE").map((t) => {
                                    const options = sendable.filter((c) => c.group === t.key);
                                    return options.length ? (
                                        <optgroup key={t.key} label={t.label}>
                                            {options.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}{c.role === "Class Teacher" ? " (class teacher)" : ""}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ) : null;
                                })}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Message
                            <textarea rows={6} value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write your question or request" className={`${inputClass} mt-1.5 resize-none`} />
                        </label>
                        <p className="text-xs text-gray-500">Keep messages formal and to the point. For casual chat, speak to your teacher in class.</p>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button type="button" onClick={() => setComposeOpen(false)} className={`${secondaryBtn} h-10`}>Cancel</button>
                        <button type="submit" disabled={!composeTo || !composeText.trim() || sending} className={primaryBtn}>
                            <Send size={16} aria-hidden="true" />
                            {sending ? "Sending…" : "Send message"}
                        </button>
                    </div>
                </form>
            </Dialog>
        </div>
    );
}

export default function StudentMessagesPage() {
    return (
        <Suspense fallback={<div className="mx-auto h-64 max-w-5xl rounded-xl border border-gray-200 bg-white" />}>
            <MessagesContent />
        </Suspense>
    );
}
