"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Calendar, Trophy, Users, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGetExamsForTeacherQuery, useGetExamMarksQuery } from "@/redux/api/academicApi";

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function getGradeColor(grade: string | null) {
    switch (grade) {
        case 'A+': return 'bg-green-100 text-green-700';
        case 'A': return 'bg-emerald-100 text-emerald-700';
        case 'B': return 'bg-blue-100 text-blue-700';
        case 'C': return 'bg-yellow-100 text-yellow-700';
        case 'D': return 'bg-orange-100 text-orange-700';
        case 'F': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function getAuthUser() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem("authUser");
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export default function TeacherExamsPage() {
    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        setAuthUser(getAuthUser());
    }, []);

    const teacherId = authUser?.teacher?.id ?? authUser?.id;
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

    const { data: exams = [], isLoading: examsLoading } = useGetExamsForTeacherQuery(teacherId ?? "");
    const { data: marksData, isLoading: marksLoading } = useGetExamMarksQuery(selectedExamId ?? "", {
        skip: !selectedExamId,
    });

    const selectedExam = exams.find(e => e.id === selectedExamId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link href="/teacher">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-500 transition-colors">
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-3xl font-bold text-gray-800">Exam Results</h1>
            </div>

            {examsLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
            ) : selectedExamId && marksData ? (
                /* ── Marks View ── */
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setSelectedExamId(null)}
                            className="flex items-center space-x-2 text-gray-600 hover:text-emerald-500 transition-colors font-medium"
                        >
                            <ArrowLeft size={18} />
                            <span>Back to Exams</span>
                        </button>
                    </div>

                    {/* Exam Title */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800">{marksData.examName}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {marksData.subjectName} &bull; {marksData.classroomName} &bull; {formatDate(marksData.examDate)}
                        </p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Students</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{marksData.totalStudents}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={28} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Average Marks</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">{marksData.avgMarks.toFixed(1)}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <TrendingUp size={28} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Highest Marks</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{marksData.highestMarks}</p>
                            </div>
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <Trophy size={28} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Lowest Marks</p>
                                <p className="text-3xl font-bold text-red-600 mt-1">{marksData.lowestMarks}</p>
                            </div>
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                <TrendingDown size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Marks Table */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Student Marks</h3>
                        </div>
                        <div className="overflow-x-auto">
                            {marksLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Roll No</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student Name</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Marks Obtained</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Total Marks</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {marksData.records.map((record) => (
                                            <tr key={record.studentId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                                                    {record.rollNumber}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                                    {record.fullName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {record.marksObtained !== null ? (
                                                        <span className="font-bold text-gray-800">{record.marksObtained}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Not Recorded</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {record.totalMarks}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {record.percentage !== null ? (
                                                        <span className="font-semibold text-gray-700">{record.percentage}%</span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {record.grade ? (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getGradeColor(record.grade)}`}>
                                                            {record.grade} {record.status === 'Fail' ? '— FAIL' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Exam Cards Grid ── */
                <>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                        <p className="text-sm text-blue-800">
                            Select an exam from the list below to view student marks, performance KPIs, and grades.
                        </p>
                    </div>

                    {exams.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No exams found. Contact the Admin to schedule exams.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => setSelectedExamId(exam.id)}
                                    className="group text-left bg-white p-6 rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded font-bold ${exam.submissionOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {exam.submissionOpen ? "OPEN" : "CLOSED"}
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-bold text-gray-800 mb-1">{exam.name}</h2>
                                    <p className="text-sm text-gray-500 mb-4">{exam.subjectName} ({exam.classroomGrade}-{exam.classroomSection})</p>

                                    <div className="flex items-center text-xs text-gray-400 mb-4">
                                        <Calendar size={14} className="mr-1" />
                                        {formatDate(exam.examDate)}
                                    </div>

                                    <div className="border-t pt-4 flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Results Uploaded:</span>
                                        <span className="font-bold text-gray-900">{exam.totalResults}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
