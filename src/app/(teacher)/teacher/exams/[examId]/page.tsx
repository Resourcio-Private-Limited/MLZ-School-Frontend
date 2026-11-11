import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Marks are entered from each classroom (Classroom → Exam Marks).
export default function RetiredPage() {
    redirect("/teacher");
}
