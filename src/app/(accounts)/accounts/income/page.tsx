"use client";

import { useState } from "react";
import LedgerPage, { type LedgerConfig, type LedgerDraft } from "@/components/super-admin/LedgerPage";
import {
    useCreateIncomeMutation,
    useDeleteIncomeMutation,
    useGetIncomesQuery,
    useUpdateIncomeMutation,
    type IncomeCategory,
} from "@/redux/api/accountsApi";

const CONFIG: LedgerConfig = {
    noun: "income",
    title: "Income",
    subtitle: "Money received other than student fees: donations, events and other sources.",
    verb: "Received",
    titleLabel: "Received for",
    titlePlaceholder: "e.g. Annual day ticket sales",
    titleColumn: "Source",
    // Swatches sit on the navy-to-yellow summary band; the legend names each one.
    categories: [
        { key: "DONATIONS", label: "Donations", swatch: "bg-white" },
        { key: "EVENTS", label: "Events", swatch: "bg-yellow-400" },
        { key: "OTHER", label: "Other", swatch: "bg-sky-300" },
    ],
    summaryNote: "Student fees are tracked under Fee management.",
    emptyHint: "Use Record income to add a donation, event collection or other receipt.",
    searchPlaceholder: "Search source, person or cheque",
};

/** The signed-in accountant's name, for "Added by". The layout only renders pages after its auth check. */
function readAccountantName() {
    try {
        const user = JSON.parse(localStorage.getItem("authUser") || "{}");
        return (user.name ?? user.fullName ?? "Accounts office") as string;
    } catch {
        return "Accounts office";
    }
}

// "Other" entries keep their own wording as the category name, as before.
const fields = (d: LedgerDraft) => ({
    date: d.date,
    source: d.title,
    amount: d.amount,
    category: d.category as IncomeCategory,
    categoryName: d.category === "OTHER" ? d.title : undefined,
    paymentMode: d.paymentMode,
    chequeNumber: d.chequeNumber,
});

export default function AccountsIncomePage() {
    const [addedBy] = useState(readAccountantName);
    const { data = [], isLoading, isError, refetch } = useGetIncomesQuery();
    const [createIncome, { isLoading: creating }] = useCreateIncomeMutation();
    const [updateIncome, { isLoading: updating }] = useUpdateIncomeMutation();
    const [deleteIncome] = useDeleteIncomeMutation();

    return (
        <LedgerPage
            accent="yellow"
            config={CONFIG}
            records={data.map((r) => ({ ...r, title: r.source }))}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            saving={creating || updating}
            onCreate={(d) => createIncome({ ...fields(d), addedBy }).unwrap()}
            onUpdate={(id, d) => updateIncome({ id, body: fields(d) }).unwrap()}
            onDelete={(id) => deleteIncome(id).unwrap()}
        />
    );
}
