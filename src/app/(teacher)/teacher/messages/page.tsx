"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Lock, MessageSquare, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useGetClassStudentsQuery, useGetMessageRecipientsQuery, useGetTeacherClassesQuery, type TeacherClass } from "@/redux/api/teacherApi";
import { useGetConversationQuery, useGetConversationsQuery, useSendMessageMutation, type ConversationItem } from "@/redux/api/operationsApi";
import {
    EmptyState,
    FilterChips,
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
} from "@/components/teacher/ui";

type Group = "STUDENTS" | "PRINCIPAL" | "OFFICE";
type Contact = { id: string; name: string; role: string; detail?: string; group: Group; canSend: boolean };

const TABS: { key: Group; label: string }[] = [
    { key: "STUDENTS", label: "Students" },
    { key: "PRINCIPAL", label: "Principal" },
    { key: "OFFICE", label: "School office" },
];

const ROLE_LABEL: Record<string, string> = {
    STUDENT: "Student",
    PRINCIPAL: "Principal",
    ACCOUNTANT: "Accounts office",
    SUPER_ADMIN: "School administration",
};

// Teachers write to their students and the principal. The office can write to teachers, but replies are turned off.
const groupOf = (role: string): Group => (role === "PRINCIPAL" ? "PRINCIPAL" : role === "STUDENT" ? "STUDENTS" : "OFFICE");

function listDate(value: string) {
    const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / 86_400_000);
    if (diff === 0) return clock(value);
    if (diff === 1) return "Yesterday";
    return shortDate(value);
}

const gradeKey = (c: TeacherClass) => c.grade || c.name;
const byNumber = (a: string, b: string) => a.localeCompare(b, "en-IN", { numeric: true });

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700 ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}>
            {initials(name)}
        </span>
    );
}

function PersonRow({ contact, conv, onOpen }: { contact: Contact; conv?: ConversationItem; onOpen: () => void }) {
    return (
        <li>
            <button type="button" onClick={onOpen} className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}>
                <Avatar name={contact.name} />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-4">
                        <span className="min-w-0 truncate text-sm">
                            <span className="font-medium text-gray-900">{contact.name}</span>
                            <span className="ml-2 text-gray-500">{contact.detail ?? ROLE_LABEL[contact.role] ?? contact.role}</span>
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
                        <span className={`min-w-0 truncate text-sm ${conv ? "text-gray-600" : "text-gray-400"}`}>
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const threadTitleId = useId();
    const composeTitleId = useId();
    const [{ id: currentUserId }] = useState(readAuthUser);

    const classesQ = useGetTeacherClassesQuery();
    const classes = useMemo(() => [...(classesQ.data ?? [])].sort((a, b) => byNumber(a.name, b.name)), [classesQ.data]);

    // ?class=<classroomId> (from a classroom page) picks that class; otherwise your own class, then the first one.
    const [pickedClass, setPickedClass] = useState<string | null>(() => searchParams.get("class"));
    const classId = (pickedClass && classes.some((c) => c.id === pickedClass) ? pickedClass : null) ?? classes.find((c) => c.isClassTeacher)?.id ?? classes[0]?.id ?? "";
    const currentClass = classes.find((c) => c.id === classId);
    const grades = [...new Set(classes.map(gradeKey))].sort(byNumber);
    const sections = classes.filter((c) => currentClass && gradeKey(c) === gradeKey(currentClass)).sort((a, b) => byNumber(a.section, b.section));

    const [tab, setTab] = useState<Group>("STUDENTS");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [threadId, setThreadId] = useState<string | null>(() => searchParams.get("to"));
    const [reply, setReply] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeText, setComposeText] = useState("");

    const recipientsQ = useGetMessageRecipientsQuery();
    const studentsQ = useGetClassStudentsQuery(classId, { skip: !classId });
    const { data: conversations = [] } = useGetConversationsQuery(currentUserId, { skip: !currentUserId, pollingInterval: 30000, skipPollingIfUnfocused: true });
    const { data: messages = [], isLoading: threadLoading } = useGetConversationQuery(
        { userId: currentUserId, otherUserId: threadId ?? "" },
        { skip: !currentUserId || !threadId, pollingInterval: 5000, skipPollingIfUnfocused: true }
    );
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    const contacts = useMemo<Contact[]>(() => {
        const staff = (recipientsQ.data ?? []).map((r) => ({ id: r.id, name: r.name, role: r.role, group: groupOf(r.role), canSend: r.role === "PRINCIPAL" }));
        const pupils = (studentsQ.data ?? []).map((s) => ({
            id: s.userId,
            name: s.fullName,
            role: "STUDENT",
            detail: s.rollNumber ? `Roll ${s.rollNumber}` : "Student",
            group: "STUDENTS" as const,
            canSend: true,
        }));
        return [...pupils, ...staff];
    }, [recipientsQ.data, studentsQ.data]);
    const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);
    const convById = useMemo(() => new Map(conversations.map((c) => [c.otherUserId, c])), [conversations]);

    const q = search.trim().toLowerCase();
    const matches = (c: Contact) => !q || c.name.toLowerCase().includes(q) || (c.detail ?? ROLE_LABEL[c.role] ?? "").toLowerCase().includes(q);
    const countFor = (g: Group) => contacts.filter((c) => c.group === g && matches(c)).length;
    // People you have a conversation with come first, newest first; everyone else by name.
    const byRecent = (a: Contact, b: Contact) => {
        const ta = convById.get(a.id)?.lastMessageAt ?? "";
        const tb = convById.get(b.id)?.lastMessageAt ?? "";
        return ta !== tb ? tb.localeCompare(ta) : a.name.localeCompare(b.name);
    };
    const rows = contacts.filter((c) => c.group === tab && matches(c)).sort(byRecent);
    const { pageCount, current, pageRows } = paginate(rows, page);
    const isLoading = recipientsQ.isLoading || classesQ.isLoading || (tab === "STUDENTS" && studentsQ.isLoading);
    const isError = recipientsQ.isError || (tab === "STUDENTS" && studentsQ.isError);
    const otherTabWithMatches = q ? TABS.find((t) => t.key !== tab && countFor(t.key) > 0) : undefined;

    const thread = threadId ? contactById.get(threadId) : undefined;

    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, threadId]);

    const pickClass = (id: string) => {
        setPickedClass(id);
        setPage(1);
    };
    const pickGrade = (g: string) => {
        const first = classes.filter((c) => gradeKey(c) === g).sort((a, b) => byNumber(a.section, b.section))[0];
        if (first) pickClass(first.id);
    };
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
        if (searchParams.get("to")) router.replace(classId ? `/teacher/messages?class=${classId}` : "/teacher/messages", { scroll: false });
    };

    const sendReply = async () => {
        const text = reply.trim();
        if (!text || !threadId || sending || !thread?.canSend) return;
        try {
            await sendMessage({ receiverId: threadId, content: text }).unwrap();
            setReply("");
        } catch (err) {
            toast.error(errorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    const sendable = contacts.filter((c) => c.canSend);
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
            toast.error(errorMessage(err, "Message not sent. Check your connection and try again."));
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <PageHeader
                title="Messages"
                subtitle="For formal questions and requests to your students and the principal."
                actions={
                    <button type="button" onClick={openCompose} disabled={recipientsQ.isLoading || sendable.length === 0} className={primaryBtn}>
                        <Plus size={18} aria-hidden="true" />
                        New message
                    </button>
                }
            />

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                        label="Recipient type"
                        layoutId="teacher-messages-tab-underline"
                        value={tab}
                        onChange={switchTab}
                        loading={recipientsQ.isLoading}
                        tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: countFor(t.key) }))}
                    />
                    <SearchBox
                        id="message-search"
                        label="Search people"
                        value={search}
                        onChange={(v) => { setSearch(v); setPage(1); }}
                        placeholder={tab === "STUDENTS" ? "Search by name or roll" : "Search by name or role"}
                        className="pb-3 lg:w-72 lg:pb-0"
                    />
                </div>

                {tab === "STUDENTS" && classes.length > 0 && (
                    <div className="space-y-2 border-b border-gray-200 px-4 py-3 sm:px-6">
                        <FilterChips
                            label="Class"
                            layoutId="teacher-messages-grade"
                            value={currentClass ? gradeKey(currentClass) : ""}
                            onChange={pickGrade}
                            options={grades.map((g) => ({ value: g, label: /^\d+$/.test(g) ? `Class ${g}` : g }))}
                        />
                        {sections.length > 1 && (
                            <FilterChips
                                label="Section"
                                layoutId="teacher-messages-section"
                                value={classId}
                                onChange={pickClass}
                                options={sections.map((c) => ({ value: c.id, label: `Section ${c.section}`, count: c.studentCount }))}
                            />
                        )}
                        {currentClass && (
                            <p className="text-xs text-gray-500">
                                {currentClass.name}
                                {currentClass.isClassTeacher ? ", your class" : currentClass.subjects.length ? `, you teach ${currentClass.subjects.join(", ")}` : ""}
                            </p>
                        )}
                    </div>
                )}

                {tab === "OFFICE" && !isLoading && rows.length > 0 && (
                    <p className="flex items-start gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 sm:px-6">
                        <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-400" />
                        You can read messages from the school office here. To raise something with the office, write to the principal.
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
                            hint="It might be a temporary problem — try again in a moment."
                            action={<button type="button" onClick={() => { recipientsQ.refetch(); if (classId) studentsQ.refetch(); }} className={secondaryBtn}>Try again</button>}
                        />
                    ) : rows.length === 0 ? (
                        q ? (
                            <EmptyState
                                icon={<MessageSquare size={28} />}
                                title={`No one here matches “${search.trim()}”`}
                                action={
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {otherTabWithMatches && (
                                            <button type="button" onClick={() => switchTab(otherTabWithMatches.key)} className={`rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 motion-safe:transition-colors ${focusRing}`}>
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
                                title={
                                    tab === "STUDENTS"
                                        ? classes.length === 0
                                            ? "No classes are assigned to you yet"
                                            : `No students are enrolled in ${currentClass?.name ?? "this class"} yet`
                                        : tab === "PRINCIPAL"
                                          ? "The principal isn't listed yet"
                                          : "No messages from the school office"
                                }
                                hint={tab === "OFFICE" ? "Messages the office sends you will appear here." : "Ask the school office to set this up."}
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
                        <DialogHeader
                            accent="emerald"
                            id={threadTitleId}
                            title={thread.name}
                            subtitle={thread.group === "STUDENTS" ? `${currentClass?.name ?? "Student"}${thread.detail?.startsWith("Roll") ? `, ${thread.detail.toLowerCase()}` : ""}` : ROLE_LABEL[thread.role] ?? thread.role}
                            leading={<Avatar name={thread.name} size="lg" />}
                            onClose={closeThread}
                        />
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
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-emerald-600 text-white" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"}`}>
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                                                        <time dateTime={m.createdAt} className={`mt-1 block text-right text-[11px] tabular-nums ${mine ? "text-emerald-100" : "text-gray-400"}`}>
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
                                Replies to the school office are turned off. To follow up, write to the principal.
                            </p>
                        )}
                    </>
                )}
            </Dialog>

            {/* New message */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} labelledBy={composeTitleId} className="sm:max-w-lg">
                <DialogHeader accent="emerald" id={composeTitleId} title="New message" onClose={() => setComposeOpen(false)} />
                <form onSubmit={sendCompose} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Send to
                            <select autoFocus value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose the principal or a student</option>
                                {sendable.some((c) => c.group === "PRINCIPAL") && (
                                    <optgroup label="Principal">
                                        {sendable.filter((c) => c.group === "PRINCIPAL").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </optgroup>
                                )}
                                {sendable.some((c) => c.group === "STUDENTS") && (
                                    <optgroup label={`Students in ${currentClass?.name ?? "this class"}`}>
                                        {sendable
                                            .filter((c) => c.group === "STUDENTS")
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map((c) => <option key={c.id} value={c.id}>{c.name}{c.detail?.startsWith("Roll") ? ` (${c.detail.toLowerCase()})` : ""}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            <span className="mt-1 block text-xs font-normal text-gray-500">To write to a student in another class, pick that class on the Students tab first.</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Message
                            <textarea rows={6} value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write your message" className={`${inputClass} mt-1.5 resize-none`} />
                        </label>
                        <p className="text-xs text-gray-500">Keep messages formal and to the point. For casual chat, speak to the student in class.</p>
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

export default function TeacherMessagesPage() {
    return (
        <Suspense fallback={<div className="mx-auto h-64 max-w-5xl rounded-xl border border-gray-200 bg-white" />}>
            <MessagesContent />
        </Suspense>
    );
}
