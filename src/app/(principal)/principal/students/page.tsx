"use client";

import { useState } from "react";
import { Eye, Edit, Key, X, EyeOff, RefreshCw } from "lucide-react";
import { MOCK_STUDENTS_LIST, mockAction } from "@/lib/mocks";
import CreateStudentForm from "./CreateStudentForm";

// Extended mock student data with passwords and additional details
const MOCK_STUDENTS_WITH_DETAILS = MOCK_STUDENTS_LIST.map((s, i) => ({
    id: s.id,
    admissionNo: s.admissionNo,
    rollNumber: s.rollNumber,
    classroomId: s.classroomId,
    parentContact: s.parentContact,
    user: {
        ...s.user,
        password: `Student@${2024 + i}` // Mock password
    },
    classroom: {
        name: 'Class 1-A'
    },
    section: {
        name: s.section?.name || 'A'
    },
    dob: new Date(2010 + i, i % 12, (i % 28) + 1),
    gender: (i % 3 === 0 ? "MALE" : i % 3 === 1 ? "FEMALE" : "OTHER") as "MALE" | "FEMALE" | "OTHER",
    nationality: "Indian",
    address: `${i + 1}, Mock Street, Mock City, Mock State - 400001`,
    joiningDate: new Date(2024, 3, 1),
    fatherName: `Father of Student ${i + 1}`,
    motherName: `Mother of Student ${i + 1}`,
}));

type StudentDetails = typeof MOCK_STUDENTS_WITH_DETAILS[0];

export default function StudentsPage() {
    const [students, setStudents] = useState(MOCK_STUDENTS_WITH_DETAILS);
    const [viewingStudent, setViewingStudent] = useState<StudentDetails | null>(null);
    const [editingStudent, setEditingStudent] = useState<StudentDetails | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    const handleResetPassword = async (studentId: string) => {
        const newPassword = `Student@${Math.floor(Math.random() * 10000)}`;
        setStudents(students.map(s =>
            s.id === studentId
                ? { ...s, user: { ...s.user, password: newPassword } }
                : s
        ));
        await mockAction("resetPassword", { studentId, newPassword });
        alert(`Password reset successfully! New password: ${newPassword}`);
    };

    const handleSaveEdit = async () => {
        if (!editingStudent) return;

        setStudents(students.map(s =>
            s.id === editingStudent.id ? editingStudent : s
        ));

        await mockAction("updateStudent", editingStudent);
        setEditingStudent(null);
        alert("Student details updated successfully!");
    };

    const generateNewPassword = () => {
        if (!editingStudent) return;
        const newPassword = `Student@${Math.floor(Math.random() * 10000)}`;
        setEditingStudent({
            ...editingStudent,
            user: { ...editingStudent.user, password: newPassword }
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                <CreateStudentForm classrooms={[]} />
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
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setViewingStudent(student)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingStudent(student)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Student"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(student.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Reset Password"
                                        >
                                            <Key size={18} />
                                        </button>
                                    </div>
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

            {/* View Student Modal */}
            {viewingStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
                                <p className="text-sm text-gray-500 mt-1">{viewingStudent.admissionNo}</p>
                            </div>
                            <button
                                onClick={() => { setViewingStudent(null); setShowPassword(false); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Login Credentials */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-3">Login Credentials</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                        <p className="text-gray-800 font-mono text-sm">{viewingStudent.user.email}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-gray-800 font-mono text-sm">
                                                {showPassword ? viewingStudent.user.password : '••••••••'}
                                            </p>
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                                        <p className="text-gray-800">{viewingStudent.user.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                                        <p className="text-gray-800">{viewingStudent.dob.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                                        <p className="text-gray-800">{viewingStudent.gender}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Nationality</label>
                                        <p className="text-gray-800">{viewingStudent.nationality}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                                        <p className="text-gray-800">{viewingStudent.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Academic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Admission Number</label>
                                        <p className="text-gray-800 font-mono">{viewingStudent.admissionNo}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Joining Date</label>
                                        <p className="text-gray-800">{viewingStudent.joiningDate.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                                        <p className="text-gray-800">{viewingStudent.classroom?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Section</label>
                                        <p className="text-gray-800">{viewingStudent.section?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Parent Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Parent Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Father's Name</label>
                                        <p className="text-gray-800">{viewingStudent.fatherName}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Mother's Name</label>
                                        <p className="text-gray-800">{viewingStudent.motherName}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Parent Contact</label>
                                        <p className="text-gray-800">{viewingStudent.parentContact}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
                            <button
                                onClick={() => { setViewingStudent(null); setShowPassword(false); }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {editingStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Edit Student Details</h2>
                                <p className="text-sm text-gray-500 mt-1">{editingStudent.admissionNo}</p>
                            </div>
                            <button
                                onClick={() => { setEditingStudent(null); setShowEditPassword(false); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Login Credentials */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-700 mb-3">Login Credentials</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={editingStudent.user.email}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                user: { ...editingStudent.user, email: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type={showEditPassword ? "text" : "password"}
                                                value={editingStudent.user.password}
                                                onChange={(e) => setEditingStudent({
                                                    ...editingStudent,
                                                    user: { ...editingStudent.user, password: e.target.value }
                                                })}
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                            />
                                            <button
                                                onClick={() => setShowEditPassword(!showEditPassword)}
                                                className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg"
                                            >
                                                {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                            <button
                                                onClick={generateNewPassword}
                                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                                                title="Generate New Password"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={editingStudent.user.name}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                user: { ...editingStudent.user, name: e.target.value }
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editingStudent.dob.toISOString().split('T')[0]}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                dob: new Date(e.target.value)
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                                        <select
                                            value={editingStudent.gender}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                gender: e.target.value as "MALE" | "FEMALE" | "OTHER"
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        >
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                                        <input
                                            type="text"
                                            value={editingStudent.nationality}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                nationality: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                        <textarea
                                            value={editingStudent.address}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                address: e.target.value
                                            })}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none resize-none text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Parent Details */}
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-3">Parent Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                                        <input
                                            type="text"
                                            value={editingStudent.fatherName}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                fatherName: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mother's Name</label>
                                        <input
                                            type="text"
                                            value={editingStudent.motherName}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                motherName: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Parent Contact</label>
                                        <input
                                            type="text"
                                            value={editingStudent.parentContact}
                                            onChange={(e) => setEditingStudent({
                                                ...editingStudent,
                                                parentContact: e.target.value
                                            })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
                            <button
                                onClick={() => { setEditingStudent(null); setShowEditPassword(false); }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
