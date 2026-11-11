import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Results are available under My Results; attendance on the dashboard.
export default function RetiredPage() {
    redirect("/student");
}
