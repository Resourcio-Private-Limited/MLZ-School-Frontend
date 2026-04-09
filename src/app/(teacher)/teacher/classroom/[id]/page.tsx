"use client";

import { useState, use } from "react";
import { MessageSquare, Calendar, Users, ArrowLeft, BookOpen, Clock, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useGetClassDetailsQuery, useGetTeacherClassesQuery } from "@/redux/api/teacherApi";

export default function TeacherClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);

    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const { data: classDetails, isLoading } = useGetClassDetailsQuery(classroomId);

    const isClassTeacher = myClasses.some(
        (cls) => cls.id === classroomId && cls.isClassTeacher
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/teacher">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-emerald-500 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300" />
                    <h1 className="text-3xl font-bold text-slate-800">Classroom Workspace</h1>
                </div>
                {!isLoading && classDetails && (
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-slate-800">{classDetails.className}</span>
                        <span className="text-sm text-emerald-600 font-medium">Section {classDetails.section}</span>
                    </div>
                )}
            </div>

            {/* Class Info Banner */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-800 rounded-lg shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl" />

                {isLoading ? (
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : classDetails ? (
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-100 font-medium">Total Students</p>
                                <p className="font-bold text-2xl">{classDetails.totalStudents}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Users size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-100 font-medium">Class Teacher</p>
                                <p className="font-bold text-xl">{classDetails.classTeacherName ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <BookOpen size={28} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-100 font-medium">Role</p>
                                <p className="font-bold text-xl">{isClassTeacher ? "Class Teacher" : "Subject Teacher"}</p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Cards Grid - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students Card */}
                <Link href={`/teacher/classroom/${classroomId}/students`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Users size={24} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Students</h2>
                                <p className="text-slate-500 text-sm">View student list and academic performance.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                View Class List <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Announcements Card */}
                <Link href={`/teacher/classroom/${classroomId}/announcements`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Announcements</h2>
                                <p className="text-slate-500 text-sm">Post updates and circulars for your students.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Go to Board <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Student Messages Card */}
                <Link href={`/teacher/classroom/${classroomId}/messages`} className="group">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                        <div className="p-6 flex flex-col h-full justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Student Messages</h2>
                                <p className="text-slate-500 text-sm">Direct messages from students and parents.</p>
                            </div>
                            <div className="mt-6 flex items-center text-emerald-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Open Chat <ArrowLeft className="ml-1 rotate-180" size={16} />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Attendance Stats Card */}
                <Link href={`/teacher/classroom/${classroomId}/attendance`}>
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full cursor-pointer group">
                        <div className="p-6 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-green-50 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                                        <Calendar size={24} />
                                    </div>
                                    <div className="text-green-600 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center">
                                        View History <ArrowLeft className="ml-1 rotate-180" size={16} />
                                    </div>
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Attendance</h2>
                                <p className="text-slate-500 text-sm">Today's attendance overview.</p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Generate Marks Card - Only for Class Teachers */}
                {isClassTeacher && (
                    <Link href={`/teacher/classroom/${classroomId}/exams`}>
                        <div className="bg-white rounded-xl shadow-md border-t-4 border-amber-500 hover:shadow-lg transition-all duration-300 h-full">
                            <div className="p-6 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-amber-50 p-3 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                            <FileSpreadsheet size={24} />
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">Final Exam Marks</h2>
                                    <p className="text-slate-500 text-sm">Generate and manage student marks for final exams.</p>
                                </div>
                                <div className="mt-6 flex items-center text-amber-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                    Generate Marks <ArrowLeft className="ml-1 rotate-180" size={16} />
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
