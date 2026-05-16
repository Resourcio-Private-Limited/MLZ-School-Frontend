"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Calendar, Trophy, Users, TrendingUp, TrendingDown, Loader2, Edit2, X, Check } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { useGetExamTypesForTeacherQuery, useGetExamMarksQuery, useUpdateStudentMarksMutation } from "@/redux/api/academicApi";

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

function MarksEntryModal({
    student,
    examName,
    subjectName,
    onClose,
    onSave,
    isSaving,
}: {
    student: { studentId: string; rollNumber: string; fullName: string; marksObtained: number | null };
    examName: string;
    subjectName: string;
    onClose: () => void;
    onSave: (score: number) => void;
    isSaving: boolean;
}) {
    const [score, setScore] = useState<string>(student.marksObtained?.toString() ?? '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numScore = parseFloat(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 100) {
            toast.error('Please enter a valid score between 0 and 100');
            return;
        }
        onSave(numScore);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Enter Marks</h2>
                            <p className="text-emerald-100 text-sm mt-1">{examName} — {subjectName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Student Info */}
                <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            {student.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-gray-800">{student.fullName}</p>
                            <p className="text-sm text-gray-500">Roll No: {student.rollNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Marks Obtained <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="Enter marks (0-100)"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-lg font-semibold"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter marks between 0 and 100</p>
                    </div>

                    {/* Quick Buttons */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Fill</label>
                        <div className="flex gap-2 flex-wrap">
                            {[0, 25, 50, 75, 100].map(val => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setScore(val.toString())}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors text-sm font-medium"
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || score === ''}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Save Marks
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function TeacherExamsPage() {
    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        setAuthUser(getAuthUser());
    }, []);

    const teacherId = authUser?.teacher?.id ?? authUser?.id;

    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [selectedExam, setSelectedExam] = useState<string>('');

    const { data: classroomsData = [], isLoading: classroomsLoading } = useGetExamTypesForTeacherQuery(teacherId ?? '');
    const { data: marksData, isLoading: marksLoading, refetch: refetchMarks } = useGetExamMarksQuery(selectedExam, {
        skip: !selectedExam,
    });
    const [updateStudentMarks, { isLoading: isUpdating }] = useUpdateStudentMarksMutation();

    const [editingStudent, setEditingStudent] = useState<{ studentId: string; rollNumber: string; fullName: string; marksObtained: number | null } | null>(null);

    // Get current classroom info
    const currentClassroom = classroomsData.find(c => c.classroomId === selectedClassroom);
    const currentExam = currentClassroom?.exams.find(e => e.examId === selectedExam);

    const handleSaveMarks = async (score: number) => {
        if (!editingStudent || !selectedExam) return;

        try {
            await updateStudentMarks({
                examId: selectedExam,
                studentId: editingStudent.studentId,
                score,
            }).unwrap();
            toast.success('Marks saved successfully!');
            setEditingStudent(null);
            refetchMarks();
        } catch (err: any) {
            toast.error(err?.data?.message ?? 'Failed to save marks');
        }
    };

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

            {/* Selection Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Classroom Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Classroom
                        </label>
                        <select
                            value={selectedClassroom}
                            onChange={(e) => {
                                setSelectedClassroom(e.target.value);
                                setSelectedExam('');
                            }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="">— Select a classroom —</option>
                            {classroomsData.map(cls => (
                                <option key={cls.classroomId} value={cls.classroomId}>
                                    {cls.classroomName} (Grade {cls.grade}-{cls.section})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Exam Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Exam
                        </label>
                        <select
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                            disabled={!selectedClassroom}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                        >
                            <option value="">— Select an exam —</option>
                            {currentClassroom?.exams.map(exam => (
                                <option key={exam.examId} value={exam.examId}>
                                    {exam.examName} {exam.subjectName ? `(${exam.subjectName})` : ''} — {formatDate(exam.examDate)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Info Banner */}
            {!selectedExam && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                        Select a classroom and exam from the dropdowns above to view student marks and enter new marks.
                    </p>
                </div>
            )}

            {/* Marks View */}
            {selectedExam && (marksLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
            ) : marksData ? (
                <div className="space-y-6">
                    {/* Exam Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{marksData.examName}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {marksData.subjectName} &bull; {marksData.classroomName} &bull; {formatDate(marksData.examDate)}
                                </p>
                            </div>
                            {currentExam && (
                                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                                    currentExam.submissionOpen
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {currentExam.submissionOpen ? 'MARKS OPEN' : 'MARKS CLOSED'}
                                </span>
                            )}
                        </div>
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
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Student Marks</h3>
                            <span className="text-sm text-gray-500">
                                {marksData.records.filter(r => r.marksObtained !== null).length} / {marksData.totalStudents} recorded
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Marks</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => setEditingStudent({
                                                        studentId: record.studentId,
                                                        rollNumber: record.rollNumber,
                                                        fullName: record.fullName,
                                                        marksObtained: record.marksObtained,
                                                    })}
                                                    disabled={!currentExam?.submissionOpen}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        currentExam?.submissionOpen
                                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    title={currentExam?.submissionOpen ? 'Edit Marks' : 'Marks entry closed'}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No exam selected. Please select a classroom and exam from the dropdowns.</p>
                </div>
            ))}

            {/* Marks Entry Modal */}
            {editingStudent && marksData && (
                <MarksEntryModal
                    student={editingStudent}
                    examName={marksData.examName}
                    subjectName={marksData.subjectName}
                    onClose={() => setEditingStudent(null)}
                    onSave={handleSaveMarks}
                    isSaving={isUpdating}
                />
            )}
        </div>
    );
}