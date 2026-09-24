"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, CheckSquare, CreditCard, Download, Eye, FileText, Loader2, Square, X } from "lucide-react";
import { MonthlyFeeRecord, PaymentReceipt, useCreateRazorpayOrderMutation, useConfirmStudentPaymentMutation, useGetMonthlyFeesQuery, useGetPaymentReceiptQuery } from "@/redux/api/studentApi";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const money = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export default function PaymentPage() {
    const year = new Date().getFullYear();
    const { data, isLoading, refetch } = useGetMonthlyFeesQuery(year);
    const [createOrder, { isLoading: creatingOrder }] = useCreateRazorpayOrderMutation();
    const [confirmPayment] = useConfirmStudentPaymentMutation();
    const [selected, setSelected] = useState<number[]>([]);
    const [annualContributions, setAnnualContributions] = useState<Record<number, number>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

    useEffect(() => { void loadRazorpayScript(); }, []);
    const selectedFees = useMemo(() => data?.fees.filter((fee) => selected.includes(fee.month)) ?? [], [data, selected]);
    const flexibleAnnual = selectedFees.reduce((sum, fee) => sum + (fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0)), 0);
    const selectedTotal = selectedFees.reduce((sum, fee) => sum + fee.totalAmount + (fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0)), 0);
    const remainingAfterSelection = Math.max(0, (data?.annualSummary.remaining ?? 0) - flexibleAnnual);
    const toggleMonth = (month: number) => setSelected((current) => current.includes(month) ? current.filter((m) => m !== month) : [...current, month]);

    const pay = async () => {
        if (!data || !selectedFees.length || selectedTotal <= 0) return;
        if (flexibleAnnual > data.annualSummary.remaining) return setMessage("Annual installments cannot exceed the remaining annual balance.");
        try {
            const order = await createOrder({ year, items: selectedFees.map((fee) => ({ month: fee.month, annualContribution: fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0) })) }).unwrap();
            const Razorpay = (window as any).Razorpay;
            if (!Razorpay) throw new Error("Razorpay checkout is unavailable");
            new Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_JOC0wRKpLH1cVW", amount: order.amount, currency: order.currency,
                name: "MLZ School", description: `Fees for ${selectedFees.map((fee) => MONTHS[fee.month - 1]).join(", ")}`, order_id: order.orderId,
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    const paidReceipt = await confirmPayment({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }).unwrap();
                    setReceipt(paidReceipt);
                    setSelected([]); setAnnualContributions({}); setMessage("Payment successful. Your selected months are now marked paid."); refetch();
                }, theme: { color: "#2563eb" },
            }).open();
        } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to begin payment. Please try again."); }
    };

    const annual = data?.annualSummary;
    return <div className="space-y-6">
        <div className="flex items-center gap-4"><div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg"><CreditCard size={26} /></div><div><h1 className="text-3xl font-bold text-slate-800">Fee Payment</h1><p className="text-slate-500">Select one or more monthly fees to pay together.</p></div></div>
        {message && <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><CheckCircle size={20} className="shrink-0" />{message}</div>}
        {receipt && <PaymentReceiptPreview receipt={receipt} />}
        {data?.fees.some((fee) => fee.isPaid && fee.paymentId) && <PaidReceipts fees={data.fees} year={year} />}
        {annual && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-bold text-amber-950"><Calendar size={19} />Annual fees</h2><p className="mt-1 text-sm text-amber-800">Total {money(annual.total)} · Paid {money(annual.paid)} · Remaining {money(annual.remaining)}</p></div><div className="text-right text-sm font-medium text-amber-900">{annual.expiryDate ? <>Expiry: {new Date(annual.expiryDate).toLocaleDateString("en-IN")}</> : "Expiry date awaiting accountant configuration"}{annual.isOverdue && <p className="mt-1 text-red-700">Outstanding balance is now required with the next unpaid month.</p>}</div></div></div>}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2"><div className="flex items-center justify-between border-b p-5"><h2 className="flex items-center gap-2 text-xl font-bold text-slate-800"><FileText size={21} className="text-blue-600" />Monthly fees — {year}</h2><span className="text-sm text-slate-500">Configured by the accountant</span></div><div className="divide-y divide-slate-100">{isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div> : data?.fees.map((fee) => { const active = selected.includes(fee.month); const canSelect = !fee.isPaid && fee.totalAmount > 0; return <div key={fee.month} className={`p-5 ${active ? "bg-blue-50/70" : ""}`}><div className="flex gap-3"><button disabled={!canSelect} onClick={() => toggleMonth(fee.month)} className="mt-1 text-blue-600 disabled:text-emerald-500">{fee.isPaid ? <CheckCircle size={22} /> : active ? <CheckSquare size={22} /> : <Square size={22} />}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold text-slate-800">{MONTHS[fee.month - 1]} {year}</h3><p className={fee.isPaid ? "text-sm text-emerald-700" : "text-sm text-amber-700"}>{fee.isPaid ? "Paid" : "Pending"}</p></div><strong className="text-slate-900">{money(fee.totalAmount)}</strong></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><Detail label="Tuition" value={fee.tuitionFees} /><Detail label="Transport" value={fee.transportFees} /><Detail label="Penalty" value={fee.penalty} tone={fee.penalty ? "text-red-600" : undefined} /><Detail label="Other fees" value={fee.otherFees} /></div>{active && !fee.annualContributionRequired && annual && annual.remaining > 0 && !annual.isOverdue && <label className="mt-4 block text-sm font-medium text-slate-700">Annual-fee installment <span className="font-normal text-slate-500">(remaining: {money(remainingAfterSelection)})</span><input min="0" max={annual.remaining} step="0.01" type="number" value={annualContributions[fee.month] ?? ""} onChange={(event) => setAnnualContributions((current) => ({ ...current, [fee.month]: Number(event.target.value) }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0" /></label>}{fee.annualContributionRequired > 0 && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-800">Annual balance required with this month: {money(fee.annualContributionRequired)}</p>}</div></div></div>})}</div></section>
            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-800">Payment summary</h2><p className="mt-2 text-sm text-slate-500">{selectedFees.length} month(s) selected</p><div className="mt-5 border-y py-4"><div className="flex justify-between text-sm text-slate-600"><span>Monthly fees</span><span>{money(selectedFees.reduce((sum, fee) => sum + fee.totalAmount, 0))}</span></div><div className="mt-2 flex justify-between text-sm text-slate-600"><span>Annual installments</span><span>{money(flexibleAnnual)}</span></div><div className="mt-3 flex justify-between text-lg font-bold text-slate-900"><span>Total</span><span>{money(selectedTotal)}</span></div></div><button disabled={!selectedFees.length || creatingOrder || selectedTotal <= 0} onClick={pay} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{creatingOrder && <Loader2 className="animate-spin" size={18} />}Pay securely</button><p className="mt-3 flex gap-2 text-xs text-slate-500"><AlertCircle size={15} />The server recalculates the final payable amount.</p></aside></div>
    </div>;
}
function Detail({ label, value, tone }: { label: string; value: number; tone?: string }) { return <div><span className="block text-xs uppercase tracking-wide text-slate-500">{label}</span><span className={tone ?? "font-medium text-slate-700"}>{money(value)}</span></div>; }
function PaidReceipts({ fees, year }: { fees: MonthlyFeeRecord[]; year: number }) {
    const paidFees = fees.filter((fee) => fee.isPaid && fee.paymentId);
    return <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><h2 className="font-bold text-emerald-950">Paid monthly receipts</h2><div className="mt-3 divide-y divide-emerald-100 rounded-lg border border-emerald-100 bg-white">{paidFees.map((fee) => <PaidReceiptActions key={fee.month} fee={fee} year={year} />)}</div></section>;
}
function PaidReceiptActions({ fee, year }: { fee: MonthlyFeeRecord; year: number }) {
    const { data: receipt, isLoading } = useGetPaymentReceiptQuery(fee.paymentId!, { skip: !fee.paymentId });
    const [showReceipt, setShowReceipt] = useState(false);
    const download = () => {
        if (!receipt) return;
        const url = URL.createObjectURL(new Blob([receipt.svg], { type: "image/svg+xml;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `MLZ-${MONTHS[fee.month - 1]}-${year}-receipt.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };
    return <><div className="flex flex-wrap items-center justify-between gap-3 p-3"><span className="font-medium text-slate-800">{MONTHS[fee.month - 1]} {year}</span><div className="flex items-center gap-3">{isLoading ? <Loader2 size={16} className="animate-spin text-emerald-700" /> : <><button disabled={!receipt} onClick={() => setShowReceipt(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400"><Eye size={16} />View</button><button disabled={!receipt} onClick={download} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:text-slate-400"><Download size={16} />Download</button></>}</div></div>{showReceipt && receipt && <div className="border-t border-emerald-100 bg-slate-50 p-4"><div className="flex justify-end"><button onClick={() => setShowReceipt(false)} aria-label="Close receipt preview" className="text-slate-500 hover:text-slate-800"><X size={18} /></button></div><div className="mx-auto max-w-md overflow-auto rounded-lg bg-white p-2 shadow [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: receipt.svg }} /></div>}</>;
}
function PaymentReceiptPreview({ receipt }: { receipt: PaymentReceipt }) {
    const download = () => {
        const blob = new Blob([receipt.svg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `MLZ-payment-receipt-${receipt.receiptNumber}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };
    return <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-emerald-950">Payment receipt ready</h2><p className="text-sm text-emerald-800">Receipt {receipt.receiptNumber} · {money(receipt.total)}</p></div><button onClick={download} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"><Download size={17} />Download receipt</button></div><div className="mx-auto mt-5 max-w-md overflow-auto rounded-lg bg-white p-2 shadow [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: receipt.svg }} /></section>;
}
function loadRazorpayScript() { return new Promise<boolean>((resolve) => { if ((window as any).Razorpay) return resolve(true); const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); }); }
