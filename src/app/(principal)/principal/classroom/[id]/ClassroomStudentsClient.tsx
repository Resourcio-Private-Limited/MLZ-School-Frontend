"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import { AlertCircle, ArrowUpRight, CheckCircle2, ListOrdered, Plus, RefreshCw, UserCheck, Users, XCircle } from "lucide-react";
import { useGetClassroomQuery, useGetClassroomStudentsQuery, useRollArrangeByNameMutation, type ClassroomStudent } from "@/redux/api/principalApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { heroGradient } from "@/components/principal/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Pager,
    Panel,
    SearchBox,
    Skeleton,
    errorMessage,
    focusRing,
    initials,
    inputClass,
    paginate,
    primaryBtn,
    secondaryBtn,
} from "@/components/principal/ui";
import ClassroomAdmissionForm from "./ClassroomAdmissionForm";
import StudentDetailModal from "./StudentDetailModal";
import PromotionModal from "./PromotionModal";

type Filter = "all" | "eligible" | "not-eligible" | "inactive";
type Sort = "roll" | "name" | "admission";

const FEE_LABEL: Record<NonNullable<ClassroomStudent["feeStatus"]>, { label: string; tone: string; dot: string }> = {
    CLEARED: { label: "Cleared", tone: "bg-emerald-50 text-emerald-800 ring-emerald-100", dot: "bg-emerald-500" },
    PENDING: { label: "Pending", tone: "bg-amber-50 text-amber-800 ring-amber-100", dot: "bg-amber-500" },
    OVERDUE: { label: "Overdue", tone: "bg-red-50 text-red-800 ring-red-100", dot: "bg-red-500" },
};

const byRoll = (a: ClassroomStudent, b: ClassroomStudent) => {
    const ra = a.classRoll ?? Number.POSITIVE_INFINITY;
    const rb = b.classRoll ?? Number.POSITIVE_INFINITY;
    return ra === rb ? a.fullName.localeCompare(b.fullName) : ra - rb;
};

export default function ClassroomStudentsClient({ classroomId }: { classroomId: string }) {
    const reduceMotion = useReducedMotion();
    const { data: classroom, isLoading: loadingClassroom, isError: classroomError, refetch: refetchClassroom } = useGetClassroomQuery(classroomId);
    const { data: students = [], isLoading, isError, error, refetch } = useGetClassroomStudentsQuery(classroomId);
    const [rollArrangeByName, { isLoading: isArranging }] = useRollArrangeByNameMutation();

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [sort, setSort] = useState<Sort>("roll");
    const [page, setPage] = useState(1);

    const [admissionOpen, setAdmissionOpen] = useState(false);
    const [promotionOpen, setPromotionOpen] = useState(false);
    const [arrangeOpen, setArrangeOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);

    const name = classroom?.name ?? "Classroom";
    const enrolled = isLoading ? classroom?.total ?? 0 : students.length;
    const capacity = classroom?.capacity ?? 0;
    const seatsLeft = Math.max(0, capacity - enrolled);
    const fill = capacity > 0 ? Math.min(100, (enrolled / capacity) * 100) : 0;
    const eligibleCount = students.filter((s) => s.examEligibility).length;
    const inactiveCount = students.filter((s) => !s.isActive).length;

    // Only show columns the endpoint actually filled in.
    const hasAttendance = students.some((s) => typeof s.attendancePercentage === "number");
    const hasMarks = students.some((s) => typeof s.averageMarks === "number");
    const hasFees = students.some((s) => !!s.feeStatus);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = students.filter((s) => {
            if (filter === "eligible" && !s.examEligibility) return false;
            if (filter === "not-eligible" && s.examEligibility) return false;
            if (filter === "inactive" && s.isActive) return false;
            if (!q) return true;
            return [s.fullName, s.admissionNo, s.email, s.rollNumber ?? "", s.classRoll != null ? String(s.classRoll) : ""].some((v) => v?.toLowerCase().includes(q));
        });
        if (sort === "name") return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
        if (sort === "admission") return [...list].sort((a, b) => a.admissionNo.localeCompare(b.admissionNo));
        return [...list].sort(byRoll);
    }, [students, search, filter, sort]);

    const { pageCount, current, pageRows } = paginate(rows, page);
    const filtersOn = filter !== "all" || search.trim() !== "";

    const confirmRollArrange = async () => {
        try {
            const result = await rollArrangeByName({ classroomId }).unwrap();
            toast.success(`Class rolls arranged by name for ${result.count} students.`);
            setArrangeOpen(false);
            setSort("roll");
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Couldn't arrange class rolls. Try again in a moment."));
        }
    };

    if (classroomError && !classroom) {
        return (
            <div className="max-w-7xl space-y-6">
                <PageHeader title="Classroom" crumb={{ href: "/principal", label: "Classrooms" }} />
                <section className="rounded-xl border border-gray-200 bg-white">
                    <EmptyState
                        icon={<AlertCircle size={40} />}
                        title="This class couldn't be loaded"
                        hint="Check your connection and try again. If it keeps happening, go back to Classrooms and open the class again."
                        action={
                            <button type="button" onClick={() => { refetchClassroom(); refetch(); }} className={secondaryBtn}>
                                <RefreshCw size={16} aria-hidden="true" />
                                Try again
                            </button>
                        }
                    />
                </section>
            </div>
        );
    }

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title={name}
                crumb={{ href: "/principal", label: "Classrooms" }}
                subtitle={
                    classroom ? (
                        <>
                            Grade {classroom.grade}, section {classroom.section}
                        </>
                    ) : (
                        <Skeleton className="h-4 w-40" />
                    )
                }
                actions={
                    <>
                        <button type="button" onClick={() => setPromotionOpen(true)} disabled={!classroom || students.length === 0} className={secondaryBtn}>
                            <UserCheck size={16} aria-hidden="true" />
                            Promote students
                        </button>
                        <button type="button" onClick={() => setArrangeOpen(true)} disabled={students.length === 0} className={secondaryBtn}>
                            <ListOrdered size={16} aria-hidden="true" />
                            Arrange rolls by name
                        </button>
                        <button type="button" onClick={() => setAdmissionOpen(true)} disabled={!classroom} className={primaryBtn}>
                            <Plus size={16} aria-hidden="true" />
                            Admit student
                        </button>
                    </>
                }
            />

            {/* Headline summary */}
            <section aria-label="Class summary" className={`overflow-hidden rounded-xl p-5 sm:p-6 ${heroGradient}`}>
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                    <div>
                        <p className="text-sm text-slate-300">Enrolment</p>
                        {loadingClassroom || isLoading ? (
                            <Skeleton onDark className="mt-2 h-9 w-48" />
                        ) : (
                            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
                                {enrolled.toLocaleString("en-IN")}
                                <span className="text-lg font-normal text-slate-300"> of {capacity.toLocaleString("en-IN")} seats</span>
                            </p>
                        )}
                    </div>
                    {!(loadingClassroom || isLoading) && <CapacityNote fill={fill} seatsLeft={seatsLeft} />}
                </div>
                <div
                    role="meter"
                    aria-label="Seats filled"
                    aria-valuemin={0}
                    aria-valuemax={capacity || 100}
                    aria-valuenow={enrolled}
                    aria-valuetext={`${enrolled} of ${capacity} seats filled`}
                    className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
                >
                    <motion.span
                        className={`block h-full rounded-full ${fill >= 95 ? "bg-rose-300" : fill >= 80 ? "bg-amber-300" : "bg-purple-300"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${fill}%` }}
                        transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                </div>

                <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-3 lg:gap-6">
                    <div className="min-w-0">
                        <dt className="text-sm text-slate-300">Class teacher</dt>
                        <dd className="mt-1 truncate text-base font-medium">
                            {loadingClassroom ? (
                                <Skeleton onDark className="h-5 w-36" />
                            ) : classroom?.classTeacher ? (
                                <>
                                    {classroom.classTeacher.fullName}
                                    {classroom.classTeacher.employeeId && <span className="ml-2 text-sm font-normal text-slate-400">{classroom.classTeacher.employeeId}</span>}
                                </>
                            ) : (
                                <span className="text-amber-300">Not assigned</span>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Eligible for exams</dt>
                        <dd className="mt-1 text-base font-medium tabular-nums">
                            {isLoading ? (
                                <Skeleton onDark className="h-5 w-24" />
                            ) : (
                                <>
                                    {eligibleCount.toLocaleString("en-IN")}
                                    <span className="font-normal text-slate-300"> of {students.length.toLocaleString("en-IN")}</span>
                                    {students.length - eligibleCount > 0 && (
                                        <span className="ml-2 text-sm font-normal text-rose-300">{students.length - eligibleCount} not eligible</span>
                                    )}
                                </>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Class type</dt>
                        <dd className="mt-1 text-base font-medium">
                            {loadingClassroom ? <Skeleton onDark className="h-5 w-24" /> : classroom?.classType === "PRIMARY" ? "Primary" : classroom?.classType === "SECONDARY" ? "Secondary" : "Not set"}
                        </dd>
                    </div>
                </dl>
            </section>

            {/* Students */}
            <Panel
                title="Students"
                subtitle={isLoading ? "Loading the class list…" : `${students.length.toLocaleString("en-IN")} in this class, sorted by ${sort === "roll" ? "class roll" : sort === "name" ? "name" : "admission number"}`}
            >
                <div className="space-y-3 px-4 pb-4 pt-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchBox
                            id="classroom-student-search"
                            label="Search students"
                            value={search}
                            onChange={(v) => {
                                setSearch(v);
                                setPage(1);
                            }}
                            placeholder="Search by name, roll, admission number or email"
                            className="min-w-0 flex-1"
                        />
                        <div className="flex items-center gap-2">
                            <label htmlFor="classroom-student-sort" className="shrink-0 text-sm text-gray-500">
                                Sort by
                            </label>
                            <select
                                id="classroom-student-sort"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as Sort)}
                                className={`${inputClass} h-10 w-full py-0 sm:w-44`}
                            >
                                <option value="roll">Class roll</option>
                                <option value="name">Name</option>
                                <option value="admission">Admission number</option>
                            </select>
                        </div>
                    </div>
                    <FilterChips<Filter>
                        label="Filter students"
                        value={filter}
                        layoutId="principal-classroom-filter"
                        onChange={(v) => {
                            setFilter(v);
                            setPage(1);
                        }}
                        options={[
                            { value: "all", label: "All", count: students.length },
                            { value: "eligible", label: "Eligible for exams", count: eligibleCount },
                            { value: "not-eligible", label: "Not eligible", count: students.length - eligibleCount },
                            ...(inactiveCount > 0 ? [{ value: "inactive" as const, label: "Inactive", count: inactiveCount }] : []),
                        ]}
                    />
                </div>

                {isLoading ? (
                    <ul aria-label="Loading students" className="divide-y divide-gray-100 border-t border-gray-200">
                        {Array.from({ length: 5 }, (_, i) => (
                            <li key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
                                <Skeleton className="h-9 w-9 rounded-full" />
                                <span className="flex-1 space-y-2">
                                    <Skeleton className="block h-4 w-40" />
                                    <Skeleton className="block h-3 w-28" />
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : isError ? (
                    <div className="border-t border-gray-200">
                        <EmptyState
                            icon={<AlertCircle size={36} />}
                            title="The class list couldn't be loaded"
                            hint={errorMessage(error, "Check your connection and try again.")}
                            action={
                                <button type="button" onClick={() => refetch()} className={secondaryBtn}>
                                    <RefreshCw size={16} aria-hidden="true" />
                                    Try again
                                </button>
                            }
                        />
                    </div>
                ) : rows.length === 0 ? (
                    <div className="border-t border-gray-200">
                        {filtersOn ? (
                            <EmptyState
                                icon={<Users size={36} />}
                                title="No students match"
                                hint="Try another name or roll number, or clear the filters."
                                action={
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setFilter("all");
                                            setPage(1);
                                        }}
                                        className={secondaryBtn}
                                    >
                                        Clear filters
                                    </button>
                                }
                            />
                        ) : (
                            <EmptyState
                                icon={<Users size={36} />}
                                title="No students in this class yet"
                                hint="Admit the first student to start the class list."
                                action={
                                    <button type="button" onClick={() => setAdmissionOpen(true)} className={primaryBtn}>
                                        <Plus size={16} aria-hidden="true" />
                                        Admit student
                                    </button>
                                }
                            />
                        )}
                    </div>
                ) : (
                    <>
                        {/* Cards below xl */}
                        <ul className="divide-y divide-gray-100 border-t border-gray-200 xl:hidden">
                            {pageRows.map((s) => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => setDetailId(s.id)}
                                        aria-label={`View ${s.fullName}`}
                                        className={`flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}
                                    >
                                        <StudentAvatar student={s} />
                                        <span className="min-w-0 flex-1">
                                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="truncate text-sm font-medium text-gray-900">{s.fullName}</span>
                                                {!s.isActive && <InactiveBadge />}
                                            </span>
                                            <span className="mt-0.5 block text-sm tabular-nums text-gray-500">
                                                {s.classRoll != null ? `Roll ${s.classRoll}` : "No class roll"}, {s.admissionNo}
                                            </span>
                                            <span className="mt-2 flex flex-wrap items-center gap-2">
                                                <EligibilityBadge eligible={s.examEligibility} />
                                                {s.feeStatus && <FeeBadge status={s.feeStatus} />}
                                                {typeof s.attendancePercentage === "number" && (
                                                    <span className="text-xs tabular-nums text-gray-500">Attendance {s.attendancePercentage.toFixed(0)}%</span>
                                                )}
                                            </span>
                                        </span>
                                        <ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-gray-400" />
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Table from xl up */}
                        <div className="relative hidden overflow-x-auto border-t border-gray-200 xl:block">
                            <table className="w-full text-left text-sm">
                                <thead className="whitespace-nowrap bg-gray-50 text-gray-500">
                                    <tr>
                                        <th scope="col" aria-sort={sort === "roll" ? "ascending" : "none"} className="py-3 pl-6 pr-3 font-medium">Roll</th>
                                        <th scope="col" aria-sort={sort === "name" ? "ascending" : "none"} className="px-4 py-3 font-medium">Student</th>
                                        <th scope="col" aria-sort={sort === "admission" ? "ascending" : "none"} className="px-4 py-3 font-medium">Admission no.</th>
                                        <th scope="col" className="hidden px-4 py-3 font-medium 2xl:table-cell">Parent contact</th>
                                        <th scope="col" className="px-4 py-3 font-medium">Exams</th>
                                        {hasAttendance && <th scope="col" className="px-4 py-3 text-right font-medium">Attendance</th>}
                                        {hasMarks && <th scope="col" className="px-4 py-3 text-right font-medium">Avg. marks</th>}
                                        {hasFees && <th scope="col" className="px-4 py-3 font-medium">Fees</th>}
                                        <th scope="col" className="py-3 pl-3 pr-6 text-right font-medium">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pageRows.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/70">
                                            <td className="py-3 pl-6 pr-3 tabular-nums text-gray-900">{s.classRoll ?? <span className="text-gray-400">None</span>}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <StudentAvatar student={s} />
                                                    <div className="min-w-0 max-w-[12rem] 2xl:max-w-xs">
                                                        <p className="flex items-center gap-2 font-medium text-gray-900">
                                                            <span className="truncate">{s.fullName}</span>
                                                            {!s.isActive && <InactiveBadge />}
                                                        </p>
                                                        <p className="truncate text-gray-500">{s.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-gray-700">{s.admissionNo}</td>
                                            <td className="hidden px-4 py-3 tabular-nums text-gray-700 2xl:table-cell">{s.parentContact || s.primaryContact || <span className="text-gray-400">Not added</span>}</td>
                                            <td className="px-4 py-3">
                                                <EligibilityBadge eligible={s.examEligibility} />
                                            </td>
                                            {hasAttendance && (
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                    {typeof s.attendancePercentage === "number" ? `${s.attendancePercentage.toFixed(1)}%` : <span className="text-gray-400">None</span>}
                                                </td>
                                            )}
                                            {hasMarks && (
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                    {typeof s.averageMarks === "number" ? s.averageMarks.toFixed(1) : <span className="text-gray-400">None</span>}
                                                </td>
                                            )}
                                            {hasFees && <td className="px-4 py-3">{s.feeStatus ? <FeeBadge status={s.feeStatus} /> : <span className="text-gray-400">None</span>}</td>}
                                            <td className="py-3 pl-3 pr-6 text-right">
                                                <button type="button" onClick={() => setDetailId(s.id)} aria-label={`View ${s.fullName}`} className={`${secondaryBtn} h-8`}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager total={rows.length} page={current} pageCount={pageCount} onPage={setPage} />
                    </>
                )}
            </Panel>

            {classroom && (
                <>
                    <ClassroomAdmissionForm open={admissionOpen} classroom={classroom} classroomId={classroomId} onClose={() => setAdmissionOpen(false)} onSuccess={() => { setAdmissionOpen(false); refetch(); }} />
                    <PromotionModal open={promotionOpen} classroom={classroom} students={students} onClose={() => setPromotionOpen(false)} onSuccess={() => refetch()} />
                </>
            )}

            <StudentDetailModal studentId={detailId} onClose={() => setDetailId(null)} onStudentUpdate={() => refetch()} />

            <Dialog open={arrangeOpen} onClose={() => !isArranging && setArrangeOpen(false)} labelledBy="arrange-rolls-title" className="sm:max-w-md">
                <DialogHeader id="arrange-rolls-title" title="Arrange class rolls by name?" subtitle={name} onClose={() => setArrangeOpen(false)} accent="purple" />
                <div className="space-y-3 px-6 py-5 text-sm text-gray-600">
                    <p>
                        Every student in this class gets a new class roll in alphabetical order of full name: 1 for the first name, 2 for the second, and so on. This replaces the current
                        class rolls for all <span className="font-medium tabular-nums text-gray-900">{students.length}</span> students.
                    </p>
                    <p>Admission numbers and admission rolls stay the same.</p>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setArrangeOpen(false)} disabled={isArranging} className={secondaryBtn}>
                        Cancel
                    </button>
                    <button type="button" onClick={confirmRollArrange} disabled={isArranging} className={primaryBtn}>
                        <ListOrdered size={16} aria-hidden="true" />
                        {isArranging ? "Arranging…" : "Arrange rolls"}
                    </button>
                </div>
            </Dialog>
        </div>
    );
}

function CapacityNote({ fill, seatsLeft }: { fill: number; seatsLeft: number }) {
    if (fill >= 100)
        return (
            <p className="flex items-center gap-1.5 text-sm font-medium text-rose-300">
                <XCircle size={16} aria-hidden="true" />
                Class is full
            </p>
        );
    if (fill >= 80)
        return (
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-300">
                <AlertCircle size={16} aria-hidden="true" />
                Nearly full, <span className="tabular-nums">{seatsLeft}</span> {seatsLeft === 1 ? "seat" : "seats"} left
            </p>
        );
    return (
        <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-300">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span className="tabular-nums">{seatsLeft}</span> {seatsLeft === 1 ? "seat" : "seats"} left
        </p>
    );
}

function StudentAvatar({ student }: { student: ClassroomStudent }) {
    return student.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={student.profileImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200" />
    ) : (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-xs font-semibold text-purple-700 ring-1 ring-purple-100">
            {initials(student.fullName) || "?"}
        </span>
    );
}

function EligibilityBadge({ eligible }: { eligible: boolean }) {
    return eligible ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">
            <CheckCircle2 size={12} aria-hidden="true" />
            Eligible
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-100">
            <XCircle size={12} aria-hidden="true" />
            Not eligible
        </span>
    );
}

function FeeBadge({ status }: { status: NonNullable<ClassroomStudent["feeStatus"]> }) {
    const f = FEE_LABEL[status];
    return (
        <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${f.tone}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />
            Fees {f.label.toLowerCase()}
        </span>
    );
}

function InactiveBadge() {
    return <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactive</span>;
}
