import { MOCK_STUDENTS_LIST, MockSchoolService } from "@/lib/mocks";
import CreateStudentForm from "./CreateStudentForm";

export default async function StudentsPage() {
    // Mock students fetch
    const students = MOCK_STUDENTS_LIST.map(s => ({
        ...s,
        user: { name: s.user.name, email: null }, // MOCK_STUDENTS_LIST has basic user info
        classroom: { name: 'Class 1-A' }, // Mock classroom name
        section: { name: 'A' }, // Mock section name
    }));

    const classrooms = await MockSchoolService.getAllClassrooms();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                <CreateStudentForm classrooms={classrooms} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Admission No</th>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Class/Sec</th>
                            <th className="p-4 font-semibold text-gray-600">Parent Contact</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm text-gray-800">{student.admissionNo}</td>
                                <td className="p-4 font-medium text-gray-800">
                                    {student.user.name}
                                    <div className="text-xs text-gray-500">{student.user.email}</div>
                                </td>
                                <td className="p-4 text-gray-800">
                                    {student.classroom ? `${student.classroom.name} - ${student.section?.name || 'N/A'}` : "Unassigned"}
                                </td>
                                <td className="p-4 text-gray-800">{student.parentContact}</td>
                                <td className="p-4">
                                    <button className="text-blue-600 text-sm hover:underline">View</button>
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No students found. Admit new students.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
