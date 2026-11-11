import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Salary slips are not part of this release.
export default function RetiredPage() {
    redirect("/teacher");
}
