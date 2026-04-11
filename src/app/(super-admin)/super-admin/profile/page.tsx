"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Briefcase,
    IdCard,
    Calendar,
    User,
    MapPin,
    Phone,
    Mail,
    Lock,
    Save,
    ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGetSuperAdminProfileQuery, useUpdateSuperAdminProfileMutation } from "@/redux/api/superAdminApi";

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export default function SuperAdminProfilePage() {
    const { data: profile, isLoading } = useGetSuperAdminProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateSuperAdminProfileMutation();

    const [form, setForm] = useState({
        fullName: "",
        dob: "",
        gender: "",
        residentialAddress: "",
        primaryContact: "",
        secondaryContact: "",
        email: "",
        designation: "",
        department: "",
    });

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (profile) {
            setForm({
                fullName: profile.fullName ?? "",
                dob: profile.dob ? String(profile.dob).split("T")[0] : "",
                gender: profile.gender ?? "",
                residentialAddress: profile.residentialAddress ?? "",
                primaryContact: profile.primaryContact ?? "",
                secondaryContact: profile.secondaryContact ?? "",
                email: profile.userEmail ?? "",
                designation: profile.designation ?? "",
                department: profile.department ?? "",
            });
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await updateProfile(form).unwrap();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // handle error
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 pb-12 flex items-center justify-center">
                <p className="text-slate-500">Failed to load profile. Please refresh.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Hero Section */}
            <div className="bg-slate-900 pt-12 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center space-x-4 mb-6">
                        <Link href="/super-admin" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 overflow-hidden shadow-2xl shrink-0 bg-slate-800">
                            <Image
                                src="/MLZS_contents/Students Stage 1.png"
                                alt="Super Admin Photo"
                                width={160}
                                height={160}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="text-center md:text-left text-white">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.fullName}</h1>
                            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <Briefcase size={18} className="text-blue-400" />
                                    {profile.designation ?? "Super Admin"}
                                </span>
                                {profile.department && (
                                    <span className="flex items-center gap-1">
                                        <IdCard size={18} className="text-blue-400" />
                                        {profile.department}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8">
                {/* Personal Details Card */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
                                <p className="text-sm text-gray-500">Your personal information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            <InfoField label="Full Name" value={profile.fullName} icon={<User size={16} />} />
                            <InfoField label="Date of Birth" value={formatDate(profile.dob)} icon={<Calendar size={16} />} />
                            <InfoField label="Gender" value={profile.gender ?? "—"} icon={<User size={16} />} />
                            <InfoField label="Email ID" value={profile.email ?? "—"} icon={<Mail size={16} />} />
                            <InfoField label="Contact No." value={profile.primaryContact ?? "—"} icon={<Phone size={16} />} />
                            <InfoField label="Residential Address" value={profile.residentialAddress ?? "—"} icon={<MapPin size={16} />} className="md:col-span-3" />
                        </div>
                    </div>
                </div>

                {/* Official Details */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Official Details</h2>
                                <p className="text-sm text-gray-500">Your official records and information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoField label="Designation" value={profile.designation ?? "—"} icon={<Briefcase size={16} />} />
                            <InfoField label="Department" value={profile.department ?? "—"} icon={<IdCard size={16} />} />
                        </div>
                    </div>
                </div>

                {/* Edit Profile Card */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-emerald-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Save size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Update Profile</h2>
                                    <p className="text-sm text-gray-500">Edit and save your information</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md font-medium"
                            >
                                <Save size={18} />
                                {isUpdating ? "Saving..." : saved ? "Saved!" : "Save Changes"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FormField
                                label="Full Name"
                                value={form.fullName}
                                onChange={(v) => setForm({ ...form, fullName: v })}
                                icon={<User size={14} />}
                            />
                            <FormField
                                label="Date of Birth"
                                type="date"
                                value={form.dob}
                                onChange={(v) => setForm({ ...form, dob: v })}
                                icon={<Calendar size={14} />}
                            />
                            <FormField
                                label="Gender"
                                value={form.gender}
                                onChange={(v) => setForm({ ...form, gender: v })}
                                icon={<User size={14} />}
                            />
                            <FormField
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(v) => setForm({ ...form, email: v })}
                                icon={<Mail size={14} />}
                            />
                            <FormField
                                label="Primary Contact"
                                value={form.primaryContact}
                                onChange={(v) => setForm({ ...form, primaryContact: v })}
                                icon={<Phone size={14} />}
                            />
                            <FormField
                                label="Secondary Contact"
                                value={form.secondaryContact}
                                onChange={(v) => setForm({ ...form, secondaryContact: v })}
                                icon={<Phone size={14} />}
                            />
                            <FormField
                                label="Designation"
                                value={form.designation}
                                onChange={(v) => setForm({ ...form, designation: v })}
                                icon={<Briefcase size={14} />}
                            />
                            <FormField
                                label="Department"
                                value={form.department}
                                onChange={(v) => setForm({ ...form, department: v })}
                                icon={<IdCard size={14} />}
                            />
                            <div className="md:col-span-3">
                                <FormField
                                    label="Residential Address"
                                    value={form.residentialAddress}
                                    onChange={(v) => setForm({ ...form, residentialAddress: v })}
                                    icon={<MapPin size={14} />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
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
                        <Link href="/super-admin/profile/reset-password">
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

function InfoField({ label, value, icon, className = "" }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
    return (
        <div className={`group ${className}`}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            <p className="text-gray-900 font-medium text-base truncate border-b border-transparent group-hover:border-gray-200 pb-1 transition-colors">
                {value || "—"}
            </p>
        </div>
    );
}

function FormField({ label, value, onChange, icon, type = "text" }: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode; type?: string }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all hover:border-gray-300"
            />
        </div>
    );
}
