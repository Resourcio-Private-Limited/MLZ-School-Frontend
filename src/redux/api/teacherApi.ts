import { baseApi } from './baseApi';

// ─── Types ──────────────────────────────────────────────────────────

export interface ClassTeacherOf {
  id: string;
  name: string;
  grade: string;
  section: string;
}

export interface AssignedClassroom {
  id: string;
  name: string;
  grade: string;
  section: string;
  subjects: string[];
  studentCount: number;
  isClassTeacher: boolean;
}

export interface TeacherFullProfile {
  halfYearlyMarksEntryEnabled?: boolean;
  finalMarksEntryEnabled?: boolean;
  // Basic Info
  fullName: string;
  email: string;
  primaryContact: string;
  dob: string;
  gender: string;
  residentialAddress: string;
  profileImage: string | null;

  // Teacher Specific Fields
  employeeId: string;
  highestQualification: string;
  salary: string;
  designation: string | null;
  status: string;

  // Related Data
  classTeacherOf: ClassTeacherOf | null;
  assignedClassrooms: AssignedClassroom[];
  userEmail: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  grade: string;
  section: string;
  subjects: string[];
  studentCount: number;
  isClassTeacher: boolean;
}

export interface ClassroomDetails {
  className: string;
  classTeacherName: string | null;
  section: string;
  totalStudents: number;
}

export interface ClassStudent {
  id: string;
  userId: string;
  fullName: string;
  rollNumber: string | null;
  attendance: string | null;
  overallGrade: string | null;
  lastExam: { name: string; examDate: string } | null;
}

export interface MessageRecipient {
  id: string;
  name: string;
  role: string;
}

export interface UpdateTeacherProfilePayload {
  fullName?: string;
  email?: string;
  primaryContact?: string;
  dob?: string;
  gender?: string;
  residentialAddress?: string;
  employeeId?: string;
  highestQualification?: string;
  salary?: string;
  nationality?: string;
  caste?: string;
  isPwd?: boolean;
  aadharNo?: string;
  identificationMark?: string;
  secondaryContact?: string;
  bloodGroup?: string;
}

export interface MarkAttendanceEntry {
  studentId: string;
  status: 'PRESENT' | 'ABSENT';
  teacherId: string;
  classroomId: string;
}

export interface AttendanceDay {
  date: string;
  dayName: string;
  present: number;
  absent: number;
  totalStudents: number;
  isMarked: boolean;
  teacherId: string | null;
}

export interface AttendanceHistoryResponse {
  classroomId: string;
  year: number;
  month: number;
  totalStudents: number;
  avgAttendance: number;
  totalWorkingDays: number;
  days: AttendanceDay[];
}

export interface AttendanceByDateRecord {
  studentId: string;
  fullName: string;
  rollNumber: string;
  status: 'PRESENT' | 'ABSENT';
}

export interface AttendanceByDateResponse {
  date: string;
  total: number;
  present: number;
  absent: number;
  records: AttendanceByDateRecord[];
}

// Exam Types
export interface ExamSubject {
  id: string;
  name: string;
}

export interface ClassroomExam {
  id: string;
  name: string;
  examDate: string;
  subject: ExamSubject;
  subjectId: string;
  classroomId: string;
}

export interface StudentExamMark {
  studentId: string;
  fullName: string;
  rollNumber: string | null;
  subjectId: string;
  subjectName: string;
  examId: string;
  examName: string;
  score: number | null;
  maxScore: number;
}

export interface StudentMarkSummary {
  studentId: string;
  fullName: string;
  rollNumber: string | null;
  examId: string;
  examName: string;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    score: number | null;
    maxScore: number;
  }>;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  classType: 'PRIMARY' | 'SECONDARY';
}

export interface SaveMarksPayload {
  classroomId: string;
  examId: string;
  marks: Array<{
    studentId: string;
    subjectId: string;
    score: number;
  }>;
}

// ─── Component-wise marks entry ────────────────────────────────────

export type ExamTerm = 'HALF_YEARLY' | 'FINAL';
export type PrimaryGradeCode = 'BG' | 'PG' | 'PF' | 'NA';
export type SecondaryComponentKey = 'periodicTest' | 'multipleAssessment' | 'subjectEnrichment' | 'examMarks';
/** PRIMARY: Half Yearly → term1Grade + term2Grade, Final → term3Grade. */
export type PrimaryGradeField = 'term1Grade' | 'term2Grade' | 'term3Grade';

export interface SubjectAssessmentEntry {
  subjectId: string;
  term1Grade: PrimaryGradeCode | null;
  term2Grade: PrimaryGradeCode | null;
  term3Grade: PrimaryGradeCode | null;
  periodicTest: number | null;
  multipleAssessment: number | null;
  subjectEnrichment: number | null;
  examMarks: number | null;
  total: number | null;
}

export interface ClassAssessmentStudent {
  studentId: string;
  fullName: string;
  rollNumber: string | null;
  classRoll: number | null;
  /** Present only for the class teacher on the FINAL exam. */
  remarks?: string | null;
  assessments: SubjectAssessmentEntry[];
}

export interface ClassAssessments {
  classroomId: string;
  classroomName: string;
  classType: 'PRIMARY' | 'SECONDARY';
  examType: ExamTerm;
  session: string;
  entryEnabled: boolean;
  isClassTeacher: boolean;
  showRemarks: boolean;
  gradeOptions: Array<{ code: PrimaryGradeCode; label: string }>;
  /** Grade columns for this exam (PRIMARY only). */
  gradeFields: Array<{ key: PrimaryGradeField; label: string }>;
  components: Array<{ key: SecondaryComponentKey; label: string; maxMarks: number }>;
  subjectMaxMarks: number | null;
  subjects: Array<{ id: string; name: string; editable: boolean }>;
  students: ClassAssessmentStudent[];
}

export interface SaveStudentAssessmentPayload {
  classroomId: string;
  examType: ExamTerm;
  studentId: string;
  subjects: Array<{
    subjectId: string;
    term1Grade?: PrimaryGradeCode | null;
    term2Grade?: PrimaryGradeCode | null;
    term3Grade?: PrimaryGradeCode | null;
    periodicTest?: number | null;
    multipleAssessment?: number | null;
    subjectEnrichment?: number | null;
    examMarks?: number | null;
  }>;
  remarks?: string | null;
}

// ─── API ───────────────────────────────────────────────────────────

export const teacherApi = baseApi.injectEndpoints({
  // Dev hot reload can evaluate this module twice; re-injecting the same endpoints is expected there.
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (builder) => ({
    getTeacherProfile: builder.query<TeacherFullProfile, void>({
      query: () => ({ url: '/teacher/full-profile', method: 'GET' }),
    }),

    updateTeacherProfile: builder.mutation<{ id: string; fullName: string }, UpdateTeacherProfilePayload>({
      query: (body) => ({ url: '/teacher/update-profile', method: 'PATCH', body }),
    }),

    getTeacherClasses: builder.query<TeacherClass[], void>({
      query: () => ({ url: '/teacher/my-classes', method: 'GET' }),
    }),

    getClassDetails: builder.query<ClassroomDetails, string>({
      query: (classroomId) => ({ url: `/teacher/class/${classroomId}/details`, method: 'GET' }),
    }),

    getClassStudents: builder.query<ClassStudent[], string>({
      query: (classroomId) => ({ url: `/teacher/class/${classroomId}/students`, method: 'GET' }),
    }),

    getClassStudentsLazy: builder.query<ClassStudent[], string>({
      query: (classroomId) => ({ url: `/teacher/class/${classroomId}/students`, method: 'GET' }),
    }),

    getMessageRecipients: builder.query<MessageRecipient[], void>({
      query: () => ({ url: '/teacher/message-recipients', method: 'GET' }),
    }),

    markAttendance: builder.mutation<{ count: number }, MarkAttendanceEntry[]>({
      query: (body) => ({ url: '/operations/attendance', method: 'POST', body }),
    }),

    getAttendanceHistory: builder.query<AttendanceHistoryResponse, { classroomId: string; month?: number; year?: number }>({
      query: ({ classroomId, month, year }) => {
        const params = new URLSearchParams();
        params.set('classroomId', classroomId);
        if (month) params.set('month', String(month));
        if (year) params.set('year', String(year));
        return { url: `/operations/attendance/${classroomId}/history?${params.toString()}`, method: 'GET' };
      },
    }),

    getAttendanceByDate: builder.query<AttendanceByDateResponse, { classroomId: string; date: string }>({
      query: ({ classroomId, date }) => ({
        url: `/operations/attendance/${classroomId}/${date}`,
        method: 'GET',
      }),
    }),

    uploadProfileImage: builder.mutation<{ success: boolean; imageUrl: string }, { imageUrl: string }>({
      query: (body) => ({ url: '/upload/profile-image', method: 'POST', body }),
    }),

    // Get exams for a classroom
    getClassroomExams: builder.query<ClassroomExam[], string>({
      query: (classroomId) => ({ url: `/teacher/class/${classroomId}/exams`, method: 'GET' }),
    }),

    // Get subjects assigned to this teacher for a classroom
    getTeacherSubjects: builder.query<ExamSubject[], string>({
      query: (classroomId) => ({ url: `/teacher/class/${classroomId}/subjects`, method: 'GET' }),
    }),

    // Get students with their marks for a specific exam
    getStudentMarks: builder.query<StudentMarkSummary[], { classroomId: string; examId: string }>({
      query: ({ classroomId, examId }) => ({
        url: `/teacher/class/${classroomId}/exam/${examId}/marks`,
        method: 'GET',
      }),
    }),

    // Save/update marks for students
    saveStudentMarks: builder.mutation<{ success: boolean; count: number }, SaveMarksPayload>({
      query: (body) => ({ url: '/teacher/marks', method: 'POST', body }),
    }),

    // All students × subjects for one exam term (Half Yearly / Final)
    getClassAssessments: builder.query<ClassAssessments, { classroomId: string; examType: ExamTerm }>({
      query: ({ classroomId, examType }) => ({
        url: `/teacher/class/${classroomId}/assessments`,
        method: 'GET',
        params: { examType },
      }),
      providesTags: (_result, _error, { classroomId, examType }) => [{ type: 'ClassAssessments', id: `${classroomId}:${examType}` }],
    }),

    // Save one student's marks for every subject of an exam term
    saveStudentAssessment: builder.mutation<{ success: boolean; savedSubjects: number }, SaveStudentAssessmentPayload>({
      query: ({ classroomId, ...body }) => ({ url: `/teacher/class/${classroomId}/assessments`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { classroomId, examType }) => [{ type: 'ClassAssessments', id: `${classroomId}:${examType}` }],
    }),
  }),
});

export const {
  useGetTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
  useGetTeacherClassesQuery,
  useGetClassDetailsQuery,
  useGetClassStudentsQuery,
  useLazyGetClassStudentsQuery,
  useGetMessageRecipientsQuery,
  useMarkAttendanceMutation,
  useGetAttendanceHistoryQuery,
  useGetAttendanceByDateQuery,
  useUploadProfileImageMutation,
  useGetClassroomExamsQuery,
  useGetTeacherSubjectsQuery,
  useGetStudentMarksQuery,
  useSaveStudentMarksMutation,
  useGetClassAssessmentsQuery,
  useSaveStudentAssessmentMutation,
} = teacherApi;
