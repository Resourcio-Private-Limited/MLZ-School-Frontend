"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { mockAction } from "@/lib/mocks";
import { useRouter } from "next/navigation";

export default function CreateFeeForm({ academicYearId }: { academicYearId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form fields
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("MONTHLY");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await mockAction("createFeeStructure", {
            name,
            amount: parseFloat(amount),
            frequency,
            academicYearId
        });

        if (res.success) {
            setIsOpen(false);
            setName("");
            setAmount("");
            router.refresh();
        } else {
            alert("Failed (Mock)");
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-800 transition"
            >
                <Plus size={18} />
                <span>Add Fee Structure</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Add Fee Structure</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Fee Name</label>
                        <input
                            required
                            className="w-full border p-2 rounded text-gray-900"
                            placeholder="e.g. Tuition Fee"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
                        <input
                            required
                            type="number"
                            className="w-full border p-2 rounded text-gray-900"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Frequency</label>
                        <select
                            className="w-full border p-2 rounded text-gray-900"
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value)}
                        >
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="ONCE">One Time</option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
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
                            className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Create Fee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
