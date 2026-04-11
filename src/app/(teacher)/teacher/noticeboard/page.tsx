"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetNoticesQuery } from "@/redux/api/operationsApi";
import {
    ArrowLeft,
    Bell,
    Filter,
    FileText,
    Image as ImageIcon,
    Link2,
    FileImage,
    Download,
    ExternalLink,
    Megaphone,
} from "lucide-react";

const tagToLabel: Record<string, string> = {
    ALL_NOTICES: 'All Notices',
    GENERAL: 'General',
    HOLIDAYS: 'Holidays',
    EVENTS: 'Events',
    EXAMS: 'Exams',
    EMERGENCY: 'Emergency',
};

const categories = ["All Notices", "General", "Holidays", "Events", "Emergency"];

export default function TeacherNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const { data: notices = [], isLoading, error } = useGetNoticesQuery();

    const buildAttachments = (notice: { link: string | null; file: string | null }) => {
        const attachments: { type: string; name: string; url: string }[] = [];
        if (notice.link) {
            attachments.push({ type: 'link', name: 'View Link', url: notice.link });
        }
        if (notice.file) {
            const filename = notice.file.split('/').pop() ?? 'Attachment';
            attachments.push({
                type: filename.endsWith('.pdf') ? 'pdf' : 'image',
                name: filename,
                url: notice.file,
            });
        }
        return attachments;
    };

    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter(n => tagToLabel[n.tag] === selectedCategory);

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf": return <FileText className="text-red-600" size={20} />;
            case "image": return <ImageIcon className="text-green-600" size={20} />;
            case "link": return <Link2 className="text-blue-600" size={20} />;
            case "ppt": return <FileImage className="text-orange-600" size={20} />;
            default: return <FileText className="text-gray-600" size={20} />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Holidays": return "bg-green-100 text-green-800";
            case "Events": return "bg-orange-100 text-orange-800";
            case "Emergency": return "bg-red-100 text-red-800";
            default: return "bg-blue-100 text-blue-800";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/teacher">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300" />
                    <div className="flex items-center space-x-2">
                        <Megaphone className="text-emerald-500" size={28} />
                        <h1 className="text-3xl font-bold text-gray-800">Staff General Notice Board</h1>
                    </div>
                </div>
            </div>

            {/* Notice Board Section */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6 border-b pb-3">
                    <div className="flex items-center space-x-2">
                        <Bell className="text-emerald-500" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">Circulars & Announcements</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Filter size={18} className="text-gray-500" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                            {categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Loading notices...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">
                            <p>Failed to load notices. Please try again.</p>
                        </div>
                    ) : filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => {
                            const attachments = buildAttachments(notice);
                            const dateLabel = tagToLabel[notice.tag] ?? notice.tag;
                            return (
                                <div key={notice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-gray-800">{notice.senderName}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(dateLabel)}`}>
                                                    {dateLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700">{notice.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">{formatDate(notice.createdAt)}</p>
                                            <p className="text-xs text-gray-500">{formatTime(notice.createdAt)}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-3 mt-2">{notice.content}</p>

                                    {attachments.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 mb-2">Attachments:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {attachments.map((attachment, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={attachment.url}
                                                        target={attachment.type === "link" ? "_blank" : undefined}
                                                        rel={attachment.type === "link" ? "noopener noreferrer" : undefined}
                                                        className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs transition-colors group"
                                                    >
                                                        {getFileIcon(attachment.type)}
                                                        <span className="text-gray-700 font-medium">{attachment.name}</span>
                                                        {attachment.type === "link" ? (
                                                            <ExternalLink size={14} className="text-gray-400 group-hover:text-emerald-500" />
                                                        ) : (
                                                            <Download size={14} className="text-gray-400 group-hover:text-emerald-500" />
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-8">No notices in {selectedCategory} category</p>
                    )}
                </div>
            </div>
        </div>
    );
}