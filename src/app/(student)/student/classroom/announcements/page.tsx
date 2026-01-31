"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Filter, FileText, Image as ImageIcon, Link2, FileImage, Download, ExternalLink } from "lucide-react";

export default function AnnouncementsPage() {
    const [selectedTeacher, setSelectedTeacher] = useState("All Teachers");

    // Mock data
    const classroomData = {
        subjects: [
            { name: "Mathematics", teacher: "Mr. Kumar" },
            { name: "Science", teacher: "Dr. Patel" },
            { name: "English", teacher: "Ms. Reddy" },
            { name: "Social Studies", teacher: "Mr. Singh" },
            { name: "Hindi", teacher: "Mrs. Gupta" }
        ]
    };

    const announcements = [
        {
            id: 1,
            teacher: "Mrs. Sharma",
            subject: "General",
            message: "Parent-Teacher meeting scheduled for next Friday at 3 PM.",
            date: "2024-01-30",
            time: "10:30 AM",
            attachments: [
                { type: "pdf", name: "Meeting_Agenda.pdf", url: "#" },
                { type: "link", name: "Meeting Room Link", url: "https://meet.google.com/xyz" }
            ]
        },
        {
            id: 2,
            teacher: "Mr. Kumar",
            subject: "Mathematics",
            message: "Mathematics test on Chapter 5 will be held on Monday. Please prepare well.",
            date: "2024-01-29",
            time: "2:15 PM",
            attachments: [
                { type: "pdf", name: "Chapter_5_Notes.pdf", url: "#" },
                { type: "ppt", name: "Practice_Problems.pptx", url: "#" }
            ]
        },
        {
            id: 3,
            teacher: "Dr. Patel",
            subject: "Science",
            message: "Science project submissions due by end of this week.",
            date: "2024-01-28",
            time: "11:00 AM",
            attachments: [
                { type: "pdf", name: "Project_Guidelines.pdf", url: "#" },
                { type: "image", name: "Sample_Project.jpg", url: "#" }
            ]
        },
        {
            id: 4,
            teacher: "Ms. Reddy",
            subject: "English",
            message: "English essay competition - submit your entries by Friday.",
            date: "2024-01-27",
            time: "9:45 AM",
            attachments: []
        }
    ];

    const teachers = ["All Teachers", "Mrs. Sharma", ...classroomData.subjects.map(s => s.teacher)];

    const filteredAnnouncements = selectedTeacher === "All Teachers"
        ? announcements
        : announcements.filter(a => a.teacher === selectedTeacher);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/student/classroom">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-3xl font-bold text-slate-800">Teacher Announcements</h1>
                </div>
            </div>

            {/* Announcements Section */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-500">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <MessageSquare size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">All Announcements</h2>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Filter size={18} className="text-slate-400" />
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all hover:border-slate-300"
                        >
                            {teachers.map((teacher, index) => (
                                <option key={index} value={teacher}>{teacher}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {filteredAnnouncements.length > 0 ? (
                        filteredAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="group border border-slate-100 rounded-xl p-5 hover:bg-slate-50 transition-all duration-200 hover:shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{announcement.teacher}</h3>
                                        <p className="text-sm font-medium text-blue-600/80">{announcement.subject}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium">{announcement.date}</p>
                                        <p className="text-xs text-slate-400">{announcement.time}</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">{announcement.message}</p>

                                {/* Attachments */}
                                {announcement.attachments && announcement.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {announcement.attachments.map((attachment, idx) => (
                                            <a
                                                key={idx}
                                                href={attachment.url}
                                                target={attachment.type === "link" ? "_blank" : undefined}
                                                rel={attachment.type === "link" ? "noopener noreferrer" : undefined}
                                                className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-3 py-2 text-xs transition-colors group/att"
                                            >
                                                {getFileIcon(attachment.type)}
                                                <span className="text-slate-600 font-medium group-hover/att:text-blue-700">{attachment.name}</span>
                                                {attachment.type === "link" ? (
                                                    <ExternalLink size={14} className="text-slate-400 group-hover/att:text-blue-500" />
                                                ) : (
                                                    <Download size={14} className="text-slate-400 group-hover/att:text-blue-500" />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">No announcements from {selectedTeacher}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
