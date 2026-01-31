"use client";

import { use, useState } from "react";
import { ArrowLeft, Calendar, Plus, Users, Search, Download, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [selectedMonth, setSelectedMonth] = useState("October 2024");
    const [isMarking, setIsMarking] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [viewingRecord, setViewingRecord] = useState<any | null>(null);

    // Mock Permission Logic (Matches previous logic: ID 1 is Class Teacher)
    const isClassTeacher = id === "1";

    // Initial Mock Data (Moved to state)
    const [attendanceHistory, setAttendanceHistory] = useState([
        { date: "2024-10-18", day: "Friday", strength: 35, present: 32, absent: 3, status: "Submitted" },
        { date: "2024-10-17", day: "Thursday", strength: 35, present: 34, absent: 1, status: "Submitted" },
        { date: "2024-10-16", day: "Wednesday", strength: 35, present: 35, absent: 0, status: "Submitted" },
        { date: "2024-10-15", day: "Tuesday", strength: 35, present: 30, absent: 5, status: "Submitted" },
        { date: "2024-10-14", day: "Monday", strength: 35, present: 33, absent: 2, status: "Submitted" },
        { date: "2024-10-11", day: "Friday", strength: 35, present: 31, absent: 4, status: "Submitted" },
        { date: "2024-10-10", day: "Thursday", strength: 35, present: 35, absent: 0, status: "Submitted" },
    ]);

    const [totalWorkingDays, setTotalWorkingDays] = useState(22);

    // Mock Students for Marking
    const [students, setStudents] = useState([
        { id: 101, name: "Aarav Patel", rollNo: "01", isPresent: false },
        { id: 102, name: "Aditi Sharma", rollNo: "02", isPresent: false },
        { id: 103, name: "Arjun Singh", rollNo: "03", isPresent: false },
        { id: 104, name: "Diya Gupta", rollNo: "04", isPresent: false },
        { id: 105, name: "Ishaan Kumar", rollNo: "05", isPresent: false },
        { id: 106, name: "Kavya Reddy", rollNo: "06", isPresent: false },
        { id: 107, name: "Mira Nair", rollNo: "07", isPresent: false },
        { id: 108, name: "Rohan Verma", rollNo: "08", isPresent: false },
        { id: 109, name: "Sanya Malhotra", rollNo: "09", isPresent: false },
        { id: 110, name: "Vihaan Joshi", rollNo: "10", isPresent: false },
    ]);

    const toggleAttendance = (studentId: number) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, isPresent: !s.isPresent } : s));
    };

    const handleInitialSubmit = () => {
        setIsMarking(false);
        setIsConfirming(true);
    };

    const handleFinalSubmit = () => {
        const presentCountFromSmallList = students.filter(s => s.isPresent).length;
        // Logic to simulate full class stats from the small visible list
        const finalPresent = 30 + (presentCountFromSmallList > 5 ? 2 : 0);
        const finalAbsent = 35 - finalPresent;

        const record = {
            date: new Date().toISOString().split('T')[0],
            day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
            strength: 35,
            present: finalPresent,
            absent: finalAbsent,
            status: "Submitted"
        };

        setAttendanceHistory([record, ...attendanceHistory]);
        setTotalWorkingDays(prev => prev + 1);
        setIsConfirming(false);
    };

    // Check if attendance is already marked for today
    const today = new Date().toISOString().split('T')[0];
    const isAttendanceSubmittedToday = attendanceHistory.some(record => record.date === today);

    return (
        <div className="space-y-6 relative">
            {/* Modal Overlay for Marking and Confirmation */}
            {(isMarking || isConfirming) && (
                <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
                    {/* Mark Attendance Modal */}
                    {isMarking && (
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Mark Attendance</h2>
                                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <button onClick={() => setIsMarking(false)} className="text-gray-400 hover:text-gray-600">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-3">
                                    {students.map((student) => (
                                        <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${student.isPresent ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {student.rollNo}
                                                </div>
                                                <span className="font-medium text-gray-700">{student.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`text-sm font-semibold ${student.isPresent ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {student.isPresent ? 'Present' : 'Absent'}
                                                </span>
                                                <button
                                                    onClick={() => toggleAttendance(student.id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${student.isPresent ? 'bg-green-500' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${student.isPresent ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    Present: <span className="font-bold text-green-600">{students.filter(s => s.isPresent).length}</span> / {students.length}
                                </span>
                                <button
                                    onClick={handleInitialSubmit}
                                    className="bg-[#2BB9E5] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#25a0c7] transition-colors"
                                >
                                    Save Attendance
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Confirmation Modal */}
                    {isConfirming && (
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Submission?</h3>
                            <p className="text-gray-500 mb-6">Once submitted, you cannot edit this record. Teaching day count and student stats will be updated.</p>

                            <div className="flex space-x-3 justify-center">
                                <button
                                    onClick={() => { setIsConfirming(false); setIsMarking(true); }}
                                    className="px-5 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleFinalSubmit}
                                    className="px-5 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                                >
                                    Confirm
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
                                <p className="text-sm text-gray-500">{new Date(viewingRecord.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setViewingRecord(null)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-3">
                                {students.map((student) => {
                                    const isPresentDemo = viewingRecord.date === today ? student.isPresent : Math.random() > 0.1;
                                    return (
                                        <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {student.rollNo}
                                                </div>
                                                <span className="font-medium text-gray-700">{student.name}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPresentDemo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {isPresentDemo ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
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
                    <Link href={`/teacher/classroom/${id}`}>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-[#2BB9E5] transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Daily Attendance Log</h1>
                </div>

                {isClassTeacher && (
                    <button
                        onClick={() => !isAttendanceSubmittedToday && setIsMarking(true)}
                        disabled={isAttendanceSubmittedToday}
                        className={`px-5 py-2.5 rounded-lg font-semibold shadow-md transition-all flex items-center space-x-2 ${isAttendanceSubmittedToday
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-[#2BB9E5] text-white shadow-blue-200 hover:bg-[#25a0c7]'
                            }`}
                    >
                        {isAttendanceSubmittedToday ? (
                            <>
                                <CheckCircle size={20} />
                                <span>Submitted for Today</span>
                            </>
                        ) : (
                            <>
                                <Plus size={20} />
                                <span>Mark Attendance</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Average Attendance</p>
                        <p className="text-2xl font-bold text-gray-800">92.4%</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUpIcon size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Working Days</p>
                        <p className="text-2xl font-bold text-gray-800">{totalWorkingDays}</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-gray-800">35</p>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <Users size={24} />
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
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#2BB9E5] focus:border-[#2BB9E5] block p-2"
                        >
                            <option>October 2024</option>
                            <option>September 2024</option>
                            <option>August 2024</option>
                        </select>
                        <button className="p-2 text-gray-500 hover:text-[#2BB9E5] transition-colors">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Strength</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Present</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Absent</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendanceHistory.map((record, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800">{new Date(record.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span className="text-xs text-gray-500">{record.day}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 font-medium">
                                        {record.strength}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                            {record.present}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.absent === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                            {record.absent}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-xs font-medium text-gray-500 flex items-center justify-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => setViewingRecord(record)}
                                                className="text-[#2BB9E5] hover:text-[#25a0c7] font-medium text-xs"
                                            >
                                                View
                                            </button>
                                            {isClassTeacher && record.status !== "Submitted" && (
                                                <button className="text-gray-400 hover:text-gray-600 font-medium text-xs">Edit</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Simple Icon component for the stats section
function TrendingUpIcon({ size = 24, className = "" }: { size?: number, className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}
