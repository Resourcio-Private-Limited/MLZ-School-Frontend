"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Filter, Link2, Download, ExternalLink, Plus, X, Upload } from "lucide-react";
import { useGetNoticesQuery, useCreateNoticeMutation, NoticeTag } from "@/redux/api/operationsApi";

const TAG_TO_LABEL: Record<NoticeTag, string> = {
    ALL_NOTICES: "All Notices",
    GENERAL: "General",
    HOLIDAYS: "Holidays",
    EVENTS: "Events",
    EXAMS: "Exams",
    EMERGENCY: "Emergency",
};

const LABEL_TO_TAG: Record<string, NoticeTag> = {
    "All Notices": "ALL_NOTICES",
    General: "GENERAL",
    Holidays: "HOLIDAYS",
    Events: "EVENTS",
    Exams: "EXAMS",
    Emergency: "EMERGENCY",
};

const TAG_COLORS: Record<string, string> = {
    Holidays: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Exams: "bg-purple-50 text-purple-700 border border-purple-100",
    Events: "bg-orange-50 text-orange-700 border border-orange-100",
    Emergency: "bg-red-50 text-red-700 border border-red-100",
    GENERAL: "bg-blue-50 text-blue-700 border border-blue-100",
    ALL_NOTICES: "bg-rose-50 text-rose-700 border border-rose-100",
};

const TAG_LIST: NoticeTag[] = ["ALL_NOTICES", "GENERAL", "HOLIDAYS", "EVENTS", "EXAMS", "EMERGENCY"];

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function formatTime(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return "";
    }
}

export default function PrincipalNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const [form, setForm] = useState({
        title: "",
        tag: "GENERAL" as NoticeTag,
        content: "",
        link: "",
    });

    const { data: notices = [], isLoading } = useGetNoticesQuery();
    const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();

    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter((n) => n.tag === LABEL_TO_TAG[selectedCategory]);

    const getCategoryColor = (tag: NoticeTag) => {
        return TAG_COLORS[tag] ?? "bg-blue-50 text-blue-700 border border-blue-100";
    };

    const handleCreateNotice = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        try {
            await createNotice({
                title: form.title.trim(),
                content: form.content.trim(),
                senderName: "Principal's Desk",
                tag: form.tag,
                link: form.link.trim() || undefined,
            }).unwrap();
            setFeedback({ type: "success", msg: "Notice published successfully!" });
            setShowCreateForm(false);
            setForm({ title: "", tag: "GENERAL", content: "", link: "" });
            setTimeout(() => setFeedback(null), 4000);
        } catch {
            setFeedback({ type: "error", msg: "Failed to publish notice. Please try again." });
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/principal">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">School Notice Board</h1>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                    {showCreateForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showCreateForm ? "Cancel" : "Create Notice"}</span>
                </button>
            </div>

            {/* Feedback Banner */}
            {feedback && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    feedback.type === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                    {feedback.msg}
                </div>
            )}

            {/* Create Notice Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-md border-t-4 border-purple-600 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Notice</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notice Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Enter notice title..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.tag}
                                    onChange={(e) => setForm({ ...form, tag: e.target.value as NoticeTag })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900"
                                >
                                    {TAG_LIST.filter(t => t !== "ALL_NOTICES").map((tag) => (
                                        <option key={tag} value={tag}>{TAG_TO_LABEL[tag]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Enter notice message..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none resize-none text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                External Link (Optional)
                            </label>
                            <input
                                type="url"
                                value={form.link}
                                onChange={(e) => setForm({ ...form, link: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900 placeholder-gray-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateNotice}
                                disabled={!form.title.trim() || !form.content.trim() || isCreating}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    form.title.trim() && form.content.trim() && !isCreating
                                        ? "bg-purple-600 text-white hover:bg-purple-700"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {isCreating ? "Publishing..." : "Publish Notice"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notice Board Section */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-purple-600">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">All Notices</h2>
                    </div>
                    <div className="relative">
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none appearance-none transition-all hover:border-purple-300 shadow-sm"
                        >
                            {TAG_LIST.map((tag) => (
                                <option key={tag} value={TAG_TO_LABEL[tag]}>{TAG_TO_LABEL[tag]}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="group border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center space-x-3 flex-wrap gap-1">
                                            <h3 className="font-bold text-gray-800">{notice.senderName}</h3>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getCategoryColor(notice.tag)}`}>
                                                {TAG_TO_LABEL[notice.tag] ?? notice.tag}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">{notice.title}</p>
                                    </div>
                                    <div className="text-right ml-4 shrink-0">
                                        <p className="text-xs text-gray-500 font-medium">{formatDate(notice.createdAt)}</p>
                                        <p className="text-xs text-gray-400">{formatTime(notice.createdAt)}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">{notice.content}</p>

                                {notice.link && (
                                    <a
                                        href={notice.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mb-3"
                                    >
                                        <Link2 size={14} />
                                        {notice.link}
                                    </a>
                                )}

                                {/* Admin Actions */}
                                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center space-x-2">
                                        <button className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors text-xs">
                                            Edit
                                        </button>
                                        <button className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-xs">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Bell size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">
                                {selectedCategory === "All Notices"
                                    ? "No notices published yet"
                                    : `No notices in ${selectedCategory} category`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
