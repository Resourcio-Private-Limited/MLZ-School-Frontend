"use client";

import { useState } from "react";
import { Bell, Filter, FileText, Image as ImageIcon, Link2, Download, ExternalLink, Plus, X, Upload } from "lucide-react";

export default function SuperAdminNoticeBoardPage() {
    const [selectedCategory, setSelectedCategory] = useState("All Notices");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newNotice, setNewNotice] = useState({
        title: "",
        category: "General",
        message: "",
        targetAudience: "All"
    });

    const categories = ["All Notices", "General", "Holidays", "Events", "Exams", "Emergency", "System Announcement"];
    const targetAudiences = ["All", "Students Only", "Teachers Only", "Staff Only", "Specific Classes"];

    const [notices, setNotices] = useState([
        {
            id: 1,
            sender: "Super Admin",
            category: "System Announcement",
            title: "System Maintenance Scheduled",
            message: "The portal will undergo maintenance on Sunday, 2:00 AM - 4:00 AM. All services will be temporarily unavailable.",
            date: "2024-10-20",
            time: "03:00 PM",
            targetAudience: "All",
            attachments: []
        },
        {
            id: 2,
            sender: "Super Admin",
            category: "General",
            title: "New Academic Year Guidelines",
            message: "Important guidelines for the new academic year 2025-2026. All staff and students must review.",
            date: "2024-10-18",
            time: "10:00 AM",
            targetAudience: "All",
            attachments: [
                { type: "pdf", name: "Academic_Guidelines_2025.pdf", url: "#" }
            ]
        },
        {
            id: 3,
            sender: "Super Admin",
            category: "Emergency",
            title: "Weather Alert",
            message: "Due to heavy rainfall forecast, school will remain closed tomorrow. Online classes will be conducted as per schedule.",
            date: "2024-10-15",
            time: "06:30 PM",
            targetAudience: "All",
            attachments: []
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
            case "System Announcement": return "bg-rose-50 text-rose-700 border border-rose-100";
            default: return "bg-blue-50 text-blue-700 border border-blue-100";
        }
    };

    const handleCreateNotice = () => {
        const now = new Date();
        const newNoticeData = {
            id: notices.length + 1,
            sender: "Super Admin",
            category: newNotice.category,
            title: newNotice.title,
            message: newNotice.message,
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            targetAudience: newNotice.targetAudience,
            attachments: []
        };
        setNotices([newNoticeData, ...notices]);
        setShowCreateForm(false);
        setNewNotice({ title: "", category: "General", message: "", targetAudience: "All" });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Broadcast Notice Board</h1>
                    <p className="text-gray-500 mt-1">Send notices to all portals</p>
                </div>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                    {showCreateForm ? <X size={20} /> : <Plus size={20} />}
                    <span>{showCreateForm ? "Cancel" : "Create Notice"}</span>
                </button>
            </div>

            {/* Create Notice Form */}
            {showCreateForm && (
                <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Create Broadcast Notice</h2>
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newNotice.category}
                                    onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                            >
                                {targetAudiences.map((audience, idx) => (
                                    <option key={idx} value={audience}>{audience}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">This notice will be visible in selected portal(s)</p>
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
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Attachments (Optional)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors cursor-pointer">
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
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                Broadcast Notice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notice Board Section */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                            <Bell size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">All Broadcast Notices</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none appearance-none transition-all hover:border-rose-300 shadow-sm"
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
                                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700">
                                                {notice.targetAudience}
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

                                {notice.attachments && notice.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {notice.attachments.map((attachment, idx) => (
                                            <a
                                                key={idx}
                                                href={attachment.url}
                                                target={attachment.type === "link" ? "_blank" : undefined}
                                                rel={attachment.type === "link" ? "noopener noreferrer" : undefined}
                                                className="flex items-center space-x-2 bg-white border border-gray-200 hover:border-rose-300 hover:bg-rose-50 rounded-lg px-3 py-2 text-xs transition-colors group/att"
                                            >
                                                {getFileIcon(attachment.type)}
                                                <span className="text-gray-600 font-medium group-hover/att:text-rose-700">{attachment.name}</span>
                                                {attachment.type === "link" ? (
                                                    <ExternalLink size={14} className="text-gray-400 group-hover/att:text-rose-500" />
                                                ) : (
                                                    <Download size={14} className="text-gray-400 group-hover/att:text-rose-500" />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center space-x-2">
                                        <button className="p-1.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition-colors text-xs">
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
