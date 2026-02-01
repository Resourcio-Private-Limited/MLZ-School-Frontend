"use client";

import { X, User, BookOpen, Calendar, FileText, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

type StudentDetail = {
    id: string;
    admissionNo: string;
    user: {
        name: string;
        email: string;
    };
    // Personal
    dob: Date;
    gender: string;
    bloodGroup?: string;
    religion?: string;
    category?: string;
    nationality: string;
    fatherName: string;
    motherName: string;
    parentContact: string;
    emergencyContact?: string;
    guardianName?: string;
    guardianContact?: string;
    address: string;
    previousSchool?: string;

    // Academic
    section?: { name: string };
    admissionYear: number;
    passingYear?: number;
    academicYear?: string;

    // Attendance
    attendancePercentage?: number;
    totalPresent?: number;
    totalAbsent?: number;
    totalDays?: number;

    // Exams
    averageMarks?: number;
    highestMarks?: number;
    lowestMarks?: number;
    examResults?: Array<{
        examName: string;
        marks: number;
        maxMarks: number;
        grade: string;
        status: 'PASS' | 'FAIL';
    }>;

    // Fees
    totalFees?: number;
    paidFees?: number;
    pendingFees?: number;
    feeStatus?: 'CLEARED' | 'PENDING' | 'OVERDUE';
    lastPaymentDate?: Date;
};

type Tab = 'personal' | 'academic' | 'attendance' | 'exams' | 'fees';

export default function StudentDetailModal({
    student,
    onClose
}: {
    student: StudentDetail;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<Tab>('personal');

    const tabs = [
        { id: 'personal' as Tab, label: 'Personal', icon: User },
        { id: 'academic' as Tab, label: 'Academic', icon: BookOpen },
        { id: 'attendance' as Tab, label: 'Attendance', icon: Calendar },
        { id: 'exams' as Tab, label: 'Exams', icon: FileText },
        { id: 'fees' as Tab, label: 'Fees', icon: DollarSign },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{student.user.name}</h2>
                            <p className="text-purple-100 text-sm mt-1">
                                {student.admissionNo} • {student.section?.name || 'N/A'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                            <X size={24} />
                        </button>
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
                    {activeTab === 'academic' && <AcademicTab student={student} />}
                    {activeTab === 'attendance' && <AttendanceTab student={student} />}
                    {activeTab === 'exams' && <ExamsTab student={student} />}
                    {activeTab === 'fees' && <FeesTab student={student} />}
                </div>
            </div>
        </div>
    );
}

function PersonalTab({ student }: { student: StudentDetail }) {
    const InfoRow = ({ label, value }: { label: string; value: string | undefined }) => (
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
                    <InfoRow label="Full Name" value={student.user.name} />
                    <InfoRow label="Email" value={student.user.email} />
                    <InfoRow label="Date of Birth" value={new Date(student.dob).toLocaleDateString()} />
                    <InfoRow label="Gender" value={student.gender} />
                    <InfoRow label="Blood Group" value={student.bloodGroup} />
                    <InfoRow label="Religion" value={student.religion} />
                    <InfoRow label="Category" value={student.category} />
                    <InfoRow label="Nationality" value={student.nationality} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <InfoRow label="Father's Name" value={student.fatherName} />
                    <InfoRow label="Mother's Name" value={student.motherName} />
                    <InfoRow label="Parent Contact" value={student.parentContact} />
                    <InfoRow label="Emergency Contact" value={student.emergencyContact} />
                    {student.guardianName && (
                        <>
                            <InfoRow label="Guardian Name" value={student.guardianName} />
                            <InfoRow label="Guardian Contact" value={student.guardianContact} />
                        </>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Address & Other</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                    <InfoRow label="Address" value={student.address} />
                    <InfoRow label="Previous School" value={student.previousSchool} />
                </div>
            </div>
        </div>
    );
}

function AcademicTab({ student }: { student: StudentDetail }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-purple-600 font-medium text-sm">Admission Number</p>
                    <p className="text-purple-900 font-mono font-bold text-lg mt-1">{student.admissionNo}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-600 font-medium text-sm">Section</p>
                    <p className="text-blue-900 font-bold text-lg mt-1">{student.section?.name || 'N/A'}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 font-medium text-sm">Admission Year</p>
                    <p className="text-green-900 font-bold text-lg mt-1">{student.admissionYear}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-600 font-medium text-sm">Expected Passing Year</p>
                    <p className="text-orange-900 font-bold text-lg mt-1">{student.passingYear || 'N/A'}</p>
                </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600 font-medium text-sm">Academic Year</p>
                <p className="text-gray-900 font-bold text-lg mt-1">{student.academicYear || 'N/A'}</p>
            </div>
        </div>
    );
}

function AttendanceTab({ student }: { student: StudentDetail }) {
    const percentage = student.attendancePercentage || 0;
    const getColor = () => {
        if (percentage >= 75) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="space-y-6">
            <div className={`border-2 rounded-lg p-6 ${getColor()}`}>
                <div className="text-center">
                    <p className="text-sm font-medium opacity-80">Attendance Percentage</p>
                    <p className="text-5xl font-bold mt-2">{percentage.toFixed(1)}%</p>
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

function ExamsTab({ student }: { student: StudentDetail }) {
    return (
        <div className="space-y-6">
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

            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Exam Results</h3>
                {student.examResults && student.examResults.length > 0 ? (
                    <div className="space-y-3">
                        {student.examResults.map((exam, idx) => (
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

function FeesTab({ student }: { student: StudentDetail }) {
    const getStatusColor = () => {
        switch (student.feeStatus) {
            case 'CLEARED': return 'text-green-600 bg-green-50 border-green-200';
            case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'OVERDUE': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = () => {
        switch (student.feeStatus) {
            case 'CLEARED': return <CheckCircle size={32} />;
            case 'PENDING': return <AlertCircle size={32} />;
            case 'OVERDUE': return <XCircle size={32} />;
            default: return <DollarSign size={32} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-80">Fee Status</p>
                        <p className="text-3xl font-bold mt-2">{student.feeStatus || 'UNKNOWN'}</p>
                    </div>
                    {getStatusIcon()}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-600 font-medium text-sm">Total Fees</p>
                    <p className="text-blue-900 font-bold text-2xl mt-2">₹{student.totalFees?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 font-medium text-sm">Paid</p>
                    <p className="text-green-900 font-bold text-2xl mt-2">₹{student.paidFees?.toLocaleString() || '0'}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 font-medium text-sm">Pending</p>
                    <p className="text-red-900 font-bold text-2xl mt-2">₹{student.pendingFees?.toLocaleString() || '0'}</p>
                </div>
            </div>

            {student.lastPaymentDate && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 font-medium text-sm">Last Payment Date</p>
                    <p className="text-gray-900 font-semibold text-lg mt-1">
                        {new Date(student.lastPaymentDate).toLocaleDateString()}
                    </p>
                </div>
            )}
        </div>
    );
}
