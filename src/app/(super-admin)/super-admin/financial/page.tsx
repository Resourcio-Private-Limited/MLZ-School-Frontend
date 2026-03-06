"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Download, FileText } from "lucide-react";

export default function FinancialOverviewPage() {
    const [selectedMonth, setSelectedMonth] = useState("2024-01");

    // Mock data - same as accounts portal analysis page (view-only)
    const monthlyData = {
        "2024-01": {
            studentFees: 2500000,
            otherIncome: 240000,
            totalIncome: 2740000,
            expenses: {
                salaries: 500000,
                utilities: 33000,
                maintenance: 15000,
                supplies: 12000,
                other: 8000
            },
            totalExpenses: 568000,
            netBalance: 2172000
        },
        "2023-12": {
            studentFees: 2400000,
            otherIncome: 180000,
            totalIncome: 2580000,
            expenses: {
                salaries: 500000,
                utilities: 30000,
                maintenance: 20000,
                supplies: 15000,
                other: 10000
            },
            totalExpenses: 575000,
            netBalance: 2005000
        }
    };

    const currentData = monthlyData[selectedMonth as keyof typeof monthlyData] || monthlyData["2024-01"];
    const previousMonth = selectedMonth === "2024-01" ? "2023-12" : "2024-01";
    const previousData = monthlyData[previousMonth as keyof typeof monthlyData];

    const incomeChange = ((currentData.totalIncome - previousData.totalIncome) / previousData.totalIncome * 100).toFixed(1);
    const expenseChange = ((currentData.totalExpenses - previousData.totalExpenses) / previousData.totalExpenses * 100).toFixed(1);
    const netChange = ((currentData.netBalance - previousData.netBalance) / previousData.netBalance * 100).toFixed(1);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Financial Overview</h1>
                    <p className="text-gray-500 mt-1">View-only access to profit & loss reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={20} />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none font-medium"
                    >
                        <option value="2024-01">January 2024</option>
                        <option value="2023-12">December 2023</option>
                    </select>
                    <button className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-md hover:shadow-lg font-medium">
                        <Download size={18} />
                        <span>Export Report</span>
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <FileText className="text-blue-600 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-semibold text-blue-800">Read-Only Access</p>
                        <p className="text-sm text-blue-700 mt-1">
                            You have view-only access to financial data. To make changes, please contact the Accounts department.
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Income */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-green-50">
                            <TrendingUp size={24} className="text-green-600" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${Number(incomeChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(incomeChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(incomeChange))}%
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Total Income</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">₹{currentData.totalIncome.toLocaleString()}</h2>
                    <p className="text-gray-500 text-xs mt-2">vs previous month</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-red-50">
                            <TrendingDown size={24} className="text-red-600" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${Number(expenseChange) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Number(expenseChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(expenseChange))}%
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">₹{currentData.totalExpenses.toLocaleString()}</h2>
                    <p className="text-gray-500 text-xs mt-2">vs previous month</p>
                </div>

                {/* Net Balance */}
                <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${currentData.netBalance >= 0 ? 'border-blue-500' : 'border-amber-500'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${currentData.netBalance >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                            <DollarSign size={24} className={currentData.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${Number(netChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(netChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(netChange))}%
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Net Balance (P&L)</p>
                    <h2 className={`text-3xl font-bold mt-2 ${currentData.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>₹{currentData.netBalance.toLocaleString()}</h2>
                    <p className="text-gray-500 text-xs mt-2">
                        {currentData.netBalance >= 0 ? 'Profit' : 'Loss'}
                    </p>
                </div>
            </div>
        </div>
    );
}
