import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Teachers are created by the super admin and assigned from Classroom Settings.
export default function RetiredPage() {
    redirect("/principal");
}
