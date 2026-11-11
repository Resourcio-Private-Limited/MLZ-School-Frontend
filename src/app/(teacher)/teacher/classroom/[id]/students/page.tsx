"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MessageSquare, Users } from "lucide-react";
import { useGetClassStudentsQuery, useGetTeacherClassesQuery, type ClassStudent } from "@/redux/api/teacherApi";
import {
    AttendanceBadge,
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    SearchBox,
    Skeleton,
    focusRing,
    initials,
    paginate,
    secondaryBtn,
    shortDate,
} from "@/components/teacher/ui";

type Filter = "ALL" | "PRESENT" | "ABSENT" | "UNMARKED";

const statusOf = (s: ClassStudent): Exclude<Filter, "ALL"> => (s.attendance === "PRESENT" ? "PRESENT" : s.attendance === "ABSENT" ? "ABSENT" : "UNMARKED");
const byRoll = (a: ClassStudent, b: ClassStudent) => (a.rollNumber ?? "~").localeCompare(b.rollNumber ?? "~", "en-IN", { numeric: true }) || a.fullName.localeCompare(b.fullName);

export default function StudentListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = use(params);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("ALL");
    const [page, setPage] = useState(1);

    const { data: students = [], isLoading, isError, refetch } = useGetClassStudentsQuery(classroomId);
    const { data: myClasses = [] } = useGetTeacherClassesQuery();
    const className = myClasses.find((c) => c.id === classroomId)?.name ?? "Classroom";

    const q = search.trim().toLowerCase();
    const rows = [...students]
        .sort(byRoll)
        .filter((s) => (filter === "ALL" || statusOf(s) === filter) && (!q || s.fullName.toLowerCase().includes(q) || (s.rollNumber ?? "").toLowerCase().includes(q)));
    const { pageCount, current, pageRows } = paginate(rows, page);
    const count = (f: Exclude<Filter, "ALL">) => students.filter((s) => statusOf(s) === f).length;
    const messageHref = (s: ClassStudent) => `/teacher/messages?class=${encodeURIComponent(classroomId)}&to=${encodeURIComponent(s.userId)}`;

    const update = (fn: () => void) => {
        fn();
        setPage(1);
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Students"
                crumb={{ href: `/teacher/classroom/${classroomId}`, label: className }}
                subtitle={isLoading ? undefined : `${students.length.toLocaleString("en-IN")} ${students.length === 1 ? "student" : "students"}, sorted by roll number. Attendance shows each student's most recent register.`}
            />

            <section aria-label="Class list" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <FilterChips
                        label="Filter by last attendance"
                        layoutId="teacher-students-filter"
                        value={filter}
                        onChange={(v) => update(() => setFilter(v))}
                        options={[
                            { value: "ALL", label: "All", count: students.length },
                            { value: "PRESENT", label: "Present", count: count("PRESENT") },
                            { value: "ABSENT", label: "Absent", count: count("ABSENT") },
                            { value: "UNMARKED", label: "Not marked", count: count("UNMARKED") },
                        ]}
                    />
                    <SearchBox id="student-search" label="Search students" value={search} onChange={(v) => update(() => setSearch(v))} placeholder="Search by name or roll number" className="lg:w-72" />
                </div>

                {isLoading ? (
                    <div aria-hidden="true" className="space-y-3 px-4 py-5 sm:px-6">
                        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="block h-12 w-full" />)}
                    </div>
                ) : isError ? (
                    <EmptyState title="The class list couldn't be loaded." hint="Check your connection, then try again." action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>} />
                ) : students.length === 0 ? (
                    <EmptyState icon={<Users size={28} />} title="No students are enrolled in this class yet." hint="The school office adds students during admission." />
                ) : rows.length === 0 ? (
                    <EmptyState
                        title={q ? `No students match “${search.trim()}”.` : "No students in this group."}
                        action={<button type="button" onClick={() => update(() => { setSearch(""); setFilter("ALL"); })} className={secondaryBtn}>Show all students</button>}
                    />
                ) : (
                    <>
                        {/* Cards on phones and tablets */}
                        <ul className="divide-y divide-gray-100 xl:hidden">
                            {pageRows.map((s) => (
                                <li key={s.id} className="flex items-start gap-3 px-4 py-4 sm:px-6">
                                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">{initials(s.fullName)}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{s.fullName}</p>
                                        <p className="text-sm tabular-nums text-gray-500">Roll {s.rollNumber ?? "not set"}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600">
                                            <AttendanceBadge status={s.attendance} />
                                            <span>Grade {s.overallGrade ?? <span className="text-gray-400">not yet</span>}</span>
                                            {s.lastExam && <span className="min-w-0 truncate">Last exam: {s.lastExam.name}</span>}
                                        </div>
                                    </div>
                                    <Link href={messageHref(s)} aria-label={`Message ${s.fullName}`} className={`shrink-0 rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 motion-safe:transition-colors ${focusRing}`}>
                                        <MessageSquare size={18} aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Table on wide screens */}
                        <div className="hidden xl:block">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Roll</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Student</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Last attendance</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Overall grade</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Last exam</th>
                                        <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3.5 tabular-nums text-gray-600">{s.rollNumber ?? "—"}</td>
                                            <td className="px-6 py-3.5">
                                                <span className="flex items-center gap-3">
                                                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">{initials(s.fullName)}</span>
                                                    <span className="font-medium text-gray-900">{s.fullName}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5"><AttendanceBadge status={s.attendance} /></td>
                                            <td className="px-6 py-3.5 font-medium text-gray-900">{s.overallGrade ?? <span className="font-normal text-gray-400">Not yet</span>}</td>
                                            <td className="px-6 py-3.5 text-gray-600">
                                                {s.lastExam ? (
                                                    <>
                                                        {s.lastExam.name}
                                                        <span className="ml-2 tabular-nums text-gray-400">{shortDate(s.lastExam.examDate)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">None yet</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <Link href={messageHref(s)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 motion-safe:transition-colors ${focusRing}`}>
                                                    <MessageSquare size={15} aria-hidden="true" />
                                                    Message
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </section>
        </div>
    );
}
