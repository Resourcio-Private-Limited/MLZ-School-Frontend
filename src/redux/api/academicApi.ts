import { baseApi } from './baseApi';

export interface TeacherExam {
    id: string;
    name: string;
    examDate: string;
    subjectName: string;
    classroomName: string;
    classroomGrade: string;
    classroomSection: string;
    submissionOpen: boolean;
    totalResults: number;
}

export interface ExamStudentRecord {
    studentId: string;
    rollNumber: string;
    fullName: string;
    marksObtained: number | null;
    totalMarks: number;
    percentage: number | null;
    grade: string | null;
    status: string | null;
}

export interface ExamMarksResponse {
    examId: string;
    examName: string;
    examDate: string;
    subjectName: string;
    classroomName: string;
    totalStudents: number;
    totalMarks: number;
    avgMarks: number;
    highestMarks: number;
    lowestMarks: number;
    records: ExamStudentRecord[];
}

export interface ClassroomExamOption {
    classroomId: string;
    classroomName: string;
    grade: string;
    section: string;
    exams: {
        examId: string;
        examName: string;
        subjectName?: string;
        subjectId?: string;
        examDate: string;
        submissionOpen: boolean;
        totalResults: number;
    }[];
}

export const academicApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getExamsForTeacher: builder.query<TeacherExam[], string>({
            query: (teacherId) => ({ url: `/academic/teacher/exams?teacherId=${teacherId}`, method: 'GET' }),
        }),

        getExamTypesForTeacher: builder.query<ClassroomExamOption[], string>({
            query: (teacherId) => ({ url: `/academic/teacher/exam-types?teacherId=${teacherId}`, method: 'GET' }),
        }),

        getExamMarks: builder.query<ExamMarksResponse, string>({
            query: (examId) => ({ url: `/academic/exam/${examId}/marks`, method: 'GET' }),
        }),

        updateStudentMarks: builder.mutation<any, { examId: string; studentId: string; score: number }>({
            query: ({ examId, studentId, score }) => ({
                url: `/academic/exam/${examId}/marks/${studentId}`,
                method: 'POST',
                body: { score },
            }),
        }),
    }),
});

export const {
    useGetExamsForTeacherQuery,
    useGetExamTypesForTeacherQuery,
    useGetExamMarksQuery,
    useUpdateStudentMarksMutation,
} = academicApi;
