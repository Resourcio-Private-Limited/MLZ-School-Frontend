"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search, Send, Lock, ChevronDown, Users, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { useGetConversationsQuery, useGetConversationQuery, useSendMessageMutation, useGetSectionsByGradeQuery } from "@/redux/api/operationsApi";
import { useLazyGetClassStudentsQuery } from "@/redux/api/teacherApi";

function formatTime(dateStr: string) {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) {
            return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString('en-IN', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }
    } catch {
        return '';
    }
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        STUDENT: 'Student',
        TEACHER: 'Teacher',
        PRINCIPAL: 'Principal',
        ACCOUNTANT: 'Accountant',
        SUPER_ADMIN: 'Super Admin',
    };
    return labels[role] ?? role;
}

function getAuthUser() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem("authUser");
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

interface SidebarItem {
    userId: string;
    name: string;
    role: string;
    canSend: boolean;
    lastMessage: string;
    lastMessageAt: string;
    direction: 'sent' | 'received';
    unread: number;
}

interface ClassItem {
    id: string;
    name: string;
    grade: string;
    section: string;
    studentCount: number;
    classTeacherId: string | null;
    classTeacherName: string | null;
    classTeacherUserId: string | null;
    isExpanded: boolean;
    students: Array<{ userId: string; fullName: string }>;
    isLoadingStudents: boolean;
}

export default function AccountantMessages() {
    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        setAuthUser(getAuthUser());
    }, []);

    const currentUserId = authUser?.id;

    const { data: conversations = [], refetch: refetchConversations } = useGetConversationsQuery(currentUserId ?? "");
    const { data: sectionsData = [] } = useGetSectionsByGradeQuery();
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
    const [getClassStudents] = useLazyGetClassStudentsQuery();

    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [messageText, setMessageText] = useState("");

    const { data: messages = [], refetch: refetchMessages } = useGetConversationQuery(
        { userId: currentUserId ?? "", otherUserId: selectedUserId ?? "" },
        { skip: !currentUserId || !selectedUserId }
    );

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!selectedUserId) return;
        const interval = setInterval(() => {
            refetchMessages();
            refetchConversations();
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedUserId, refetchMessages, refetchConversations]);

    // Build conversation maps - one by otherUserId, one by otherUserRole
    const conversationByUserId = new Map(
        conversations.map(c => [c.otherUserId, c])
    );

    // Get Principal and Super Admin
    const principalConv = conversations.find(c => c.otherUserRole === 'PRINCIPAL');
    const superAdminConv = conversations.find(c => c.otherUserRole === 'SUPER_ADMIN');

    // Toggle class expansion and fetch students
    const toggleClass = useCallback(async (classId: string) => {
        setExpandedClasses(prev => {
            const next = new Set(prev);
            if (next.has(classId)) {
                next.delete(classId);
            } else {
                next.add(classId);
                // Fetch students when expanding
                getClassStudents(classId)
                    .unwrap()
                    .then(students => {
                        setClassStudentsMap(prev => {
                            const newMap = new Map(prev);
                            newMap.set(classId, students.map((s: any) => ({ userId: s.userId, fullName: s.fullName })));
                            return newMap;
                        });
                        setLoadingStates(prev => {
                            const newMap = new Map(prev);
                            newMap.set(classId, false);
                            return newMap;
                        });
                    })
                    .catch(() => {
                        setLoadingStates(prev => {
                            const newMap = new Map(prev);
                            newMap.set(classId, false);
                            return newMap;
                        });
                    });
                // Set loading state
                setLoadingStates(prev => {
                    const newMap = new Map(prev);
                    newMap.set(classId, true);
                    return newMap;
                });
            }
            return next;
        });
    }, [getClassStudents]);

    const [classStudentsMap, setClassStudentsMap] = useState<Map<string, Array<{ userId: string; fullName: string }>>>(new Map());
    const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());

    // Build class list from sections
    const classItems: ClassItem[] = sectionsData.flatMap(grade =>
        grade.sections.map(section => ({
            id: section.id,
            name: section.name,
            grade: section.grade,
            section: section.section,
            studentCount: section.total,
            classTeacherId: section.classTeacher?.id ?? null,
            classTeacherName: section.classTeacher?.fullName ?? null,
            classTeacherUserId: section.classTeacher?.userId ?? null,
            isExpanded: expandedClasses.has(section.id),
            students: classStudentsMap.get(section.id) ?? [],
            isLoadingStudents: loadingStates.get(section.id) ?? false,
        }))
    );

    // Filter by search
    const filteredClassItems = classItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find selected item
    let selectedItem: (SidebarItem & { userId: string; name: string; role: string; canSend: boolean }) | null = null;

    // Check if selected is Principal
    if (selectedUserId === 'PRINCIPAL') {
        selectedItem = {
            userId: 'PRINCIPAL',
            name: principalConv?.otherUserId ? 'Principal' : 'Principal',
            role: 'PRINCIPAL',
            canSend: true,
            lastMessage: principalConv?.lastMessage ?? 'No messages yet',
            lastMessageAt: principalConv?.lastMessageAt ?? '',
            direction: principalConv?.direction ?? 'received',
            unread: 0,
        };
    }
    // Check if selected is Super Admin
    else if (selectedUserId === 'SUPER_ADMIN') {
        selectedItem = {
            userId: 'SUPER_ADMIN',
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            canSend: false,
            lastMessage: superAdminConv?.lastMessage ?? 'No messages yet',
            lastMessageAt: superAdminConv?.lastMessageAt ?? '',
            direction: superAdminConv?.direction ?? 'received',
            unread: 0,
        };
    }
    // Check if selected is a class teacher
    else if (selectedUserId?.startsWith('TEACHER_')) {
        const classId = selectedUserId.replace('TEACHER_', '');
        const classItem = classItems.find(c => c.id === classId);
        if (classItem && classItem.classTeacherUserId) {
            const conv = conversationByUserId.get(classItem.classTeacherUserId);
            selectedItem = {
                userId: classItem.classTeacherUserId,
                name: classItem.classTeacherName ?? 'Class Teacher',
                role: 'TEACHER',
                canSend: true,
                lastMessage: conv?.lastMessage ?? 'No messages yet',
                lastMessageAt: conv?.lastMessageAt ?? '',
                direction: conv?.direction ?? 'received',
                unread: 0,
            };
        }
    }
    // Check if selected is a student
    else if (selectedUserId?.startsWith('STUDENT_')) {
        const parts = selectedUserId.split('_');
        if (parts.length >= 3) {
            const studentUserId = parts[2];
            const students = classStudentsMap.get(parts[1]) ?? [];
            const student = students.find(s => s.userId === studentUserId);
            if (student) {
                const conv = conversationByUserId.get(studentUserId);
                selectedItem = {
                    userId: studentUserId,
                    name: student.fullName,
                    role: 'STUDENT',
                    canSend: true,
                    lastMessage: conv?.lastMessage ?? 'No messages yet',
                    lastMessageAt: conv?.lastMessageAt ?? '',
                    direction: conv?.direction ?? 'received',
                    unread: 0,
                };
            }
        }
    }

    const canSendToSelected = selectedItem?.canSend ?? false;

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedItem?.userId || !currentUserId) return;

        try {
            await sendMessage({
                receiverId: selectedItem.userId,
                content: messageText.trim(),
            }).unwrap();
            setMessageText("");
            toast.success("Message sent!");
            refetchMessages();
            refetchConversations();
        } catch {
            toast.error("Failed to send message.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/accounts">
                            <button className="flex items-center space-x-2 text-slate-600 hover:text-blue-700 transition-colors">
                                <ArrowLeft size={20} />
                                <span className="font-medium">Back to Accounts</span>
                            </button>
                        </Link>
                        <div className="h-6 w-px bg-slate-400"></div>
                        <h1 className="text-3xl font-semibold text-slate-800">Message Center</h1>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This section is for fee-related queries or formal communication with class teachers, students, and principal.
                    </p>
                </div>

                {/* Message Layout */}
                <div className="flex bg-white rounded-lg shadow-lg overflow-hidden min-h-150">
                    {/* Sidebar */}
                    <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800 mb-3">Conversations</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search classes..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Principal Section */}
                            <div className="border-b border-gray-200">
                                <div className="px-4 py-2 bg-gray-100">
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Principal</span>
                                </div>
                                <div
                                    onClick={() => setSelectedUserId('PRINCIPAL')}
                                    className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-transparent ${
                                        selectedUserId === 'PRINCIPAL'
                                            ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                                            : 'border-gray-50'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                                        P
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${
                                                selectedUserId === 'PRINCIPAL' ? 'text-blue-500' : 'text-gray-800'
                                            }`}>Principal</h3>
                                            {principalConv?.lastMessageAt && (
                                                <span className="text-xs text-gray-400 shrink-0 ml-2">
                                                    {formatTime(principalConv.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">Principal</span>
                                        </div>
                                        {principalConv?.lastMessage && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{principalConv.lastMessage}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Classes Section */}
                            <div className="border-b border-gray-200">
                                <div className="px-4 py-2 bg-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Classes</span>
                                    <GraduationCap size={14} className="text-gray-500" />
                                </div>
                                {filteredClassItems.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">No classes found</div>
                                ) : (
                                    filteredClassItems.map((classItem) => (
                                        <div key={classItem.id}>
                                            <div
                                                onClick={() => toggleClass(classItem.id)}
                                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                        {classItem.grade}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-gray-800">{classItem.name}</h3>
                                                        <p className="text-xs text-gray-500">
                                                            {classItem.studentCount} students • {classItem.classTeacherName || 'No Class Teacher'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronDown
                                                    size={16}
                                                    className={`text-gray-400 transition-transform ${classItem.isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </div>
                                            {classItem.isExpanded && (
                                                <div className="bg-gray-50 border-b border-gray-100">
                                                    {/* Class Teacher */}
                                                    {classItem.classTeacherId && (
                                                        <div
                                                            onClick={() => setSelectedUserId(`TEACHER_${classItem.id}`)}
                                                            className={`p-3 pl-8 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-gray-100 ${
                                                                selectedUserId === `TEACHER_${classItem.id}`
                                                                    ? 'bg-white border-l-2 border-l-emerald-500'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                {classItem.classTeacherName?.charAt(0) ?? 'T'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-800">
                                                                    {classItem.classTeacherName}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500">Class Teacher</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Students Header */}
                                                    <div className="px-8 py-2 bg-gray-100 flex items-center gap-2">
                                                        <Users size={12} className="text-gray-500" />
                                                        <span className="text-[10px] font-semibold text-gray-600 uppercase">Students ({classItem.studentCount})</span>
                                                    </div>

                                                    {/* Loading State */}
                                                    {classItem.isLoadingStudents && (
                                                        <div className="p-4 flex items-center justify-center">
                                                            <Loader2 size={16} className="animate-spin text-gray-400" />
                                                            <span className="text-xs text-gray-400 ml-2">Loading students...</span>
                                                        </div>
                                                    )}

                                                    {/* Students List */}
                                                    {!classItem.isLoadingStudents && classItem.students.length === 0 && classItem.studentCount > 0 && (
                                                        <div className="p-4 text-center text-xs text-gray-400">
                                                            Click expand to load students
                                                        </div>
                                                    )}

                                                    {!classItem.isLoadingStudents && classItem.students.map((student) => (
                                                        <div
                                                            key={student.userId}
                                                            onClick={() => setSelectedUserId(`STUDENT_${classItem.id}_${student.userId}`)}
                                                            className={`p-3 pl-8 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-gray-100 ${
                                                                selectedUserId === `STUDENT_${classItem.id}_${student.userId}`
                                                                    ? 'bg-white border-l-2 border-l-blue-500'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                {student.fullName.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-800 truncate">
                                                                    {student.fullName}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500">Student</p>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {classItem.studentCount === 0 && (
                                                        <div className="p-4 text-center text-xs text-gray-400">
                                                            No students in this class
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Super Admin Section (Read Only) */}
                            <div className="border-b border-gray-200">
                                <div className="px-4 py-2 bg-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-600 uppercase">Super Admin</span>
                                    <Lock size={12} className="text-gray-400" />
                                </div>
                                <div
                                    onClick={() => setSelectedUserId('SUPER_ADMIN')}
                                    className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-transparent ${
                                        selectedUserId === 'SUPER_ADMIN'
                                            ? 'bg-white border-l-4 border-l-gray-500 shadow-sm'
                                            : 'border-gray-50'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
                                        S
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${
                                                selectedUserId === 'SUPER_ADMIN' ? 'text-gray-500' : 'text-gray-800'
                                            }`}>Super Admin</h3>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-gray-500">Read Only</span>
                                        </div>
                                        {superAdminConv?.lastMessage && (
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{superAdminConv.lastMessage}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {selectedItem ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                                        selectedItem.role === 'PRINCIPAL' ? 'bg-purple-100 text-purple-600' :
                                        selectedItem.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-600' :
                                        selectedItem.role === 'SUPER_ADMIN' ? 'bg-gray-100 text-gray-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {selectedItem.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-gray-800">{selectedItem.name}</h2>
                                        <p className="text-xs text-gray-500">{getRoleLabel(selectedItem.role)}</p>
                                    </div>
                                    {!selectedItem.canSend && (
                                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            <Lock size={12} />
                                            Read Only
                                        </span>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-400 py-12">
                                            <p className="text-sm">No messages yet. {canSendToSelected ? 'Start the conversation below.' : 'You can only receive messages here.'}</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMine = msg.senderId === currentUserId;
                                            return (
                                                <div key={msg.id} className="flex flex-col">
                                                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                                                            isMine
                                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                                                        }`}>
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                            <p className={`text-[10px] mt-1 ${
                                                                isMine ? 'text-blue-200' : 'text-gray-400'
                                                            }`}>
                                                                {formatTime(msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!isMine && (
                                                        <span className="text-[10px] text-gray-400 ml-1 mt-0.5">
                                                            {getRoleLabel(msg.sender.role)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-6 bg-gray-50 border-t border-gray-200">
                                    {canSendToSelected ? (
                                        <div className="flex items-end gap-3">
                                            <div className="flex-1">
                                                <textarea
                                                    rows={3}
                                                    placeholder="Type your message here..."
                                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!messageText.trim() || isSending}
                                                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                                                    messageText.trim() && !isSending
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <Send size={16} />
                                                {isSending ? 'Sending...' : 'Send'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-gray-400 text-sm">
                                            <Lock size={16} className="mr-2" />
                                            Messaging is disabled for {getRoleLabel(selectedItem.role)}. Only receive mode available.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600 mb-1"> Select a Conversation</h3>
                                <p className="text-sm">Choose a class, principal, or user from the sidebar</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}