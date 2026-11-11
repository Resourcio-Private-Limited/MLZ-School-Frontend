// A student has an admission roll (rollNumber, a string) and a class roll (1, 2, 3…).
// Teachers see the class roll everywhere (marks entry, attendance), so lists show
// it and fall back to the admission roll for records that don't carry one yet.

export type Rollable = { classRoll?: number | null; rollNumber: string | null; fullName: string };

export const rollOf = (r: Pick<Rollable, "classRoll" | "rollNumber">): string | null =>
    r.classRoll != null ? String(r.classRoll) : r.rollNumber;

/** Sort by roll (numeric-aware, so 2 comes before 10), then by name. No roll sorts last. */
export const byRoll = (a: Rollable, b: Rollable) =>
    (rollOf(a) ?? "~").localeCompare(rollOf(b) ?? "~", "en-IN", { numeric: true }) || a.fullName.localeCompare(b.fullName);
