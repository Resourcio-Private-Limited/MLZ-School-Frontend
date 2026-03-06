"use client";

import { useState } from "react";
import { X, Save, IndianRupee, Edit2, Check } from "lucide-react";

interface Student {
    id: number;
    name: string;
    rollNumber: string;
    standardFees: number;
    otherFees: number;
}

interface Classroom {
    id: number;
    name: string;
    level: string;
    students: number;
    standardFees: number;
    lateFees: number;
}

interface StudentFeeModalProps {
    classroom: Classroom;
    onClose: () => void;
}

export default function StudentFeeModal({ classroom, onClose }: StudentFeeModalProps) {
    // Generate mock student data
    const generateStudents = (): Student[] => {
        const students: Student[] = [];
        for (let i = 1; i <= classroom.students; i++) {
            students.push({
                id: i,
                name: `Student ${i}`,
                rollNumber: `${classroom.id}-${String(i).padStart(3, '0')}`,
                standardFees: classroom.standardFees,
                otherFees: Math.random() > 0.7 ? Math.floor(Math.random() * 1000) + 200 : 0, // Some students have other fees
            });
        }
        return students;
    };

    const [students, setStudents] = useState<Student[]>(generateStudents());
    const [editingStudent, setEditingStudent] = useState<number | null>(null);
    const [editedOtherFees, setEditedOtherFees] = useState<number>(0);

    const handleEditClick = (student: Student) => {
        setEditingStudent(student.id);
        setEditedOtherFees(student.otherFees);
    };

    const handleSaveClick = (studentId: number) => {
        setStudents(students.map(s =>
            s.id === studentId ? { ...s, otherFees: editedOtherFees } : s
        ));
        setEditingStudent(null);
    };

    const handleCancelEdit = () => {
        setEditingStudent(null);
        setEditedOtherFees(0);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-amber-500 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{classroom.name}</h2>
                        <p className="text-amber-100 text-sm mt-1">
                            {classroom.level} • {classroom.students} Students
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-amber-600 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Fee Summary */}
                <div className="bg-gray-50 border-b border-gray-100 p-4">
                    <div className="flex gap-6 text-sm">
                        <div>
                            <span className="text-gray-600">Standard Fees: </span>
                            <span className="font-bold text-amber-600">₹{classroom.standardFees}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Late Fees: </span>
                            <span className="font-bold text-red-600">₹{classroom.lateFees}</span>
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr className="border-b border-gray-200">
                                <th className="text-left p-4 font-semibold text-gray-700">Roll No.</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Student Name</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Standard Fees</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Other Fees</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Total Fees</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map((student) => {
                                const isEditing = editingStudent === student.id;
                                const totalFees = student.standardFees + student.otherFees;

                                return (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {student.rollNumber}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900">
                                            {student.name}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-gray-700">
                                            ₹{student.standardFees}
                                        </td>
                                        <td className="p-4">
                                            {isEditing ? (
                                                <div className="relative w-32">
                                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                        <IndianRupee size={14} className="text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={editedOtherFees}
                                                        onChange={(e) => setEditedOtherFees(Number(e.target.value))}
                                                        className="w-full pl-7 pr-2 py-1 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-sm"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <span className={`text-sm font-semibold ${student.otherFees > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                    {student.otherFees > 0 ? `₹${student.otherFees}` : 'Nil'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-orange-700">
                                            ₹{isEditing ? student.standardFees + editedOtherFees : totalFees}
                                        </td>
                                        <td className="p-4">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleSaveClick(student.id)}
                                                        className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEditClick(student)}
                                                    className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded transition-colors"
                                                    title="Edit Other Fees"
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

                {/* Modal Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">Note:</span> Other fees include lab, library, activity charges, etc.
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
