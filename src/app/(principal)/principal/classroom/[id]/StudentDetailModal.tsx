"use client";

import { X, User, BookOpen, Calendar, FileText, DollarSign, CheckCircle, XCircle, AlertCircle, Edit, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useGetStudentDetailQuery, useUpdateExamEligibilityMutation } from "@/redux/api/accountsApi";

type Tab = 'personal' | 'academic' | 'attendance' | 'exams' | 'fees';

export default function StudentDetailModal({
    studentId,
    onClose,
    onStudentUpdate
}: {
    studentId: string;
    onClose: () => void;
    onStudentUpdate?: () => void;
}) {
    const [activeTab, setActiveTab] = useState<Tab>('personal');
    const { data: student, isLoading, error, refetch } = useGetStudentDetailQuery(studentId);
    const [updateEligibility] = useUpdateExamEligibilityMutation();

    const handleToggleEligibility = async () => {
        if (!student) return;
        try {
            await updateEligibility({ studentId, examEligibility: !student.examEligibility }).unwrap();
            toast.success(`Exam eligibility ${!student.examEligibility ? 'enabled' : 'disabled'} successfully!`);
            refetch();
            if (onStudentUpdate) onStudentUpdate();
        } catch {
            toast.error("Failed to update exam eligibility");
        }
    };

    const tabs = [
        { id: 'personal' as Tab, label: 'Personal', icon: User },
        { id: 'academic' as Tab, label: 'Academic', icon: BookOpen },
        { id: 'attendance' as Tab, label: 'Attendance', icon: Calendar },
        { id: 'exams' as Tab, label: 'Exams', icon: FileText },
        { id: 'fees' as Tab, label: 'Fees', icon: DollarSign },
    ];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col items-center justify-center p-12">
                    <Loader2 size={48} className="animate-spin text-purple-600 mb-4" />
                    <p className="text-gray-600 font-medium">Loading student details...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col items-center justify-center p-12">
                    <XCircle size={48} className="text-red-500 mb-4" />
                    <p className="text-gray-600 font-medium">Failed to load student details</p>
                    <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{student.fullName}</h2>
                            <p className="text-purple-100 text-sm mt-1">
                                {student.admissionNumber} • {student.classroom?.name || 'N/A'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <div className="flex space-x-1 p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-gray-600 hover:bg-white/50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'personal' && <PersonalTab student={student} />}
                    {activeTab === 'academic' && <AcademicTab student={student} onToggleEligibility={handleToggleEligibility} />}
                    {activeTab === 'attendance' && <AttendanceTab student={student} />}
                    {activeTab === 'exams' && <ExamsTab student={student} />}
                    {activeTab === 'fees' && <FeesTab student={student} />}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PersonalTab({ student }: { student: any }) {
    const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
        <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100">
            <span className="text-gray-600 font-medium">{label}</span>
            <span className="col-span-2 text-gray-900">{value || 'N/A'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <InfoRow label="Full Name" value={student.fullName} />
                    <InfoRow label="Email" value={student.email} />
                    <InfoRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} />
                    <InfoRow label="Gender" value={student.gender} />
                    <InfoRow label="Primary Contact" value={student.primaryContact} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <InfoRow label="Parent Name" value={student.parentName} />
                    <InfoRow label="Parent Contact" value={student.parentContact} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Classroom</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <InfoRow label="Classroom" value={student.classroom?.name} />
                    <InfoRow label="Grade" value={student.classroom?.grade} />
                    <InfoRow label="Section" value={student.classroom?.section} />
                    <InfoRow label="Roll Number" value={student.rollNumber} />
                </div>
            </div>
        </div>
    );
}

function AcademicTab({ student, onToggleEligibility }: { student: any; onToggleEligibility: () => void }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-purple-600 font-medium text-sm">Admission Number</p>
                    <p className="text-purple-900 font-mono font-bold text-lg mt-1">{student.admissionNumber}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-600 font-medium text-sm">Classroom</p>
                    <p className="text-blue-900 font-bold text-lg mt-1">{student.classroom?.name || 'N/A'}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 font-medium text-sm">Roll Number</p>
                    <p className="text-green-900 font-bold text-lg mt-1">{student.rollNumber || 'N/A'}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-600 font-medium text-sm">Exam Eligibility</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${student.examEligibility ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {student.examEligibility ? 'Eligible' : 'Not Eligible'}
                        </span>
                        <button
                            onClick={onToggleEligibility}
                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                        >
                            Toggle
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Fee Structure</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-gray-600 text-sm">Tuition Fees</p>
                            <p className="text-gray-900 font-bold text-lg">₹{student.feeStructure?.tuitionFees?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Annual Charges</p>
                            <p className="text-gray-900 font-bold text-lg">₹{student.feeStructure?.annualCharges?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Transport</p>
                            <p className="text-gray-900 font-bold text-lg">{student.feeStructure?.transportOpted ? 'Opted' : 'Not Opted'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AttendanceTab({ student }: { student: any }) {
    const attendancePercentage = student.attendancePercentage || 0;
    const getColor = () => {
        if (attendancePercentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
        if (attendancePercentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="space-y-6">
            <div className={`border-2 rounded-lg p-6 ${getColor()}`}>
                <div className="text-center">
                    <p className="text-sm font-medium opacity-80">Attendance Percentage</p>
                    <p className="text-5xl font-bold mt-2">{attendancePercentage.toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                    <p className="text-green-600 font-medium text-sm">Present</p>
                    <p className="text-green-900 font-bold text-2xl mt-1">{student.totalPresent || 0}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="mx-auto text-red-600 mb-2" size={32} />
                    <p className="text-red-600 font-medium text-sm">Absent</p>
                    <p className="text-red-900 font-bold text-2xl mt-1">{student.totalAbsent || 0}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <Calendar className="mx-auto text-blue-600 mb-2" size={32} />
                    <p className="text-blue-600 font-medium text-sm">Total Days</p>
                    <p className="text-blue-900 font-bold text-2xl mt-1">{student.totalDays || 0}</p>
                </div>
            </div>
        </div>
    );
}

function ExamsTab({ student }: { student: any }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Performance</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-blue-600 font-medium text-sm">Average Marks</p>
                        <p className="text-blue-900 font-bold text-3xl mt-2">{student.averageMarks?.toFixed(1) || 'N/A'}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-600 font-medium text-sm">Highest Marks</p>
                        <p className="text-green-900 font-bold text-3xl mt-2">{student.highestMarks || 'N/A'}</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                        <p className="text-orange-600 font-medium text-sm">Lowest Marks</p>
                        <p className="text-orange-900 font-bold text-3xl mt-2">{student.lowestMarks || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Results</h3>
                {student.examResults && student.examResults.length > 0 ? (
                    <div className="space-y-3">
                        {student.examResults.map((exam: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">{exam.examName}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {exam.marks}/{exam.maxMarks} • Grade: {exam.grade}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${exam.status === 'PASS'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {exam.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                        <p>No exam results available</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function FeesTab({ student }: { student: any }) {
    const getStatusColor = () => {
        if (student.paymentSummary?.totalDue === 0) return 'text-green-600 bg-green-50 border-green-200';
        if (student.paymentSummary?.totalDue > 0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-gray-600 bg-gray-50 border-gray-200';
    };

    const getStatusIcon = () => {
        if (student.paymentSummary?.totalDue === 0) return <CheckCircle size={32} />;
        if (student.paymentSummary?.totalDue > 0) return <AlertCircle size={32} />;
        return <DollarSign size={32} />;
    };

    const getStatusText = () => {
        if (student.paymentSummary?.totalDue === 0) return 'CLEARED';
        if (student.paymentSummary?.totalDue > 0) return 'PENDING';
        return 'UNKNOWN';
    };

    return (
        <div className="space-y-6">
            <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-80">Fee Status</p>
                        <p className="text-3xl font-bold mt-2">{getStatusText()}</p>
                    </div>
                    {getStatusIcon()}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-600 font-medium text-sm">Total Paid</p>
                    <p className="text-blue-900 font-bold text-2xl mt-2">₹{student.paymentSummary?.totalPaid?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium text-sm">Total Due</p>
                    <p className="text-red-900 font-bold text-2xl mt-2">₹{student.paymentSummary?.totalDue?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 font-medium text-sm">Paid Months</p>
                    <p className="text-green-900 font-bold text-2xl mt-2">{student.paymentSummary?.paidMonths || 0}</p>
                </div>
            </div>

            {student.feeHistory && student.feeHistory.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                    <div className="space-y-3">
                        {student.feeHistory.map((payment: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {new Date(payment.year, payment.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            ₹{payment.paidAmount?.toLocaleString() || 0} • {payment.paymentMode || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.isPaid
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {payment.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
