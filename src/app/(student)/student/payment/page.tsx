"use client";

import { CreditCard, Download, Clock, CheckCircle, AlertCircle, Calendar, FileText, CheckSquare, Square } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function PaymentPage() {
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    // Unified payment data structure
    const allMonthsData = [
        {
            id: "OCT-2024",
            month: "October 2024",
            dueDate: "2024-10-15",
            status: "Pending",
            fees: {
                regular: 3500,
                other: 500, // Merged Other Fees
                late: 0
            },
            total: 4000
        },
        {
            id: "SEP-2024",
            month: "September 2024",
            dueDate: "2024-09-15",
            status: "Paid",
            paidDate: "2024-09-10",
            receiptId: "RCPT-2024-009",
            fees: {
                regular: 3500,
                other: 500,
                late: 0
            },
            total: 4000
        },
        {
            id: "AUG-2024",
            month: "August 2024",
            dueDate: "2024-08-15",
            status: "Paid",
            paidDate: "2024-08-12",
            receiptId: "RCPT-2024-008",
            fees: {
                regular: 3500,
                other: 500,
                late: 0
            },
            total: 4000
        },
        {
            id: "JUL-2024",
            month: "July 2024",
            dueDate: "2024-07-15",
            status: "Pending", // Example of overdue previous month
            fees: {
                regular: 3500,
                other: 1500, // Higher other fees
                late: 150
            },
            total: 5150
        }
    ];

    const toggleMonthSelection = (id: string) => {
        if (selectedMonths.includes(id)) {
            setSelectedMonths(selectedMonths.filter(m => m !== id));
        } else {
            setSelectedMonths([...selectedMonths, id]);
        }
    };

    const calculateTotalPayable = () => {
        return allMonthsData
            .filter(data => selectedMonths.includes(data.id))
            .reduce((sum, data) => sum + data.total, 0);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                    <CreditCard className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Fee Payment</h1>
                    <p className="text-slate-500">Manage fees and view payment history</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Unified Payment List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-500">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-600" size={24} />
                                Monthly Breakdown
                            </h2>
                            <div className="text-sm font-medium text-slate-500">
                                Select months to pay
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {allMonthsData.map((data) => (
                                <div key={data.id} className={`p-6 transition-colors ${selectedMonths.includes(data.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-start gap-4">
                                        {/* Selection Checkbox (Only for Pending) */}
                                        <div className="pt-1">
                                            {data.status === "Pending" ? (
                                                <button
                                                    onClick={() => toggleMonthSelection(data.id)}
                                                    className="text-blue-500 hover:text-blue-600 transition-colors"
                                                >
                                                    {selectedMonths.includes(data.id)
                                                        ? <CheckSquare size={24} />
                                                        : <Square size={24} />}
                                                </button>
                                            ) : (
                                                <CheckCircle size={24} className="text-emerald-500" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">{data.month}</h3>
                                                    <p className="text-sm text-slate-500">Due: {data.dueDate}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-slate-800">₹ {data.total}</div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${data.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                                        }`}>
                                                        {data.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Fee Breakdown */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 bg-white border border-slate-200 p-3 rounded-lg text-sm shadow-sm">
                                                <div>
                                                    <span className="text-slate-500 block text-xs uppercase tracking-wide">Regular Fees</span>
                                                    <span className="font-medium text-slate-700">₹ {data.fees.regular}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block text-xs uppercase tracking-wide">Other Fees</span>
                                                    <span className="font-medium text-slate-700">₹ {data.fees.other}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500 block text-xs uppercase tracking-wide">Late Fees</span>
                                                    <span className={`font-medium ${data.fees.late > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {data.fees.late > 0 ? `₹ ${data.fees.late}` : 'Nil'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action for Paid items */}
                                            {data.status === "Paid" && (
                                                <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                                                    <span className="text-slate-500">Paid on {data.paidDate}</span>
                                                    <button className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium">
                                                        <Download size={14} /> Receipt
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payment Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600 sticky top-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <CreditCard className="text-blue-600" size={24} />
                            Payment Summary
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Selected Months</span>
                                <span className="font-medium">{selectedMonths.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-dashed border-slate-200">
                                <span className="text-slate-800">Total Payable</span>
                                <span className="text-blue-600">₹ {calculateTotalPayable()}</span>
                            </div>
                        </div>

                        <button
                            disabled={selectedMonths.length === 0}
                            className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all duration-300 ${selectedMonths.length > 0
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 transform hover:-translate-y-1"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            Pay ₹ {calculateTotalPayable()}
                        </button>

                        <p className="text-xs text-center text-slate-400 mt-4">
                            Secure payment via UPI, Card, or Net Banking
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Note
                        </h3>
                        <ul className="space-y-2 text-xs text-blue-800/80">
                            <li>• Please select all overdue months before current month.</li>
                            <li>• 'Other Fees' includes Lab, Library, and Activity charges.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
