"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BookOpen, Check, Pencil, Plus, School, Settings, Trash2, UserRound, Users } from "lucide-react";
import {
    useGetAllClassroomsQuery,
    useGetAllStudentsQuery,
    useGetAllTeachersQuery,
    useGetSubjectsByClassroomQuery,
    useAssignClassTeacherMutation,
    useAddSubjectWithTeacherMutation,
    useUpdateSubjectMutation,
    useDeleteSubjectMutation,
    useCreateClassroomMutation,
    useDeleteClassroomMutation,
    useGetPrincipalProfileQuery,
    useUpdateMarksEntrySettingMutation,
    type ClassroomSummary,
    type SubjectSummary,
    type TeacherSummary,
} from "@/redux/api/principalApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { heroGradient } from "@/components/principal/brand";
import {
    EmptyState,
    FilterChips,
    PageHeader,
    Panel,
    SearchBox,
    Skeleton,
    errorMessage,
    focusRing,
    getPageItems,
    inputClass,
    primaryBtn,
    secondaryBtn,
} from "@/components/principal/ui";

// ─── Levels ────────────────────────────────────────────────────────

// The school's known grades — the create dialog offers exactly these, so a typo
// can't invent a grade that falls outside the level buckets below.
const GRADES = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;

const LEVELS = ["Pre-primary", "Primary", "Middle school", "High school", "Senior secondary", "Other"] as const;
type Level = (typeof LEVELS)[number];
type LevelFilter = "all" | Level;

function levelOf(grade: string): Level {
    const g = grade.trim().toLowerCase();
    if (/^(nursery|pre|kg|lkg|ukg)/.test(g)) return "Pre-primary";
    const num = parseInt(g.match(/\d+/)?.[0] ?? "", 10);
    if (Number.isNaN(num)) return "Other";
    if (num <= 5) return "Primary";
    if (num <= 8) return "Middle school";
    if (num <= 10) return "High school";
    return "Senior secondary";
}

const byName = (a: ClassroomSummary, b: ClassroomSummary) => a.name.localeCompare(b.name, "en-IN", { numeric: true });

// In the "All levels" view each level shows a preview; picking a level shows it in full, a page at a time.
const GROUP_PREVIEW = 6;
const CARDS_PER_PAGE = 12;

// ─── Small local pieces ────────────────────────────────────────────

const iconBtn = `inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 motion-safe:transition-colors ${focusRing}`;
const dangerIconBtn = `inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-700 motion-safe:transition-colors ${focusRing}`;
const dangerBtn = `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none motion-safe:transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2`;
const labelClass = "block text-sm font-medium text-gray-700";

function ChoiceChips<T extends string>({ legend, name, options, value, onChange }: { legend: string; name: string; options: { key: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return (
        <fieldset>
            <legend className={labelClass}>{legend}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
                {options.map((o) => (
                    <label key={o.key} className="cursor-pointer">
                        <input type="radio" name={name} value={o.key} checked={value === o.key} onChange={() => onChange(o.key)} className="peer sr-only" />
                        <span
                            className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium motion-safe:transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-1 ${value === o.key ? "border-purple-600 bg-purple-50 text-purple-800" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                        >
                            {o.label}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}

/** Capacity meter. Colour only changes for real warnings, and a word always goes with it. */
function CapacityMeter({ enrolled, capacity }: { enrolled: number; capacity: number }) {
    const pct = capacity > 0 ? (enrolled / capacity) * 100 : 0;
    const status = pct >= 100 ? { word: "Full", bar: "bg-red-500", text: "text-red-700" } : pct >= 95 ? { word: "Almost full", bar: "bg-red-500", text: "text-red-700" } : pct >= 80 ? { word: "Filling up", bar: "bg-amber-500", text: "text-amber-700" } : null;
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 tabular-nums text-gray-700">
                    <Users size={16} aria-hidden="true" className="text-gray-400" />
                    {enrolled.toLocaleString("en-IN")} of {capacity.toLocaleString("en-IN")} seats
                </span>
                {status && <span className={`text-xs font-medium ${status.text}`}>{status.word}</span>}
            </div>
            <div
                role="meter"
                aria-label="Seats filled"
                aria-valuemin={0}
                aria-valuemax={capacity}
                aria-valuenow={Math.min(enrolled, capacity)}
                aria-valuetext={`${enrolled} of ${capacity} seats filled`}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
            >
                <div className={`h-full rounded-full ${status?.bar ?? "bg-purple-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
        </div>
    );
}

function ClassroomCard({ cls, enrolled, onSettings, onDelete }: { cls: ClassroomSummary; enrolled: number; onSettings: () => void; onDelete: () => void }) {
    return (
        <div className="relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 motion-safe:transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">
                        {/* The link stretches over the whole card; the buttons sit above it. */}
                        <Link href={`/principal/classroom/${cls.id}`} className={`rounded-sm after:absolute after:inset-0 after:rounded-xl hover:text-purple-700 ${focusRing}`}>
                            {cls.name}
                        </Link>
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500">{levelOf(cls.grade)}</p>
                </div>
                <div className="relative z-10 -mr-2 -mt-1 flex shrink-0 items-center">
                    <Tooltip content="Classroom settings" side="top">
                        <button type="button" onClick={onSettings} aria-label={`Settings for ${cls.name}`} className={iconBtn}>
                            <Settings size={17} aria-hidden="true" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Delete classroom" side="top">
                        <button type="button" onClick={onDelete} aria-label={`Delete ${cls.name}`} className={dangerIconBtn}>
                            <Trash2 size={17} aria-hidden="true" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="mt-5 space-y-4 border-t border-gray-100 pt-4">
                <CapacityMeter enrolled={enrolled} capacity={cls.capacity} />
                <p className="flex items-center gap-2 text-sm">
                    <UserRound size={16} aria-hidden="true" className="shrink-0 text-gray-400" />
                    {cls.classTeacher ? (
                        <span className="min-w-0 truncate text-gray-700">
                            <span className="text-gray-500">Class teacher </span>
                            {cls.classTeacher.fullName}
                        </span>
                    ) : (
                        <span className="text-amber-700">No class teacher yet</span>
                    )}
                </p>
            </div>
        </div>
    );
}

function CardPager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (n: number) => void }) {
    if (pageCount <= 1) return null;
    const btn = `h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 motion-safe:transition ${focusRing}`;
    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
            <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className={btn}>
                Prev
            </button>
            {getPageItems(page, pageCount).map((n, i) =>
                n === "gap" ? (
                    <span key={`gap-${i}`} aria-hidden="true" className="flex h-9 w-9 items-center justify-center text-sm text-gray-400">
                        &hellip;
                    </span>
                ) : (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onPage(n)}
                        aria-label={`Page ${n}`}
                        aria-current={page === n ? "page" : undefined}
                        className={`h-9 w-9 rounded-lg border text-sm font-medium tabular-nums motion-safe:transition ${focusRing} ${page === n ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"}`}
                    >
                        {n}
                    </button>
                )
            )}
            <button type="button" onClick={() => onPage(page + 1)} disabled={page === pageCount} className={btn}>
                Next
            </button>
        </nav>
    );
}

// ─── Marks entry switches ──────────────────────────────────────────

const MARKS_EXAMS = [
    { examType: "HALF_YEARLY", label: "Half-yearly examination", short: "Half-yearly", key: "halfYearlyMarksEntryEnabled" },
    { examType: "FINAL", label: "Final examination", short: "Final", key: "finalMarksEntryEnabled" },
] as const;

function MarksEntryPanel() {
    const { data: profile, isLoading } = useGetPrincipalProfileQuery();
    const [updateMarksEntrySetting] = useUpdateMarksEntrySettingMutation();
    const [pending, setPending] = useState<string | null>(null);

    const toggle = async (exam: (typeof MARKS_EXAMS)[number], enabled: boolean) => {
        setPending(exam.examType);
        try {
            await updateMarksEntrySetting({ examType: exam.examType, enabled }).unwrap();
            toast.success(`${exam.short} marks entry ${enabled ? "opened" : "closed"}.`);
        } catch (err) {
            toast.error(errorMessage(err, `${exam.short} marks entry wasn't changed. Check your connection and try again.`));
        } finally {
            setPending(null);
        }
    };

    return (
        <Panel title="Marks entry" subtitle="Choose which exams teachers can enter marks for. Close entry once results are final.">
            <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
                {MARKS_EXAMS.map((exam) => {
                    const enabled = Boolean(profile?.[exam.key]);
                    const id = `marks-${exam.examType}`;
                    return (
                        <li key={exam.examType} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p id={id} className="text-sm font-medium text-gray-900">{exam.label}</p>
                                <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${enabled ? "text-emerald-700" : "text-gray-500"}`}>
                                    {isLoading ? (
                                        <Skeleton className="h-4 w-40" />
                                    ) : enabled ? (
                                        <>
                                            <Check size={14} aria-hidden="true" />
                                            Teachers can enter marks
                                        </>
                                    ) : (
                                        "Closed"
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={enabled}
                                aria-labelledby={id}
                                disabled={isLoading || pending === exam.examType}
                                onClick={() => toggle(exam, !enabled)}
                                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full motion-safe:transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} focus-visible:ring-offset-2 ${enabled ? "bg-purple-600" : "bg-gray-300"}`}
                            >
                                <span aria-hidden="true" className={`inline-block h-5 w-5 rounded-full bg-white shadow motion-safe:transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </Panel>
    );
}

// ─── Classroom settings dialog ─────────────────────────────────────

function ClassroomSettingsDialog({ classroom, teachers, onClose }: { classroom: ClassroomSummary | null; teachers: TeacherSummary[]; onClose: () => void }) {
    return (
        <Dialog open={!!classroom} onClose={onClose} labelledBy="classroom-settings-title" className="sm:max-w-2xl">
            {classroom && <SettingsBody key={classroom.id} classroom={classroom} teachers={teachers} onClose={onClose} />}
        </Dialog>
    );
}

function teacherLabel(t: { fullName: string; employeeId?: string | null }) {
    return t.employeeId ? `${t.fullName} (${t.employeeId})` : t.fullName;
}

function SettingsBody({ classroom, teachers, onClose }: { classroom: ClassroomSummary; teachers: TeacherSummary[]; onClose: () => void }) {
    const { data: subjects = [], isLoading: loadingSubjects, isError: subjectsError, refetch } = useGetSubjectsByClassroomQuery(classroom.id);
    const [assignClassTeacher, { isLoading: assigning }] = useAssignClassTeacherMutation();
    const [addSubjectWithTeacher, { isLoading: adding }] = useAddSubjectWithTeacherMutation();
    const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();
    const [deleteSubject, { isLoading: deleting }] = useDeleteSubjectMutation();

    const [classTeacherId, setClassTeacherId] = useState(classroom.classTeacher?.id ?? "");
    const [newName, setNewName] = useState("");
    const [newTeacherId, setNewTeacherId] = useState("");
    const [editing, setEditing] = useState<{ id: string; name: string; teacherId: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<SubjectSummary | null>(null);

    const activeTeachers = teachers.filter((t) => t.isActive).sort((a, b) => a.fullName.localeCompare(b.fullName, "en-IN"));
    // A teacher already teaching a subject here isn't offered again (the old behaviour), except for the subject being edited.
    const assignedIds = new Set(subjects.flatMap((s) => s.teachers.map((t) => t.id)));
    const freeTeachers = activeTeachers.filter((t) => !assignedIds.has(t.id));
    const editTeachers = (subject: SubjectSummary) => activeTeachers.filter((t) => !assignedIds.has(t.id) || subject.teachers.some((st) => st.id === t.id));

    const saveClassTeacher = async () => {
        if (!classTeacherId) return;
        try {
            await assignClassTeacher({ teacherId: classTeacherId, classroomId: classroom.id }).unwrap();
            const name = activeTeachers.find((t) => t.id === classTeacherId)?.fullName;
            toast.success(name ? `${name} assigned as class teacher.` : "Class teacher assigned.");
        } catch (err) {
            toast.error(errorMessage(err, "Class teacher not assigned. Check your connection and try again."));
        }
    };

    const addSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newTeacherId) return;
        try {
            await addSubjectWithTeacher({ subjectName: newName.trim(), classroomId: classroom.id, teacherId: newTeacherId }).unwrap();
            toast.success(`${newName.trim()} added.`);
            setNewName("");
            setNewTeacherId("");
        } catch (err) {
            toast.error(errorMessage(err, "Subject not added. Check your connection and try again."));
        }
    };

    const saveEdit = async () => {
        if (!editing || !editing.name.trim()) return;
        try {
            await updateSubject({ subjectId: editing.id, name: editing.name.trim(), ...(editing.teacherId ? { teacherId: editing.teacherId } : {}) }).unwrap();
            toast.success(`${editing.name.trim()} updated.`);
            setEditing(null);
        } catch (err) {
            toast.error(errorMessage(err, "Subject not updated. Check your connection and try again."));
        }
    };

    const removeSubject = async () => {
        if (!confirmDelete) return;
        try {
            await deleteSubject(confirmDelete.id).unwrap();
            toast.success(`${confirmDelete.name} deleted.`);
            setConfirmDelete(null);
        } catch (err) {
            toast.error(errorMessage(err, "Subject not deleted. Check your connection and try again."));
        }
    };

    const unchangedTeacher = classTeacherId === (classroom.classTeacher?.id ?? "");

    return (
        <>
            <DialogHeader id="classroom-settings-title" title="Classroom settings" subtitle={classroom.name} onClose={onClose} accent="purple" />
            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-5">
                <section aria-labelledby="class-teacher-heading">
                    <h3 id="class-teacher-heading" className="text-sm font-semibold text-gray-900">Class teacher</h3>
                    <p className="mt-0.5 text-sm text-gray-500">The class teacher takes attendance and enters exam marks for this class.</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className={`${labelClass} flex-1`}>
                            Teacher
                            <select value={classTeacherId} onChange={(e) => setClassTeacherId(e.target.value)} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose a teacher</option>
                                {activeTeachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {teacherLabel(t)}
                                        {t.classTeacherOf && t.id !== classroom.classTeacher?.id ? `, class teacher of ${t.classTeacherOf.name}` : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button type="button" onClick={saveClassTeacher} disabled={!classTeacherId || unchangedTeacher || assigning} className={primaryBtn}>
                            {assigning ? "Assigning…" : "Assign class teacher"}
                        </button>
                    </div>
                </section>

                <section aria-labelledby="subjects-heading">
                    <h3 id="subjects-heading" className="text-sm font-semibold text-gray-900">
                        Subjects and teachers
                        {!loadingSubjects && <span className="ml-2 text-sm font-normal tabular-nums text-gray-500">{subjects.length}</span>}
                    </h3>

                    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                        {loadingSubjects ? (
                            <div className="space-y-3 p-4">
                                {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-10 w-full" />)}
                            </div>
                        ) : subjectsError ? (
                            <EmptyState
                                title="Subjects couldn't be loaded."
                                hint="Check your connection, then try again."
                                action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                            />
                        ) : subjects.length === 0 ? (
                            <EmptyState icon={<BookOpen size={26} />} title="No subjects yet." hint="Add the first subject below and choose who teaches it." />
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {subjects.map((s) =>
                                    editing?.id === s.id ? (
                                        <li key={s.id} className="space-y-3 bg-gray-50 p-4">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label className={labelClass}>
                                                    Subject name
                                                    <input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={`${inputClass} mt-1.5`} />
                                                </label>
                                                <label className={labelClass}>
                                                    Teacher
                                                    <select value={editing.teacherId} onChange={(e) => setEditing({ ...editing, teacherId: e.target.value })} className={`${inputClass} mt-1.5`}>
                                                        <option value="">Keep current teacher</option>
                                                        {editTeachers(s).map((t) => (
                                                            <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => setEditing(null)} className={secondaryBtn}>Cancel</button>
                                                <button type="button" onClick={saveEdit} disabled={!editing.name.trim() || updating} className={`${primaryBtn} h-9`}>
                                                    {updating ? "Saving…" : "Save subject"}
                                                </button>
                                            </div>
                                        </li>
                                    ) : confirmDelete?.id === s.id ? (
                                        <li key={s.id} className="space-y-3 bg-red-50/60 p-4" role="alert">
                                            <p className="text-sm text-gray-900">
                                                Delete <span className="font-semibold">{s.name}</span>? Its teacher assignments go with it, and this can&apos;t be undone.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => setConfirmDelete(null)} className={secondaryBtn}>Cancel</button>
                                                <button type="button" onClick={removeSubject} disabled={deleting} className={`${dangerBtn} h-9`}>
                                                    {deleting ? "Deleting…" : "Delete subject"}
                                                </button>
                                            </div>
                                        </li>
                                    ) : (
                                        <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900">{s.name}</p>
                                                <p className={`truncate text-sm ${s.teachers.length ? "text-gray-500" : "text-amber-700"}`}>
                                                    {s.teachers.length ? s.teachers.map(teacherLabel).join(", ") : "No teacher assigned"}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setConfirmDelete(null);
                                                    setEditing({ id: s.id, name: s.name, teacherId: s.teachers[0]?.id ?? "" });
                                                }}
                                                aria-label={`Edit ${s.name}`}
                                                className={iconBtn}
                                            >
                                                <Pencil size={16} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(null);
                                                    setConfirmDelete(s);
                                                }}
                                                aria-label={`Delete ${s.name}`}
                                                className={dangerIconBtn}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </div>

                    <form onSubmit={addSubject} className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-900">Add a subject</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <label className={labelClass}>
                                Subject name
                                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="For example, Mathematics" className={`${inputClass} mt-1.5`} />
                            </label>
                            <label className={labelClass}>
                                Teacher
                                <select value={newTeacherId} onChange={(e) => setNewTeacherId(e.target.value)} className={`${inputClass} mt-1.5`}>
                                    <option value="">Choose a teacher</option>
                                    {freeTeachers.map((t) => (
                                        <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
                                    ))}
                                </select>
                            </label>
                            <button type="submit" disabled={!newName.trim() || !newTeacherId || adding} className={primaryBtn}>
                                <Plus size={16} aria-hidden="true" />
                                {adding ? "Adding…" : "Add subject"}
                            </button>
                        </div>
                        {!loadingSubjects && freeTeachers.length === 0 && activeTeachers.length > 0 && (
                            <p className="mt-2 text-sm text-gray-500">Every active teacher already teaches a subject in this class.</p>
                        )}
                    </form>
                </section>
            </div>
            <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button type="button" onClick={onClose} className={secondaryBtn}>Done</button>
            </div>
        </>
    );
}

// ─── Create classroom dialog ───────────────────────────────────────

type NewClassroom = { name: string; grade: string; section: string; capacity: string; classType: "PRIMARY" | "SECONDARY" };
const EMPTY_CLASSROOM: NewClassroom = { name: "", grade: "", section: "", capacity: "40", classType: "SECONDARY" };

function CreateClassroomDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [createClassroom, { isLoading }] = useCreateClassroomMutation();
    const [form, setForm] = useState<NewClassroom>(EMPTY_CLASSROOM);
    // The name follows grade and section until it's typed in by hand.
    const [nameTouched, setNameTouched] = useState(false);

    const gradeLabel = /^\d+$/.test(form.grade.trim()) ? `Class ${form.grade.trim()}` : form.grade.trim();
    const suggestedName = form.grade.trim() && form.section.trim() ? `${gradeLabel} - Section ${form.section.trim().toUpperCase()}` : "";
    const name = nameTouched ? form.name : form.name || suggestedName;
    const capacity = Number(form.capacity);
    const capacityOk = Number.isInteger(capacity) && capacity >= 1;
    const missing = [!form.grade.trim() && "grade", !form.section.trim() && "section", !name.trim() && "name"].filter(Boolean) as string[];
    const hint = missing.length ? `Add the ${missing.join(", ")} to continue.` : !capacityOk ? "Capacity has to be a whole number above 0." : "";

    const close = () => {
        setForm(EMPTY_CLASSROOM);
        setNameTouched(false);
        onClose();
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hint) return;
        try {
            await createClassroom({ name: name.trim(), grade: form.grade.trim(), section: form.section.trim(), capacity, classType: form.classType }).unwrap();
            toast.success(`${name.trim()} created.`);
            close();
        } catch (err) {
            toast.error(errorMessage(err, "Classroom not created. Check your connection and try again."));
        }
    };

    return (
        <Dialog open={open} onClose={close} labelledBy="create-classroom-title" className="sm:max-w-lg">
            <DialogHeader id="create-classroom-title" title="Create classroom" subtitle="Add a new class section." onClose={close} accent="purple" />
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        <label className={labelClass}>
                            Grade
                            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={`${inputClass} mt-1.5`}>
                                <option value="">Choose a grade</option>
                                {GRADES.map((g) => (
                                    <option key={g} value={g}>{/^\d+$/.test(g) ? `Class ${g}` : g}</option>
                                ))}
                            </select>
                        </label>
                        <label className={labelClass}>
                            Section
                            <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="B" className={`${inputClass} mt-1.5`} />
                        </label>
                    </div>
                    <label className={labelClass}>
                        Classroom name
                        <input
                            value={name}
                            onChange={(e) => {
                                setNameTouched(true);
                                setForm({ ...form, name: e.target.value });
                            }}
                            placeholder="Class 7 - Section B"
                            className={`${inputClass} mt-1.5`}
                        />
                        <span className="mt-1 block text-sm font-normal text-gray-500">Shown to teachers, students and on admit cards.</span>
                    </label>
                    <label className={labelClass}>
                        Capacity
                        <input type="number" inputMode="numeric" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={`${inputClass} mt-1.5 tabular-nums sm:w-40`} />
                        <span className="mt-1 block text-sm font-normal text-gray-500">The most students this section can hold.</span>
                    </label>
                    <ChoiceChips
                        legend="Class type"
                        name="class-type"
                        value={form.classType}
                        onChange={(v) => setForm({ ...form, classType: v })}
                        options={[
                            { key: "PRIMARY", label: "Primary" },
                            { key: "SECONDARY", label: "Secondary" },
                        ]}
                    />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    {hint && <p className="mr-auto text-sm text-gray-500">{hint}</p>}
                    <button type="button" onClick={close} className={secondaryBtn}>Cancel</button>
                    <button type="submit" disabled={!!hint || isLoading} className={primaryBtn}>
                        {isLoading ? "Creating…" : "Create classroom"}
                    </button>
                </div>
            </form>
        </Dialog>
    );
}

// ─── Delete classroom dialog ───────────────────────────────────────

function DeleteClassroomDialog({ classroom, enrolled, onClose }: { classroom: ClassroomSummary | null; enrolled: number; onClose: () => void }) {
    const [deleteClassroom, { isLoading }] = useDeleteClassroomMutation();
    const confirm = async () => {
        if (!classroom) return;
        try {
            await deleteClassroom(classroom.id).unwrap();
            toast.success(`${classroom.name} deleted.`);
            onClose();
        } catch (err) {
            toast.error(errorMessage(err, "Classroom not deleted. Move its students to another class first, then try again."));
        }
    };
    return (
        <Dialog open={!!classroom} onClose={onClose} labelledBy="delete-classroom-title" className="sm:max-w-md">
            <DialogHeader id="delete-classroom-title" title={classroom ? `Delete ${classroom.name}?` : "Delete classroom?"} onClose={onClose} accent="purple" />
            <div className="space-y-3 px-6 py-5 text-sm text-gray-600">
                <p>The classroom, its subjects and its exam schedules are removed. This can&apos;t be undone.</p>
                {enrolled > 0 && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">
                        {enrolled.toLocaleString("en-IN")} {enrolled === 1 ? "student is" : "students are"} still in this class. Promote or move them first.
                    </p>
                )}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
                <button type="button" onClick={confirm} disabled={isLoading} className={dangerBtn}>
                    {isLoading ? "Deleting…" : "Delete classroom"}
                </button>
            </div>
        </Dialog>
    );
}

// ─── Page ──────────────────────────────────────────────────────────

export default function PrincipalHomePage() {
    const { data: classrooms = [], isLoading, isError, refetch } = useGetAllClassroomsQuery();
    const { data: students, isLoading: loadingStudents } = useGetAllStudentsQuery();
    const { data: teachers = [], isLoading: loadingTeachers } = useGetAllTeachersQuery();
    const { data: profile } = useGetPrincipalProfileQuery();

    const [level, setLevel] = useState<LevelFilter>("all");
    const [query, setQuery] = useState("");
    const [onlyUnassigned, setOnlyUnassigned] = useState(false);
    const [page, setPage] = useState(1);
    const [creating, setCreating] = useState(false);
    const [settingsFor, setSettingsFor] = useState<ClassroomSummary | null>(null);
    const [deleting, setDeleting] = useState<ClassroomSummary | null>(null);

    // Enrolment comes from the students list when it's loaded, otherwise from the classroom's own total.
    const countMap = new Map<string, number>();
    for (const s of students ?? []) countMap.set(s.classroomId, (countMap.get(s.classroomId) ?? 0) + 1);
    const enrolledIn = (c: ClassroomSummary) => (students ? countMap.get(c.id) ?? 0 : c.total ?? 0);

    const totalStudents = students ? students.length : classrooms.reduce((sum, c) => sum + (c.total ?? 0), 0);
    const totalSeats = classrooms.reduce((sum, c) => sum + (c.capacity ?? 0), 0);
    const activeTeachers = teachers.filter((t) => t.isActive).length;
    const unassigned = classrooms.filter((c) => !c.classTeacher);

    const q = query.trim().toLowerCase();
    const matches = classrooms
        .filter((c) => !onlyUnassigned || !c.classTeacher)
        .filter((c) => !q || c.name.toLowerCase().includes(q) || c.classTeacher?.fullName.toLowerCase().includes(q))
        .sort(byName);
    const levelCounts = new Map<Level, number>();
    for (const c of matches) levelCounts.set(levelOf(c.grade), (levelCounts.get(levelOf(c.grade)) ?? 0) + 1);
    const levelOptions: { value: LevelFilter; label: string; count?: number }[] = [
        { value: "all", label: "All levels", count: matches.length },
        ...LEVELS.filter((l) => levelCounts.has(l) || l === level).map((l) => ({ value: l as LevelFilter, label: l, count: levelCounts.get(l) ?? 0 })),
    ];

    const changeFilter = (fn: () => void) => {
        fn();
        setPage(1);
    };

    const levelRows = level === "all" ? [] : matches.filter((c) => levelOf(c.grade) === level);
    const pageCount = Math.max(1, Math.ceil(levelRows.length / CARDS_PER_PAGE));
    const current = Math.min(page, pageCount);
    const pageRows = levelRows.slice((current - 1) * CARDS_PER_PAGE, current * CARDS_PER_PAGE);

    const grid = (rows: ClassroomSummary[]) => (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => (
                <li key={c.id}>
                    <ClassroomCard cls={c} enrolled={enrolledIn(c)} onSettings={() => setSettingsFor(c)} onDelete={() => setDeleting(c)} />
                </li>
            ))}
        </ul>
    );

    const firstName = profile?.fullName?.split(/\s+/)[0];
    const figure = "mt-1 text-2xl font-semibold tracking-tight tabular-nums";

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader
                title="Classrooms"
                subtitle={`${firstName ? `Welcome back, ${firstName}. ` : ""}${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
                actions={
                    <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
                        <Plus size={16} aria-hidden="true" />
                        Create classroom
                    </button>
                }
            />

            <section aria-labelledby="school-summary" className={`overflow-hidden rounded-xl shadow-sm ${heroGradient}`}>
                <h2 id="school-summary" className="px-4 pt-5 text-base font-semibold sm:px-6">School at a glance</h2>
                <dl className="grid grid-cols-1 gap-6 px-4 pb-6 pt-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                    <div>
                        <dt className="text-sm text-slate-300">Classrooms</dt>
                        <dd className={figure}>{isLoading ? <Skeleton onDark className="h-7 w-10 align-middle" /> : classrooms.length.toLocaleString("en-IN")}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Students enrolled</dt>
                        <dd className={figure}>
                            {isLoading || loadingStudents ? (
                                <Skeleton onDark className="h-7 w-16 align-middle" />
                            ) : (
                                <>
                                    {totalStudents.toLocaleString("en-IN")}
                                    {totalSeats > 0 && <span className="ml-2 text-sm font-normal text-slate-400">of {totalSeats.toLocaleString("en-IN")} seats</span>}
                                </>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Active teachers</dt>
                        <dd className={figure}>{loadingTeachers ? <Skeleton onDark className="h-7 w-10 align-middle" /> : activeTeachers.toLocaleString("en-IN")}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-slate-300">Without a class teacher</dt>
                        <dd className={figure}>
                            {isLoading ? (
                                <Skeleton onDark className="h-7 w-10 align-middle" />
                            ) : unassigned.length === 0 ? (
                                <span className="text-emerald-300">None</span>
                            ) : (
                                <>
                                    <span className="text-rose-300">{unassigned.length.toLocaleString("en-IN")}</span>
                                    <button
                                        type="button"
                                        onClick={() => changeFilter(() => setOnlyUnassigned(true))}
                                        className="ml-3 rounded-sm align-middle text-sm font-medium text-purple-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    >
                                        Show them
                                    </button>
                                </>
                            )}
                        </dd>
                    </div>
                </dl>
            </section>

            <MarksEntryPanel />

            <section aria-labelledby="classrooms-heading" className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="classrooms-heading" className="text-base font-semibold text-gray-900">All classrooms</h2>
                        <p className="mt-0.5 text-sm text-gray-500">Open a classroom to see its students, or use settings to assign teachers and subjects.</p>
                    </div>
                </div>

                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <SearchBox id="classroom-search" label="Search classrooms" value={query} onChange={(v) => changeFilter(() => setQuery(v))} placeholder="Search by class or class teacher" className="sm:max-w-sm sm:flex-1" />
                        <button
                            type="button"
                            aria-pressed={onlyUnassigned}
                            onClick={() => changeFilter(() => setOnlyUnassigned(!onlyUnassigned))}
                            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium motion-safe:transition-colors ${focusRing} ${onlyUnassigned ? "border-purple-600 bg-purple-50 text-purple-800" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"}`}
                        >
                            {onlyUnassigned && <Check size={15} aria-hidden="true" />}
                            No class teacher
                            <span className={`text-xs tabular-nums ${onlyUnassigned ? "text-purple-700" : "text-gray-400"}`}>{unassigned.length}</span>
                        </button>
                    </div>
                    <FilterChips label="Filter by level" value={level} options={levelOptions} onChange={(v) => changeFilter(() => setLevel(v))} layoutId="principal-level-chip" />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => <Skeleton key={i} className="block h-48 w-full rounded-xl" />)}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState
                            title="Classrooms couldn't be loaded."
                            hint="Check your connection, then try again."
                            action={<button type="button" onClick={() => refetch()} className={secondaryBtn}>Try again</button>}
                        />
                    </div>
                ) : classrooms.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState
                            icon={<School size={28} />}
                            title="No classrooms yet."
                            hint="Create the first classroom, then assign its class teacher and subjects."
                            action={<button type="button" onClick={() => setCreating(true)} className={primaryBtn}><Plus size={16} aria-hidden="true" />Create classroom</button>}
                        />
                    </div>
                ) : matches.length === 0 || (level !== "all" && levelRows.length === 0) ? (
                    <div className="rounded-xl border border-gray-200 bg-white">
                        <EmptyState
                            title="No classrooms match."
                            hint="Try another search or level, or clear the filters."
                            action={
                                <button type="button" onClick={() => changeFilter(() => { setQuery(""); setLevel("all"); setOnlyUnassigned(false); })} className={secondaryBtn}>
                                    Clear filters
                                </button>
                            }
                        />
                    </div>
                ) : level === "all" ? (
                    <div className="space-y-8">
                        {LEVELS.map((l) => {
                            const rows = matches.filter((c) => levelOf(c.grade) === l);
                            if (!rows.length) return null;
                            return (
                                <section key={l} aria-labelledby={`level-${l}`} className="space-y-3">
                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                        <h3 id={`level-${l}`} className="text-sm font-semibold text-gray-900">
                                            {l}
                                            <span className="ml-2 font-normal tabular-nums text-gray-500">
                                                {rows.length} {rows.length === 1 ? "section" : "sections"}
                                            </span>
                                        </h3>
                                        {rows.length > GROUP_PREVIEW && (
                                            <button type="button" onClick={() => changeFilter(() => setLevel(l))} className={`rounded-sm text-sm font-medium text-purple-700 hover:text-purple-800 hover:underline underline-offset-4 ${focusRing}`}>
                                                Show all {rows.length}
                                            </button>
                                        )}
                                    </div>
                                    {grid(rows.slice(0, GROUP_PREVIEW))}
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {grid(pageRows)}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm tabular-nums text-gray-500">
                                Showing{" "}
                                <span className="font-medium text-gray-700">
                                    {(current - 1) * CARDS_PER_PAGE + 1}&ndash;{Math.min(current * CARDS_PER_PAGE, levelRows.length)}
                                </span>{" "}
                                of <span className="font-medium text-gray-700">{levelRows.length}</span>
                            </p>
                            <CardPager page={current} pageCount={pageCount} onPage={setPage} />
                        </div>
                    </div>
                )}
            </section>

            <CreateClassroomDialog open={creating} onClose={() => setCreating(false)} />
            <ClassroomSettingsDialog classroom={settingsFor ? classrooms.find((c) => c.id === settingsFor.id) ?? settingsFor : null} teachers={teachers} onClose={() => setSettingsFor(null)} />
            <DeleteClassroomDialog classroom={deleting} enrolled={deleting ? enrolledIn(deleting) : 0} onClose={() => setDeleting(null)} />
        </div>
    );
}
