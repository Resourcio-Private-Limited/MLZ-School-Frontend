"use client";

import { useState } from "react";
import { MessageSquare, Calendar, Users, Filter, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ClassroomPage() {
    const [selectedTeacher, setSelectedTeacher] = useState("All Teachers");
    const [messageRecipient, setMessageRecipient] = useState("Class Teacher");

    // Mock data - replace with actual data from backend
    const classroomData = {
        className: "Class 10 - Section A",
        classTeacher: "Mrs. Sharma",
        totalStudents: 35,
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
            time: "10:30 AM"
        },
        {
            id: 2,
            teacher: "Mr. Kumar",
            subject: "Mathematics",
            message: "Mathematics test on Chapter 5 will be held on Monday. Please prepare well.",
            date: "2024-01-29",
            time: "2:15 PM"
        },
        {
            id: 3,
            teacher: "Dr. Patel",
            subject: "Science",
            message: "Science project submissions due by end of this week.",
            date: "2024-01-28",
            time: "11:00 AM"
        },
        {
            id: 4,
            teacher: "Ms. Reddy",
            subject: "English",
            message: "English essay competition - submit your entries by Friday.",
            date: "2024-01-27",
            time: "9:45 AM"
        }
    ];

    const attendanceData = {
        present: 142,
        total: 160,
        percentage: 88.75
    };

    const teachers = ["All Teachers", "Mrs. Sharma", ...classroomData.subjects.map(s => s.teacher)];
    const messageRecipients = ["Class Teacher", "Principal", ...classroomData.subjects.map(s => s.teacher)];

    const filteredAnnouncements = selectedTeacher === "All Teachers"
        ? announcements
        : announcements.filter(a => a.teacher === selectedTeacher);

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
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Classroom</h1>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    {classroomData.className}
                </div>
            </div>

            {/* Class Info Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Class Teacher</p>
                            <p className="font-bold text-lg">{classroomData.classTeacher}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Total Students</p>
                            <p className="font-bold text-lg">{classroomData.totalStudents}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-100 font-medium">Subjects</p>
                            <p className="font-bold text-lg">{classroomData.subjects.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid - Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Teacher Announcements Card */}
                <Link href="/student/classroom/announcements" className="group h-full">
                    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-blue-500 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={24} />
                                </div>
                                <div className="text-gray-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowLeft size={20} className="rotate-180" />
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-700 transition-colors">Announcements</h2>
                            <p className="text-gray-500 text-sm">Updates from your teachers</p>
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
                                <div className="text-gray-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowLeft size={20} className="rotate-180" />
                                </div>
                            </div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-emerald-700 transition-colors">Messages</h2>
                            <p className="text-gray-500 text-sm">Contact teachers & principal</p>
                        </div>
                    </div>
                </Link>

                {/* Attendance Stats Card - Non-clickable */}
                <div className="h-full">
                    <div className="bg-white rounded-xl shadow-md border-t-4 border-purple-500 h-full">
                        <div className="p-6">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Attendance</h2>
                                    <p className="text-gray-500 text-sm">Overall performance</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Present</p>
                                    <p className="text-lg font-bold text-green-600">{attendanceData.present}/{attendanceData.total}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Rate</p>
                                    <p className="text-lg font-bold text-purple-600">{attendanceData.percentage}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
