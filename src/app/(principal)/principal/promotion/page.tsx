import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Student promotion is done from each classroom page (Promote Students).
export default function RetiredPage() {
    redirect("/principal");
}
