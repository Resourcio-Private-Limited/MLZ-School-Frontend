"use client";

import { Download, BookOpen, ArrowRight, Video, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import { useGetDashboardQuery } from "@/redux/api/studentApi";

export default function StudentHomePage() {
    const { data: dashboard } = useGetDashboardQuery();

    const classroom = dashboard?.classroom;
    const latestExam = dashboard?.latestExams?.[0];
    const onlineClasses = dashboard?.upcomingOnlineClasses ?? [];

    const formatClassDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-light text-slate-800">
                    Welcome back, <span className="font-bold text-blue-600">Student</span>
                </h1>
                <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening in your school today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Classroom Section - Clickable Card */}
                <Link href="/student/classroom" className="group block">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-blue-500 overflow-hidden h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">My Classroom</h2>
                                        <p className="text-slate-500 text-sm font-medium">{classroom?.name ?? "—"}</p>
                                    </div>
                                </div>
                                <div className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <StatBox label="Teacher" value={classroom?.classTeacher ?? "—"} />
                                <StatBox label="Students" value={classroom?.studentCount ?? "—"} isNumber />
                                <StatBox label="Subjects" value={classroom?.subjectCount ?? "—"} isNumber />
                                <StatBox label="Notices" value={classroom?.noticeCount ?? "—"} isNumber />
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm font-medium text-blue-600">
                                View Classroom Details
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Exam Area Section - Clickable Card */}
                <Link href="/student/exams" className="group block h-full">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-t-4 border-purple-500 overflow-hidden h-full">
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-purple-50 p-3 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                        <Download size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">Exam Area</h2>
                                        <p className="text-slate-500 text-sm font-medium">Results & Materials</p>
                                    </div>
                                </div>
                                <div className="text-slate-300 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="flex-grow">
                                <p className="text-slate-500 text-sm mb-4">Access your examination schedules, download admit cards, and view your performance reports.</p>
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Latest Exam</span>
                                        <span className="font-semibold text-purple-700">{latestExam?.name ?? "—"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-sm font-medium text-purple-600">
                                Go to Exams
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Online Classes Section */}
            {onlineClasses.length > 0 && (
                <div className="bg-white rounded-xl shadow-md border-t-4 border-orange-500 overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center space-x-3 mb-5">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <Video size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Upcoming Online Classes</h2>
                                <p className="text-slate-500 text-sm">Scheduled live sessions for your classroom</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {onlineClasses.map((cls) => (
                                <a
                                    key={cls.id}
                                    href={cls.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-4 transition-colors group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-orange-700 transition-colors">{cls.topic}</p>
                                        <ExternalLink size={14} className="text-orange-400 group-hover:text-orange-600 shrink-0 ml-2 mt-0.5" />
                                    </div>
                                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-2">
                                        <Clock size={12} />
                                        <span>{formatClassDate(cls.date)}</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, isNumber }: { label: string; value: string | number; isNumber?: boolean }) {
    return (
        <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100 group-hover:border-blue-100 transition-colors">
            <p className="text-slate-500 text-xs mb-1 uppercase tracking-wider">{label}</p>
            <p className={`text-slate-800 font-semibold ${isNumber ? 'text-xl' : 'text-sm truncate'}`}>
                {value}
            </p>
        </div>
    );
}
