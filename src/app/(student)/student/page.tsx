"use client";

import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Video } from "lucide-react";
import { useGetDashboardQuery, useGetMonthlyFeesQuery, useGetProfileQuery } from "@/redux/api/studentApi";
import { useGetNoticesQuery } from "@/redux/api/operationsApi";
import { heroGradient } from "@/components/student/brand";
import { Panel, Skeleton, clock, dayHeading, focusRing, inr, linkClass, linkOnDark, relativeDay, shortDate } from "@/components/student/ui";
import { firstNameOf } from "@/lib/names";

const greeting = (hour: number) => (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");

export default function StudentHomePage() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = now.toLocaleString("en-IN", { month: "long" });

    const dashQ = useGetDashboardQuery();
    const { data: profile } = useGetProfileQuery();
    const feesQ = useGetMonthlyFeesQuery(year);
    const noticesQ = useGetNoticesQuery();

    const classroom = dashQ.data?.classroom;
    const onlineClasses = [...(dashQ.data?.upcomingOnlineClasses ?? [])].sort((a, b) => a.date.localeCompare(b.date));
    const nextClass = onlineClasses[0];
    const exams = [...(dashQ.data?.latestExams ?? [])].sort((a, b) => b.examDate.localeCompare(a.examDate)).slice(0, 3);
    const notices = [...(noticesQ.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);

    const fees = feesQ.data?.fees ?? [];
    const thisMonth = fees.find((f) => f.month === month);
    const unpaid = fees.filter((f) => !f.isPaid && f.totalAmount > 0 && f.month <= month);
    const unpaidTotal = unpaid.reduce((n, f) => n + f.totalAmount, 0);

    const firstName = firstNameOf(profile?.personal.fullName);
    const roll = profile?.academic.classRoll ?? profile?.academic.rollNumber;

    return (
        <MotionConfig reducedMotion="user">
            <div className="max-w-7xl space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                            {greeting(now.getHours())}{firstName ? `, ${firstName}` : ""}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Here is what&apos;s coming up at school.</p>
                    </div>
                    <time dateTime={now.toISOString().slice(0, 10)} className="text-sm text-gray-700">
                        {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </time>
                </header>

                {dashQ.isError && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        Your classroom details couldn&apos;t be loaded. It might be a temporary problem — try again in a moment.
                        <button type="button" onClick={() => dashQ.refetch()} className={`rounded-md bg-white px-3 py-1.5 font-medium text-red-800 ring-1 ring-red-200 hover:bg-red-100 ${focusRing}`}>
                            Try again
                        </button>
                    </div>
                )}

                {/* Classroom summary */}
                <section aria-labelledby="classroom-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-5 sm:px-6">
                        <h2 id="classroom-summary" className="text-base font-semibold">
                            {dashQ.isLoading ? <Skeleton onDark className="h-5 w-40 align-middle" /> : classroom?.name ?? "Your classroom"}
                        </h2>
                        <Link href="/student/classroom" className={linkOnDark}>Open classroom</Link>
                    </div>
                    <div className="px-4 pb-6 pt-4 sm:px-6">
                        <dl className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <div className="min-w-0">
                                <dt className="text-sm text-slate-300">Class teacher</dt>
                                <dd className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
                                    {dashQ.isLoading ? <Skeleton onDark className="h-7 w-40 align-middle" /> : classroom?.classTeacher ?? "Not assigned yet"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-300">Subjects</dt>
                                <dd className="mt-1 text-2xl font-semibold tracking-tight text-white tabular-nums">
                                    {dashQ.isLoading ? <Skeleton onDark className="h-7 w-12 align-middle" /> : classroom?.subjectCount ?? "—"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-slate-300">Roll number</dt>
                                <dd className="mt-1 text-2xl font-semibold tracking-tight text-white tabular-nums">{roll ?? "—"}</dd>
                            </div>
                        </dl>
                        <p className="mt-6 min-h-5 border-t border-white/10 pt-4 text-sm text-slate-300">
                            {dashQ.isLoading
                                ? null
                                : nextClass
                                  ? <>Next online class: <span className="font-medium text-white">{nextClass.topic}</span>, {relativeDay(nextClass.date)} at {clock(nextClass.date)}.</>
                                  : "No online classes are scheduled right now."}
                        </p>
                    </div>
                </section>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    <Panel title="Upcoming online classes" subtitle="Live sessions your teachers have scheduled" className="lg:col-span-2">
                        <div className="mt-3">
                            {dashQ.isLoading ? (
                                <div className="space-y-3 px-4 pb-5 pt-2 sm:px-6">
                                    {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-5 w-full" />)}
                                </div>
                            ) : onlineClasses.length === 0 ? (
                                <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">
                                    Nothing scheduled yet. When a teacher schedules a live class, its link appears here.
                                </p>
                            ) : (
                                <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                    {onlineClasses.slice(0, 5).map((c) => (
                                        <li key={c.id}>
                                            <a
                                                href={c.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}
                                            >
                                                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                                                    <Video size={18} />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-gray-900 group-hover:text-sky-700 motion-safe:transition-colors">{c.topic}</span>
                                                    <span className="block text-xs text-gray-500 tabular-nums">
                                                        <time dateTime={c.date}>{dayHeading(c.date)}, {clock(c.date)}</time>
                                                    </span>
                                                </span>
                                                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-sky-700">
                                                    Join
                                                    <ExternalLink size={14} aria-hidden="true" />
                                                    <span className="sr-only">(opens in a new tab)</span>
                                                </span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Panel>

                    <div className="space-y-6">
                        <Panel title={`${monthName} fees`} action={<Link href="/student/payment" className={linkClass}>Fee payment</Link>}>
                            <div className="px-4 pb-6 pt-3 sm:px-6">
                                {feesQ.isLoading ? (
                                    <Skeleton className="h-9 w-28" />
                                ) : feesQ.isError ? (
                                    <p className="text-sm text-gray-500">Fees couldn&apos;t be loaded. Open Fee payment to try again.</p>
                                ) : !thisMonth || thisMonth.totalAmount === 0 ? (
                                    <p className="text-sm text-gray-600">No fees have been set for {monthName} yet.</p>
                                ) : thisMonth.isPaid ? (
                                    <>
                                        <p className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{inr(thisMonth.paidAmount || thisMonth.totalAmount)}</p>
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                                            <CheckCircle2 size={16} aria-hidden="true" />
                                            Paid{thisMonth.paidAt ? ` on ${shortDate(thisMonth.paidAt)}` : ""}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">{inr(thisMonth.totalAmount)}</p>
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
                                            <Clock size={16} aria-hidden="true" />
                                            Due for {monthName}
                                        </p>
                                    </>
                                )}
                                {!feesQ.isLoading && unpaid.length > 1 && (
                                    <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                        <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                        {unpaid.length} months are unpaid, {inr(unpaidTotal)} in all.
                                    </p>
                                )}
                            </div>
                        </Panel>

                        <Panel title="Exams" action={<Link href="/student/exams" className={linkClass}>All exams</Link>}>
                            <div className="pt-3">
                                {dashQ.isLoading ? (
                                    <div className="px-4 pb-5 sm:px-6"><Skeleton className="block h-5 w-full" /></div>
                                ) : exams.length === 0 ? (
                                    <p className="px-4 pb-6 text-sm text-gray-500 sm:px-6">No exams have been scheduled for your class yet.</p>
                                ) : (
                                    <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                        {exams.map((e) => (
                                            <li key={e.id} className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-6">
                                                <span className="min-w-0 truncate text-sm font-medium text-gray-900">{e.name}</span>
                                                <time dateTime={e.examDate} className="shrink-0 text-sm tabular-nums text-gray-500">{shortDate(e.examDate)}</time>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </Panel>
                    </div>
                </div>

                <Panel title="Notice board" subtitle="The latest from the school office" action={<Link href="/student/noticeboard" className={linkClass}>All notices</Link>}>
                    <div className="mt-3">
                        {noticesQ.isLoading ? (
                            <div className="space-y-3 px-4 pb-5 pt-2 sm:px-6">
                                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-5 w-full" />)}
                            </div>
                        ) : notices.length === 0 ? (
                            <p className="px-4 pb-6 pt-2 text-sm text-gray-500 sm:px-6">No notices have been published yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border-t border-gray-100">
                                {notices.map((n) => (
                                    <li key={n.id}>
                                        <Link
                                            href="/student/noticeboard"
                                            className={`group grid gap-x-6 gap-y-0.5 px-4 py-3 hover:bg-gray-50 motion-safe:transition-colors sm:grid-cols-[6rem_minmax(0,1fr)] sm:px-6 ${focusRing} focus-visible:ring-inset`}
                                        >
                                            <time dateTime={n.createdAt} className="text-sm tabular-nums text-gray-500">{shortDate(n.createdAt)}</time>
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium text-gray-900 group-hover:text-sky-700 motion-safe:transition-colors">{n.title}</span>
                                                <span className="block truncate text-sm text-gray-500">{n.content}</span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>
            </div>
        </MotionConfig>
    );
}
