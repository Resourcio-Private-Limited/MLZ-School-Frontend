"use client";

import { useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, Send, Paperclip, X, AlertCircle, CheckCircle, Info, FileText } from "lucide-react";

export default function TeacherAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("General");
    const [priority, setPriority] = useState("Normal");
    const [attachments, setAttachments] = useState<File[]>([]);

    // Mock Announcements Data
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: "Upcoming Science Fair",
            message: "Please submit your project proposals by next Friday. Remember to follow the guidelines distributed in class.",
            category: "General",
            priority: "Normal",
            date: "2024-10-25",
            time: "10:30 AM",
            attachments: 2
        },
        {
            id: 2,
            title: "Math Test Rescheduled",
            message: "The algebra test scheduled for Monday has been moved to Wednesday due to the assembly.",
            category: "Exam",
            priority: "High",
            date: "2024-10-22",
            time: "02:15 PM",
            attachments: 0
        }
    ]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments([...attachments, ...Array.from(e.target.files)]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAnnouncement = {
            id: Date.now(),
            title,
            message,
            category,
            priority,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            attachments: attachments.length
        };

        setAnnouncements([newAnnouncement, ...announcements]);

        // Reset form
        setTitle("");
        setMessage("");
        setCategory("General");
        setPriority("Normal");
        setAttachments([]);
        setIsCreating(false);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case "High": return "bg-red-100 text-red-700 border-red-200";
            case "Urgent": return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-blue-50 text-blue-700 border-blue-100";
        }
    };

    const getCategoryIcon = (c: string) => {
        switch (c) {
            case "Exam": return <AlertCircle size={16} />;
            case "Event": return <Calendar size={16} />;
            default: return <Info size={16} />;
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${id}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-[#2BB9E5] transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Classroom Announcements</h1>
                </div>

                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-[#2BB9E5] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#25a0c7] transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                        <Bell size={20} />
                        <span>New Announcement</span>
                    </button>
                )}
            </div>

            {/* Create Announcement Form */}
            {isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Send size={18} className="text-[#2BB9E5]" />
                            Compose Announcement
                        </h2>
                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Assignment Due Date Change"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2BB9E5] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2BB9E5] outline-none"
                                    >
                                        <option>General</option>
                                        <option>Exam</option>
                                        <option>Homework</option>
                                        <option>Event</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2BB9E5] outline-none"
                                    >
                                        <option>Normal</option>
                                        <option>High</option>
                                        <option>Urgent</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Message</label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Type your announcement content here..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#2BB9E5] focus:border-transparent outline-none transition-all resize-none"
                            ></textarea>
                            <p className="text-xs text-gray-500 text-right">Visible to all students in this classroom.</p>
                        </div>

                        {/* Attachments Area */}
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-[#2BB9E5] hover:text-[#25a0c7] flex items-center space-x-1">
                                    <Paperclip size={16} />
                                    <span>Attach Files</span>
                                </label>
                                <input id="file-upload" type="file" multiple onChange={handleFileChange} className="hidden" />
                            </div>

                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((file, idx) => (
                                        <div key={idx} className="bg-gray-100 border border-gray-200 rounded-md px-3 py-1 flex items-center space-x-2 text-sm">
                                            <FileText size={14} className="text-gray-500" />
                                            <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                                            <button type="button" onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-100">
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-5 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#2BB9E5] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#25a0c7] transition-colors shadow-sm"
                                >
                                    Post Announcement
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 text-lg">Posted Announcements</h2>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        Total: {announcements.length}
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold border flex items-center gap-1.5 ${getPriorityColor(announcement.priority)}`}>
                                            {getCategoryIcon(announcement.category)}
                                            {announcement.category}
                                        </span>
                                        <span className="text-sm text-gray-400 font-medium flex items-center">
                                            <span>{new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span className="mx-1.5">•</span>
                                            <span>{announcement.time}</span>
                                        </span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="text-gray-400 hover:text-red-500 text-sm font-medium">Delete</button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2">{announcement.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{announcement.message}</p>

                                {announcement.attachments > 0 && (
                                    <div className="mt-4 flex items-center space-x-2 text-sm text-[#2BB9E5] bg-blue-50 w-fit px-3 py-1.5 rounded-md">
                                        <Paperclip size={14} />
                                        <span className="font-medium">{announcement.attachments} Attachment{announcement.attachments !== 1 && 's'}</span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center text-gray-500">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <p>No announcements posted yet.</p>
                            <button onClick={() => setIsCreating(true)} className="text-[#2BB9E5] font-medium hover:underline mt-2">
                                Create your first post
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
