"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
    ArrowLeft, Loader2, Save, X, Edit2, Check,
    Bus, BusFront, ShieldCheck, ShieldX, AlertCircle,
    Download, GraduationCap, Receipt, TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
    useUpdateTransportOptedMutation,
    useUpsertStudentMonthlyFeeMutation,
    MonthlyBreakdown,
} from "@/redux/api/accountsApi";

const MONTHS = [
    { value: 1, label: "Jan", full: "January" },
    { value: 2, label: "Feb", full: "February" },
    { value: 3, label: "Mar", full: "March" },
    { value: 4, label: "Apr", full: "April" },
    { value: 5, label: "May", full: "May" },
    { value: 6, label: "Jun", full: "June" },
    { value: 7, label: "Jul", full: "July" },
    { value: 8, label: "Aug", full: "August" },
    { value: 9, label: "Sep", full: "September" },
    { value: 10, label: "Oct", full: "October" },
    { value: 11, label: "Nov", full: "November" },
    { value: 12, label: "Dec", full: "December" },
];

const rupee = (n: number | null | undefined) =>
    n == null ? "—" : "₹" + Math.round(n).toLocaleString("en-IN");

export default function StudentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const classroomId = Array.isArray(params?.id) ? (params.id as string[])[0] : ((params?.id as string) ?? "");
    const studentIdRaw = (params as any)?.studentId;
    const studentId = Array.isArray(studentIdRaw) ? studentIdRaw[0] : (studentIdRaw as string) ?? "";

    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());

    const { data: student, isLoading, refetch } = useGetStudentDetailQuery({
        studentId,
        year,
    });

    const [updateEligibility, { isLoading: isUpdatingEligibility }] = useUpdateExamEligibilityMutation();
    const [updateTransportOpted, { isLoading: isUpdatingTransport }] = useUpdateTransportOptedMutation();
    const [upsertMonthlyFee, { isLoading: isSavingMonthly }] = useUpsertStudentMonthlyFeeMutation();

    const [editingMonth, setEditingMonth] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<Partial<MonthlyBreakdown>>({});

    // Confirmation dialog state for the two toggles
    type ConfirmKind = "eligibility" | "transport" | null;
    const [confirmDialog, setConfirmDialog] = useState<{
        kind: ConfirmKind;
        nextValue: boolean;
    } | null>(null);
    const openConfirm = (kind: ConfirmKind) => {
        if (!student) return;
        if (kind === "eligibility") {
            setConfirmDialog({ kind, nextValue: !student.examEligibility });
        } else if (kind === "transport") {
            setConfirmDialog({ kind, nextValue: !student.transportOpted });
        }
    };
    const closeConfirm = () => setConfirmDialog(null);

    const handleStartEdit = (month: MonthlyBreakdown) => {
        setEditingMonth(month.month);
        setEditValues({
            transportFees: isTransportYes ? month.transportFees : 0,
            otherFees: month.otherFees,
            otherFeesRemarks: month.otherFeesRemarks,
            discount: month.discount,
            previousAmount: month.previousAmount,
            annualChargesApplicable: month.annualChargesApplicable,
        });
    };

    const handleCancelEdit = () => {
        setEditingMonth(null);
        setEditValues({});
    };

    const handleSaveMonth = async (month: number) => {
        try {
            await upsertMonthlyFee({
                studentId,
                classroomId,
                month,
                year,
                // If transport is not opted-in, always force 0 for transport fees.
                transportFees: isTransportYes ? Number(editValues.transportFees ?? 0) : 0,
                otherFees: Number(editValues.otherFees ?? 0),
                otherFeesRemarks: editValues.otherFeesRemarks || undefined,
                discount: Number(editValues.discount ?? 0),
                previousAmount: Number(editValues.previousAmount ?? 0),
                annualChargesApplicable: editValues.annualChargesApplicable,
            }).unwrap();
            toast.success(MONTHS[month - 1].full + " updated");
            setEditingMonth(null);
            setEditValues({});
            refetch();
        } catch {
            toast.error("Failed to save month.");
        }
    };

    const handleConfirmToggle = async () => {
        if (!student || !confirmDialog) return;
        const { kind, nextValue } = confirmDialog;
        try {
            if (kind === "eligibility") {
                await updateEligibility({ studentId, examEligibility: nextValue }).unwrap();
                toast.success("Exam eligibility " + (nextValue ? "enabled" : "disabled"));
            } else if (kind === "transport") {
                await updateTransportOpted({ studentId, transportOpted: nextValue }).unwrap();
                toast.success("Transport " + (nextValue ? "opted-in" : "opted-out"));
            }
            closeConfirm();
            refetch();
        } catch {
            toast.error("Failed to update status.");
            closeConfirm();
        }
    };

    const isTransportYes = !!student?.transportOpted;

    const handleExportToExcel = () => {
        if (!student) return;
        try {
            // Build header row
            const headers = [
                "Month",
                "Tuition", "Transport", "Annual", "Other Fees",
                "Remarks", "Penalty", "Prev. Due", "Discount",
                "Total", "Status", "Paid Amount", "Payment Mode",
            ];

            // Build data rows
            const rows = student.monthlyBreakdown.map((m) => [
                MONTHS[m.month - 1].full,
                m.tuitionFees,
                m.transportFees,
                m.annualChargesApplicable ? m.annualCharges : 0,
                m.otherFees,
                m.otherFeesRemarks ?? "",
                m.penalty,
                m.previousAmount,
                m.discount,
                m.totalAmount,
                m.isPaid ? "Paid" : "Unpaid",
                m.paidAmount,
                m.paymentMode ?? "",
            ]);

            // Add totals row
            const k = student.kpis;
            rows.push([
                "TOTAL " + year,
                k.totalTuition,
                k.totalTransport,
                k.totalAnnual,
                k.totalOther,
                "",
                student.monthlyBreakdown.reduce((s, m) => s + m.penalty, 0),
                k.totalPrevDue,
                k.totalDiscount,
                k.totalOverall,
                "Paid ₹" + k.totalPaid,
                k.totalPaid,
                "Due ₹" + k.totalDue,
            ] as any);

            const worksheet = XLSX.utils.aoa_to_sheet([
                [`Student Fee Statement — ${student.fullName} (${student.admissionNumber}) — ${year}`],
                [`Classroom: ${student.classroom.name} • Roll: ${student.rollNumber}`],
                [],
                headers,
                ...rows,
            ]);

            // Set column widths
            worksheet["!cols"] = [
                { wch: 14 }, { wch: 11 }, { wch: 11 }, { wch: 11 },
                { wch: 11 }, { wch: 18 }, { wch: 11 }, { wch: 11 },
                { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
            ];

            // Merge title across all columns
            worksheet["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Statement");

            const fileName = `${student.fullName.replace(/\s+/g, "_")}_${year}_Fee_Statement.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success("Exported to Excel");
        } catch (e) {
            toast.error("Failed to export.");
        }
    };

    const kpis = student?.kpis;
    const yearlyPaidMonths = useMemo(
        () => student?.monthlyBreakdown.filter((m) => m.isPaid).length ?? 0,
        [student]
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 font-medium">Student not found</p>
                <Link href="/accounts" className="mt-4 inline-block text-amber-600 hover:underline">
                    Back to Accounts
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center font-semibold shadow-sm">
                            {student.fullName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{student.fullName}</h1>
                            <p className="text-xs text-gray-500">
                                {student.classroom.name} · Roll {student.rollNumber} · Adm {student.admissionNumber}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-white text-sm text-gray-800 rounded-lg px-3 py-2 border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                        {[year - 1, year, year + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleExportToExcel}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                    >
                        <Download size={16} />
                        Export to Excel
                    </button>
                </div>
            </div>

            {/* Status strip — eligibility + transport */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-stretch rounded-lg overflow-hidden border border-gray-200">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold ${
                        student.examEligibility
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                    }`}>
                        {student.examEligibility ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
                        {student.examEligibility ? 'Exam Eligible' : 'Not Eligible'}
                    </span>
                    <button
                        onClick={() => openConfirm("eligibility")}
                        className="px-2.5 py-1.5 bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700 border-l border-gray-200 transition-colors"
                        title="Edit exam eligibility"
                    >
                        <Edit2 size={13} />
                    </button>
                </div>

                <div className="inline-flex items-stretch rounded-lg overflow-hidden border border-gray-200">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold ${
                        student.transportOpted
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-50 text-gray-700'
                    }`}>
                        {student.transportOpted ? <BusFront size={14} /> : <Bus size={14} />}
                        Transport · {student.transportOpted ? 'Yes' : 'No'}
                    </span>
                    <button
                        onClick={() => openConfirm("transport")}
                        className="px-2.5 py-1.5 bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700 border-l border-gray-200 transition-colors"
                        title="Edit transport status"
                    >
                        <Edit2 size={13} />
                    </button>
                </div>

                <div className="ml-auto text-xs text-gray-500">
                    {yearlyPaidMonths} / 12 months paid in {year}
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard title="Tuition" value={rupee(kpis?.totalTuition)} icon={<GraduationCap size={18} />} accent="rose" />
                <KpiCard title="Transport" value={rupee(kpis?.totalTransport)} icon={<Bus size={18} />} accent="blue" />
                <KpiCard title="Annual" value={rupee(kpis?.totalAnnual)} icon={<TrendingUp size={18} />} accent="purple" />
                <KpiCard title="Paid" value={rupee(kpis?.totalPaid)} icon={<Check size={18} />} accent="green" />
                <KpiCard
                    title="Other + Penalty − Discount"
                    value={rupee(
                        (kpis?.totalOther ?? 0)
                        + student.monthlyBreakdown.reduce((s, m) => s + m.penalty, 0)
                        - (kpis?.totalDiscount ?? 0)
                    )}
                    icon={<Receipt size={18} />}
                    accent="amber"
                />
                <KpiCard title="Due" value={rupee(kpis?.totalDue)} icon={<Receipt size={18} />} accent="red" highlight />
            </div>

            {/* Fee breakdown — clean minimalistic table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Monthly Fee Breakdown</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Click pencil to edit any month's {isTransportYes ? "transport, " : ""}other, prev due, discount, or annual.
                            {!isTransportYes && (
                                <span className="text-amber-600 font-medium"> Transport is disabled — turn it on to enter fees.</span>
                            )}
                        </p>
                    </div>
                    <div className="text-xs text-gray-500">
                        Year <span className="font-semibold text-gray-900">{year}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[110px]">
                                    Month
                                </th>
                                <Th>Tuition</Th>
                                <Th accent="blue">Transport</Th>
                                <Th accent="purple">Annual</Th>
                                <Th accent="amber">Other</Th>
                                <Th accent="amber" align="left">Remarks</Th>
                                <Th accent="rose">Penalty</Th>
                                <Th accent="orange">Prev. Due</Th>
                                <Th accent="green">Discount</Th>
                                <Th>Total</Th>
                                <Th>Status</Th>
                                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider min-w-[80px]">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {student.monthlyBreakdown.map((m) => {
                                const isEditing = editingMonth === m.month;
                                const short = MONTHS[m.month - 1].label;
                                const full = MONTHS[m.month - 1].full;

                                return (
                                    <tr
                                        key={m.month}
                                        className={`transition-colors ${
                                            isEditing
                                                ? 'bg-amber-50/60'
                                                : m.isPaid
                                                    ? 'bg-white hover:bg-gray-50'
                                                    : m.totalAmount > 0
                                                        ? 'bg-rose-50/20 hover:bg-rose-50/30'
                                                        : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3 border-r border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1 h-7 rounded-full ${
                                                    m.isPaid ? 'bg-emerald-500' : m.totalAmount > 0 ? 'bg-rose-400' : 'bg-gray-300'
                                                }`} />
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{short}</div>
                                                    <div className="text-[11px] text-gray-400">{full}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <Td>{rupee(m.tuitionFees)}</Td>
                                        <Td accent="blue">
                                            {isEditing ? (
                                                isTransportYes ? (
                                                    <InlineNum
                                                        value={Number(editValues.transportFees ?? 0)}
                                                        onChange={(v) => setEditValues({ ...editValues, transportFees: v })}
                                                    />
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center gap-1 text-xs text-gray-400 italic"
                                                        title="Enable transport status to edit transport fees"
                                                    >
                                                        <Bus size={12} /> Disabled
                                                    </span>
                                                )
                                            ) : (
                                                <Money text={m.transportFees} colorClass="text-blue-700" />
                                            )}
                                        </Td>
                                        <Td accent="purple">
                                            {isEditing ? (
                                                <label className="inline-flex items-center gap-1 text-xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={editValues.annualChargesApplicable ?? false}
                                                        onChange={(e) => setEditValues({
                                                            ...editValues,
                                                            annualChargesApplicable: e.target.checked,
                                                        })}
                                                        className="accent-purple-600"
                                                    />
                                                    <span className="font-medium text-gray-700">{rupee(m.annualCharges)}</span>
                                                </label>
                                            ) : (
                                                <Money text={m.annualChargesApplicable ? m.annualCharges : 0} colorClass="text-purple-700" empty="—" />
                                            )}
                                        </Td>
                                        <Td accent="amber">
                                            {isEditing ? (
                                                <InlineNum
                                                    value={Number(editValues.otherFees ?? 0)}
                                                    onChange={(v) => setEditValues({ ...editValues, otherFees: v })}
                                                />
                                            ) : (
                                                <Money text={m.otherFees} colorClass="text-amber-700" />
                                            )}
                                        </Td>
                                        <Td accent="amber" align="left" className="max-w-[180px]">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editValues.otherFeesRemarks ?? ""}
                                                    onChange={(e) => setEditValues({
                                                        ...editValues,
                                                        otherFeesRemarks: e.target.value,
                                                    })}
                                                    placeholder="e.g. Lab fee"
                                                    className="w-full px-2 py-1 text-xs border border-amber-300 rounded outline-none focus:ring-1 focus:ring-amber-500"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-500 line-clamp-2 italic">
                                                    {m.otherFeesRemarks || "—"}
                                                </span>
                                            )}
                                        </Td>
                                        <Td accent="rose">
                                            <Money text={m.penalty} colorClass="text-rose-700" />
                                        </Td>
                                        <Td accent="orange">
                                            {isEditing ? (
                                                <InlineNum
                                                    value={Number(editValues.previousAmount ?? 0)}
                                                    onChange={(v) => setEditValues({ ...editValues, previousAmount: v })}
                                                />
                                            ) : (
                                                <Money text={m.previousAmount} colorClass="text-orange-700" />
                                            )}
                                        </Td>
                                        <Td accent="green">
                                            {isEditing ? (
                                                <InlineNum
                                                    value={Number(editValues.discount ?? 0)}
                                                    onChange={(v) => setEditValues({ ...editValues, discount: v })}
                                                />
                                            ) : (
                                                <Money text={m.discount} colorClass="text-green-700" />
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="font-bold text-sm text-rose-700">
                                                {m.isPaid ? "₹0" : rupee(m.totalAmount)}
                                            </div>
                                            {m.isPaid && (
                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                    Paid {rupee(m.paidAmount)}
                                                </div>
                                            )}
                                        </Td>
                                        <Td>
                                            {m.isPaid ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                    <Check size={10} /> Paid
                                                </span>
                                            ) : m.recordId ? (
                                                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                                    Unpaid
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </Td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleSaveMonth(m.month)}
                                                        disabled={isSavingMonthly}
                                                        className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50"
                                                        title="Save"
                                                    >
                                                        {isSavingMonthly ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                        title="Cancel"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartEdit(m)}
                                                    className="p-1.5 bg-gray-100 text-amber-700 rounded hover:bg-amber-100 transition-colors"
                                                    title="Edit this month"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Totals row */}
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                                <td className="sticky left-0 z-10 bg-gray-50 px-4 py-3 border-r border-gray-200 font-bold text-gray-900 text-xs uppercase tracking-wide">
                                    Total {year}
                                </td>
                                <Td bold accent="rose">{rupee(kpis?.totalTuition)}</Td>
                                <Td bold accent="blue">{rupee(kpis?.totalTransport)}</Td>
                                <Td bold accent="purple">{rupee(kpis?.totalAnnual)}</Td>
                                <Td bold accent="amber">{rupee(kpis?.totalOther)}</Td>
                                <Td align="left" className="text-gray-400">—</Td>
                                <Td bold accent="rose">
                                    {rupee(student.monthlyBreakdown.reduce((s, m) => s + m.penalty, 0))}
                                </Td>
                                <Td bold accent="orange">{rupee(kpis?.totalPrevDue)}</Td>
                                <Td bold accent="green">{rupee(kpis?.totalDiscount)}</Td>
                                <Td bold>{rupee(kpis?.totalOverall)}</Td>
                                <Td>
                                    <div className="text-[11px] text-gray-700 leading-tight">
                                        Paid {rupee(kpis?.totalPaid)}<br />
                                        Due {rupee(kpis?.totalDue)}
                                    </div>
                                </Td>
                                <td colSpan={2} />
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="bg-gray-50/60 border-t border-gray-100 px-5 py-3 text-[11px] text-gray-500 flex items-start gap-1.5">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    <span>
                        Total = Tuition + Transport + Annual + Other + Penalty + Previous Due − Discount.
                        Annual charges default to April. Pencil icon opens inline editing.
                    </span>
                </div>
            </div>

            {/* Confirmation dialog for eligibility / transport toggles */}
            {confirmDialog && confirmDialog.kind && (
                <ConfirmToggleDialog
                    kind={confirmDialog.kind}
                    nextValue={confirmDialog.nextValue}
                    studentName={student.fullName}
                    isLoading={isUpdatingEligibility || isUpdatingTransport}
                    onConfirm={handleConfirmToggle}
                    onCancel={closeConfirm}
                />
            )}
        </div>
    );
}

// ─── Sub-components for the clean table ─────────────────────────────────────────

function Th({
    children, accent, align = "right",
}: { children: React.ReactNode; accent?: string; align?: "left" | "right" | "center" }) {
    const colorClass: Record<string, string> = {
        blue: "text-blue-700", purple: "text-purple-700",
        amber: "text-amber-700", rose: "text-rose-700",
        orange: "text-orange-700", green: "text-green-700",
    };
    return (
        <th
            className={`px-4 py-3 text-${align} text-[11px] font-semibold uppercase tracking-wider ${
                accent ? colorClass[accent] : "text-gray-500"
            }`}
        >
            {children}
        </th>
    );
}

function Td({
    children, accent, bold, align = "right", className = "",
}: { children: React.ReactNode; accent?: string; bold?: boolean; align?: "left" | "right" | "center"; className?: string }) {
    const colorClass: Record<string, string> = {
        blue: "text-blue-700", purple: "text-purple-700",
        amber: "text-amber-700", rose: "text-rose-700",
        orange: "text-orange-700", green: "text-green-700",
    };
    return (
        <td className={`px-4 py-3 text-${align} text-sm ${bold ? "font-bold" : ""} ${
            accent ? colorClass[accent] : "text-gray-700"
        } ${className}`}>
            {children}
        </td>
    );
}

function Money({ text, colorClass, empty = "" }: { text: number; colorClass: string; empty?: string }) {
    if (!text || text === 0) return <span className="text-gray-300 text-xs">{empty || "—"}</span>;
    return <span className={`font-semibold ${colorClass}`}>{rupee(text)}</span>;
}

function InlineNum({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="inline-flex items-center justify-end gap-0.5">
            <span className="text-xs text-gray-500">₹</span>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-20 px-2 py-1 text-right text-xs font-semibold border border-amber-300 rounded outline-none focus:ring-1 focus:ring-amber-500"
                min={0}
            />
        </div>
    );
}

function KpiCard({
    title, value, icon, accent, highlight,
}: {
    title: string; value: string; icon: React.ReactNode;
    accent: "rose" | "blue" | "purple" | "amber" | "green" | "red";
    highlight?: boolean;
}) {
    const bgMap: Record<string, string> = {
        rose: "bg-rose-50", blue: "bg-blue-50", purple: "bg-purple-50",
        amber: "bg-amber-50", green: "bg-emerald-50", red: "bg-rose-50",
    };
    const fgMap: Record<string, string> = {
        rose: "text-rose-700", blue: "text-blue-700", purple: "text-purple-700",
        amber: "text-amber-700", green: "text-emerald-700", red: "text-rose-700",
    };
    return (
        <div className={`bg-white rounded-lg border p-3.5 ${
            highlight
                ? 'border-rose-300 ring-1 ring-rose-200 shadow-sm'
                : 'border-gray-100'
        }`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className={`mt-1 text-lg font-bold truncate ${
                        highlight ? 'text-rose-700' : 'text-gray-900'
                    }`}>{value}</p>
                </div>
                <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${bgMap[accent]} ${fgMap[accent]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ConfirmToggleDialog({
    kind, nextValue, studentName, isLoading, onConfirm, onCancel,
}: {
    kind: "eligibility" | "transport";
    nextValue: boolean;
    studentName: string;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const isEligibility = kind === "eligibility";

    const accent = isEligibility
        ? (nextValue
            ? { bar: "bg-emerald-500", text: "text-emerald-700", pillBg: "bg-emerald-100", pillFg: "text-emerald-700", button: "bg-emerald-600 hover:bg-emerald-700", icon: <ShieldCheck size={22} /> }
            : { bar: "bg-rose-500", text: "text-rose-700", pillBg: "bg-rose-100", pillFg: "text-rose-700", button: "bg-rose-600 hover:bg-rose-700", icon: <ShieldX size={22} /> })
        : (nextValue
            ? { bar: "bg-blue-500", text: "text-blue-700", pillBg: "bg-blue-100", pillFg: "text-blue-700", button: "bg-blue-600 hover:bg-blue-700", icon: <BusFront size={22} /> }
            : { bar: "bg-gray-500", text: "text-gray-700", pillBg: "bg-gray-100", pillFg: "text-gray-700", button: "bg-gray-700 hover:bg-gray-800", icon: <Bus size={22} /> });

    const label = isEligibility
        ? "Exam Eligibility"
        : "Transport Status";
    const currentValue = isEligibility ? !nextValue : !nextValue;
    const valueLabel = (v: boolean) => v ? "Yes" : "No";
    const actionVerb = nextValue ? "enable" : "disable";

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className={`${accent.bar} text-white px-5 py-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                        {accent.icon}
                        <div>
                            <h3 className="text-base font-bold">Confirm {label} Change</h3>
                            <p className="text-xs opacity-80">{studentName}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded transition-colors" title="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Currently</p>
                                <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${accent.pillBg} ${accent.pillFg}`}>
                                    {valueLabel(currentValue)}
                                </span>
                            </div>
                            <div className="text-gray-400 text-xl">→</div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Change to</p>
                                <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${accent.pillBg} ${accent.pillFg}`}>
                                    {valueLabel(nextValue)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-1">
                        Are you sure you want to <span className={`font-bold ${accent.text}`}>{actionVerb}</span> {isEligibility ? "exam eligibility" : "transport"} for this student?
                    </p>
                    {isEligibility ? (
                        <p className="text-xs text-gray-500 mt-1">
                            Exam eligibility controls whether the student can appear for exams and have admit cards generated.
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1">
                            Disabling transport will zero out transport fees across all months for this year.
                        </p>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${accent.button}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={14} className="animate-spin" /> Saving...
                                </span>
                            ) : (
                                "Yes, " + (nextValue ? "enable" : "disable")
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
