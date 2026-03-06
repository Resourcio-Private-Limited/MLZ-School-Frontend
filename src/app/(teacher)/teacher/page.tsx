"use client";

import { Users, BookOpen, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function TeacherHomePage() {
    // Mock Data for Classrooms
    const classrooms = [
        {
            id: 1,
            name: "Class 10 - Section A",
            subject: "Mathematics",
            students: 35,
            isClassTeacher: true
        },
        {
            id: 2,
            name: "Class 9 - Section B",
            subject: "Mathematics",
            students: 40,
            isClassTeacher: false
        },
        {
            id: 3,
            name: "Class 12 - Science",
            subject: "Physics",
            students: 32,
            isClassTeacher: false
        },
        {
            id: 4,
            name: "Class 8 - Section A",
            subject: "Science",
            students: 38,
            isClassTeacher: false
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Classrooms</h1>
                    <p className="text-gray-500 mt-1">Manage your classes and students</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Classroom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classrooms.map((classroom) => (
                    <Link href={`/teacher/classroom/${classroom.id}`} key={classroom.id} className="block group">
                        <div className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 transition-all duration-300 relative h-full ${classroom.isClassTeacher ? 'border-emerald-500 shadow-lg' : 'border-gray-200 hover:border-emerald-400 hover:shadow-lg'}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg transition-colors duration-300 ${classroom.isClassTeacher ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                        {classroom.isClassTeacher && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                Class Teacher
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-1">{classroom.name}</h3>
                                <p className="text-emerald-600 font-medium text-sm mb-4">{classroom.subject}</p>

                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="flex items-center text-gray-600 text-sm">
                                        <Users size={16} className="mr-2 text-gray-400" />
                                        <span>{classroom.students} Students</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end items-center">
                                <span className="text-emerald-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                    Manage Class <ArrowRight size={16} className="ml-1" />
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
