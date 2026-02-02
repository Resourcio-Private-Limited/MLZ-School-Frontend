"use client";

import { useState } from "react";
import { mockAction } from "@/lib/mocks";
import { useRouter } from "next/navigation";

type StudentShort = {
    id: string;
    name: string | null; // StudentProfile doesn't have name, User does. We'll pass combined object.
    admissionNo: string;
};

type Props = {
    classroomId: string;
    students: {
        id: string; // studentProfileId
        admissionNo: string;
        user: { name: string | null };
    }[];
};

export default function AttendanceSheet({ classroomId, students }: Props) {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Init attendance with PRESENT if empty
    // But we should probably allow user to set it.
    // Let's default to empty or PRESENT? Usually default PRESENT is easier.

    const handleStatusChange = (studentId: string, status: string) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAllPresent = () => {
        const newAtt: Record<string, string> = {};
        students.forEach(s => newAtt[s.id] = "PRESENT");
        setAttendance(newAtt);
    };

    const handleSubmit = async () => {
        setLoading(true);
        // Prepare data
        const records = students.map(s => ({
            studentId: s.id,
            status: (attendance[s.id] || "PRESENT") as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
        }));

        const res = await mockAction("markAttendance", {
            classroomId,
            date: new Date(date),
            records
        });

        if (res.success) {
            alert("Attendance marked successfully (Mock)!");
            router.refresh();
        } else {
            alert("Failed (Mock)");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border p-2 rounded text-gray-900"
                    />
                </div>
                <button
                    onClick={handleMarkAllPresent}
                    className="text-sm text-blue-600 hover:underline font-bold"
                >
                    Mark All Present
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 font-semibold text-gray-700">Roll/Adm</th>
                            <th className="p-3 font-semibold text-gray-700">Name</th>
                            <th className="p-3 font-semibold text-gray-700 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map((student) => {
                            const status = attendance[student.id] || "PRESENT";
                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="p-3 font-mono text-sm text-gray-900">{student.admissionNo}</td>
                                    <td className="p-3 font-medium text-gray-900">{student.user.name}</td>
                                    <td className="p-3 flex justify-center space-x-2">
                                        {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(student.id, s)}
                                                className={`px-3 py-1 rounded text-xs font-bold transition-colors border
                                                    ${status === s
                                                        ? s === 'PRESENT' ? 'bg-green-600 text-white border-green-600'
                                                            : s === 'ABSENT' ? 'bg-red-600 text-white border-red-600'
                                                                : s === 'LATE' ? 'bg-yellow-500 text-white border-yellow-500'
                                                                    : 'bg-gray-500 text-white border-gray-500'
                                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                                    }
                                                `}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Attendance"}
                </button>
            </div>
        </div>
    );
}
