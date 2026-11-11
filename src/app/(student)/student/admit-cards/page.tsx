"use client";

import { useId, useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { useGetAdmitCardsQuery, type StudentAdmitCard } from "@/redux/api/studentApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { EmptyState, PageHeader, Skeleton, focusRing, longDate, primaryBtn, secondaryBtn } from "@/components/student/ui";

export default function StudentAdmitCardsPage() {
    const titleId = useId();
    const { data: cards = [], isLoading, isError, refetch } = useGetAdmitCardsQuery();
    const [preview, setPreview] = useState<StudentAdmitCard | null>(null);
    const sorted = [...cards].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Admit cards" subtitle="Preview and download the admit cards the school has issued to you." />

            {isLoading ? (
                <div aria-hidden="true" className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1].map((i) => (
                        <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <Skeleton className="block h-48 w-full rounded-none" />
                            <div className="space-y-2 p-5">
                                <Skeleton className="block h-4 w-2/3" />
                                <Skeleton className="block h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        title="Admit cards couldn't be loaded."
                        hint="It might be a temporary problem — try again in a moment."
                        action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                    />
                </div>
            ) : sorted.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        icon={<FileText size={28} />}
                        title="No admit cards yet."
                        hint="Admit cards are usually issued about a week before an exam. Pending fees can hold one back."
                    />
                </div>
            ) : (
                <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {sorted.map((card) => (
                        <li key={card.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
                            {card.svgUrl ? (
                                <button
                                    type="button"
                                    onClick={() => setPreview(card)}
                                    aria-label={`Preview the admit card for ${card.examName}`}
                                    className={`group relative block h-48 overflow-hidden border-b border-gray-200 bg-gray-50 ${focusRing} focus-visible:ring-inset`}
                                >
                                    {/* The object is decorative here; the button opens a full-size preview. */}
                                    <object data={card.svgUrl} type="image/svg+xml" aria-hidden="true" tabIndex={-1} className="pointer-events-none h-full w-full">
                                        Admit card preview
                                    </object>
                                    <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-sm font-medium text-white opacity-0 group-hover:bg-slate-900/40 group-hover:opacity-100 group-focus-visible:bg-slate-900/40 group-focus-visible:opacity-100 motion-safe:transition">
                                        <Eye size={18} aria-hidden="true" className="mr-2" />
                                        Preview
                                    </span>
                                </button>
                            ) : (
                                <div className="flex h-48 items-center justify-center border-b border-gray-200 bg-gray-50 text-gray-300">
                                    <FileText size={36} aria-hidden="true" />
                                </div>
                            )}
                            <div className="flex flex-1 flex-col p-5">
                                <h2 className="font-semibold text-gray-900">{card.examName}</h2>
                                <dl className="mt-1 space-y-0.5 text-sm text-gray-500">
                                    {card.examDate && (
                                        <div className="flex gap-1">
                                            <dt>Exam starts</dt>
                                            <dd className="tabular-nums text-gray-700">{longDate(card.examDate)}</dd>
                                        </div>
                                    )}
                                    <div className="flex gap-1">
                                        <dt>Issued</dt>
                                        <dd className="tabular-nums text-gray-700">{longDate(card.issuedAt)}</dd>
                                    </div>
                                </dl>
                                <div className="mt-auto flex flex-wrap gap-3 pt-4">
                                    <a href={card.fileUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
                                        <Download size={16} aria-hidden="true" />
                                        Download PDF
                                    </a>
                                    {card.svgUrl && (
                                        <button type="button" onClick={() => setPreview(card)} className={`${secondaryBtn} h-10`}>
                                            <Eye size={16} aria-hidden="true" />
                                            Preview
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={!!preview} onClose={() => setPreview(null)} labelledBy={titleId} className="sm:max-w-3xl">
                {preview && (
                    <>
                        <DialogHeader accent="sky" id={titleId} title={preview.examName} subtitle={`Issued ${longDate(preview.issuedAt)}`} onClose={() => setPreview(null)} />
                        <div className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4">
                            {preview.svgUrl && (
                                <object data={preview.svgUrl} type="image/svg+xml" aria-label={`Admit card for ${preview.examName}`} className="mx-auto block aspect-[1/1.414] w-full max-w-2xl rounded-lg bg-white ring-1 ring-gray-200">
                                    Admit card preview
                                </object>
                            )}
                        </div>
                        <div className="flex justify-end border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
                            <a href={preview.fileUrl} target="_blank" rel="noopener noreferrer" className={primaryBtn}>
                                <Download size={16} aria-hidden="true" />
                                Download PDF
                            </a>
                        </div>
                    </>
                )}
            </Dialog>
        </div>
    );
}
