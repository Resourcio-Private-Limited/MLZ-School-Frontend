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
  fullName: string;
  rollNumber: string | null;
  attendance: string | null;
  overallGrade: string | null;
  lastExam: { name: string; examDate: string } | null;
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

// ─── API ───────────────────────────────────────────────────────────

export const teacherApi = baseApi.injectEndpoints({
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
  }),
});

export const {
  useGetTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
  useGetTeacherClassesQuery,
  useGetClassDetailsQuery,
  useGetClassStudentsQuery,
  useMarkAttendanceMutation,
  useGetAttendanceHistoryQuery,
  useGetAttendanceByDateQuery,
  useUploadProfileImageMutation,
  useGetClassroomExamsQuery,
  useGetTeacherSubjectsQuery,
  useGetStudentMarksQuery,
  useSaveStudentMarksMutation,
} = teacherApi;
