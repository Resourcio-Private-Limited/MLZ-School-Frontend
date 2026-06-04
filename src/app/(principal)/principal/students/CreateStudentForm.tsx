"use client";

import { useState, useMemo } from "react";
import { Plus, X, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAddStudentMutation, ClassroomSummary } from "@/redux/api/principalApi";

const MAX_STUDENTS_PER_SECTION = 100;
const ROLL_PREFIX = "EZNK";

export default function CreateStudentForm({ classrooms }: { classrooms: ClassroomSummary[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedClassroomId, setSelectedClassroomId] = useState("");

    const [addStudent] = useAddStudentMutation();

    const selectedClassroom = useMemo(
        () => classrooms.find(c => c.id === selectedClassroomId) ?? null,
        [classrooms, selectedClassroomId],
    );
    // Each ClassroomSummary is a single grade+section (e.g. "Class 1 - Section A").
    // Capacity check uses the per-classroom `total` (student count).
    const currentStudentCount = selectedClassroom?.total ?? 0;
    const availableCapacity = (selectedClassroom?.capacity ?? 0) - currentStudentCount;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const formEl = e.currentTarget;
        const fd = new FormData(formEl);
        const email = (fd.get("email") as string)?.trim() ?? "";
        const password = (fd.get("password") as string) ?? "";
        if (!email || !password) {
            setError("Email and Password are mandatory for student login.");
            return;
        }
        if (!selectedClassroomId) {
            setError("Please select a Class.");
            return;
        }
        if (availableCapacity <= 0) {
            setError("Selected class is full.");
            return;
        }

        const rollNumberRaw = (fd.get("rollNumber") as string) || "";
        const rollNumber = rollNumberRaw
            ? (rollNumberRaw.startsWith(ROLL_PREFIX) ? rollNumberRaw : `${ROLL_PREFIX}${rollNumberRaw}`)
            : undefined;

        const fatherName = (fd.get("fatherName") as string)?.trim() ?? "";
        const motherName = (fd.get("motherName") as string)?.trim() ?? "";
        const fatherContact = (fd.get("fatherContact") as string)?.trim() ?? "";
        const motherContact = (fd.get("motherContact") as string)?.trim() ?? "";

        // Combine parents into the existing parentName / parentContact columns
        // (so the backend doesn't need a schema change). Format: "Father / Mother".
        const combinedParentName = [fatherName, motherName].filter(Boolean).join(" / ");
        const combinedParentContact = [fatherContact, motherContact].filter(Boolean).join(" / ");

        const data = {
            userEmail: email,
            password,
            admissionNumber: fd.get("admissionNumber") as string,
            admissionYear: parseInt((fd.get("admissionYear") as string) || String(new Date().getFullYear()), 10),
            admissionDate: fd.get("admissionDate") as string,
            rollNumber,
            transportOpted: fd.get("transportOpted") === "on",
            fullName: fd.get("fullName") as string,
            dob: fd.get("dob") as string,
            gender: fd.get("gender") as "MALE" | "FEMALE" | "OTHER",
            residentialAddress: fd.get("residentialAddress") as string,
            primaryContact: fd.get("primaryContact") as string,
            secondaryContact: (fd.get("secondaryContact") as string) || undefined,
            parentName: combinedParentName || undefined,
            parentContact: combinedParentContact || undefined,
            nationality: (fd.get("nationality") as string) || "Indian",
            caste: (fd.get("caste") as string) || undefined,
            isPwd: fd.get("isPwd") === "yes",
            aadharNo: (fd.get("aadharNo") as string) || undefined,
            identificationMark: (fd.get("identificationMark") as string) || undefined,
            email,
            classroomId: selectedClassroomId,
        };

        setLoading(true);
        try {
            await addStudent(data as any).unwrap();
            toast.success("Student admitted successfully!");
            setIsOpen(false);
            setSelectedClassroomId("");
            formEl.reset();
        } catch (err: any) {
            const msg = err?.data?.message ?? "Failed to create student.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-md hover:shadow-lg"
            >
                <Plus size={20} />
                <span>Admit Student</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50 sticky top-0 z-20">
                    <h2 className="text-xl font-bold text-gray-800">Admit New Student</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start space-x-2">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── Personal Details ─────────────────────────────── */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Student Full Name <span className="text-red-500">*</span></label>
                                <input name="fullName" required className="input" placeholder="Student Name" />
                            </div>
                            <div>
                                <label className="label">Gender <span className="text-red-500">*</span></label>
                                <select name="gender" required className="input">
                                    <option value="">Select</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                                <input name="dob" type="date" required className="input" />
                            </div>
                            <div>
                                <label className="label">Nationality</label>
                                <input name="nationality" className="input" placeholder="Nationality" defaultValue="Indian" />
                            </div>
                            <div>
                                <label className="label">Caste</label>
                                <input name="caste" className="input" placeholder="Caste" />
                            </div>
                            <div>
                                <label className="label">PWD (Yes/No)</label>
                                <select name="isPwd" className="input">
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Aadhar No.</label>
                                <input name="aadharNo" className="input" placeholder="12-digit Aadhar" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Identification Mark (if any)</label>
                                <input name="identificationMark" className="input" placeholder="e.g., mole on left cheek" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Residential Address <span className="text-red-500">*</span></label>
                                <textarea name="residentialAddress" required className="input h-20"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* ── Academic Details ─────────────────────────────── */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Academic Details</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Admission No. <span className="text-red-500">*</span></label>
                                <input name="admissionNumber" required className="input" placeholder="ADM-2026-001" />
                            </div>
                            {/* <div>
                                <label className="label">Roll Number (EZNK)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-xs font-mono">EZNK</span>
                                    <input name="rollNumber" className="input rounded-l-none" placeholder="0001" />
                                </div>
                            </div> */}
                            <div>
                                <label className="label">Date of Admission <span className="text-red-500">*</span></label>
                                <input name="admissionDate" type="date" required className="input"
                                    defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div>
                                <label className="label">Admission Year</label>
                                <input name="admissionYear" type="number" className="input"
                                    defaultValue={new Date().getFullYear()} />
                            </div>
                            <div>
                                <label className="label">Class (Grade + Section) <span className="text-red-500">*</span></label>
                                <select
                                    name="classroomId"
                                    required
                                    className="input"
                                    value={selectedClassroomId}
                                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                                >
                                    <option value="">Select Class</option>
                                    {classrooms.map(c => {
                                        const isFull = c.total >= c.capacity;
                                        return (
                                            <option key={c.id} value={c.id} disabled={isFull}>
                                                {c.name} ({c.total}/{c.capacity}) {isFull ? '- FULL' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Capacity Indicator */}
                        {selectedClassroom && (
                            <div className={`mt-3 p-3 rounded-lg border ${availableCapacity > 20
                                ? 'bg-green-50 border-green-200'
                                : availableCapacity > 0
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center space-x-2 text-sm">
                                    <Users size={16} className={
                                        availableCapacity > 20
                                            ? 'text-green-600'
                                            : availableCapacity > 0
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                    } />
                                    <span className={`font-medium ${availableCapacity > 20
                                        ? 'text-green-700'
                                        : availableCapacity > 0
                                            ? 'text-yellow-700'
                                            : 'text-red-700'}`}>
                                        {availableCapacity > 0
                                            ? `${availableCapacity} seat${availableCapacity !== 1 ? 's' : ''} available`
                                            : 'Section is full'}
                                    </span>
                                    <span className="text-gray-500">
                                        ({currentStudentCount}/{selectedClassroom.capacity} students)
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                            <input id="transportOpted" name="transportOpted" type="checkbox" className="w-4 h-4" />
                            <label htmlFor="transportOpted" className="text-sm text-gray-700">Avail Transportation Service</label>
                        </div>
                    </div>

                    {/* ── Parent / Guardian & Contact ──────────────────── */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Parent / Guardian Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Father&apos;s Name</label>
                                <input name="fatherName" className="input" placeholder="e.g. Mr. Rajesh Kumar" />
                            </div>
                            <div>
                                <label className="label">Father&apos;s Contact No.</label>
                                <input name="fatherContact" type="tel" className="input" placeholder="+91..." />
                            </div>
                            <div>
                                <label className="label">Mother&apos;s Name</label>
                                <input name="motherName" className="input" placeholder="e.g. Mrs. Priya Kumar" />
                            </div>
                            <div>
                                <label className="label">Mother&apos;s Contact No.</label>
                                <input name="motherContact" type="tel" className="input" placeholder="+91..." />
                            </div>
                            <div>
                                <label className="label">Primary Contact Number <span className="text-red-500">*</span></label>
                                <input name="primaryContact" required className="input" placeholder="+91..." />
                            </div>
                            <div>
                                <label className="label">Secondary / Emergency Contact No.</label>
                                <input name="secondaryContact" type="tel" className="input" placeholder="+91..." />
                            </div>
                        </div>
                    </div>

                    {/* ── Login Credentials ────────────────────────────── */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Login Credentials
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Email ID <span className="text-red-500">*</span></label>
                                <input name="email" type="email" required className="input"
                                    placeholder="student@example.com" />
                            </div>
                            <div>
                                <label className="label">Password <span className="text-red-500">*</span></label>
                                <input name="password" type="text" required minLength={6} className="input"
                                    placeholder="Min 6 characters" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3 z-20 relative">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || availableCapacity <= 0}
                            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Admitting..." : "Admit Student"}
                        </button>
                    </div>
                </form>
            </div>
            <style jsx>{`
                .label { display: block; font-size: 0.875rem; font-weight: 700; color: #374151; margin-bottom: 0.25rem; }
                .input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem; color: #111827; background: white; }
                .input:disabled { background-color: #f3f4f6; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
