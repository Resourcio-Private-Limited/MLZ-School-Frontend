import { baseApi } from './baseApi';

export interface PrincipalPersonal {
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

export interface PrincipalOfficial {
    designation: string | null;
    department: string | null;
}

export interface PrincipalFullProfile {
    id: string;
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
    designation: string | null;
    department: string | null;
    userEmail: string;
}

export interface UpdatePrincipalProfilePayload {
    fullName?: string;
    dob?: string;
    gender?: string;
    residentialAddress?: string;
    primaryContact?: string;
    secondaryContact?: string;
    email?: string;
    designation?: string;
    department?: string;
}

export interface ClassroomSummary {
    id: string;
    name: string;
    grade: string;
    section: string;
    capacity: number;
    total: number;
    classTeacher: { id: string; fullName: string; employeeId: string } | null;
}

export interface ClassroomStudent {
    id: string;
    admissionNo: string;
    fullName: string;
    email: string;
    isActive: boolean;
    dob: Date;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    parentName?: string;
    parentContact?: string;
    attendancePercentage?: number;
    averageMarks?: number;
    feeStatus?: 'CLEARED' | 'PENDING' | 'OVERDUE';
}

export interface StudentListItem {
    studentId: string;
    admissionNumber: string;
    fullName: string;
    classroomId: string;
    classroomName: string;
    section: string;
    attendance: string | null;
    avgMarks: number | null;
    feeStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
}

export interface TeacherSummary {
    id: string;
    fullName: string;
    employeeId: string;
    gender: string | null;
    designation: string | null;
    department: string | null;
    primaryContact: string | null;
    email: string | null;
    status: string;
    isClassTeacher: boolean;
    classTeacherOf: { name: string; grade: string; section: string } | null;
    subjects: { subjectName: string; classroomName: string }[];
}

export interface SubjectSummary {
    id: string;
    name: string;
    classroom: { id: string; name: string; grade: string; section: string };
    teachers: { id: string; fullName: string; employeeId: string }[];
}

export const principalApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllClassrooms: builder.query<ClassroomSummary[], void>({
            query: () => ({ url: '/principal/classrooms', method: 'GET' }),
        }),

        getClassroom: builder.query<ClassroomSummary, string>({
            query: (classroomId) => ({ url: `/principal/classrooms/${classroomId}`, method: 'GET' }),
        }),

        getClassroomStudents: builder.query<ClassroomStudent[], string>({
            query: (classroomId) => ({ url: `/principal/classrooms/${classroomId}/students`, method: 'GET' }),
        }),

        getNextClassrooms: builder.query<ClassroomSummary[], string>({
            query: (classroomId) => ({ url: `/principal/classrooms/${classroomId}/next-classes`, method: 'GET' }),
        }),

        getAllStudents: builder.query<StudentListItem[], void>({
            query: () => ({ url: '/principal/students', method: 'GET' }),
        }),

        getAllTeachers: builder.query<TeacherSummary[], void>({
            query: () => ({ url: '/principal/teachers', method: 'GET' }),
        }),

        getSubjectsByClassroom: builder.query<SubjectSummary[], string>({
            query: (classroomId) => ({ url: `/principal/subjects/${classroomId}`, method: 'GET' }),
        }),

        assignClassTeacher: builder.mutation<any, { teacherId: string; classroomId: string }>({
            query: (body) => ({ url: '/principal/class-teacher', method: 'POST', body }),
        }),

        addSubjectWithTeacher: builder.mutation<any, { subjectName: string; classroomId: string; teacherId: string }>({
            query: (body) => ({ url: '/principal/subjects', method: 'POST', body }),
        }),

        getPrincipalProfile: builder.query<PrincipalFullProfile, void>({
            query: () => ({ url: '/principal/profile', method: 'GET' }),
            transformResponse: (res: any) => ({
                ...res,
                userEmail: res.user?.email ?? res.email,
            }),
        }),

        updatePrincipalProfile: builder.mutation<{ id: string; fullName: string }, UpdatePrincipalProfilePayload>({
            query: (body) => ({ url: '/principal/update-profile', method: 'PATCH', body }),
        }),

        addStudent: builder.mutation<any, {
            userEmail: string;
            password: string;
            admissionNumber: string;
            admissionYear: number;
            rollNumber?: string;
            fullName: string;
            dob: string;
            gender: string;
            residentialAddress: string;
            primaryContact: string;
            parentName?: string;
            parentContact?: string;
            classroomId: string;
        }>({
            query: (body) => ({ url: '/principal/students', method: 'POST', body }),
        }),

        promoteStudents: builder.mutation<any, { studentIds: string[]; targetClassroomId: string }>({
            query: (body) => ({ url: '/principal/promote', method: 'POST', body }),
        }),
    }),
});

export const {
    useGetPrincipalProfileQuery,
    useUpdatePrincipalProfileMutation,
    useGetAllClassroomsQuery,
    useGetClassroomQuery,
    useGetClassroomStudentsQuery,
    useAddStudentMutation,
    useGetNextClassroomsQuery,
    usePromoteStudentsMutation,
    useGetAllStudentsQuery,
    useGetAllTeachersQuery,
    useGetSubjectsByClassroomQuery,
    useAssignClassTeacherMutation,
    useAddSubjectWithTeacherMutation,
} = principalApi;
