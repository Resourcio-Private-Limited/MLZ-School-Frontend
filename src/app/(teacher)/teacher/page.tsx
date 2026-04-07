"use client";

import { Users, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGetTeacherClassesQuery } from "@/redux/api/teacherApi";

export default function TeacherHomePage() {
    const { data: classes = [], isLoading } = useGetTeacherClassesQuery();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">My Classrooms</h1>
                    <p className="text-slate-500 mt-1">Manage your classes and students</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm text-slate-600 font-medium">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-xl h-52 animate-pulse border-t-4 border-emerald-400" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <Link href={`/teacher/classroom/${cls.id}`} key={cls.id} className="block group">
                            <div className={`bg-white rounded-xl shadow-md overflow-hidden border-t-4 transition-all duration-300 relative h-full ${cls.isClassTeacher ? "border-emerald-500 shadow-lg" : "border-gray-200 hover:border-emerald-400 hover:shadow-lg"}`}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg transition-colors duration-300 ${cls.isClassTeacher ? "bg-emerald-500 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"}`}>
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                            {cls.isClassTeacher && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    Class Teacher
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{cls.name}</h3>
                                    <p className="text-emerald-600 font-medium text-sm mb-4">{cls.subjects.join(", ")}</p>

                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <div className="flex items-center text-slate-600 text-sm">
                                            <Users size={16} className="mr-2 text-slate-400" />
                                            <span>{cls.studentCount} Students</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 px-6 py-3 border-t border-gray-100 flex justify-end items-center">
                                    <span className="text-emerald-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                        Manage Class <ArrowRight size={16} className="ml-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
