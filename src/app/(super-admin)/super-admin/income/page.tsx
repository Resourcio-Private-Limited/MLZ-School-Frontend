"use client";

import { useState } from "react";
import { Calendar, Download, IndianRupee, Loader2, PlusCircle, Save, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateSuperAdminIncomeMutation, useGetSuperAdminIncomesQuery } from "@/redux/api/superAdminApi";
import type { IncomeCategory, PaymentMode } from "@/redux/api/accountsApi";
import { Tooltip } from "@/components/ui/tooltip";

const categories = ["Donations", "Events", "Other"] as const;
const categoryToApi: Record<string, IncomeCategory> = { Donations: "DONATIONS", Events: "EVENTS", Other: "OTHER" };
const categoryToUi: Record<string, string> = { DONATIONS: "Donations", EVENTS: "Events", OTHER: "Other" };
const paymentToApi: Record<string, PaymentMode> = { Cash: "CASH", Online: "ONLINE", Card: "CARD", Cheque: "CHEQUE" };
const paymentToUi: Record<string, string> = { CASH: "Cash", ONLINE: "Online", CARD: "Card", CHEQUE: "Cheque" };

function exportCsv(rows: Array<Record<string, string | number>>, filename: string) {
    const headers = ["Date", "Source", "Category", "Amount", "Payment Mode", "Cheque Number", "Added By"];
    const values = rows.map((row) => [row.date, row.source, row.category, row.amount, row.paymentMode, row.chequeNumber, row.addedBy]);
    const blob = new Blob([[headers, ...values].map((row) => row.map((value) => `"${value ?? ""}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${filename}.csv`; link.click(); URL.revokeObjectURL(url);
}

export default function SuperAdminIncomePage() {
    const { data = [], isLoading, refetch } = useGetSuperAdminIncomesQuery();
    const [createIncome, { isLoading: isSaving }] = useCreateSuperAdminIncomeMutation();
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"all" | "day" | "month">("all");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), source: "", amount: 0, category: "Donations", paymentMode: "Cash", chequeNumber: "" });

    const income = data.map((item) => ({
        id: item.id, date: new Date(item.date).toISOString().slice(0, 10), source: item.source, amount: item.amount,
        category: categoryToUi[item.category] ?? item.category, addedBy: item.addedBy,
        paymentMode: paymentToUi[item.paymentMode] ?? item.paymentMode, chequeNumber: item.chequeNumber ?? "",
    }));
    const filtered = income.filter((item) => item.source.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => {
        if (sortBy === "day") return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === "month") return b.date.slice(0, 7).localeCompare(a.date.slice(0, 7));
        return 0;
    });
    const total = filtered.reduce((sum, item) => sum + item.amount, 0);

    const save = async () => {
        try {
            await createIncome({ date: form.date, source: form.source, amount: form.amount, category: categoryToApi[form.category] ?? "OTHER", categoryName: form.category === "Other" ? form.source : undefined, paymentMode: paymentToApi[form.paymentMode] ?? "CASH", addedBy: "Super Admin", chequeNumber: form.paymentMode === "Cheque" ? form.chequeNumber || undefined : undefined }).unwrap();
            toast.success("Income created successfully!");
            setShowModal(false); setForm({ date: new Date().toISOString().slice(0, 10), source: "", amount: 0, category: "Donations", paymentMode: "Cash", chequeNumber: "" }); refetch();
        } catch { toast.error("Failed to save income."); }
    };

    return <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4"><div><h1 className="text-3xl font-bold text-gray-800">Income Management</h1><p className="text-gray-500 mt-1">Track income sources other than student fees</p></div><div className="flex gap-3"><Tooltip content="Export to Excel" side="left"><button onClick={() => exportCsv(filtered, `income-${new Date().toISOString().slice(0, 10)}`)} className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"><Download size={18} /><span>Export Excel</span></button></Tooltip><Tooltip content="Add New Income" side="left"><button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md hover:shadow-lg"><PlusCircle size={20} /><span>Add Income</span></button></Tooltip></div></div>
        <div className="flex gap-4 items-center"><div className="flex-1 relative"><Search size={18} className="absolute left-3 top-3 text-gray-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by source or category..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800" /></div><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"><option value="all">All</option><option value="day">Sort by Day</option><option value="month">Sort by Month</option></select></div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white"><div className="flex items-center justify-between"><div><p className="text-amber-100 text-sm font-medium">Total Income (Other than Fees)</p><h2 className="text-4xl font-bold mt-2">₹{total.toLocaleString()}</h2><p className="text-amber-100 text-sm mt-2">{filtered.length} entries</p></div><div className="bg-white/20 p-4 rounded-lg"><IndianRupee size={48} /></div></div></div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-amber-500"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr>{["Date", "Source", "Category", "Amount", "Payment Mode", "Cheque No.", "Added By"].map((heading) => <th key={heading} className="text-left p-4 font-semibold text-gray-700">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-100">{isLoading ? <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" /></td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-500">No income entries yet. Click “Add Income” to create one.</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-gray-50 transition-colors"><td className="p-4 text-sm text-gray-600">{new Date(item.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td><td className="p-4 text-sm font-medium text-gray-900">{item.source}</td><td className="p-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{item.category}</span></td><td className="p-4 text-sm font-bold text-green-600">₹{item.amount.toLocaleString()}</td><td className="p-4 text-sm text-gray-600">{item.paymentMode}</td><td className="p-4 text-sm text-gray-600">{item.chequeNumber ? <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{item.chequeNumber}</span> : <span className="text-gray-300">—</span>}</td><td className="p-4 text-sm text-gray-600">{item.addedBy}</td></tr>)}</tbody></table></div></div>
        {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between rounded-t-xl bg-amber-600 p-6 text-white"><h2 className="text-2xl font-bold">Add Income</h2><button onClick={() => setShowModal(false)} className="rounded-lg p-2 hover:bg-amber-700"><X size={24} /></button></div><div className="space-y-4 p-6"><Field label="Date"><div className="relative"><Calendar size={18} className="absolute left-3 top-2.5 text-gray-400" /><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500" /></div></Field><Field label="Source"><input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="e.g., Annual Day Event" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" /></Field><Field label="Category"><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Amount"><div className="relative"><IndianRupee size={18} className="absolute left-3 top-2.5 text-gray-400" /><input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500" /></div></Field><Field label="Payment Mode"><select value={form.paymentMode} onChange={(event) => setForm({ ...form, paymentMode: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">{Object.keys(paymentToApi).map((item) => <option key={item}>{item}</option>)}</select></Field>{form.paymentMode === "Cheque" && <Field label="Cheque Number"><input value={form.chequeNumber} onChange={(event) => setForm({ ...form, chequeNumber: event.target.value })} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" /></Field>}</div><div className="flex justify-end gap-3 rounded-b-xl border-t bg-gray-50 p-6"><button onClick={() => setShowModal(false)} className="rounded-lg border-2 border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-100">Cancel</button><button onClick={save} disabled={isSaving || !form.source || form.amount <= 0 || (form.paymentMode === "Cheque" && !form.chequeNumber)} className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isSaving ? "Saving..." : "Save"}</button></div></div></div>}
    </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-gray-700"><span className="mb-2 block">{label} <span className="text-red-500">*</span></span>{children}</label>; }
