"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Award, Camera, GraduationCap, KeyRound, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { useGetProfileQuery, useUploadProfileImageMutation } from "@/redux/api/studentApi";
import { heroGradient } from "@/components/student/brand";
import { focusRing, secondaryBtn } from "@/components/student/ui";

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
const sentence = (s: string | null | undefined) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : null);

type Field = { label: string; value: string | null | undefined; wide?: boolean };

function Details({ fields }: { fields: Field[] }) {
    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 px-4 py-5 sm:gap-x-6 sm:px-6 lg:grid-cols-3">
            {fields.map((f) => (
                <div key={f.label} className={`min-w-0 ${f.wide ? "col-span-2 lg:col-span-3" : ""}`}>
                    <dt className="text-sm text-gray-500">{f.label}</dt>
                    <dd className={`mt-0.5 break-words text-sm ${f.value ? "font-medium text-gray-900" : "text-gray-500"}`}>{f.value || "Not added"}</dd>
                </div>
            ))}
        </dl>
    );
}

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export default function ProfilePage() {
    const { data: profile, isLoading, isError, refetch } = useGetProfileQuery();
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
                // Compress image before uploading
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
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedImageUrl = canvas.toDataURL("image/jpeg", 0.7);
                await uploadProfileImage({ imageUrl: compressedImageUrl }).unwrap();
                setLocalImage(compressedImageUrl);
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
                <button type="button" onClick={() => refetch()} className={`${secondaryBtn} mt-4`}>Try again</button>
            </div>
        );
    }

    const { personal, academic, currentClass } = profile;
    const photo = localImage ?? personal.profileImage;
    const roll = academic.classRoll ?? academic.rollNumber;

    const personalFields: Field[] = [
        { label: "Full name", value: personal.fullName },
        { label: "Date of birth", value: formatDate(personal.dob) },
        { label: "Gender", value: sentence(personal.gender) },
        { label: "Nationality", value: personal.nationality },
        { label: "Caste", value: personal.caste },
        { label: "Person with disability", value: personal.isPwd ? "Yes" : "No" },
        { label: "Aadhaar number", value: personal.aadharNo },
        { label: "Email", value: personal.email ?? profile.userEmail },
        { label: "Primary contact", value: personal.primaryContact },
        { label: "Emergency contact", value: personal.secondaryContact },
        { label: "Identification mark", value: personal.identificationMark, wide: true },
        { label: "Residential address", value: personal.residentialAddress, wide: true },
    ];

    const schoolFields: Field[] = [
        { label: "Class", value: currentClass.name },
        { label: "Section", value: currentClass.section },
        { label: "Class roll", value: academic.classRoll != null ? String(academic.classRoll) : null },
        { label: "Roll number", value: academic.rollNumber },
        { label: "Admission number", value: academic.admissionNumber },
        { label: "Admission date", value: formatDate(academic.admissionDate) },
        { label: "Admission year", value: academic.admissionYear ? String(academic.admissionYear) : null },
        { label: "School transport", value: academic.transportOpted ? "Yes" : "No" },
        { label: "Parent or guardian", value: academic.parentName },
        { label: "Parent's contact", value: academic.parentContact },
    ];

    // Marks are keyed by a class label such as "Class 6 - Section A (2025)". Newest year first.
    const history = Object.entries(profile.marksByClass ?? {})
        .map(([label, marks]) => {
            const year = Number(label.match(/\((\d{4})\)/)?.[1]) || null;
            return { label: label.replace(/\s*\(\d{4}\)\s*$/, ""), session: year ? `${year - 1}–${String(year).slice(-2)}` : null, year, marks };
        })
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

    return (
        <div className="max-w-7xl space-y-6">
            <section className={`overflow-hidden rounded-xl px-4 py-6 shadow-sm sm:px-8 sm:py-8 ${heroGradient}`}>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-white/10 ring-4 ring-white/10 sm:h-28 sm:w-28">
                            {photo ? (
                                <Image src={photo} alt="" width={112} height={112} unoptimized className="h-full w-full object-cover" />
                            ) : (
                                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-sky-200 sm:text-4xl">
                                    {personal.fullName?.[0]?.toUpperCase() ?? <User size={36} aria-hidden="true" />}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            aria-label="Change photo"
                            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-sky-600 text-white shadow-lg hover:bg-sky-500 disabled:opacity-60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            {isUploading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{personal.fullName}</h1>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                                <GraduationCap size={15} aria-hidden="true" className="shrink-0 text-sky-300" />
                                {currentClass.name}
                            </span>
                            {roll != null && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Award size={15} aria-hidden="true" className="shrink-0 text-sky-300" />
                                    Roll {roll}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 tabular-nums">Admission no. {academic.admissionNumber}</span>
                        </p>
                    </div>
                </div>
            </section>

            <Section
                title="Personal details"
                subtitle="To correct anything here, ask the school office."
                action={
                    <Link href="/student/profile/reset-password" className={secondaryBtn}>
                        <KeyRound size={15} aria-hidden="true" className="shrink-0" />
                        Change password
                    </Link>
                }
            >
                <Details fields={personalFields} />
            </Section>

            <Section title="School record">
                <Details fields={schoolFields} />
            </Section>

            {history.length > 0 && (
                <Section title="Marks by class" subtitle="Scores your teachers have entered, by subject.">
                    <ul className="divide-y divide-gray-100">
                        {history.map((h) => (
                            <li key={`${h.label}-${h.year}`} className="px-4 py-4 sm:px-6">
                                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                                    <p className="font-medium text-gray-900">{h.label}</p>
                                    {h.session && <p className="text-sm tabular-nums text-gray-500">Session {h.session}</p>}
                                </div>
                                {h.marks.length === 0 ? (
                                    <p className="mt-2 text-sm text-gray-500">No marks entered yet.</p>
                                ) : (
                                    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                        {h.marks.map((m) => (
                                            <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2 ring-1 ring-gray-100">
                                                <dt className="truncate text-xs text-gray-500" title={`${m.exam.subject.name}, ${m.exam.name}`}>{m.exam.subject.name}</dt>
                                                <dd className="text-base font-semibold tabular-nums text-gray-900">{m.score}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            <p className="text-sm text-gray-500">
                Need a printed marksheet?{" "}
                <Link href="/student/classroom/messages" className={`rounded-sm font-medium text-sky-700 hover:underline underline-offset-4 ${focusRing}`}>Message your class teacher</Link>.
            </p>
        </div>
    );
}
