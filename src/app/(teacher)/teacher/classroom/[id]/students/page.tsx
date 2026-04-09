"use client";

import { use, useState } from "react";
import { ArrowLeft, Search, Filter, MoreVertical, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useGetClassStudentsQuery } from "@/redux/api/teacherApi";

export default function StudentListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [searchTerm, setSearchTerm] = useState("");

    const { data: students = [], isLoading } = useGetClassStudentsQuery(classroomId);

    const filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${classroomId}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-500 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Students List</h1>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or roll no..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-200">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Overall Grade</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Exam</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p>Loading students...</p>
                                    </td>
                                </tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3">
                                                    {student.fullName.charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{student.fullName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.rollNumber ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {student.attendance ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.attendance === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                    student.attendance === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {student.attendance}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                                            {student.overallGrade ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {student.lastExam ? (
                                                <div className="flex items-center justify-center space-x-1">
                                                    <TrendingUp size={14} className="text-green-500" />
                                                    <span className="text-sm text-gray-600">{student.lastExam.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-gray-400 hover:text-emerald-500 transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        <AlertCircle className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                        <p>No students found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
