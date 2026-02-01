"use client";

import { useState, use } from "react";
import { ArrowLeft, Save, Edit2, Check, X, FileSpreadsheet, Award } from "lucide-react";
import Link from "next/link";

export default function FinalExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // Mock classroom data
    const classroomDetails = {
        name: id === "1" ? "Class 10 - Section A" : `Classroom ${id}`,
        subject: id === "1" ? "Mathematics" : "General Subject",
    };

    // Mock student data with marks
    const [students, setStudents] = useState([
        { id: 1, rollNo: "001", name: "Aarav Sharma", marks: 85, totalMarks: 100 },
        { id: 2, rollNo: "002", name: "Diya Patel", marks: 92, totalMarks: 100 },
        { id: 3, rollNo: "003", name: "Arjun Kumar", marks: 78, totalMarks: 100 },
        { id: 4, rollNo: "004", name: "Ananya Singh", marks: 88, totalMarks: 100 },
        { id: 5, rollNo: "005", name: "Vihaan Gupta", marks: 76, totalMarks: 100 },
        { id: 6, rollNo: "006", name: "Saanvi Reddy", marks: 94, totalMarks: 100 },
        { id: 7, rollNo: "007", name: "Reyansh Verma", marks: 82, totalMarks: 100 },
        { id: 8, rollNo: "008", name: "Isha Mehta", marks: 90, totalMarks: 100 },
        { id: 9, rollNo: "009", name: "Aditya Joshi", marks: 73, totalMarks: 100 },
        { id: 10, rollNo: "010", name: "Myra Kapoor", marks: 87, totalMarks: 100 },
    ]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    const handleEdit = (student: typeof students[0]) => {
        setEditingId(student.id);
        setEditValue(student.marks.toString());
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue("");
    };

    const handleSave = (studentId: number) => {
        const marks = parseInt(editValue);
        if (isNaN(marks) || marks < 0 || marks > 100) {
            alert("Please enter valid marks between 0 and 100");
            return;
        }

        setStudents(students.map(s =>
            s.id === studentId ? { ...s, marks } : s
        ));
        setEditingId(null);
        setEditValue("");
    };

    const handleSaveAll = () => {
        setIsSaving(true);
        // TODO: Send data to backend API
        setTimeout(() => {
            setIsSaving(false);
            alert("Marks saved successfully!");
        }, 1000);
    };

    const getGrade = (marks: number) => {
        if (marks >= 90) return { grade: "A+", color: "text-green-600 bg-green-50" };
        if (marks >= 80) return { grade: "A", color: "text-green-600 bg-green-50" };
        if (marks >= 70) return { grade: "B", color: "text-blue-600 bg-blue-50" };
        if (marks >= 60) return { grade: "C", color: "text-yellow-600 bg-yellow-50" };
        if (marks >= 50) return { grade: "D", color: "text-orange-600 bg-orange-50" };
        return { grade: "F", color: "text-red-600 bg-red-50" };
    };

    const averageMarks = (students.reduce((sum, s) => sum + s.marks, 0) / students.length).toFixed(2);
    const highestMarks = Math.max(...students.map(s => s.marks));
    const lowestMarks = Math.min(...students.map(s => s.marks));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${id}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back to Classroom</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Final Exam Marks</h1>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-gray-800">{classroomDetails.name}</span>
                    <span className="text-sm text-emerald-600 font-medium">{classroomDetails.subject}</span>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500 font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-500 font-medium">Average Marks</p>
                    <p className="text-2xl font-bold text-gray-800">{averageMarks}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
                    <p className="text-sm text-gray-500 font-medium">Highest Marks</p>
                    <p className="text-2xl font-bold text-gray-800">{highestMarks}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                    <p className="text-sm text-gray-500 font-medium">Lowest Marks</p>
                    <p className="text-2xl font-bold text-gray-800">{lowestMarks}</p>
                </div>
            </div>

            {/* Student Marks Table */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Student Marks Entry</h2>
                            <p className="text-sm text-emerald-100">Click edit to update individual marks</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSaving ? "Saving..." : "Save All Marks"}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Roll No</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Marks Obtained</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total Marks</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Percentage</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Grade</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {students.map((student) => {
                                const percentage = ((student.marks / student.totalMarks) * 100).toFixed(1);
                                const { grade, color } = getGrade(student.marks);
                                const isEditing = editingId === student.id;

                                return (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{student.rollNo}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    min="0"
                                                    max="100"
                                                    className="w-20 px-3 py-2 border border-emerald-300 rounded-lg text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-gray-900">{student.marks}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm text-gray-600">{student.totalMarks}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                                                {grade}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSave(student.id)}
                                                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(student)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                                    title="Edit Marks"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
