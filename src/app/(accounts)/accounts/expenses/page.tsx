"use client";

import { useState } from "react";
import { TrendingDown, Edit2, Trash2, X, Save, IndianRupee, Calendar } from "lucide-react";

interface Expense {
    id: number;
    date: string;
    reason: string;
    amount: number;
    category: string;
    addedBy: string;
}

export default function ExpensesPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reason: "",
        amount: 0,
        category: "Other"
    });

    const [expenses, setExpenses] = useState<Expense[]>([
        { id: 1, date: "2024-01-10", reason: "Teacher Salaries - January", amount: 500000, category: "Salaries", addedBy: "Accountant User" },
        { id: 2, date: "2024-01-15", reason: "Electricity Bill", amount: 25000, category: "Utilities", addedBy: "Accountant User" },
        { id: 3, date: "2024-01-18", reason: "Classroom Furniture Repair", amount: 15000, category: "Maintenance", addedBy: "Accountant User" },
        { id: 4, date: "2024-01-22", reason: "Stationery Supplies", amount: 12000, category: "Supplies", addedBy: "Accountant User" },
        { id: 5, date: "2024-01-28", reason: "Water Bill", amount: 8000, category: "Utilities", addedBy: "Accountant User" },
    ]);

    const handleOpenModal = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                date: expense.date,
                reason: expense.reason,
                amount: expense.amount,
                category: expense.category
            });
        } else {
            setEditingExpense(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                reason: "",
                amount: 0,
                category: "Other"
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingExpense(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            reason: "",
            amount: 0,
            category: "Other"
        });
    };

    const handleSave = () => {
        if (editingExpense) {
            // Update existing expense
            setExpenses(expenses.map(exp =>
                exp.id === editingExpense.id
                    ? { ...exp, ...formData }
                    : exp
            ));
        } else {
            // Add new expense
            const newExpense: Expense = {
                id: Date.now(),
                ...formData,
                addedBy: "Accountant User"
            };
            setExpenses([newExpense, ...expenses]);
        }
        handleCloseModal();
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this expense entry?")) {
            setExpenses(expenses.filter(exp => exp.id !== id));
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
                    <p className="text-gray-500 mt-1">Track and manage all school expenses</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    <TrendingDown size={20} />
                    <span>Add Expense</span>
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                        <h2 className="text-4xl font-bold mt-2">₹{totalExpenses.toLocaleString()}</h2>
                        <p className="text-red-100 text-sm mt-2">{expenses.length} entries</p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-lg">
                        <TrendingDown size={48} />
                    </div>
                </div>
            </div>

            {/* Expense List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-red-500">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Reason</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Added By</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No expense entries yet. Click "Add Expense" to create one.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{expense.reason}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-red-600">₹{expense.amount.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-600">{expense.addedBy}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(expense)}
                                                    className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
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
                        <div className="bg-red-600 text-white p-6 flex items-center justify-between rounded-t-xl">
                            <h2 className="text-2xl font-bold">
                                {editingExpense ? "Edit Expense" : "Add Expense"}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-red-700 rounded-lg transition-colors"
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                    placeholder="e.g., Electricity Bill"
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
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                >
                                    <option value="Salaries">Salaries</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Supplies">Supplies</option>
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
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
                                disabled={!formData.reason || formData.amount <= 0}
                                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
