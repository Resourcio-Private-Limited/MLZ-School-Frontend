"use client";

import { IndianRupee, Download, Clock, CheckCircle, AlertCircle, Calendar, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function TeacherSalaryPage() {
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    // Mock salary data
    const salaryData = [
        {
            id: "OCT-2024",
            month: "October 2024",
            creditDate: "2024-10-31",
            status: "Processing",
            breakdown: {
                basic: 45000,
                hra: 15000,
                allowances: 5000,
                deductions: 2500 // PF, Tax, etc.
            },
            netPay: 62500
        },
        {
            id: "SEP-2024",
            month: "September 2024",
            creditDate: "2024-09-30",
            status: "Credited",
            transactionId: "SAL-2024-009",
            breakdown: {
                basic: 45000,
                hra: 15000,
                allowances: 5000,
                deductions: 2500
            },
            netPay: 62500
        },
        {
            id: "AUG-2024",
            month: "August 2024",
            creditDate: "2024-08-31",
            status: "Credited",
            transactionId: "SAL-2024-008",
            breakdown: {
                basic: 45000,
                hra: 15000,
                allowances: 5000,
                deductions: 2500
            },
            netPay: 62500
        },
        {
            id: "JUL-2024",
            month: "July 2024",
            creditDate: "2024-07-31",
            status: "Credited",
            transactionId: "SAL-2024-007",
            breakdown: {
                basic: 45000,
                hra: 15000,
                allowances: 8000, // Bonus
                deductions: 2500
            },
            netPay: 65500
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <div className="bg-emerald-500 p-3 rounded-xl shadow-lg shadow-emerald-100">
                    <IndianRupee className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Salary & Payslips</h1>
                    <p className="text-gray-500">View salary history and download payslips</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Salary List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="text-emerald-500" size={24} />
                                Salary History
                            </h2>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {salaryData.map((data) => (
                                <div key={data.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            {data.status === "Credited" ? (
                                                <CheckCircle size={24} className="text-emerald-500" />
                                            ) : (
                                                <Clock size={24} className="text-orange-400" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{data.month}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {data.status === "Credited" ? `Credited on ${data.creditDate}` : `Expected by ${data.creditDate}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-800">₹ {data.netPay.toLocaleString()}</div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${data.status === "Credited" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                                                        }`}>
                                                        {data.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Breakdown */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50 p-3 rounded-lg text-sm border border-gray-100">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 flex items-center"><TrendingUp size={14} className="mr-1 text-emerald-600" /> Earnings</span>
                                                    <span className="font-medium">₹ {(data.breakdown.basic + data.breakdown.hra + data.breakdown.allowances).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500 flex items-center"><TrendingDown size={14} className="mr-1 text-red-600" /> Deductions</span>
                                                    <span className="font-medium text-red-600">- ₹ {data.breakdown.deductions.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Action for Credited items */}
                                            {data.status === "Credited" && (
                                                <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                                                    <span className="text-xs text-gray-400 mr-2">Ref: {data.transactionId}</span>
                                                    <button className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors">
                                                        <Download size={16} /> Download Payslip
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

                {/* Right Column: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <IndianRupee className="text-emerald-500" size={24} />
                            Overview
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-sm text-emerald-800 mb-1">Last Net Pay</p>
                                <p className="text-2xl font-bold text-emerald-900">₹ 62,500</p>
                                <p className="text-xs text-emerald-700 mt-1">September 2024</p>
                            </div>

                            <div className="flex justify-between items-center text-gray-600 pt-4">
                                <span>Financial Year</span>
                                <span className="font-medium">2024-2025</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Tax Regime</span>
                                <span className="font-medium">New Regime</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2">
                                <AlertCircle size={16} />
                                Need Help?
                            </h3>
                            <p className="text-xs text-gray-600 mb-3">
                                Detailed breakdown of tax deductions (TDS) and PF contributions is available in the payslip.
                            </p>
                            <button className="text-xs text-blue-600 font-medium hover:underline">
                                Contact Accounts Department
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
