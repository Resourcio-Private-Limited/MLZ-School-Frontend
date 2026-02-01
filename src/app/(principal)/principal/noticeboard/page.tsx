"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Filter, FileText, Image as ImageIcon, Link2, FileImage, Download, ExternalLink, Plus, X, Upload } from "lucide-react";

export default function PrincipalNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newNotice, setNewNotice] = useState({
        title: "",
        category: "General",
        message: "",
        targetAudience: "All"
    });

    // Mock data for notices
    const categories = ["All Notices", "General", "Holidays", "Events", "Exams", "Emergency"];
    const targetAudiences = ["All", "Students Only", "Teachers Only", "Specific Classes"];

    const [notices, setNotices] = useState([
        {
            id: 1,
            sender: "Principal's Desk",
            category: "General",
            title: "Winter Uniform Update",
            message: "All students are required to switch to winter uniform starting from November 1st. Please ensure you have the full set.",
            date: "2024-10-15",
            time: "09:00 AM",
            attachments: [
                { type: "image", name: "Uniform_Guidelines.jpg", url: "#" }
            ]
        },
        {
            id: 2,
            sender: "Principal's Desk",
            category: "Events",
            title: "Annual Sports Day 2024",
            message: "The Annual Sports Day will be held on December 15th. Registration for events opens next week.",
            date: "2024-10-10",
            time: "11:30 AM",
            attachments: [
                { type: "pdf", name: "Sports_Day_Schedule.pdf", url: "#" },
                { type: "link", name: "Registration Form", url: "#" }
            ]
        },
        {
            id: 3,
            sender: "Principal's Desk",
            category: "Holidays",
            title: "Diwali Vacation",
            message: "The school will remain closed for Diwali break from October 28th to November 4th. Classes will resume on November 5th.",
            date: "2024-10-05",
            time: "02:00 PM",
            attachments: []
        },
        {
            id: 4,
            sender: "Principal's Desk",
            category: "Exams",
            title: "Half-Yearly Exam Results",
            message: "Half-yearly examination results will be declared on October 20th. Parents can collect report cards between 9 AM and 12 PM.",
            date: "2024-10-01",
            time: "10:00 AM",
            attachments: [
                { type: "pdf", name: "Report_Card_Schedule.pdf", url: "#" }
            ]
        }
    ]);

    const filteredNotices = selectedCategory === "All Notices"
        ? notices
        : notices.filter(n => n.category === selectedCategory);

    const getFileIcon = (type: string) => {
        switch (type) {
            case "pdf":
                return <FileText className="text-red-500" size={20} />;
            case "image":
                return <ImageIcon className="text-emerald-500" size={20} />;
            case "link":
                return <Link2 className="text-blue-500" size={20} />;
            case "ppt":
                return <FileImage className="text-orange-500" size={20} />;
            default:
                return <FileText className="text-slate-400" size={20} />;
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

    const handleCreateNotice = () => {
        // Mock create notice functionality
        const now = new Date();
        const newNoticeData = {
            id: notices.length + 1,
            sender: "Principal's Desk",
            category: newNotice.category,
            title: newNotice.title,
            message: newNotice.message,
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            attachments: []
        };
        setNotices([newNoticeData, ...notices]);
        setShowCreateForm(false);
        setNewNotice({ title: "", category: "General", message: "", targetAudience: "All" });
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
                                    value={newNotice.title}
                                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                                    placeholder="Enter notice title..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newNotice.category}
                                    onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                >
                                    {categories.filter(c => c !== "All Notices").map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Target Audience <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={newNotice.targetAudience}
                                onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                            >
                                {targetAudiences.map((audience, idx) => (
                                    <option key={idx} value={audience}>{audience}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={newNotice.message}
                                onChange={(e) => setNewNotice({ ...newNotice, message: e.target.value })}
                                placeholder="Enter notice message..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Attachments (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                                <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, Images, or Documents</p>
                            </div>
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
                                disabled={!newNotice.title || !newNotice.message}
                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${newNotice.title && newNotice.message
                                        ? "bg-purple-600 text-white hover:bg-purple-700"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Publish Notice
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
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none appearance-none transition-all hover:border-purple-300 shadow-sm"
                            >
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {filteredNotices.length > 0 ? (
                        filteredNotices.map((notice) => (
                            <div key={notice.id} className="group border border-gray-100 rounded-xl p-5 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="font-bold text-gray-800">{notice.sender}</h3>
                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${getCategoryColor(notice.category)}`}>
                                                {notice.category}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">{notice.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-medium">{notice.date}</p>
                                        <p className="text-xs text-gray-400">{notice.time}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">{notice.message}</p>

                                {/* Attachments */}
                                {notice.attachments && notice.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {notice.attachments.map((attachment, idx) => (
                                            <a
                                                key={idx}
                                                href={attachment.url}
                                                target={attachment.type === "link" ? "_blank" : undefined}
                                                rel={attachment.type === "link" ? "noopener noreferrer" : undefined}
                                                className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-lg px-3 py-2 text-xs transition-colors group/att"
                                            >
                                                {getFileIcon(attachment.type)}
                                                <span className="text-gray-600 font-medium group-hover/att:text-purple-700">{attachment.name}</span>
                                                {attachment.type === "link" ? (
                                                    <ExternalLink size={14} className="text-gray-400 group-hover/att:text-purple-500" />
                                                ) : (
                                                    <Download size={14} className="text-gray-400 group-hover/att:text-purple-500" />
                                                )}
                                            </a>
                                        ))}
                                    </div>
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
                            <p className="text-gray-500 font-medium">No notices in {selectedCategory} category</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
