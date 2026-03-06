import { getMockSession, MOCK_TEACHERS, MOCK_STUDENTS_LIST } from "@/lib/mocks";
import AttendanceSheet from "./AttendanceSheet";

export default async function TeacherAttendancePage() {
    const session = await getMockSession();
    if (!session) return null;

    // Mock teacher fetch
    const teacher = MOCK_TEACHERS[0]; // Assume first mock teacher is logged in and is a class teacher

    if (!teacher || !teacher.classTeacherOf) {
        return (
            <div className="p-8 text-center bg-white rounded-xl border">
                <h1 className="text-xl font-bold text-gray-800 mb-2">Class Attendance</h1>
                <p className="text-gray-500">You are not assigned as a Class Teacher.</p>
            </div>
        );
    }

    const classroomId = 'class-1'; // Mock classroom ID

    // Mock students fetch
    const students = MOCK_STUDENTS_LIST.filter(s => s.classroomId === classroomId);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Mark Attendance: {teacher.classTeacherOf.name}</h1>
            <AttendanceSheet classroomId={classroomId} students={students} />
        </div>
    );
}
