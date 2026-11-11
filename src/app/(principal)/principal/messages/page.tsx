"use client";

import { Loader2 } from "lucide-react";
import MessagesCenter from "@/components/messages/MessagesCenter";
import { useGetPrincipalMessageRecipientsQuery } from "@/redux/api/principalApi";

const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: "Super Admin", ACCOUNTANT: "Accountant", TEACHER: "Teacher" };

export default function PrincipalMessagesPage() {
    const { data: recipients = [], isLoading } = useGetPrincipalMessageRecipientsQuery();

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" /></div>;
    }
    return (
        <MessagesCenter
            title="Principal Messages"
            recipients={recipients.map((person) => ({ id: person.id, name: person.name, role: ROLE_LABELS[person.role] ?? person.role }))}
        />
    );
}
