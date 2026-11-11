import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Attendance is marked from each classroom (Classroom → Attendance).
export default function RetiredPage() {
    redirect("/teacher");
}
