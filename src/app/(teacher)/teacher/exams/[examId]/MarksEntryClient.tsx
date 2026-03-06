"use client";

import { useState } from "react";
import { mockAction } from "@/lib/mocks";
import { Save, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type StudentRow = {
    id: string;
    name: string | null;
    admissionNo: string;
    marksObtained: number;
    remarks: string | null;
    hasResult: boolean;
};

export default function MarksEntryClient({ exam, students, locked }: { exam: any; students: StudentRow[]; locked: boolean }) {
    const router = useRouter();
    const [marks, setMarks] = useState<Record<string, number>>(
        students.reduce((acc, s) => ({ ...acc, [s.id]: s.marksObtained }), {})
    );
    const [remarks, setRemarks] = useState<Record<string, string>>(
        students.reduce((acc, s) => ({ ...acc, [s.id]: s.remarks || "" }), {})
    );

    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");

    const handleMarkChange = (id: string, val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        if (num > exam.totalMarks) return; // Basic validation
        setMarks(prev => ({ ...prev, [id]: num }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg("");

        const payload = students.map(s => ({
            studentId: s.id,
            marksObtained: marks[s.id] || 0,
            remarks: remarks[s.id]
        }));

        const res = await mockAction("updateMarks", { examId: exam.id, payload });
        if (res.success) {
            setMsg("Marks saved successfully (Mock).");
            setTimeout(() => setMsg(""), 3000);
            router.refresh();
        } else {
            setMsg("Error: " + "Failed (Mock)");
        }
        setSaving(false);
    };

    const handlePublish = async () => {
        if (!confirm(exam.isPublished ? "Unpublish results?" : "Publish results to students?")) return;
        setSaving(true);
        await mockAction("toggleExamPublish", { examId: exam.id, isPublished: !exam.isPublished });
        setSaving(false);
        router.refresh();
    };

    const handleLock = async () => {
        if (!confirm("Are you sure? Once locked, you cannot edit marks.")) return;
        setSaving(true);
        await mockAction("lockExam", { examId: exam.id });
        setSaving(false);
        router.refresh();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6 pb-6 border-b">
                <div className="flex items-center space-x-2">
                    {msg && <span className="text-green-600 text-sm font-bold mr-4">{msg}</span>}
                </div>

                <div className="flex items-center space-x-3">
                    {!locked && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>Save Marks</span>
                        </button>
                    )}

                    <button
                        onClick={handlePublish}
                        disabled={saving}
                        className={`flex items-center space-x-2 px-4 py-2 rounded border font-medium transition-colors
                            ${exam.isPublished ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                        `}
                    >
                        {exam.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                        <span>{exam.isPublished ? "Unpublish" : "Publish"}</span>
                    </button>

                    {!locked && (
                        <button
                            onClick={handleLock}
                            disabled={saving}
                            className="flex items-center space-x-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded hover:bg-red-100"
                        >
                            <Lock size={18} />
                            <span>Lock Results</span>
                        </button>
                    )}
                </div>
            </div>

            {locked && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-center font-bold">
                    This exam is locked. Marks cannot be edited.
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">Admission No</th>
                            <th className="p-3">Name</th>
                            <th className="p-3 w-32">Marks (/{exam.totalMarks})</th>
                            <th className="p-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-sm text-gray-500">{student.admissionNo}</td>
                                <td className="p-3 font-medium">{student.name}</td>
                                <td className="p-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max={exam.totalMarks}
                                        value={marks[student.id] ?? ""}
                                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                        disabled={locked}
                                        className="w-full border rounded p-1 text-center font-bold disabled:bg-gray-100 disabled:text-gray-500"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={remarks[student.id] ?? ""}
                                        onChange={(e) => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                                        disabled={locked}
                                        placeholder="Optional..."
                                        className="w-full border rounded p-1 text-sm disabled:bg-gray-100"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
