"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Download, FileImage, Loader2 } from "lucide-react";
import {
    type ReportCardExamStatus,
    type StudentReportCard,
    type StudentReportCardEntry,
    useGetReportCardForQuery,
    useGetReportCardQuery,
    useListReportCardsQuery,
} from "@/redux/api/studentApi";
import { apiErrorMessage } from "@/lib/apiError";
import { heroGradient } from "@/components/student/brand";
import { EmptyState, PageHeader, Panel, Skeleton, longDate, primaryBtn, secondaryBtn } from "@/components/student/ui";

const EXAMS = [
    { key: "HALF_YEARLY", label: "Half-yearly exam" },
    { key: "FINAL", label: "Final exam" },
] as const;

type Exams = StudentReportCard["exams"];

const entryKey = (entry: { session: string; classroomId: string }) => `${entry.session}|${entry.classroomId}`;

/** Release status in words, e.g. "Half-yearly published, final not yet". */
function releaseInWords(exams: Exams) {
    const halfYearly = exams.HALF_YEARLY.released;
    const final = exams.FINAL.released;
    if (halfYearly && final) return "Half-yearly and final published";
    if (halfYearly) return "Half-yearly published, final not yet";
    if (final) return "Final published, half-yearly not yet";
    return "Not published yet";
}

const safeFilePart = (value: string) => value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function StudentResultsPage() {
    // Everything is refetched on every visit, so a result released since the last visit shows up.
    const list = useListReportCardsQuery(undefined, { refetchOnMountOrArgChange: true });
    const entries = list.data ?? [];
    const [pickedKey, setPickedKey] = useState<string | null>(null);
    const picked = entries.find((entry) => entryKey(entry) === pickedKey) ?? entries.find((entry) => entry.isCurrent) ?? entries[0];

    // The current card comes from the original endpoint, so it loads alongside the list (and still
    // works if the list can't be loaded). Earlier cards come from the session-and-class endpoint.
    const showingCurrent = !picked || picked.isCurrent;
    const currentCard = useGetReportCardQuery(undefined, { refetchOnMountOrArgChange: true, skip: !showingCurrent });
    const pastCard = useGetReportCardForQuery(
        { session: picked?.session ?? "", classroomId: picked?.classroomId ?? "" },
        { refetchOnMountOrArgChange: true, skip: showingCurrent },
    );
    const card = showingCurrent ? currentCard : pastCard;
    const data = card.currentData;
    const isLoading = !data && (card.isFetching || card.isLoading);
    const isError = card.isError && !card.isFetching;

    const [downloading, setDownloading] = useState(false);
    const fileBase = data ? `Report-Card-${safeFilePart(data.studentName)}-${safeFilePart(data.classroomName)}-${data.session}` : "Report-Card";

    const downloadPdf = async () => {
        const path = showingCurrent
            ? "/student/report-card/pdf"
            : `/student/report-cards/${encodeURIComponent(picked.session)}/${encodeURIComponent(picked.classroomId)}/pdf`;
        setDownloading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
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

    const shown = data ?? picked;
    const subtitle = shown ? `Your report card for the ${shown.session} session, ${shown.classroomName}.` : "Your report card for this school year.";
    // While a card loads, the list already knows its release status.
    const exams = data?.exams ?? picked?.exams;

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Results" subtitle={subtitle} />

            {entries.length > 1 && <ReportCardPicker entries={entries} selectedKey={picked ? entryKey(picked) : null} onSelect={setPickedKey} />}

            {isError ? (
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        title="This report card couldn't be loaded."
                        hint="It might be a temporary problem — try again in a moment."
                        action={<button type="button" onClick={() => card.refetch()} className={secondaryBtn}>Try again</button>}
                    />
                </section>
            ) : (
                <>
                    {/* Release status for each exam */}
                    <section aria-labelledby="results-status" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                        <h2 id="results-status" className="px-4 pt-5 text-base font-semibold sm:px-6">
                            {showingCurrent ? "This year's exams" : `Exams in ${picked.session}, ${picked.classroomName}`}
                        </h2>
                        <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:px-6 lg:grid-cols-2">
                            {EXAMS.map((exam) => (
                                <ExamStatus key={exam.key} label={exam.label} status={exams?.[exam.key]} loading={!exams} />
                            ))}
                        </dl>
                    </section>

                    {isLoading ? (
                        <div aria-hidden="true" className="h-96 rounded-xl border border-gray-200 bg-white motion-safe:animate-pulse" />
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
                                    aria-label={`Report card for ${data.studentName}, ${data.classroomName}, ${data.session}`}
                                    className="mx-auto min-w-[640px] max-w-5xl bg-white shadow-sm ring-1 ring-gray-200 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                                    dangerouslySetInnerHTML={{ __html: data.svg }}
                                />
                            </div>
                        </Panel>
                    ) : (
                        <section className="rounded-xl border border-gray-200 bg-white">
                            <EmptyState
                                icon={<Clock size={32} />}
                                title={showingCurrent ? "No result has been published yet." : `No result was published for ${picked.classroomName} in ${picked.session}.`}
                                hint="A report card appears once teachers have entered marks for every subject of an exam."
                            />
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

/**
 * Session-and-class picker. Native radios give arrow-key movement for free.
 * A sideways-scrolling row on phones, a grid from `sm` up.
 */
function ReportCardPicker({ entries, selectedKey, onSelect }: { entries: StudentReportCardEntry[]; selectedKey: string | null; onSelect: (key: string) => void }) {
    return (
        <section aria-labelledby="report-card-picker" className="rounded-xl border border-gray-200 bg-white">
            <div className="px-4 pt-5 sm:px-6">
                <h2 id="report-card-picker" className="text-base font-semibold text-gray-900">Your report cards</h2>
                <p className="text-sm text-gray-500">Report cards from earlier classes and sessions stay here.</p>
            </div>
            <fieldset className="px-4 pb-5 pt-4 sm:px-6">
                <legend className="sr-only">Choose a report card</legend>
                <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 py-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                    {entries.map((entry) => {
                        const key = entryKey(entry);
                        const checked = key === selectedKey;
                        const anyReleased = entry.exams.HALF_YEARLY.released || entry.exams.FINAL.released;
                        return (
                            <label
                                key={key}
                                className={`relative flex w-64 shrink-0 snap-start cursor-pointer flex-col rounded-lg border px-4 py-3 motion-safe:transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-500 has-[:focus-visible]:ring-offset-1 sm:w-auto ${
                                    checked ? "border-sky-600 bg-sky-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <input type="radio" name="report-card" value={key} checked={checked} onChange={() => onSelect(key)} className="sr-only" />
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${checked ? "border-sky-600" : "border-gray-300 bg-white"}`}
                                    >
                                        {checked && <span className="h-2 w-2 rounded-full bg-sky-600" />}
                                    </span>
                                    <span className="text-sm font-semibold tabular-nums text-gray-900">{entry.session}</span>
                                    {entry.isCurrent && <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">Current</span>}
                                </span>
                                <span className="mt-1 truncate pl-6 text-sm text-gray-700">{entry.classroomName}</span>
                                <span className="mt-2 flex items-center gap-1.5 pl-6 text-xs text-gray-600">
                                    {anyReleased ? (
                                        <CheckCircle2 size={14} aria-hidden="true" className="shrink-0 text-emerald-600" />
                                    ) : (
                                        <Clock size={14} aria-hidden="true" className="shrink-0 text-gray-400" />
                                    )}
                                    {releaseInWords(entry.exams)}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </fieldset>
        </section>
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
