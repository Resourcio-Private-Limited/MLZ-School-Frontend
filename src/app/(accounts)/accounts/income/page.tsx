"use client";

import { useState } from "react";
import { PlusCircle, Edit2, Trash2, X, Save, IndianRupee, Calendar, Search, Loader2, Download } from "lucide-react";
import {
    useGetIncomesQuery,
    useCreateIncomeMutation,
    useUpdateIncomeMutation,
    useDeleteIncomeMutation,
    type IncomeCategory,
    type PaymentMode,
} from "@/redux/api/accountsApi";

const UI_INCOME_CATEGORIES = ['Donations', 'Events', 'Other'] as const;

const API_INCOME_CATEGORY: Record<string, IncomeCategory> = {
    'Donations': 'DONATIONS', 'Events': 'EVENTS', 'Other': 'OTHER',
};
const UI_INCOME_CATEGORY: Record<string, string> = {
    'DONATIONS': 'Donations', 'EVENTS': 'Events', 'OTHER': 'Other',
};
const API_PAYMENT_MODE: Record<string, PaymentMode> = {
    'Cash': 'CASH', 'Online': 'ONLINE', 'Card': 'CARD', 'Cheque': 'CHEQUE',
};
const UI_PAYMENT_MODE: Record<string, string> = {
    'CASH': 'Cash', 'ONLINE': 'Online', 'CARD': 'Card', 'CHEQUE': 'Cheque',
};

function toApiCategory(v: string) { return API_INCOME_CATEGORY[v] ?? 'OTHER'; }
function toUiCategory(v: string) { return UI_INCOME_CATEGORY[v] ?? v; }
function toApiPaymentMode(v: string) { return API_PAYMENT_MODE[v] ?? 'CASH'; }
function toUiPaymentMode(v: string) { return UI_PAYMENT_MODE[v] ?? v; }

interface IncomeUI {
    id: string;
    date: string;
    source: string;
    amount: number;
    category: string;
    addedBy: string;
    paymentMode: string;
    chequeNumber?: string;
}

function exportToExcel(data: IncomeUI[], filename: string) {
    const headers = ['Date', 'Source', 'Category', 'Amount', 'Payment Mode', 'Cheque Number', 'Added By'];
    const rows = data.map(i => [
        new Date(i.date).toLocaleDateString('en-IN'),
        i.source,
        i.category,
        i.amount,
        i.paymentMode,
        i.chequeNumber ?? '',
        i.addedBy,
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

export default function IncomePage() {
    const { data: apiIncomes = [], isLoading, refetch } = useGetIncomesQuery();
    const [createIncome] = useCreateIncomeMutation();
    const [updateIncome] = useUpdateIncomeMutation();
    const [deleteIncome] = useDeleteIncomeMutation();

    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeUI | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"all" | "day" | "month">("all");
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        source: "",
        amount: 0,
        category: "Donations",
        paymentMode: "Cash",
        chequeNumber: "",
    });

    const incomes: IncomeUI[] = apiIncomes.map(i => ({
        id: i.id,
        date: new Date(i.date).toISOString().split('T')[0],
        source: i.source,
        amount: i.amount,
        category: toUiCategory(i.category),
        addedBy: i.addedBy,
        paymentMode: toUiPaymentMode(i.paymentMode),
        chequeNumber: i.chequeNumber ?? undefined,
    }));

    const handleOpenModal = (income?: IncomeUI) => {
        if (income) {
            setEditingIncome(income);
            setFormData({
                date: income.date,
                source: income.source,
                amount: income.amount,
                category: income.category,
                paymentMode: income.paymentMode,
                chequeNumber: income.chequeNumber ?? '',
            });
        } else {
            setEditingIncome(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                source: "",
                amount: 0,
                category: "Donations",
                paymentMode: "Cash",
                chequeNumber: "",
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingIncome(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                date: formData.date,
                source: formData.source,
                amount: formData.amount,
                category: toApiCategory(formData.category) as IncomeCategory,
                categoryName: formData.category === 'Other' ? formData.source : undefined,
                paymentMode: toApiPaymentMode(formData.paymentMode) as PaymentMode,
                addedBy: "Mr. Rakesh Kapoor",
                chequeNumber: formData.paymentMode === 'Cheque' ? formData.chequeNumber || undefined : undefined,
            };
            if (editingIncome) {
                await updateIncome({ id: editingIncome.id, body: payload }).unwrap();
            } else {
                await createIncome(payload).unwrap();
            }
            refetch();
            handleCloseModal();
        } catch {
            // silent fail
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this income entry?")) {
            try {
                await deleteIncome(id).unwrap();
                refetch();
            } catch {
                // silent fail
            }
        }
    };

    const filteredIncomes = incomes.filter(income =>
        income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        income.category.toLowerCase().includes(searchTerm.toLowerCase())
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

    const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Income Management</h1>
                    <p className="text-gray-500 mt-1">Track income sources other than student fees</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => exportToExcel(filteredIncomes, `income-${new Date().toISOString().split('T')[0]}`)}
                        className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                        <Download size={18} />
                        <span>Export Excel</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"
                    >
                        <PlusCircle size={20} />
                        <span>Add Income</span>
                    </button>
                </div>
            </div>

            {/* Search and Sort */}
            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by source or category..."
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
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-amber-100 text-sm font-medium">Total Income (Other than Fees)</p>
                        <h2 className="text-4xl font-bold mt-2">₹{totalIncome.toLocaleString()}</h2>
                        <p className="text-amber-100 text-sm mt-2">{filteredIncomes.length} entries</p>
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
                                <th className="text-left p-4 font-semibold text-gray-700">Payment Mode</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Cheque No.</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Added By</th>
                                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredIncomes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        No income entries yet. Click "Add Income" to create one.
                                    </td>
                                </tr>
                            ) : (
                                filteredIncomes.map((income) => (
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
                                        <td className="p-4 text-sm text-gray-600">{income.paymentMode}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {income.chequeNumber
                                                ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{income.chequeNumber}</span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-amber-600 text-white p-6 flex items-center justify-between rounded-t-xl sticky top-0">
                            <h2 className="text-2xl font-bold">
                                {editingIncome ? "Edit Income" : "Add Income"}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-amber-700 rounded-lg transition-colors">
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Source <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    placeholder="e.g., Annual Day Event"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                >
                                    {UI_INCOME_CATEGORIES.map(c => (
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                        placeholder="Enter amount"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Mode <span className="text-red-500">*</span></label>
                                <select
                                    value={formData.paymentMode}
                                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                    <option value="Card">Card</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>

                            {formData.paymentMode === 'Cheque' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cheque Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.chequeNumber}
                                        onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
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
                                disabled={saving || !formData.source || formData.amount <= 0 || (formData.paymentMode === 'Cheque' && !formData.chequeNumber)}
                                className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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