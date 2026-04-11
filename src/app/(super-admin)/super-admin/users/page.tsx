"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Trash2, Key, UserPlus, X, Save, Eye, EyeOff, User, Briefcase, CheckCircle2 } from "lucide-react";
import {
    useGetUserManagementKpisQuery,
    useGetAllUsersQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    UserSummary,
} from "@/redux/api/superAdminApi";

const ROLES = ['TEACHER', 'STUDENT', 'PRINCIPAL', 'ACCOUNTANT'] as const;
type Role = typeof ROLES[number];

interface NewUserForm {
    role: Role;
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    department: string;
    admissionNumber: string;
    admissionYear: number;
    rollNumber: string;
    dob: string;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    parentName: string;
    parentContact: string;
    classroomId: string;
    designation: string;
}

const emptyForm: NewUserForm = {
    role: 'TEACHER',
    email: '',
    password: '',
    fullName: '',
    employeeId: '',
    department: '',
    admissionNumber: '',
    admissionYear: new Date().getFullYear(),
    rollNumber: '',
    dob: '',
    gender: '',
    residentialAddress: '',
    primaryContact: '',
    parentName: '',
    parentContact: '',
    classroomId: '',
    designation: '',
};

const TAB_ROLE_MAP: Record<string, Role[]> = {
    Teachers: ['TEACHER'],
    Students: ['STUDENT'],
    Staff: ['PRINCIPAL', 'ACCOUNTANT'],
};

export default function UserManagementPage() {
    const [selectedTab, setSelectedTab] = useState<"Teachers" | "Students" | "Staff">("Teachers");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [newUser, setNewUser] = useState<NewUserForm>(emptyForm);

    const { data: kpis } = useGetUserManagementKpisQuery();
    const { data: allUsers, isLoading, refetch } = useGetAllUsersQuery();
    const [addUser, { isLoading: isAdding }] = useAddUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

    useEffect(() => {
        if (feedback) setTimeout(() => setFeedback(null), 4000);
    }, [feedback]);

    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
    };

    const getTabUsers = (): UserSummary[] => {
        if (!allUsers) return [];
        const roles = TAB_ROLE_MAP[selectedTab];
        return [
            ...allUsers.teachers.filter((u) => roles.includes(u.role)),
            ...allUsers.students.filter((u) => roles.includes(u.role)),
            ...allUsers.staff.filter((u) => roles.includes(u.role)),
            ...allUsers.principals.filter((u) => roles.includes(u.role)),
        ];
    };

    const allTabUsers = getTabUsers();
    const filteredUsers = allTabUsers.filter(
        (u) =>
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddUser = async () => {
        try {
            await addUser(newUser as any).unwrap();
            setShowAddModal(false);
            setNewUser(emptyForm);
            showFeedback("success", "User added successfully!");
            refetch();
        } catch {
            showFeedback("error", "Failed to add user. Email may already be in use.");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.userId).unwrap();
            setShowDeleteModal(false);
            setSelectedUser(null);
            showFeedback("success", "User deactivated successfully!");
            refetch();
        } catch {
            showFeedback("error", "Failed to delete user.");
        }
    };

    const roleLabel = (role: string) =>
        ({ TEACHER: 'Teacher', STUDENT: 'Student', PRINCIPAL: 'Principal', ACCOUNTANT: 'Accountant' }[role] ?? role);

    const roleBadge = (role: string) => {
        const styles: Record<string, string> = {
            TEACHER: 'bg-emerald-100 text-emerald-700',
            STUDENT: 'bg-blue-100 text-blue-700',
            PRINCIPAL: 'bg-purple-100 text-purple-700',
            ACCOUNTANT: 'bg-amber-100 text-amber-700',
        };
        return `px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[role] ?? 'bg-gray-100 text-gray-700'}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage all system users and permissions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center space-x-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-md hover:shadow-lg font-medium"
                >
                    <Plus size={20} />
                    <span>Add User</span>
                </button>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className={`flex items-center space-x-3 px-5 py-3 rounded-lg shadow-md border ${
                    feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                }`}>
                    {feedback.type === "success"
                        ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                        : <X size={20} className="text-red-500 shrink-0" />}
                    <p className="font-medium text-sm">{feedback.message}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
                    <p className="text-sm text-gray-600 font-medium">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpis?.totalTeachers ?? '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpis?.totalStudents ?? '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600 font-medium">Staff Members</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpis?.staffMembers ?? '—'}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-rose-500">
                    <p className="text-sm text-gray-600 font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpis?.totalUsers ?? '—'}</p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8 px-6">
                        {(["Teachers", "Students", "Staff"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setSelectedTab(tab); setSearchQuery(""); }}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${selectedTab === tab
                                    ? "border-rose-600 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-100">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${selectedTab.toLowerCase()}...`}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                                {selectedTab === "Teachers" && (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                )}
                                {selectedTab === "Students" && (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classroom</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p>Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                                                    {user.employeeId && (
                                                        <p className="text-xs text-gray-400">ID: {user.employeeId}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={roleBadge(user.role)}>{roleLabel(user.role)}</span>
                                        </td>
                                        {selectedTab === "Teachers" && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.department ?? '—'}</td>
                                        )}
                                        {selectedTab === "Students" && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.classroom ?? '—'}</td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Users className="mx-auto text-gray-300 mb-2" size={48} />
                                        <p className="text-gray-500 font-medium">No {selectedTab.toLowerCase()} found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                                <p className="text-sm text-gray-500 mt-1">Create a new user account</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Role Selection */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={20} className="text-rose-600" />
                                    User Role
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {ROLES.map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setNewUser({ ...emptyForm, role: r })}
                                            className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                                                newUser.role === r
                                                    ? 'border-rose-600 bg-rose-50 text-rose-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-rose-300'
                                            }`}
                                        >
                                            {roleLabel(r)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-rose-600" />
                                    Basic Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                        <input type="text" value={newUser.fullName}
                                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                        <input type="password" value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Contact</label>
                                        <input type="tel" value={newUser.primaryContact}
                                            onChange={(e) => setNewUser({ ...newUser, primaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                        <input type="date" value={newUser.dob}
                                            onChange={(e) => setNewUser({ ...newUser, dob: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                        <select value={newUser.gender}
                                            onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address</label>
                                        <input type="text" value={newUser.residentialAddress}
                                            onChange={(e) => setNewUser({ ...newUser, residentialAddress: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Fields */}
                            {newUser.role === 'TEACHER' && (
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Teacher Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.employeeId}
                                                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                                            <input type="text" value={newUser.designation}
                                                onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                            <input type="text" value={newUser.department}
                                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Student Fields */}
                            {newUser.role === 'STUDENT' && (
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Student Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Number <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.admissionNumber}
                                                onChange={(e) => setNewUser({ ...newUser, admissionNumber: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Admission Year</label>
                                            <input type="number" value={newUser.admissionYear}
                                                onChange={(e) => setNewUser({ ...newUser, admissionYear: Number(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Roll Number</label>
                                            <input type="text" value={newUser.rollNumber}
                                                onChange={(e) => setNewUser({ ...newUser, rollNumber: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Classroom ID <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.classroomId}
                                                onChange={(e) => setNewUser({ ...newUser, classroomId: e.target.value })}
                                                placeholder="Paste classroom ID here"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Name</label>
                                            <input type="text" value={newUser.parentName}
                                                onChange={(e) => setNewUser({ ...newUser, parentName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Contact</label>
                                            <input type="tel" value={newUser.parentContact}
                                                onChange={(e) => setNewUser({ ...newUser, parentContact: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Principal / Accountant Fields */}
                            {(newUser.role === 'PRINCIPAL' || newUser.role === 'ACCOUNTANT') && (
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{roleLabel(newUser.role)} Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                                            <input type="text" value={newUser.designation}
                                                onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                            <input type="text" value={newUser.department}
                                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button onClick={() => setShowAddModal(false)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={isAdding || !newUser.fullName || !newUser.email || !newUser.password}
                                className="flex items-center space-x-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                <UserPlus size={18} />
                                {isAdding ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    Are you sure you want to deactivate <strong>{selectedUser.fullName}</strong> ({roleLabel(selectedUser.role)})? This user will no longer be able to log in.
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={isDeleting}
                                    className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                                >
                                    <Trash2 size={16} />
                                    {isDeleting ? "Deleting..." : "Deactivate User"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
