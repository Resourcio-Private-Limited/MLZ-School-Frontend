"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Briefcase,
    IdCard,
    User,
    MapPin,
    Phone,
    Mail,
    ArrowLeft,
    Camera,
    Loader2,
} from "lucide-react";
import { useRef } from "react";
import { useGetPrincipalProfileQuery, useUploadProfileImageMutation } from "@/redux/api/principalApi";

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

export default function PrincipalProfilePage() {
    const { data: profile, isLoading, refetch } = useGetPrincipalProfileQuery();
    const [uploadProfileImage, { isLoading: isUploading }] = useUploadProfileImageMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // Compress image before uploading
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
                refetch();
            } catch (err) {
                console.error('Failed to upload image:', err);
            }
        };
        reader.readAsDataURL(file);
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
                        <Link href="/principal" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </Link>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 overflow-hidden shadow-2xl shrink-0 bg-slate-800">
                                {profile.profileImage ? (
                                    <Image
                                        src={profile.profileImage}
                                        alt="Principal Photo"
                                        width={160}
                                        height={160}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-700">
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
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.fullName}</h1>
                            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <Briefcase size={18} className="text-blue-400" />
                                    {profile.designation ?? "Principal"}
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
                            <InfoField label="Date of Birth" value={formatDate(profile.dob)} icon={<User size={16} />} />
                            <InfoField label="Gender" value={profile.gender} icon={<User size={16} />} />
                           
                            <InfoField label="Contact No." value={profile.primaryContact} icon={<Phone size={16} />} />
                            <InfoField label="Residential Address" value={profile.residentialAddress} icon={<MapPin size={16} />} />
                        </div>
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