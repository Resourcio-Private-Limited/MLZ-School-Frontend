"use client";

import Link from "next/link";
import { MessageSquare, Users, BookOpen, ArrowLeft } from "lucide-react";
import { useGetDashboardQuery } from "@/redux/api/studentApi";

export default function ClassroomPage() {
    const { data: dashboard, isLoading } = useGetDashboardQuery();

    const classroom = dashboard?.classroom;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/student">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300" />
                    <h1 className="text-3xl font-bold text-slate-800">Classroom</h1>
                </div>
                <div className="text-sm text-slate-500 font-medium">
                    {classroom?.name ?? "—"}
                </div>
            </div>

            {/* Class Info Banner */}
            <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 font-medium">Class Teacher</p>
                                <p className="font-bold text-lg">{classroom?.classTeacher ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 font-medium">Total Students</p>
                                <p className="font-bold text-lg">{classroom?.studentCount ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-100 font-medium">Subjects</p>
                                <p className="font-bold text-lg">{classroom?.subjectCount ?? "—"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cards Grid - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Teacher Announcements Card */}
                <Link href={`/student/classroom/announcements?classroomId=${classroom?.id ?? ''}`} className="group h-full">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-blue-500 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={24} />
                                </div>
                                <div className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowLeft size={20} className="rotate-180" />
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">Announcements</h2>
                            <p className="text-slate-500 text-sm">Updates from your teachers</p>
                        </div>
                    </div>
                </Link>

                {/* Student Message Section Card */}
                <Link href="/student/classroom/messages" className="group h-full">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-emerald-500 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <MessageSquare size={24} />
                                </div>
                                <div className="text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowLeft size={20} className="rotate-180" />
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">Messages</h2>
                            <p className="text-slate-500 text-sm">Contact teachers & principal</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
