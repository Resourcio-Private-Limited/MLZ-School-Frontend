"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, MessageSquare, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useGetPrincipalMessageRecipientsQuery } from "@/redux/api/principalApi";
import { useGetConversationQuery, useGetConversationsQuery, useSendMessageMutation, type ConversationItem } from "@/redux/api/operationsApi";
import {
    EmptyState,
    PageHeader,
    Pager,
    SearchBox,
    Tabs,
    clock,
    dayHeading,
    errorMessage,
    focusRing,
    initials,
    inputClass,
    paginate,
    primaryBtn,
    readAuthUser,
    secondaryBtn,
    shortDate,
    startOfDay,
} from "@/components/principal/ui";

type Group = "TEACHERS" | "OFFICE" | "STUDENTS";
type Contact = { id: string; name: string; role: string; group: Group };

const TABS: { key: Group; label: string }[] = [
    { key: "TEACHERS", label: "Teachers" },
    { key: "OFFICE", label: "School office" },
    { key: "STUDENTS", label: "Students" },
];

const ROLE_LABEL: Record<string, string> = {
    TEACHER: "Teacher",
    SUPER_ADMIN: "School administration",
    ACCOUNTANT: "Accounts office",
    STUDENT: "Student",
};

const groupOf = (role: string): Group => (role === "TEACHER" ? "TEACHERS" : role === "STUDENT" ? "STUDENTS" : "OFFICE");

function listDate(value: string) {
    const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / 86_400_000);
    if (diff === 0) return clock(value);
    if (diff === 1) return "Yesterday";
    return shortDate(value);
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-purple-50 font-semibold text-purple-700 ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}>
            {initials(name) || "?"}
        </span>
    );
}

/**
 * Students aren't in the recipient list and conversations carry no names, so a student is shown by the
 * sign-in email on their messages. The thread is fetched (and cached) only for rows on screen.
 */
function useStudentEmail(me: string, contact: Contact) {
    const isStudent = contact.group === "STUDENTS";
    const { data } = useGetConversationQuery({ userId: me, otherUserId: contact.id }, { skip: !isStudent || !me });
    if (!isStudent) return null;
    const m = data?.[0];
    return m ? (m.senderId === contact.id ? m.sender.email : m.receiver.email) : null;
}

function PersonRow({ me, contact, conv, onOpen }: { me: string; contact: Contact; conv?: ConversationItem; onOpen: (label: string) => void }) {
    const email = useStudentEmail(me, contact);
    const name = email ?? contact.name;
    return (
        <li>
            <button type="button" onClick={() => onOpen(name)} className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}>
                <Avatar name={name} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                        <span className="min-w-0 truncate text-sm">
                            <span className="font-medium text-gray-900">{name}</span>
                            <span className="ml-2 text-gray-500">{ROLE_LABEL[contact.role] ?? contact.role}</span>
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
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-gray-300 group-hover:text-gray-500 motion-safe:transition motion-safe:group-hover:translate-x-0.5" />
            </button>
        </li>
    );
}

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const threadTitleId = useId();
    const composeTitleId = useId();
    const [{ id: currentUserId }] = useState(readAuthUser);

    const [tab, setTab] = useState<Group>("TEACHERS");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [threadId, setThreadId] = useState<string | null>(() => searchParams.get("to"));
    const [threadLabel, setThreadLabel] = useState<string | null>(null);
    const [reply, setReply] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeText, setComposeText] = useState("");

    const recipientsQ = useGetPrincipalMessageRecipientsQuery();
    const { data: conversations = [], isLoading: convLoading } = useGetConversationsQuery(currentUserId, { skip: !currentUserId, pollingInterval: 30000, skipPollingIfUnfocused: true });
    const { data: messages = [], isLoading: threadLoading } = useGetConversationQuery(
        { userId: currentUserId, otherUserId: threadId ?? "" },
        { skip: !currentUserId || !threadId, pollingInterval: 5000, skipPollingIfUnfocused: true }
    );
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    // Everyone the principal can write to, plus anyone else who has a conversation with them (students, and staff no longer listed).
    const contacts = useMemo<Contact[]>(() => {
        const listed = (recipientsQ.data ?? []).map((r) => ({ id: r.id, name: r.name, role: r.role, group: groupOf(r.role) }));
        const known = new Set(listed.map((c) => c.id));
        const others = conversations
            .filter((c) => !known.has(c.otherUserId))
            .map((c) => ({ id: c.otherUserId, name: ROLE_LABEL[c.otherUserRole] ?? "Contact", role: c.otherUserRole, group: groupOf(c.otherUserRole) }));
        return [...listed, ...others];
    }, [recipientsQ.data, conversations]);
    const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
    const convById = useMemo(() => new Map(conversations.map((c) => [c.otherUserId, c])), [conversations]);

    const q = search.trim().toLowerCase();
    const matches = (c: Contact) => !q || c.name.toLowerCase().includes(q) || (ROLE_LABEL[c.role] ?? "").toLowerCase().includes(q);
    const countFor = (g: Group) => contacts.filter((c) => c.group === g && matches(c)).length;
    // People you have a conversation with come first, newest first; everyone else by name.
    const byRecent = (a: Contact, b: Contact) => {
        const ta = convById.get(a.id)?.lastMessageAt ?? "";
        const tb = convById.get(b.id)?.lastMessageAt ?? "";
        return ta !== tb ? tb.localeCompare(ta) : a.name.localeCompare(b.name);
    };
    const rows = contacts.filter((c) => c.group === tab && matches(c)).sort(byRecent);
    const { pageCount, current, pageRows } = paginate(rows, page);
    const isLoading = recipientsQ.isLoading || (tab === "STUDENTS" && convLoading);
    const otherTabWithMatches = q ? TABS.find((t) => t.key !== tab && countFor(t.key) > 0) : undefined;

    const thread = threadId ? contactById.get(threadId) : undefined;
    // A student's label comes from the thread itself when the dialog opened from a ?to= link.
    const threadFirst = messages[0];
    const threadEmail = thread?.group === "STUDENTS" && threadFirst ? (threadFirst.senderId === thread.id ? threadFirst.sender.email : threadFirst.receiver.email) : null;
    const threadName = threadLabel ?? threadEmail ?? thread?.name ?? "";

    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, threadId]);

    const switchTab = (key: Group) => {
        setTab(key);
        setPage(1);
    };
    const openThread = (id: string, label: string | null = null) => {
        setReply("");
        setThreadLabel(label);
        setThreadId(id);
    };
    const closeThread = () => {
        setThreadId(null);
        setThreadLabel(null);
        if (searchParams.get("to")) router.replace("/principal/messages", { scroll: false });
    };

    const sendReply = async () => {
        const text = reply.trim();
        if (!text || !threadId || sending) return;
        try {
            await sendMessage({ receiverId: threadId, content: text }).unwrap();
            setReply("");
        } catch (err) {
            toast.error(errorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    const listed = (recipientsQ.data ?? []).map((r) => ({ id: r.id, name: r.name, role: r.role, group: groupOf(r.role) }));
    const openCompose = () => {
        setComposeTo(thread && listed.some((c) => c.id === thread.id) ? thread.id : "");
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
            toast.error(errorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="Messages"
                subtitle="Formal notes to teachers, the school administration and the accounts office, and replies to students who write to you."
                actions={
                    <button type="button" onClick={openCompose} disabled={recipientsQ.isLoading || listed.length === 0} className={primaryBtn}>
                        <Plus size={18} aria-hidden="true" />
                        New message
                    </button>
                }
            />

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                        label="Recipient type"
                        layoutId="principal-messages-tab-underline"
                        value={tab}
                        onChange={switchTab}
                        loading={recipientsQ.isLoading}
                        tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: countFor(t.key) }))}
                    />
                    <SearchBox
                        id="message-search"
                        label="Search people"
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            setPage(1);
                        }}
                        placeholder="Search by name or role"
                        className="pb-3 lg:w-72 lg:pb-0"
                    />
                </div>

                {tab === "STUDENTS" && !isLoading && rows.length > 0 && (
                    <p className="border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 sm:px-6">
                        Students who have written to you. They&apos;re shown by their sign-in email; open a conversation to reply.
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
                    ) : recipientsQ.isError ? (
                        <EmptyState
                            title="Your contacts couldn't be loaded."
                            hint="It might be a temporary problem — try again in a moment."
                            action={<button type="button" onClick={() => recipientsQ.refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    ) : rows.length === 0 ? (
                        q ? (
                            <EmptyState
                                icon={<MessageSquare size={28} />}
                                title={`No one here matches “${search.trim()}”`}
                                action={
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {otherTabWithMatches && (
                                            <button type="button" onClick={() => switchTab(otherTabWithMatches.key)} className={`rounded-lg bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 motion-safe:transition-colors ${focusRing}`}>
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
                                title={tab === "TEACHERS" ? "No teachers are listed yet" : tab === "OFFICE" ? "The school office isn't listed yet" : "No students have written to you yet"}
                                hint={tab === "STUDENTS" ? "When a student writes to you from their portal, the conversation appears here." : "Ask the school administration to add their accounts."}
                            />
                        )
                    ) : (
                        <>
                            <ul className="divide-y divide-gray-100">
                                {pageRows.map((c) => (
                                    <PersonRow key={c.id} me={currentUserId} contact={c} conv={convById.get(c.id)} onOpen={(label) => openThread(c.id, c.group === "STUDENTS" ? label : null)} />
                                ))}
                            </ul>
                            <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                        </>
                    )}
                </div>
            </section>

            {/* Conversation */}
            <Dialog open={!!threadId} onClose={closeThread} labelledBy={threadTitleId} className="sm:max-w-2xl">
                {threadId && (
                    <>
                        <DialogHeader
                            accent="purple"
                            id={threadTitleId}
                            title={threadName || "Conversation"}
                            subtitle={thread ? ROLE_LABEL[thread.role] ?? thread.role : undefined}
                            leading={<Avatar name={threadName || "?"} size="lg" />}
                            onClose={closeThread}
                        />
                        <div ref={threadRef} className="min-h-64 flex-1 overflow-y-auto bg-gray-50 px-4 py-5 sm:px-6">
                            {threadLoading ? (
                                <p className="py-16 text-center text-sm text-gray-500">Loading conversation…</p>
                            ) : messages.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-sm font-medium text-gray-900">No messages with {threadName || "them"} yet</p>
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
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-purple-600 text-white" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"}`}>
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                                                        <time dateTime={m.createdAt} className={`mt-1 block text-right text-[11px] tabular-nums ${mine ? "text-purple-100" : "text-gray-500"}`}>
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
                            className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendReply();
                            }}
                        >
                            <label htmlFor="reply" className="sr-only">Message {threadName || "this person"}</label>
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
                                placeholder={`Write to ${threadName || "them"}`}
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
                    </>
                )}
            </Dialog>

            {/* New message */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} labelledBy={composeTitleId} className="sm:max-w-lg">
                <DialogHeader accent="purple" id={composeTitleId} title="New message" onClose={() => setComposeOpen(false)} />
                <form onSubmit={sendCompose} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Send to
                            <select autoFocus value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose a teacher or the school office</option>
                                {(["TEACHERS", "OFFICE"] as const).map((g) =>
                                    listed.some((c) => c.group === g) ? (
                                        <optgroup key={g} label={g === "TEACHERS" ? "Teachers" : "School office"}>
                                            {listed
                                                .filter((c) => c.group === g)
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                        {g === "OFFICE" ? ` (${ROLE_LABEL[c.role]?.toLowerCase() ?? c.role})` : ""}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    ) : null
                                )}
                            </select>
                            <span className="mt-1 block text-xs font-normal text-gray-500">To reply to a student, open their conversation on the Students tab.</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Message
                            <textarea rows={6} value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write your message" className={`${inputClass} mt-1.5 resize-none`} />
                        </label>
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

export default function PrincipalMessagesPage() {
    return (
        <Suspense fallback={<div className="mx-auto h-64 max-w-5xl rounded-xl border border-gray-200 bg-white" />}>
            <MessagesContent />
        </Suspense>
    );
}
