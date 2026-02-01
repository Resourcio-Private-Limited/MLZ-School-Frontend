"use client";

import { useState } from "react";
import { X, UserCheck, GraduationCap, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { promoteStudentsAction } from "@/actions/promotion-actions";
import { PromotionService } from "@/services/promotion";

type Student = {
    id: string;
    admissionNo: string;
    user: {
        name: string;
        email: string;
    };
    section?: {
        name: string;
    };
    examStatus?: 'PASS' | 'FAIL';
    examResults?: Array<{
        examName: string;
        marks: number;
        maxMarks: number;
        grade: string;
        status: 'PASS' | 'FAIL';
    }>;
};

type Classroom = {
    id: string;
    name: string;
    level: string;
};

export default function PromotionModal({
    classroom,
    students,
    onClose,
    onSuccess
}: {
    classroom: Classroom;
    students: Student[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isGraduation = PromotionService.isGraduation(classroom.name);
    const nextClass = PromotionService.getNextClass(classroom.name);

    // Get promotion summary
    const summary = PromotionService.getPromotionSummary(students);
    const eligibleStudents = summary.eligibleStudents;
    const notEligibleStudents = summary.notEligibleStudents;

    const toggleStudent = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAllEligible = () => {
        setSelectedStudents(eligibleStudents.map(s => s.id));
    };

    const deselectAll = () => {
        setSelectedStudents([]);
    };

    const handlePromote = async () => {
        if (selectedStudents.length === 0) {
            setError("Please select at least one student to promote");
            return;
        }

        setLoading(true);
        setError("");

        const result = await promoteStudentsAction({
            studentIds: selectedStudents,
            currentClassroomId: classroom.id,
            currentClassName: classroom.name,
        });

        setLoading(false);

        if (result.success) {
            onSuccess();
            onClose();
        } else {
            setError(result.error || "Failed to promote students");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className={`p-6 ${isGraduation ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {isGraduation ? <GraduationCap size={32} /> : <UserCheck size={32} />}
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isGraduation ? 'Graduate Students' : 'Promote Students'}
                                </h2>
                                <p className="text-sm opacity-90 mt-1">
                                    {isGraduation
                                        ? `Graduate from ${classroom.name}`
                                        : `Promote from ${classroom.name} to ${nextClass}`
                                    }
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="p-6 bg-gray-50 border-b grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-600 text-sm font-medium">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-green-600 text-sm font-medium">Eligible (Passed)</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{summary.eligible}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <p className="text-red-600 text-sm font-medium">Not Eligible (Failed)</p>
                        <p className="text-3xl font-bold text-red-700 mt-1">{summary.notEligible}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={selectAllEligible}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                        >
                            Select All Eligible ({summary.eligible})
                        </button>
                        <button
                            onClick={deselectAll}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        >
                            Deselect All
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        Selected: <span className="font-semibold text-gray-900">{selectedStudents.length}</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-red-800 font-semibold">Promotion Error</p>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Eligible Students */}
                    {eligibleStudents.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                                <CheckCircle2 className="text-green-600" size={20} />
                                <span>Eligible Students ({eligibleStudents.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {eligibleStudents.map((student) => (
                                    <label
                                        key={student.id}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition ${selectedStudents.includes(student.id)
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 bg-white hover:border-green-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={() => toggleStudent(student.id)}
                                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{student.user.name}</p>
                                                    <p className="text-sm text-gray-600">{student.admissionNo} • {student.section?.name}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    PASSED
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Not Eligible Students */}
                    {notEligibleStudents.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                                <XCircle className="text-red-600" size={20} />
                                <span>Not Eligible Students ({notEligibleStudents.length})</span>
                            </h3>
                            <div className="space-y-2">
                                {notEligibleStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center space-x-3 p-3 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-60"
                                    >
                                        <input
                                            type="checkbox"
                                            disabled
                                            className="w-5 h-5 text-gray-400 rounded cursor-not-allowed"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-700">{student.user.name}</p>
                                                    <p className="text-sm text-gray-500">{student.admissionNo} • {student.section?.name}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                                    FAILED
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {students.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="font-medium">No students in this classroom</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePromote}
                        disabled={loading || selectedStudents.length === 0}
                        className={`px-6 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${loading || selectedStudents.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : isGraduation
                                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                {isGraduation ? <GraduationCap size={20} /> : <UserCheck size={20} />}
                                <span>
                                    {isGraduation
                                        ? `Graduate ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                                        : `Promote ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                                    }
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
