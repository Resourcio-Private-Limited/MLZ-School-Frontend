"use client";

import { useState, use } from "react";
import { MessageSquare, Calendar, Users, ArrowLeft, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TeacherClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    // Mock Data based on ID (In a real app, fetch this)
    const classroomDetails = {
        name: id === "1" ? "Class 10 - Section A" : `Classroom ${id}`,
        subject: id === "1" ? "Mathematics" : "General Subject",
        students: 35,
        isClassTeacher: id === "1"
    };

    const attendanceData = {
        present: 32,
        total: 35,
        percentage: 91.4
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/teacher">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-[#2BB9E5] transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Classroom Workspace</h1>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-800">{classroomDetails.name}</span>
                    <span className="text-sm text-[#2BB9E5] font-medium">{classroomDetails.subject}</span>
                </div>
            </div>

            {/* Class Info Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-800 rounded-lg shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-100 font-medium">Total Students</p>
                            <p className="font-bold text-2xl">{classroomDetails.students}</p>
                        </div>
                    </div>
                    {classroomDetails.isClassTeacher && (
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <BookOpen size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-100 font-medium">Role</p>
                                <p className="font-bold text-xl">Class Teacher</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-100 font-medium">Next Session</p>
                            <p className="font-bold text-xl">10:30 AM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students Card */}
                <Link href={`/teacher/classroom/${id}/students`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Students</h2>
                                <p className="text-gray-500 text-sm">View student list and academic performance.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                View Class List <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Announcements Card */}
                <Link href={`/teacher/classroom/${id}/announcements`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Announcements</h2>
                                <p className="text-gray-500 text-sm">Post updates and circulars for your students.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Go to Board <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Student Messages Card */}
                <Link href={`/teacher/classroom/${id}/messages`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">3 New</div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Student Messages</h2>
                                <p className="text-gray-500 text-sm">Direct messages from students and parents.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Open Chat <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Attendance Stats Card */}
                <Link href={`/teacher/classroom/${id}/attendance`}>
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:border-[#2BB9E5] hover:shadow-lg transition-all duration-300 h-full cursor-pointer group">
                        <div className="p-6 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center">
                                        View History <ArrowLeft className="ml-1 rotate-180" size={16} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Attendance</h2>
                                <p className="text-gray-500 text-sm">Today's attendance overview.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Present</p>
                                    <p className="text-lg font-bold text-green-600">{attendanceData.present}</p>
                                </div>
                                <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Absent</p>
                                    <p className="text-lg font-bold text-red-500">{attendanceData.total - attendanceData.present}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
