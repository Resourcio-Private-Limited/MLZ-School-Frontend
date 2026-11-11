import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Exams are scheduled by the principal (Admit Card → Exam Schedule).
export default function RetiredPage() {
    redirect("/teacher?notice=" + encodeURIComponent("Exams are opened from My classes."));
}
