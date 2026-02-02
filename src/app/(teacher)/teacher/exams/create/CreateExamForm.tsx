"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockAction } from "@/lib/mocks";

type Subject = {
    id: string;
    name: string;
    classroom: { name: string; section?: string }; // section usually part of section model, but here assuming relation correctness
};

export default function CreateExamForm({ subjects }: { subjects: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            subjectId: formData.get("subjectId") as string,
            totalMarks: Number(formData.get("totalMarks")),
            passingMarks: Number(formData.get("passingMarks")),
            date: new Date(formData.get("date") as string)
        };

        const res = await mockAction("createExam", data);
        if (res.success) {
            router.push("/teacher/exams");
        } else {
            setError("Failed to create exam (Mock)");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Subject & Class</label>
                <select name="subjectId" required className="w-full border rounded p-2">
                    <option value="">-- Select Subject --</option>
                    {subjects.map(sub => (
                        <option key={sub.id} value={sub.id}>
                            {sub.name} ({sub.classroom.name})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Exam Name</label>
                <input name="name" required className="w-full border rounded p-2" placeholder="e.g. Unit Test 1" />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                <input name="date" type="date" required className="w-full border rounded p-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Marks</label>
                    <input name="totalMarks" type="number" required className="w-full border rounded p-2" defaultValue={100} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Passing Marks</label>
                    <input name="passingMarks" type="number" required className="w-full border rounded p-2" defaultValue={33} />
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50 font-bold"
                >
                    {loading ? "Creating..." : "Create Exam"}
                </button>
            </div>
        </form>
    );
}
