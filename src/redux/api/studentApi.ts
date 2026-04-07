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
}

export interface StudentAcademic {
  admissionNumber: string;
  admissionYear: number;
  admissionDate: string;
  rollNumber: string | null;
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

export interface UpdateProfilePayload {
  fullName?: string;
  residentialAddress?: string;
  primaryContact?: string;
  secondaryContact?: string;
  email?: string;
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

    updateProfile: builder.mutation<StudentProfileResponse, UpdateProfilePayload>({
      query: (body) => ({ url: '/student/update-profile', method: 'PATCH', body }),
    }),
  }),
});

export const { useGetProfileQuery, useGetDashboardQuery, useGetExamsQuery, useUpdateProfileMutation } = studentApi;