"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Award, CheckCircle2, Clock, Download, FileImage, Loader2 } from "lucide-react";
import { ReportCardExamStatus, useGetReportCardQuery } from "@/redux/api/studentApi";

const EXAMS = [
    { key: "HALF_YEARLY", label: "Half Yearly Exam" },
    { key: "FINAL", label: "Final Exam" },
] as const;

export default function StudentResultsPage() {
    const { data, isLoading, isError } = useGetReportCardQuery(undefined, { refetchOnMountOrArgChange: true });
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
                throw new Error(body?.message ?? "Unable to prepare the PDF");
            }
            saveBlob(await response.blob(), `${fileBase}.pdf`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to prepare the PDF");
        } finally {
            setDownloading(false);
        }
    };

    const downloadSvg = () => {
        if (data?.svg) saveBlob(new Blob([data.svg], { type: "image/svg+xml;charset=utf-8" }), `${fileBase}.svg`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-sky-600 p-3 text-white shadow-lg"><Award size={26} /></div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">My Results</h1>
                    <p className="text-slate-500">
                        {data ? `${data.classroomName} · Session ${data.session}` : "Your report card for the current session"}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center rounded-xl border bg-white p-12"><Loader2 className="animate-spin text-sky-600" /></div>
            ) : isError || !data ? (
                <div className="rounded-xl border bg-white p-10 text-center text-slate-500">Unable to load your results right now. Please try again later.</div>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {EXAMS.map((exam) => <ExamStatusCard key={exam.key} label={exam.label} status={data.exams[exam.key]} />)}
                    </div>

                    {data.available && data.svg ? (
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Report Card</h2>
                                    {data.issuedOn && <p className="text-sm text-slate-500">Last updated {new Date(data.issuedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={downloadPdf} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                                        {downloading ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <Download size={16} className="shrink-0" />}
                                        {downloading ? "Preparing PDF..." : "Download PDF"}
                                    </button>
                                    <button onClick={downloadSvg} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                                        <FileImage size={16} className="shrink-0" />Download Image
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto bg-slate-100 p-3 sm:p-5">
                                <div
                                    aria-label="Report card preview"
                                    className="mx-auto min-w-[640px] max-w-5xl bg-white shadow-md [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: data.svg }}
                                />
                            </div>
                        </section>
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                            <Clock size={40} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-semibold text-slate-700">No result has been published yet</p>
                            <p className="mt-1 text-sm text-slate-500">Your report card appears here once your teachers have submitted marks for every subject of an exam.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ExamStatusCard({ label, status }: { label: string; status: ReportCardExamStatus }) {
    return (
        <div className={`flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm ${status.released ? "border-emerald-200" : "border-slate-200"}`}>
            <div className={`rounded-full p-2.5 ${status.released ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                {status.released ? <CheckCircle2 size={22} /> : <Clock size={22} />}
            </div>
            <div>
                <p className="font-bold text-slate-800">{label}</p>
                <p className={`text-sm ${status.released ? "text-emerald-700" : "text-slate-500"}`}>
                    {status.released ? "Result published" : "Result not published yet"}
                </p>
            </div>
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
