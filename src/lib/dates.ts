/** Today's date as "YYYY-MM-DD" in the user's local time zone (for <input type="date"> defaults). */
export function todayLocal(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
