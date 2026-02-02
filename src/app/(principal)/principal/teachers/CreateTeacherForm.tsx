"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { mockAction } from "@/lib/mocks";

export default function CreateTeacherForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            designation: formData.get("designation") as string,
            joiningDate: new Date(formData.get("joiningDate") as string),
            qualification: (formData.get("qualification") as string).split(",").map(s => s.trim()),
        };

        const res = await mockAction("createTeacher", data);

        if (res.success) {
            setIsOpen(false);
        } else {
            setError("Failed to create teacher (Mock)");
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
            >
                <Plus size={20} />
                <span>Add Teacher</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Add New Teacher</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                        <input name="name" required className="w-full border rounded p-2 text-gray-900" placeholder="John Doe" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                        <input name="email" type="email" required className="w-full border rounded p-2 text-gray-900" placeholder="teacher@school.com" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Designation</label>
                            <input name="designation" required className="w-full border rounded p-2 text-gray-900" placeholder="Senior Teacher" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Joining Date</label>
                            <input name="joiningDate" type="date" required className="w-full border rounded p-2 text-gray-900" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Qualification</label>
                        <input name="qualification" required className="w-full border rounded p-2 text-gray-900" placeholder="B.Ed, MSc Physics (comma separated)" />
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Teacher"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
