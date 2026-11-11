"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowRight, UserCheck } from "lucide-react";
import { usePromoteStudentsMutation, useGetNextClassroomsQuery, type ClassroomStudent, type ClassroomSummary } from "@/redux/api/principalApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { SearchBox, Skeleton, errorMessage, inputClass, primaryBtn, secondaryBtn } from "@/components/principal/ui";

type Step = "choose" | "confirm";

/** Two steps: pick the students and the class they move to, then confirm. */
export default function PromotionModal({
    open,
    classroom,
    students,
    onClose,
    onSuccess,
}: {
    open: boolean;
    classroom: ClassroomSummary;
    students: ClassroomStudent[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} labelledBy="promote-title" className="sm:max-w-2xl">
            <PromotionBody classroom={classroom} students={students} onClose={onClose} onSuccess={onSuccess} />
        </Dialog>
    );
}

function PromotionBody({ classroom, students, onClose, onSuccess }: { classroom: ClassroomSummary; students: ClassroomStudent[]; onClose: () => void; onSuccess: () => void }) {
    const [step, setStep] = useState<Step>("choose");
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    const [targetId, setTargetId] = useState("");
    const [search, setSearch] = useState("");

    const { data: classrooms = [], isLoading: loadingClassrooms, isError: classroomsError } = useGetNextClassroomsQuery(classroom.id);
    const [promoteStudents, { isLoading: promoting }] = usePromoteStudentsMutation();

    const target = classrooms.find((c) => c.id === targetId);
    const seatsLeft = target ? target.capacity - target.total : 0;
    const overCapacity = !!target && selected.size > seatsLeft;

    const byGrade = useMemo(() => {
        const groups = new Map<string, ClassroomSummary[]>();
        for (const c of classrooms) groups.set(c.grade, [...(groups.get(c.grade) ?? []), c]);
        return [...groups.entries()].sort(([a], [b]) => (Number(a) || 0) - (Number(b) || 0) || a.localeCompare(b));
    }, [classrooms]);

    const sorted = useMemo(
        () => [...students].sort((a, b) => (a.classRoll ?? Infinity) - (b.classRoll ?? Infinity) || a.fullName.localeCompare(b.fullName)),
        [students]
    );
    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return q ? sorted.filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q)) : sorted;
    }, [sorted, search]);

    const toggle = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));
    const toggleVisible = () =>
        setSelected((prev) => {
            const next = new Set(prev);
            for (const s of visible) {
                if (allVisibleSelected) next.delete(s.id);
                else next.add(s.id);
            }
            return next;
        });

    const promote = async () => {
        if (!target || selected.size === 0) return;
        try {
            await promoteStudents({ studentIds: [...selected], targetClassroomId: target.id }).unwrap();
            toast.success(`${selected.size} ${selected.size === 1 ? "student" : "students"} promoted to ${target.name}.`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(errorMessage(err, "Couldn't promote the students. Nothing was changed, so you can try again."));
        }
    };

    const plural = (n: number) => `${n} ${n === 1 ? "student" : "students"}`;

    return (
        <>
            <DialogHeader
                id="promote-title"
                title={step === "choose" ? "Promote students" : "Confirm promotion"}
                subtitle={step === "choose" ? `From ${classroom.name}` : `${classroom.name} to ${target?.name ?? ""}`}
                onClose={onClose}
                accent="purple"
            />

            {step === "choose" ? (
                <>
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                        <div>
                            <label htmlFor="promote-target" className="block text-sm font-medium text-gray-900">
                                Move to
                            </label>
                            <p id="promote-target-hint" className="mt-0.5 text-sm text-gray-500">
                                Full classes can&apos;t be chosen.
                            </p>
                            {loadingClassrooms ? (
                                <Skeleton className="mt-2 block h-10 w-full" />
                            ) : classroomsError ? (
                                <p className="mt-2 text-sm text-red-700">The list of classes couldn&apos;t be loaded. Close this and try again.</p>
                            ) : classrooms.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">There&apos;s no class to promote into yet. Create the next class from Classrooms first.</p>
                            ) : (
                                <select id="promote-target" aria-describedby="promote-target-hint" value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${inputClass} mt-2`}>
                                    <option value="">Choose a class</option>
                                    {byGrade.map(([grade, list]) => (
                                        <optgroup key={grade} label={`Grade ${grade}`}>
                                            {list.map((c) => {
                                                const left = c.capacity - c.total;
                                                return (
                                                    <option key={c.id} value={c.id} disabled={left <= 0}>
                                                        {c.name}, {left <= 0 ? "full" : `${left} ${left === 1 ? "seat" : "seats"} left`}
                                                    </option>
                                                );
                                            })}
                                        </optgroup>
                                    ))}
                                </select>
                            )}
                        </div>

                        <fieldset>
                            <legend className="text-sm font-medium text-gray-900">Students</legend>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <SearchBox id="promote-search" label="Search students to promote" value={search} onChange={setSearch} placeholder="Search by name or admission number" className="min-w-0 flex-1" />
                                <button type="button" onClick={toggleVisible} disabled={visible.length === 0} className={secondaryBtn}>
                                    {allVisibleSelected ? (search ? "Clear these" : "Clear all") : search ? `Select these (${visible.length})` : `Select all (${visible.length})`}
                                </button>
                            </div>
                            <p className="mt-2 text-sm tabular-nums text-gray-500" aria-live="polite">
                                {plural(selected.size)} selected of {students.length}
                            </p>
                            {visible.length === 0 ? (
                                <p className="mt-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">No students match that search.</p>
                            ) : (
                                <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
                                    {visible.map((s) => {
                                        const checked = selected.has(s.id);
                                        return (
                                            <li key={s.id}>
                                                <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 motion-safe:transition-colors ${checked ? "bg-purple-50/60" : "hover:bg-gray-50"}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggle(s.id)}
                                                        className="h-4 w-4 shrink-0 rounded border-gray-300 accent-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium text-gray-900">{s.fullName}</span>
                                                        <span className="block text-sm tabular-nums text-gray-500">
                                                            {s.classRoll != null ? `Roll ${s.classRoll}, ` : ""}
                                                            {s.admissionNo}
                                                        </span>
                                                    </span>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </fieldset>
                    </div>
                    {overCapacity && (
                        <p className="flex items-center gap-1.5 border-t border-gray-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-900">
                            <AlertTriangle size={14} aria-hidden="true" className="shrink-0" />
                            {target?.name} has only {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left.
                        </p>
                    )}
                    <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
                        <button type="button" onClick={onClose} className={secondaryBtn}>
                            Cancel
                        </button>
                        <button type="button" onClick={() => setStep("confirm")} disabled={!target || selected.size === 0} className={primaryBtn}>
                            Review
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm">
                            <span className="min-w-0 flex-1">
                                <span className="block text-gray-500">From</span>
                                <span className="block truncate font-medium text-gray-900">{classroom.name}</span>
                            </span>
                            <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-gray-400" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-gray-500">To</span>
                                <span className="block truncate font-medium text-gray-900">{target?.name}</span>
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium tabular-nums text-gray-900">{plural(selected.size)}</span> will leave {classroom.name} and join {target?.name}. They&apos;ll
                            show up in the new class list straight away.
                        </p>
                        {overCapacity && (
                            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
                                <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                                {target?.name} has {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left, so it will go over capacity.
                            </p>
                        )}
                        <ul aria-label="Students to promote" className="max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                            {sorted
                                .filter((s) => selected.has(s.id))
                                .map((s) => (
                                    <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                        <span className="truncate text-gray-900">{s.fullName}</span>
                                        <span className="shrink-0 tabular-nums text-gray-500">{s.admissionNo}</span>
                                    </li>
                                ))}
                        </ul>
                    </div>
                    <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                        <button type="button" onClick={() => setStep("choose")} disabled={promoting} className={secondaryBtn}>
                            Back
                        </button>
                        <button type="button" onClick={promote} disabled={promoting} className={primaryBtn}>
                            <UserCheck size={16} aria-hidden="true" />
                            {promoting ? "Promoting…" : `Promote ${plural(selected.size)}`}
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
