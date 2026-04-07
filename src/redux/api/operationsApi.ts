import { baseApi } from './baseApi';

export type NoticeTag = 'ALL_NOTICES' | 'GENERAL' | 'HOLIDAYS' | 'EVENTS' | 'EXAMS' | 'EMERGENCY';

export interface Notice {
  id: string;
  title: string;
  content: string;
  senderName: string;
  link: string | null;
  file: string | null;
  tag: NoticeTag;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  fileUrl: string | null;
  createdAt: string;
  teacherId: string;
  classroomId: string;
  teacher: { fullName: string };
}

export interface ClassroomTeacher {
  id: string;
  fullName: string;
  primaryContact: string | null;
  designation: string | null;
  isClassTeacher: boolean;
}

export const operationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query<Notice[], void>({
      query: () => ({ url: '/operations/notices', method: 'GET' }),
    }),

    getAnnouncements: builder.query<Announcement[], string>({
      query: (classroomId) => ({ url: `/operations/announcements/${classroomId}`, method: 'GET' }),
    }),

    getClassroomTeachers: builder.query<ClassroomTeacher[], string>({
      query: (classroomId) => ({ url: `/operations/classroom/${classroomId}/teachers`, method: 'GET' }),
    }),
  }),
});

export const { useGetNoticesQuery, useGetAnnouncementsQuery, useGetClassroomTeachersQuery } = operationsApi;