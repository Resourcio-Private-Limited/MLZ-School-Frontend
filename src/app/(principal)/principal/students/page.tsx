import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Students are admitted and managed from each classroom page.
export default function RetiredPage() {
    redirect("/principal");
}
