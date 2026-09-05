"use client";

import { useState, use } from "react";
import { ArrowLeft, Save, X, FileSpreadsheet, Eye } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import {
    useGetClassroomExamsQuery,
    useGetStudentMarksQuery,
    useSaveStudentMarksMutation,
    useGetTeacherProfileQuery,
    StudentMarkSummary,
} from "@/redux/api/teacherApi";

export default function FinalExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [selectedExamName, setSelectedExamName] = useState<string>("");
    const [showMarksModal, setShowMarksModal] = useState(false);
    const [selectedStudentData, setSelectedStudentData] = useState<{
        studentId: string;
        fullName: string;
        rollNumber: string | null;
        currentScore: number | null;
    } | null>(null);
    const [scoreInput, setScoreInput] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch exams for this classroom
    const { data: exams, isLoading: examsLoading } = useGetClassroomExamsQuery(classroomId);

    // Fetch student marks when exam is selected
    const { data: studentMarks, isLoading: marksLoading, refetch } = useGetStudentMarksQuery(
        { classroomId, examId: selectedExamId },
        { skip: !selectedExamId }
    );

    const [saveStudentMarks] = useSaveStudentMarksMutation();
    const { data: teacherProfile } = useGetTeacherProfileQuery();

    // Get unique exam types (Half Yearly, Final, etc.)
    const examTypes = exams ? [...new Map(exams.map(e => [e.name, e])).values()] : [];

    const selectedExamEnabled = selectedExamName.toUpperCase().includes('FINAL') ? teacherProfile?.finalMarksEntryEnabled : teacherProfile?.halfYearlyMarksEntryEnabled;

    const handleExamSelect = (examId: string, examName: string) => {
        setSelectedExamId(examId);
        setSelectedExamName(examName);
    };

    const openMarksModal = (student: StudentMarkSummary) => {
        if (!selectedExamEnabled) { toast.error('The principal has not enabled marks entry for this exam'); return; }
        if (!student) return;
        setSelectedStudentData({
            studentId: student.studentId,
            fullName: student.fullName,
            rollNumber: student.rollNumber,
            currentScore: student.subjects[0]?.score ?? null,
        });
        setScoreInput(student.subjects[0]?.score?.toString() ?? "");
        setShowMarksModal(true);
    };

    const handleSaveStudentMarks = async () => {
        if (!selectedStudentData || !selectedExamId) return;

        const score = parseFloat(scoreInput);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error("Please enter a valid score between 0 and 100");
            return;
        }

        setIsSaving(true);
        try {
            // Get the subject ID from the current exam
            const currentExam = exams?.find(ex => ex.id === selectedExamId);
            if (!currentExam) {
                toast.error("Exam not found");
                setIsSaving(false);
                return;
            }

            await saveStudentMarks({
                classroomId,
                examId: selectedExamId,
                marks: [{
                    studentId: selectedStudentData.studentId,
                    subjectId: currentExam.subjectId,
                    score,
                }],
            }).unwrap();

            toast.success("Marks saved successfully!");
            setShowMarksModal(false);
            refetch();
        } catch {
            toast.error("Failed to save marks");
        } finally {
            setIsSaving(false);
        }
    };

    const getGrade = (percentage: number) => {
        if (percentage >= 90) return { grade: "A+", color: "text-green-600 bg-green-50" };
        if (percentage >= 80) return { grade: "A", color: "text-green-600 bg-green-50" };
        if (percentage >= 70) return { grade: "B+", color: "text-blue-600 bg-blue-50" };
        if (percentage >= 60) return { grade: "B", color: "text-blue-600 bg-blue-50" };
        if (percentage >= 50) return { grade: "C", color: "text-yellow-600 bg-yellow-50" };
        if (percentage >= 40) return { grade: "D", color: "text-orange-600 bg-orange-50" };
        return { grade: "F", color: "text-red-600 bg-red-50" };
    };

    const averageMarks = studentMarks && studentMarks.length > 0
        ? (studentMarks.reduce((sum, s) => sum + s.percentage, 0) / studentMarks.length).toFixed(2)
        : "0.00";

    const highestMarks = studentMarks && studentMarks.length > 0
        ? Math.max(...studentMarks.map(s => s.percentage))
        : 0;

    const lowestMarks = studentMarks && studentMarks.length > 0
        ? Math.min(...studentMarks.map(s => s.percentage))
        : 0;

    // Get current exam's subject for display
    const currentExam = exams?.find(ex => ex.id === selectedExamId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${classroomId}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back to Classroom</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Exam Marks</h1>
                </div>

                {/* Exam Type Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-600">Select Exam:</label>
                    <select
                        value={selectedExamId}
                        onChange={(e) => {
                            const exam = exams?.find(ex => ex.id === e.target.value);
                            handleExamSelect(e.target.value, exam?.name ?? "");
                        }}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white min-w-50"
                    >
                        <option value="">-- Select Exam --</option>
                        {examTypes.map((exam) => (
                            <option key={exam.id} value={exam.id}>
                                {exam.name} - {exam.subject.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Statistics Cards */}
            {selectedExamId && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-800">{studentMarks?.length ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 font-medium">Average Marks</p>
                        <p className="text-2xl font-bold text-gray-800">{averageMarks}%</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
                        <p className="text-sm text-gray-500 font-medium">Highest Marks</p>
                        <p className="text-2xl font-bold text-gray-800">{highestMarks}%</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                        <p className="text-sm text-gray-500 font-medium">Lowest Marks</p>
                        <p className="text-2xl font-bold text-gray-800">{lowestMarks}%</p>
                    </div>
                </div>
            )}

            {/* Student Marks Table */}
            {selectedExamId ? (
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 bg-linear-to-r from-emerald-600 to-teal-800 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileSpreadsheet size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{selectedExamName} - Student Marks</h2>
                                <p className="text-sm text-emerald-100">
                                    Subject: {currentExam?.subject.name ?? 'N/A'} | Click View to enter marks
                                </p>
                            </div>
                        </div>
                    </div>

                    {marksLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">Loading marks...</p>
                        </div>
                    ) : studentMarks && studentMarks.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Roll No</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Obtained</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Percentage</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {studentMarks.map((student) => {
                                        const { grade, color } = getGrade(student.percentage);
                                        return (
                                            <tr key={student.studentId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{student.rollNumber ?? "—"}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`text-lg font-bold ${student.subjects[0]?.score !== null ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {student.subjects[0]?.score ?? "—"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm text-gray-600">{student.totalMax}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-sm font-semibold text-gray-900">{student.percentage}%</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                                                        {grade}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => openMarksModal(student)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                                        title="View/Edit Marks"
                                                    >
                                                        <Eye size={14} />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No marks found for this exam</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-xl p-12 text-center">
                    <FileSpreadsheet size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Select an Exam</h3>
                    <p className="text-gray-500">Choose an exam type above to view and manage student marks</p>
                </div>
            )}

            {/* Marks Entry Modal */}
            {showMarksModal && selectedStudentData && currentExam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Enter Marks</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedStudentData.fullName} | {selectedExamName}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMarksModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {currentExam.subject.name} Marks
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={scoreInput}
                                    onChange={(e) => setScoreInput(e.target.value)}
                                    placeholder="Enter marks (0-100)"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg"
                                />
                                <p className="text-xs text-gray-400 mt-2">
                                    Maximum marks: 100 | Current: {selectedStudentData.currentScore ?? "Not set"}
                                </p>
                            </div>

                            {/* Quick percentage display */}
                            {scoreInput && (
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                    parseFloat(scoreInput) >= 40
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {scoreInput}/100 ({(parseFloat(scoreInput) || 0).toFixed(1)}%)
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowMarksModal(false)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveStudentMarks}
                                disabled={isSaving || !scoreInput}
                                className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                <Save size={18} />
                                {isSaving ? "Saving..." : "Save Marks"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
