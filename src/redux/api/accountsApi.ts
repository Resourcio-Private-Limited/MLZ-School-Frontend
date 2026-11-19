import { baseApi } from './baseApi';

export type IncomeCategory = 'DONATIONS' | 'EVENTS' | 'OTHER';
export type ExpenseCategory = 'SALARIES' | 'UTILITIES' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER';
export type PaymentMode = 'CASH' | 'CARD' | 'CHEQUE' | 'NEFT' | 'ONLINE';

export interface ClassroomWithFees {
    classroomId: string;
    className: string;
    grade: string;
    section: string;
    totalStudents: number;
    tuitionFees: number;
    lateFees: number;
    annualCharges: number;
    annualFeeExpiryDate: string | null;
}

/** One student's fees for one month. Every amount comes from the same calculation the student sees. */
export interface StudentFeeRecord {
    studentId: string;
    rollNumber: string;
    classRoll?: number | null;
    fullName: string;
    /** False once the student has left (deactivated). Listed only while they still owe money. */
    isActive?: boolean;
    /** False for months before the student's admission. */
    billable?: boolean;
    tuitionFees: number;
    transportFees: number;
    annualCharges: number;
    /** Overdue annual balance that must be paid with this month. Included in totalAmount. */
    annualContributionRequired?: number;
    annualRemaining?: number;
    annualOverdue?: boolean;
    otherFees: number;
    otherFeesRemarks: string | null;
    penalty: number;
    previousAmount: number;
    discount: number;
    /** What is still owed on the month's own charges. */
    monthlyDue?: number;
    /** Outstanding balance to settle the month now (part payments deducted, overdue annual balance included). */
    totalAmount: number;
    isPaid: boolean;
    paidAmount: number;
    examEligibility: boolean;
    transportOpted: boolean;
    classroomId?: string;
    classroomName?: string;
}

export interface StudentDetailFeeHistory {
    id: string;
    month: number;
    year: number;
    tuitionFees: number;
    annualCharges: number;
    transportFees: number;
    otherFees: number;
    otherFeesRemarks: string | null;
    penalty: number;
    discount: number;
    previousAmount: number;
    totalAmount: number;
    isPaid: boolean;
    paidAmount: number;
    paidAt: string | null;
    paymentMode: string | null;
    receiptUrl: string | null;
}

export interface MonthlyBreakdown {
    month: number;
    year: number;
    recordId: string | null;
    /** False for months before the student's admission: nothing is billed. */
    billable: boolean;
    /** The month has started. */
    isDue: boolean;
    tuitionFees: number;
    transportFees: number;
    /** Annual fee paid with, or owed on, this month. */
    annualCharges: number;
    annualChargesApplicable: boolean;
    annualContributionRequired: number;
    otherFees: number;
    otherFeesRemarks: string | null;
    penalty: number;
    /** Dues entered by hand (for example from before this system). Earlier unpaid months are never folded in. */
    previousAmount: number;
    discount: number;
    /** The month's own charges. */
    monthlyCharges: number;
    monthlyDue: number;
    /** The month's full bill: own charges plus the annual fee on it. */
    totalAmount: number;
    /** What is still owed on it. */
    balance: number;
    isPaid: boolean;
    paidAmount: number;
    paidAt: string | null;
    paymentMode: string | null;
}

export interface StudentKpis {
    totalTuition: number;
    totalTransport: number;
    totalAnnual: number;
    totalOther: number;
    totalPenalty: number;
    totalDiscount: number;
    totalPrevDue: number;
    totalPaid: number;
    totalDue: number;
    totalOverall: number;
    /** Still owed for earlier years. Collected before this year's months. */
    earlierDueTotal: number;
    paidMonths: number;
    unpaidMonths: number;
    billedMonths: number;
}

export interface AnnualFeeSummary {
    total: number;
    paid: number;
    remaining: number;
    expiryDate: string | null;
    isOverdue: boolean;
    isConfigured: boolean;
}

export interface StudentDetailResponse {
    studentId: string;
    fullName: string;
    rollNumber: string;
    classRoll: number | null;
    admissionNumber: string;
    dob: string;
    gender: string;
    parentName: string | null;
    parentContact: string | null;
    primaryContact: string;
    secondaryContact: string | null;
    email: string | null;
    residentialAddress: string | null;
    classroom: {
        id: string;
        name: string;
        grade: string;
        section: string;
    };
    admissionDate: string;
    isActive: boolean;
    examEligibility: boolean;
    transportOpted: boolean;
    feeStructure: {
        tuitionFees: number;
        lateFees: number;
        annualCharges: number;
        transportOpted: boolean;
    };
    annualSummary: AnnualFeeSummary;
    earlierDues: Array<{ year: number; month: number; amount: number }>;
    kpis: StudentKpis;
    monthlyBreakdown: MonthlyBreakdown[];
}

export interface IncomeRecord {
    id: string;
    date: string;
    source: string;
    category: IncomeCategory;
    categoryName: string | null;
    amount: number;
    paymentMode: PaymentMode;
    chequeNumber: string | null;
    addedBy: string;
    createdAt: string;
}

export interface ExpenseRecord {
    id: string;
    date: string;
    reason: string;
    partyName: string | null;
    category: ExpenseCategory;
    categoryName: string | null;
    amount: number;
    paymentMode: PaymentMode;
    chequeNumber: string | null;
    addedBy: string;
    createdAt: string;
}

export interface ProfitLoss {
    month: number;
    year: number;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
}

export const accountsApi = baseApi.injectEndpoints({
    // Dev hot reload can evaluate this module twice; re-injecting the same endpoints is expected there.
    overrideExisting: process.env.NODE_ENV === "development",
    endpoints: (builder) => ({
        // Classroom Fees
        getClassroomsWithFees: builder.query<ClassroomWithFees[], void>({
            query: () => ({ url: '/accounts/classrooms/fees', method: 'GET' }),
        }),

        upsertClassroomFees: builder.mutation<ClassroomWithFees, { classroomId: string; tuitionFees: number; lateFees: number; annualCharges: number; annualFeeExpiryDate?: string }>({
            query: ({ classroomId, ...body }) => ({
                url: `/accounts/classrooms/${classroomId}/fees`,
                method: 'POST',
                body,
            }),
        }),

        applyClassroomOtherFees: builder.mutation<{
            classroomId: string; month: number; year: number; otherFees: number;
            otherFeesRemarks: string | null; appliedCount: number; skippedPaidCount: number; skippedNotBilledCount: number;
        }, { classroomId: string; month: number; year: number; otherFees: number; otherFeesRemarks?: string }>({
            query: ({ classroomId, ...body }) => ({
                url: `/accounts/classrooms/${classroomId}/other-fees`,
                method: 'POST',
                body,
            }),
        }),

        getLatestPayments: builder.query<Array<{
            id: string; paidAt: string; amountPaid: number; monthsPaid: string | null;
            paymentMode: string | null; receiptUrl: string | null; razorpayPaymentId: string | null;
            annualContribution: number; student: { id: string; fullName: string; admissionNumber: string; classroomName: string };
        }>, void>({
            query: () => ({ url: '/accounts/payments/latest', method: 'GET' }),
        }),

        getStudentFees: builder.query<StudentFeeRecord[], { classroomId: string; month?: number; year?: number }>({
            query: ({ classroomId, month, year }) => {
                const params = new URLSearchParams();
                if (month) params.set('month', String(month));
                if (year) params.set('year', String(year));
                const qs = params.toString();
                return {
                    url: `/accounts/classrooms/${classroomId}/students/fees${qs ? `?${qs}` : ''}`,
                    method: 'GET',
                };
            },
        }),

        searchStudentsFees: builder.query<StudentFeeRecord[], {
            query?: string;
            classroomId?: string;
            status?: 'PAID' | 'UNPAID' | 'PARTIAL';
            month?: number;
            year?: number;
        }>({
            query: (params) => {
                const p = new URLSearchParams();
                if (params.query) p.set('query', params.query);
                if (params.classroomId) p.set('classroomId', params.classroomId);
                if (params.status) p.set('status', params.status);
                if (params.month) p.set('month', String(params.month));
                if (params.year) p.set('year', String(params.year));
                const qs = p.toString();
                return { url: `/accounts/students/search${qs ? `?${qs}` : ''}`, method: 'GET' };
            },
        }),

        updateOtherFees: builder.mutation<StudentFeeRecord, {
            studentId: string;
            classroomId: string;
            month: number;
            year: number;
            otherFees: number;
            otherFeesRemarks?: string;
            discount?: number;
        }>({
            query: ({ studentId, ...body }) => ({
                url: `/accounts/students/${studentId}/fees`,
                method: 'PATCH',
                body,
            }),
        }),

        recordStudentPayment: builder.mutation<StudentFeeRecord, {
            studentId: string;
            classroomId: string;
            month: number;
            year: number;
            paidAmount: number;
            paymentMode: PaymentMode;
            /** Part of paidAmount to record as an annual fee instalment. */
            annualInstalment?: number;
        }>({
            query: ({ studentId, ...body }) => ({
                url: `/accounts/students/${studentId}/fees/payment`,
                method: 'POST',
                body,
            }),
        }),

        // Student Detail
        getStudentDetail: builder.query<StudentDetailResponse, { studentId: string; year?: number }>({
            query: ({ studentId, year }) => {
                const params = new URLSearchParams();
                if (year) params.set('year', String(year));
                const qs = params.toString();
                return {
                    url: `/accounts/students/${studentId}${qs ? `?${qs}` : ''}`,
                    method: 'GET',
                };
            },
        }),

        updateExamEligibility: builder.mutation<{ id: string; fullName: string; examEligibility: boolean }, { studentId: string; examEligibility: boolean }>({
            query: ({ studentId, examEligibility }) => ({
                url: `/accounts/students/${studentId}/eligibility`,
                method: 'PATCH',
                body: { examEligibility },
            }),
        }),

        updateTransportOpted: builder.mutation<{ id: string; fullName: string; transportOpted: boolean; clearedMonths: number }, { studentId: string; transportOpted: boolean }>({
            query: ({ studentId, transportOpted }) => ({
                url: `/accounts/students/${studentId}/transport`,
                method: 'PATCH',
                body: { transportOpted },
            }),
        }),

        upsertStudentMonthlyFee: builder.mutation<unknown, {
            studentId: string;
            classroomId: string;
            month: number;
            year: number;
            transportFees?: number;
            otherFees?: number;
            otherFeesRemarks?: string;
            discount?: number;
            previousAmount?: number;
            annualChargesApplicable?: boolean;
        }>({
            query: ({ studentId, ...body }) => ({
                url: `/accounts/students/${studentId}/monthly-fee`,
                method: 'PATCH',
                body,
            }),
        }),

        // Income
        getIncomes: builder.query<IncomeRecord[], void>({
            query: () => ({ url: '/accounts/incomes', method: 'GET' }),
        }),

        createIncome: builder.mutation<IncomeRecord, {
            date: string;
            source: string;
            category: IncomeCategory;
            categoryName?: string;
            amount: number;
            paymentMode: PaymentMode;
            addedBy: string;
            chequeNumber?: string;
        }>({
            query: (body) => ({ url: '/accounts/incomes', method: 'POST', body }),
        }),

        updateIncome: builder.mutation<IncomeRecord, { id: string; body: Partial<Omit<IncomeRecord, 'id' | 'createdAt'>> }>({
            query: ({ id, body }) => ({ url: `/accounts/incomes/${id}`, method: 'PATCH', body }),
        }),

        deleteIncome: builder.mutation<void, string>({
            query: (id) => ({ url: `/accounts/incomes/${id}`, method: 'DELETE' }),
        }),

        // Expenses
        getExpenses: builder.query<ExpenseRecord[], void>({
            query: () => ({ url: '/accounts/expenses', method: 'GET' }),
        }),

        createExpense: builder.mutation<ExpenseRecord, {
            date: string;
            reason: string;
            partyName?: string;
            category: ExpenseCategory;
            categoryName?: string;
            amount: number;
            paymentMode: PaymentMode;
            addedBy: string;
            chequeNumber?: string;
        }>({
            query: (body) => ({ url: '/accounts/expenses', method: 'POST', body }),
        }),

        updateExpense: builder.mutation<ExpenseRecord, { id: string; body: Partial<Omit<ExpenseRecord, 'id' | 'createdAt'>> }>({
            query: ({ id, body }) => ({ url: `/accounts/expenses/${id}`, method: 'PATCH', body }),
        }),

        deleteExpense: builder.mutation<void, string>({
            query: (id) => ({ url: `/accounts/expenses/${id}`, method: 'DELETE' }),
        }),

        // P&L
        getProfitAndLoss: builder.query<ProfitLoss, { month?: number; year?: number }>({
            query: (params) => {
                const q = new URLSearchParams();
                if (params.month) q.set('month', String(params.month));
                if (params.year) q.set('year', String(params.year));
                const qs = q.toString();
                return { url: `/accounts/balance${qs ? `?${qs}` : ''}`, method: 'GET' };
            },
        }),
    }),
});

export const {
    useGetClassroomsWithFeesQuery,
    useUpsertClassroomFeesMutation,
    useApplyClassroomOtherFeesMutation,
    useGetLatestPaymentsQuery,
    useGetStudentFeesQuery,
    useSearchStudentsFeesQuery,
    useUpdateOtherFeesMutation,
    useRecordStudentPaymentMutation,
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
    useUpdateTransportOptedMutation,
    useUpsertStudentMonthlyFeeMutation,
    useGetIncomesQuery,
    useCreateIncomeMutation,
    useUpdateIncomeMutation,
    useDeleteIncomeMutation,
    useGetExpensesQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    useGetProfitAndLossQuery,
} = accountsApi;
