"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Send } from "lucide-react";
import toast from 'react-hot-toast';
import { useGetConversationsQuery, useGetConversationQuery, useSendMessageMutation } from "@/redux/api/operationsApi";
import { useGetMessageRecipientsQuery } from "@/redux/api/studentApi";

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
        TEACHER: 'Teacher',
        PRINCIPAL: 'Principal',
        ACCOUNTANT: 'Accountant',
        SUPER_ADMIN: 'Super Admin',
    };
    return labels[role] ?? role;
}

export default function StudentMessagesPage() {
    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem("authUser");
                setAuthUser(raw ? JSON.parse(raw) : {});
            } catch {
                setAuthUser({});
            }
        }
    }, []);

    const currentUserId = authUser?.id;

    const { data: recipients = [] } = useGetMessageRecipientsQuery();
    const { data: conversations = [], refetch: refetchConversations } = useGetConversationsQuery(currentUserId ?? "");
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [messageText, setMessageText] = useState("");

    const { data: messages = [], refetch: refetchMessages } = useGetConversationQuery(
        { userId: currentUserId ?? "", otherUserId: selectedUserId ?? "" },
        { skip: !currentUserId || !selectedUserId }
    );

    // Get the name and role for a given userId from recipients
    const getRecipientInfo = (userId: string) => {
        const r = recipients.find(r => r.id === userId);
        return r ? { name: r.name, role: r.role } : { name: 'User', role: '' };
    };

    // Build sidebar items: always show all recipients, merge with conversation data
    const sidebarItems = recipients.map(r => {
        const conv = conversations.find(c => c.otherUserId === r.id);
        return {
            userId: r.id,
            name: r.name,
            role: r.role,
            lastMessage: conv?.lastMessage ?? 'No messages yet',
            lastMessageAt: conv?.lastMessageAt ?? '',
            direction: conv?.direction ?? ('received' as const),
            unread: 0,
        };
    });

    const filteredItems = sidebarItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedItem = sidebarItems.find(i => i.userId === selectedUserId);
    const activeMessages = messages;

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedUserId || !currentUserId) return;

        try {
            await sendMessage({
                senderId: currentUserId,
                receiverId: selectedUserId,
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
                        <Link href="/student/classroom">
                            <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={20} />
                                <span className="font-medium">Back</span>
                            </button>
                        </Link>
                        <div className="h-6 w-px bg-slate-300"></div>
                        <h1 className="text-3xl font-bold text-slate-800">Messages</h1>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This section is strictly for queries, issues, or formal communication. Please refrain from using it for casual or continuous chat.
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
                                    placeholder="Search by name or role..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-800"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">No recipients found</div>
                            ) : (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.userId}
                                        onClick={() => setSelectedUserId(item.userId)}
                                        className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-transparent ${
                                            selectedUserId === item.userId
                                                ? 'bg-white border-l-4 border-l-blue-500 shadow-sm'
                                                : 'border-gray-50'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className={`text-sm font-semibold truncate ${
                                                    selectedUserId === item.userId ? 'text-blue-500' : 'text-gray-800'
                                                }`}>{item.name}</h3>
                                                {item.lastMessageAt && (
                                                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                                                        {formatTime(item.lastMessageAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">{getRoleLabel(item.role)}</span>
                                                {item.direction === 'sent' && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">Sent</span>
                                                )}
                                            </div>
                                            {item.lastMessage && (
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{item.lastMessage}</p>
                                            )}
                                        </div>
                                        {item.unread > 0 && (
                                            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {item.unread}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">
                        {selectedItem ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                        {selectedItem.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">{selectedItem.name}</h2>
                                        <p className="text-xs text-gray-500">{getRoleLabel(selectedItem.role)}</p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {activeMessages.length === 0 ? (
                                        <div className="text-center text-gray-400 py-12">
                                            <p className="text-sm">No messages yet. Start the conversation below.</p>
                                        </div>
                                    ) : (
                                        activeMessages.map((msg) => {
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
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                    <Search size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-600 mb-1">Select a Conversation</h3>
                                <p className="text-sm">Choose a recipient from the sidebar to view messages</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}