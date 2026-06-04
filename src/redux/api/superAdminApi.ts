import { baseApi } from './baseApi';

// ─── Types ──────────────────────────────────────────────────────────

export interface SuperAdminProfile {
    id: string;
    fullName: string;
    dob: string | null;
    gender: string | null;
    residentialAddress: string | null;
    nationality: string | null;
    primaryContact: string | null;
    secondaryContact: string | null;
    email: string | null;
    designation: string | null;
    department: string | null;
    userEmail: string;
    profileImage: string | null;
}

export interface DashboardKpis {
    totalStudents: number;
    totalTeachers: number;
    administrativeStaff: number;
    activeNotices: number;
    monthlyRevenue: number;
    pendingAdmissions: number;
}

export interface UserManagementKpis {
    totalTeachers: number;
    totalStudents: number;
    staffMembers: number;
    totalUsers: number;
}

export interface UserSummary {
    id: string;
    userId: string;
    fullName: string;
    employeeId?: string | null;
    admissionNumber?: string;
    classroom?: string;
    isActive: boolean;
    email: string;
    role: 'TEACHER' | 'STUDENT' | 'PRINCIPAL' | 'ACCOUNTANT' | 'STAFF' | 'OTHER';
    primaryContact?: string;
    secondaryContact?: string | null;
    dob?: string | null;
    gender?: string;
    residentialAddress?: string;
    nationality?: string | null;
    caste?: string | null;
    isPwd?: boolean;
    aadharNo?: string | null;
    identificationMark?: string | null;
    highestQualification?: string;
    salary?: string;
    customRole?: string;
    password?: string;
    designation?: string | null;
    department?: string | null;
    joiningDate?: string | null;
    status?: string | null;
    officialDocType?: string | null;
    officialDocNumber?: string | null;
    employmentType?: string | null;
}

export interface AllUsersResponse {
    teachers: UserSummary[];
    students: UserSummary[];
    staff: UserSummary[];
    principals: UserSummary[];
}

export interface AddUserPayload {
    role: 'TEACHER' | 'STUDENT' | 'ACCOUNTANT' | 'PRINCIPAL' | 'STAFF';
    email: string;
    password: string;
    fullName: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    highestQualification?: string;
    salary?: string | number;
    joiningDate?: string;
    status?: string;
    officialDocType?: string;
    officialDocNumber?: string;
    employmentType?: string;
    admissionNumber?: string;
    admissionYear?: number;
    rollNumber?: string;
    transportOpted?: boolean;
    dob?: string;
    gender?: string;
    residentialAddress?: string;
    primaryContact?: string;
    secondaryContact?: string;
    parentName?: string;
    parentContact?: string;
    classroomId?: string;
    nationality?: string;
    caste?: string;
    isPwd?: boolean;
    aadharNo?: string;
    identificationMark?: string;
    customRole?: string;
}

export interface UpdateUserPayload {
    isActive?: boolean;
    email?: string;
    fullName?: string;
    primaryContact?: string;
    secondaryContact?: string;
    dob?: string;
    gender?: string;
    residentialAddress?: string;
    nationality?: string;
    caste?: string;
    isPwd?: boolean;
    aadharNo?: string;
    identificationMark?: string;
    employeeId?: string;
    highestQualification?: string;
    salary?: string;
    customRole?: string;
    designation?: string;
    department?: string;
    joiningDate?: string;
    status?: string;
    officialDocType?: string;
    officialDocNumber?: string;
    employmentType?: string;
}

export interface UpdateSuperAdminProfilePayload {
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

// ─── API ───────────────────────────────────────────────────────────

export const superAdminApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Profile
        getSuperAdminProfile: builder.query<SuperAdminProfile, void>({
            query: () => ({ url: '/super-admin/profile', method: 'GET' }),
            transformResponse: (res: any) => ({
                ...res,
                userEmail: res.user?.email ?? res.email,
            }),
        }),

        updateSuperAdminProfile: builder.mutation<{ id: string; fullName: string }, UpdateSuperAdminProfilePayload>({
            query: (body) => ({ url: '/super-admin/profile', method: 'PATCH', body }),
        }),

        // Dashboard KPIs
        getDashboardKpis: builder.query<DashboardKpis, void>({
            query: () => ({ url: '/super-admin/dashboard-kpis', method: 'GET' }),
        }),

        // User Management
        getUserManagementKpis: builder.query<UserManagementKpis, void>({
            query: () => ({ url: '/super-admin/user-management-kpis', method: 'GET' }),
        }),

        getAllUsers: builder.query<AllUsersResponse, void>({
            query: () => ({ url: '/super-admin/users', method: 'GET' }),
        }),

        addUser: builder.mutation<any, AddUserPayload>({
            query: (body) => ({ url: '/super-admin/users', method: 'POST', body }),
        }),

        updateUser: builder.mutation<{ success: boolean; userId: string }, { userId: string; data: UpdateUserPayload }>({
            query: ({ userId, data }) => ({ url: `/super-admin/users/${userId}`, method: 'PATCH', body: data }),
        }),

        deleteUser: builder.mutation<{ success: boolean; userId: string }, string>({
            query: (userId) => ({ url: `/super-admin/users/${userId}`, method: 'DELETE' }),
        }),

        changeUserPassword: builder.mutation<{ success: boolean; message: string; userId: string }, { userId: string; currentPassword: string; newPassword: string }>({
            query: ({ userId, ...body }) => ({ url: `/super-admin/users/${userId}/password`, method: 'PATCH', body }),
        }),

        uploadProfileImage: builder.mutation<{ success: boolean; imageUrl: string }, { imageUrl: string }>({
            query: (body) => ({ url: '/upload/profile-image', method: 'POST', body }),
        }),
    }),
});

export const {
    useGetSuperAdminProfileQuery,
    useUpdateSuperAdminProfileMutation,
    useGetDashboardKpisQuery,
    useGetUserManagementKpisQuery,
    useGetAllUsersQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useChangeUserPasswordMutation,
    useUploadProfileImageMutation,
} = superAdminApi;
