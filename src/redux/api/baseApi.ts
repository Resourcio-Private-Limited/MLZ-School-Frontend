import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const LOGIN_PATH: Record<string, string> = {
  STUDENT: '/login/student',
  TEACHER: '/login/teacher',
  PRINCIPAL: '/login/principal',
  ACCOUNTANT: '/login/accounts',
  SUPER_ADMIN: '/login/super-admin',
};

/**
 * A 401 on a signed-in request means the session has ended: the token expired
 * or the account was deactivated. Clear it and go back to the portal's login
 * page instead of leaving the user on a page whose requests all fail.
 */
const baseQueryWithSessionEnd: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 401 && typeof window !== 'undefined' && getToken() && !url.startsWith('/auth/')) {
    const loginPath = LOGIN_PATH[localStorage.getItem('userRole') ?? ''] ?? '/';
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userRole');
    window.location.assign(loginPath);
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithSessionEnd,
  endpoints: () => ({}),
  tagTypes: ['Auth', 'Classroom', 'Subject', 'Notices', 'Conversations', 'Messages', 'StudentDetail', 'ExamSchedule', 'PrincipalProfile', 'ClassAssessments', 'Announcements'],
});
