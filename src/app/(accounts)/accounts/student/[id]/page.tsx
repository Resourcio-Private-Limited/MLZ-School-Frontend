"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, IndianRupee, Edit2, Check, X, Loader2, Search, DollarSign, Users, ShieldCheck, ShieldX, Loader } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    useGetStudentFeesQuery,
    useSearchStudentsFeesQuery,
    useUpdateOtherFeesMutation,
    useRecordStudentPaymentMutation,
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
} from "@/redux/api/accountsApi";

const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" },
];

export default function StudentFeePage() {
    const params = useParams();
    const classroomId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"PAID" | "UNPAID" | "PARTIAL" | "">("");

    const { data: studentFees = [], isLoading, refetch } = useGetStudentFeesQuery({
        classroomId,
        month,
        year,
    }, { skip: searchMode || !classroomId });

    const { data: searchResults = [], isLoading: isSearching, refetch: refetchSearch } = useSearchStudentsFeesQuery({
        classroomId,
        query: searchQuery || undefined,
        month,
        year,
        status: statusFilter || undefined,
    }, { skip: !searchMode });

    // Get student details for eligibility toggle
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { data: selectedStudentDetail, refetch: refetchStudentDetail } = useGetStudentDetailQuery(selectedStudentId!, { skip: !selectedStudentId });
    const [updateEligibility, { isLoading: isUpdatingEligibility }] = useUpdateExamEligibilityMutation();

    const displayFees = searchMode ? searchResults : studentFees;

    const firstStudent = displayFees[0] as any;
    const classroomName = firstStudent?.classroomName ?? "Classroom";
    const classroomLevel = firstStudent?.classroomLevel ?? "";

    const [updateOtherFees, { isLoading: isUpdating }] = useUpdateOtherFeesMutation();
    const [recordPayment] = useRecordStudentPaymentMutation();

    const handleToggleEligibility = async () => {
        if (!selectedStudentDetail) return;
        const newEligibility = !selectedStudentDetail.examEligibility;
        try {
            await updateEligibility({
                studentId: selectedStudentId!,
                examEligibility: newEligibility
            }).unwrap();
            toast.success(`Exam eligibility ${newEligibility ? 'enabled' : 'disabled'} successfully!`);
            refetchStudentDetail();
            refetch();
            // Also refetch search results if in search mode
            if (searchMode) {
                refetchSearch();
            }
        } catch {
            toast.error("Failed to update exam eligibility");
        }
    };

    const handleOpenEligibility = (studentId: string) => {
        setSelectedStudentId(studentId);
    };

    const handleCloseEligibility = () => {
        setSelectedStudentId(null);
    };

    const [editingStudent, setEditingStudent] = useState<string | null>(null);
    const [editedOtherFees, setEditedOtherFees] = useState<number>(0);
    const [editedRemarks, setEditedRemarks] = useState<string>("");
    const [editedDiscount, setEditedDiscount] = useState<number>(0);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentTarget, setPaymentTarget] = useState<{ studentId: string; fullName: string; totalAmount: number } | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "CHEQUE" | "NEFT" | "ONLINE">("CASH");
    const [recording, setRecording] = useState(false);

    const handleEditClick = (student: any) => {
        setEditingStudent(student.studentId);
        setEditedOtherFees(student.otherFees);
        setEditedRemarks(student.otherFeesRemarks ?? "");
        setEditedDiscount(student.discount);
    };

    const handleSaveClick = async (studentId: string) => {
        try {
            await updateOtherFees({
                studentId,
                classroomId,
                month,
                year,
                otherFees: editedOtherFees,
                otherFeesRemarks: editedRemarks || undefined,
                discount: editedDiscount,
            }).unwrap();
            toast.success("Fees updated successfully!");
            setEditingStudent(null);
            if (searchMode) refetchSearch();
            else refetch();
        } catch {
            toast.error("Failed to update fees.");
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
                classroomId,
                month,
                year,
                paidAmount: paymentAmount,
                paymentMode,
            }).unwrap();
            toast.success("Payment recorded successfully!");
            setShowPaymentModal(false);
            setPaymentTarget(null);
            setPaymentAmount(0);
            if (searchMode) refetchSearch();
            else refetch();
        } catch {
            toast.error("Failed to record payment.");
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/accounts">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{classroomName} — Fee Management</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {classroomLevel && <span>{classroomLevel} • </span>}
                            {studentFees.length} Students
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="bg-gray-50 text-gray-800 text-sm rounded px-2 py-1 border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-gray-50 text-gray-800 text-sm rounded px-2 py-1 border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Search / Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or roll no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setSearchMode(true); }}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-900 placeholder-gray-500"
                        />
                    </div>
                    <button
                        onClick={() => { setSearchMode(true); }}
                        className="px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                        Search
                    </button>
                    {(searchMode || searchQuery || statusFilter) && (
                        <button
                            onClick={() => { setSearchMode(false); setSearchQuery(""); setStatusFilter(""); }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Status:</span>
                    {(["", "PAID", "UNPAID", "PARTIAL"] as const).map(s => (
                        <button
                            key={s || "ALL"}
                            onClick={() => { setStatusFilter(s); if (s || searchQuery) setSearchMode(true); else setSearchMode(false); }}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors font-medium ${statusFilter === s ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}
                        >
                            {s || "All"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">To Collect</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">₹{totalCollectible.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <IndianRupee size={24} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Collected</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Paid Students</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Check size={24} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Unpaid Students</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{unpaidCount}</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <X size={24} />
                    </div>
                </div>
            </div>

            {/* Fee Structure Info */}
            <div className="bg-gray-800 text-white p-4 rounded-xl flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Tuition:</span>
                        <span className="font-bold text-amber-300">₹{firstStudent?.tuitionFees ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Annual:</span>
                        <span className="font-bold text-purple-300">₹{firstStudent?.annualCharges ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">Late:</span>
                        <span className="font-bold text-red-300">₹{firstStudent?.lateFees ?? '—'}</span>
                    </div>
                </div>
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    {isLoading || isSearching ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    ) : displayFees.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">
                                {searchMode ? "No students match your search." : "No student fee records found for this month."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[1600px]">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-200 text-xs">
                                    <th className="text-left p-3 font-semibold text-gray-600">Roll No.</th>
                                    <th className="text-left p-3 font-semibold text-gray-600">Student Name</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Exam Eligibility</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Tuition</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Transport</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Annual</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Other Fees</th>
                                    <th className="text-left p-3 font-semibold text-gray-600">Remarks</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Discount</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Penalty</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Prev. Due</th>
                                    <th className="text-right p-3 font-semibold text-gray-600">Total Amt</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-center p-3 font-semibold text-gray-600">Actions</th>
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
                                            <td className="p-3 text-sm font-medium text-gray-600">{student.rollNumber}</td>
                                            <td className="p-3">
                                                <span className="text-sm font-bold text-gray-800">
                                                    {student.fullName}
                                                </span>
                                            </td>

                                            {/* Exam Eligibility */}
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleOpenEligibility(student.studentId)}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-colors ${
                                                        student.examEligibility
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                                    title="Click to toggle exam eligibility"
                                                >
                                                    {student.examEligibility ? (
                                                        <>
                                                            <ShieldCheck size={12} />
                                                            <span>Eligible</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldX size={12} />
                                                            <span>Not Eligible</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>

                                            <td className="p-3 text-right text-sm text-gray-700">₹{student.tuitionFees}</td>
                                            <td className="p-3 text-right text-sm text-blue-600">₹{student.transportFees > 0 ? student.transportFees : '—'}</td>
                                            <td className="p-3 text-right text-sm text-purple-600">₹{student.annualCharges > 0 ? student.annualCharges : '—'}</td>

                                            <td className="p-3 text-right min-w-[80px]">
                                                {isEditing ? (
                                                    <div className="inline-flex items-center">
                                                        <IndianRupee size={11} className="text-gray-400 mr-0.5" />
                                                        <input
                                                            type="number"
                                                            value={editedOtherFees}
                                                            onChange={(e) => setEditedOtherFees(Number(e.target.value))}
                                                            className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-gray-900"
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`text-xs font-semibold ${student.otherFees > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        {student.otherFees > 0 ? `₹${student.otherFees}` : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3 min-w-[100px]">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedRemarks}
                                                        onChange={(e) => setEditedRemarks(e.target.value)}
                                                        placeholder="e.g., Lab fee"
                                                        className="w-full px-2 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-gray-900 placeholder-gray-500"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">
                                                        {student.otherFeesRemarks || '—'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3 text-right min-w-[70px]">
                                                {isEditing ? (
                                                    <div className="inline-flex items-center justify-end">
                                                        <IndianRupee size={11} className="text-gray-400 mr-0.5" />
                                                        <input
                                                            type="number"
                                                            value={editedDiscount}
                                                            onChange={(e) => setEditedDiscount(Number(e.target.value))}
                                                            className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-gray-900"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className={`text-xs font-semibold ${student.discount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {student.discount > 0 ? `₹${student.discount}` : '—'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-3 text-right">
                                                <span className={`text-xs font-semibold ${student.penalty > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                    {student.penalty > 0 ? `₹${student.penalty}` : '—'}
                                                </span>
                                            </td>

                                            <td className="p-3 text-right">
                                                <span className={`text-xs font-semibold ${student.previousAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                    {student.previousAmount > 0 ? `₹${student.previousAmount}` : '—'}
                                                </span>
                                            </td>

                                            <td className="p-3 text-right">
                                                <span className={`text-sm font-bold ${student.isPaid ? 'text-green-600' : student.totalAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {student.isPaid ? '₹0' : student.totalAmount > 0 ? `₹${student.totalAmount}` : '₹0'}
                                                </span>
                                            </td>

                                            <td className="p-3 text-center">
                                                {student.isPaid ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Paid</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Unpaid</span>
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
                                                ) : student.isPaid ? (
                                                    <span className="text-xs text-gray-400">—</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(student)}
                                                            className="p-1.5 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded transition-colors"
                                                            title="Edit Fees"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setPaymentTarget({ studentId: student.studentId, fullName: student.fullName, totalAmount: student.totalAmount });
                                                                setPaymentAmount(student.totalAmount);
                                                                setPaymentMode("CASH");
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="p-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                                                            title="Record Payment"
                                                        >
                                                            <DollarSign size={14} />
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

                <div className="bg-gray-50 border-t border-gray-200 p-4">
                    <p className="text-xs text-gray-500">
                        Penalty of ₹50/₹100 auto-applied after 10th for unpaid fees. Total = Tuition + Transport + Annual + Other + Penalty − Discount + Previous Due.
                    </p>
                </div>
            </div>

            {/* Exam Eligibility Modal */}
            {selectedStudentId && selectedStudentDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className={`p-5 flex items-center justify-between rounded-t-xl ${selectedStudentDetail.examEligibility ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                            <div className="flex items-center gap-3">
                                {selectedStudentDetail.examEligibility ? (
                                    <ShieldCheck size={32} />
                                ) : (
                                    <ShieldX size={32} />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">Exam Eligibility</h3>
                                    <p className="text-sm opacity-80">{selectedStudentDetail.fullName}</p>
                                </div>
                            </div>
                            <button onClick={handleCloseEligibility} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold mb-4 ${
                                    selectedStudentDetail.examEligibility
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {selectedStudentDetail.examEligibility ? (
                                        <>
                                            <ShieldCheck size={20} />
                                            <span>Currently Eligible</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldX size={20} />
                                            <span>Currently Not Eligible</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {selectedStudentDetail.examEligibility
                                        ? 'This student is eligible to appear for exams and can generate admit cards.'
                                        : 'This student is NOT eligible to appear for exams. Admit cards cannot be generated for this student.'}
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                <p className="text-amber-800 text-sm font-medium">
                                    ⚠️ Warning: Changing exam eligibility will affect the student's ability to appear for exams and generate admit cards.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCloseEligibility}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleToggleEligibility}
                                    disabled={isUpdatingEligibility}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${
                                        selectedStudentDetail.examEligibility
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isUpdatingEligibility ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader className="animate-spin" size={16} />
                                            Updating...
                                        </span>
                                    ) : (
                                        selectedStudentDetail.examEligibility
                                            ? 'Mark as Not Eligible'
                                            : 'Mark as Eligible'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && paymentTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-900 font-bold"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Outstanding: ₹{paymentTarget.totalAmount}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-gray-900"
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
