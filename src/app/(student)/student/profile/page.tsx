"use client";

import Image from "next/image";
import Link from "next/link";
import {
    GraduationCap,
    Award,
    User,
    MapPin,
    Phone,
    Mail,
    Shield,
    Calendar,
    FileText,
    History,
    Lock
} from "lucide-react";
import { useState } from "react";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/redux/api/studentApi";

export default function ProfilePage() {
    const { data: profile, isLoading, refetch } = useGetProfileQuery();
    const [updateProfile] = useUpdateProfileMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        fullName: "",
        residentialAddress: "",
        primaryContact: "",
        secondaryContact: "",
        email: "",
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");

    // Populate edit form when profile loads
    const startEditing = () => {
        if (!profile) return;
        setEditData({
            fullName: profile.personal.fullName,
            residentialAddress: profile.personal.residentialAddress,
            primaryContact: profile.personal.primaryContact,
            secondaryContact: profile.personal.secondaryContact ?? "",
            email: profile.personal.email ?? "",
        });
        setIsEditing(true);
        setSaveError("");
        setSaveSuccess("");
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setSaveError("");
        setSaveSuccess("");
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError("");
        setSaveSuccess("");
        try {
            await updateProfile({
                fullName: editData.fullName,
                residentialAddress: editData.residentialAddress,
                primaryContact: editData.primaryContact,
                secondaryContact: editData.secondaryContact || undefined,
                email: editData.email || undefined,
            }).unwrap();
            setSaveSuccess("Profile updated successfully!");
            setIsEditing(false);
            refetch();
        } catch (err: unknown) {
            const e2 = err as { data?: { message?: string }; message?: string };
            const msg =
                typeof e2?.data?.message === "string"
                    ? e2.data.message
                    : e2?.message ?? "Failed to update profile.";
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Failed to load profile.</p>
            </div>
        );
    }

    const { personal, academic, currentClass } = profile;

    // Helper to generate academic history from marksByClass
    const academicHistory = Object.entries(profile.marksByClass ?? {}).map(([label, marks]) => {
        // Extract year from label e.g. "Grade 5 - A (2026)"
        const match = label.match(/\((\d{4})\)/);
        const year = match ? parseInt(match[1]) : new Date().getFullYear();
        const session = `${year - 1}-${year}`;
        return { class: label, session, highlight: false, marks };
    });

    const handleDownload = (cls: string, session: string) => {
        alert(`Requesting Marksheet PDF for ${cls} (${session}).`);
    };

    // Format date helper
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const genderLabel = personal.gender === "Male" ? "Male" : personal.gender === "Female" ? "Female" : personal.gender;
    const pwdLabel = personal.isPwd ? "Yes" : "No";

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* 1. Dark Hero Section */}
            <div className="bg-slate-900 pt-12 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 overflow-hidden shadow-2xl shrink-0">
                            <Image
                                src="/MLZS_contents/Students Stage 1.png"
                                alt="Student Photo"
                                width={160}
                                height={160}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="text-center md:text-left text-white">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{personal.fullName}</h1>
                            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <GraduationCap size={18} className="text-blue-400" />
                                    {currentClass.name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Award size={18} className="text-blue-400" />
                                    Roll No: {academic.rollNumber ?? "—"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User size={18} className="text-blue-400" />
                                    Adm No: {academic.admissionNumber}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Floating Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8">

                {/* ── Personal Details Card ─────────────────────────── */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
                                    <p className="text-sm text-gray-500">Manage your personal information</p>
                                </div>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={startEditing}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-4 py-2 rounded-lg transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {saveError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{saveError}</div>}
                        {saveSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{saveSuccess}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            <EditableField
                                label="Full Name"
                                value={personal.fullName}
                                editValue={editData.fullName}
                                onChange={(v) => setEditData({ ...editData, fullName: v })}
                                isEditing={isEditing}
                                icon={<User size={16} />}
                            />
                            <InfoField label="Date of Birth" value={formatDate(personal.dob)} icon={<Calendar size={16} />} />
                            <InfoField label="Gender" value={genderLabel} icon={<User size={16} />} />
                            <InfoField label="Nationality" value={personal.nationality ?? "—"} icon={<MapPin size={16} />} />
                            <InfoField label="Caste" value={personal.caste ?? "—"} icon={<User size={16} />} />
                            <InfoField label="Aadhar No." value={personal.aadharNo ?? "—"} icon={<Shield size={16} />} />
                            <EditableField
                                label="Email ID"
                                value={personal.email ?? "—"}
                                editValue={editData.email}
                                onChange={(v) => setEditData({ ...editData, email: v })}
                                isEditing={isEditing}
                                icon={<Mail size={16} />}
                            />
                            <InfoField label="PWD" value={pwdLabel} icon={<User size={16} />} />
                            <EditableField
                                label="Primary Contact No."
                                value={personal.primaryContact}
                                editValue={editData.primaryContact}
                                onChange={(v) => setEditData({ ...editData, primaryContact: v })}
                                isEditing={isEditing}
                                icon={<Phone size={16} />}
                            />
                            <EditableField
                                label="Secondary Contact No."
                                value={personal.secondaryContact ?? "—"}
                                editValue={editData.secondaryContact}
                                onChange={(v) => setEditData({ ...editData, secondaryContact: v })}
                                isEditing={isEditing}
                                icon={<Phone size={16} />}
                            />
                            <InfoField label="Identification Mark" value={personal.identificationMark ?? "—"} icon={<User size={16} />} className="md:col-span-2" />
                            <EditableField
                                label="Residential Address"
                                value={personal.residentialAddress}
                                editValue={editData.residentialAddress}
                                onChange={(v) => setEditData({ ...editData, residentialAddress: v })}
                                isEditing={isEditing}
                                icon={<MapPin size={16} />}
                                className="md:col-span-3"
                            />
                        </div>

                        {isEditing && (
                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={cancelEditing}
                                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Academic Details Card ─────────────────────────── */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Academic Details</h2>
                                <p className="text-sm text-gray-500">School records and information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <InfoField label="Admission No." value={academic.admissionNumber} icon={<FileText size={16} />} />
                            <InfoField label="Admission Year" value={String(academic.admissionYear)} icon={<Calendar size={16} />} />
                            <InfoField label="Admission Class" value={currentClass.name} icon={<GraduationCap size={16} />} />
                            <InfoField label="Date of Admission" value={formatDate(academic.admissionDate)} icon={<Calendar size={16} />} />
                            <InfoField label="Current Class" value={currentClass.name} icon={<Award size={16} />} />
                            <InfoField label="Current Section" value={currentClass.section} icon={<Award size={16} />} />
                            <InfoField label="Roll No." value={academic.rollNumber ?? "—"} icon={<FileText size={16} />} />
                            <InfoField label="Passing Year" value={academic.passingYear ? String(academic.passingYear) : "—"} icon={<Calendar size={16} />} />
                        </div>
                    </div>
                </div>

                {/* ── Academic History & Marksheets ───────────────────── */}
                {academicHistory.length > 0 && (
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-emerald-500">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                        <History size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Academic History & Marksheets</h2>
                                        <p className="text-sm text-gray-500">Download marksheets for all previous classes</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Session</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Marks</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {academicHistory.map((record, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3 text-sm text-gray-800 font-medium">{record.class}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{record.session}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {record.marks.map((m) => (
                                                        <span key={m.id} className="inline-block mr-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                            {m.exam.subject.name}: {m.score}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleDownload(record.class, record.session)}
                                                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Security Settings ─────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-purple-500 mb-12">
                    <div className="p-6 md:p-8 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                                <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                            </div>
                        </div>
                        <Link href="/student/profile/reset-password">
                            <button className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-all shadow-lg hover:shadow-slate-500/30">
                                <Lock size={18} />
                                <span>Reset Password</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Reusable components ─────────────────────────────────────────

function InfoField({
    label,
    value,
    icon,
    className = "",
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`group ${className}`}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            <p className="text-gray-900 font-medium text-base truncate border-b border-transparent group-hover:border-gray-200 pb-1 transition-colors">
                {value}
            </p>
        </div>
    );
}

function EditableField({
    label,
    value,
    editValue,
    onChange,
    isEditing,
    icon,
    className = "",
}: {
    label: string;
    value: string;
    editValue: string;
    onChange: (v: string) => void;
    isEditing: boolean;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            {isEditing ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full border border-blue-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            ) : (
                <p className="text-gray-900 font-medium text-base truncate border-b border-transparent group-hover:border-gray-200 pb-1 transition-colors">
                    {value}
                </p>
            )}
        </div>
    );
}