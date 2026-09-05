"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Send, Paperclip, X, Info } from "lucide-react";
import toast from 'react-hot-toast';
import { useGetAnnouncementsQuery, useCreateAnnouncementMutation } from "@/redux/api/operationsApi";

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
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

export default function TeacherAnnouncementsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [teacherId, setTeacherId] = useState<string | null>(null);

    useEffect(() => {
        const user = getAuthUser();
        setTeacherId(user?.teacher?.id ?? null);
    }, []);

    const { data: announcements = [], isLoading } = useGetAnnouncementsQuery(classroomId);
    const [createAnnouncement, { isLoading: isCreating_ }] = useCreateAnnouncementMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!teacherId) {
            toast.error("Teacher not found. Please login again.");
            return;
        }

        try {
            await createAnnouncement({
                title,
                content,
                fileUrl: fileUrl || undefined,
                teacherId,
                classroomId,
            }).unwrap();

            setTitle("");
            setContent("");
            setFileUrl("");
            setIsCreating(false);
            toast.success("Announcement posted successfully!");
        } catch {
            toast.error("Failed to create announcement. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    
                    <div className="h-6 w-px bg-slate-300" />
                    <h1 className="text-3xl font-bold text-slate-800">Classroom Announcements</h1>
                </div>

                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-600 transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
                    >
                        <Bell size={20} />
                        <span>New Announcement</span>
                    </button>
                )}
            </div>

            {/* Create Announcement Form */}
            {isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Send size={18} className="text-emerald-500" />
                            Compose Announcement
                        </h2>
                        <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Assignment Due Date Change"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-800"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Message</label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                placeholder="Type your announcement content here..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-gray-800"
                            />
                            <p className="text-xs text-gray-500 text-right">Visible to all students in this classroom.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Attachment URL (optional)</label>
                            <input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-800"
                            />
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
                                    disabled={isCreating_}
                                    className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {isCreating_ ? "Posting..." : "Post Announcement"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 text-lg">Posted Announcements</h2>
                    <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                        Total: {announcements.length}
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-10 text-center">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Loading announcements...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <p>No announcements posted yet.</p>
                            <button onClick={() => setIsCreating(true)} className="text-emerald-500 font-medium hover:underline mt-2">
                                Create your first post
                            </button>
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <span className="px-2.5 py-0.5 rounded text-xs font-bold border flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">
                                            <Info size={14} />
                                            Announcement
                                        </span>
                                        <span className="text-sm text-gray-400 font-medium flex items-center">
                                            <span>{formatDate(announcement.createdAt)}</span>
                                            <span className="mx-1.5">•</span>
                                            <span>{formatTime(announcement.createdAt)}</span>
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-2">{announcement.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{announcement.content}</p>

                                {announcement.fileUrl && (
                                    <div className="mt-4 flex items-center space-x-2 text-sm text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-md">
                                        <Paperclip size={14} />
                                        <a href={announcement.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
