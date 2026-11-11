"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, Download, Eye, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/apiError";
import {
    MonthlyFeeRecord,
    PaymentReceipt,
    useCreateRazorpayOrderMutation,
    useConfirmStudentPaymentMutation,
    useGetMonthlyFeesQuery,
    useGetPaymentReceiptQuery,
} from "@/redux/api/studentApi";
import { generatePaymentReceiptSvg } from "@/lib/paymentReceiptSvg";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "@/components/student/brand";
import { EASE_OUT, EmptyState, PageHeader, Skeleton, focusRing, inputClass, inr, longDate, primaryBtn, secondaryBtn } from "@/components/student/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };
const getRazorpay = () => (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;

type Filter = "all" | "due" | "paid";
const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All months" },
    { value: "due", label: "Due" },
    { value: "paid", label: "Paid" },
];

export default function PaymentPage() {
    const reduceMotion = useReducedMotion();
    const year = new Date().getFullYear();
    const { data, isLoading, isError, refetch } = useGetMonthlyFeesQuery(year);
    const [createOrder, { isLoading: creatingOrder }] = useCreateRazorpayOrderMutation();
    const [confirmPayment] = useConfirmStudentPaymentMutation();
    const [selected, setSelected] = useState<number[]>([]);
    const [annualContributions, setAnnualContributions] = useState<Record<number, number>>({});
    const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
    // Until the student picks a filter, open on "Due" when anything is due, so paid months don't bury it.
    const [pickedFilter, setFilter] = useState<Filter | null>(null);

    useEffect(() => { void loadRazorpayScript(); }, []);

    const selectedFees = useMemo(
        () => data?.fees.filter((fee) => selected.includes(fee.month)) ?? [],
        [data, selected],
    );
    const flexibleAnnual = selectedFees.reduce(
        (sum, fee) => sum + (fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0)),
        0,
    );
    const monthlyTotal = selectedFees.reduce((sum, fee) => sum + fee.totalAmount, 0);
    const selectedTotal = selectedFees.reduce(
        (sum, fee) => sum + fee.totalAmount + (fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0)),
        0,
    );
    const remainingAfterSelection = Math.max(0, (data?.annualSummary.remaining ?? 0) - flexibleAnnual);
    // Unpaid months with a balance, in the order they must be paid. The server refuses a selection that skips one.
    const payableMonths = useMemo(
        () => data?.fees.filter((fee) => !fee.isPaid && fee.totalAmount > 0).map((fee) => fee.month) ?? [],
        [data],
    );
    // The selection is always a gap-free run from the earliest unpaid month: choosing a month also
    // chooses every unpaid month before it, and clearing a month also clears every month after it.
    const toggleMonth = (month: number) => {
        const position = payableMonths.indexOf(month);
        if (position === -1) return;
        const next = selected.includes(month) ? payableMonths.slice(0, position) : payableMonths.slice(0, position + 1);
        setSelected(next);
        setAnnualContributions((current) => Object.fromEntries(Object.entries(current).filter(([key]) => next.includes(Number(key)))));
    };

    const pay = async () => {
        if (!data || !selectedFees.length || selectedTotal <= 0) return;
        if (flexibleAnnual > data.annualSummary.remaining) {
            toast.error(`Annual instalments can't be more than the ${inr(data.annualSummary.remaining)} still due. Lower the amount and try again.`);
            return;
        }

        try {
            const order = await createOrder({
                year,
                items: selectedFees.map((fee) => ({
                    month: fee.month,
                    annualContribution: fee.annualContributionRequired ? 0 : Number(annualContributions[fee.month] ?? 0),
                })),
            }).unwrap();
            const Razorpay = getRazorpay();
            if (!Razorpay) throw new Error("The payment window couldn't open. Check your connection, reload the page and try again.");

            new Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_JOC0wRKpLH1cVW",
                amount: order.amount,
                currency: order.currency,
                name: "MLZ School",
                description: `Fees for ${selectedFees.map((fee) => MONTHS[fee.month - 1]).join(", ")}`,
                order_id: order.orderId,
                handler: async (response: RazorpayResponse) => {
                    try {
                        const paidReceipt = await confirmPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        }).unwrap();
                        setReceipt(paidReceipt);
                        setSelected([]);
                        setAnnualContributions({});
                        toast.success(`${inr(paidReceipt.total)} paid. Your receipt is ready.`);
                        refetch();
                    } catch {
                        toast.error("Your payment went through but couldn't be confirmed yet. Don't pay again; reload this page in a few minutes or contact the accounts office.");
                        refetch();
                    }
                },
                theme: { color: "#0284c7" },
            }).open();
        } catch (error) {
            // The server explains refusals, for example "Fees must be paid month by month. Please pay X before Y."
            toast.error(apiErrorMessage(error, error instanceof Error ? error.message : "Payment couldn't start. Check your connection and try again."));
        }
    };

    const annual = data?.annualSummary;
    const fees = data?.fees ?? [];
    const dueCount = fees.filter((f) => !f.isPaid && f.totalAmount > 0).length;
    const paidCount = fees.filter((f) => f.isPaid).length;
    const filter: Filter = pickedFilter ?? (dueCount > 0 ? "due" : "all");
    const visible = fees.filter((f) => (filter === "all" ? true : filter === "paid" ? f.isPaid : !f.isPaid && f.totalAmount > 0));
    const paidPct = annual && annual.total > 0 ? Math.min(100, Math.round((annual.paid / annual.total) * 100)) : 0;

    const payLabel = creatingOrder ? "Opening payment…" : selectedTotal > 0 ? `Pay ${inr(selectedTotal)}` : "Pay securely";

    return (
        <div className="max-w-7xl space-y-6 pb-24 lg:pb-0">
            <PageHeader title="Fee payment" subtitle="Fees are paid month by month, in order. Choosing a later month also chooses the unpaid months before it." />

            {/* Annual fees summary */}
            <section aria-labelledby="annual-fees" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                    <h2 id="annual-fees" className="text-base font-semibold">Annual fees, {year}</h2>
                    {annual?.expiryDate && (
                        <p className="text-sm text-slate-300">
                            Due by <time dateTime={annual.expiryDate} className="font-medium text-white">{longDate(annual.expiryDate)}</time>
                        </p>
                    )}
                </div>
                <div className="px-4 pb-6 pt-4 sm:px-6">
                    {!isLoading && annual && !annual.isConfigured ? (
                        <p className="text-sm text-slate-300">The accounts office hasn&apos;t set up annual fees for {year} yet. Monthly fees can still be paid below.</p>
                    ) : (
                        <>
                            <dl className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {[
                                    { label: "Total", value: annual?.total, tone: "text-white" },
                                    { label: "Paid", value: annual?.paid, tone: "text-emerald-300" },
                                    { label: "Still due", value: annual?.remaining, tone: annual?.remaining ? "text-white" : "text-emerald-300" },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <dt className="text-sm text-slate-300">{f.label}</dt>
                                        <dd className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${f.tone}`}>
                                            {isLoading ? <Skeleton onDark className="h-8 w-32 align-middle" /> : inr(f.value ?? 0)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-6">
                                <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={paidPct} aria-label="Share of annual fees paid" className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                                    {!isLoading && (
                                        <motion.div
                                            className="h-full rounded-full bg-emerald-400"
                                            initial={{ width: reduceMotion ? `${paidPct}%` : 0 }}
                                            animate={{ width: `${paidPct}%` }}
                                            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.15, ease: EASE_OUT }}
                                        />
                                    )}
                                </div>
                                <p className="mt-2 min-h-5 text-sm text-slate-300">
                                    {isLoading || !annual
                                        ? null
                                        : annual.isOverdue && annual.remaining > 0
                                          ? <span className="text-rose-300">The due date has passed. The {inr(annual.remaining)} still due must be paid with your next unpaid month.</span>
                                          : annual.total === 0
                                            ? "No fees have been set for your class yet. Nothing to pay for now."
                                            : annual.remaining === 0
                                              ? "Annual fees are fully paid."
                                              : `${paidPct}% paid. You can add an annual instalment to any month you pay.`}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <section aria-labelledby="monthly-fees" className="overflow-hidden rounded-xl border border-gray-200 bg-white lg:col-span-2">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <h2 id="monthly-fees" className="text-base font-semibold text-gray-900">Monthly fees, {year}</h2>
                        <div role="group" aria-label="Show months" className="grid grid-cols-3 rounded-lg bg-gray-100 p-0.5 sm:inline-flex">
                            {FILTERS.map((f) => {
                                const active = f.value === filter;
                                const count = f.value === "due" ? dueCount : f.value === "paid" ? paidCount : fees.length;
                                return (
                                    <button
                                        key={f.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setFilter(f.value)}
                                        className={`relative rounded-md px-3 py-1.5 text-xs font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="fee-filter"
                                                className="absolute inset-0 rounded-md bg-white shadow-sm ring-1 ring-gray-200"
                                                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 38 }}
                                            />
                                        )}
                                        <span className="relative">{f.label} <span className="tabular-nums text-gray-500">{isLoading ? "" : count}</span></span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isLoading ? (
                        <div aria-hidden="true" className="space-y-3 px-6 py-6">
                            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-14 w-full" />)}
                        </div>
                    ) : isError ? (
                        <EmptyState
                            title="Your fees couldn't be loaded."
                            hint="It might be a temporary problem — try again in a moment."
                            action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    ) : visible.length === 0 ? (
                        <EmptyState
                            title={filter === "due" ? "Nothing is due. You're all paid up." : filter === "paid" ? "No months have been paid yet." : `No fees have been set for ${year} yet.`}
                            hint={filter === "all" ? "The accounts office adds monthly fees here." : undefined}
                        />
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {visible.map((fee) => {
                                const active = selected.includes(fee.month);
                                const canSelect = payableMonths.includes(fee.month);
                                const inputId = `month-${fee.month}`;
                                // Months that choosing this one would also choose, so the student isn't surprised.
                                const alsoSelects = canSelect && !active ? payableMonths.filter((m) => m < fee.month && !selected.includes(m)) : [];
                                return (
                                    <li key={fee.month} className={`px-4 py-4 motion-safe:transition-colors sm:px-6 ${active ? "bg-sky-50/60" : ""}`}>
                                        <div className="flex gap-3">
                                            <div className="pt-0.5">
                                                {fee.isPaid ? (
                                                    <CheckCircle2 size={20} aria-hidden="true" className="text-emerald-600" />
                                                ) : (
                                                    <input
                                                        id={inputId}
                                                        type="checkbox"
                                                        checked={active}
                                                        disabled={!canSelect}
                                                        onChange={() => toggleMonth(fee.month)}
                                                        aria-describedby={alsoSelects.length ? `${inputId}-order` : undefined}
                                                        className="h-5 w-5 cursor-pointer rounded border-gray-300 accent-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                                                    <div>
                                                        <label htmlFor={fee.isPaid ? undefined : inputId} className={`block font-medium text-gray-900 ${canSelect ? "cursor-pointer" : ""}`}>
                                                            {MONTHS[fee.month - 1]} {year}
                                                        </label>
                                                        <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${fee.isPaid ? "text-emerald-700" : fee.totalAmount > 0 ? "text-amber-700" : "text-gray-500"}`}>
                                                            {fee.isPaid ? (
                                                                <>Paid{fee.paidAt ? ` on ${longDate(fee.paidAt)}` : ""}</>
                                                            ) : fee.totalAmount > 0 ? (
                                                                <><Clock size={14} aria-hidden="true" />Due</>
                                                            ) : (
                                                                "Not set yet"
                                                            )}
                                                        </p>
                                                        {alsoSelects.length > 0 && (
                                                            <p id={`${inputId}-order`} className="mt-0.5 text-xs text-gray-500">
                                                                Also chooses {alsoSelects.map((m) => MONTHS[m - 1]).join(", ")}, because months are paid in order.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="text-base font-semibold tabular-nums text-gray-900">{inr(fee.totalAmount)}</span>
                                                        {fee.isPaid && fee.paymentId && <PaidReceiptActions fee={fee} year={year} />}
                                                    </div>
                                                </div>
                                                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                                                    <Detail label="Tuition" value={fee.tuitionFees} />
                                                    <Detail label="Transport" value={fee.transportFees} />
                                                    <Detail label="Penalty" value={fee.penalty} warn={fee.penalty > 0} />
                                                    <Detail label="Other fees" value={fee.otherFees} />
                                                </dl>
                                                {active && !fee.annualContributionRequired && annual && annual.remaining > 0 && !annual.isOverdue && (
                                                    <div className="mt-4 max-w-xs">
                                                        <label htmlFor={`annual-${fee.month}`} className="block text-sm font-medium text-gray-700">
                                                            Annual fee instalment <span className="font-normal text-gray-500">(optional)</span>
                                                        </label>
                                                        <div className="relative mt-1.5">
                                                            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                                                            <input
                                                                id={`annual-${fee.month}`}
                                                                min="0"
                                                                max={annual.remaining}
                                                                step="1"
                                                                type="number"
                                                                inputMode="numeric"
                                                                value={annualContributions[fee.month] ?? ""}
                                                                onChange={(event) => setAnnualContributions((current) => ({ ...current, [fee.month]: Number(event.target.value) }))}
                                                                aria-describedby={`annual-${fee.month}-hint`}
                                                                className={`${inputClass} pl-7 tabular-nums`}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <p id={`annual-${fee.month}-hint`} className="mt-1 text-xs text-gray-500">{inr(remainingAfterSelection)} of annual fees left after this.</p>
                                                    </div>
                                                )}
                                                {fee.annualContributionRequired > 0 && !fee.isPaid && (
                                                    <p className="mt-3 flex gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                                                        <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                                        {inr(fee.annualContributionRequired)} of annual fees must be paid with this month.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Summary (desktop) */}
                <aside aria-labelledby="pay-summary" className="hidden h-fit overflow-hidden rounded-xl border border-gray-200 bg-white lg:sticky lg:top-0 lg:block">
                    <div className="px-6 pt-5">
                        <h2 id="pay-summary" className="text-base font-semibold text-gray-900">Payment summary</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedFees.length ? `${selectedFees.length} ${selectedFees.length === 1 ? "month" : "months"} selected` : "Choose the months to pay, starting with the earliest unpaid one."}
                        </p>
                    </div>
                    <dl className="mx-6 mt-4 space-y-2 border-y border-gray-100 py-4 text-sm">
                        <div className="flex justify-between text-gray-600"><dt>Monthly fees</dt><dd className="tabular-nums">{inr(monthlyTotal)}</dd></div>
                        <div className="flex justify-between text-gray-600"><dt>Annual instalments</dt><dd className="tabular-nums">{inr(flexibleAnnual)}</dd></div>
                        <div className="flex justify-between pt-1 text-base font-semibold text-gray-900"><dt>Total</dt><dd className="tabular-nums">{inr(selectedTotal)}</dd></div>
                    </dl>
                    <div className="px-6 pb-6 pt-4">
                        <button type="button" disabled={!selectedFees.length || creatingOrder || selectedTotal <= 0} onClick={pay} className={`${primaryBtn} w-full`}>
                            {creatingOrder && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
                            {payLabel}
                        </button>
                        <p className="mt-3 flex gap-2 text-xs text-gray-500">
                            <ShieldCheck size={15} aria-hidden="true" className="shrink-0 text-gray-400" />
                            Payments go through Razorpay. The school confirms the final amount before you pay.
                        </p>
                    </div>
                </aside>
            </div>

            {/* Summary (phones and tablets): pinned to the bottom of the scroll area */}
            <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
                <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">
                            {selectedFees.length ? `${selectedFees.length} ${selectedFees.length === 1 ? "month" : "months"} selected` : "No months selected"}
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-gray-900">{inr(selectedTotal)}</p>
                    </div>
                    <button type="button" disabled={!selectedFees.length || creatingOrder || selectedTotal <= 0} onClick={pay} className={primaryBtn}>
                        {creatingOrder && <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />}
                        {creatingOrder ? "Opening…" : "Pay now"}
                    </button>
                </div>
            </div>

            <ReceiptDialog receipt={receipt} fileName={receipt ? `MLZ-payment-receipt-${receipt.receiptNumber}.svg` : ""} onClose={() => setReceipt(null)} />
        </div>
    );
}

function Detail({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
    return (
        <div>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className={`tabular-nums ${warn ? "font-medium text-red-700" : value ? "text-gray-700" : "text-gray-500"}`}>{value ? inr(value) : "—"}</dd>
        </div>
    );
}

function PaidReceiptActions({ fee, year }: { fee: MonthlyFeeRecord; year: number }) {
    const { data: receipt, isLoading } = useGetPaymentReceiptQuery(fee.paymentId!, { skip: !fee.paymentId });
    const [showReceipt, setShowReceipt] = useState(false);
    const fileName = `MLZ-${MONTHS[fee.month - 1]}-${year}-receipt.svg`;
    const month = MONTHS[fee.month - 1];

    if (isLoading) return <Loader2 size={16} className="text-gray-400 motion-safe:animate-spin" aria-label="Loading receipt" />;
    return (
        <div className="flex items-center gap-1">
            <button
                type="button"
                disabled={!receipt}
                onClick={() => setShowReceipt(true)}
                aria-label={`View the ${month} receipt`}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:text-gray-400 motion-safe:transition-colors ${focusRing}`}
            >
                <Eye size={15} aria-hidden="true" />
                Receipt
            </button>
            <button
                type="button"
                disabled={!receipt}
                onClick={() => receipt && void downloadReceipt(receipt, fileName)}
                aria-label={`Download the ${month} receipt`}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-300 motion-safe:transition-colors ${focusRing}`}
            >
                <Download size={15} aria-hidden="true" />
            </button>
            <ReceiptDialog receipt={showReceipt ? receipt ?? null : null} fileName={fileName} onClose={() => setShowReceipt(false)} />
        </div>
    );
}

function ReceiptDialog({ receipt, fileName, onClose }: { receipt: PaymentReceipt | null; fileName: string; onClose: () => void }) {
    const titleId = useId();
    return (
        <Dialog open={!!receipt} onClose={onClose} labelledBy={titleId} className="sm:max-w-2xl">
            {receipt && (
                <>
                    <DialogHeader accent="sky" id={titleId} title="Payment receipt" subtitle={`Receipt ${receipt.receiptNumber}`} onClose={onClose} />
                    <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 p-4">
                        <ReceiptDocument receipt={receipt} />
                    </div>
                    <div className="flex justify-end border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
                        <button type="button" onClick={() => void downloadReceipt(receipt, fileName)} className={primaryBtn}>
                            <Download size={16} aria-hidden="true" />
                            Download receipt
                        </button>
                    </div>
                </>
            )}
        </Dialog>
    );
}

function ReceiptDocument({ receipt }: { receipt: PaymentReceipt }) {
    // Keyed by receipt so a new receipt starts from a clean loading state.
    const [state, setState] = useState<{ for: PaymentReceipt; svg: string | null; error: boolean } | null>(null);

    useEffect(() => {
        let active = true;
        generatePaymentReceiptSvg(receipt)
            .then((document) => { if (active) setState({ for: receipt, svg: document, error: false }); })
            .catch(() => { if (active) setState({ for: receipt, svg: null, error: true }); });
        return () => { active = false; };
    }, [receipt]);

    const current = state?.for === receipt ? state : null;
    if (current?.error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">This receipt couldn&apos;t be prepared. Close it and try again.</p>;
    if (current?.svg) return <div className="mx-auto overflow-auto rounded-lg bg-white ring-1 ring-gray-200 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: current.svg }} />;
    return <div className="flex justify-center rounded-lg bg-white p-12"><Loader2 className="text-sky-600 motion-safe:animate-spin" aria-label="Preparing receipt" /></div>;
}

async function downloadReceipt(receipt: PaymentReceipt, fileName: string) {
    try {
        const svg = await generatePaymentReceiptSvg(receipt);
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Receipt downloaded.");
    } catch {
        toast.error("Receipt not downloaded. Try again in a moment.");
    }
}

function loadRazorpayScript() {
    return new Promise<boolean>((resolve) => {
        if (getRazorpay()) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}
