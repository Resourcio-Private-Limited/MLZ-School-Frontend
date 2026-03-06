"use client";

import { Download, BookOpen, Users, Calendar, ArrowRight, Bell } from "lucide-react";
import Link from "next/link";

export default function StudentHomePage() {
    // Mock data - replace with actual data from backend
    const classroomData = {
        className: "Class 10 - Section A",
        classTeacher: "Mrs. Sharma",
        totalStudents: 35,
        subjects: [
            { name: "Mathematics", teacher: "Mr. Kumar", schedule: "Mon, Wed, Fri - 9:00 AM" },
            { name: "Science", teacher: "Dr. Patel", schedule: "Tue, Thu - 10:00 AM" },
            { name: "English", teacher: "Ms. Reddy", schedule: "Mon, Wed, Fri - 11:00 AM" },
            { name: "Social Studies", teacher: "Mr. Singh", schedule: "Tue, Thu - 2:00 PM" },
            { name: "Hindi", teacher: "Mrs. Gupta", schedule: "Mon, Wed - 1:00 PM" }
        ]
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
                                        <p className="text-slate-500 text-sm font-medium">{classroomData.className}</p>
                                    </div>
                                </div>
                                <div className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all duration-300">
                                    <ArrowRight size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <StatBox label="Teacher" value={classroomData.classTeacher} />
                                <StatBox label="Students" value={classroomData.totalStudents} isNumber />
                                <StatBox label="Subjects" value={classroomData.subjects.length} isNumber />
                                <StatBox label="Notices" value={4} isNumber />
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
                                        <span className="text-slate-600">Latest Result</span>
                                        <span className="font-semibold text-purple-700">First Term Exam 2024</span>
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
