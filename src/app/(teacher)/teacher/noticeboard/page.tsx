"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Filter, FileText, Image as ImageIcon, Link2, FileImage, Download, ExternalLink, Megaphone } from "lucide-react";

export default function TeacherNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");

    // Mock data for notices (Teacher specific context)
    const categories = ["All Notices", "General", "Staff Meeting", "Holidays", "Events", "Emergency"];

    const notices = [
        {
            id: 1,
            sender: "Principal's Desk",
            category: "Staff Meeting",
            title: "Urgent Staff Meeting",
            message: "A mandatory staff meeting regarding the upcoming Annual Day function will be held in the Conference Room today at 2:00 PM.",
            date: "2024-10-16",
            time: "09:30 AM",
            attachments: []
        },
        {
            id: 2,
            sender: "School Administration",
            category: "General",
            title: "Submission of Question Papers",
            message: "All teachers are requested to submit the final term question papers to the Examination Cell by October 25th.",
            date: "2024-10-15",
            time: "11:00 AM",
            attachments: [
                { type: "pdf", name: "Exam_Guidelines_2024.pdf", url: "#" }
            ]
        },
        {
            id: 3,
            sender: "Principal's Desk",
            category: "Holidays",
            title: "Diwali Vacation",
            message: "The school will remain closed for Diwali break from October 28th to November 4th. Staff reporting date is November 5th.",
            date: "2024-10-05",
            time: "02:00 PM",
            attachments: []
        },
        {
            id: 4,
            sender: "Admin",
            category: "Events",
            title: "Teacher's Day Celebration Photos",
            message: "Photos from the Teacher's Day celebration have been uploaded to the shared drive.",
            date: "2024-09-06",
            time: "10:00 AM",
            attachments: [
                { type: "link", name: "Photo Gallery", url: "#" }
            ]
        }
    ];

    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter(n => n.category === selectedCategory);

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf":
                return <FileText className="text-red-600" size={20} />;
            case "image":
                return <ImageIcon className="text-green-600" size={20} />;
            case "link":
                return <Link2 className="text-blue-600" size={20} />;
            case "ppt":
                return <FileImage className="text-orange-600" size={20} />;
            default:
                return <FileText className="text-gray-600" size={20} />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Holidays": return "bg-green-100 text-green-800";
            case "Staff Meeting": return "bg-purple-100 text-purple-800";
            case "Events": return "bg-orange-100 text-orange-800";
            case "Emergency": return "bg-red-100 text-red-800";
            default: return "bg-blue-100 text-blue-800";
        }
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
                    <div className="h-6 w-px bg-gray-300"></div>
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
                    {filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-800">{notice.sender}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(notice.category)}`}>
                                                {notice.category}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">{notice.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">{notice.date}</p>
                                        <p className="text-xs text-gray-500">{notice.time}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 mt-2">{notice.message}</p>

                                {/* Attachments */}
                                {notice.attachments && notice.attachments.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Attachments:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {notice.attachments.map((attachment, idx) => (
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
                        ))
                    ) : (
                        <p className="text-gray-500 text-center py-8">No notices in {selectedCategory} category</p>
                    )}
                </div>
            </div>
        </div>
    );
}
