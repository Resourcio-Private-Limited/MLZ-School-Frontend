"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAddStudentMutation, type ClassroomSummary } from "@/redux/api/principalApi";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { errorMessage, focusRing, inputClass, primaryBtn, secondaryBtn } from "@/components/principal/ui";
import { todayLocal } from "@/lib/dates";

/** Admission form for one class, in a dialog (a bottom sheet on phones). */
export default function ClassroomAdmissionForm({
    open,
    classroom,
    classroomId,
    onClose,
    onSuccess,
}: {
    open: boolean;
    classroom: ClassroomSummary;
    classroomId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} labelledBy="admission-title" className="sm:max-w-3xl">
            <AdmissionBody classroom={classroom} classroomId={classroomId} onClose={onClose} onSuccess={onSuccess} />
        </Dialog>
    );
}

function AdmissionBody({ classroom, classroomId, onClose, onSuccess }: { classroom: ClassroomSummary; classroomId: string; onClose: () => void; onSuccess: () => void }) {
    const [addStudent, { isLoading }] = useAddStudentMutation();
    const [showPassword, setShowPassword] = useState(false);
    const currentYear = new Date().getFullYear();

    // Generated once per opening, as before.
    const [admissionNumber] = useState(() => {
        const suffix = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
        return `MLZS/${currentYear}/${classroomId.substring(0, 4).toUpperCase()}/${suffix}`;
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const get = (key: string) => ((formData.get(key) as string | null) ?? "").trim();

        const fullName = get("fullName");
        const password = formData.get("password") as string;
        if (!password) {
            toast.error("Set a login password for the student.");
            return;
        }

        const email = get("email") || `${fullName.toLowerCase().replace(/\s+/g, ".")}@student.mlzs.edu.in`;
        const parentName = [get("fatherName"), get("motherName")].filter(Boolean).join(" / ");
        const parentContact = [get("fatherContact"), get("motherContact")].filter(Boolean).join(" / ");

        try {
            await addStudent({
                userEmail: email,
                password,
                admissionNumber,
                admissionYear: currentYear,
                rollNumber: undefined,
                fullName,
                dob: get("dob"),
                gender: get("gender"),
                residentialAddress: get("residentialAddress"),
                primaryContact: get("primaryContact"),
                secondaryContact: get("secondaryContact") || undefined,
                nationality: get("nationality") || "Indian",
                caste: get("caste") || undefined,
                isPwd: get("isPwd") === "yes",
                aadharNo: get("aadharNo") || undefined,
                identificationMark: get("identificationMark") || undefined,
                parentName: parentName || undefined,
                parentContact: parentContact || undefined,
                transportOpted: get("transportOpted") === "yes",
                classroomId,
            }).unwrap();

            toast.success(`${fullName} admitted to ${classroom.name}.`);
            onSuccess();
        } catch (err) {
            toast.error(errorMessage(err, "Couldn't admit the student. Check the details and try again."));
        }
    };

    return (
        <>
            <DialogHeader id="admission-title" title="Admit student" subtitle={`${classroom.name}, grade ${classroom.grade}`} onClose={onClose} accent="purple" />
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
                    <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200">
                        Admission number <span className="font-medium tabular-nums text-gray-900">{admissionNumber}</span> will be given to this student.
                    </p>

                    <FormSection title="Login" hint="The student signs in to the student portal with these.">
                        <TextField name="email" label="Email" type="email" required placeholder="student@mlzs.edu.in" autoComplete="off" />
                        <div>
                            <label htmlFor="admission-password" className="block text-sm font-medium text-gray-700">
                                Password <Req />
                            </label>
                            <div className="relative mt-1.5">
                                <input
                                    id="admission-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="new-password"
                                    aria-describedby="admission-password-hint"
                                    className={`${inputClass} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                    className={`absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 ${focusRing}`}
                                >
                                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                                </button>
                            </div>
                            <p id="admission-password-hint" className="mt-1 text-xs text-gray-500">
                                Share it with the family after admission.
                            </p>
                        </div>
                    </FormSection>

                    <FormSection title="Student">
                        <TextField name="fullName" label="Full name" required placeholder="As on the birth certificate" wide />
                        <TextField name="dob" label="Date of birth" type="date" max={todayLocal()} required />
                        <ChoiceChips
                            name="gender"
                            label="Gender"
                            required
                            options={[
                                { value: "MALE", label: "Male" },
                                { value: "FEMALE", label: "Female" },
                                { value: "OTHER", label: "Other" },
                            ]}
                        />
                        <TextField name="nationality" label="Nationality" defaultValue="Indian" />
                        <TextField name="caste" label="Caste" />
                        <ChoiceChips
                            name="isPwd"
                            label="Person with disability"
                            defaultValue="no"
                            options={[
                                { value: "no", label: "No" },
                                { value: "yes", label: "Yes" },
                            ]}
                        />
                        <TextField name="aadharNo" label="Aadhaar number" inputMode="numeric" maxLength={12} hint="12 digits, no spaces." />
                        <TextField name="identificationMark" label="Identification mark" placeholder="For example, a mole on the left cheek" wide />
                    </FormSection>

                    <FormSection title="Contact">
                        <TextField name="primaryContact" label="Primary contact" type="tel" required placeholder="+91 98765 43210" />
                        <TextField name="secondaryContact" label="Emergency contact" type="tel" placeholder="+91 98765 43210" />
                        <div className="sm:col-span-2">
                            <label htmlFor="admission-residentialAddress" className="block text-sm font-medium text-gray-700">
                                Home address <Req />
                            </label>
                            <textarea id="admission-residentialAddress" name="residentialAddress" required rows={3} className={`${inputClass} mt-1.5 resize-y`} placeholder="House, street, area, city and PIN code" />
                        </div>
                    </FormSection>

                    <FormSection title="Parents or guardians" hint="Saved together as the parent name and contact.">
                        <TextField name="fatherName" label="Father's name" />
                        <TextField name="fatherContact" label="Father's phone" type="tel" />
                        <TextField name="motherName" label="Mother's name" />
                        <TextField name="motherContact" label="Mother's phone" type="tel" />
                    </FormSection>

                    <FormSection title="Transport">
                        <ChoiceChips
                            name="transportOpted"
                            label="Uses school transport"
                            required
                            defaultValue="no"
                            options={[
                                { value: "no", label: "No" },
                                { value: "yes", label: "Yes" },
                            ]}
                        />
                    </FormSection>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className={secondaryBtn}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isLoading} className={primaryBtn}>
                        <UserPlus size={16} aria-hidden="true" />
                        {isLoading ? "Admitting…" : "Admit student"}
                    </button>
                </div>
            </form>
        </>
    );
}

function Req() {
    return (
        <span className="text-red-600" aria-hidden="true">
            *
        </span>
    );
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <fieldset>
            <legend className="text-sm font-semibold text-gray-900">{title}</legend>
            {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
        </fieldset>
    );
}

function TextField({
    name,
    label,
    hint,
    wide,
    required,
    ...rest
}: { name: string; label: string; hint?: string; wide?: boolean; required?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
    const id = `admission-${name}`;
    return (
        <div className={wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label} {required && <Req />}
            </label>
            <input id={id} name={name} required={required} aria-describedby={hint ? `${id}-hint` : undefined} className={`${inputClass} mt-1.5`} {...rest} />
            {hint && (
                <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">
                    {hint}
                </p>
            )}
        </div>
    );
}

/** Radio buttons styled as chips; they post with the form like any radio group. */
function ChoiceChips({ name, label, options, defaultValue, required }: { name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string; required?: boolean }) {
    return (
        <fieldset>
            <legend className="block text-sm font-medium text-gray-700">
                {label} {required && <Req />}
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
                {options.map((o) => (
                    <label key={o.value} className="cursor-pointer">
                        <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} required={required} className="peer sr-only" />
                        <span className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:border-gray-400 motion-safe:transition-colors peer-checked:border-purple-600 peer-checked:bg-purple-50 peer-checked:text-purple-800 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-1">
                            {o.label}
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    );
}
