"use client";

import LedgerPage, { type LedgerConfig } from "@/components/super-admin/LedgerPage";
import { useCreateSuperAdminIncomeMutation, useGetSuperAdminIncomesQuery, useGetSuperAdminProfileQuery } from "@/redux/api/superAdminApi";
import type { IncomeCategory } from "@/redux/api/accountsApi";

const CONFIG: LedgerConfig = {
    noun: "income",
    title: "Income",
    subtitle: "Money received other than student fees: donations, events and other sources.",
    verb: "Received",
    titleLabel: "Received for",
    titlePlaceholder: "e.g. Annual day ticket sales",
    titleColumn: "Source",
    // Swatches sit on the navy-to-rose summary band.
    categories: [
        { key: "DONATIONS", label: "Donations", swatch: "bg-white" },
        { key: "EVENTS", label: "Events", swatch: "bg-rose-300" },
        { key: "OTHER", label: "Other", swatch: "bg-rose-500" },
    ],
    summaryNote: "Student fees are tracked separately by Accounts.",
    emptyHint: "Use Record income to add a donation, event collection or other receipt.",
    searchPlaceholder: "Search source, person or cheque",
};

export default function SuperAdminIncomePage() {
    const { data = [], isLoading, isError, refetch } = useGetSuperAdminIncomesQuery();
    const { data: profile } = useGetSuperAdminProfileQuery();
    const [createIncome, { isLoading: saving }] = useCreateSuperAdminIncomeMutation();

    return (
        <LedgerPage
            config={CONFIG}
            records={data.map((r) => ({ ...r, title: r.source }))}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            saving={saving}
            onCreate={(d) =>
                createIncome({
                    date: d.date,
                    source: d.title,
                    amount: d.amount,
                    category: d.category as IncomeCategory,
                    paymentMode: d.paymentMode,
                    addedBy: profile?.fullName ?? "Super Admin",
                    chequeNumber: d.chequeNumber,
                }).unwrap()
            }
        />
    );
}
