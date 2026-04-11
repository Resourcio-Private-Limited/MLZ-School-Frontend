"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    MessageSquare,
    Filter,
    FileText,
    Download,
    ExternalLink,
} from "lucide-react";
import { useGetAnnouncementsQuery, useGetClassroomTeachersQuery } from "@/redux/api/operationsApi";

function AnnouncementsContent() {
    const searchParams = useSearchParams();
    const classroomId = searchParams.get("classroomId") ?? "";

    const { data: announcements = [], isLoading: announcementsLoading } = useGetAnnouncementsQuery(classroomId, {
        skip: !classroomId,
    });
    const { data: teachers = [] } = useGetClassroomTeachersQuery(classroomId, {
        skip: !classroomId,
    });

    const [selectedTeacher, setSelectedTeacher] = useState("All Teachers");

    const teacherOptions = [
        { id: "all", fullName: "All Teachers", isClassTeacher: false },
        ...teachers,
    ];

    const filteredAnnouncements =
        selectedTeacher === "All Teachers"
            ? announcements
            : announcements.filter((a) => a.teacher.fullName === selectedTeacher);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/student/classroom">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300" />
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
                            {teacherOptions.map((teacher) => (
                                <option key={teacher.id} value={teacher.fullName}>
                                    {teacher.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {announcementsLoading ? (
                        <div className="text-center py-12">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500">Loading announcements...</p>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">
                                {selectedTeacher === "All Teachers"
                                    ? "No announcements yet."
                                    : `No announcements from ${selectedTeacher}`}
                            </p>
                        </div>
                    ) : (
                        filteredAnnouncements.map((announcement) => (
                            <div
                                key={announcement.id}
                                className="group border border-slate-100 rounded-xl p-5 hover:bg-slate-50 transition-all duration-200 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">{announcement.teacher.fullName}</h3>
                                        <p className="text-sm font-medium text-blue-600/80">{announcement.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium">{formatDate(announcement.createdAt)}</p>
                                        <p className="text-xs text-slate-400">{formatTime(announcement.createdAt)}</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">{announcement.content}</p>

                                {announcement.fileUrl && (
                                    <div className="flex flex-wrap gap-3">
                                        <a
                                            href={announcement.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg px-3 py-2 text-xs transition-colors group/att"
                                        >
                                            <FileText size={16} className="text-blue-500" />
                                            <span className="text-slate-600 font-medium group-hover/att:text-blue-700">Download Attachment</span>
                                            <ExternalLink size={14} className="text-slate-400 group-hover/att:text-blue-500" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export default function AnnouncementsPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/student/classroom">
                            <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={20} />
                                <span className="font-medium">Back</span>
                            </button>
                        </Link>
                        <div className="h-6 w-px bg-slate-300" />
                        <h1 className="text-3xl font-bold text-slate-800">Teacher Announcements</h1>
                    </div>
                </div>
            }>
                <AnnouncementsContent />
            </Suspense>
        </div>
    );
}
