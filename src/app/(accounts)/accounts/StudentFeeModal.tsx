"use client";

import { useState } from "react";
import { X, Save, IndianRupee, Edit2, Check, Loader2 } from "lucide-react";
import { useGetStudentFeesQuery, useUpdateOtherFeesMutation } from "@/redux/api/accountsApi";

interface classroom {
    id: string;
    name: string;
    level: string;
    students: number;
    standardFees: number;
    lateFees: number;
}

interface StudentFeeModalProps {
    classroom: classroom;
    onClose: () => void;
}

const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" },
];

export default function StudentFeeModal({ classroom, onClose }: StudentFeeModalProps) {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    const { data: studentFees = [], isLoading, refetch } = useGetStudentFeesQuery({
        classroomId: classroom.id,
        month,
        year,
    });

    const [updateOtherFees, { isLoading: isUpdating }] = useUpdateOtherFeesMutation();

    const [editingStudent, setEditingStudent] = useState<string | null>(null);
    const [editedOtherFees, setEditedOtherFees] = useState<number>(0);

    const handleEditClick = (studentId: string, currentOtherFees: number) => {
        setEditingStudent(studentId);
        setEditedOtherFees(currentOtherFees);
    };

    const handleSaveClick = async (studentId: string) => {
        try {
            await updateOtherFees({
                studentId,
                classroomId: classroom.id,
                month,
                year,
                otherFees: editedOtherFees,
            }).unwrap();
            setEditingStudent(null);
            refetch();
        } catch {
            // silent fail
        }
    };

    const handleCancelEdit = () => {
        setEditingStudent(null);
        setEditedOtherFees(0);
    };

    const totalCollectible = studentFees
        .filter(s => !s.isPaid)
        .reduce((sum, s) => sum + s.totalAmount, 0);

    const totalPaid = studentFees
        .filter(s => s.isPaid)
        .reduce((sum, s) => sum + s.paidAmount, 0);

    const paidCount = studentFees.filter(s => s.isPaid).length;
    const unpaidCount = studentFees.filter(s => !s.isPaid).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-amber-500 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{classroom.name} — Fee Management</h2>
                        <p className="text-amber-100 text-sm mt-1">
                            {classroom.level} &bull; {studentFees.length} Students &bull;
                            Standard Fees: ₹{classroom.standardFees} &bull; Late Fees: ₹{classroom.lateFees}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="bg-amber-600 text-white text-sm rounded px-2 py-1 border border-amber-400"
                        >
                            {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-amber-600 text-white text-sm rounded px-2 py-1 border border-amber-400"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button onClick={onClose} className="p-2 hover:bg-amber-600 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between text-sm">
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">To Collect:</span>
                            <span className="font-bold text-red-400">₹{totalCollectible.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Collected:</span>
                            <span className="font-bold text-green-400">₹{totalPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Paid:</span>
                            <span className="font-bold text-green-400">{paidCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Unpaid:</span>
                            <span className="font-bold text-red-400">{unpaidCount}</span>
                        </div>
                    </div>
                </div>

                {/* Student List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    ) : studentFees.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No student fee records found for this month.</div>
                    ) : (
                        <table className="w-full min-w-225">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-200 text-xs">
                                    <th className="text-left p-3 font-semibold text-gray-600">Roll No.</th>
                                    <th className="text-left p-3 font-semibold text-gray-600">Student Name</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Standard</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Other Fees</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Penalty</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Previous Due</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Total Amt</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {studentFees.map((student) => {
                                    const isEditing = editingStudent === student.studentId;

                                    return (
                                        <tr
                                            key={student.studentId}
                                            className={`hover:bg-gray-50 transition-colors ${student.isPaid ? 'opacity-75' : ''}`}
                                        >
                                            <td className="p-3 text-sm font-medium text-gray-600">{student.rollNumber}</td>
                                            <td className="p-3 text-sm font-bold text-gray-900">{student.fullName}</td>
                                            <td className="p-3 text-sm text-right font-semibold text-gray-700">₹{student.standardFees}</td>
                                            <td className="p-3 text-right">
                                                {isEditing ? (
                                                    <div className="inline-flex items-center">
                                                        <IndianRupee size={12} className="text-gray-400 mr-1" />
                                                        <input
                                                            type="number"
                                                            value={editedOtherFees}
                                                            onChange={(e) => setEditedOtherFees(Number(e.target.value))}
                                                            className="w-20 px-2 py-1 border border-amber-300 rounded text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`text-sm font-semibold ${student.otherFees > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        ₹{student.otherFees > 0 ? student.otherFees : '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-sm font-semibold ${student.penalty > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {student.penalty > 0 ? `₹${student.penalty}` : '—'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-sm font-semibold ${student.previousAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {student.previousAmount > 0 ? `₹${student.previousAmount}` : '—'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className={`text-sm font-bold ${student.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                                                    {student.isPaid ? '₹0' : student.totalAmount > 0 ? `₹${student.totalAmount}` : '₹0'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {student.isPaid ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Paid</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Unpaid</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleSaveClick(student.studentId)}
                                                            disabled={isUpdating}
                                                            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditClick(student.studentId, student.otherFees)}
                                                        className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded transition-colors"
                                                        title="Edit Other Fees"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        Penalty of ₹50/₹100 is auto-applied after the 10th of the month for unpaid fees.
                    </p>
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
