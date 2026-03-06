"use client";

import { useState } from "react";
import { PlusCircle, Edit2, Trash2, X, Save, IndianRupee, Calendar } from "lucide-react";

interface Income {
    id: number;
    date: string;
    source: string;
    amount: number;
    category: string;
    addedBy: string;
}

export default function IncomePage() {
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        source: "",
        amount: 0,
        category: "Other"
    });

    const [incomes, setIncomes] = useState<Income[]>([
        { id: 1, date: "2024-01-15", source: "Annual Day Event", amount: 50000, category: "Events", addedBy: "Accountant User" },
        { id: 2, date: "2024-01-20", source: "Donation from Alumni", amount: 100000, category: "Donations", addedBy: "Accountant User" },
        { id: 3, date: "2024-01-25", source: "Sports Day Sponsorship", amount: 75000, category: "Events", addedBy: "Accountant User" },
        { id: 4, date: "2024-02-01", source: "Book Sale", amount: 15000, category: "Other", addedBy: "Accountant User" },
    ]);

    const handleOpenModal = (income?: Income) => {
        if (income) {
            setEditingIncome(income);
            setFormData({
                date: income.date,
                source: income.source,
                amount: income.amount,
                category: income.category
            });
        } else {
            setEditingIncome(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                source: "",
                amount: 0,
                category: "Other"
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingIncome(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            source: "",
            amount: 0,
            category: "Other"
        });
    };

    const handleSave = () => {
        if (editingIncome) {
            // Update existing income
            setIncomes(incomes.map(inc =>
                inc.id === editingIncome.id
                    ? { ...inc, ...formData }
                    : inc
            ));
        } else {
            // Add new income
            const newIncome: Income = {
                id: Date.now(),
                ...formData,
                addedBy: "Accountant User"
            };
            setIncomes([newIncome, ...incomes]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this income entry?")) {
            setIncomes(incomes.filter(inc => inc.id !== id));
        }
    };

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Income Management</h1>
                    <p className="text-gray-500 mt-1">Track income sources other than student fees</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    <PlusCircle size={20} />
                    <span>Add Income</span>
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-amber-100 text-sm font-medium">Total Income (Other than Fees)</p>
                        <h2 className="text-4xl font-bold mt-2">₹{totalIncome.toLocaleString()}</h2>
                        <p className="text-amber-100 text-sm mt-2">{incomes.length} entries</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-lg">
                        <IndianRupee size={48} />
                    </div>
                </div>
            </div>

            {/* Income List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-amber-500">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Source</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Added By</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {incomes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No income entries yet. Click "Add Income" to create one.
                                    </td>
                                </tr>
                            ) : (
                                incomes.map((income) => (
                                    <tr key={income.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(income.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{income.source}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {income.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-green-600">₹{income.amount.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-600">{income.addedBy}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(income)}
                                                    className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(income.id)}
                                                    className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="bg-amber-600 text-white p-6 flex items-center justify-between rounded-t-xl">
                            <h2 className="text-2xl font-bold">
                                {editingIncome ? "Edit Income" : "Add Income"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Source <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    placeholder="e.g., Annual Day Event"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                >
                                    <option value="Donations">Donations</option>
                                    <option value="Events">Events</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Amount <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3 rounded-b-xl">
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formData.source || formData.amount <= 0}
                                className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
