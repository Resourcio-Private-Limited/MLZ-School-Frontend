"use client";

import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, CircleDashed, RefreshCw } from "lucide-react";
import { useGetStudentDetailQuery, useUpdateExamEligibilityMutation, type StudentDetailResponse } from "@/redux/api/accountsApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { EmptyState, Skeleton, Tabs, errorMessage, focusRing, initials, inr, longDate, secondaryBtn } from "@/components/principal/ui";

type Tab = "details" | "fees";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Student record in a dialog (a bottom sheet on phones). Open while studentId is set. */
export default function StudentDetailModal({
    studentId,
    onClose,
    onStudentUpdate,
}: {
    studentId: string | null;
    onClose: () => void;
    onStudentUpdate?: () => void;
}) {
    return (
        <Dialog open={!!studentId} onClose={onClose} labelledBy="student-detail-title" className="sm:max-w-2xl">
            {studentId && <StudentDetailBody studentId={studentId} onClose={onClose} onStudentUpdate={onStudentUpdate} />}
        </Dialog>
    );
}

function StudentDetailBody({ studentId, onClose, onStudentUpdate }: { studentId: string; onClose: () => void; onStudentUpdate?: () => void }) {
    const [tab, setTab] = useState<Tab>("details");
    const { data: student, isLoading, isError, error, refetch } = useGetStudentDetailQuery({ studentId });
    const [updateEligibility, { isLoading: updating }] = useUpdateExamEligibilityMutation();

    const toggleEligibility = async () => {
        if (!student) return;
        const next = !student.examEligibility;
        try {
            await updateEligibility({ studentId, examEligibility: next }).unwrap();
            toast.success(next ? `${student.fullName} is now eligible for exams.` : `${student.fullName} is no longer eligible for exams.`);
            refetch();
            onStudentUpdate?.();
        } catch (err) {
            toast.error(errorMessage(err, "Couldn't change exam eligibility. Try again in a moment."));
        }
    };

    return (
        <>
            <DialogHeader
                id="student-detail-title"
                title={student?.fullName ?? (isError ? "Student record" : "Loading student…")}
                subtitle={student ? `${student.admissionNumber}, ${student.classroom?.name ?? "No class"}` : undefined}
                leading={
                    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-sm font-semibold text-purple-700 ring-1 ring-purple-100">
                        {student ? initials(student.fullName) : ""}
                    </span>
                }
                onClose={onClose}
                accent="purple"
            />

            {isLoading ? (
                <div className="space-y-4 px-6 py-6" aria-label="Loading student">
                    <Skeleton className="block h-16 w-full rounded-lg" />
                    <div className="grid gap-4 sm:grid-cols-2">
                        {Array.from({ length: 6 }, (_, i) => (
                            <span key={i} className="space-y-2">
                                <Skeleton className="block h-3 w-20" />
                                <Skeleton className="block h-4 w-36" />
                            </span>
                        ))}
                    </div>
                </div>
            ) : isError || !student ? (
                <EmptyState
                    icon={<AlertCircle size={36} />}
                    title="This student's record couldn't be loaded"
                    hint={errorMessage(error, "Check your connection and try again.")}
                    action={
                        <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                            <RefreshCw size={16} aria-hidden="true" />
                            Try again
                        </button>
                    }
                />
            ) : (
                <>
                    <div className="border-b border-gray-200 px-6">
                        <Tabs<Tab>
                            label="Student record"
                            value={tab}
                            onChange={setTab}
                            layoutId="principal-student-detail-tab"
                            tabs={[
                                { key: "details", label: "Details" },
                                { key: "fees", label: "Fees" },
                            ]}
                        />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" role="tabpanel" aria-label={tab === "details" ? "Details" : "Fees"}>
                        {tab === "details" ? <DetailsTab student={student} updating={updating} onToggle={toggleEligibility} /> : <FeesTab student={student} />}
                    </div>
                </>
            )}

            <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                <button type="button" onClick={onClose} className={secondaryBtn}>
                    Close
                </button>
            </div>
        </>
    );
}

function DetailsTab({ student, updating, onToggle }: { student: StudentDetailResponse; updating: boolean; onToggle: () => void }) {
    const eligible = student.examEligibility;
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="min-w-0">
                    <p id="exam-eligibility-label" className="text-sm font-medium text-gray-900">
                        Eligible for exams
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        {eligible ? <CheckCircle2 size={14} aria-hidden="true" className="text-emerald-600" /> : <CircleDashed size={14} aria-hidden="true" className="text-red-600" />}
                        {eligible ? "This student is cleared to sit exams." : "This student isn't cleared to sit exams."}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={eligible}
                    aria-labelledby="exam-eligibility-label"
                    disabled={updating}
                    onClick={onToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full motion-safe:transition-colors disabled:cursor-wait disabled:opacity-60 ${focusRing} focus-visible:ring-offset-2 ${eligible ? "bg-purple-600" : "bg-gray-300"}`}
                >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform ${eligible ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
            </div>

            <Section title="Student">
                <Field label="Class roll" value={student.classRoll != null ? String(student.classRoll) : null} numeric />
                <Field label="Admission roll" value={student.rollNumber} numeric />
                <Field label="Admission number" value={student.admissionNumber} numeric />
                <Field label="Class" value={student.classroom ? `${student.classroom.name}` : null} />
                <Field label="Date of birth" value={student.dob ? longDate(student.dob) : null} />
                <Field label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : null} />
                <Field label="Transport" value={student.transportOpted ? "Uses school transport" : "Doesn't use school transport"} />
            </Section>

            <Section title="Contact">
                <Field label="Email" value={student.email} />
                <Field label="Primary contact" value={student.primaryContact} numeric />
                <Field label="Secondary contact" value={student.secondaryContact} numeric />
                <Field label="Address" value={student.residentialAddress} wide />
            </Section>

            <Section title="Parent or guardian">
                <Field label="Name" value={student.parentName} />
                <Field label="Contact" value={student.parentContact} numeric />
            </Section>
        </div>
    );
}

function FeesTab({ student }: { student: StudentDetailResponse }) {
    const k = student.kpis;
    const months = student.monthlyBreakdown ?? [];
    const year = months[0]?.year;
    return (
        <div className="space-y-6">
            {k ? (
                <dl className="grid gap-3 sm:grid-cols-3">
                    <Figure label="Paid" value={inr(k.totalPaid)} />
                    <Figure label="Due" value={inr(k.totalDue)} tone={k.totalDue > 0 ? "text-red-700" : "text-gray-900"} note={k.totalDue > 0 ? "Outstanding" : "Nothing due"} />
                    <Figure label="Months paid" value={`${k.paidMonths} of ${k.paidMonths + k.unpaidMonths}`} />
                </dl>
            ) : (
                <p className="text-sm text-gray-500">No fee summary for this student yet.</p>
            )}

            {student.feeStructure && (
                <Section title="Fee structure">
                    <Field label="Tuition (monthly)" value={inr(student.feeStructure.tuitionFees)} numeric />
                    <Field label="Annual charges" value={inr(student.feeStructure.annualCharges)} numeric />
                </Section>
            )}

            <section>
                <h3 className="text-sm font-semibold text-gray-900">Monthly fees{year ? ` for ${year}` : ""}</h3>
                {months.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No monthly fee records yet.</p>
                ) : (
                    <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
                        {months.map((m) => (
                            <li key={`${m.year}-${m.month}`} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                        {MONTHS[m.month - 1]} {m.year !== year ? m.year : ""}
                                    </p>
                                    <p className="text-sm tabular-nums text-gray-500">
                                        {inr(m.totalAmount)}
                                        {m.isPaid && m.paymentMode ? `, paid by ${m.paymentMode.toLowerCase()}` : ""}
                                    </p>
                                </div>
                                {m.isPaid ? (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
                                        <CheckCircle2 size={12} aria-hidden="true" />
                                        Paid
                                    </span>
                                ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                        <CircleDashed size={12} aria-hidden="true" />
                                        Not paid
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <dl className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
        </section>
    );
}

function Field({ label, value, numeric, wide }: { label: string; value: string | null | undefined; numeric?: boolean; wide?: boolean }) {
    return (
        <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className={`mt-0.5 break-words text-sm ${value ? "text-gray-900" : "text-gray-400"} ${numeric ? "tabular-nums" : ""}`}>{value || "Not added"}</dd>
        </div>
    );
}

function Figure({ label, value, tone = "text-gray-900", note }: { label: string; value: string; tone?: string; note?: string }) {
    return (
        <div className="rounded-lg border border-gray-200 px-4 py-3">
            <dt className="text-sm text-gray-500">{label}</dt>
            <dd className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</dd>
            {note && <dd className="text-xs text-gray-500">{note}</dd>}
        </div>
    );
}
