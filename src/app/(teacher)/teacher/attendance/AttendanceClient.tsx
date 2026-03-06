"use client";

import { useState, useEffect } from "react";
import { mockAction } from "@/lib/mocks";
import { Save, Loader2, CheckCircle } from "lucide-react";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

type Student = {
    id: string;
    user: { name: string | null };
};

export default function AttendanceClient({
    classroomId,
    students,
    teacherId
}: {
    classroomId: string;
    students: Student[];
    teacherId: string;
}) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    // Load existing attendance when date changes
    useEffect(() => {
        async function load() {
            setLoading(true);
            // Simulate fetch
            await new Promise(r => setTimeout(r, 500));
            // Mock empty attendance or some random data if needed
            setAttendance({});
            setLoading(false);
        }
        load();
    }, [date, classroomId]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg("");

        const records = students.map(s => ({
            studentId: s.id,
            status: attendance[s.id] || "PRESENT"
        }));

        const res = await mockAction("markAttendance", { classroomId, date: new Date(date), records });

        if (res.success) {
            setMsg("Attendance saved successfully (Mock)!");
            setTimeout(() => setMsg(""), 3000);
        } else {
            setMsg("Error: " + "Failed (Mock)");
        }
        setSaving(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Select Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded p-2"
                    />
                </div>
                <div className="flex items-center space-x-4">
                    {msg && <span className="text-green-600 font-medium text-sm flex items-center"><CheckCircle size={16} className="mr-1" /> {msg}</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        <span>Save Attendance</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading attendance...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 text-left">Student Name</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {students.map(student => {
                                const status = attendance[student.id] || "PRESENT"; // Visual default
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{student.user.name}</td>
                                        <td className="p-3 flex justify-center space-x-2">
                                            <StatusButton
                                                current={status}
                                                target="PRESENT"
                                                onClick={() => handleStatusChange(student.id, "PRESENT")}
                                                color="bg-green-100 text-green-700 border-green-200"
                                            />
                                            <StatusButton
                                                current={status}
                                                target="ABSENT"
                                                onClick={() => handleStatusChange(student.id, "ABSENT")}
                                                color="bg-red-100 text-red-700 border-red-200"
                                            />
                                            <StatusButton
                                                current={status}
                                                target="LATE"
                                                onClick={() => handleStatusChange(student.id, "LATE")}
                                                color="bg-yellow-100 text-yellow-700 border-yellow-200"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function StatusButton({ current, target, onClick, color }: any) {
    const isSelected = current === target;
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 rounded text-sm font-semibold border transition-all ${isSelected ? color + " ring-2 ring-offset-1 ring-blue-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
        >
            {target}
        </button>
    );
}
