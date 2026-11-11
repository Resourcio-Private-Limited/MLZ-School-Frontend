"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { BadgeCheck, Briefcase, Camera, IdCard, Loader2, School, User } from "lucide-react";
import toast from "react-hot-toast";
import { useGetTeacherProfileQuery, useUploadProfileImageMutation, type TeacherFullProfile } from "@/redux/api/teacherApi";
import { heroGradient } from "@/components/teacher/brand";
import { errorMessage, focusRing, inr, secondaryBtn } from "@/components/teacher/ui";

// Fields the full-profile endpoint can return beyond the typed ones.
type Extra = Partial<{
    joiningDate: string;
    department: string;
    secondaryContact: string;
    nationality: string;
    caste: string;
    isPwd: boolean;
    aadharNo: string;
    identificationMark: string;
    bloodGroup: string;
    officialDocType: string;
    officialDocNumber: string;
}>;

function formatDate(value: string | null | undefined) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
const sentence = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ") : null);

type Field = { label: string; value: string | null | undefined; wide?: boolean };

function Details({ fields }: { fields: Field[] }) {
    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-4 py-5 sm:gap-x-6 sm:px-6 lg:grid-cols-3">
            {fields.map((f) => (
                <div key={f.label} className={`min-w-0 ${f.wide ? "col-span-2 lg:col-span-3" : ""}`}>
                    <dt className="text-sm text-gray-500">{f.label}</dt>
                    <dd className={`mt-0.5 break-words text-sm ${f.value ? "font-medium text-gray-900" : "text-gray-400"}`}>{f.value || "Not added"}</dd>
                </div>
            ))}
        </dl>
    );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
                <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

export default function TeacherProfilePage() {
    const { data, isLoading, isError, refetch } = useGetTeacherProfileQuery();
    const [uploadProfileImage, { isLoading: isUploading }] = useUploadProfileImageMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Shows the new photo straight away while the profile refetches.
    const [localImage, setLocalImage] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // Compress the image before uploading.
                const img = new window.Image();
                img.src = reader.result as string;
                await new Promise((resolve) => { img.onload = resolve; });

                const canvas = document.createElement("canvas");
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
                canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL("image/jpeg", 0.7);
                await uploadProfileImage({ imageUrl: compressed }).unwrap();
                setLocalImage(compressed);
                toast.success("Photo updated.");
                refetch();
            } catch (err) {
                toast.error(errorMessage(err, "Photo not uploaded. Try a smaller image."));
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

    if (!data || isError) {
        return (
            <div className="max-w-7xl rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
                <p className="font-medium text-gray-900">Your profile couldn&apos;t be loaded</p>
                <p className="mt-1 text-sm text-gray-500">It might be a temporary problem — try again in a moment.</p>
                <button type="button" onClick={() => refetch()} className={`${secondaryBtn} mt-4`}>Try again</button>
            </div>
        );
    }

    const profile = data as TeacherFullProfile & Extra;
    const photo = localImage ?? profile.profileImage;
    const salary = profile.salary !== null && profile.salary !== undefined && profile.salary !== "" && Number.isFinite(Number(profile.salary)) ? inr(Number(profile.salary)) : null;
    const status = sentence(profile.status);
    const doc = [profile.officialDocType, profile.officialDocNumber].filter(Boolean).join(", ");
    const classrooms = [...(profile.assignedClassrooms ?? [])].sort((a, b) => Number(b.isClassTeacher) - Number(a.isClassTeacher) || a.name.localeCompare(b.name, "en-IN", { numeric: true }));

    const personal: Field[] = [
        { label: "Full name", value: profile.fullName },
        { label: "Date of birth", value: formatDate(profile.dob) },
        { label: "Gender", value: sentence(profile.gender) },
        { label: "Nationality", value: profile.nationality },
        { label: "Caste", value: profile.caste },
        { label: "Person with disability", value: profile.isPwd === undefined ? null : profile.isPwd ? "Yes" : "No" },
        { label: "Blood group", value: profile.bloodGroup },
        { label: "Aadhaar number", value: profile.aadharNo },
        { label: "Email", value: profile.email || profile.userEmail },
        { label: "Primary contact", value: profile.primaryContact },
        { label: "Emergency contact", value: profile.secondaryContact },
        { label: "Identification mark", value: profile.identificationMark, wide: true },
        { label: "Residential address", value: profile.residentialAddress, wide: true },
    ];

    const work: Field[] = [
        { label: "Employee ID", value: profile.employeeId },
        { label: "Designation", value: profile.designation ?? "Teacher" },
        { label: "Department", value: profile.department },
        { label: "Highest qualification", value: profile.highestQualification },
        { label: "Date of joining", value: formatDate(profile.joiningDate) },
        { label: "Monthly salary", value: salary },
        { label: "Status", value: status },
        { label: "Official document", value: doc || null, wide: true },
    ];

    return (
        <div className="max-w-7xl space-y-6">
            <section className={`overflow-hidden rounded-xl px-4 py-6 shadow-sm sm:px-8 sm:py-8 ${heroGradient}`}>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-white/10 ring-4 ring-white/10 sm:h-28 sm:w-28">
                            {photo ? (
                                <Image src={photo} alt="" width={112} height={112} unoptimized className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-emerald-200 sm:text-4xl">
                                    {profile.fullName?.[0]?.toUpperCase() ?? <User size={36} aria-hidden="true" />}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            aria-label="Change photo"
                            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 disabled:opacity-60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            {isUploading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.fullName}</h1>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                                <Briefcase size={15} aria-hidden="true" className="text-emerald-300" />
                                {profile.designation ?? "Teacher"}
                            </span>
                            {profile.employeeId && (
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                    <IdCard size={15} aria-hidden="true" className="text-emerald-300" />
                                    Employee ID {profile.employeeId}
                                </span>
                            )}
                            {profile.classTeacherOf && (
                                <span className="inline-flex items-center gap-1.5">
                                    <BadgeCheck size={15} aria-hidden="true" className="text-emerald-300" />
                                    Class teacher, {profile.classTeacherOf.name}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </section>

            <Section title="Personal details" subtitle="To correct anything here, ask the school office.">
                <Details fields={personal} />
            </Section>

            <Section title="Work details">
                <Details fields={work} />
            </Section>

            <Section title="Classes and subjects" subtitle="What the school has assigned to you this year.">
                {classrooms.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-gray-500 sm:px-6">No classes are assigned to you yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {classrooms.map((c) => (
                            <li key={c.id}>
                                <Link href={`/teacher/classroom/${c.id}`} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3.5 hover:bg-gray-50 motion-safe:transition-colors sm:px-6 ${focusRing} focus-visible:ring-inset`}>
                                    <School size={16} aria-hidden="true" className="shrink-0 text-emerald-600" />
                                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                    {c.isClassTeacher && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-100">Class teacher</span>}
                                    <span className="min-w-0 basis-full text-sm text-gray-500 sm:ml-auto sm:basis-auto">
                                        {c.subjects.length ? c.subjects.join(", ") : "No subjects"}
                                        <span className="ml-3 tabular-nums">{c.studentCount} students</span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        </div>
    );
}
