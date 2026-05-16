"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, Calendar, Plus, Users, Download, CheckCircle, Loader2, History } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';
import { useGetClassStudentsQuery, useGetTeacherProfileQuery, useMarkAttendanceMutation } from "@/redux/api/teacherApi";

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });
    const [isMarking, setIsMarking] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<any | null>(null);

    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem("authUser");
                setAuthUser(raw ? JSON.parse(raw) : {});
            } catch {
                setAuthUser({});
            }
        }
    }, []);

    const teacherId = authUser?.teacher?.id ?? authUser?.id;

    const { data: profile, isLoading: profileLoading } = useGetTeacherProfileQuery();
    const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useGetClassStudentsQuery(classroomId);

    const [markAttendance, { isLoading: isSubmitting }] = useMarkAttendanceMutation();

    // Check if current teacher is class teacher of this classroom
    const isClassTeacher = profile?.classTeacherOf?.id === classroomId;

    // Local attendance toggle state (studentId -> boolean)
    const [localAttendance, setLocalAttendance] = useState<Record<string, boolean>>({});

    const toggleAttendance = (studentId: string) => {
        setLocalAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    const handleInitialSubmit = () => {
        setIsMarking(false);
        setIsConfirming(true);
    };

    const handleFinalSubmit = async () => {
        const entries = students.map(s => ({
            studentId: s.id,
            status: (localAttendance[s.id] ?? true) ? 'PRESENT' as const : 'ABSENT' as const,
            teacherId,
            classroomId,
        }));

        try {
            await markAttendance(entries).unwrap();
            setIsConfirming(false);
            setLocalAttendance({});
            toast.success("Attendance marked and saved successfully!");
            refetchStudents();
        } catch {
            toast.error("Failed to submit attendance. Please try again.");
            setIsConfirming(false);
        }
    };

    const presentCount = students.filter(s => localAttendance[s.id] !== false).length;
    const totalStudents = students.length;

    return (
        <div className="space-y-6 relative">
            {/* Modals */}
            {(isMarking || isConfirming) && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                    {isMarking && (
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>
                                    <p className="text-sm text-gray-500">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsMarking(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {studentsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    </div>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        No students in this class.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {students.map((student) => {
                                            const isPresent = localAttendance[student.id] !== false;
                                            return (
                                                <div key={student.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                                        isPresent ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:bg-gray-50'
                                                    }`}>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                            {student.rollNumber ?? student.id.slice(-2).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-gray-700">{student.fullName}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`text-sm font-semibold ${isPresent ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {isPresent ? 'Present' : 'Absent'}
                                                        </span>
                                                        <button
                                                            onClick={() => toggleAttendance(student.id)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                                                isPresent ? 'bg-green-500' : 'bg-gray-300'
                                                            }`}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                isPresent ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    Present: <span className="font-bold text-green-600">{presentCount}</span> / {totalStudents}
                                </span>
                                <button
                                    onClick={handleInitialSubmit}
                                    className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                                >
                                    Save Attendance
                                </button>
                            </div>
                        </div>
                    )}

                    {isConfirming && (
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Submission?</h3>
                            <p className="text-gray-500 mb-6">
                                Once submitted, you cannot edit this record. Teaching day count and student stats will be updated.
                            </p>
                            <div className="flex space-x-3 justify-center">
                                <button
                                    onClick={() => { setIsConfirming(false); setIsMarking(true); }}
                                    className="px-5 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-all"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                                    {isSubmitting ? 'Submitting...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* View Attendance Details Modal */}
            {viewingRecord && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Attendance Details</h2>
                                <p className="text-sm text-gray-500">{viewingRecord.date}</p>
                            </div>
                            <button onClick={() => setViewingRecord(null)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-sm text-gray-500 text-center py-12">Attendance detail view — connect to student detail API if needed.</p>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setViewingRecord(null)}
                                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href={`/teacher/classroom/${classroomId}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-emerald-500 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Daily Attendance Log</h1>
                </div>

                <div className="flex items-center space-x-3">
                    <Link href={`/teacher/classroom/${classroomId}/attendance/history`}>
                        <button className="px-4 py-2.5 rounded-lg font-semibold shadow-sm transition-all flex items-center space-x-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
                            <History size={18} />
                            <span>Attendance History</span>
                        </button>
                    </Link>

                    {profileLoading ? null : isClassTeacher ? (
                        <button
                            onClick={() => setIsMarking(true)}
                            className="px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all flex items-center space-x-2 bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600"
                        >
                            <Plus size={20} />
                            <span>Mark Attendance</span>
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                            <CheckCircle size={16} />
                            <span>View Only — Class Teacher can mark attendance</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Class Teacher</p>
                        <p className="text-lg font-bold text-gray-800">
                            {profile?.classTeacherOf?.name ?? '—'}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Class</p>
                        <p className="text-lg font-bold text-gray-800">
                            {profile?.classTeacherOf?.grade ?? '—'} {profile?.classTeacherOf?.section ?? ''}
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                </div>
            </div>

            {/* Attendance History Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Attendance History</h2>
                    <div className="flex items-center space-x-3">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2"
                        >
                            <option>{selectedMonth}</option>
                        </select>
                        <button className="p-2 text-gray-500 hover:text-emerald-500 transition-colors">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {studentsLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No students found in this class.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Roll No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Attendance</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Exam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                                            {student.rollNumber ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                                            {student.fullName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                student.attendance === 'PRESENT'
                                                    ? 'bg-green-100 text-green-700'
                                                    : student.attendance === 'ABSENT'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {student.attendance ?? 'Not Marked'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            {student.attendance ? 'Recorded' : '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                            {student.lastExam ? `${student.lastExam.name} (${new Date(student.lastExam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}