"use client";

import { use, useState } from "react";
import { ArrowLeft, Search, Send, Paperclip, MoreVertical, Phone, Video, Info } from "lucide-react";
import Link from "next/link";

export default function MessagesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(101);
    const [newMessage, setNewMessage] = useState("");

    // Mock Students List with Last Message
    const students = [
        { id: 101, name: "Aarav Patel", rollNo: "01", avatar: "A", lastMessage: "Thank you for the update, sir.", time: "10:30 AM", unread: 0, online: true },
        { id: 102, name: "Aditi Sharma", rollNo: "02", avatar: "A", lastMessage: "I will be absent tomorrow due to...", time: "Yesterday", unread: 2, online: false },
        { id: 103, name: "Arjun Singh", rollNo: "03", avatar: "A", lastMessage: "Is the assignment due by Friday?", time: "Yesterday", unread: 0, online: true },
        { id: 104, name: "Diya Gupta", rollNo: "04", avatar: "D", lastMessage: "Okay, noted.", time: "Oct 15", unread: 0, online: false },
        { id: 105, name: "Ishaan Kumar", rollNo: "05", avatar: "I", lastMessage: "Can we schedule a call?", time: "Oct 14", unread: 1, online: false },
    ];

    // Mock Messages for Selected Student
    const [conversations, setConversations] = useState<{ [key: number]: { id: number, sender: 'teacher' | 'student', text: string, time: string }[] }>({
        101: [
            { id: 1, sender: 'teacher', text: "Hello Aarav, your performance in the last test was excellent. Keep it up!", time: "10:00 AM" },
            { id: 2, sender: 'student', text: "Thank you so much sir! I have been working hard.", time: "10:15 AM" },
            { id: 3, sender: 'teacher', text: "It shows. Let me know if you need any help with the upcoming project.", time: "10:25 AM" },
            { id: 4, sender: 'student', text: "Thank you for the update, sir.", time: "10:30 AM" },
        ],
        102: [
            { id: 1, sender: 'student', text: "Good morning Ma'am, I wanted to inform you that I will be absent tomorrow.", time: "Yesterday" },
            { id: 2, sender: 'student', text: "I have a doctor's appointment.", time: "Yesterday" },
        ]
    });

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeStudent = students.find(s => s.id === selectedStudentId);
    const activeMessages = selectedStudentId ? conversations[selectedStudentId] || [] : [];

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedStudentId) return;

        const newMsgOption = {
            id: Date.now(),
            sender: 'teacher' as const,
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setConversations(prev => ({
            ...prev,
            [selectedStudentId]: [...(prev[selectedStudentId] || []), newMsgOption]
        }));
        setNewMessage("");
    };

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-4 flex-shrink-0">
                <Link href={`/teacher/classroom/${id}`}>
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-[#2BB9E5] transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Classroom</span>
                    </button>
                </Link>
            </div>

            <div className="flex flex-1 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                {/* Sidebar - Student List */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Messages</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2BB9E5] text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.id)}
                                className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors hover:bg-white border-b border-transparent ${selectedStudentId === student.id ? 'bg-white border-l-4 border-l-[#2BB9E5] shadow-sm' : 'border-gray-50'}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {student.avatar}
                                    </div>
                                    {student.online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-sm font-semibold truncate ${selectedStudentId === student.id ? 'text-[#2BB9E5]' : 'text-gray-800'}`}>
                                            {student.name}
                                        </h3>
                                        <span className="text-xs text-gray-400">{student.time}</span>
                                    </div>
                                    <p className={`text-xs truncate ${student.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                        {student.lastMessage}
                                    </p>
                                </div>
                                {student.unread > 0 && (
                                    <div className="w-5 h-5 bg-[#2BB9E5] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                                        {student.unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {activeStudent ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shadow-sm z-10">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {activeStudent.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{activeStudent.name}</h3>
                                        <p className="text-xs text-green-500 font-medium flex items-center">
                                            {activeStudent.online ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                {/* Removed call/video icons as per request */}
                            </div>

                            {/* Messages List - Formal Design */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                                {activeMessages.length > 0 ? (
                                    activeMessages.map((msg) => (
                                        <div key={msg.id} className="border-b border-gray-100 pb-4 last:border-0">
                                            <div className="flex items-baseline justify-between mb-2">
                                                <h4 className={`text-sm font-bold ${msg.sender === 'teacher' ? 'text-[#2BB9E5]' : 'text-gray-800'}`}>
                                                    {msg.sender === 'teacher' ? 'You (Teacher)' : activeStudent.name}
                                                </h4>
                                                <span className="text-xs text-gray-400">{msg.time}</span>
                                            </div>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {msg.text}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-gray-400 text-sm">No conversation history.</p>
                                    </div>
                                )}
                            </div>

                            {/* Message Input - Formal Form Style */}
                            <div className="p-6 bg-gray-50 border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reply</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Type your formal reply here..."
                                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2BB9E5] focus:outline-none text-sm resize-none"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-colors ${newMessage.trim()
                                                    ? 'bg-[#2BB9E5] text-white hover:bg-[#25a0c7]'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Send Reply
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-600 mb-1">Select a Conversation</h3>
                            <p className="text-sm">Choose a student from the sidebar to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
