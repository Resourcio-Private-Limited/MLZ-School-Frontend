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
} from "lucide-react";

// Map API tag to display label
const tagToLabel: Record<string, string> = {
    ALL_NOTICES: 'All Notices',
    GENERAL: 'General',
    HOLIDAYS: 'Holidays',
    EVENTS: 'Events',
    EXAMS: 'Exams',
    EMERGENCY: 'Emergency',
};

const displayToApiTag: Record<string, string> = {
    'All Notices': 'ALL_NOTICES',
    'General': 'GENERAL',
    'Holidays': 'HOLIDAYS',
    'Events': 'EVENTS',
    'Exams': 'EXAMS',
    'Emergency': 'EMERGENCY',
};

const categories = ["All Notices", "General", "Holidays", "Events", "Exams", "Emergency"];

export default function NoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const { data: notices = [], isLoading, error } = useGetNoticesQuery();

    // Build attachment list from link + file fields
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

    // Filter notices by selected category
    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter(n => tagToLabel[n.tag] === selectedCategory);

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf": return <FileText className="text-red-500" size={20} />;
            case "image": return <ImageIcon className="text-emerald-500" size={20} />;
            case "link": return <Link2 className="text-blue-500" size={20} />;
            case "ppt": return <FileImage className="text-orange-500" size={20} />;
            default: return <FileText className="text-slate-400" size={20} />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Holidays": return "bg-emerald-50 text-emerald-700 border border-emerald-100";
            case "Exams": return "bg-purple-50 text-purple-700 border border-purple-100";
            case "Events": return "bg-orange-50 text-orange-700 border border-orange-100";
            case "Emergency": return "bg-red-50 text-red-700 border border-red-100";
            default: return "bg-blue-50 text-blue-700 border border-blue-100";
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
                    <Link href="/student">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300" />
                    <h1 className="text-3xl font-bold text-gray-800">School Notice Board</h1>
                </div>
            </div>

            {/* Notice Board Section */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-blue-500">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">All Notices</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none appearance-none transition-all hover:border-blue-300 shadow-sm"
                            >
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Loading notices...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            <p>Failed to load notices. Please try again.</p>
                        </div>
                    ) : filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => {
                            const attachments = buildAttachments(notice);
                            const dateLabel = tagToLabel[notice.tag] ?? notice.tag;
                            return (
                                <div key={notice.id} className="group border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-bold text-gray-800">{notice.senderName}</h3>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getCategoryColor(dateLabel)}`}>
                                                    {dateLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">{notice.title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 font-medium">{formatDate(notice.createdAt)}</p>
                                            <p className="text-xs text-gray-400">{formatTime(notice.createdAt)}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{notice.content}</p>

                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-3">
                                            {attachments.map((attachment, idx) => (
                                                <a
                                                    key={idx}
                                                    href={attachment.url}
                                                    target={attachment.type === "link" ? "_blank" : undefined}
                                                    rel={attachment.type === "link" ? "noopener noreferrer" : undefined}
                                                    className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-3 py-2 text-xs transition-colors group/att"
                                                >
                                                    {getFileIcon(attachment.type)}
                                                    <span className="text-gray-600 font-medium group-hover/att:text-blue-700">{attachment.name}</span>
                                                    {attachment.type === "link" ? (
                                                        <ExternalLink size={14} className="text-gray-400 group-hover/att:text-blue-500" />
                                                    ) : (
                                                        <Download size={14} className="text-gray-400 group-hover/att:text-blue-500" />
                                                    )}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Bell size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">No notices in {selectedCategory} category</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}