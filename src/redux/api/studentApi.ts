import { baseApi } from './baseApi';

// ─── Types ──────────────────────────────────────────────────────────

export interface StudentPersonal {
  fullName: string;
  dob: string;
  gender: string;
  nationality: string | null;
  caste: string | null;
  aadharNo: string | null;
  email: string | null;
  isPwd: boolean;
  primaryContact: string;
  secondaryContact: string | null;
  identificationMark: string | null;
  residentialAddress: string;
  profileImage: string | null;
}

export interface StudentAcademic {
  admissionNumber: string;
  admissionYear: number;
  admissionDate: string;
  rollNumber: string | null;
  classRoll: number | null;
  passingYear: number | null;
  transportOpted: boolean;
  parentName: string | null;
  parentContact: string | null;
}

export interface CurrentClass {
  id: string;
  name: string;
  grade: string;
  section: string;
}

export interface ExamSubject {
  name: string;
}

export interface ExamClassroom {
  name: string;
  grade: string;
}

export interface ExamInfo {
  id: string;
  name: string;
  examDate: string;
  submissionOpen: boolean;
  subject: ExamSubject;
  classroom: ExamClassroom;
}

export interface MarkEntry {
  id: string;
  score: number;
  examId: string;
  studentId: string;
  exam: ExamInfo;
}

export interface StudentProfileResponse {
  personal: StudentPersonal;
  academic: StudentAcademic;
  currentClass: CurrentClass;
  userEmail: string;
  marksByClass: Record<string, MarkEntry[]>;
}

export interface DashboardClassroom {
  id: string;
  name: string;
  classTeacher: string | null;
  studentCount: number;
  subjectCount: number;
  noticeCount: number;
}

export interface UpcomingOnlineClass {
  id: string;
  topic: string;
  meetingLink: string;
  date: string;
}

export interface LatestExam {
  id: string;
  name: string;
  examDate: string;
}

export interface DashboardResponse {
  classroom: DashboardClassroom;
  upcomingOnlineClasses: UpcomingOnlineClass[];
  latestExams: LatestExam[];
}

export interface ExamAdmitCard {
  fileUrl: string;
  issuedAt: string;
}

export interface ExamResultInfo {
  fileUrl: string;
  publishedAt: string;
}

export interface StudentExam {
  id: string;
  name: string;
  examDate: string;
  submissionOpen: boolean;
  subject: string;
  admitCard: ExamAdmitCard | null;
  result: ExamResultInfo | null;
}

export interface ExamsResponse {
  exams: StudentExam[];
}
export interface StudentAdmitCard { id: string; issuedAt: string; fileUrl: string; svgUrl: string | null; examName: string; examDate: string; }

export interface UpdateProfilePayload {
  fullName?: string;
  residentialAddress?: string;
  primaryContact?: string;
  secondaryContact?: string;
  email?: string;
}

// ─── Student Payment ────────────────────────────────────────────────

export interface MonthlyFeeRecord {
  id: string;
  month: number;
  year: number;
  tuitionFees: number;
  annualCharges: number;
  annualContributionRequired: number;
  transportFees: number;
  otherFees: number;
  penalty: number;
  discount: number;
  totalAmount: number;
  isPaid: boolean;
  paidAmount: number;
  paidAt: string | null;
  receiptUrl: string | null;
  paymentId: string | null;
}

export interface AnnualFeeSummary {
  total: number;
  paid: number;
  remaining: number;
  expiryDate: string | null;
  isOverdue: boolean;
  isConfigured: boolean;
}

export interface StudentMonthlyFeesResponse {
  year: number;
  annualSummary: AnnualFeeSummary;
  fees: MonthlyFeeRecord[];
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
  paymentReference: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paidAt: string;
  student: {
    admissionNumber: string;
    fullName: string;
    parentName?: string | null;
    className: string;
    section: string;
  };
  academicSession: string;
  feesForPeriod: string;
  fees: {
    application: number;
    admission: number;
    security: number;
    annual: number;
    tuition: number;
    transport: number;
    stationery: number;
    miscellaneous: number;
  };
  total: number;
  paymentMode: string;
}

// ─── API ───────────────────────────────────────────────────────────

export const studentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<StudentProfileResponse, void>({
      query: () => ({ url: '/student/profile', method: 'GET' }),
    }),

    getDashboard: builder.query<DashboardResponse, void>({
      query: () => ({ url: '/student/dashboard', method: 'GET' }),
    }),

    getExams: builder.query<StudentExam[], void>({
      query: () => ({ url: '/student/exams', method: 'GET' }),
    }),
    getAdmitCards: builder.query<StudentAdmitCard[], void>({ query: () => ({ url: '/student/admit-cards', method: 'GET' }) }),

    updateProfile: builder.mutation<StudentProfileResponse, UpdateProfilePayload>({
      query: (body) => ({ url: '/student/update-profile', method: 'PATCH', body }),
    }),

    getMessageRecipients: builder.query<Array<{ id: string; name: string; role: string }>, void>({
      query: () => ({ url: '/student/message-recipients', method: 'GET' }),
    }),

    // Monthly fee breakdown
    getMonthlyFees: builder.query<StudentMonthlyFeesResponse, number | void>({
      query: (year) => ({ url: `/student/fees/monthly${year ? `?year=${year}` : ''}`, method: 'GET' }),
    }),

    // Create Razorpay order
    createRazorpayOrder: builder.mutation<RazorpayOrderResponse, { year: number; items: Array<{ month: number; annualContribution?: number }> }>({
      query: (body) => ({ url: '/student/fees/monthly/order', method: 'POST', body }),
    }),

    // Confirm payment after Razorpay success
    confirmStudentPayment: builder.mutation<PaymentReceipt, {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }>({
      query: (body) => ({ url: '/student/fees/monthly/confirm', method: 'POST', body }),
    }),

    getPaymentReceipt: builder.query<PaymentReceipt, string>({
      query: (paymentId) => ({ url: `/student/payments/${paymentId}/receipt`, method: 'GET' }),
    }),

    uploadProfileImage: builder.mutation<{ success: boolean; imageUrl: string }, { imageUrl: string }>({
      query: (body) => ({ url: '/upload/profile-image', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetProfileQuery,
  useGetDashboardQuery,
  useGetExamsQuery,
  useGetAdmitCardsQuery,
  useUpdateProfileMutation,
  useGetMessageRecipientsQuery,
  useGetMonthlyFeesQuery,
  useCreateRazorpayOrderMutation,
  useConfirmStudentPaymentMutation,
  useGetPaymentReceiptQuery,
  useUploadProfileImageMutation,
} = studentApi;
