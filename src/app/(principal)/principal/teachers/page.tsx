"use client";

import { useMemo, useState } from "react";
import { GraduationCap, Mail, Phone, RefreshCw, SearchX } from "lucide-react";
import { useGetAllTeachersQuery, type TeacherSummary } from "@/redux/api/principalApi";
import { heroGradient } from "@/components/principal/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    SearchBox,
    Skeleton,
    initials,
    paginate,
    secondaryBtn,
} from "@/components/principal/ui";

type Filter = "all" | "class" | "subject" | "inactive";

const isActive = (t: TeacherSummary) => t.isActive && t.status !== "INACTIVE";

/** Subjects grouped under each class, e.g. "Class 7 - Section B: English, Literature". */
function subjectsByClass(t: TeacherSummary) {
    const map = new Map<string, string[]>();
    for (const s of t.subjects ?? []) {
        const list = map.get(s.classroomName) ?? [];
        if (!list.includes(s.subjectName)) list.push(s.subjectName);
        map.set(s.classroomName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
}

function matches(t: TeacherSummary, q: string) {
    if (!q) return true;
    const hay = [t.fullName, t.employeeId, t.department, t.designation, t.email, ...(t.subjects ?? []).map((s) => s.subjectName)].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
}

export default function PrincipalTeachersPage() {
    const { data: teachers = [], isLoading, isError, refetch, isFetching } = useGetAllTeachersQuery();
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

    const sorted = useMemo(() => [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName)), [teachers]);

    const counts = useMemo(
        () => ({
            all: sorted.length,
            class: sorted.filter((t) => t.classTeacherOf).length,
            subject: sorted.filter((t) => !t.classTeacherOf && isActive(t)).length,
            inactive: sorted.filter((t) => !isActive(t)).length,
        }),
        [sorted]
    );

    const summary = useMemo(() => {
        const active = sorted.filter(isActive).length;
        const subjects = new Set(sorted.flatMap((t) => (t.subjects ?? []).map((s) => s.subjectName.trim().toLowerCase())));
        const classesCovered = new Set(sorted.flatMap((t) => (t.subjects ?? []).map((s) => s.classroomName)));
        return { total: sorted.length, active, classTeachers: counts.class, subjects: subjects.size, classesCovered: classesCovered.size };
    }, [sorted, counts.class]);

    const q = query.trim().toLowerCase();
    const filtered = sorted.filter((t) => {
        if (filter === "class" && !t.classTeacherOf) return false;
        if (filter === "subject" && (t.classTeacherOf || !isActive(t))) return false;
        if (filter === "inactive" && isActive(t)) return false;
        return matches(t, q);
    });
    const { pageCount, current, pageRows } = paginate(filtered, page);

    const changeFilter = (f: Filter) => {
        setFilter(f);
        setPage(1);
    };
    const changeQuery = (v: string) => {
        setQuery(v);
        setPage(1);
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Teachers"
                subtitle="Everyone teaching at the school, with their classes and subjects"
                actions={
                    <button type="button" onClick={() => refetch()} disabled={isFetching} className={secondaryBtn}>
                        <RefreshCw size={16} aria-hidden="true" className={isFetching ? "motion-safe:animate-spin" : ""} />
                        Refresh
                    </button>
                }
            />

            <section aria-label="Teaching staff summary" className={`rounded-xl px-5 py-6 sm:px-8 ${heroGradient}`}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
                    <Figure label="Teachers" value={summary.total} note={`${summary.active} active`} loading={isLoading} />
                    <Figure label="Class teachers" value={summary.classTeachers} note="Lead a class section" loading={isLoading} />
                    <Figure label="Subjects taught" value={summary.subjects} note="Distinct subject names" loading={isLoading} />
                    <Figure label="Classes covered" value={summary.classesCovered} note="With at least one subject teacher" loading={isLoading} />
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <FilterChips
                        label="Show"
                        value={filter}
                        onChange={changeFilter}
                        layoutId="principal-teachers-filter"
                        options={[
                            { value: "all", label: "All", count: counts.all },
                            { value: "class", label: "Class teachers", count: counts.class },
                            { value: "subject", label: "Subject teachers", count: counts.subject },
                            { value: "inactive", label: "Inactive", count: counts.inactive },
                        ]}
                    />
                    <SearchBox id="teacher-search" label="Search teachers" value={query} onChange={changeQuery} placeholder="Name, ID, subject or department" className="w-full lg:w-80" />
                </div>

                {isLoading ? (
                    <ul aria-label="Loading teachers" className="divide-y divide-gray-100">
                        {Array.from({ length: 5 }, (_, i) => (
                            <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <span className="flex-1 space-y-2">
                                    <Skeleton className="block h-4 w-40" />
                                    <Skeleton className="block h-3 w-64 max-w-full" />
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : isError ? (
                    <EmptyState
                        icon={<GraduationCap size={36} />}
                        title="Teachers couldn't be loaded"
                        hint="Check your connection, then try again."
                        action={
                            <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                                Try again
                            </button>
                        }
                    />
                ) : sorted.length === 0 ? (
                    <EmptyState icon={<GraduationCap size={36} />} title="No teachers yet" hint="Teachers appear here once their accounts are created." />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<SearchX size={36} />}
                        title="No teachers match"
                        hint="Try a different name or subject, or show everyone."
                        action={
                            <button
                                type="button"
                                onClick={() => {
                                    changeQuery("");
                                    changeFilter("all");
                                }}
                                className={secondaryBtn}
                            >
                                Show all teachers
                            </button>
                        }
                    />
                ) : (
                    <>
                        {/* Cards below xl */}
                        <ul className="divide-y divide-gray-100 xl:hidden">
                            {pageRows.map((t) => (
                                <li key={t.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-start gap-3">
                                        <TeacherAvatar name={t.fullName} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="font-medium text-gray-900">{t.fullName}</p>
                                                <StatusBadge active={isActive(t)} />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                <span className="tabular-nums">{t.employeeId || "No employee ID"}</span>
                                                {(t.designation || t.department) && <>, {[t.designation, t.department].filter(Boolean).join(", ")}</>}
                                            </p>
                                            {t.classTeacherOf && <ClassTeacherBadge name={t.classTeacherOf.name} className="mt-2" />}
                                            <SubjectList teacher={t} className="mt-3" />
                                            <Contact teacher={t} className="mt-3" />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Table from xl up */}
                        <div className="hidden xl:block">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Teacher</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Class teacher of</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Subjects by class</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((t) => (
                                        <tr key={t.id} className="align-top hover:bg-gray-50/60">
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <TeacherAvatar name={t.fullName} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900">{t.fullName}</p>
                                                        <p className="text-gray-500 tabular-nums">{t.employeeId || "No employee ID"}</p>
                                                        {(t.designation || t.department) && <p className="text-gray-500">{[t.designation, t.department].filter(Boolean).join(", ")}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{t.classTeacherOf ? <ClassTeacherBadge name={t.classTeacherOf.name} /> : <span className="text-gray-400">Not a class teacher</span>}</td>
                                            <td className="px-4 py-4">
                                                <SubjectList teacher={t} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <Contact teacher={t} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge active={isActive(t)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager total={filtered.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </section>
        </div>
    );
}

function Figure({ label, value, note, loading }: { label: string; value: number; note: string; loading: boolean }) {
    return (
        <div className="min-w-0">
            <p className="text-sm text-slate-300">{label}</p>
            {loading ? <Skeleton onDark className="mt-1 h-8 w-16" /> : <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">{value.toLocaleString("en-IN")}</p>}
            <p className="mt-0.5 text-xs text-slate-400">{note}</p>
        </div>
    );
}

function TeacherAvatar({ name }: { name: string }) {
    return (
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-sm font-semibold text-purple-700 ring-1 ring-purple-100">
            {initials(name) || "T"}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Inactive
        </span>
    );
}

function ClassTeacherBadge({ name, className = "" }: { name: string; className?: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-800 ring-1 ring-purple-100 ${className}`}>
            <GraduationCap size={13} aria-hidden="true" />
            Class teacher, {name}
        </span>
    );
}

function SubjectList({ teacher, className = "" }: { teacher: TeacherSummary; className?: string }) {
    const groups = subjectsByClass(teacher);
    if (groups.length === 0) return <p className={`text-sm text-gray-400 ${className}`}>No subjects assigned</p>;
    return (
        <dl className={`space-y-1 text-sm ${className}`}>
            {groups.map(([cls, subs]) => (
                <div key={cls} className="flex flex-wrap gap-x-1.5">
                    <dt className="text-gray-500">{cls}:</dt>
                    <dd className="text-gray-800">{subs.join(", ")}</dd>
                </div>
            ))}
        </dl>
    );
}

function Contact({ teacher, className = "" }: { teacher: TeacherSummary; className?: string }) {
    if (!teacher.primaryContact && !teacher.email) return <p className={`text-sm text-gray-400 ${className}`}>No contact details</p>;
    return (
        <div className={`space-y-1 text-sm ${className}`}>
            {teacher.primaryContact && (
                <a href={`tel:${teacher.primaryContact.replace(/\s+/g, "")}`} className="flex items-center gap-2 rounded-sm text-gray-700 tabular-nums hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                    <Phone size={14} aria-hidden="true" className="shrink-0 text-gray-400" />
                    {teacher.primaryContact}
                </a>
            )}
            {teacher.email && (
                <a href={`mailto:${teacher.email}`} className="flex min-w-0 items-center gap-2 rounded-sm text-gray-700 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                    <Mail size={14} aria-hidden="true" className="shrink-0 text-gray-400" />
                    <span className="truncate">{teacher.email}</span>
                </a>
            )}
        </div>
    );
}
