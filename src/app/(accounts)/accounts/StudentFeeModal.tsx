"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save, IndianRupee, Edit2, Check, Loader2, DollarSign, Search, User } from "lucide-react";
import {
    useGetStudentFeesQuery,
    useSearchStudentsFeesQuery,
    useUpdateOtherFeesMutation,
    useRecordStudentPaymentMutation,
} from "@/redux/api/accountsApi";

interface classroom {
    id: string;
    name: string;
    level: string;
    students: number;
    tuitionFees: number;
    lateFees: number;
    annualCharges: number;
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
    const router = useRouter();
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"PAID" | "UNPAID" | "PARTIAL" | "">("");

    const { data: studentFees = [], isLoading, refetch } = useGetStudentFeesQuery({
        classroomId: classroom.id,
        month,
        year,
    }, { skip: searchMode });

    const { data: searchResults = [], isLoading: isSearching, refetch: refetchSearch } = useSearchStudentsFeesQuery({
        classroomId: classroom.id,
        query: searchQuery || undefined,
        month,
        year,
        status: statusFilter || undefined,
    }, { skip: !searchMode });

    const displayFees = searchMode ? searchResults : studentFees;

    const [updateOtherFees, { isLoading: isUpdating }] = useUpdateOtherFeesMutation();
    const [recordPayment] = useRecordStudentPaymentMutation();

    const [editingStudent, setEditingStudent] = useState<string | null>(null);
    const [editedOtherFees, setEditedOtherFees] = useState<number>(0);
    const [editedRemarks, setEditedRemarks] = useState<string>("");
    const [editedDiscount, setEditedDiscount] = useState<number>(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<{ studentId: string; fullName: string; totalAmount: number } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "CHEQUE" | "NEFT" | "ONLINE">("CASH");
    const [recording, setRecording] = useState(false);

    const handleEditClick = (student: typeof studentFees[0]) => {
        setEditingStudent(student.studentId);
        setEditedOtherFees(student.otherFees);
        setEditedRemarks(student.otherFeesRemarks ?? "");
        setEditedDiscount(student.discount);
    };

    const handleSaveClick = async (studentId: string) => {
        try {
            await updateOtherFees({
                studentId,
                classroomId: classroom.id,
                month,
                year,
                otherFees: editedOtherFees,
                otherFeesRemarks: editedRemarks || undefined,
                discount: editedDiscount,
            }).unwrap();
            setEditingStudent(null);
            if (searchMode) refetchSearch();
            else refetch();
        } catch {
            // silent fail
        }
    };

    const handleCancelEdit = () => {
        setEditingStudent(null);
        setEditedOtherFees(0);
        setEditedRemarks("");
        setEditedDiscount(0);
    };

    const handleRecordPayment = async () => {
        if (!paymentTarget || paymentAmount <= 0) return;
        setRecording(true);
        try {
            await recordPayment({
                studentId: paymentTarget.studentId,
                classroomId: classroom.id,
                month,
                year,
                paidAmount: paymentAmount,
                paymentMode,
            }).unwrap();
            setShowPaymentModal(false);
            setPaymentTarget(null);
            if (searchMode) refetchSearch();
            else refetch();
        } catch {
            setRecording(false);
        }
    };

    const totalCollectible = displayFees
        .filter((s: any) => !s.isPaid)
        .reduce((sum: number, s: any) => sum + s.totalAmount, 0);

    const totalPaid = displayFees
        .filter((s: any) => s.isPaid)
        .reduce((sum: number, s: any) => sum + s.paidAmount, 0);

    const paidCount = displayFees.filter((s: any) => s.isPaid).length;
    const unpaidCount = displayFees.filter((s: any) => !s.isPaid).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{classroom.name} — Fee Management</h2>
                        <p className="text-amber-100 text-sm mt-1">
                            {classroom.level} &bull; {studentFees.length} Students
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

                {/* Search / Filter Bar */}
                <div className="px-6 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap bg-gray-50">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or roll no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setSearchMode(true); }}
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => { setSearchMode(true); }}
                            className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                        >
                            Search
                        </button>
                        {(searchMode || searchQuery || statusFilter) && (
                            <button
                                onClick={() => { setSearchMode(false); setSearchQuery(""); setStatusFilter(""); }}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        {(["", "PAID", "UNPAID", "PARTIAL"] as const).map(s => (
                            <button
                                key={s || "ALL"}
                                onClick={() => { setStatusFilter(s); if (s || searchQuery) setSearchMode(true); else setSearchMode(false); }}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${statusFilter === s ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}
                            >
                                {s || "All"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between text-sm">
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Tuition:</span>
                            <span className="font-bold text-amber-300">₹{classroom.tuitionFees}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Annual:</span>
                            <span className="font-bold text-purple-300">₹{classroom.annualCharges}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Late:</span>
                            <span className="font-bold text-red-300">₹{classroom.lateFees}</span>
                        </div>
                    </div>
                    <div className="flex gap-6">
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
                    {isLoading || isSearching ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    ) : displayFees.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchMode ? "No students match your search." : "No student fee records found for this month."}
                        </div>
                    ) : (
                        <table className="w-full min-w-[1600px]">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-200 text-xs">
                                    <th className="text-left p-2 font-semibold text-gray-600">Roll No.</th>
                                    <th className="text-left p-2 font-semibold text-gray-600">Student Name</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Tuition</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Transport</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Annual</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Other Fees</th>
                                    <th className="text-left p-2 font-semibold text-gray-600">Remarks</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Discount</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Penalty</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Prev. Due</th>
                                    <th className="text-right p-2 font-semibold text-gray-600">Total Amt</th>
                                    <th className="text-center p-2 font-semibold text-gray-600">Status</th>
                                    <th className="text-center p-2 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayFees.map((student: any) => {
                                    const isEditing = editingStudent === student.studentId;

                                    return (
                                        <tr
                                            key={student.studentId}
                                            className={`hover:bg-gray-50 transition-colors ${student.isPaid ? 'opacity-70' : ''}`}
                                        >
                                            <td className="p-2 text-sm font-medium text-gray-600">{student.rollNumber}</td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => router.push(`/accounts/student/${student.studentId}`)}
                                                    className="text-sm font-bold text-amber-600 hover:text-amber-800 hover:underline text-left"
                                                >
                                                    {student.fullName}
                                                </button>
                                            </td>

                                            {/* Tuition */}
                                            <td className="p-2 text-right text-sm text-gray-700">₹{student.tuitionFees}</td>

                                            {/* Transport */}
                                            <td className="p-2 text-right text-sm text-blue-600">₹{student.transportFees > 0 ? student.transportFees : '—'}</td>

                                            {/* Annual */}
                                            <td className="p-2 text-right text-sm text-purple-600">₹{student.annualCharges > 0 ? student.annualCharges : '—'}</td>

                                            {/* Other Fees */}
                                            <td className="p-2 text-right min-w-[80px]">
                                                {isEditing ? (
                                                    <div className="inline-flex items-center">
                                                        <IndianRupee size={11} className="text-gray-400 mr-0.5" />
                                                        <input
                                                            type="number"
                                                            value={editedOtherFees}
                                                            onChange={(e) => setEditedOtherFees(Number(e.target.value))}
                                                            className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`text-xs font-semibold ${student.otherFees > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        {student.otherFees > 0 ? `₹${student.otherFees}` : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Remarks */}
                                            <td className="p-2 min-w-[100px]">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedRemarks}
                                                        onChange={(e) => setEditedRemarks(e.target.value)}
                                                        placeholder="e.g., Lab fee"
                                                        className="w-full px-2 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                                                        {student.otherFeesRemarks || '—'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Discount */}
                                            <td className="p-2 text-right min-w-[70px]">
                                                {isEditing ? (
                                                    <div className="inline-flex items-center">
                                                        <IndianRupee size={11} className="text-gray-400 mr-0.5" />
                                                        <input
                                                            type="number"
                                                            value={editedDiscount}
                                                            onChange={(e) => setEditedDiscount(Number(e.target.value))}
                                                            className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`text-xs font-semibold ${student.discount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {student.discount > 0 ? `₹${student.discount}` : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Penalty */}
                                            <td className="p-2 text-right">
                                                <span className={`text-xs font-semibold ${student.penalty > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {student.penalty > 0 ? `₹${student.penalty}` : '—'}
                                                </span>
                                            </td>

                                            {/* Previous Due */}
                                            <td className="p-2 text-right">
                                                <span className={`text-xs font-semibold ${student.previousAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {student.previousAmount > 0 ? `₹${student.previousAmount}` : '—'}
                                                </span>
                                            </td>

                                            {/* Total */}
                                            <td className="p-2 text-right">
                                                <span className={`text-sm font-bold ${student.isPaid ? 'text-green-600' : student.totalAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {student.isPaid ? '₹0' : student.totalAmount > 0 ? `₹${student.totalAmount}` : '₹0'}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="p-2 text-center">
                                                {student.isPaid ? (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Paid</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Unpaid</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="p-2 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleSaveClick(student.studentId)}
                                                            disabled={isUpdating}
                                                            className="p-1 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                                                        >
                                                            <Check size={13} />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                                        >
                                                            <X size={13} />
                                                        </button>
                                                    </div>
                                                ) : student.isPaid ? (
                                                    <span className="text-xs text-gray-400">—</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(student)}
                                                            className="p-1 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded transition-colors"
                                                            title="Edit Fees"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setPaymentTarget({ studentId: student.studentId, fullName: student.fullName, totalAmount: student.totalAmount });
                                                                setPaymentAmount(student.totalAmount);
                                                                setPaymentMode("CASH");
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="p-1 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                                                            title="Record Payment"
                                                        >
                                                            <DollarSign size={13} />
                                                        </button>
                                                    </div>
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
                        Penalty of ₹50/₹100 auto-applied after 10th for unpaid fees. Total = Tuition + Transport + Annual + Other + Penalty − Discount + Previous Due.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && paymentTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full">
                        <div className="bg-green-600 text-white p-5 flex items-center justify-between rounded-t-xl">
                            <div>
                                <h3 className="text-xl font-bold">Record Payment</h3>
                                <p className="text-green-100 text-sm mt-0.5">{paymentTarget.fullName}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-green-700 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800 font-bold"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Outstanding: ₹{paymentTarget.totalAmount}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-800"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="NEFT">NEFT</option>
                                    <option value="ONLINE">Online</option>
                                </select>
                            </div>
                        </div>
                        <div className="bg-gray-50 border-t border-gray-200 p-5 flex items-center justify-end gap-3 rounded-b-xl">
                            <button onClick={() => setShowPaymentModal(false)}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={recording || paymentAmount <= 0}
                                className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                            >
                                {recording ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                                {recording ? 'Recording...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}