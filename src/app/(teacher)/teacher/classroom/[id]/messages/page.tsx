import { redirect } from "next/navigation";

// Messages moved to one portal-wide page; this keeps old links working and opens it on this class.
export default async function ClassroomMessagesRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/teacher/messages?class=${encodeURIComponent(id)}`);
}
