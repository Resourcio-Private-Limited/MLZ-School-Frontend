"use client";

import { use, useState, useEffect } from "react";
import { ArrowLeft, Calendar, Users, CheckCircle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useGetAttendanceHistoryQuery, useGetAttendanceByDateQuery } from "@/redux/api/teacherApi";

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export default function AttendanceHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);

    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [viewDate, setViewDate] = useState<string | null>(null);

    const { data: history, isLoading } = useGetAttendanceHistoryQuery(
        { classroomId, month: selectedMonth, year: selectedYear },
    );

    const { data: dateDetails } = useGetAttendanceByDateQuery(
        { classroomId, date: viewDate ?? '' },
        { skip: !viewDate },
    );

    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? '';

    return (
        <div className="space-y-6">
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
                    <h1 className="text-3xl font-bold text-gray-800">Attendance History</h1>
                </div>
            </div>

            {/* Month Selector */}
            <div className="flex items-center space-x-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <Calendar size={20} className="text-gray-400" />
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                </div>
            ) : history ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Average Attendance</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">{history.avgAttendance}%</p>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                <CheckCircle size={28} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Working Days</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{history.totalWorkingDays}</p>
                            </div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <Calendar size={28} />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Students</p>
                                <p className="text-3xl font-bold text-gray-800 mt-1">{history.totalStudents}</p>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Attendance Log Table */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                Monthly Attendance Log — {monthLabel} {selectedYear}
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Day</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Total Students</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Present</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Absent</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.days.map((day) => {
                                        const dayDate = new Date(day.date);
                                        const isFuture = dayDate > now;
                                        return (
                                            <tr key={day.date} className={`hover:bg-gray-50 transition-colors ${isFuture ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                                    {formatDate(day.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {day.dayName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                    {day.totalStudents}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                                        {day.present}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${day.absent === 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                                        {day.absent}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {isFuture ? (
                                                        <span className="text-xs text-gray-400">Future</span>
                                                    ) : day.isMarked ? (
                                                        <span className="text-xs font-medium text-emerald-600 flex items-center justify-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Marked
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Not Marked</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {day.isMarked ? (
                                                        <button
                                                            onClick={() => setViewDate(day.date)}
                                                            className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    <Calendar size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No attendance history found for this month.</p>
                </div>
            )}

            {/* View Details Modal */}
            {viewDate && dateDetails && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Attendance Details</h2>
                                <p className="text-sm text-gray-500 mt-1">{formatDate(viewDate)}</p>
                            </div>
                            <button
                                onClick={() => setViewDate(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-around">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{dateDetails.present}</p>
                                <p className="text-xs text-gray-500">Present</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{dateDetails.absent}</p>
                                <p className="text-xs text-gray-500">Absent</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-800">{dateDetails.total}</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-3">
                                {dateDetails.records.map((record) => (
                                    <div key={record.studentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                                record.status === 'PRESENT'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                            }`}>
                                                {record.rollNumber !== '—' ? record.rollNumber : '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{record.fullName}</p>
                                                <p className="text-xs text-gray-400">Roll: {record.rollNumber}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            record.status === 'PRESENT'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {record.status === 'PRESENT' ? 'Present' : 'Absent'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setViewDate(null)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}