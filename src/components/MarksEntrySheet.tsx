"use client";

import { useState } from "react";
import { mockAction } from "@/lib/mocks";
import { useRouter } from "next/navigation";

// Types
type Student = {
    id: string;
    admissionNo: string;
    user: { name: string | null };
};

type Exam = {
    id: string;
    name: string;
    totalMarks: number;
    passingMarks: number;
    subject: { name: string };
};

type Result = {
    studentId: string;
    marksObtained: number;
    remarks?: string | null;
};

type Props = {
    exam: Exam;
    students: Student[];
    existingResults: Result[];
};

export default function MarksEntrySheet({ exam, students, existingResults }: Props) {
    const [marks, setMarks] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        existingResults.forEach(r => {
            initial[r.studentId] = r.marksObtained.toString();
        });
        return initial;
    });

    const [remarks, setRemarks] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        existingResults.forEach(r => initial[r.studentId] = r.remarks || "");
        return initial;
    });

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleMarkChange = (studentId: string, val: string) => {
        setMarks(prev => ({ ...prev, [studentId]: val }));
    };

    const handleRemarkChange = (studentId: string, val: string) => {
        setRemarks(prev => ({ ...prev, [studentId]: val }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const results = students.map(s => {
            const m = parseFloat(marks[s.id] || "0");
            return {
                studentId: s.id,
                marksObtained: isNaN(m) ? 0 : m,
                remarks: remarks[s.id]
            };
        });

        const res = await mockAction("publishResults", {
            examId: exam.id,
            results
        });

        if (res.success) {
            alert("Results published successfully!");
            router.refresh();
        } else {
            alert("Failed (Mock)");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">{exam.name} - {exam.subject.name}</h2>
                    <p className="text-sm text-gray-500">Max Marks: {exam.totalMarks} | Passing: {exam.passingMarks}</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                    {loading ? "Publishing..." : "Publish Results"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 font-semibold text-gray-700">Admission No</th>
                            <th className="p-3 font-semibold text-gray-700">Student Name</th>
                            <th className="p-3 font-semibold text-gray-700 w-32">Marks</th>
                            <th className="p-3 font-semibold text-gray-700">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="p-3 font-mono text-sm text-gray-900">{student.admissionNo}</td>
                                <td className="p-3 font-medium text-gray-900">{student.user.name}</td>
                                <td className="p-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max={exam.totalMarks}
                                        value={marks[student.id] || ""}
                                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 font-bold"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={remarks[student.id] || ""}
                                        onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                        className="w-full border p-2 rounded text-gray-900 text-sm"
                                        placeholder="Good, Needs Improvement..."
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
