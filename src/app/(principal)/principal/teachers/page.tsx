import { MOCK_TEACHERS } from "@/lib/mocks";
import { Plus } from "lucide-react";
import CreateTeacherForm from "./CreateTeacherForm";
// We will make a client component for the form dialog/sheet

export default async function TeachersPage() {
    const teachers = MOCK_TEACHERS;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
                <CreateTeacherForm />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Email</th>
                            <th className="p-4 font-semibold text-gray-600">Designation</th>
                            <th className="p-4 font-semibold text-gray-600">Class Teacher</th>
                            <th className="p-4 font-semibold text-gray-600">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {teachers.map((teacher) => (
                            <tr key={teacher.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-800">{teacher.user.name}</td>
                                <td className="p-4 text-gray-800">{teacher.user.email}</td>
                                <td className="p-4 text-gray-800">{teacher.designation || "N/A"}</td>
                                <td className="p-4">
                                    {teacher.classTeacherOf ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                            {teacher.classTeacherOf.name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500">
                                    {new Date(teacher.joiningDate).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {teachers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No teachers found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
