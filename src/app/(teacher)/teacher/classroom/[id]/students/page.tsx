"use client";

import { use, useState } from "react";
import { ArrowLeft, Search, Filter, MoreVertical, FileText, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudentListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [searchTerm, setSearchTerm] = useState("");

    // Mock Student Data
    const students = [
        { id: 101, name: "Aarav Patel", rollNo: "10-A-01", attendance: "92%", grade: "A", lastExam: "95%" },
        { id: 102, name: "Aditi Sharma", rollNo: "10-A-02", attendance: "88%", grade: "A-", lastExam: "89%" },
        { id: 103, name: "Arjun Singh", rollNo: "10-A-03", attendance: "76%", grade: "B+", lastExam: "78%" },
        { id: 104, name: "Diya Gupta", rollNo: "10-A-04", attendance: "98%", grade: "A+", lastExam: "98%" },
        { id: 105, name: "Ishaan Kumar", rollNo: "10-A-05", attendance: "65%", grade: "C", lastExam: "60%" },
        { id: 106, name: "Kavya Reddy", rollNo: "10-A-06", attendance: "90%", grade: "A", lastExam: "92%" },
        { id: 107, name: "Mira Nair", rollNo: "10-A-07", attendance: "85%", grade: "B", lastExam: "82%" },
        { id: 108, name: "Rohan Verma", rollNo: "10-A-08", attendance: "94%", grade: "A", lastExam: "90%" },
        { id: 109, name: "Sanya Malhotra", rollNo: "10-A-09", attendance: "78%", grade: "B+", lastExam: "75%" },
        { id: 110, name: "Vihaan Joshi", rollNo: "10-A-10", attendance: "96%", grade: "A+", lastExam: "97%" },
    ];

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${id}`}>
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
                    <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium shadow-md shadow-emerald-100">
                        <FileText size={16} />
                        <span>Export Report</span>
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
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mr-3">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{student.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.rollNo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${parseInt(student.attendance) > 90 ? 'bg-green-100 text-green-800' :
                                                parseInt(student.attendance) > 75 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {student.attendance}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-700">
                                            {student.grade}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center space-x-1">
                                                <TrendingUp size={14} className="text-green-500" />
                                                <span className="text-sm text-gray-600">{student.lastExam}</span>
                                            </div>
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
