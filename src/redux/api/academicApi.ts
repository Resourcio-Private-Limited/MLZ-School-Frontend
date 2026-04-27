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

export const academicApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getExamsForTeacher: builder.query<TeacherExam[], string>({
            query: (teacherId) => ({ url: `/academic/teacher/exams?teacherId=${teacherId}`, method: 'GET' }),
        }),

        getExamMarks: builder.query<ExamMarksResponse, string>({
            query: (examId) => ({ url: `/academic/exam/${examId}/marks`, method: 'GET' }),
        }),
    }),
});

export const { useGetExamsForTeacherQuery, useGetExamMarksQuery } = academicApi;
