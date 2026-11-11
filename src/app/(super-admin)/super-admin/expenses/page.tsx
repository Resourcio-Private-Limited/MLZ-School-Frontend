"use client";

import LedgerPage, { type LedgerConfig } from "@/components/super-admin/LedgerPage";
import { useCreateSuperAdminExpenseMutation, useGetSuperAdminExpensesQuery, useGetSuperAdminProfileQuery } from "@/redux/api/superAdminApi";
import type { ExpenseCategory } from "@/redux/api/accountsApi";

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
    // Swatches sit on the navy-to-rose summary band; the legend names each one.
    categories: [
        { key: "SALARIES", label: "Salaries", swatch: "bg-white" },
        { key: "UTILITIES", label: "Utilities", swatch: "bg-rose-200" },
        { key: "MAINTENANCE", label: "Maintenance", swatch: "bg-rose-400" },
        { key: "SUPPLIES", label: "Supplies", swatch: "bg-sky-300" },
        { key: "OTHER", label: "Other", swatch: "bg-slate-400" },
    ],
    emptyHint: "Use Record expense to add a salary payment, bill or purchase.",
    searchPlaceholder: "Search description, payee or cheque",
};

export default function SuperAdminExpensesPage() {
    const { data = [], isLoading, isError, refetch } = useGetSuperAdminExpensesQuery();
    const { data: profile } = useGetSuperAdminProfileQuery();
    const [createExpense, { isLoading: saving }] = useCreateSuperAdminExpenseMutation();

    return (
        <LedgerPage
            config={CONFIG}
            records={data.map((r) => ({ ...r, title: r.reason, party: r.partyName }))}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            saving={saving}
            onCreate={(d) =>
                createExpense({
                    date: d.date,
                    reason: d.title,
                    partyName: d.party || undefined,
                    amount: d.amount,
                    category: d.category as ExpenseCategory,
                    paymentMode: d.paymentMode,
                    addedBy: profile?.fullName ?? "Super Admin",
                    chequeNumber: d.chequeNumber,
                }).unwrap()
            }
        />
    );
}
