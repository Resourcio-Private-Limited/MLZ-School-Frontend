"use client";

import { useState } from "react";
import { TrendingDown, Edit2, Trash2, X, Save, IndianRupee, Calendar, Search, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetExpensesQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    type ExpenseCategory,
    type PaymentMode,
} from "@/redux/api/accountsApi";

const UI_EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Other'] as const;
const UI_PAYMENT_MODES = ['Cash', 'NEFT', 'Cheque', 'Online', 'Card'] as const;

const API_EXPENSE_CATEGORY: Record<string, ExpenseCategory> = {
    'Salaries': 'SALARIES', 'Utilities': 'UTILITIES', 'Maintenance': 'MAINTENANCE',
    'Supplies': 'SUPPLIES', 'Other': 'OTHER',
};
const UI_EXPENSE_CATEGORY: Record<string, string> = {
    'SALARIES': 'Salaries', 'UTILITIES': 'Utilities', 'MAINTENANCE': 'Maintenance',
    'SUPPLIES': 'Supplies', 'OTHER': 'Other',
};
const API_PAYMENT_MODE: Record<string, PaymentMode> = {
    'Cash': 'CASH', 'NEFT': 'NEFT', 'Cheque': 'CHEQUE', 'Online': 'ONLINE', 'Card': 'CARD',
};

function toApiCategory(v: string) { return API_EXPENSE_CATEGORY[v] ?? 'OTHER'; }
function toUiCategory(v: string) { return UI_EXPENSE_CATEGORY[v] ?? v; }
function toApiPaymentMode(v: string) { return API_PAYMENT_MODE[v] ?? 'CASH'; }
function toUiPaymentMode(v: string) {
    const map: Record<string, string> = { 'CASH': 'Cash', 'NEFT': 'NEFT', 'CHEQUE': 'Cheque', 'ONLINE': 'Online', 'CARD': 'Card' };
    return map[v] ?? v;
}

interface ExpenseUI {
    id: string;
    date: string;
    reason: string;
    amount: number;
    category: string;
    addedBy: string;
    partyName: string;
    paymentMode: string;
    chequeNumber?: string;
}

function exportToExcel(data: ExpenseUI[], filename: string) {
    const headers = ['Date', 'Reason', 'Party Name', 'Category', 'Amount', 'Payment Mode', 'Cheque Number', 'Added By'];
    const rows = data.map(e => [
        new Date(e.date).toLocaleDateString('en-IN'),
        e.reason,
        e.partyName,
        e.category,
        e.amount,
        e.paymentMode,
        e.chequeNumber ?? '',
        e.addedBy,
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export default function ExpensesPage() {
    const { data: apiExpenses = [], isLoading, refetch } = useGetExpensesQuery();
    const [createExpense] = useCreateExpenseMutation();
    const [updateExpense] = useUpdateExpenseMutation();
    const [deleteExpense] = useDeleteExpenseMutation();

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseUI | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"all" | "day" | "month">("all");
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reason: "",
        amount: 0,
        category: "Salaries",
        partyName: "",
        paymentMode: "Cash",
        chequeNumber: "",
    });

    const expenses: ExpenseUI[] = apiExpenses.map(e => ({
        id: e.id,
        date: new Date(e.date).toISOString().split('T')[0],
        reason: e.reason,
        amount: e.amount,
        category: toUiCategory(e.category),
        addedBy: e.addedBy,
        partyName: e.partyName ?? '',
        paymentMode: toUiPaymentMode(e.paymentMode),
        chequeNumber: e.chequeNumber ?? undefined,
    }));

    const handleOpenModal = (expense?: ExpenseUI) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                date: expense.date,
                reason: expense.reason,
                amount: expense.amount,
                category: expense.category,
                partyName: expense.partyName,
                paymentMode: expense.paymentMode,
                chequeNumber: expense.chequeNumber ?? '',
            });
        } else {
            setEditingExpense(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                reason: "",
                amount: 0,
                category: "Salaries",
                partyName: "",
                paymentMode: "Cash",
                chequeNumber: "",
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingExpense(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                date: formData.date,
                reason: formData.reason,
                amount: formData.amount,
                category: toApiCategory(formData.category) as ExpenseCategory,
                partyName: formData.partyName || undefined,
                paymentMode: toApiPaymentMode(formData.paymentMode) as PaymentMode,
                addedBy: "Mr. Rakesh Kapoor",
                chequeNumber: formData.paymentMode === 'Cheque' ? formData.chequeNumber || undefined : undefined,
            };
            if (editingExpense) {
                await updateExpense({ id: editingExpense.id, body: payload }).unwrap();
                toast.success("Expense updated successfully!");
            } else {
                await createExpense(payload).unwrap();
                toast.success("Expense created successfully!");
            }
            refetch();
            handleCloseModal();
        } catch {
            toast.error("Failed to save expense.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this expense entry?")) {
            try {
                await deleteExpense(id).unwrap();
                toast.success("Expense deleted successfully!");
                refetch();
            } catch {
                toast.error("Failed to delete expense.");
            }
        }
    };

    const filteredExpenses = expenses.filter(expense =>
        expense.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.partyName.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (sortBy === "day") {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === "month") {
            const aMonth = new Date(a.date).toISOString().slice(0, 7);
            const bMonth = new Date(b.date).toISOString().slice(0, 7);
            return bMonth.localeCompare(aMonth);
        }
        return 0;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
                    <p className="text-gray-500 mt-1">Track and manage all school expenses</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => exportToExcel(filteredExpenses, `expenses-${new Date().toISOString().split('T')[0]}`)}
                        className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                        <Download size={18} />
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"
                    >
                        <TrendingDown size={20} />
                        <span>Add Expense</span>
                    </button>
                </div>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by reason, category, or party..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "all" | "day" | "month")}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                >
                    <option value="all">All</option>
                    <option value="day">Sort by Day</option>
                    <option value="month">Sort by Month</option>
                </select>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                        <h2 className="text-4xl font-bold mt-2">₹{totalExpenses.toLocaleString()}</h2>
                        <p className="text-red-100 text-sm mt-2">{filteredExpenses.length} entries</p>
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
                                <th className="text-left p-4 font-semibold text-gray-700">Party Name</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Amount</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Payment Mode</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Cheque No.</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Added By</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        No expense entries yet. Click "Add Expense" to create one.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-900">{expense.reason}</td>
                                        <td className="p-4 text-sm text-gray-600">{expense.partyName}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-red-600">₹{expense.amount.toLocaleString()}</td>
                                        <td className="p-4 text-sm text-gray-600">{expense.paymentMode}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {expense.chequeNumber
                                                ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{expense.chequeNumber}</span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-red-600 text-white p-6 flex items-center justify-between rounded-t-xl sticky top-0">
                            <h2 className="text-2xl font-bold">
                                {editingExpense ? "Edit Expense" : "Add Expense"}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-red-700 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
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

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                    placeholder="e.g., Electricity Bill"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Party Name</label>
                                <input
                                    type="text"
                                    value={formData.partyName}
                                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                    placeholder="e.g., Power Company"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                >
                                    {UI_EXPENSE_CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount <span className="text-red-500">*</span></label>
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

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.paymentMode}
                                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                >
                                    {UI_PAYMENT_MODES.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.paymentMode === 'Cheque' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cheque Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.chequeNumber}
                                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none text-gray-800"
                                        placeholder="Enter cheque number"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3 rounded-b-xl sticky bottom-0">
                            <button onClick={handleCloseModal}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formData.reason || formData.amount <= 0 || (formData.paymentMode === 'Cheque' && !formData.chequeNumber)}
                                className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                                <span>{saving ? 'Saving...' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}