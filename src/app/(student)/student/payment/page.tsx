"use client";

import { useState, useEffect } from "react";
import { CreditCard, Download, CheckCircle, AlertCircle, Calendar, FileText, CheckSquare, Square, Loader2 } from "lucide-react";
import { useGetMonthlyFeesQuery, useCreateRazorpayOrderMutation, useConfirmStudentPaymentMutation } from "@/redux/api/studentApi";
import type { MonthlyFeeRecord } from "@/redux/api/studentApi";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function formatMonth(month: number, year: number) {
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

function toDateString(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function feeId(record: MonthlyFeeRecord) {
    return `${record.year}-${String(record.month).padStart(2, "0")}`;
}

export default function PaymentPage() {
    const { data: fees = [], isLoading, refetch } = useGetMonthlyFeesQuery();
    const [createOrder, { isLoading: creatingOrder }] = useCreateRazorpayOrderMutation();
    const [confirmPayment] = useConfirmStudentPaymentMutation();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [payingMonths, setPayingMonths] = useState<string[]>([]);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Pre-load Razorpay checkout.js script on mount
    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectedTotal = fees
        .filter(f => selectedIds.includes(feeId(f)))
        .reduce((sum, f) => sum + f.totalAmount, 0);

    const handlePay = async () => {
        if (selectedIds.length === 0 || selectedTotal <= 0) return;

        try {
            setPayingMonths([...selectedIds]);

            const selectedRecords = fees.filter(f => selectedIds.includes(feeId(f)));
            const firstRecord = selectedRecords[0];

            const order = await createOrder({
                month: firstRecord.month,
                year: firstRecord.year,
                amount: selectedTotal,
            }).unwrap();

            const rzpay = new (window as any).Razorpay({
                key: "rzp_test_JOC0wRKpLH1cVW",
                amount: order.amount, // backend returns paise
                currency: order.currency,
                name: "MLZ School",
                description: `Monthly Fees — ${selectedIds.join(", ")}`,
                order_id: order.orderId,
                receipt: order.receipt,
                prefill: {
                    name: "Test Student",
                    email: "student@mlz.com",
                    contact: "9999999999",
                },
                // Disable saved cards, wallets, and bank suggestions to prevent
                // Razorpay from loading card/wallet images from localhost addresses
                // (localhost:37857, localhost:7070) which cause CORS/connection failures
                // and cascade into validate/account 500 errors
                disable: {
                    debitCards: false,
                    creditCards: false,
                    netBanking: false,
                    wallets: ['all'],
                    emi: false,
                    cards: ['saved'],
                },
                config: {
                    display: {
                        readonly: {
                            contact: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string }) => {
                    await Promise.all(
                        selectedRecords.map(r =>
                            confirmPayment({
                                month: r.month,
                                year: r.year,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                            }).unwrap()
                        )
                    );
                    setSelectedIds([]);
                    setPayingMonths([]);
                    setPaymentSuccess(true);
                    refetch();
                },
                modal: {
                    ondismiss: () => {
                        setPayingMonths([]);
                    },
                },
                onerror: (error: any) => {
                    console.error("Razorpay error:", error);
                    setPayingMonths([]);
                },
            });

            rzpay.open();
        } catch (err) {
            setPayingMonths([]);
        }
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

            {paymentSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="text-emerald-600 shrink-0" size={20} />
                    <p className="text-emerald-800 font-medium">
                        Payment successful! Your fee has been recorded. Thank you.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Monthly Breakdown */}
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
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : fees.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No fee records found. Your fees will appear here once created by the school.
                                </div>
                            ) : (
                                fees.map((record) => {
                                    const id = feeId(record);
                                    const isSelected = selectedIds.includes(id);
                                    const isPending = !record.isPaid;
                                    const isPaying = payingMonths.includes(id);

                                    return (
                                        <div key={id} className={`p-6 transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                                            <div className="flex items-start gap-4">
                                                {/* Selection Checkbox */}
                                                <div className="pt-1">
                                                    {isPending ? (
                                                        <button
                                                            onClick={() => toggleSelection(id)}
                                                            className="text-blue-500 hover:text-blue-600 transition-colors"
                                                        >
                                                            {isSelected
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
                                                            <h3 className="text-lg font-bold text-slate-800">
                                                                {formatMonth(record.month, record.year)}
                                                            </h3>
                                                            <p className="text-sm text-slate-500">
                                                                {record.isPaid ? "Paid" : "Pending"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-slate-800">
                                                                ₹ {record.totalAmount > 0 ? record.totalAmount.toLocaleString() : "0"}
                                                            </div>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                                                record.isPaid
                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}>
                                                                {record.isPaid ? "Paid" : "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Fee Breakdown */}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 bg-white border border-slate-200 p-3 rounded-lg text-sm shadow-sm">
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Tuition</span>
                                                            <span className="font-medium text-slate-700">
                                                                ₹ {record.tuitionFees.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Annual</span>
                                                            <span className="font-medium text-slate-700">
                                                                ₹ {record.annualCharges > 0 ? record.annualCharges.toLocaleString() : "—"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Transport</span>
                                                            <span className="font-medium text-slate-700">
                                                                {record.transportFees > 0 ? `₹ ${record.transportFees.toLocaleString()}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Penalty</span>
                                                            <span className={`font-medium ${record.penalty > 0 ? "text-red-600" : "text-slate-700"}`}>
                                                                {record.penalty > 0 ? `₹ ${record.penalty.toLocaleString()}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Other Fees</span>
                                                            <span className="font-medium text-slate-700">
                                                                {record.otherFees > 0 ? `₹ ${record.otherFees.toLocaleString()}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Discount</span>
                                                            <span className={`font-medium ${record.discount > 0 ? "text-green-600" : "text-slate-700"}`}>
                                                                {record.discount > 0 ? `₹ ${record.discount.toLocaleString()}` : "—"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Total</span>
                                                            <span className="font-medium text-slate-700">
                                                                ₹ {record.totalAmount > 0 ? record.totalAmount.toLocaleString() : "0"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-500 block text-xs uppercase tracking-wide">Paid</span>
                                                            <span className="font-medium text-emerald-600">
                                                                {record.paidAmount > 0 ? `₹ ${record.paidAmount.toLocaleString()}` : "—"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Paid — receipt */}
                                                    {record.isPaid && (
                                                        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                                                            <span className="text-slate-500">
                                                                Paid on {toDateString(record.paidAt)}
                                                            </span>
                                                            {record.receiptUrl && (
                                                                <a
                                                                    href={record.receiptUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                                                                >
                                                                    <Download size={14} /> Receipt
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Paying spinner */}
                                                    {isPaying && (
                                                        <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm">
                                                            <Loader2 size={14} className="animate-spin" />
                                                            Processing payment...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
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
                                <span className="font-medium">{selectedIds.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-dashed border-slate-200">
                                <span className="text-slate-800">Total Payable</span>
                                <span className="text-blue-600">₹ {selectedTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={handlePay}
                            disabled={selectedIds.length === 0 || creatingOrder || payingMonths.length > 0}
                            className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all duration-300 ${
                                selectedIds.length > 0 && !creatingOrder && payingMonths.length === 0
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 transform hover:-translate-y-1"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                        >
                            {creatingOrder || payingMonths.length > 0
                                ? <Loader2 size={18} className="animate-spin" />
                                : null}
                            {creatingOrder || payingMonths.length > 0
                                ? "Please wait..."
                                : `Pay ₹ ${selectedTotal.toLocaleString()}`}
                        </button>

                        <p className="text-xs text-center text-slate-400 mt-4">
                            Secure payment via Razorpay
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Note
                        </h3>
                        <ul className="space-y-2 text-xs text-blue-800/80">
                            <li>• Please select all overdue months before current month.</li>
                            <li>• &apos;Other Fees&apos; includes Lab, Library, and Activity charges.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        document.body.appendChild(script);
    });
}
