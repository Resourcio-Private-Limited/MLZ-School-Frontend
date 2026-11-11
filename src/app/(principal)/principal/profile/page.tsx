"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Briefcase, Camera, IdCard, Loader2, Mail, Pencil, User } from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetPrincipalProfileQuery,
    useUpdatePrincipalProfileMutation,
    useUploadProfileImageMutation,
    type PrincipalFullProfile,
    type UpdatePrincipalProfilePayload,
} from "@/redux/api/principalApi";
import { heroGradient } from "@/components/principal/brand";
import { errorMessage, inputClass, inr, primaryBtn, secondaryBtn } from "@/components/principal/ui";

// Fields the profile endpoint can return beyond the typed ones. Shown only from real data.
type Extra = Partial<{
    employeeId: string;
    joiningDate: string;
    highestQualification: string;
    qualifications: string;
    salary: number | string;
    currentSalary: number | string;
    status: string;
    officialDocType: string;
    officialDocNumber: string;
}>;

type ProfileForm = Required<UpdatePrincipalProfilePayload>;

const toForm = (p: PrincipalFullProfile): ProfileForm => ({
    fullName: p.fullName ?? "",
    dob: p.dob ? String(p.dob).split("T")[0] : "",
    gender: p.gender ?? "",
    residentialAddress: p.residentialAddress ?? "",
    primaryContact: p.primaryContact ?? "",
    secondaryContact: p.secondaryContact ?? "",
    email: p.email ?? "",
    designation: p.designation ?? "",
    department: p.department ?? "",
});

const GENDERS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "OTHER", label: "Other" },
];

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

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function FormField({
    id,
    label,
    value,
    onChange,
    type = "text",
    autoFocus = false,
    required = false,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    autoFocus?: boolean;
    required?: boolean;
    error?: string | null;
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
                {!required && <span className="font-normal text-gray-500"> (optional)</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                autoFocus={autoFocus}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                onChange={(e) => onChange(e.target.value)}
                className={`mt-1.5 ${inputClass} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""}`}
            />
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function PrincipalProfilePage() {
    const { data, isLoading, isError, refetch } = useGetPrincipalProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdatePrincipalProfileMutation();
    const [uploadProfileImage, { isLoading: isUploading }] = useUploadProfileImageMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Shows the new photo straight away while the profile refetches.
    const [localImage, setLocalImage] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<ProfileForm | null>(null);
    const [triedSave, setTriedSave] = useState(false);

    const startEditing = () => {
        if (data) setForm(toForm(data));
        setTriedSave(false);
        setEditing(true);
    };

    const nameError = form && !form.fullName.trim() ? "Enter your full name." : null;
    const contactError = form && !form.primaryContact.trim() ? "Enter a phone number the school can reach you on." : null;
    const emailError = form && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? "Enter an email address like name@school.com." : null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form || !data) return;
        setTriedSave(true);
        if (nameError || contactError || emailError) return;

        // Send only what changed, so empty optional fields never overwrite stored values.
        const original = toForm(data);
        const changes: UpdatePrincipalProfilePayload = {};
        (Object.keys(form) as (keyof ProfileForm)[]).forEach((k) => {
            const next = form[k].trim();
            if (next !== original[k].trim()) changes[k] = next;
        });
        if (Object.keys(changes).length === 0) {
            setEditing(false);
            toast("No changes to save.");
            return;
        }
        try {
            await updateProfile(changes).unwrap();
            toast.success("Details saved.");
            setEditing(false);
            refetch();
        } catch (err) {
            toast.error(errorMessage(err, "Details not saved. Check your connection and try again."));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                // Compress the image before uploading.
                const img = new window.Image();
                img.src = reader.result as string;
                await new Promise((resolve) => {
                    img.onload = resolve;
                });

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
                <button type="button" onClick={() => refetch()} className={`${secondaryBtn} mt-4`}>
                    Try again
                </button>
            </div>
        );
    }

    const profile = data as PrincipalFullProfile & Extra;
    const photo = localImage ?? profile.profileImage;
    const rawSalary = profile.currentSalary ?? profile.salary;
    const salary = rawSalary !== null && rawSalary !== undefined && rawSalary !== "" && Number.isFinite(Number(rawSalary)) ? inr(Number(rawSalary)) : null;
    const doc = [profile.officialDocType, profile.officialDocNumber].filter(Boolean).join(", ");

    const details: Field[] = [
        { label: "Full name", value: profile.fullName },
        { label: "Date of birth", value: formatDate(profile.dob) },
        { label: "Gender", value: sentence(profile.gender) },
        { label: "Contact email", value: profile.email },
        { label: "Primary contact", value: profile.primaryContact },
        { label: "Emergency contact", value: profile.secondaryContact },
        { label: "Designation", value: profile.designation },
        { label: "Department", value: profile.department },
        { label: "Residential address", value: profile.residentialAddress, wide: true },
    ];

    const records: Field[] = [
        { label: "Nationality", value: profile.nationality },
        { label: "Caste", value: profile.caste },
        { label: "Person with disability", value: profile.isPwd === undefined || profile.isPwd === null ? null : profile.isPwd ? "Yes" : "No" },
        { label: "Aadhaar number", value: profile.aadharNo },
        { label: "Employee ID", value: profile.employeeId },
        { label: "Date of joining", value: formatDate(profile.joiningDate) },
        { label: "Highest qualification", value: profile.highestQualification ?? profile.qualifications },
        { label: "Status", value: sentence(profile.status) },
        ...(salary ? [{ label: "Monthly salary", value: salary }] : []),
        { label: "Official document", value: doc || null },
        { label: "Identification mark", value: profile.identificationMark, wide: true },
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
                                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-purple-200 sm:text-4xl">
                                    {profile.fullName?.[0]?.toUpperCase() ?? <User size={36} aria-hidden="true" />}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            aria-label="Change photo"
                            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 bg-purple-600 text-white shadow-lg hover:bg-purple-500 disabled:opacity-60 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            {isUploading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{profile.fullName}</h1>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1.5">
                                <Briefcase size={15} aria-hidden="true" className="text-purple-300" />
                                {profile.designation ?? "Principal"}
                            </span>
                            {profile.employeeId && (
                                <span className="inline-flex items-center gap-1.5 tabular-nums">
                                    <IdCard size={15} aria-hidden="true" className="text-purple-300" />
                                    Employee ID {profile.employeeId}
                                </span>
                            )}
                            {profile.userEmail && (
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <Mail size={15} aria-hidden="true" className="shrink-0 text-purple-300" />
                                    <span className="truncate">{profile.userEmail}</span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            </section>

            <Section
                title={editing ? "Edit details" : "Details"}
                subtitle={editing ? "Changes show across the portal straight away." : "Your contact and role details."}
                action={
                    !editing && (
                        <button type="button" onClick={startEditing} className={secondaryBtn}>
                            <Pencil size={15} aria-hidden="true" />
                            Edit details
                        </button>
                    )
                }
            >
                {editing && form ? (
                    <form onSubmit={handleSave} noValidate>
                        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                            <FormField id="pf-name" label="Full name" required autoFocus value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} error={triedSave ? nameError : null} />
                            <FormField id="pf-dob" label="Date of birth" type="date" value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} />
                            <div>
                                <label htmlFor="pf-gender" className="block text-sm font-medium text-gray-700">
                                    Gender <span className="font-normal text-gray-500">(optional)</span>
                                </label>
                                <select id="pf-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={`mt-1.5 ${inputClass}`}>
                                    <option value="">Not added</option>
                                    {GENDERS.map((g) => (
                                        <option key={g.value} value={g.value}>
                                            {g.label}
                                        </option>
                                    ))}
                                    {form.gender && !GENDERS.some((g) => g.value === form.gender) && <option value={form.gender}>{sentence(form.gender)}</option>}
                                </select>
                            </div>
                            <FormField id="pf-email" label="Contact email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} error={triedSave ? emailError : null} />
                            <FormField id="pf-primary" label="Primary contact" type="tel" required value={form.primaryContact} onChange={(v) => setForm({ ...form, primaryContact: v })} error={triedSave ? contactError : null} />
                            <FormField id="pf-secondary" label="Emergency contact" type="tel" value={form.secondaryContact} onChange={(v) => setForm({ ...form, secondaryContact: v })} />
                            <FormField id="pf-designation" label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
                            <FormField id="pf-department" label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
                            <div className="sm:col-span-2 lg:col-span-3">
                                <FormField id="pf-address" label="Residential address" value={form.residentialAddress} onChange={(v) => setForm({ ...form, residentialAddress: v })} />
                            </div>
                        </div>
                        <p className="px-4 pb-4 text-xs text-gray-500 sm:px-6">Your sign-in email ({profile.userEmail}) doesn&apos;t change here.</p>
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button type="button" onClick={() => setEditing(false)} className={`${secondaryBtn} h-10`}>
                                Cancel
                            </button>
                            <button type="submit" disabled={isUpdating} className={primaryBtn}>
                                {isUpdating ? "Saving…" : "Save details"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <Details fields={details} />
                )}
            </Section>

            <Section title="School record" subtitle="Held by the school office. Ask them to correct anything here.">
                <Details fields={records} />
            </Section>
        </div>
    );
}
