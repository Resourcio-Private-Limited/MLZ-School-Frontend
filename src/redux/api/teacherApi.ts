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
  }),
});

export const {
  useGetTeacherProfileQuery,
  useUpdateTeacherProfileMutation,
  useGetTeacherClassesQuery,
  useGetClassDetailsQuery,
  useGetClassStudentsQuery,
} = teacherApi;
