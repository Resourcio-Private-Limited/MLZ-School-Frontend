"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Clock, IndianRupee } from "lucide-react";
import { useGetMonthlyFeesQuery } from "@/redux/api/studentApi";

function formatDate(dateStr: string | Date | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

function getStatusBadge(isPaid: boolean, paidAmount: number, totalAmount: number) {
    if (isPaid) return <span className="flex items-center text-green-600 text-xs font-bold"><CheckCircle size={14} className="mr-1" /> Paid</span>;
    if (paidAmount > 0) return <span className="flex items-center text-yellow-600 text-xs font-bold"><Clock size={14} className="mr-1" /> Partial</span>;
    return <span className="flex items-center text-red-600 text-xs font-bold"><AlertCircle size={14} className="mr-1" /> Due</span>;
}

export default function StudentFeesPage() {
    const [authUser, setAuthUser] = useState<Record<string, any>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem("authUser");
                setAuthUser(raw ? JSON.parse(raw) : {});
            } catch {
                setAuthUser({});
            }
        }
    }, []);

    const { data: fees = [], isLoading } = useGetMonthlyFeesQuery(undefined, {
        skip: !authUser?.id,
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const totalPaid = fees
        .filter(f => f.isPaid)
        .reduce((sum, f) => sum + f.paidAmount, 0);

    const currentDue = fees.find(f => f.month === currentMonth && f.year === currentYear);
    const totalDue = currentDue
        ? currentDue.tuitionFees + currentDue.annualCharges + currentDue.transportFees + currentDue.otherFees + currentDue.penalty - currentDue.discount
        : 0;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Fees & Payments</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Total Paid</h2>
                    <div className="text-3xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
                    <p className="text-xs text-gray-400 mt-1">All time</p>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Current Month Due</h2>
                    <div className="text-3xl font-bold text-red-600">₹{totalDue.toLocaleString()}</div>
                    <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center items-center text-center">
                    <h2 className="text-gray-500 font-medium mb-1 text-sm">Outstanding</h2>
                    <div className="text-3xl font-bold text-amber-600">
                        ₹{fees.filter(f => !f.isPaid).reduce((sum, f) => sum + (f.tuitionFees + f.annualCharges + f.transportFees + f.otherFees - f.discount), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Unpaid records</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Fee History</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-400">Loading fees...</div>
                ) : fees.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No fee records found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="p-4">Month</th>
                                    <th className="p-4 text-right">Tuition</th>
                                    <th className="p-4 text-right">Annual</th>
                                    <th className="p-4 text-right">Transport</th>
                                    <th className="p-4 text-right">Other</th>
                                    <th className="p-4 text-right">Discount</th>
                                    <th className="p-4 text-right">Penalty</th>
                                    <th className="p-4 text-right">Total</th>
                                    <th className="p-4 text-right">Paid</th>
                                    <th className="p-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {fees.map(fee => {
                                    const total = fee.tuitionFees + fee.annualCharges + fee.transportFees + fee.otherFees - fee.discount;
                                    return (
                                        <tr key={fee.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm font-medium text-gray-900">
                                                {new Date(currentYear, fee.month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}
                                            </td>
                                            <td className="p-4 text-sm text-right text-gray-700">₹{fee.tuitionFees}</td>
                                            <td className="p-4 text-sm text-right text-purple-600">₹{fee.annualCharges}</td>
                                            <td className="p-4 text-sm text-right text-blue-600">{fee.transportFees > 0 ? `₹${fee.transportFees}` : '—'}</td>
                                            <td className="p-4 text-sm text-right text-gray-700">{fee.otherFees > 0 ? `₹${fee.otherFees}` : '—'}</td>
                                            <td className="p-4 text-sm text-right text-green-600">{fee.discount > 0 ? `₹${fee.discount}` : '—'}</td>
                                            <td className="p-4 text-sm text-right text-red-600">{fee.penalty > 0 ? `₹${fee.penalty}` : '—'}</td>
                                            <td className="p-4 text-sm text-right font-bold text-gray-900">
                                                {fee.isPaid ? '₹0' : `₹${total > 0 ? total : 0}`}
                                            </td>
                                            <td className="p-4 text-sm text-right text-green-600">
                                                {fee.paidAmount > 0 ? `₹${fee.paidAmount}` : '—'}
                                            </td>
                                            <td className="p-4">{getStatusBadge(fee.isPaid, fee.paidAmount, total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}