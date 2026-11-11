"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Download, FileImage, Loader2 } from "lucide-react";
import { type ReportCardExamStatus, useGetReportCardQuery } from "@/redux/api/studentApi";
import { apiErrorMessage } from "@/lib/apiError";
import { heroGradient } from "@/components/student/brand";
import { EmptyState, PageHeader, Panel, Skeleton, longDate, primaryBtn, secondaryBtn } from "@/components/student/ui";

const EXAMS = [
    { key: "HALF_YEARLY", label: "Half-yearly exam" },
    { key: "FINAL", label: "Final exam" },
] as const;

export default function StudentResultsPage() {
    // Refetched on every visit, so a result released since the last visit shows up.
    const { data, isLoading, isError, refetch } = useGetReportCardQuery(undefined, { refetchOnMountOrArgChange: true });
    const [downloading, setDownloading] = useState(false);
    const fileBase = data ? `Report-Card-${data.studentName.replace(/[^A-Za-z0-9]+/g, "-")}-${data.session}` : "Report-Card";

    const downloadPdf = async () => {
        setDownloading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/student/report-card/pdf`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}` },
            });
            if (!response.ok) {
                const body = await response.json().catch(() => null);
                throw { data: body };
            }
            saveBlob(await response.blob(), `${fileBase}.pdf`);
            toast.success("Report card downloaded as a PDF.");
        } catch (error) {
            toast.error(apiErrorMessage(error, "The PDF couldn't be prepared. Try again in a moment, or download the image instead."));
        } finally {
            setDownloading(false);
        }
    };

    const downloadImage = () => {
        if (!data?.svg) return;
        saveBlob(new Blob([data.svg], { type: "image/svg+xml;charset=utf-8" }), `${fileBase}.svg`);
        toast.success("Report card downloaded as an image.");
    };

    const subtitle = data ? `Your report card for the ${data.session} session, ${data.classroomName}.` : "Your report card for this school year.";

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Results" subtitle={subtitle} />

            {isError ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        title="Your results couldn't be loaded."
                        hint="Check your connection, then try again."
                        action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                    />
                </section>
            ) : (
                <>
                    {/* Release status for each exam */}
                    <section aria-labelledby="results-status" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                        <h2 id="results-status" className="px-4 pt-5 text-base font-semibold sm:px-6">This year&apos;s exams</h2>
                        <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-2">
                            {EXAMS.map((exam) => (
                                <ExamStatus key={exam.key} label={exam.label} status={data?.exams[exam.key]} loading={isLoading} />
                            ))}
                        </dl>
                    </section>

                    {isLoading ? (
                        <div aria-hidden="true" className="h-96 rounded-xl border border-gray-200 bg-white" />
                    ) : data?.available && data.svg ? (
                        <Panel
                            title="Report card"
                            subtitle={data.issuedOn ? `Last updated ${longDate(data.issuedOn)}` : undefined}
                            action={
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={downloadImage} className={secondaryBtn}>
                                        <FileImage size={16} aria-hidden="true" />
                                        Download image
                                    </button>
                                    <button type="button" onClick={downloadPdf} disabled={downloading} className={primaryBtn}>
                                        {downloading ? <Loader2 size={16} aria-hidden="true" className="motion-safe:animate-spin" /> : <Download size={16} aria-hidden="true" />}
                                        {downloading ? "Preparing PDF…" : "Download PDF"}
                                    </button>
                                </div>
                            }
                        >
                            <div className="mt-4 overflow-x-auto border-t border-gray-200 bg-gray-50 p-3 sm:p-5">
                                <div
                                    role="img"
                                    aria-label={`Report card for ${data.studentName}, ${data.session}`}
                                    className="mx-auto min-w-[640px] max-w-5xl bg-white shadow-sm ring-1 ring-gray-200 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: data.svg }}
                                />
                            </div>
                        </Panel>
                    ) : (
                        <section className="rounded-xl border border-gray-200 bg-white">
                            <EmptyState
                                icon={<Clock size={32} />}
                                title="No result has been published yet."
                                hint="Your report card appears here once your teachers have entered marks for every subject of an exam."
                            />
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

/** One exam's release status on the gradient band: published, or how many subjects are ready. */
function ExamStatus({ label, status, loading }: { label: string; status?: ReportCardExamStatus; loading: boolean }) {
    const ready = status && status.totalSubjects > 0 ? Math.round((status.completedSubjects / status.totalSubjects) * 100) : 0;
    return (
        <div>
            <dt className="text-sm text-slate-300">{label}</dt>
            <dd className="mt-1">
                {loading || !status ? (
                    <Skeleton onDark className="h-7 w-40 align-middle" />
                ) : status.released ? (
                    <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-emerald-300">
                        <CheckCircle2 size={22} aria-hidden="true" className="shrink-0" />
                        Published
                    </span>
                ) : (
                    <>
                        <span className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
                            <Clock size={22} aria-hidden="true" className="shrink-0 text-slate-300" />
                            Not published yet
                        </span>
                        {status.totalSubjects > 0 && (
                            <>
                                <span
                                    role="meter"
                                    aria-label={`${label}: subjects with marks entered`}
                                    aria-valuemin={0}
                                    aria-valuemax={status.totalSubjects}
                                    aria-valuenow={status.completedSubjects}
                                    className="mt-3 block h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/10"
                                >
                                    <span className="block h-full rounded-full bg-sky-400" style={{ width: `${ready}%` }} />
                                </span>
                                <span className="mt-1.5 block text-sm tabular-nums text-slate-300">
                                    Marks entered for {status.completedSubjects} of {status.totalSubjects} subjects
                                </span>
                            </>
                        )}
                    </>
                )}
            </dd>
        </div>
    );
}

function saveBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
