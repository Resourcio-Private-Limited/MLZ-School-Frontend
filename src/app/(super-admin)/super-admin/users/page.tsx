"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Plus, Trash2, UserPlus, X, Eye, EyeOff, User, Briefcase, CheckCircle2, Edit2, Key, AlertCircle } from "lucide-react";
import toast from 'react-hot-toast';
import {
    useGetAllUsersQuery,
    useAddUserMutation,
    useDeleteUserMutation,
    useUpdateUserMutation,
    useChangeUserPasswordMutation,
    UserSummary,
} from "@/redux/api/superAdminApi";
import { Tooltip } from "@/components/ui/tooltip";
import { apiErrorMessage } from "@/lib/apiError";

type Role = 'TEACHER' | 'PRINCIPAL' | 'ACCOUNTANT' | 'STAFF';

interface NewUserForm {
    role: 'TEACHER' | 'PRINCIPAL' | 'ACCOUNTANT' | 'STAFF';
    customRole: string;
    email: string;
    password: string;
    fullName: string;
    employeeId: string;
    // Personal
    dob: string;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    secondaryContact: string;
    nationality: string;
    caste: string;
    isPwd: boolean;
    aadharNo: string;
    identificationMark: string;
    // Teacher specific
    highestQualification: string;
    designation: string;
    department: string;
    joiningDate: string;
    salary: string;
    status: string;
    officialDocType: string;
    officialDocNumber: string;
    // Staff/Accountant
    employmentType: string;
}

const DOC_TYPES = ['Aadhar', 'PAN', 'Driving License'];
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Temporary', 'Part-time'];
const STATUSES = ['Active', 'Inactive', 'Left Service'];

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
    secondaryContact: '',
    nationality: 'Indian',
    caste: '',
    isPwd: false,
    aadharNo: '',
    identificationMark: '',
    highestQualification: '',
    designation: '',
    department: '',
    joiningDate: '',
    salary: '',
    status: 'Active',
    officialDocType: 'Aadhar',
    officialDocNumber: '',
    employmentType: 'Permanent',
};

const TAB_ROLE_MAP: Record<string, Role[]> = {
    Teachers: ['TEACHER'],
    Staff: ['PRINCIPAL', 'ACCOUNTANT', 'STAFF'],
};

// Page numbers to render: first, last, and a window around the current page,
// with 'gap' markers where pages are skipped. Keeps the width constant (max 7 slots).
function getPageItems(current: number, total: number): (number | 'gap')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'gap', total];
    if (current >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'gap', current - 1, current, current + 1, 'gap', total];
}

export default function UserManagementPage() {
    // Dashboard links open a specific tab via ?tab=students|teachers|staff.
    // Safe to read window here: the super-admin layout only renders children client-side, after its auth check.
    const [selectedTab, setSelectedTab] = useState<"Teachers" | "Staff" | "Students">(() => {
        const tab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
        return (["Teachers", "Staff", "Students"] as const).find((t) => t.toLowerCase() === tab?.toLowerCase()) ?? "Teachers";
    });
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
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const reduceMotion = useReducedMotion();
    const [editForm, setEditForm] = useState({
        fullName: '',
        email: '',
        primaryContact: '',
        secondaryContact: '',
        dob: '',
        gender: '',
        residentialAddress: '',
        nationality: '',
        caste: '',
        isPwd: false,
        aadharNo: '',
        identificationMark: '',
        employeeId: '',
        highestQualification: '',
        designation: '',
        department: '',
        joiningDate: '',
        salary: '',
        status: 'Active',
        officialDocType: 'Aadhar',
        officialDocNumber: '',
        employmentType: 'Permanent',
        customRole: '',
    });
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
    const [showPrincipalWarningModal, setShowPrincipalWarningModal] = useState(false);
    const [pendingPrincipalActivation, setPendingPrincipalActivation] = useState<{ userId: string; userName: string; action: 'activate' | 'add' } | null>(null);
    const ITEMS_PER_PAGE = 10;

    const { data: allUsers, isLoading, refetch } = useGetAllUsersQuery();
    const [addUser, { isLoading: isAdding }] = useAddUserMutation();
    const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [changePassword, { isLoading: isChangingPassword }] = useChangeUserPasswordMutation();

    const getTabUsers = (): UserSummary[] => {
        if (!allUsers) return [];
        if (selectedTab === 'Students') {
            return allUsers.students;
        }
        const roles = TAB_ROLE_MAP[selectedTab];
        return [
            ...allUsers.teachers.filter((u) => roles.includes(u.role as Role)),
            ...allUsers.staff.filter((u) => roles.includes(u.role as Role)),
            ...allUsers.principals.filter((u) => roles.includes(u.role as Role)),
        ];
    };

    const allTabUsers = getTabUsers();
    const q = searchQuery.trim().toLowerCase();
    const filteredUsers = q
        ? allTabUsers.filter((u) =>
            [u.fullName, u.email, u.employeeId, u.admissionNumber].some((v) => v?.toLowerCase().includes(q)))
        : allTabUsers;

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
        } catch (err) {
            toast.error(apiErrorMessage(err, "User not added. The email may already be in use."));
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
        } catch (err) {
            toast.error(apiErrorMessage(err, "Principal not added. The email may already be in use."));
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
        } catch (err) {
            toast.error(apiErrorMessage(err, "User not deactivated. Check your connection and try again."));
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
            secondaryContact: user.secondaryContact ?? '',
            dob: formattedDob,
            gender: user.gender ?? '',
            residentialAddress: user.residentialAddress ?? '',
            nationality: user.nationality ?? 'Indian',
            caste: user.caste ?? '',
            isPwd: user.isPwd ?? false,
            aadharNo: user.aadharNo ?? '',
            identificationMark: user.identificationMark ?? '',
            employeeId: user.employeeId ?? '',
            highestQualification: user.highestQualification ?? '',
            designation: user.designation ?? '',
            department: user.department ?? '',
            joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : '',
            salary: user.salary ?? '',
            status: user.status ?? 'Active',
            officialDocType: user.officialDocType ?? 'Aadhar',
            officialDocNumber: user.officialDocNumber ?? '',
            employmentType: user.employmentType ?? 'Permanent',
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
                secondaryContact: editForm.secondaryContact,
                dob: editForm.dob,
                gender: editForm.gender,
                residentialAddress: editForm.residentialAddress,
                nationality: editForm.nationality,
                caste: editForm.caste,
                isPwd: editForm.isPwd,
                aadharNo: editForm.aadharNo,
                identificationMark: editForm.identificationMark,
                employeeId: editForm.employeeId,
                highestQualification: editForm.highestQualification,
                designation: editForm.designation,
                department: editForm.department,
                joiningDate: editForm.joiningDate,
                salary: editForm.salary,
                status: editForm.status,
                officialDocType: editForm.officialDocType,
                officialDocNumber: editForm.officialDocNumber,
                employmentType: editForm.employmentType,
                customRole: editForm.customRole,
            };

            await updateUser({ userId: selectedUser.userId, data: updateData }).unwrap();
            setShowEditModal(false);
            setSelectedUser(null);
            toast.success("User updated successfully!");
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Changes not saved. Check your connection and try again."));
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
        } catch (err) {
            toast.error(apiErrorMessage(err, "Password not changed. Check the current password and try again."));
        }
    };

    const handleToggleUserStatus = (user: UserSummary) => {
        if (user.role === 'PRINCIPAL' && !user.isActive) {
            const hasActivePrincipal = allUsers?.principals.some(p => p.isActive && p.userId !== user.userId);
            if (hasActivePrincipal) {
                setPendingPrincipalActivation({ userId: user.userId, userName: user.fullName, action: 'activate' });
                setShowPrincipalWarningModal(true);
                return;
            }
        }
        confirmToggleStatus(user.userId, true);
    };

    const confirmToggleStatus = async (userId: string, activate: boolean) => {
        setTogglingId(userId);
        try {
            await updateUser({ userId, data: { isActive: activate } }).unwrap();
            setShowPrincipalWarningModal(false);
            setPendingPrincipalActivation(null);
            toast.success(activate ? "User activated successfully!" : "User deactivated successfully!");
            refetch();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Status not changed. Check your connection and try again."));
        } finally {
            setTogglingId(null);
        }
    };

    const roleLabel = (role: string) =>
        ({ TEACHER: 'Teacher', PRINCIPAL: 'Principal', ACCOUNTANT: 'Accountant', STAFF: 'Staff', STUDENT: 'Student' }[role] ?? role);

    const TABS = ["Teachers", "Staff", "Students"] as const;
    const countFor = (tab: (typeof TABS)[number]) => {
        if (!allUsers) return null;
        if (tab === 'Students') return allUsers.students.length;
        const roles = TAB_ROLE_MAP[tab];
        return [...allUsers.teachers, ...allUsers.staff, ...allUsers.principals].filter((u) => roles.includes(u.role as Role)).length;
    };
    const totalAccounts = TABS.reduce((sum, t) => sum + (countFor(t) ?? 0), 0);

    const switchTab = (tab: (typeof TABS)[number]) => {
        setSelectedTab(tab);
        setSearchQuery("");
        setCurrentPage(1);
        // Keep the tab in the URL so a reload (or a shared link) opens the same list.
        window.history.replaceState(null, "", `?tab=${tab.toLowerCase()}`);
    };

    const toggleReveal = (id: string) =>
        setRevealedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });

    const handleStatusSwitch = async (user: UserSummary) => {
        if (!user.isActive) {
            handleToggleUserStatus(user);
            return;
        }
        setTogglingId(user.userId);
        try {
            await updateUser({ userId: user.userId, data: { isActive: false } }).unwrap();
            refetch();
            toast(
                (t) => (
                    <span className="flex items-center gap-4 text-sm text-gray-800">
                        {user.fullName} deactivated.
                        <button
                            type="button"
                            onClick={() => { toast.dismiss(t.id); handleToggleUserStatus({ ...user, isActive: false }); }}
                            className="font-semibold text-rose-700 hover:text-rose-800 hover:underline underline-offset-4"
                        >
                            Undo
                        </button>
                    </span>
                ),
                { duration: 6000 }
            );
        } catch (err) {
            toast.error(apiErrorMessage(err, `Couldn't deactivate ${user.fullName}. Try again.`));
        } finally {
            setTogglingId(null);
        }
    };

    const isStudents = selectedTab === 'Students';
    const isStaff = selectedTab === 'Staff';
    const colCount = isStudents ? 6 : isStaff ? 6 : 5;
    const singular = { Teachers: 'teacher', Staff: 'staff member', Students: 'student' }[selectedTab];

    const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";
    const iconBtn = `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 active:scale-95 motion-safe:transition ${focusRing}`;
    const th = "px-6 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap";
    const pageBtn = `h-9 px-3 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.97] ${focusRing} focus-visible:ring-offset-1 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:active:scale-100 disabled:cursor-not-allowed motion-safe:transition`;

    const initials = (name: string) =>
        name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

    const passwordControl = (user: UserSummary) => {
        const revealed = revealedIds.has(user.id);
        return user.password ? (
            <div className="flex items-center gap-1">
                <span className={`min-w-[7.5rem] text-sm tabular-nums ${revealed ? "text-gray-900" : "text-gray-500 tracking-widest"}`}>
                    {revealed ? user.password : "••••••••"}
                </span>
                <Tooltip content={revealed ? "Hide password" : "Show password"} side="top">
                    <button
                        type="button"
                        onClick={() => toggleReveal(user.id)}
                        aria-label={`${revealed ? "Hide" : "Show"} password for ${user.fullName}`}
                        aria-pressed={revealed}
                        className={iconBtn}
                    >
                        {revealed ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                    </button>
                </Tooltip>
            </div>
        ) : (
            <span className="text-sm text-gray-500">—</span>
        )
    };

    const statusSwitch = (user: UserSummary) => (
        <button
            type="button"
            role="switch"
            aria-checked={user.isActive}
            aria-label={`Account active for ${user.fullName}`}
            disabled={togglingId === user.userId}
            onClick={() => handleStatusSwitch(user)}
            className={`group inline-flex items-center gap-2.5 rounded-full disabled:cursor-wait ${focusRing} focus-visible:ring-offset-2`}
        >
            <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full group-disabled:opacity-60 motion-safe:transition-colors motion-safe:duration-200 ${user.isActive ? "bg-emerald-600 group-hover:bg-emerald-700" : "bg-gray-300 group-hover:bg-gray-400"}`}>
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-200 ${user.isActive ? "translate-x-4" : "translate-x-0"}`} />
            </span>
            <span className={`text-sm ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>
                {togglingId === user.userId ? "Saving…" : user.isActive ? "Active" : "Inactive"}
            </span>
        </button>
    );

    const rowActions = (user: UserSummary) => (
        <div className="flex items-center justify-end gap-1">
            <Tooltip content="Edit details" side="top">
                <button type="button" onClick={() => openEditModal(user)} aria-label={`Edit ${user.fullName}`} className={iconBtn}>
                    <Edit2 size={15} aria-hidden="true" />
                </button>
            </Tooltip>
            <Tooltip content="Change password" side="top">
                <button type="button" onClick={() => openPasswordModal(user)} aria-label={`Change password for ${user.fullName}`} className={iconBtn}>
                    <Key size={15} aria-hidden="true" />
                </button>
            </Tooltip>
        </div>
    );

    const emptyState =
        searchQuery ? (
            <>
                <p className="text-sm font-medium text-gray-900">No {selectedTab.toLowerCase()} match “{searchQuery}”.</p>
                <p className="mt-1 text-sm text-gray-500">Check the spelling, or search by email or ID.</p>
                <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                    className={`mt-4 inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                >
                    Clear search
                </button>
            </>
        ) : isStudents ? (
            <>
                <p className="text-sm font-medium text-gray-900">No students yet.</p>
                <p className="mt-1 text-sm text-gray-500">Students appear here once their admission is approved.</p>
            </>
        ) : (
            <>
                <p className="text-sm font-medium text-gray-900">No {selectedTab.toLowerCase()} yet.</p>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className={`mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                >
                    <Plus size={16} aria-hidden="true" />
                    Add user
                </button>
            </>
        );

    return (
        <div className="max-w-7xl space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-500 tabular-nums">
                        {isLoading ? "Loading accounts…" : `${totalAccounts.toLocaleString("en-IN")} accounts across teachers, staff and students`}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 active:scale-[0.97] motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                >
                    <Plus size={18} aria-hidden="true" />
                    Add user
                </button>
            </header>

            <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Toolbar: tabs carry the counts; search sits beside them */}
                <div className="flex flex-col gap-3 border-b border-gray-200 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div role="tablist" aria-label="User type" className="-mb-px flex gap-6 overflow-x-auto">
                        {TABS.map((tab) => {
                            const active = selectedTab === tab;
                            const count = countFor(tab);
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => switchTab(tab)}
                                    className={`relative flex shrink-0 items-center gap-2 py-4 text-sm font-medium rounded-sm motion-safe:transition-colors ${focusRing} ${active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
                                >
                                    {tab}
                                    <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums motion-safe:transition-colors ${active ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-600"}`}>
                                        {count == null ? "…" : count.toLocaleString("en-IN")}
                                    </span>
                                    {active && (
                                        <motion.span
                                            layoutId="users-tab-underline"
                                            className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-rose-600"
                                            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pb-3 lg:w-80 lg:pb-0"><div className="relative">
                        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <label htmlFor="user-search" className="sr-only">Search {selectedTab.toLowerCase()}</label>
                        <input
                            id="user-search"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            onKeyDown={(e) => { if (e.key === "Escape") { setSearchQuery(""); setCurrentPage(1); } }}
                            placeholder={isStudents ? "Search by name, email or admission no." : "Search by name, email or employee ID"}
                            className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 motion-safe:transition [&::-webkit-search-cancel-button]:appearance-none"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                                aria-label="Clear search"
                                className={`absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 ${focusRing}`}
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                        )}
                    </div></div>
                </div>

                {/* Phones and tablets: one card per person instead of a cramped table */}
                <ul className="divide-y divide-gray-100 xl:hidden">
                    {isLoading ? (
                        Array.from({ length: 5 }, (_, i) => (
                            <li key={i} aria-hidden="true" className="flex items-center gap-3 px-4 py-4">
                                <span className="h-9 w-9 shrink-0 rounded-full bg-gray-100 motion-safe:animate-pulse" />
                                <span className="flex-1 space-y-1.5">
                                    <span className="block h-3.5 w-36 rounded bg-gray-100 motion-safe:animate-pulse" />
                                    <span className="block h-3 w-48 rounded bg-gray-100 motion-safe:animate-pulse" />
                                </span>
                            </li>
                        ))
                    ) : filteredUsers.length > 0 ? (
                        paginatedUsers.map((user) => (
                            <li key={user.id} className={`px-4 py-4 ${user.isActive ? "" : "bg-gray-50/60"}`}>
                                <div className="flex items-start gap-3">
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${user.isActive ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"}`}
                                    >
                                        {initials(user.fullName)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>{user.fullName}</p>
                                        <p className="truncate text-xs text-gray-500">{user.email}</p>
                                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600 tabular-nums">
                                            {isStaff && (
                                                <span>
                                                    {roleLabel(user.role)}
                                                    {user.role === 'STAFF' && user.customRole ? ` (${user.customRole})` : ""}
                                                </span>
                                            )}
                                            {isStudents && user.classroom && <span>{user.classroom}</span>}
                                            {(isStudents ? user.admissionNumber : user.employeeId) && <span className="text-gray-500">{isStudents ? user.admissionNumber : user.employeeId}</span>}
                                        </p>
                                    </div>
                                    <div className="-mr-1 shrink-0">{rowActions(user)}</div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-12">
                                    {statusSwitch(user)}
                                    {passwordControl(user)}
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-14 text-center">{emptyState}</li>
                    )}
                </ul>

                <div className="hidden overflow-x-auto xl:block">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th scope="col" className={th}>Name</th>
                                {isStaff && <th scope="col" className={th}>Role</th>}
                                <th scope="col" className={th}>{isStudents ? "Admission no." : "Employee ID"}</th>
                                {isStudents && <th scope="col" className={th}>Class</th>}
                                <th scope="col" className={th}>Password</th>
                                <th scope="col" className={th}>Status</th>
                                <th scope="col" className={th}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array.from({ length: 6 }, (_, i) => (
                                    <tr key={i} aria-hidden="true">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <span className="h-9 w-9 rounded-full bg-gray-100 motion-safe:animate-pulse" />
                                                <div className="space-y-1.5">
                                                    <span className="block h-3.5 w-36 rounded bg-gray-100 motion-safe:animate-pulse" />
                                                    <span className="block h-3 w-44 rounded bg-gray-100 motion-safe:animate-pulse" />
                                                </div>
                                            </div>
                                        </td>
                                        {Array.from({ length: colCount }, (_, j) => (
                                            <td key={j} className="px-6 py-3.5"><span className="block h-3.5 w-20 rounded bg-gray-100 motion-safe:animate-pulse" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                paginatedUsers.map((user) => {
                                    return (
                                        <tr key={user.id} className={`hover:bg-gray-50 motion-safe:transition-colors ${user.isActive ? "" : "bg-gray-50/60"}`}>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        aria-hidden="true"
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${user.isActive ? "bg-rose-50 text-rose-700" : "bg-gray-100 text-gray-500"}`}
                                                    >
                                                        {initials(user.fullName)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium ${user.isActive ? "text-gray-900" : "text-gray-500"}`}>{user.fullName}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {isStaff && (
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                                                    {roleLabel(user.role)}
                                                    {user.role === 'STAFF' && user.customRole && <span className="text-gray-500"> ({user.customRole})</span>}
                                                </td>
                                            )}
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600 tabular-nums">
                                                {(isStudents ? user.admissionNumber : user.employeeId) || <span className="text-gray-500">—</span>}
                                            </td>
                                            {isStudents && (
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{user.classroom || <span className="text-gray-500">—</span>}</td>
                                            )}
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                {passwordControl(user)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                {statusSwitch(user)}
                                            </td>
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                {rowActions(user)}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={colCount + 1} className="px-6 py-14 text-center">
                                        {emptyState}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && filteredUsers.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 border-t border-gray-200 sm:px-6">
                        <p className="text-sm text-gray-500 whitespace-nowrap tabular-nums">
                            Showing <span className="font-medium text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span>
                            {" of "}
                            <span className="font-medium text-gray-700">{filteredUsers.length.toLocaleString("en-IN")}</span>
                            {" "}{filteredUsers.length === 1 ? singular : selectedTab === 'Staff' ? 'staff' : selectedTab.toLowerCase()}
                        </p>
                        {totalPages > 1 && (
                            <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                                <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={pageBtn}>
                                    Prev
                                </button>
                                {getPageItems(currentPage, totalPages).map((page, idx) => page === 'gap' ? (
                                    <span key={`gap-${idx}`} aria-hidden="true" className="w-9 h-9 flex items-center justify-center text-sm text-gray-500 select-none">…</span>
                                ) : (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        aria-label={`Page ${page}`}
                                        aria-current={currentPage === page ? 'page' : undefined}
                                        className={`w-9 h-9 text-sm font-medium rounded-lg border tabular-nums active:scale-[0.95] motion-safe:transition ${focusRing} focus-visible:ring-offset-1 ${
                                            currentPage === page
                                                ? 'border-rose-600 bg-rose-600 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={pageBtn}>
                                    Next
                                </button>
                            </nav>
                        )}
                    </div>
                )}
            </section>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                                <p className="text-sm text-gray-500 mt-1">Create a new user account. Employee ID will be auto-generated.</p>
                            </div>
                            <button type="button" aria-label="Close" onClick={() => { setShowAddModal(false); setNewUser(emptyForm); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                                            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">User Type <span className="text-red-500">*</span></label>
                                        <select value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as NewUserForm['role'], customRole: '', designation: '', department: '' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            <option value="TEACHER">Teacher</option>
                                            <option value="PRINCIPAL">Principal</option>
                                            <option value="ACCOUNTANT">Accountant</option>
                                            <option value="STAFF">Other Staff (Non-portal)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                        <input type="text" value={newUser.employeeId} readOnly
                                            placeholder="Auto-generated (MLZS/BKP/...)"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
                                        <p className="text-xs text-gray-500 mt-1">Auto-generated based on role & joining year.</p>
                                    </div>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth <span className="text-red-500">*</span></label>
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Contact</label>
                                        <input type="tel" value={newUser.primaryContact}
                                            onChange={(e) => setNewUser({ ...newUser, primaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Secondary / Emergency Contact</label>
                                        <input type="tel" value={newUser.secondaryContact}
                                            onChange={(e) => setNewUser({ ...newUser, secondaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nationality</label>
                                        <input type="text" value={newUser.nationality}
                                            onChange={(e) => setNewUser({ ...newUser, nationality: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Caste</label>
                                        <input type="text" value={newUser.caste}
                                            onChange={(e) => setNewUser({ ...newUser, caste: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">PWD</label>
                                        <select value={newUser.isPwd ? 'yes' : 'no'}
                                            onChange={(e) => setNewUser({ ...newUser, isPwd: e.target.value === 'yes' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar No.</label>
                                        <input type="text" value={newUser.aadharNo}
                                            onChange={(e) => setNewUser({ ...newUser, aadharNo: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address</label>
                                        <textarea value={newUser.residentialAddress}
                                            onChange={(e) => setNewUser({ ...newUser, residentialAddress: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white"
                                            rows={2}></textarea>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Identification Mark (if any)</label>
                                        <input type="text" value={newUser.identificationMark}
                                            onChange={(e) => setNewUser({ ...newUser, identificationMark: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={18} className="text-rose-600" />
                                    {newUser.role === 'TEACHER' ? 'Teacher' : newUser.role === 'PRINCIPAL' ? 'Principal' : 'Staff / Accountant'} Professional Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {newUser.role === 'STAFF' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Designation / Role <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.customRole || newUser.designation}
                                                onChange={(e) => setNewUser({ ...newUser, customRole: e.target.value, designation: e.target.value })}
                                                placeholder="e.g. Receptionist, Gardener, Driver"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    )}
                                    {newUser.role !== 'STAFF' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Designation {newUser.role === 'TEACHER' ? <span className="text-red-500">*</span> : null}</label>
                                                <input type="text" value={newUser.designation}
                                                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                                    placeholder={newUser.role === 'TEACHER' ? "e.g. Subject Teacher, Class Teacher" : "e.g. Principal"}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Department / Subject(s)</label>
                                                <input type="text" value={newUser.department}
                                                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                    placeholder={newUser.role === 'TEACHER' ? "e.g. Mathematics, Science" : "e.g. Administration, Academics"}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                            </div>
                                        </>
                                    )}
                                    {newUser.role === 'STAFF' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department / Category</label>
                                            <input type="text" value={newUser.department}
                                                onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                                placeholder="e.g. Teaching, Administrative, Support"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Joining <span className="text-red-500">*</span></label>
                                        <input type="date" value={newUser.joiningDate}
                                            onChange={(e) => setNewUser({ ...newUser, joiningDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Salary (₹) {newUser.role === 'TEACHER' || newUser.role === 'PRINCIPAL' ? <span className="text-red-500">*</span> : null}</label>
                                        <input type="number" value={newUser.salary}
                                            onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    {(newUser.role === 'TEACHER' || newUser.role === 'PRINCIPAL') && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Qualification <span className="text-red-500">*</span></label>
                                            <input type="text" value={newUser.highestQualification}
                                                onChange={(e) => setNewUser({ ...newUser, highestQualification: e.target.value })}
                                                placeholder="e.g., M.Sc., B.Ed., Ph.D."
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    )}
                                    {(newUser.role === 'ACCOUNTANT' || newUser.role === 'STAFF') && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                                            <select value={newUser.employmentType}
                                                onChange={(e) => setNewUser({ ...newUser, employmentType: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                        <select value={newUser.status}
                                            onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Official Document */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Briefcase size={18} className="text-rose-600" />
                                    Official Document
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type <span className="text-red-500">*</span></label>
                                        <select value={newUser.officialDocType}
                                            onChange={(e) => setNewUser({ ...newUser, officialDocType: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Number <span className="text-red-500">*</span></label>
                                        <input type="text" value={newUser.officialDocNumber}
                                            onChange={(e) => setNewUser({ ...newUser, officialDocNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button onClick={() => { setShowAddModal(false); setNewUser(emptyForm); setShowPassword(false); }}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={isAdding || !newUser.fullName || !newUser.email || !newUser.password || !newUser.dob || !newUser.joiningDate || (newUser.role === 'STAFF' && !newUser.customRole) || (newUser.role === 'TEACHER' && (!newUser.highestQualification || !newUser.salary)) || !newUser.officialDocNumber}
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <Edit2 size={20} className="text-blue-600" />
                                    Edit User
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">{roleLabel(selectedUser.role)} — {selectedUser.fullName} {selectedUser.employeeId ? `(ID: ${selectedUser.employeeId})` : ''}</p>
                            </div>
                            <button type="button" aria-label="Close" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Account Details</h3>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                        <input type="text" value={editForm.employeeId} readOnly
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Contact</label>
                                        <input type="tel" value={editForm.primaryContact}
                                            onChange={(e) => setEditForm({ ...editForm, primaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Secondary / Emergency Contact</label>
                                        <input type="tel" value={editForm.secondaryContact}
                                            onChange={(e) => setEditForm({ ...editForm, secondaryContact: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Details</h3>
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
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nationality</label>
                                        <input type="text" value={editForm.nationality}
                                            onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Caste</label>
                                        <input type="text" value={editForm.caste}
                                            onChange={(e) => setEditForm({ ...editForm, caste: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">PWD</label>
                                        <select value={editForm.isPwd ? 'yes' : 'no'}
                                            onChange={(e) => setEditForm({ ...editForm, isPwd: e.target.value === 'yes' })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            <option value="no">No</option>
                                            <option value="yes">Yes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar No.</label>
                                        <input type="text" value={editForm.aadharNo}
                                            onChange={(e) => setEditForm({ ...editForm, aadharNo: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Residential Address</label>
                                        <textarea value={editForm.residentialAddress}
                                            onChange={(e) => setEditForm({ ...editForm, residentialAddress: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white"></textarea>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Identification Mark (if any)</label>
                                        <input type="text" value={editForm.identificationMark}
                                            onChange={(e) => setEditForm({ ...editForm, identificationMark: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Details */}
                            <div className="border-b border-gray-200 pb-5">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Professional Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Designation / Role</label>
                                        <input type="text" value={editForm.designation || editForm.customRole}
                                            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value, customRole: e.target.value })}
                                            placeholder={selectedUser.role === 'TEACHER' ? "e.g. Subject Teacher, Class Teacher" : selectedUser.role === 'PRINCIPAL' ? "e.g. Principal" : "e.g. Receptionist, Gardener"}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Department / Subject(s)</label>
                                        <input type="text" value={editForm.department}
                                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                            placeholder={selectedUser.role === 'TEACHER' ? "e.g. Mathematics, Science" : selectedUser.role === 'PRINCIPAL' ? "e.g. Administration, Academics" : "e.g. Teaching, Administrative, Support"}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Joining</label>
                                        <input type="date" value={editForm.joiningDate}
                                            onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Salary (₹)</label>
                                        <input type="number" value={editForm.salary}
                                            onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                    {(selectedUser.role === 'TEACHER' || selectedUser.role === 'PRINCIPAL') && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Qualification</label>
                                            <input type="text" value={editForm.highestQualification}
                                                onChange={(e) => setEditForm({ ...editForm, highestQualification: e.target.value })}
                                                placeholder="e.g., M.Sc., B.Ed., Ph.D."
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                        </div>
                                    )}
                                    {(selectedUser.role === 'ACCOUNTANT' || selectedUser.role === 'STAFF') && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                                            <select value={editForm.employmentType}
                                                onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                        <select value={editForm.status}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Official Document */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Official Document</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Type</label>
                                        <select value={editForm.officialDocType}
                                            onChange={(e) => setEditForm({ ...editForm, officialDocType: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white text-gray-900">
                                            {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Document Number</label>
                                        <input type="text" value={editForm.officialDocNumber}
                                            onChange={(e) => setEditForm({ ...editForm, officialDocNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-gray-900 bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button type="button" aria-label="Close" onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
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
                                <button type="button" aria-label="Close" onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }}
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
                                        <button type="button" aria-label={showCurrentPassword ? "Hide current password" : "Show current password"} onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors">
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
                                        <button type="button" aria-label={showNewPassword ? "Hide new password" : "Show new password"} onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors">
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" aria-label="Close" onClick={() => { setShowPasswordModal(false); setSelectedUser(null); }}
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
                                <button type="button" aria-label="Close" onClick={() => { setShowPrincipalWarningModal(false); setPendingPrincipalActivation(null); }}
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
                                <button type="button" aria-label="Close" onClick={() => { setShowPrincipalWarningModal(false); setPendingPrincipalActivation(null); }}
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
                                <button type="button" aria-label="Close" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
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
                                <button type="button" aria-label="Close" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }}
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
