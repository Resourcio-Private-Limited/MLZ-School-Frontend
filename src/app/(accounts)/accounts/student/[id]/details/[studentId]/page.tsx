"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import { AlertTriangle, ArrowLeft, Bus, CalendarDays, CheckCircle2, CircleDashed, Clock, Download, GraduationCap, Pencil, Receipt, ShieldCheck, ShieldX, UserX, Wallet, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetClassroomsWithFeesQuery,
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
    useUpdateTransportOptedMutation,
    useUpsertStudentMonthlyFeeMutation,
    type MonthlyBreakdown,
    type StudentDetailResponse,
} from "@/redux/api/accountsApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "@/components/accounts/brand";
import { EmptyState, Panel, Skeleton, errorMessage, focusRing, initials, inputClass, inr, longDate, primaryBtn, secondaryBtn } from "@/components/accounts/ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type MonthStatus = "paid" | "partial" | "unpaid" | "current" | "upcoming" | "unbilled";

export default function StudentFeesPage() {
    const params = useParams<{ id: string | string[]; studentId: string | string[] }>();
    const classroomId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
    const studentId = Array.isArray(params.studentId) ? params.studentId[0] : params.studentId ?? "";

    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1;
    const [year, setYear] = useState(thisYear);

    const { data: student, isLoading, isFetching, isError, refetch } = useGetStudentDetailQuery({ studentId, year }, { skip: !studentId });
    const { data: classrooms = [] } = useGetClassroomsWithFeesQuery();
    const [updateEligibility, { isLoading: savingEligibility }] = useUpdateExamEligibilityMutation();
    const [updateTransport, { isLoading: savingTransport }] = useUpdateTransportOptedMutation();

    const [editing, setEditing] = useState<MonthlyBreakdown | null>(null);
    const [confirm, setConfirm] = useState<"eligibility" | "transport" | null>(null);

    const className = student?.classroom.name ?? classrooms.find((c) => c.classroomId === classroomId)?.className ?? "Class";

    const statusOf = (m: MonthlyBreakdown): MonthStatus => {
        if (m.isPaid) return "paid";
        if (m.paidAmount > 0) return "partial";
        if (!m.recordId) return "unbilled";
        if (year < thisYear || (year === thisYear && m.month < thisMonth)) return "unpaid";
        if (year === thisYear && m.month === thisMonth) return "current";
        return "upcoming";
    };

    const penaltyTotal = useMemo(() => student?.monthlyBreakdown.reduce((s, m) => s + m.penalty, 0) ?? 0, [student]);

    const toggleEligibility = async () => {
        if (!student) return;
        const next = !student.examEligibility;
        try {
            await updateEligibility({ studentId, examEligibility: next }).unwrap();
            toast.success(next ? `${student.fullName} is now eligible for exams.` : `${student.fullName} is no longer eligible for exams.`);
            setConfirm(null);
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Exam eligibility wasn't changed. Check your connection and try again."));
        }
    };

    const setTransport = async (next: boolean) => {
        if (!student) return;
        try {
            await updateTransport({ studentId, transportOpted: next }).unwrap();
            toast.success(next ? "Transport turned on. You can now enter transport fees." : "Transport turned off.");
            setConfirm(null);
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Transport wasn't changed. Check your connection and try again."));
        }
    };

    const exportStatement = () => {
        if (!student) return;
        try {
            const k = student.kpis;
            const header = ["Month", "Tuition", "Transport", "Annual", "Other fees", "Remarks", "Penalty", "Previous due", "Discount", "Total", "Status", "Paid amount", "Payment mode"];
            const rows: (string | number)[][] = student.monthlyBreakdown.map((m) => [
                MONTHS[m.month - 1],
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
            rows.push([`Total ${year}`, k.totalTuition, k.totalTransport, k.totalAnnual, k.totalOther, "", penaltyTotal, k.totalPrevDue, k.totalDiscount, k.totalOverall, `Paid ${k.totalPaid}`, k.totalPaid, `Due ${k.totalDue}`]);
            const sheet = XLSX.utils.aoa_to_sheet([
                [`Fee statement for ${student.fullName} (${student.admissionNumber}), ${year}`],
                [`Class: ${student.classroom.name}, roll ${student.rollNumber}`],
                [],
                header,
                ...rows,
            ]);
            sheet["!cols"] = [14, 11, 11, 11, 11, 18, 11, 12, 11, 11, 12, 12, 14].map((wch) => ({ wch }));
            sheet["!merges"] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
            ];
            const book = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(book, sheet, "Fee statement");
            XLSX.writeFile(book, `${student.fullName.replace(/\s+/g, "_")}_${year}_fee_statement.xlsx`);
            toast.success(`Fee statement for ${year} exported.`);
        } catch {
            toast.error("The statement couldn't be exported. Try again, or refresh the page first.");
        }
    };

    // Years around this one, plus whichever year is being viewed.
    const yearOptions = Array.from(new Set([...Array.from({ length: 5 }, (_, i) => thisYear + 1 - i), year])).sort((a, b) => b - a);
    const backHref = classroomId ? `/accounts/student/${classroomId}` : "/accounts";

    const headerActions = (
        <>
            <label htmlFor="fee-year" className="sr-only">Year</label>
            <select id="fee-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className={`h-10 w-full rounded-lg border border-gray-300 bg-white pl-3 pr-9 text-sm tabular-nums text-gray-900 hover:border-gray-400 focus:border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500/30 sm:w-28 motion-safe:transition`}>
                {yearOptions.map((y) => (
                    <option key={y} value={y}>
                        {y}
                    </option>
                ))}
            </select>
            <button type="button" onClick={exportStatement} disabled={!student} className={primaryBtn}>
                <Download size={16} aria-hidden="true" />
                Export to Excel
            </button>
        </>
    );

    if (isLoading) {
        return (
            <div className="max-w-7xl space-y-6" aria-busy="true">
                <StudentHeader backHref={backHref} backLabel={className} name={<Skeleton className="h-7 w-48" />} meta={<Skeleton className="mt-1 h-4 w-72" />} initial="" actions={headerActions} />
                <div className="h-16 rounded-xl border border-gray-200 bg-white" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="h-28 rounded-xl border border-gray-200 bg-white p-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="mt-3 h-7 w-24" />
                        </div>
                    ))}
                </div>
                <div className="h-96 rounded-xl border border-gray-200 bg-white" />
            </div>
        );
    }

    if (isError || !student) {
        return (
            <div className="max-w-7xl space-y-6">
                <StudentHeader backHref={backHref} backLabel={className} name="Student fees" initial="" />
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        icon={<UserX size={32} />}
                        title="This student's fees didn't load"
                        hint="Check your connection and try again. If the student has left the school, go back to the class list."
                        action={
                            <div className="flex flex-wrap justify-center gap-3">
                                <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                                    Try again
                                </button>
                                <Link href={backHref} className={secondaryBtn}>
                                    Back to the class
                                </Link>
                            </div>
                        }
                    />
                </section>
            </div>
        );
    }

    const k = student.kpis;
    const transportOn = student.transportOpted;
    const eligible = student.examEligibility;
    const monthsBilled = student.monthlyBreakdown.length || 12;
    const extras = k.totalOther + penaltyTotal - k.totalDiscount;

    return (
        <div className="max-w-7xl space-y-6">
            <StudentHeader
                backHref={backHref}
                backLabel={className}
                name={student.fullName}
                initial={student.fullName}
                meta={`${student.classroom.name}, roll ${student.rollNumber || "not set"}, admission no. ${student.admissionNumber}`}
                actions={headerActions}
            />

            {/* Exam eligibility and transport, each changed with its pencil, and the year's paid months */}
            <section aria-label="Student settings" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:px-5">
                <div className="flex flex-wrap gap-3">
                    <SettingChip
                        icon={eligible ? <ShieldCheck size={16} aria-hidden="true" /> : <ShieldX size={16} aria-hidden="true" />}
                        label={eligible ? "Exam eligible" : "Not eligible for exams"}
                        tone={eligible ? "text-emerald-800" : "text-red-700"}
                        editLabel="Change exam eligibility"
                        busy={savingEligibility}
                        onEdit={() => setConfirm("eligibility")}
                    />
                    <SettingChip
                        icon={<Bus size={16} aria-hidden="true" />}
                        label={transportOn ? "Transport: yes" : "Transport: no"}
                        tone="text-gray-800"
                        editLabel="Change school transport"
                        busy={savingTransport}
                        onEdit={() => setConfirm("transport")}
                    />
                </div>
                <p className="text-sm tabular-nums text-gray-600">
                    <span className="font-semibold text-gray-900">{k.paidMonths}</span> of {monthsBilled} months paid in {year}
                    {isFetching && <span className="ml-2 text-gray-500">Updating…</span>}
                </p>
            </section>

            {/* The year's figures. Due is the headline, so it carries the portal gradient. */}
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <FigureTile label="Tuition" value={inr(k.totalTuition)} icon={<GraduationCap size={18} aria-hidden="true" />} />
                <FigureTile label="Transport" value={inr(k.totalTransport)} icon={<Bus size={18} aria-hidden="true" />} />
                <FigureTile label="Annual" value={inr(k.totalAnnual)} icon={<CalendarDays size={18} aria-hidden="true" />} />
                <FigureTile label="Paid" value={inr(k.totalPaid)} icon={<CheckCircle2 size={18} aria-hidden="true" />} iconTone="bg-emerald-50 text-emerald-700" />
                <FigureTile
                    label="Other + penalty − discount"
                    value={`${extras < 0 ? "−" : ""}${inr(Math.abs(extras))}`}
                    icon={<Receipt size={18} aria-hidden="true" />}
                    note={`Other ${inr(k.totalOther)}, penalty ${inr(penaltyTotal)}, discount ${inr(k.totalDiscount)}`}
                />
                <div className={`relative overflow-hidden rounded-xl p-4 ${heroGradient}`}>
                    <dt className="flex items-start justify-between gap-2 text-sm text-slate-300">
                        Due
                        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-yellow-300">
                            <Wallet size={18} />
                        </span>
                    </dt>
                    <dd className={`mt-1 text-2xl font-semibold tabular-nums ${k.totalDue > 0 ? "text-white" : "text-emerald-300"}`}>{k.totalDue > 0 ? inr(k.totalDue) : "Nothing due"}</dd>
                    <dd className="mt-1 text-xs tabular-nums text-slate-400">of {inr(k.totalOverall)} billed</dd>
                </div>
            </dl>

            <Panel
                title="Monthly fee breakdown"
                subtitle="Use the pencil to edit a month's transport, other fees, previous due, discount or annual charges."
                action={<p className="text-sm text-gray-500">Year <span className="font-semibold tabular-nums text-gray-900">{year}</span></p>}
            >
                {!transportOn && (
                    <p className="mx-4 mt-3 flex items-start gap-2 text-sm text-orange-800 sm:mx-6">
                        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                        Transport is off for this student, so transport fees stay at ₹0. Turn it on with the transport pencil above to enter them.
                    </p>
                )}

                {student.monthlyBreakdown.length === 0 ? (
                    <EmptyState title={`No fees for ${year}`} hint="Pick another year, or check the class's fee settings in Fee management." />
                ) : (
                    <>
                        {/* Cards below xl: the same columns, one month per card */}
                        <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-200 xl:hidden">
                            {student.monthlyBreakdown.map((m) => {
                                const status = statusOf(m);
                                return (
                                    <li key={m.month} className="relative py-4 pl-6 pr-4 sm:pr-6">
                                        <span aria-hidden="true" className={`absolute bottom-4 left-3 top-4 w-1 rounded-full ${STATUS_BAR[status]}`} />
                                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{MONTHS[m.month - 1]}</p>
                                                <div className="mt-1">
                                                    <MonthBadge status={status} />
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold tabular-nums text-gray-900">{inr(m.totalAmount)}</p>
                                                    {m.paidAmount > 0 && <p className="text-sm tabular-nums text-gray-500">{inr(m.paidAmount)} paid{m.paymentMode ? `, ${m.paymentMode.toLowerCase()}` : ""}</p>}
                                                </div>
                                                <EditButton month={m.month} onClick={() => setEditing(m)} />
                                            </div>
                                        </div>
                                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                                            {lineItems(m).map(([label, value]) => (
                                                <div key={label} className="flex justify-between gap-2 sm:block">
                                                    <dt className="text-gray-500">{label}</dt>
                                                    <dd className="tabular-nums text-gray-900">{value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {m.otherFeesRemarks && <p className="mt-2 text-sm text-gray-500">Remarks: {m.otherFeesRemarks}</p>}
                                    </li>
                                );
                            })}
                        </ul>
                        <YearTotals student={student} penaltyTotal={penaltyTotal} year={year} />

                        {/* Table from xl up. The month column stays put if the table scrolls sideways. */}
                        <div className="relative mt-4 hidden overflow-x-auto border-t border-gray-200 xl:block">
                            <table className="w-full text-sm">
                                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                                    <tr>
                                        <th scope="col" className="sticky left-0 z-10 border-r border-gray-200 bg-gray-50 py-3 pl-5 pr-3 text-left font-medium">Month</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Tuition</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Transport</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Annual</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Other</th>
                                        <th scope="col" className="px-2.5 py-3 text-left font-medium">Remarks</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Penalty</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Prev. due</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Discount</th>
                                        <th scope="col" className="px-2.5 py-3 text-right font-medium">Total</th>
                                        <th scope="col" className="px-2.5 py-3 text-left font-medium">Status</th>
                                        <th scope="col" className="py-3 pl-2.5 pr-5 text-right font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {student.monthlyBreakdown.map((m) => {
                                        const status = statusOf(m);
                                        return (
                                            <tr key={m.month} className="group hover:bg-gray-50/70">
                                                <th scope="row" className="sticky left-0 z-10 border-r border-gray-200 bg-white py-3 pl-5 pr-3 text-left group-hover:bg-gray-50">
                                                    <span className="flex items-center gap-3">
                                                        <span aria-hidden="true" className={`h-8 w-1 rounded-full ${STATUS_BAR[status]}`} />
                                                        <span>
                                                            <span className="block font-semibold text-gray-900">{SHORT[m.month - 1]}</span>
                                                            <span className="block text-xs font-normal text-gray-500">{MONTHS[m.month - 1]}</span>
                                                        </span>
                                                    </span>
                                                </th>
                                                <Cell value={m.tuitionFees} />
                                                <Cell value={m.transportFees} />
                                                <Cell value={m.annualChargesApplicable ? m.annualCharges : 0} />
                                                <Cell value={m.otherFees} />
                                                <td className="px-2.5 py-3 text-gray-700">
                                                    {m.otherFeesRemarks ? <span className="block max-w-[8rem] truncate" title={m.otherFeesRemarks}>{m.otherFeesRemarks}</span> : <span className="text-gray-300">–</span>}
                                                </td>
                                                <Cell value={m.penalty} />
                                                <Cell value={m.previousAmount} />
                                                <Cell value={m.discount} minus />
                                                <td className="whitespace-nowrap px-2.5 py-3 text-right font-semibold tabular-nums text-gray-900">
                                                    {inr(m.totalAmount)}
                                                    {m.paidAmount > 0 && <span className="block text-xs font-normal text-gray-500">{inr(m.paidAmount)} paid</span>}
                                                </td>
                                                <td className="px-2.5 py-3">
                                                    <MonthBadge status={status} />
                                                </td>
                                                <td className="py-3 pl-2.5 pr-5 text-right">
                                                    <EditButton month={m.month} onClick={() => setEditing(m)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-semibold tabular-nums text-gray-900">
                                    <tr>
                                        <th scope="row" className="sticky left-0 z-10 border-r border-gray-200 bg-gray-50 py-3 pl-5 pr-3 text-left">Total {year}</th>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalTuition)}</td>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalTransport)}</td>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalAnnual)}</td>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalOther)}</td>
                                        <td className="px-2.5 py-3" />
                                        <td className="px-2.5 py-3 text-right">{inr(penaltyTotal)}</td>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalPrevDue)}</td>
                                        <td className="px-2.5 py-3 text-right">{k.totalDiscount ? `−${inr(k.totalDiscount)}` : inr(0)}</td>
                                        <td className="px-2.5 py-3 text-right">{inr(k.totalOverall)}</td>
                                        <td colSpan={2} className="whitespace-nowrap py-3 pl-2.5 pr-5 text-left text-sm font-normal text-gray-600">
                                            {inr(k.totalPaid)} paid, {inr(k.totalDue)} due
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </Panel>

            <Panel title="Contact details" subtitle="From the student's admission record.">
                <dl className="grid gap-x-6 gap-y-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                    <Detail label="Parent or guardian" value={student.parentName} />
                    <Detail label="Parent contact" value={student.parentContact} numeric />
                    <Detail label="Primary contact" value={student.primaryContact} numeric />
                    <Detail label="Emergency contact" value={student.secondaryContact} numeric />
                    <Detail label="Email" value={student.email} />
                    <Detail label="Date of birth" value={student.dob ? longDate(student.dob) : null} />
                    <Detail label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : null} />
                    <Detail label="Class roll" value={student.classRoll != null ? String(student.classRoll) : null} numeric />
                    <Detail label="Residential address" value={student.residentialAddress} className="sm:col-span-2 lg:col-span-1" />
                </dl>
            </Panel>

            <MonthDialog
                key={editing ? `${year}-${editing.month}` : "closed"}
                month={editing}
                year={year}
                studentId={studentId}
                classroomId={classroomId || student.classroom.id}
                transportOn={transportOn}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null);
                    refetch();
                }}
            />

            {/* Changing eligibility or transport is confirmed first, as the pencils did before. */}
            <Dialog open={confirm !== null} onClose={() => setConfirm(null)} labelledBy="setting-confirm-title" className="sm:max-w-md">
                {confirm === "eligibility" ? (
                    <>
                        <DialogHeader id="setting-confirm-title" title={eligible ? "Mark as not eligible for exams?" : "Make eligible for exams?"} subtitle={student.fullName} onClose={() => setConfirm(null)} accent="yellow" />
                        <div className="px-6 py-5 text-sm text-gray-700">
                            {eligible ? (
                                <p className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2.5 text-orange-900 ring-1 ring-orange-100">
                                    <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                    {student.fullName} won&apos;t be able to sit exams or get an admit card until this is changed back.
                                </p>
                            ) : (
                                <p>{student.fullName} will be able to sit exams and the principal can issue an admit card.</p>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setConfirm(null)} className={secondaryBtn}>
                                Cancel
                            </button>
                            <button type="button" onClick={toggleEligibility} disabled={savingEligibility} className={primaryBtn}>
                                {savingEligibility ? "Saving…" : eligible ? "Mark not eligible" : "Make eligible"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader id="setting-confirm-title" title={transportOn ? "Turn off transport?" : "Turn on transport?"} subtitle={student.fullName} onClose={() => setConfirm(null)} accent="yellow" />
                        <div className="space-y-3 px-6 py-5 text-sm text-gray-700">
                            {transportOn ? (
                                <>
                                    <p className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2.5 text-orange-900 ring-1 ring-orange-100">
                                        <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                        Transport fees for every month of {year} will be set to ₹0.
                                    </p>
                                    <p>Turn it back on if the student starts using school transport again, then enter the fees for those months.</p>
                                </>
                            ) : (
                                <p>You can then enter transport fees for each month with its pencil.</p>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setConfirm(null)} className={secondaryBtn}>
                                Cancel
                            </button>
                            <button type="button" onClick={() => setTransport(!transportOn)} disabled={savingTransport} className={primaryBtn}>
                                {savingTransport ? "Saving…" : transportOn ? "Turn off transport" : "Turn on transport"}
                            </button>
                        </div>
                    </>
                )}
            </Dialog>
        </div>
    );
}

// ─── Pieces ────────────────────────────────────────────────────────

/** Back link, avatar, name and record line on the left; year and export on the right. */
function StudentHeader({ backHref, backLabel, name, meta, initial, actions }: { backHref: string; backLabel: string; name: React.ReactNode; meta?: React.ReactNode; initial: string; actions?: React.ReactNode }) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-gray-200 pb-6">
            <div className="flex min-w-0 items-center gap-4">
                <Link href={backHref} aria-label={`Back to ${backLabel}`} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 motion-safe:transition-colors ${focusRing}`}>
                    <ArrowLeft size={18} aria-hidden="true" />
                    Back
                </Link>
                <span aria-hidden="true" className="hidden h-10 w-px bg-gray-200 sm:block" />
                <span aria-hidden="true" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-lg font-semibold text-yellow-900 ring-1 ring-yellow-200 sm:flex">
                    {initial ? initials(initial) : ""}
                </span>
                <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{name}</h1>
                    {meta && <div className="mt-0.5 text-sm text-gray-500">{meta}</div>}
                </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </header>
    );
}

/** A setting shown as a word and icon, with a pencil that asks before changing it. */
function SettingChip({ icon, label, tone, editLabel, busy, onEdit }: { icon: React.ReactNode; label: string; tone: string; editLabel: string; busy: boolean; onEdit: () => void }) {
    return (
        <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200">
            <span className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${tone}`}>
                {icon}
                {label}
            </span>
            <button
                type="button"
                onClick={onEdit}
                disabled={busy}
                aria-label={editLabel}
                title={editLabel}
                className={`inline-flex w-10 items-center justify-center border-l border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60 motion-safe:transition-colors ${focusRing} focus-visible:ring-inset`}
            >
                <Pencil size={15} aria-hidden="true" />
            </button>
        </div>
    );
}

function FigureTile({ label, value, icon, iconTone = "bg-gray-100 text-gray-500", note }: { label: string; value: string; icon: React.ReactNode; iconTone?: string; note?: string }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <dt className="text-sm text-gray-500">
                <span aria-hidden="true" className={`float-right ml-2 flex h-8 w-8 items-center justify-center rounded-lg ${iconTone}`}>
                    {icon}
                </span>
                {label}
            </dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">{value}</dd>
            {note && <dd className="mt-1 text-xs tabular-nums text-gray-500">{note}</dd>}
        </div>
    );
}

function EditButton({ month, onClick }: { month: number; onClick: () => void }) {
    const label = `Edit ${MONTHS[month - 1]} fees`;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-900 motion-safe:transition-colors ${focusRing}`}
        >
            <Pencil size={15} aria-hidden="true" />
        </button>
    );
}

// Left edge of each month: colour follows the status badge, which always carries the word.
const STATUS_BAR: Record<MonthStatus, string> = {
    paid: "bg-emerald-500",
    partial: "bg-orange-400",
    current: "bg-orange-400",
    unpaid: "bg-red-500",
    upcoming: "bg-gray-200",
    unbilled: "bg-gray-200",
};

function Switch({ on, label, busy, onToggle }: { on: boolean; label: string; busy?: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={label}
            disabled={busy}
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full motion-safe:transition-colors disabled:cursor-wait disabled:opacity-60 ${focusRing} focus-visible:ring-offset-2 ${on ? "bg-emerald-600" : "bg-gray-300"}`}
        >
            <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
        </button>
    );
}

function Detail({ label, value, numeric, className = "" }: { label: string; value: string | null | undefined; numeric?: boolean; className?: string }) {
    return (
        <div className={`min-w-0 ${className}`}>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className={`mt-0.5 break-words text-sm ${value ? "text-gray-900" : "text-gray-500"} ${numeric ? "tabular-nums" : ""}`}>{value || "Not added"}</dd>
        </div>
    );
}

function Cell({ value, minus }: { value: number; minus?: boolean }) {
    return <td className="whitespace-nowrap px-2.5 py-3 text-right tabular-nums text-gray-700">{value ? `${minus ? "−" : ""}${inr(value)}` : <span className="text-gray-300">–</span>}</td>;
}

/** The non-zero parts of a month's bill, for the phone and tablet cards. */
function lineItems(m: MonthlyBreakdown): [string, string][] {
    const items: [string, number, boolean?][] = [
        ["Tuition", m.tuitionFees],
        ["Transport", m.transportFees],
        ["Annual", m.annualChargesApplicable ? m.annualCharges : 0],
        ["Other", m.otherFees],
        ["Penalty", m.penalty],
        ["Previous due", m.previousAmount],
        ["Discount", m.discount, true],
    ];
    return items.filter(([, v]) => v > 0).map(([label, v, minus]) => [label, `${minus ? "−" : ""}${inr(v)}`]);
}

function YearTotals({ student, penaltyTotal, year }: { student: StudentDetailResponse; penaltyTotal: number; year: number }) {
    const k = student.kpis;
    const items: [string, string][] = [
        ["Tuition", inr(k.totalTuition)],
        ["Transport", inr(k.totalTransport)],
        ["Annual", inr(k.totalAnnual)],
        ["Other", inr(k.totalOther)],
        ["Penalty", inr(penaltyTotal)],
        ["Previous due", inr(k.totalPrevDue)],
        ["Discount", k.totalDiscount ? `−${inr(k.totalDiscount)}` : inr(0)],
        ["Total billed", inr(k.totalOverall)],
    ];
    return (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 xl:hidden">
            <p className="text-sm font-semibold text-gray-900">Totals for {year}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
                {items.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2 sm:block">
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="font-medium tabular-nums text-gray-900">{value}</dd>
                    </div>
                ))}
            </dl>
            <p className="mt-2 text-sm tabular-nums text-gray-600">
                {inr(k.totalPaid)} paid, {inr(k.totalDue)} due
            </p>
        </div>
    );
}

/** Each month's status, always as an icon plus a word. Orange is a warning here, never the yellow accent. */
function MonthBadge({ status }: { status: MonthStatus }) {
    const map: Record<MonthStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
        paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-800 ring-emerald-100", Icon: CheckCircle2 },
        partial: { label: "Part paid", cls: "bg-orange-50 text-orange-800 ring-orange-100", Icon: CircleDashed },
        unpaid: { label: "Unpaid", cls: "bg-red-50 text-red-800 ring-red-100", Icon: XCircle },
        current: { label: "Due this month", cls: "bg-orange-50 text-orange-800 ring-orange-100", Icon: AlertTriangle },
        upcoming: { label: "Not due yet", cls: "bg-gray-100 text-gray-600 ring-gray-200", Icon: Clock },
        unbilled: { label: "Not billed", cls: "bg-gray-100 text-gray-500 ring-gray-200", Icon: Clock },
    };
    const { label, cls, Icon } = map[status];
    return (
        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>
            <Icon size={13} aria-hidden="true" />
            {label}
        </span>
    );
}

// ─── Edit a month ──────────────────────────────────────────────────

const toNum = (v: string) => (v.trim() === "" ? 0 : Number(v));

function MonthDialog({
    month,
    year,
    studentId,
    classroomId,
    transportOn,
    onClose,
    onSaved,
}: {
    month: MonthlyBreakdown | null;
    year: number;
    studentId: string;
    classroomId: string;
    transportOn: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const uid = useId();
    const [upsert, { isLoading: saving }] = useUpsertStudentMonthlyFeeMutation();
    // The dialog is keyed by month, so this initial state is the month being edited.
    const [form, setForm] = useState(() => ({
        transportFees: String(transportOn ? month?.transportFees ?? 0 : 0),
        otherFees: String(month?.otherFees ?? 0),
        otherFeesRemarks: month?.otherFeesRemarks ?? "",
        previousAmount: String(month?.previousAmount ?? 0),
        discount: String(month?.discount ?? 0),
        annualChargesApplicable: month?.annualChargesApplicable ?? false,
    }));
    const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

    if (!month) return null;

    const name = MONTHS[month.month - 1];
    const numbers = { transportFees: toNum(form.transportFees), otherFees: toNum(form.otherFees), previousAmount: toNum(form.previousAmount), discount: toNum(form.discount) };
    const invalid = Object.entries(numbers).filter(([, v]) => !Number.isFinite(v) || v < 0).map(([key]) => key);
    const subtotal = month.tuitionFees + (transportOn ? numbers.transportFees : 0) + (form.annualChargesApplicable ? month.annualCharges : 0) + numbers.otherFees + month.penalty + numbers.previousAmount;
    const total = subtotal - numbers.discount;
    const discountTooBig = numbers.discount > subtotal;

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        if (invalid.length || discountTooBig) return;
        try {
            await upsert({
                studentId,
                classroomId,
                month: month.month,
                year,
                // Without transport, transport fees are always 0.
                transportFees: transportOn ? numbers.transportFees : 0,
                otherFees: numbers.otherFees,
                otherFeesRemarks: form.otherFeesRemarks.trim() || undefined,
                discount: numbers.discount,
                previousAmount: numbers.previousAmount,
                annualChargesApplicable: form.annualChargesApplicable,
            }).unwrap();
            toast.success(`${name} fees saved.`);
            onSaved();
        } catch (err) {
            toast.error(errorMessage(err, `${name} fees weren't saved. Check your connection and try again.`));
        }
    };

    const money = (key: keyof typeof numbers, label: string, hint?: string, disabled?: boolean) => (
        <div>
            <label htmlFor={`${uid}-${key}`} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative mt-1">
                <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                <input
                    id={`${uid}-${key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={form[key]}
                    disabled={disabled}
                    onChange={(e) => set({ [key]: e.target.value })}
                    aria-invalid={invalid.includes(key) || undefined}
                    aria-describedby={hint ? `${uid}-${key}-hint` : undefined}
                    className={`${inputClass} pl-7 tabular-nums disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400`}
                />
            </div>
            {invalid.includes(key) ? (
                <p className="mt-1 text-sm text-red-700">Enter ₹0 or more.</p>
            ) : (
                hint && <p id={`${uid}-${key}-hint`} className="mt-1 text-sm text-gray-500">{hint}</p>
            )}
        </div>
    );

    return (
        <Dialog open onClose={onClose} labelledBy={`${uid}-title`} className="sm:max-w-lg">
            <DialogHeader id={`${uid}-title`} title={`Edit ${name} ${year}`} subtitle={`Tuition ${inr(month.tuitionFees)}${month.penalty ? `, penalty ${inr(month.penalty)}` : ""}`} onClose={onClose} accent="yellow" />
            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 overflow-y-auto px-6 py-5">
                    {month.isPaid && (
                        <p className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2.5 text-sm text-orange-900 ring-1 ring-orange-100">
                            <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                            {name} is already paid ({inr(month.paidAmount)}). Saving changes the amounts on record, not the payment.
                        </p>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {money("transportFees", "Transport fees", transportOn ? undefined : "Transport is off for this student.", !transportOn)}
                        {money("previousAmount", "Previous due", "Carried over from earlier months.")}
                        {money("otherFees", "Other fees")}
                        <div>
                            <label htmlFor={`${uid}-remarks`} className="block text-sm font-medium text-gray-700">
                                What the other fees are for <span className="font-normal text-gray-500">(optional)</span>
                            </label>
                            <input
                                id={`${uid}-remarks`}
                                type="text"
                                value={form.otherFeesRemarks}
                                onChange={(e) => set({ otherFeesRemarks: e.target.value })}
                                placeholder="For example, lab fee"
                                className={`${inputClass} mt-1`}
                            />
                        </div>
                        {money("discount", "Discount")}
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">Charge annual charges this month</p>
                            <p className="text-sm text-gray-500">{inr(month.annualCharges)} for this class</p>
                        </div>
                        <Switch on={form.annualChargesApplicable} label="Charge annual charges this month" onToggle={() => set({ annualChargesApplicable: !form.annualChargesApplicable })} />
                    </div>
                    {discountTooBig && <p className="text-sm text-red-700">The discount is more than the month&apos;s fees. Lower it to {inr(subtotal)} or less.</p>}
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600" aria-live="polite">
                        New total <span className="text-lg font-semibold tabular-nums text-gray-900">{inr(Math.max(0, total))}</span>
                        {total !== month.totalAmount && <span className="ml-1 tabular-nums text-gray-500">(was {inr(month.totalAmount)})</span>}
                    </p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button type="button" onClick={onClose} className={secondaryBtn}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving || invalid.length > 0 || discountTooBig} className={primaryBtn}>
                            {saving ? "Saving…" : `Save ${name}`}
                        </button>
                    </div>
                </div>
            </form>
        </Dialog>
    );
}
