import { redirect } from "next/navigation";

// This route was an early prototype (sample data, not linked from any menu).
// Monthly fees are viewed and paid from the Payment Area.
export default function RetiredPage() {
    redirect("/student/payment");
}
