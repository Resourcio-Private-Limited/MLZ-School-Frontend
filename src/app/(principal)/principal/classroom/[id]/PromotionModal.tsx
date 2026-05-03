"use client";

import { useState } from "react";
import { X, UserCheck, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { usePromoteStudentsMutation, useGetNextClassroomsQuery } from "@/redux/api/principalApi";

type Student = {
    id: string;
    admissionNo: string;
    fullName: string;
    averageMarks?: number;
    feeStatus?: 'CLEARED' | 'PENDING' | 'OVERDUE';
};

type Classroom = {
    id: string;
    name: string;
    grade?: string;
};

export default function PromotionModal({
    classroom,
    students,
    onClose,
    onSuccess,
}: {
    classroom: Classroom;
    students: Student[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [targetClassroomId, setTargetClassroomId] = useState<string>("");
    const [error, setError] = useState("");

    const { data: allClassrooms = [], isLoading: loadingClassrooms } = useGetNextClassroomsQuery(classroom.id);
    const [promoteStudents, { isLoading: isPromoting }] = usePromoteStudentsMutation();

    // Group classrooms by grade for display
    const classroomsByGrade = allClassrooms.reduce<Record<string, typeof allClassrooms>>((acc, cls) => {
        if (!acc[cls.grade]) acc[cls.grade] = [];
        acc[cls.grade].push(cls);
        return acc;
    }, {});

    const selectedClassroom = allClassrooms.find((c) => c.id === targetClassroomId);

    const toggleStudent = (studentId: string) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
        );
    };

    const selectAll = () => {
        setSelectedStudents(students.map((s) => s.id));
    };

    const deselectAll = () => {
        setSelectedStudents([]);
    };

    const handlePromote = async () => {
        if (selectedStudents.length === 0) {
            setError("Please select at least one student to promote");
            return;
        }
        if (!targetClassroomId) {
            setError("Please select a target classroom");
            return;
        }

        setError("");
        try {
            await promoteStudents({ studentIds: selectedStudents, targetClassroomId }).unwrap();
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err?.data?.message ?? "Failed to promote students. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <UserCheck size={32} />
                            <div>
                                <h2 className="text-2xl font-bold">Promote Students</h2>
                                <p className="text-sm opacity-90 mt-1">
                                    From {classroom.name}
                                    {selectedClassroom ? ` → ${selectedClassroom.name}` : ' — select a target classroom below'}
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
                        <p className="text-3xl font-bold text-gray-900 mt-1">{students.length}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-green-600 text-sm font-medium">Selected</p>
                        <p className="text-3xl font-bold text-green-700 mt-1">{selectedStudents.length}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-600 text-sm font-medium">Target Classroom</p>
                        <p className="text-xl font-bold text-gray-900 mt-1 truncate">
                            {selectedClassroom ? selectedClassroom.name : 'Not selected'}
                        </p>
                    </div>
                </div>

                {/* Target Classroom Selection — Dropdown */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Target Classroom <span className="text-red-500">*</span>
                    </label>
                    {loadingClassrooms ? (
                        <p className="text-sm text-gray-500">Loading classrooms...</p>
                    ) : allClassrooms.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No other classrooms available.</p>
                    ) : (
                        <select
                            value={targetClassroomId}
                            onChange={(e) => setTargetClassroomId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                        >
                            <option value="">— Choose a classroom —</option>
                            {Object.entries(classroomsByGrade)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([grade, classrooms]) => (
                                    <optgroup key={grade} label={`Grade ${grade}`}>
                                        {classrooms.map((cls) => {
                                            const seatsLeft = cls.capacity - cls.total;
                                            const isFull = seatsLeft <= 0;
                                            return (
                                                <option key={cls.id} value={cls.id} disabled={isFull}>
                                                    {cls.name} ({cls.total}/{cls.capacity})
                                                    {isFull ? ' — FULL' : ` · ${seatsLeft} seats left`}
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                ))}
                        </select>
                    )}
                    {selectedClassroom && (
                        <p className="mt-2 text-sm text-green-700 font-medium">
                            Selected: {selectedClassroom.name} &mdash; {selectedClassroom.total}/{selectedClassroom.capacity} enrolled
                        </p>
                    )}
                </div>

                {/* Student Selection Bar */}
                <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={selectAll}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                        >
                            Select All ({students.length})
                        </button>
                        <button
                            onClick={deselectAll}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                        >
                            Deselect All
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{selectedStudents.length}</span> selected
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-red-800 font-semibold">Promotion Error</p>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Student List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {students.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="font-medium">No students in this classroom</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {students.map((student) => (
                                <label
                                    key={student.id}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                                        selectedStudents.includes(student.id)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-white hover:border-green-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{student.fullName}</p>
                                        <p className="text-sm text-gray-600 font-mono">{student.admissionNo}</p>
                                    </div>
                                    {student.averageMarks !== undefined && (
                                        <span className="text-xs font-medium text-gray-500 shrink-0">
                                            Avg: {student.averageMarks}
                                        </span>
                                    )}
                                </label>
                            ))}
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
                        disabled={isPromoting || selectedStudents.length === 0 || !targetClassroomId}
                        className={`px-6 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                            isPromoting || selectedStudents.length === 0 || !targetClassroomId
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isPromoting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Promoting...</span>
                            </>
                        ) : (
                            <>
                                <UserCheck size={20} />
                                <span>
                                    Promote {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}