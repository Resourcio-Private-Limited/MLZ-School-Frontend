"use client";

import { Plus } from "lucide-react";
import CreateTeacherForm from "./CreateTeacherForm";
import { useGetAllTeachersQuery } from "@/redux/api/principalApi";

export default function TeachersPage() {
    const { data: teachers = [], isLoading } = useGetAllTeachersQuery();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-500">Loading teachers...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Teachers ({teachers.length})</h1>
                <CreateTeacherForm />
            </div>

            {teachers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <p className="text-gray-500">No teachers found. Add one to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                <th className="p-4 font-semibold text-gray-600">Email</th>
                                <th className="p-4 font-semibold text-gray-600">Employee ID</th>
                                <th className="p-4 font-semibold text-gray-600">Class Teacher</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {teachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{teacher.fullName}</td>
                                    <td className="p-4 text-gray-800">{teacher.email}</td>
                                    <td className="p-4 font-mono text-sm text-gray-600">{teacher.employeeId}</td>
                                    <td className="p-4">
                                        {teacher.classTeacherOf ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                {teacher.classTeacherOf.name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${teacher.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {teacher.status || 'ACTIVE'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
