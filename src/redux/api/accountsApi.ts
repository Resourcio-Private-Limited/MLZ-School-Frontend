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
}

export interface StudentFeeRecord {
    studentId: string;
    rollNumber: string;
    fullName: string;
    tuitionFees: number;
    transportFees: number;
    annualCharges: number;
    otherFees: number;
    otherFeesRemarks: string | null;
    penalty: number;
    previousAmount: number;
    discount: number;
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
    tuitionFees: number;
    transportFees: number;
    annualCharges: number;
    annualChargesApplicable: boolean;
    otherFees: number;
    otherFeesRemarks: string | null;
    penalty: number;
    previousAmount: number;
    discount: number;
    totalAmount: number;
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
    totalDiscount: number;
    totalPrevDue: number;
    totalPaid: number;
    totalDue: number;
    totalOverall: number;
    paidMonths: number;
    unpaidMonths: number;
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
    examEligibility: boolean;
    transportOpted: boolean;
    feeStructure: {
        tuitionFees: number;
        annualCharges: number;
        transportOpted: boolean;
    };
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
    endpoints: (builder) => ({
        // Classroom Fees
        getClassroomsWithFees: builder.query<ClassroomWithFees[], void>({
            query: () => ({ url: '/accounts/classrooms/fees', method: 'GET' }),
        }),

        upsertClassroomFees: builder.mutation<ClassroomWithFees, { classroomId: string; tuitionFees: number; lateFees: number; annualCharges: number }>({
            query: ({ classroomId, ...body }) => ({
                url: `/accounts/classrooms/${classroomId}/fees`,
                method: 'POST',
                body,
            }),
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

        updateTransportOpted: builder.mutation<{ id: string; fullName: string; transportOpted: boolean }, { studentId: string; transportOpted: boolean }>({
            query: ({ studentId, transportOpted }) => ({
                url: `/accounts/students/${studentId}/transport`,
                method: 'PATCH',
                body: { transportOpted },
            }),
        }),

        upsertStudentMonthlyFee: builder.mutation<any, {
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
