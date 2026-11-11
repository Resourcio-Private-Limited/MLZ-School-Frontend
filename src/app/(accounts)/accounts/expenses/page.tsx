"use client";

import { useState } from "react";
import LedgerPage, { type LedgerConfig, type LedgerDraft } from "@/components/super-admin/LedgerPage";
import {
    useCreateExpenseMutation,
    useDeleteExpenseMutation,
    useGetExpensesQuery,
    useUpdateExpenseMutation,
    type ExpenseCategory,
} from "@/redux/api/accountsApi";

const CONFIG: LedgerConfig = {
    noun: "expense",
    title: "Expenses",
    subtitle: "Money the school spends: salaries, bills, upkeep and supplies.",
    verb: "Spent",
    titleLabel: "Spent on",
    titlePlaceholder: "e.g. Electricity bill for October",
    titleColumn: "Description",
    partyLabel: "Paid to",
    partyPlaceholder: "e.g. CESC Ltd",
    // Swatches sit on the navy-to-yellow summary band; the legend names each one.
    categories: [
        { key: "SALARIES", label: "Salaries", swatch: "bg-white" },
        { key: "UTILITIES", label: "Utilities", swatch: "bg-yellow-200" },
        { key: "MAINTENANCE", label: "Maintenance", swatch: "bg-yellow-400" },
        { key: "SUPPLIES", label: "Supplies", swatch: "bg-sky-300" },
        { key: "OTHER", label: "Other", swatch: "bg-slate-400" },
    ],
    emptyHint: "Use Record expense to add a salary payment, bill or purchase.",
    searchPlaceholder: "Search description, payee or cheque",
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

const fields = (d: LedgerDraft) => ({
    date: d.date,
    reason: d.title,
    partyName: d.party || undefined,
    amount: d.amount,
    category: d.category as ExpenseCategory,
    paymentMode: d.paymentMode,
    chequeNumber: d.chequeNumber,
});

export default function AccountsExpensesPage() {
    const [addedBy] = useState(readAccountantName);
    const { data = [], isLoading, isError, refetch } = useGetExpensesQuery();
    const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
    const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation();
    const [deleteExpense] = useDeleteExpenseMutation();

    return (
        <LedgerPage
            accent="yellow"
            config={CONFIG}
            records={data.map((r) => ({ ...r, title: r.reason, party: r.partyName }))}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            saving={creating || updating}
            onCreate={(d) => createExpense({ ...fields(d), addedBy }).unwrap()}
            onUpdate={(id, d) => updateExpense({ id, body: fields(d) }).unwrap()}
            onDelete={(id) => deleteExpense(id).unwrap()}
        />
    );
}
