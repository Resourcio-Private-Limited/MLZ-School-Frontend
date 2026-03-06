"use client";

import { useState } from "react";
import { Users, Search, Plus, Edit, Trash2, Key, UserPlus, X, Save, Eye, EyeOff, User, Briefcase, Lock } from "lucide-react";

interface User {
    id: number;
    name: string;
    email: string;
    role: "Teacher" | "Student" | "Principal" | "Accountant";
    status: "Active" | "Inactive";
    subject?: string;
    phone?: string;
    joinDate: string;
    designation?: string;
    qualification?: string[];
}

export default function UserManagementPage() {
    const [selectedTab, setSelectedTab] = useState<"Teachers" | "Students" | "Staff">("Teachers");
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    // Mock data
    const [users, setUsers] = useState<User[]>([
        { id: 1, name: "Ms. Priya Sharma", email: "priya.sharma@mlzs.edu", role: "Teacher", status: "Active", subject: "English", phone: "+91 98765 43210", joinDate: "2020-06-15" },
        { id: 2, name: "Ms. Anjali Verma", email: "anjali.verma@mlzs.edu", role: "Teacher", status: "Active", subject: "Mathematics", phone: "+91 98765 43211", joinDate: "2019-08-20" },
        { id: 3, name: "Mr. Rajesh Kumar", email: "rajesh.kumar@mlzs.edu", role: "Teacher", status: "Active", subject: "Science", phone: "+91 98765 43212", joinDate: "2021-01-10" },
        { id: 4, name: "Principal User", email: "principal@mlzs.edu", role: "Principal", status: "Active", phone: "+91 98765 43213", joinDate: "2018-04-01" },
        { id: 5, name: "Accountant User", email: "accountant@mlzs.edu", role: "Accountant", status: "Active", phone: "+91 98765 43214", joinDate: "2019-11-15" },
    ]);

    const [newUser, setNewUser] = useState({
        // Personal Details
        name: "",
        email: "",
        phone: "",
        dob: "",
        gender: "Male" as "Male" | "Female" | "Other",
        bloodGroup: "",
        address: "",

        // Official Details
        role: "Teacher" as "Teacher" | "Student" | "Principal" | "Accountant",
        employeeId: "",
        designation: "",
        department: "",
        subject: "",
        joiningDate: "",
        currentSalary: "",
        officialDocumentNumber: "",
        classTeacherOf: "",
        qualification: "",
        password: ""
    });

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (selectedTab === "Teachers") return matchesSearch && user.role === "Teacher";
        if (selectedTab === "Students") return matchesSearch && user.role === "Student";
        if (selectedTab === "Staff") return matchesSearch && (user.role === "Principal" || user.role === "Accountant");
        return matchesSearch;
    });

    const handleAddUser = () => {
        const user: User = {
            id: users.length + 1,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: "Active",
            subject: newUser.subject || undefined,
            phone: newUser.phone || undefined,
            joinDate: newUser.joiningDate || new Date().toISOString().split('T')[0],
            designation: newUser.designation || undefined,
            qualification: newUser.qualification ? newUser.qualification.split(',').map(q => q.trim()) : undefined
        };
        setUsers([...users, user]);
        setShowAddModal(false);
        // Reset form
        setNewUser({
            name: "",
            email: "",
            phone: "",
            dob: "",
            gender: "Male",
            bloodGroup: "",
            address: "",
            role: "Teacher",
            employeeId: "",
            designation: "",
            department: "",
            subject: "",
            joiningDate: "",
            currentSalary: "",
            officialDocumentNumber: "",
            classTeacherOf: "",
            qualification: "",
            password: ""
        });
    };

    const handleDeleteUser = (userId: number) => {
        if (confirm("Are you sure you want to delete this user?")) {
            setUsers(users.filter(u => u.id !== userId));
        }
    };

    const handlePasswordReset = () => {
        // Mock password reset
        alert(`Password reset successful for ${selectedUser?.name}!\nNew password: ${newPassword}`);
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword("");
        setShowPassword(false);
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
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
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.filter(u => u.role === "Teacher").length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600 font-medium">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.filter(u => u.role === "Student").length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <p className="text-sm text-gray-600 font-medium">Staff Members</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.filter(u => u.role === "Principal" || u.role === "Accountant").length}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-rose-500">
                    <p className="text-sm text-gray-600 font-medium">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{users.length}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-rose-600">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8 px-6">
                        {(["Teachers", "Students", "Staff"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${selectedTab === tab
                                    ? "border-rose-600 text-rose-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
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

                {/* User Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                {selectedTab === "Teachers" && (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{user.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.role === "Teacher" ? "bg-emerald-100 text-emerald-700" :
                                                user.role === "Student" ? "bg-blue-100 text-blue-700" :
                                                    user.role === "Principal" ? "bg-purple-100 text-purple-700" :
                                                        "bg-amber-100 text-amber-700"
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        {selectedTab === "Teachers" && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.subject || "-"}</td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setShowPasswordModal(true);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={selectedTab === "Teachers" ? 6 : 5} className="px-6 py-12 text-center">
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
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Details Section */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User size={20} className="text-rose-600" />
                                    Personal Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            placeholder="Enter full name"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            placeholder="user@mlzs.edu"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={newUser.dob}
                                            onChange={(e) => setNewUser({ ...newUser, dob: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <select
                                            value={newUser.gender}
                                            onChange={(e) => setNewUser({ ...newUser, gender: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Blood Group
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.bloodGroup}
                                            onChange={(e) => setNewUser({ ...newUser, bloodGroup: e.target.value })}
                                            placeholder="e.g., O+, A+, B+"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Residential Address
                                        </label>
                                        <textarea
                                            value={newUser.address}
                                            onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                                            placeholder="Enter complete address"
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Official Details Section */}
                            <div className="border-b border-gray-200 pb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={20} className="text-rose-600" />
                                    Official Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Role <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        >
                                            <option value="Teacher">Teacher</option>
                                            <option value="Principal">Principal</option>
                                            <option value="Accountant">Accountant</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Employee ID
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.employeeId}
                                            onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
                                            placeholder="e.g., TCH-2024-001"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                        />
                                    </div>

                                    {newUser.role === "Teacher" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.designation}
                                                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                                    placeholder="e.g., Senior Teacher, HOD"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Department
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.department}
                                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                    placeholder="e.g., Science & Mathematics"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Subject Specialization
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.subject}
                                                    onChange={(e) => setNewUser({ ...newUser, subject: e.target.value })}
                                                    placeholder="e.g., Mathematics, Physics"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Class Teacher Of
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.classTeacherOf}
                                                    onChange={(e) => setNewUser({ ...newUser, classTeacherOf: e.target.value })}
                                                    placeholder="e.g., 10-A (optional)"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Joining Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={newUser.joiningDate}
                                                    onChange={(e) => setNewUser({ ...newUser, joiningDate: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Current Salary (₹)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.currentSalary}
                                                    onChange={(e) => setNewUser({ ...newUser, currentSalary: e.target.value })}
                                                    placeholder="e.g., 55,000"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Qualifications
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.qualification}
                                                    onChange={(e) => setNewUser({ ...newUser, qualification: e.target.value })}
                                                    placeholder="B.Ed, M.Sc Physics, PhD (comma separated)"
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Separate multiple qualifications with commas</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Official Document Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newUser.officialDocumentNumber}
                                                    onChange={(e) => setNewUser({ ...newUser, officialDocumentNumber: e.target.value })}
                                                    placeholder="e.g., PAN: ABCDE1234F, Aadhaar, etc."
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Security Section */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Lock size={20} className="text-rose-600" />
                                    Security
                                </h3>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Initial Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Enter initial password"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none text-gray-800"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">User will be required to change this on first login</p>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={!newUser.name || !newUser.email || !newUser.password || (newUser.role === "Teacher" && !newUser.joiningDate)}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${newUser.name && newUser.email && newUser.password && (newUser.role !== "Teacher" || newUser.joiningDate)
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <UserPlus size={18} />
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
                                <p className="text-sm text-gray-500 mt-1">For {selectedUser.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setSelectedUser(null);
                                    setNewPassword("");
                                    setShowPassword(false);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>Warning:</strong> This action will reset the user's password. They will need to use the new password to log in.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="w-full px-4 py-2 pr-20 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={generatePassword}
                                className="w-full px-4 py-2 border-2 border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-medium text-sm"
                            >
                                Generate Secure Password
                            </button>
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3 rounded-b-xl">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setSelectedUser(null);
                                    setNewPassword("");
                                    setShowPassword(false);
                                }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordReset}
                                disabled={!newPassword}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${newPassword
                                    ? "bg-rose-600 text-white hover:bg-rose-700"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                <Key size={18} />
                                <span>Reset Password</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
