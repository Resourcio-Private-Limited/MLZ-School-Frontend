import { baseApi } from './baseApi';

// ─── Types ──────────────────────────────────────────────────────────

export interface TeacherPersonal {
  fullName: string;
  dob: string;
  gender: string;
  residentialAddress: string;
  nationality: string | null;
  caste: string | null;
  isPwd: boolean;
  aadharNo: string | null;
  identificationMark: string | null;
  primaryContact: string;
  secondaryContact: string | null;
  email: string | null;
  bloodGroup: string | null;
  profileImage: string | null;
}

export interface TeacherOfficial {
  employeeId: string;
  designation: string | null;
  department: string;
  qualifications: string[];
  joiningDate: string;
  currentSalary: number | null;
  status: string | null;
  officialDocumentNumber: string | null;
}

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
  personal: TeacherPersonal;
  official: TeacherOfficial;
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
  dob?: string;
  gender?: string;
  residentialAddress?: string;
  primaryContact?: string;
  secondaryContact?: string;
  email?: string;
  designation?: string;
  department?: string;
  qualifications?: string[];
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
} = teacherApi;
