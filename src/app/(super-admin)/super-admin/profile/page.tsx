"use client";

import Image from "next/image";
import { Briefcase, Camera, IdCard, Loader2, Mail, Pencil, User } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useGetSuperAdminProfileQuery, useUpdateSuperAdminProfileMutation, useUploadProfileImageMutation, type SuperAdminProfile } from "@/redux/api/superAdminApi";
import { heroGradient } from "@/components/super-admin/brand";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

type ProfileForm = {
    fullName: string;
    dob: string;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    secondaryContact: string;
    email: string;
    designation: string;
    department: string;
};

const toForm = (p: SuperAdminProfile): ProfileForm => ({
    fullName: p.fullName ?? "",
    dob: p.dob ? String(p.dob).split("T")[0] : "",
    gender: p.gender ?? "",
    residentialAddress: p.residentialAddress ?? "",
    primaryContact: p.primaryContact ?? "",
    secondaryContact: p.secondaryContact ?? "",
    email: p.userEmail ?? "",
    designation: p.designation ?? "",
    department: p.department ?? "",
});

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
const sentence = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : null);

export default function SuperAdminProfilePage() {
    const { data: profile, isLoading, isError, refetch } = useGetSuperAdminProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateSuperAdminProfileMutation();
    const [uploadProfileImage, { isLoading: isUploading }] = useUploadProfileImageMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProfileForm | null>(null);

    const startEditing = () => {
        if (profile) setForm(toForm(profile));
        setEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;
        try {
            await updateProfile(form).unwrap();
            toast.success("Profile saved.");
            setEditing(false);
            refetch();
        } catch {
            toast.error("Profile not saved. Check your connection and try again.");
        }
    };

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
                toast.success("Photo updated.");
                refetch();
            } catch (err: unknown) {
                const message = (err as { data?: { message?: string }; message?: string })?.data?.message ?? (err as { message?: string })?.message;
                toast.error(message || "Photo not uploaded. Try a smaller image.");
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl space-y-6" aria-busy="true">
                <div className={`h-40 rounded-xl ${heroGradient} motion-safe:animate-pulse`} />
                <div className="h-64 rounded-xl border border-gray-200 bg-white" />
            </div>
        );
    }

    if (!profile || isError) {
        return (
            <div className="max-w-7xl rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
                <p className="font-medium text-gray-900">Your profile couldn&apos;t be loaded</p>
                <p className="mt-1 text-sm text-gray-500">Check your connection, then try again.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className={`mt-4 inline-flex h-9 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
                >
                    Try again
                </button>
            </div>
        );
    }

    const personal: { label: string; value: string | null; wide?: boolean }[] = [
        { label: "Full name", value: profile.fullName },
        { label: "Date of birth", value: formatDate(profile.dob) },
        { label: "Gender", value: sentence(profile.gender) },
        { label: "Email", value: profile.userEmail ?? profile.email },
        { label: "Primary contact", value: profile.primaryContact },
        { label: "Secondary contact", value: profile.secondaryContact },
        { label: "Designation", value: profile.designation },
        { label: "Department", value: profile.department },
        { label: "Residential address", value: profile.residentialAddress, wide: true },
    ];

    return (
        <div className="max-w-7xl space-y-6">
            <section className={`overflow-hidden rounded-xl px-4 py-6 shadow-sm sm:px-8 sm:py-8 ${heroGradient}`}>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-white/10 ring-4 ring-white/10 sm:h-28 sm:w-28">
                            {profile.profileImage ? (
                                <Image src={profile.profileImage} alt="" width={112} height={112} unoptimized className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-rose-200 sm:text-4xl">
                                    {profile.fullName?.[0]?.toUpperCase() ?? <User size={36} aria-hidden="true" />}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            aria-label="Change photo"
                            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-rose-600 text-white shadow-lg hover:bg-rose-500 disabled:opacity-60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            {isUploading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.fullName}</h1>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                                <Briefcase size={15} aria-hidden="true" className="text-rose-300" />
                                {profile.designation ?? "Super Admin"}
                            </span>
                            {profile.department && (
                                <span className="inline-flex items-center gap-1.5">
                                    <IdCard size={15} aria-hidden="true" className="text-rose-300" />
                                    {profile.department}
                                </span>
                            )}
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                                <Mail size={15} aria-hidden="true" className="shrink-0 text-rose-300" />
                                <span className="truncate">{profile.userEmail}</span>
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">{editing ? "Edit details" : "Details"}</h2>
                        <p className="text-sm text-gray-500">{editing ? "Changes apply to your account across the portal." : "Shown on notices and messages you send."}</p>
                    </div>
                    {!editing && (
                        <button
                            type="button"
                            onClick={startEditing}
                            className={`inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-[0.97] motion-safe:transition ${focusRing}`}
                        >
                            <Pencil size={15} aria-hidden="true" />
                            Edit details
                        </button>
                    )}
                </div>

                {editing && form ? (
                    <form onSubmit={handleSave}>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                            <FormField label="Full name" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} autoFocus />
                            <FormField label="Date of birth" type="date" value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} />
                            <FormField label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
                            <FormField label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                            <FormField label="Primary contact" type="tel" value={form.primaryContact} onChange={(v) => setForm({ ...form, primaryContact: v })} />
                            <FormField label="Secondary contact" type="tel" value={form.secondaryContact} onChange={(v) => setForm({ ...form, secondaryContact: v })} />
                            <FormField label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
                            <FormField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
                            <div className="sm:col-span-2 lg:col-span-3">
                                <FormField label="Residential address" value={form.residentialAddress} onChange={(v) => setForm({ ...form, residentialAddress: v })} />
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className={`h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className={`h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700 active:scale-[0.97] disabled:opacity-60 motion-safe:transition ${focusRing} focus-visible:ring-offset-2`}
                            >
                                {isUpdating ? "Saving…" : "Save changes"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                        {personal.map((f) => (
                            <div key={f.label} className={f.wide ? "sm:col-span-2 lg:col-span-3" : ""}>
                                <dt className="text-sm text-gray-500">{f.label}</dt>
                                <dd className={`mt-0.5 break-words text-sm ${f.value ? "font-medium text-gray-900" : "text-gray-400"}`}>{f.value || "Not added"}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </section>
        </div>
    );
}

function FormField({ label, value, onChange, type = "text", autoFocus = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean }) {
    return (
        <label className="block text-sm font-medium text-gray-700">
            {label}
            <input
                type={type}
                value={value}
                autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-normal text-gray-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            />
        </label>
    );
}
