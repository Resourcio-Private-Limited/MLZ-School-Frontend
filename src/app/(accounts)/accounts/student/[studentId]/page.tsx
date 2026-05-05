"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    User, GraduationCap, Phone, Mail, Users, ShieldCheck, ShieldX,
    ChevronLeft, Loader2, CheckCircle, AlertCircle, Clock, IndianRupee,
    BookOpen, Calendar, RefreshCw
} from "lucide-react";
import {
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
} from "@/redux/api/accountsApi";
import { StudentDetailFeeHistory } from "@/redux/api/accountsApi";

function formatDate(dateStr: string | Date | null | undefined) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function formatMonth(month: number, year: number) {
    return new Date(year, month - 1).toLocaleString("en-IN", {
        month: "long", year: "numeric",
    });
}

function getStatusBadge(isPaid: boolean, paidAmount: number, totalAmount: number) {
    if (isPaid) return <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle size={13} className="mr-1" /> Paid</span>;
    if (paidAmount > 0) return <span className="flex items-center text-yellow-600 text-xs font-bold"><Clock size={13} className="mr-1" /> Partial</span>;
    return <span className="flex items-center text-red-600 text-xs font-bold"><AlertCircle size={13} className="mr-1" /> Due</span>;
}

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const studentId = params.studentId as string;

    const { data, isLoading, refetch } = useGetStudentDetailQuery(studentId);
    const [updateEligibility, { isLoading: isUpdatingEligibility }] = useUpdateExamEligibilityMutation();

    const [eligibilityLoading, setEligibilityLoading] = useState(false);

    const handleToggleEligibility = async () => {
        if (!data) return;
        setEligibilityLoading(true);
        try {
            await updateEligibility({
                studentId,
                examEligibility: !data.examEligibility,
            }).unwrap();
            refetch();
        } finally {
            setEligibilityLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-20 text-gray-500">
                Student not found.
            </div>
        );
    }

    const infoFields = [
        { label: "Roll Number", value: data.rollNumber },
        { label: "Admission No.", value: data.admissionNumber },
        { label: "Date of Birth", value: formatDate(data.dob) },
        { label: "Gender", value: data.gender },
        { label: "Parent Name", value: data.parentName ?? "—" },
        { label: "Parent Contact", value: data.parentContact ?? "—" },
        { label: "Primary Contact", value: data.primaryContact },
        { label: "Email", value: data.email ?? "—" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {/* Student Overview */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <User size={28} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{data.fullName}</h2>
                                <div className="flex items-center gap-3 mt-1 text-amber-100 text-sm">
                                    <span className="flex items-center gap-1">
                                        <GraduationCap size={14} />
                                        {data.classroom.name}
                                    </span>
                                    <span>•</span>
                                    <span>{data.classroom.grade} — Section {data.classroom.section}</span>
                                </div>
                            </div>
                        </div>
                        {/* Exam Eligibility */}
                        <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold ${
                                data.examEligibility
                                    ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                                    : 'bg-red-500/20 text-red-100 border border-red-400/30'
                            }`}>
                                {data.examEligibility
                                    ? <ShieldCheck size={16} />
                                    : <ShieldX size={16} />
                                }
                                {data.examEligibility ? 'Eligible for Exams' : 'Not Eligible for Exams'}
                            </div>
                            <button
                                onClick={handleToggleEligibility}
                                disabled={eligibilityLoading || isUpdatingEligibility}
                                className="flex items-center gap-1.5 text-xs text-amber-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                            >
                                {eligibilityLoading || isUpdatingEligibility
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <RefreshCw size={12} />
                                }
                                {data.examEligibility ? 'Mark Ineligible' : 'Mark Eligible'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
                    <div className="p-5 text-center">
                        <p className="text-sm text-gray-500 mb-1">Total Paid</p>
                        <p className="text-xl font-bold text-green-600">₹{data.paymentSummary.totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-sm text-gray-500 mb-1">Outstanding</p>
                        <p className="text-xl font-bold text-red-600">₹{data.paymentSummary.totalDue.toLocaleString()}</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-sm text-gray-500 mb-1">Paid Months</p>
                        <p className="text-xl font-bold text-gray-700">{data.paymentSummary.paidMonths}</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-sm text-gray-500 mb-1">Unpaid Months</p>
                        <p className="text-xl font-bold text-gray-700">{data.paymentSummary.unpaidMonths}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Personal Info */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <User size={16} className="text-amber-500" />
                            Student Information
                        </h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {infoFields.map(f => (
                            <div key={f.label} className="flex justify-between items-start text-sm">
                                <span className="text-gray-500">{f.label}</span>
                                <span className="text-gray-800 font-medium text-right max-w-[60%]">{f.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Fee Structure */}
                    <div className="p-5 border-t">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <BookOpen size={16} className="text-amber-500" />
                            Fee Structure
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tuition (Monthly)</span>
                                <span className="font-bold text-amber-600">₹{data.feeStructure.tuitionFees}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Annual Charges</span>
                                <span className="font-bold text-purple-600">₹{data.feeStructure.annualCharges}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Transport</span>
                                <span className={`font-bold ${data.feeStructure.transportOpted ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {data.feeStructure.transportOpted ? 'Opted' : 'Not Opted'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Fee History */}
                <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b flex items-center justify-between">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={16} className="text-amber-500" />
                            Fee History
                        </h3>
                        <span className="text-xs text-gray-400">{data.feeHistory.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs">
                                <tr>
                                    <th className="p-3 font-semibold">Month</th>
                                    <th className="p-3 text-right font-semibold">Tuition</th>
                                    <th className="p-3 text-right font-semibold">Transport</th>
                                    <th className="p-3 text-right font-semibold">Annual</th>
                                    <th className="p-3 text-right font-semibold">Other</th>
                                    <th className="p-3 text-right font-semibold">Discount</th>
                                    <th className="p-3 text-right font-semibold">Penalty</th>
                                    <th className="p-3 text-right font-semibold">Total</th>
                                    <th className="p-3 text-right font-semibold">Paid</th>
                                    <th className="p-3 text-center font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.feeHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-gray-400">
                                            No fee records found.
                                        </td>
                                    </tr>
                                ) : (
                                    data.feeHistory.map((fee: StudentDetailFeeHistory) => (
                                        <tr key={fee.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-sm font-medium text-gray-900">
                                                {formatMonth(fee.month, fee.year)}
                                            </td>
                                            <td className="p-3 text-sm text-right text-gray-700">₹{fee.tuitionFees}</td>
                                            <td className="p-3 text-sm text-right text-blue-600">
                                                {fee.transportFees > 0 ? `₹${fee.transportFees}` : '—'}
                                            </td>
                                            <td className="p-3 text-sm text-right text-purple-600">
                                                {fee.annualCharges > 0 ? `₹${fee.annualCharges}` : '—'}
                                            </td>
                                            <td className="p-3 text-sm text-right text-gray-700">
                                                {fee.otherFees > 0 ? `₹${fee.otherFees}` : '—'}
                                            </td>
                                            <td className="p-3 text-sm text-right text-green-600">
                                                {fee.discount > 0 ? `₹${fee.discount}` : '—'}
                                            </td>
                                            <td className="p-3 text-sm text-right text-red-600">
                                                {fee.penalty > 0 ? `₹${fee.penalty}` : '—'}
                                            </td>
                                            <td className="p-3 text-sm text-right font-bold text-gray-900">
                                                {fee.isPaid ? '₹0' : fee.totalAmount > 0 ? `₹${fee.totalAmount}` : '₹0'}
                                            </td>
                                            <td className="p-3 text-sm text-right text-green-600">
                                                {fee.paidAmount > 0 ? `₹${fee.paidAmount}` : '—'}
                                            </td>
                                            <td className="p-3">{getStatusBadge(fee.isPaid, fee.paidAmount, fee.totalAmount)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
