import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Fee structures are configured by the accountant in the Accounts portal.
export default function RetiredPage() {
    redirect("/principal");
}
