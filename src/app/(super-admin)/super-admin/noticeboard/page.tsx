"use client";

import { useState } from "react";
import { Bell, Filter, Link2, Plus, X, Edit2, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';
import { useGetNoticesQuery, useCreateNoticeMutation, useUpdateNoticeMutation, useDeleteNoticeMutation, NoticeTag, Notice } from "@/redux/api/operationsApi";

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

type NoticeForm = {
    title: string;
    tag: NoticeTag;
    content: string;
    link: string;
};

const emptyForm: NoticeForm = { title: "", tag: "GENERAL", content: "", link: "" };

export default function SuperAdminNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const [showForm, setShowForm] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [form, setForm] = useState<NoticeForm>(emptyForm);

    const { data: notices = [], isLoading, refetch } = useGetNoticesQuery();
    const [createNotice, { isLoading: isCreating }] = useCreateNoticeMutation();
    const [updateNotice, { isLoading: isUpdating }] = useUpdateNoticeMutation();
    const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();

    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter((n) => n.tag === LABEL_TO_TAG[selectedCategory]);

    const getCategoryColor = (tag: NoticeTag) => {
        return TAG_COLORS[tag] ?? "bg-blue-50 text-blue-700 border border-blue-100";
    };

    const openCreate = () => {
        setEditingNotice(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (notice: Notice) => {
        setEditingNotice(notice);
        setForm({ title: notice.title, tag: notice.tag, content: notice.content, link: notice.link ?? "" });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) return;

        try {
            if (editingNotice) {
                await updateNotice({
                    noticeId: editingNotice.id,
                    data: {
                        title: form.title.trim(),
                        content: form.content.trim(),
                        senderName: editingNotice.senderName,
                        tag: form.tag,
                        link: form.link.trim() || undefined,
                    },
                }).unwrap();
                toast.success("Notice updated successfully!");
            } else {
                await createNotice({
                    title: form.title.trim(),
                    content: form.content.trim(),
                    senderName: "Super Admin",
                    tag: form.tag,
                    link: form.link.trim() || undefined,
                }).unwrap();
                toast.success("Notice broadcasted successfully!");
            }
            setShowForm(false);
            setForm(emptyForm);
            setEditingNotice(null);
        } catch {
            toast.error("Failed to save notice. Please try again.");
        }
    };

    const handleDelete = async (noticeId: string) => {
        try {
            await deleteNotice(noticeId).unwrap();
            setShowDeleteConfirm(null);
            toast.success("Notice deleted successfully!");
        } catch {
            toast.error("Failed to delete notice.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Broadcast Notice Board</h1>
                    <p className="text-gray-500 mt-1">Send notices to all portals</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                    <Plus size={20} />
                    <span>Create Notice</span>
                </button>
            </div>

            {/* Create / Edit Notice Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {editingNotice ? "Edit Notice" : "Create Broadcast Notice"}
                    </h2>
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
                                    className="w-full border rounded p-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-rose-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.tag}
                                    onChange={(e) => setForm({ ...form, tag: e.target.value as NoticeTag })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none resize-none text-gray-900"
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-900 placeholder-gray-500"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => { setShowForm(false); setEditingNotice(null); setForm(emptyForm); }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!form.title.trim() || !form.content.trim() || isCreating || isUpdating}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                    form.title.trim() && form.content.trim() && !isCreating && !isUpdating
                                        ? "bg-rose-600 text-white hover:bg-rose-700"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {editingNotice ? (isUpdating ? "Saving..." : "Save Changes") : (isCreating ? "Broadcasting..." : "Broadcast Notice")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Notice</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this notice? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(showDeleteConfirm)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notice Board */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">All Broadcast Notices</h2>
                    </div>
                    <div className="relative">
                        <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none appearance-none transition-all hover:border-rose-300 shadow-sm"
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
                            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
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

                                <div className="absolute top-5 right-5 flex items-center space-x-2">
                                    <button
                                        onClick={() => openEdit(notice)}
                                        className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors text-xs"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(notice.id)}
                                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-xs"
                                    >
                                        <Trash2 size={14} />
                                    </button>
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
                                    ? "No notices broadcasted yet"
                                    : `No notices in ${selectedCategory} category`}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}