"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ClipboardList, Download, FileText, Info, XCircle } from "lucide-react";
import { useGetExamsQuery, type StudentExam } from "@/redux/api/studentApi";
import { heroGradient } from "@/components/student/brand";
import { EmptyState, PageHeader, Pager, Skeleton, daysFromToday, focusRing, linkOnDark, longDate, paginate, relativeDay, secondaryBtn } from "@/components/student/ui";

type Tab = "upcoming" | "past";

const actionLink = `inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium motion-safe:transition ${focusRing}`;

function Eligibility({ exam }: { exam: StudentExam }) {
    return exam.submissionOpen ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} aria-hidden="true" />
            Eligible
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
            <XCircle size={16} aria-hidden="true" />
            Not eligible
        </span>
    );
}

function AdmitCardAction({ exam }: { exam: StudentExam }) {
    return exam.admitCard ? (
        <a href={exam.admitCard.fileUrl} target="_blank" rel="noopener noreferrer" className={`${actionLink} bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.97]`}>
            <Download size={16} aria-hidden="true" />
            Admit card
            <span className="sr-only">for {exam.name} (opens in a new tab)</span>
        </a>
    ) : (
        <span className="text-sm text-gray-500">Admit card not issued</span>
    );
}

function ResultAction({ exam }: { exam: StudentExam }) {
    return exam.result ? (
        <a href={exam.result.fileUrl} target="_blank" rel="noopener noreferrer" className={`${actionLink} border border-gray-300 bg-white text-gray-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 active:scale-[0.97]`}>
            <FileText size={16} aria-hidden="true" />
            View result
            <span className="sr-only">for {exam.name} (opens in a new tab)</span>
        </a>
    ) : (
        <span className="text-sm text-gray-500">Result not published</span>
    );
}

export default function ExamsPage() {
    const reduceMotion = useReducedMotion();
    const { data: exams = [], isLoading, isError, refetch } = useGetExamsQuery();
    const [tab, setTab] = useState<Tab>("upcoming");
    const [page, setPage] = useState(1);

    const upcoming = exams.filter((e) => daysFromToday(e.examDate) >= 0).sort((a, b) => a.examDate.localeCompare(b.examDate));
    const past = exams.filter((e) => daysFromToday(e.examDate) < 0).sort((a, b) => b.examDate.localeCompare(a.examDate));
    const next = upcoming[0];
    const rows = tab === "upcoming" ? upcoming : past;
    const { pageCount, current, pageRows } = paginate(rows, page);

    const admitCards = exams.filter((e) => e.admitCard).length;
    const results = exams.filter((e) => e.result).length;

    const tabs: { key: Tab; label: string; count: number }[] = [
        { key: "upcoming", label: "Upcoming", count: upcoming.length },
        { key: "past", label: "Past", count: past.length },
    ];

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Exams" subtitle="Your exam dates, admit cards and marks. Your report card is under Results." />

            <section aria-labelledby="next-exam" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                    <h2 id="next-exam" className="text-base font-semibold">Next exam</h2>
                    <Link href="/student/admit-cards" className={linkOnDark}>Admit cards</Link>
                </div>
                <div className="px-4 pb-6 pt-3 sm:px-6">
                    {isLoading ? (
                        <Skeleton onDark className="h-9 w-64" />
                    ) : next ? (
                        <>
                            <p className="text-3xl font-semibold tracking-tight">{next.name}</p>
                            <p className="mt-1 text-sm text-slate-300">
                                {next.subject}, <time dateTime={next.examDate}>{longDate(next.examDate)}</time>{" "}
                                <span className="font-medium text-sky-200">({relativeDay(next.examDate)})</span>
                            </p>
                        </>
                    ) : (
                        <p className="text-lg text-slate-200">No upcoming exams are scheduled.</p>
                    )}
                    <dl className="mt-6 grid grid-cols-1 gap-6 border-t border-white/10 pt-5 lg:grid-cols-3">
                        {[
                            { label: "Upcoming exams", value: upcoming.length },
                            { label: "Admit cards issued", value: admitCards },
                            { label: "Results published", value: results },
                        ].map((f) => (
                            <div key={f.label}>
                                <dt className="text-sm text-slate-300">{f.label}</dt>
                                <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                                    {isLoading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : f.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div role="tablist" aria-label="Exams" className="-mb-px flex gap-6 overflow-x-auto border-b border-gray-200 px-4 sm:px-6">
                    {tabs.map((t) => {
                        const active = tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => {
                                    setTab(t.key);
                                    setPage(1);
                                }}
                                className={`relative flex shrink-0 items-center gap-2 rounded-sm py-4 text-sm font-medium motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                            >
                                {t.label}
                                <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? "bg-sky-50 text-sky-700" : "bg-gray-100 text-gray-600"}`}>{isLoading ? "…" : t.count}</span>
                                {active && (
                                    <motion.span
                                        layoutId="student-exams-tab-underline"
                                        className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-sky-600"
                                        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div role="tabpanel" aria-label={tab === "upcoming" ? "Upcoming exams" : "Past exams"}>
                    {isLoading ? (
                        <div aria-hidden="true" className="space-y-3 px-6 py-6">
                            {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-10 w-full" />)}
                        </div>
                    ) : isError ? (
                        <EmptyState
                            title="Exams couldn't be loaded."
                            hint="It might be a temporary problem — try again in a moment."
                            action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    ) : rows.length === 0 ? (
                        <EmptyState
                            icon={<ClipboardList size={28} />}
                            title={tab === "upcoming" ? "No upcoming exams." : "No past exams yet."}
                            hint={tab === "upcoming" ? "When your teachers schedule an exam, it appears here." : "Exams move here once their date has passed."}
                        />
                    ) : (
                        <>
                            {/* Cards below xl */}
                            <ul className="divide-y divide-gray-100 xl:hidden">
                                {pageRows.map((e) => (
                                    <li key={e.id} className="px-4 py-4 sm:px-6">
                                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900">{e.name}</p>
                                                <p className="text-sm text-gray-500">{e.subject}</p>
                                            </div>
                                            <time dateTime={e.examDate} className="shrink-0 text-sm tabular-nums text-gray-700">{longDate(e.examDate)}</time>
                                        </div>
                                        <div className="mt-2"><Eligibility exam={e} /></div>
                                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                            <AdmitCardAction exam={e} />
                                            <ResultAction exam={e} />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Table from xl */}
                            <div className="hidden xl:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-medium">Exam</th>
                                            <th scope="col" className="px-6 py-3 font-medium">Subject</th>
                                            <th scope="col" className="px-6 py-3 font-medium">Date</th>
                                            <th scope="col" className="px-6 py-3 font-medium">Eligibility</th>
                                            <th scope="col" className="px-6 py-3 font-medium">Admit card</th>
                                            <th scope="col" className="px-6 py-3 font-medium">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pageRows.map((e) => (
                                            <tr key={e.id} className="hover:bg-gray-50 motion-safe:transition-colors">
                                                <td className="px-6 py-3.5 font-medium text-gray-900">{e.name}</td>
                                                <td className="px-6 py-3.5 text-gray-600">{e.subject}</td>
                                                <td className="px-6 py-3.5 tabular-nums text-gray-700">
                                                    <time dateTime={e.examDate}>{longDate(e.examDate)}</time>
                                                </td>
                                                <td className="px-6 py-3.5"><Eligibility exam={e} /></td>
                                                <td className="px-6 py-3.5"><AdmitCardAction exam={e} /></td>
                                                <td className="px-6 py-3.5"><ResultAction exam={e} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                        </>
                    )}
                </div>
            </section>

            <aside className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:px-6">
                <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-sky-600" />
                <div className="text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Before your exams</p>
                    <p className="mt-1 leading-relaxed">
                        Admit cards are usually issued about a week before the exam. Results are published within 15 days of the final exam.
                        If an exam shows Not eligible, clear any pending fees on the{" "}
                        <Link href="/student/payment" className={`rounded-sm font-medium text-sky-700 hover:underline underline-offset-4 ${focusRing}`}>Fee payment</Link> page or speak to your class teacher.
                    </p>
                </div>
            </aside>
        </div>
    );
}
