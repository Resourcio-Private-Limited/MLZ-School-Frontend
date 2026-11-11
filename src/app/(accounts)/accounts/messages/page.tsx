"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, shallowEqual } from "react-redux";
import { ChevronRight, MessageSquare, Plus, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import type { RootState } from "@/redux";
import { teacherApi, useGetClassStudentsQuery, type ClassStudent } from "@/redux/api/teacherApi";
import {
    useGetConversationQuery,
    useGetConversationsQuery,
    useGetSectionsByGradeQuery,
    useGetUserByRoleQuery,
    useSendMessageMutation,
    type ClassroomSection,
    type ConversationItem,
} from "@/redux/api/operationsApi";
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
} from "@/components/accounts/ui";

type Group = "STAFF" | "TEACHERS" | "STUDENTS";
type Contact = { id: string; name: string; role: string; detail?: string; group: Group };

const TABS: { key: Group; label: string }[] = [
    { key: "STAFF", label: "Principal and admin" },
    { key: "TEACHERS", label: "Class teachers" },
    { key: "STUDENTS", label: "Students" },
];

const ROLE_LABEL: Record<string, string> = {
    PRINCIPAL: "Principal",
    SUPER_ADMIN: "School administration",
    TEACHER: "Teacher",
    STUDENT: "Student",
};

const groupOf = (role: string): Group | null =>
    role === "PRINCIPAL" || role === "SUPER_ADMIN" ? "STAFF" : role === "TEACHER" ? "TEACHERS" : role === "STUDENT" ? "STUDENTS" : null;

// "Recent" in the class chips lists every student you have a conversation with.
const RECENT = "__recent__";

// Pre-primary grades come first, then classes in number order.
const PRE_PRIMARY = ["nursery", "lkg", "kg", "ukg"];
function gradeOrder(a: string, b: string) {
    const ra = PRE_PRIMARY.indexOf(a.toLowerCase());
    const rb = PRE_PRIMARY.indexOf(b.toLowerCase());
    if (ra !== -1 || rb !== -1) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    return a.localeCompare(b, "en-IN", { numeric: true });
}
const gradeLabel = (g: string) => (/^\d+$/.test(g) ? `Class ${g}` : g);

function listDate(value: string) {
    const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / 86_400_000);
    if (diff === 0) return clock(value);
    if (diff === 1) return "Yesterday";
    return shortDate(value);
}

function studentContact(s: ClassStudent, cls?: ClassroomSection, withClass = false): Contact {
    return {
        id: s.userId,
        name: s.fullName,
        role: "STUDENT",
        detail: [withClass ? cls?.name : null, s.rollNumber ? `Roll ${s.rollNumber}` : null].filter(Boolean).join(", ") || "Student",
        group: "STUDENTS",
    };
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-yellow-50 font-semibold text-yellow-800 ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}>
            {initials(name) || "?"}
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
                    <span className={`mt-0.5 block truncate text-sm ${conv ? "text-gray-600" : "text-gray-400"}`}>
                        {conv ? `${conv.direction === "sent" ? "You: " : ""}${conv.lastMessage}` : "No messages yet"}
                    </span>
                </span>
                <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-gray-300 group-hover:text-gray-500 motion-safe:transition motion-safe:group-hover:translate-x-0.5" />
            </button>
        </li>
    );
}

/** Subscribes to one class's student list so its names land in the cache. Renders nothing. */
function ClassStudentsLoader({ classroomId }: { classroomId: string }) {
    useGetClassStudentsQuery(classroomId);
    return null;
}

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const threadTitleId = useId();
    const composeTitleId = useId();
    const [{ id: currentUserId }] = useState(readAuthUser);

    const sectionsQ = useGetSectionsByGradeQuery();
    const principalQ = useGetUserByRoleQuery("PRINCIPAL");
    const adminQ = useGetUserByRoleQuery("SUPER_ADMIN");
    const { data: conversations = [] } = useGetConversationsQuery(currentUserId, { skip: !currentUserId, pollingInterval: 30000, skipPollingIfUnfocused: true });
    const convById = useMemo(() => new Map(conversations.map((c) => [c.otherUserId, c])), [conversations]);

    const classes = useMemo<ClassroomSection[]>(() => (sectionsQ.data ?? []).flatMap((g) => g.sections), [sectionsQ.data]);
    const grades = useMemo(() => [...new Set(classes.map((c) => c.grade))].sort(gradeOrder), [classes]);

    const [tab, setTab] = useState<Group>("STAFF");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [grade, setGrade] = useState("");
    const [pickedSection, setPickedSection] = useState<Record<string, string>>({});
    const [threadId, setThreadId] = useState<string | null>(() => searchParams.get("to"));
    const [reply, setReply] = useState("");
    const threadRef = useRef<HTMLDivElement>(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeText, setComposeText] = useState("");

    const hasRecentStudents = conversations.some((c) => c.otherUserRole === "STUDENT");
    const activeGrade = grade === RECENT && hasRecentStudents ? RECENT : grades.includes(grade) ? grade : grades[0] ?? "";
    const sections = useMemo(
        () => classes.filter((c) => c.grade === activeGrade).sort((a, b) => a.section.localeCompare(b.section)),
        [classes, activeGrade]
    );
    const classId = activeGrade === RECENT ? "" : (sections.find((c) => c.id === pickedSection[activeGrade]) ?? sections[0])?.id ?? "";
    const currentClass = classes.find((c) => c.id === classId);

    const studentsQ = useGetClassStudentsQuery(classId, { skip: !classId });

    // Every class list already fetched, so recent students and ?to= links can be shown by name.
    const classIds = useMemo(() => classes.map((c) => c.id), [classes]);
    const cachedLists = useSelector(
        (state: RootState) =>
            classIds.map((id) => teacherApi.endpoints.getClassStudents.select(id)(state).data),
        shallowEqual
    );
    const knownStudents = useMemo(() => {
        const map = new Map<string, { student: ClassStudent; cls: ClassroomSection }>();
        cachedLists.forEach((list, i) => list?.forEach((s) => map.set(s.userId, { student: s, cls: classes[i] })));
        return map;
    }, [cachedLists, classes]);
    // Load every class only when it's needed to name people: the Recent chip, or a thread opened from a link.
    const needAllClasses =
        (tab === "STUDENTS" && activeGrade === RECENT) ||
        (!!threadId && convById.get(threadId)?.otherUserRole === "STUDENT" && !knownStudents.has(threadId));
    const recentLoading = needAllClasses && cachedLists.some((l) => l === undefined);

    const staff = useMemo<Contact[]>(() => {
        const list: Contact[] = [];
        if (principalQ.data?.id) list.push({ id: principalQ.data.id, name: "Principal", role: "PRINCIPAL", detail: principalQ.data.email, group: "STAFF" });
        if (adminQ.data?.id) list.push({ id: adminQ.data.id, name: "School administration", role: "SUPER_ADMIN", detail: adminQ.data.email, group: "STAFF" });
        return list;
    }, [principalQ.data, adminQ.data]);

    const teachers = useMemo<Contact[]>(() => {
        const seen = new Map<string, Contact>();
        for (const c of classes) {
            const t = c.classTeacher;
            if (!t?.userId) continue;
            const existing = seen.get(t.userId);
            if (existing) existing.detail = `${existing.detail}, ${c.name}`;
            else seen.set(t.userId, { id: t.userId, name: t.fullName, role: "TEACHER", detail: `Class teacher, ${c.name}`, group: "TEACHERS" });
        }
        // Teachers who wrote to you but don't lead a class still need a way back to the conversation.
        for (const conv of conversations) {
            if (conv.otherUserRole === "TEACHER" && !seen.has(conv.otherUserId))
                seen.set(conv.otherUserId, { id: conv.otherUserId, name: "Teacher", role: "TEACHER", detail: "Not a class teacher", group: "TEACHERS" });
        }
        return [...seen.values()];
    }, [classes, conversations]);

    const classStudents = useMemo<Contact[]>(() => (studentsQ.data ?? []).map((s) => studentContact(s, currentClass)), [studentsQ.data, currentClass]);
    const recentStudents = useMemo<Contact[]>(
        () =>
            conversations
                .filter((c) => c.otherUserRole === "STUDENT")
                .map((c) => {
                    const known = knownStudents.get(c.otherUserId);
                    return known
                        ? studentContact(known.student, known.cls, true)
                        : { id: c.otherUserId, name: "Student", role: "STUDENT", detail: recentLoading ? "Loading…" : "Not in a current class", group: "STUDENTS" as const };
                }),
        [conversations, knownStudents, recentLoading]
    );

    const q = search.trim().toLowerCase();
    const matches = (c: Contact) => !q || c.name.toLowerCase().includes(q) || (c.detail ?? ROLE_LABEL[c.role] ?? "").toLowerCase().includes(q);
    const byRecent = (a: Contact, b: Contact) => {
        const ta = convById.get(a.id)?.lastMessageAt ?? "";
        const tb = convById.get(b.id)?.lastMessageAt ?? "";
        return ta !== tb ? tb.localeCompare(ta) : a.name.localeCompare(b.name);
    };
    const studentPool = activeGrade === RECENT ? recentStudents : classStudents;
    const poolFor = (g: Group) => (g === "STAFF" ? staff : g === "TEACHERS" ? teachers : studentPool);
    const countFor = (g: Group) => poolFor(g).filter(matches).length;
    const rows = poolFor(tab).filter(matches).sort(byRecent);
    const { pageCount, current, pageRows } = paginate(rows, page);

    const isLoading =
        tab === "STAFF"
            ? principalQ.isLoading || adminQ.isLoading
            : tab === "TEACHERS"
              ? sectionsQ.isLoading
              : sectionsQ.isLoading || (activeGrade !== RECENT && studentsQ.isLoading);
    const isError = tab === "STAFF" ? principalQ.isError && adminQ.isError : tab === "TEACHERS" ? sectionsQ.isError : sectionsQ.isError || (activeGrade !== RECENT && studentsQ.isError);
    const retry = () => {
        if (tab === "STAFF") {
            principalQ.refetch();
            adminQ.refetch();
        } else {
            sectionsQ.refetch();
            if (classId) studentsQ.refetch();
        }
    };
    const otherTabWithMatches = q ? TABS.find((t) => t.key !== tab && countFor(t.key) > 0) : undefined;

    // The open conversation. A ?to= link can point at someone who isn't on the current list.
    const contactById = useMemo(() => {
        const map = new Map<string, Contact>();
        for (const c of [...staff, ...teachers, ...recentStudents, ...classStudents]) map.set(c.id, c);
        return map;
    }, [staff, teachers, recentStudents, classStudents]);
    const thread: Contact | undefined = threadId
        ? contactById.get(threadId) ??
          (() => {
              const known = knownStudents.get(threadId);
              if (known) return studentContact(known.student, known.cls, true);
              const role = convById.get(threadId)?.otherUserRole;
              const group = role ? groupOf(role) : null;
              return role && group ? { id: threadId, name: ROLE_LABEL[role] ?? "Contact", role, group } : undefined;
          })()
        : undefined;

    const { data: messages = [], isLoading: threadLoading } = useGetConversationQuery(
        { userId: currentUserId, otherUserId: threadId ?? "" },
        { skip: !currentUserId || !threadId, pollingInterval: 5000, skipPollingIfUnfocused: true }
    );
    const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

    useEffect(() => {
        const el = threadRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length, threadId]);

    const resetPage = () => setPage(1);
    const switchTab = (key: Group) => {
        setTab(key);
        resetPage();
    };
    const pickGrade = (g: string) => {
        setGrade(g);
        resetPage();
    };
    const pickSection = (id: string) => {
        setPickedSection((prev) => ({ ...prev, [activeGrade]: id }));
        resetPage();
    };
    const openThread = (id: string) => {
        setReply("");
        setThreadId(id);
    };
    const closeThread = () => {
        setThreadId(null);
        if (searchParams.get("to")) router.replace("/accounts/messages", { scroll: false });
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

    const openCompose = () => {
        setComposeTo(thread ? thread.id : "");
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

    const namedTeachers = teachers.filter((t) => t.detail !== "Not a class teacher").sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {needAllClasses && classIds.map((id) => <ClassStudentsLoader key={id} classroomId={id} />)}

            <PageHeader
                title="Messages"
                subtitle="For fee questions and formal notes to the principal, class teachers and students."
                actions={
                    <button type="button" onClick={openCompose} className={primaryBtn}>
                        <Plus size={18} aria-hidden="true" />
                        New message
                    </button>
                }
            />

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <Tabs
                        label="Recipient type"
                        layoutId="accounts-messages-tab-underline"
                        value={tab}
                        onChange={switchTab}
                        loading={sectionsQ.isLoading}
                        tabs={TABS.map((t) => ({ key: t.key, label: t.label, count: countFor(t.key) }))}
                    />
                    <SearchBox
                        id="message-search"
                        label="Search people"
                        value={search}
                        onChange={(v) => {
                            setSearch(v);
                            resetPage();
                        }}
                        placeholder={tab === "STUDENTS" ? "Search by name or roll" : tab === "TEACHERS" ? "Search by name or class" : "Search by name or role"}
                        className="pb-3 lg:w-72 lg:pb-0"
                    />
                </div>

                {tab === "STUDENTS" && grades.length > 0 && (
                    <div className="space-y-2 border-b border-gray-200 px-4 py-3 sm:px-6">
                        <FilterChips
                            label="Class"
                            layoutId="accounts-messages-grade"
                            value={activeGrade}
                            onChange={pickGrade}
                            options={[...(hasRecentStudents ? [{ value: RECENT, label: "Recent" }] : []), ...grades.map((g) => ({ value: g, label: gradeLabel(g) }))]}
                        />
                        {activeGrade !== RECENT && sections.length > 1 && (
                            <FilterChips
                                label="Section"
                                layoutId="accounts-messages-section"
                                value={classId}
                                onChange={pickSection}
                                options={sections.map((c) => ({ value: c.id, label: `Section ${c.section}`, count: c.total }))}
                            />
                        )}
                        <p className="text-xs text-gray-500">
                            {activeGrade === RECENT
                                ? "Students you have a conversation with, newest first."
                                : currentClass
                                  ? `${currentClass.name}${currentClass.classTeacher ? `, class teacher ${currentClass.classTeacher.fullName}` : ""}`
                                  : ""}
                        </p>
                    </div>
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
                            title="This list couldn't be loaded."
                            hint="Check your connection, then try again."
                            action={<button type="button" onClick={retry} className={secondaryBtn}>Try again</button>}
                        />
                    ) : rows.length === 0 ? (
                        q ? (
                            <EmptyState
                                icon={<MessageSquare size={28} />}
                                title={`No one here matches “${search.trim()}”`}
                                action={
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {otherTabWithMatches && (
                                            <button type="button" onClick={() => switchTab(otherTabWithMatches.key)} className={`rounded-lg bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 motion-safe:transition-colors ${focusRing}`}>
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
                                    tab === "STAFF"
                                        ? "The principal and school administration aren't set up yet"
                                        : tab === "TEACHERS"
                                          ? "No class teachers are assigned yet"
                                          : grades.length === 0
                                            ? "No classes are set up yet"
                                            : `No students are enrolled in ${currentClass?.name ?? "this class"} yet`
                                }
                                hint={tab === "STUDENTS" && grades.length > 0 ? "Pick another class or section above." : "Ask the principal to set this up."}
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
                            accent="yellow"
                            id={threadTitleId}
                            title={thread.name}
                            subtitle={thread.detail ?? ROLE_LABEL[thread.role] ?? thread.role}
                            leading={<Avatar name={thread.name} size="lg" />}
                            onClose={closeThread}
                        />
                        <div ref={threadRef} className="min-h-64 flex-1 overflow-y-auto bg-gray-50 px-4 py-5 sm:px-6">
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
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-md bg-yellow-100 text-yellow-950 ring-1 ring-yellow-200" : "rounded-bl-md bg-white text-gray-800 ring-1 ring-gray-200"}`}>
                                                        <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                                                        <time dateTime={m.createdAt} className={`mt-1 block text-right text-[11px] tabular-nums ${mine ? "text-yellow-800/70" : "text-gray-400"}`}>
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
                    </>
                )}
            </Dialog>

            {/* New message */}
            <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} labelledBy={composeTitleId} className="sm:max-w-lg">
                <DialogHeader accent="yellow" id={composeTitleId} title="New message" onClose={() => setComposeOpen(false)} />
                <form onSubmit={sendCompose} className="flex min-h-0 flex-1 flex-col">
                    <div className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Send to
                            <select autoFocus value={composeTo} onChange={(e) => setComposeTo(e.target.value)} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose a person</option>
                                {thread && !contactById.has(thread.id) && <option value={thread.id}>{thread.name}</option>}
                                {staff.length > 0 && (
                                    <optgroup label="Principal and admin">
                                        {staff.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </optgroup>
                                )}
                                {namedTeachers.length > 0 && (
                                    <optgroup label="Class teachers">
                                        {namedTeachers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.detail?.replace("Class teacher, ", "")})</option>)}
                                    </optgroup>
                                )}
                                {studentPool.length > 0 && (
                                    <optgroup label={activeGrade === RECENT ? "Recent students" : `Students in ${currentClass?.name ?? "this class"}`}>
                                        {[...studentPool]
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map((c) => <option key={c.id} value={c.id}>{c.name}{c.detail && c.detail !== "Student" ? ` (${c.detail})` : ""}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            <span className="mt-1 block text-xs font-normal text-gray-500">To write to a student in another class, pick that class on the Students tab first.</span>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Message
                            <textarea rows={6} value={composeText} onChange={(e) => setComposeText(e.target.value)} placeholder="Write your message" className={`${inputClass} mt-1.5 resize-none`} />
                        </label>
                        <p className="text-xs text-gray-500">Keep messages formal: fee questions, receipts and payment reminders.</p>
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

export default function AccountsMessagesPage() {
    return (
        <Suspense fallback={<div className="mx-auto h-64 max-w-5xl rounded-xl border border-gray-200 bg-white" />}>
            <MessagesContent />
        </Suspense>
    );
}
