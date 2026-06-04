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

export interface CreateNoticePayload {
  title: string;
  content: string;
  senderName: string;
  link?: string;
  file?: string;
  tag: NoticeTag;
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

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  fileUrl?: string;
  teacherId: string;
  classroomId: string;
}

export interface ClassroomTeacher {
  id: string;
  fullName: string;
  primaryContact: string | null;
  designation: string | null;
  isClassTeacher: boolean;
}

export interface ConversationItem {
  otherUserId: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageAt: string;
  direction: 'sent' | 'received';
}

export interface MessageItem {
  id: string;
  createdAt: string;
  content: string;
  senderId: string;
  receiverId: string;
  sender: { id: string; email: string; role: string };
  receiver: { id: string; email: string; role: string };
}

export interface ClassroomSection {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  total: number;
  classTeacher: { id: string; fullName: string; userId?: string } | null;
}

export interface GradeSections {
  grade: string;
  sections: ClassroomSection[];
}

export const operationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotices: builder.query<Notice[], void>({
      query: () => ({ url: '/operations/notices', method: 'GET' }),
      providesTags: ['Notices'],
    }),

    getAnnouncements: builder.query<Announcement[], string>({
      query: (classroomId) => ({ url: `/operations/announcements/${classroomId}`, method: 'GET' }),
    }),

    getClassroomTeachers: builder.query<ClassroomTeacher[], string>({
      query: (classroomId) => ({ url: `/operations/classroom/${classroomId}/teachers`, method: 'GET' }),
    }),

    getSectionsByGrade: builder.query<GradeSections[], string | void>({
      query: (grade) => ({
        url: grade ? `/operations/classrooms?grade=${encodeURIComponent(grade)}` : '/operations/classrooms',
        method: 'GET',
      }),
    }),

    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementPayload>({
      query: (body) => ({ url: '/operations/announcements', method: 'POST', body }),
    }),

    sendMessage: builder.mutation<{ id: string; content: string; senderId: string; receiverId: string }, { receiverId: string; content: string }>({
      query: (body) => ({ url: '/operations/message', method: 'POST', body }),
      invalidatesTags: ['Conversations', 'Messages'],
    }),

    getConversations: builder.query<ConversationItem[], string>({
      query: (userId) => ({ url: `/operations/conversations?userId=${encodeURIComponent(userId)}`, method: 'GET' }),
      providesTags: ['Conversations'],
    }),

    getConversation: builder.query<MessageItem[], { userId: string; otherUserId: string }>({
      query: ({ userId, otherUserId }) => ({
        url: `/operations/conversation?userId=${encodeURIComponent(userId)}&otherUserId=${encodeURIComponent(otherUserId)}`,
        method: 'GET',
      }),
      providesTags: (result, error, { otherUserId }) => [{ type: 'Messages', id: otherUserId }],
    }),

    getUserByRole: builder.query<{ id: string; role: string; email: string } | null, 'PRINCIPAL' | 'SUPER_ADMIN' | 'ACCOUNTANT'>({
      query: (role) => ({
        url: `/operations/user-by-role?role=${encodeURIComponent(role)}`,
        method: 'GET',
      }),
    }),

    createNotice: builder.mutation<Notice, CreateNoticePayload>({
      query: (body) => ({ url: '/operations/notices', method: 'POST', body }),
      invalidatesTags: ['Notices'],
    }),

    updateNotice: builder.mutation<Notice, { noticeId: string; data: Partial<CreateNoticePayload> }>({
      query: ({ noticeId, data }) => ({ url: `/operations/notices/${noticeId}`, method: 'PATCH', body: data }),
      invalidatesTags: ['Notices'],
    }),

    deleteNotice: builder.mutation<{ success: boolean; noticeId: string }, string>({
      query: (noticeId) => ({ url: `/operations/notices/${noticeId}`, method: 'DELETE' }),
      invalidatesTags: ['Notices'],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useGetAnnouncementsQuery,
  useGetClassroomTeachersQuery,
  useGetSectionsByGradeQuery,
  useCreateAnnouncementMutation,
  useSendMessageMutation,
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetUserByRoleQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = operationsApi;