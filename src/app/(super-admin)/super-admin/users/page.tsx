"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Trash2, UserPlus, X, Eye, EyeOff, User, Briefcase, CheckCircle2, Edit2, Key, AlertCircle } from "lucide-react";
import toast from 'react-hot-toast';
import {
    useGetUserManagementKpisQuery,
    useGetAllUsersQuery,
    useAddUserMutation,
    useDeleteUserMutation,
    useUpdateUserMutation,
    useChangeUserPasswordMutation,
    UserSummary,
} from "@/redux/api/superAdminApi";

type Role = 'TEACHER' | 'PRINCIPAL' | 'ACCOUNTANT' | 'OTHER';

interface NewUserForm {
    role: 'TEACHER' | 'PRINCIPAL' | 'ACCOUNTANT' | 'OTHER';
    customRole: string;
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    dob: string;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    highestQualification: string;
    salary: string;
}

const emptyForm: NewUserForm = {
    role: 'TEACHER',
    customRole: '',
    email: '',
    password: '',
    fullName: '',
    employeeId: '',
    dob: '',
    gender: '',
    residentialAddress: '',
    primaryContact: '',
    highestQualification: '',
    salary: '',
};

const TAB_ROLE_MAP: Record<string, Role[]> = {
    Teachers: ['TEACHER'],
    Staff: ['PRINCIPAL', 'ACCOUNTANT', 'OTHER'],
};

export default function UserManagementPage() {
    const [selectedTab, setSelectedTab] = useState<"Teachers" | "Staff">("Teachers");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
    const [newUser, setNewUser] = useState<NewUserForm>(emptyForm);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [editForm, setEditForm] = useState({
        fullName: '',
        email: '',
        primaryContact: '',
        dob: '',
        gender: '',
        residentialAddress: '',
        employeeId: '',
        highestQualification: '',
        salary: '',
        customRole: '',
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [showPrincipalWarningModal, setShowPrincipalWarningModal] = useState(false);
    const [pendingPrincipalActivation, setPendingPrincipalActivation] = useState<{ userId: string; userName: string; action: 'activate' | 'add' } | null>(null);
    const ITEMS_PER_PAGE = 10;

    const { data: kpis } = useGetUserManagementKpisQuery();
    const { data: allUsers, isLoading, refetch } = useGetAllUsersQuery();
    const [addUser, { isLoading: isAdding }] = useAddUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangeUserPasswordMutation();

    const getTabUsers = (): UserSummary[] => {
        if (!allUsers) return [];
        const roles = TAB_ROLE_MAP[selectedTab];
        return [
            ...allUsers.teachers.filter((u) => roles.includes(u.role as Role)),
            ...allUsers.staff.filter((u) => roles.includes(u.role as Role)),
            ...allUsers.principals.filter((u) => roles.includes(u.role as Role)),
        ];
    };

    const allTabUsers = getTabUsers();
    const filteredUsers = allTabUsers.filter(
        (u) =>
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleAddUser = async () => {
        // Validate age for all non-student roles (must be at least 20 years old)
        if (!newUser.dob) {
            toast.error("Date of Birth is required for all users. Please enter the DOB.");
            return;
        }

        const birthDate = new Date(newUser.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (age < 20) {
            toast.error(`Age must be at least 20 years. Current age: ${age} years.`);
            return;
        }

        // Check if adding a PRINCIPAL and there's already an active principal
        if (newUser.role === 'PRINCIPAL') {
            const activePrincipal = allUsers?.principals.find(p => p.isActive);
            if (activePrincipal) {
                // Show warning modal that creating this principal will deactivate the current one
                setPendingPrincipalActivation({ userId: '', userName: newUser.fullName, action: 'add' });
                setShowPrincipalWarningModal(true);
                return;
            }
        }

        try {
            await addUser(newUser as any).unwrap();
            setShowAddModal(false);
            setNewUser(emptyForm);
            toast.success("User added successfully!");
            refetch();
        } catch (err: unknown) {
            const error = err as { data?: { message?: string }; message?: string };
            toast.error(error?.data?.message ?? "Failed to add user. Email may already be in use.");
        }
    };

    const confirmPrincipalAdd = async () => {
        try {
            await addUser(newUser as any).unwrap();
            setShowAddModal(false);
            setShowPrincipalWarningModal(false);
            setNewUser(emptyForm);
            toast.success("Principal added successfully! The previous principal has been deactivated.");
            refetch();
        } catch (err: unknown) {
            const error = err as { data?: { message?: string }; message?: string };
            toast.error(error?.data?.message ?? "Failed to add principal. Email may already be in use.");
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser(selectedUser.userId).unwrap();
            setShowDeleteModal(false);
            setSelectedUser(null);
            toast.success("User deactivated successfully!");
            refetch();
        } catch {
            toast.error("Failed to delete user.");
        }
    };

    const openEditModal = (user: UserSummary) => {
        setSelectedUser(user);
        // Format dob for input field (YYYY-MM-DD format)
        const formattedDob = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
        setEditForm({
            fullName: user.fullName,
            email: user.email,
            primaryContact: user.primaryContact ?? '',
            dob: formattedDob,
            gender: user.gender ?? '',
            residentialAddress: user.residentialAddress ?? '',
            employeeId: user.employeeId ?? '',
            highestQualification: user.highestQualification ?? '',
            salary: user.salary ?? '',
            customRole: user.customRole ?? '',
        });
        setShowEditModal(true);
    };

    const openPasswordModal = (user: UserSummary) => {
        setSelectedUser(user);
        setPasswordForm({ currentPassword: '', newPassword: '' });
        setShowPasswordModal(true);
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            const updateData: any = {
                fullName: editForm.fullName,
                email: editForm.email,
                primaryContact: editForm.primaryContact,
            };

            // Add role-specific fields
            if (selectedUser.role === 'TEACHER') {
                updateData.employeeId = editForm.employeeId;
                updateData.highestQualification = editForm.highestQualification;
                updateData.salary = editForm.salary;
                updateData.dob = editForm.dob;
                updateData.gender = editForm.gender;
                updateData.residentialAddress = editForm.residentialAddress;
            } else if (selectedUser.role === 'OTHER') {
                updateData.customRole = editForm.customRole;
                updateData.dob = editForm.dob;
                updateData.gender = editForm.gender;
                updateData.residentialAddress = editForm.residentialAddress;
            } else {
                updateData.dob = editForm.dob;
                updateData.gender = editForm.gender;
                updateData.residentialAddress = editForm.residentialAddress;
            }

            await updateUser({ userId: selectedUser.userId, data: updateData }).unwrap();
            setShowEditModal(false);
            setSelectedUser(null);
            toast.success("User updated successfully!");
            refetch();
        } catch {
            toast.error("Failed to update user.");
        }
    };

    const handleChangePassword = async () => {
        if (!selectedUser) return;
        if (!passwordForm.currentPassword || !passwordForm.newPassword) return;
        try {
            await changePassword({
                userId: selectedUser.userId,
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }).unwrap();
            setShowPasswordModal(false);
            setSelectedUser(null);
            setPasswordForm({ currentPassword: '', newPassword: '' });
            toast.success("Password changed successfully!");
            refetch();
        } catch (err: any) {
            toast.error(err?.data?.message ?? "Failed to change password.");
        }
    };

    const handleToggleUserStatus = (user: UserSummary) => {
        if (user.role === 'PRINCIPAL' && !user.isActive) {
            // Check if there's an active principal
            const hasActivePrincipal = allUsers?.principals.some(p => p.isActive && p.userId !== user.userId);
            if (hasActivePrincipal) {
                setPendingPrincipalActivation({ userId: user.userId, userName: user.fullName, action: 'activate' });
                setShowPrincipalWarningModal(true);
                return;
            }
        }
        // For non-principal users or activating principal with no active principal, proceed directly
        confirmToggleStatus(user.userId, true);
    };

    const confirmToggleStatus = async (userId: string, activate: boolean) => {
        try {
            await updateUser({ userId, data: { isActive: activate } }).unwrap();
            setShowPrincipalWarningModal(false);
            setPendingPrincipalActivation(null);
            toast.success(activate ? "User activated successfully!" : "User deactivated successfully!");
            refetch();
        } catch {
            toast.error("Failed to update user status.");
        }
    };

    const roleLabel = (role: string) =>
        ({ TEACHER: 'Teacher', PRINCIPAL: 'Principal', ACCOUNTANT: 'Accountant', OTHER: 'Other' }[role] ?? role);

    const roleBadge = (role: string) => {
        const styles: Record<string, string> = {
            TEACHER: 'bg-emerald-100 text-emerald-700',
            PRINCIPAL: 'bg-purple-100 text-purple-700',
            ACCOUNTANT: 'bg-amber-100 text-amber-700',
            OTHER: 'bg-gray-100 text-gray-700',
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
                    <p className="text-sm text-gray-600 font-medium">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{kpis?.totalTeachers ?? '—'}</p>
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
                        {(["Teachers", "Staff"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setSelectedTab(tab); setSearchQuery(""); setCurrentPage(1); }}
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
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Password</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p>Loading users...</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                                                {user.password || '-'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                    title="Change Password"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (user.isActive) {
                                                            // Deactivate
                                                            updateUser({ userId: user.userId, data: { isActive: false } }).unwrap()
                                                                .then(() => { toast.success("User deactivated."); refetch(); })
                                                                .catch(() => toast.error("Failed to deactivate user."));
                                                        } else {
                                                            // Try to activate - may show warning for principal
                                                            handleToggleUserStatus(user);
                                                        }
                                                    }}
                                                    className={`p-1.5 rounded transition-colors ${
                                                        user.isActive
                                                            ? 'text-gray-500 hover:bg-gray-100 title="Deactivate"'
                                                            : 'text-green-600 hover:bg-green-50 title="Activate"'
                                                    }`}
                                                    title={user.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {user.isActive ? (
                                                        <span className="text-xs font-medium">Off</span>
                                                    ) : (
                                                        <span className="text-xs font-medium">On</span>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Users className="mx-auto text-gray-300 mb-2" size={48} />
                                        <p className="text-gray-500 font-medium">No {selectedTab.toLowerCase()} found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && filteredUsers.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                            {" – "}
                            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span>
                            {" of "}
                            <span className="font-medium">{filteredUsers.length}</span>
                        </p>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                                        currentPage === page
                                            ? 'bg-rose-600 text-white'
                                            : 'border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                                <p className="text-sm text-gray-500 mt-1">Create a new user account</p>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setNewUser(emptyForm); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Common Fields — Name, Email, Password, User Type */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-rose-600" />
                                    Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                        <input type="text" value={newUser.fullName}
                                            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input type={showPassword ? "text" : "password"} value={newUser.password}
                                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">User Type <span className="text-red-500">*</span></label>
                                        <select value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as NewUserForm['role'], customRole: '' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            <option value="TEACHER">Teacher</option>
                                            <option value="PRINCIPAL">Principal</option>
                                            <option value="ACCOUNTANT">Accountant</option>
                                            <option value="OTHER">Other (Non-portal staff)</option>
                                        </select>
                                    </div>
                                    {newUser.role === 'OTHER' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Role <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.customRole}
                                                onChange={(e) => setNewUser({ ...newUser, customRole: e.target.value })}
                                                placeholder="e.g., Gardener, Sweeper, Receptionist"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={20} className="text-rose-600" />
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Contact</label>
                                        <input type="tel" value={newUser.primaryContact}
                                            onChange={(e) => setNewUser({ ...newUser, primaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                        <input type="date" value={newUser.dob}
                                            onChange={(e) => setNewUser({ ...newUser, dob: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                        <select value={newUser.gender}
                                            onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
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
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Fields */}
                            {newUser.role === 'TEACHER' && (
                                <div className="border-b border-gray-200 pb-5">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Briefcase size={18} className="text-emerald-600" />
                                        Teacher Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.employeeId}
                                                onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Highest Educational Qualification <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.highestQualification}
                                                onChange={(e) => setNewUser({ ...newUser, highestQualification: e.target.value })}
                                                placeholder="e.g., M.Sc., B.Ed., Ph.D."
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Salary (₹) <span className="text-red-500">*</span></label>
                                            <input type="number" value={newUser.salary}
                                                onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                                                placeholder="e.g., 50000"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(newUser.role === 'PRINCIPAL' || newUser.role === 'ACCOUNTANT') && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Briefcase size={18} className="text-purple-600" />
                                        {roleLabel(newUser.role)} Details
                                    </h3>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button onClick={() => { setShowAddModal(false); setNewUser(emptyForm); setShowPassword(false); }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={isAdding || !newUser.fullName || !newUser.email || !newUser.password || (newUser.role === 'OTHER' && !newUser.customRole) || (newUser.role === 'TEACHER' && (!newUser.employeeId || !newUser.highestQualification || !newUser.salary))}
                                className="flex items-center space-x-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                <UserPlus size={18} />
                                {isAdding ? "Adding..." : "Add User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Edit2 size={20} className="text-blue-600" />
                                    Edit User
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{roleLabel(selectedUser.role)} — {selectedUser.fullName}</p>
                            </div>
                            <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Common Fields */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={18} className="text-rose-600" />
                                    Account Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                        <input type="text" value={editForm.fullName}
                                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" value={editForm.email}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Contact</label>
                                        <input type="tel" value={editForm.primaryContact}
                                            onChange={(e) => setEditForm({ ...editForm, primaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Personal Details */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={18} className="text-rose-600" />
                                    Personal Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                        <input type="date" value={editForm.dob}
                                            onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                        <select value={editForm.gender}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address</label>
                                        <input type="text" value={editForm.residentialAddress}
                                            onChange={(e) => setEditForm({ ...editForm, residentialAddress: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Teacher Fields */}
                            {selectedUser.role === 'TEACHER' && (
                                <div className="border-b border-gray-200 pb-5">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Briefcase size={18} className="text-emerald-600" />
                                        Teacher Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                            <input type="text" value={editForm.employeeId}
                                                onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Highest Educational Qualification</label>
                                            <input type="text" value={editForm.highestQualification}
                                                onChange={(e) => setEditForm({ ...editForm, highestQualification: e.target.value })}
                                                placeholder="e.g., M.Sc., B.Ed., Ph.D."
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Salary (₹)</label>
                                            <input type="number" value={editForm.salary}
                                                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                                                placeholder="e.g., 50000"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other Role Fields */}
                            {selectedUser.role === 'OTHER' && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Briefcase size={18} className="text-gray-600" />
                                        Other Staff Details
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Role</label>
                                        <input type="text" value={editForm.customRole}
                                            onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })}
                                            placeholder="e.g., Gardener, Sweeper, Receptionist"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                disabled={isUpdating || !editForm.fullName || !editForm.email}
                                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                <Edit2 size={16} />
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Key size={20} className="text-amber-600" />
                                    Change Password
                                </h2>
                                <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                Changing password for <strong>{selectedUser.fullName}</strong>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type={showCurrentPassword ? "text" : "password"} value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input type={showNewPassword ? "text" : "password"} value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                                    className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                                >
                                    <Key size={16} />
                                    {isChangingPassword ? "Changing..." : "Change Password"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Principal Activation Warning Modal */}
            {showPrincipalWarningModal && pendingPrincipalActivation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-amber-700 flex items-center gap-2">
                                    <AlertCircle size={22} className="text-amber-500" />
                                    Principal Activation Warning
                                </h2>
                                <button onClick={() => { setShowPrincipalWarningModal(false); setPendingPrincipalActivation(null); }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X size={20} className="text-gray-600" />
                                </button>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                {pendingPrincipalActivation.action === 'add' ? (
                                    <>
                                        <p className="text-sm text-amber-900">
                                            Creating <strong>{pendingPrincipalActivation.userName}</strong> as Principal will automatically deactivate the existing active principal account. The previous principal will no longer be able to log in.
                                        </p>
                                        <p className="text-xs text-amber-700 mt-2 font-medium">
                                            Only one principal can be active at a time. Do you want to proceed?
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-amber-900">
                                            Activating <strong>{pendingPrincipalActivation.userName}</strong> as Principal will automatically deactivate the existing active principal account. The previous principal will no longer be able to log in.
                                        </p>
                                        <p className="text-xs text-amber-700 mt-2 font-medium">
                                            Only one principal can be active at a time. Do you want to proceed?
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => { setShowPrincipalWarningModal(false); setPendingPrincipalActivation(null); }}
                                    className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                    Cancel
                                </button>
                                {pendingPrincipalActivation.action === 'add' ? (
                                    <button
                                        onClick={confirmPrincipalAdd}
                                        disabled={isAdding}
                                        className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                                    >
                                        <CheckCircle2 size={16} />
                                        {isAdding ? "Creating..." : "Yes, Create & Deactivate Current"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => confirmToggleStatus(pendingPrincipalActivation.userId, true)}
                                        disabled={isUpdating}
                                        className="flex items-center space-x-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                                    >
                                        <CheckCircle2 size={16} />
                                        {isUpdating ? "Activating..." : "Yes, Activate"}
                                    </button>
                                )}
                            </div>
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