"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Printer, CheckCircle } from "lucide-react";

export default function AdmitCardPage() {
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedExamType, setSelectedExamType] = useState("");
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    const classes = [
        "Nursery", "Junior KG", "Upper KG",
        "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
        "Class 6", "Class 7", "Class 8",
        "Class 9", "Class 10",
        "Class 11", "Class 12"
    ];

    const sections = ["A", "B", "C"];
    const examTypes = ["Half-Yearly Examination", "Final Examination", "Pre-Board Examination", "Board Examination"];

    // Mock student data
    const students = [
        { id: 1, name: "Aarav Sharma", rollNo: "001" },
        { id: 2, name: "Diya Patel", rollNo: "002" },
        { id: 3, name: "Arjun Kumar", rollNo: "003" },
        { id: 4, name: "Ananya Singh", rollNo: "004" },
        { id: 5, name: "Vihaan Reddy", rollNo: "005" },
        { id: 6, name: "Isha Gupta", rollNo: "006" },
        { id: 7, name: "Aditya Verma", rollNo: "007" },
        { id: 8, name: "Saanvi Iyer", rollNo: "008" },
    ];

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
        setSelectAll(!selectAll);
    };

    const handleStudentToggle = (studentId: number) => {
        if (selectedStudents.includes(studentId)) {
            setSelectedStudents(selectedStudents.filter(id => id !== studentId));
        } else {
            setSelectedStudents([...selectedStudents, studentId]);
        }
    };

    const canGenerate = selectedClass && selectedSection && selectedExamType && selectedStudents.length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/principal">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Create Admit Card</h1>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-purple-600">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                        <FileText size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Admit Card Generator</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Selection Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Class Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Class <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-purple-300 shadow-sm"
                            >
                                <option value="">Choose class...</option>
                                {classes.map((cls, index) => (
                                    <option key={index} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>

                        {/* Section Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Section <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-purple-300 shadow-sm"
                            >
                                <option value="">Choose section...</option>
                                {sections.map((section, index) => (
                                    <option key={index} value={section}>Section {section}</option>
                                ))}
                            </select>
                        </div>

                        {/* Exam Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Examination Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedExamType}
                                onChange={(e) => setSelectedExamType(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-purple-300 shadow-sm"
                            >
                                <option value="">Choose exam type...</option>
                                {examTypes.map((exam, index) => (
                                    <option key={index} value={exam}>{exam}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Student Selection */}
                    {selectedClass && selectedSection && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Select Students</h3>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                >
                                    {selectAll ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {students.map((student) => (
                                    <label
                                        key={student.id}
                                        className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => handleStudentToggle(student.id)}
                                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{student.name}</p>
                                            <p className="text-xs text-gray-500">Roll No: {student.rollNo}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {selectedStudents.length > 0 && (
                                <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="font-medium">{selectedStudents.length} student(s) selected</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Section */}
                    {canGenerate && (
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admit Card Preview</h3>
                            <div className="bg-white border-2 border-purple-600 rounded-lg p-6 max-w-2xl mx-auto">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-purple-600">Mount Litera Zee School</h2>
                                    <p className="text-sm text-gray-600 mt-1">Admit Card - {selectedExamType}</p>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="font-semibold text-gray-700">Class:</span>
                                        <span className="text-gray-600">{selectedClass} - Section {selectedSection}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="font-semibold text-gray-700">Student Name:</span>
                                        <span className="text-gray-600">{students.find(s => s.id === selectedStudents[0])?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="font-semibold text-gray-700">Roll Number:</span>
                                        <span className="text-gray-600">{students.find(s => s.id === selectedStudents[0])?.rollNo}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-gray-700">Examination:</span>
                                        <span className="text-gray-600">{selectedExamType}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                                    <p>This is a computer-generated admit card and does not require a signature.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            disabled={!canGenerate}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${canGenerate
                                    ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            <FileText size={18} />
                            <span>Generate Admit Cards</span>
                        </button>

                        <button
                            disabled={!canGenerate}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${canGenerate
                                    ? "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50"
                                    : "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                                }`}
                        >
                            <Download size={18} />
                            <span>Download PDF</span>
                        </button>

                        <button
                            disabled={!canGenerate}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${canGenerate
                                    ? "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50"
                                    : "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                                }`}
                        >
                            <Printer size={18} />
                            <span>Print</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
