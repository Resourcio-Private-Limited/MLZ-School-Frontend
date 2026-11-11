"use client";

import { useId, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ChevronLeft, ChevronRight, IndianRupee } from "lucide-react";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useRecordStudentPaymentMutation, type PaymentMode, type StudentFeeRecord } from "@/redux/api/accountsApi";
import { errorMessage, focusRing, inputClass, inr, primaryBtn, secondaryBtn } from "@/components/accounts/ui";

// Fee form pieces shared by Fee management and the class fees page, plus the Record payment dialog.

// ─── Shared form pieces ────────────────────────────────────────────

export const labelClass = "block text-sm font-medium text-gray-700";
export const hintClass = "mt-1.5 text-xs text-gray-500";
export const errorClass = "mt-1.5 text-xs font-medium text-red-700";

export const monthLabel = (month: number, year: number) => new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

/** Parses a rupee field. Empty means 0; anything else must be a whole or decimal number of at least 0. */
export function parseMoney(value: string): number | null {
    if (value.trim() === "") return 0;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Rupee input with a ₹ prefix. The label and hint are wired up by the caller through id and describedBy. */
export function MoneyInput({ id, value, onChange, invalid, describedBy, autoFocus }: { id: string; value: string; onChange: (v: string) => void; invalid?: boolean; describedBy?: string; autoFocus?: boolean }) {
    return (
        <div className="relative mt-1.5">
            <IndianRupee size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
                id={id}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                autoFocus={autoFocus}
                className={`${inputClass} pl-8 tabular-nums ${invalid ? "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""}`}
            />
        </div>
    );
}

/** Month stepper: ‹ November 2026 › plus a "This month" shortcut when you've moved away. */
export function MonthStepper({ month, year, onChange, label = "Month" }: { month: number; year: number; onChange: (m: number, y: number) => void; label?: string }) {
    const now = new Date();
    const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();
    const step = (delta: number) => {
        const d = new Date(year, month - 1 + delta, 1);
        onChange(d.getMonth() + 1, d.getFullYear());
    };
    const arrow = `inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 motion-safe:transition ${focusRing}`;
    return (
        <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => step(-1)} aria-label="Previous month" className={arrow}>
                <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <p aria-live="polite" className="min-w-[9.5rem] text-center text-sm font-semibold tabular-nums text-gray-900">
                {monthLabel(month, year)}
            </p>
            <button type="button" onClick={() => step(1)} aria-label="Next month" className={arrow}>
                <ChevronRight size={16} aria-hidden="true" />
            </button>
            {!isCurrent && (
                <button type="button" onClick={() => onChange(now.getMonth() + 1, now.getFullYear())} className={secondaryBtn}>
                    This month
                </button>
            )}
        </div>
    );
}

const secondaryLg = secondaryBtn.replace("h-9", "h-10");

const PAYMENT_MODES: { key: PaymentMode; label: string }[] = [
    { key: "CASH", label: "Cash" },
    { key: "ONLINE", label: "Online" },
    { key: "NEFT", label: "NEFT" },
    { key: "CARD", label: "Card" },
    { key: "CHEQUE", label: "Cheque" },
];

function ChoiceChips<T extends string>({ legend, name, options, value, onChange }: { legend: string; name: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return (
        <fieldset>
            <legend className={labelClass}>{legend}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
                {options.map((o) => (
                    <label key={o.key} className="cursor-pointer">
                        <input type="radio" name={name} value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} className="peer sr-only" />
                        <span
                            className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium motion-safe:transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-yellow-600 peer-focus-visible:ring-offset-1 ${value === o.key ? "border-yellow-500 bg-yellow-50 text-yellow-900" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                        >
                            {o.label}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

// ─── Record payment ────────────────────────────────────────────────

/** Records a payment against one student's fees for one month. Open it by passing the student; close by clearing it. */
export function RecordPaymentDialog({
    student,
    classroomId,
    month,
    year,
    onClose,
    onDone,
}: {
    student: StudentFeeRecord | null;
    classroomId: string;
    month: number;
    year: number;
    onClose: () => void;
    onDone: () => void;
}) {
    const titleId = useId();
    return (
        <Dialog open={!!student} onClose={onClose} labelledBy={titleId} className="sm:max-w-lg">
            {student && <PaymentForm key={`${student.studentId}-${year}-${month}`} titleId={titleId} classroomId={classroomId} student={student} month={month} year={year} onClose={onClose} onDone={onDone} />}
        </Dialog>
    );
}

function PaymentForm({ titleId, classroomId, student, month, year, onClose, onDone }: { titleId: string; classroomId: string; student: StudentFeeRecord; month: number; year: number; onClose: () => void; onDone: () => void }) {
    const id = useId();
    const [amount, setAmount] = useState(String(student.totalAmount));
    const [mode, setMode] = useState<PaymentMode>("CASH");
    const [touched, setTouched] = useState(false);
    const [recordPayment, { isLoading }] = useRecordStudentPaymentMutation();

    const parsed = parseMoney(amount);
    const error = parsed === null ? "Enter an amount in rupees." : parsed <= 0 ? "Enter an amount above ₹0." : null;
    const over = parsed !== null && parsed > student.totalAmount;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (error || parsed === null) return;
        try {
            await recordPayment({ studentId: student.studentId, classroomId, month, year, paidAmount: parsed, paymentMode: mode }).unwrap();
            toast.success(`${inr(parsed)} payment recorded for ${student.fullName}.`);
            onDone();
        } catch (err) {
            toast.error(errorMessage(err, "The payment wasn't recorded. Check your connection and try again."));
        }
    };

    return (
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <DialogHeader id={titleId} title="Record payment" subtitle={`${student.fullName}, ${monthLabel(month, year)}`} onClose={onClose} accent="yellow" />
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div>
                        <dt className="text-gray-500">This month&apos;s total</dt>
                        <dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900">{inr(student.totalAmount)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Already received</dt>
                        <dd className="mt-0.5 text-base font-semibold tabular-nums text-gray-900">{inr(student.paidAmount)}</dd>
                    </div>
                </dl>
                <div>
                    <label htmlFor={`${id}-amount`} className={labelClass}>Amount received</label>
                    <MoneyInput id={`${id}-amount`} value={amount} onChange={setAmount} invalid={touched && !!error} describedBy={`${id}-amount-hint`} autoFocus />
                    <p id={`${id}-amount-hint`} className={touched && error ? errorClass : over ? "mt-1.5 flex items-center gap-1 text-xs font-medium text-orange-700" : hintClass}>
                        {touched && error ? error : over ? <><AlertTriangle size={13} aria-hidden="true" />That&apos;s more than this month&apos;s total of {inr(student.totalAmount)}.</> : "Filled in with the month's total. Change it for a part payment."}
                    </p>
                </div>
                <ChoiceChips legend="Paid by" name={`${id}-mode`} options={PAYMENT_MODES} value={mode} onChange={setMode} />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={onClose} className={secondaryLg}>Cancel</button>
                <button type="submit" disabled={isLoading} className={primaryBtn}>
                    {isLoading ? "Recording…" : parsed && !error ? `Record ${inr(parsed)}` : "Record payment"}
                </button>
            </div>
        </form>
    );
}
