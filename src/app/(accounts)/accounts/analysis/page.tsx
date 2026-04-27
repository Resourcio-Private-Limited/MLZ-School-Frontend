"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useGetProfitAndLossQuery } from "@/redux/api/accountsApi";

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

export default function AnalysisPage() {
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data: currentPL, isLoading: loadingCurrent } = useGetProfitAndLossQuery({
        month: selectedMonth,
        year: selectedYear,
    });

    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const { data: prevPL } = useGetProfitAndLossQuery({ month: prevMonth, year: prevYear });

    const calcChange = (curr: number, prev: number) => {
        if (!prev || prev === 0) return '0.0';
        return (((curr - prev) / prev) * 100).toFixed(1);
    };

    const incomeChange = currentPL && prevPL ? calcChange(currentPL.totalIncome, prevPL.totalIncome) : '0.0';
    const expenseChange = currentPL && prevPL ? calcChange(currentPL.totalExpenses, prevPL.totalExpenses) : '0.0';
    const netChange = currentPL && prevPL ? calcChange(currentPL.netBalance, prevPL.netBalance) : '0.0';

    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? '';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Financial Analysis</h1>
                    <p className="text-gray-500 mt-1">Monthly income and expense reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={20} />
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm text-gray-700"
                    >
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm text-gray-700"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loadingCurrent ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                </div>
            ) : currentPL ? (
                <>
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
                            <h2 className="text-3xl font-bold mt-2 text-gray-800">
                                ₹{currentPL.totalIncome.toLocaleString()}
                            </h2>
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
                            <h2 className="text-3xl font-bold mt-2 text-gray-800">
                                ₹{currentPL.totalExpenses.toLocaleString()}
                            </h2>
                            <p className="text-gray-500 text-xs mt-2">vs previous month</p>
                        </div>

                        {/* Net Balance */}
                        <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${currentPL.netBalance >= 0 ? 'border-blue-500' : 'border-amber-500'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${currentPL.netBalance >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                                    <DollarSign size={24} className={currentPL.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${Number(netChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Number(netChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(netChange))}%</div>
                            </div>
                            <p className="text-gray-600 text-sm font-medium">Net Balance (P&L)</p>
                            <h2 className={`text-3xl font-bold mt-2 ${currentPL.netBalance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                                ₹{currentPL.netBalance.toLocaleString()}
                            </h2>
                            <p className="text-gray-500 text-xs mt-2">
                                {currentPL.netBalance >= 0 ? 'Profit' : 'Loss'}
                            </p>
                        </div>
                    </div>

                    {/* Month Info */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
                        <p className="text-sm text-amber-800">
                            Showing data for <strong>{monthLabel} {selectedYear}</strong> — filtered from Income and Expense records.
                        </p>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No data available for {monthLabel} {selectedYear}.
                </div>
            )}
        </div>
    );
}
