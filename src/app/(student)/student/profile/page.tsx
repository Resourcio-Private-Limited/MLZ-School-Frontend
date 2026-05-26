"use client";

import Image from "next/image";
import {
    GraduationCap,
    Award,
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    History,
    Camera,
    Loader2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useGetProfileQuery, useUploadProfileImageMutation } from "@/redux/api/studentApi";

export default function ProfilePage() {
    const { data: profile, isLoading, refetch } = useGetProfileQuery();
    const [uploadProfileImage, { isLoading: isUploading }] = useUploadProfileImageMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.personal?.profileImage) {
            setProfileImage(profile.personal.profileImage);
        }
    }, [profile]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress image before uploading
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const img = new window.Image();
                img.src = reader.result as string;
                await new Promise((resolve) => { img.onload = resolve; });

                const canvas = document.createElement('canvas');
                const maxSize = 800;
                let width = img.width;
                let height = img.height;

                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize;
                        width = maxSize;
                    } else {
                        width = (width / height) * maxSize;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.7);
                await uploadProfileImage({ imageUrl: compressedImageUrl }).unwrap();
                setProfileImage(compressedImageUrl);
                refetch();
            } catch (err) {
                console.error('Failed to upload image:', err);
            }
        };
        reader.readAsDataURL(file);
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
        const match = label.match(/\((\d{4})\)/);
        const year = match ? parseInt(match[1]) : new Date().getFullYear();
        const session = `${year - 1}-${year}`;
        return { class: label, session, highlight: false, marks };
    });

    const handleDownload = (cls: string, session: string) => {
        console.log(`Requested Marksheet for ${cls} (${session})`);
    };

    // Format date helper
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const genderLabel = personal.gender === "Male" ? "Male" : personal.gender === "Female" ? "Female" : personal.gender;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* 1. Dark Hero Section */}
            <div className="bg-slate-900 pt-12 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 overflow-hidden shadow-2xl shrink-0">
                                {profileImage ? (
                                    <Image
                                        src={profileImage}
                                        alt="Student Photo"
                                        width={160}
                                        height={160}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <User size={48} className="text-slate-400" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all disabled:opacity-50"
                                title="Upload Photo"
                            >
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
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
                            <InfoField label="Full Name" value={personal.fullName} icon={<User size={16} />} />
                            <InfoField label="Date of Birth" value={formatDate(personal.dob)} icon={<Calendar size={16} />} />
                            <InfoField label="Gender" value={genderLabel} icon={<User size={16} />} />
                            
                            <InfoField label="Primary Contact No." value={personal.primaryContact} icon={<Phone size={16} />} />
                            <InfoField label="Residential Address" value={personal.residentialAddress} icon={<MapPin size={16} />} />
                        </div>
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
                            <InfoField label="Admission No." value={academic.admissionNumber} icon={<Award size={16} />} />
                            <InfoField label="Admission Year" value={String(academic.admissionYear)} icon={<Calendar size={16} />} />
                            <InfoField label="Current Class" value={currentClass.name} icon={<GraduationCap size={16} />} />
                            <InfoField label="Current Section" value={currentClass.section} icon={<Award size={16} />} />
                            <InfoField label="Roll No." value={academic.rollNumber ?? "—"} icon={<Award size={16} />} />
                            <InfoField label="Parent Name" value={academic.parentName ?? "—"} icon={<User size={16} />} />
                            <InfoField label="Parent Contact" value={academic.parentContact ?? "—"} icon={<Phone size={16} />} />
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
                                                    {record.marks.map((m: { id: string; score: number; exam: { subject: { name: string } } }) => (
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
            </div>
        </div>
    );
}

// ─── Reusable component ─────────────────────────────────────────

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