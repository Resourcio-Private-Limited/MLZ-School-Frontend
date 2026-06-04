"use client";

import { useState } from "react";
import { X, User as UserIcon, Eye, EyeOff } from "lucide-react";
import toast from 'react-hot-toast';
import { useAddStudentMutation } from "@/redux/api/principalApi";

type Classroom = {
    id: string;
    name: string;
    grade: string;
    section: string;
    capacity: number;
    total: number;
    classTeacher: { id: string; fullName: string; employeeId: string } | null;
};

export default function ClassroomAdmissionForm({
    classroom,
    classroomId,
    onClose,
    onSuccess,
}: {
    classroom: Classroom;
    classroomId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [addStudent, { isLoading }] = useAddStudentMutation();
    const [showPassword, setShowPassword] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toISOString().split('T')[0];

    const generateAdmissionNo = () => {
        const suffix = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        return `MLZS/${currentYear}/${classroomId.substring(0, 4).toUpperCase()}/${suffix}`;
    };

    const [admissionNumber] = useState(generateAdmissionNo);
    const passingYear = currentYear + (12 - parseInt(classroom.grade || "1")) + 1;
    const academicYear = `${currentYear}-${currentYear + 1}`;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const fullName = formData.get("fullName") as string;
        const dob = formData.get("dob") as string;
        const gender = formData.get("gender") as string;
        const residentialAddress = formData.get("residentialAddress") as string;
        const primaryContact = formData.get("primaryContact") as string;
        const secondaryContact = formData.get("secondaryContact") as string;
        const nationality = formData.get("nationality") as string;
        const caste = formData.get("caste") as string;
        const isPwd = formData.get("isPwd") === "yes";
        const aadharNo = formData.get("aadharNo") as string;
        const identificationMark = formData.get("identificationMark") as string;
        const rollNumber = formData.get("rollNumber") as string;

        const fatherName = formData.get("fatherName") as string;
        const fatherContact = formData.get("fatherContact") as string;
        const motherName = formData.get("motherName") as string;
        const motherContact = formData.get("motherContact") as string;

        // Transportation: "yes" → opted-in, "no" → not opted-in
        const transportOpted = (formData.get("transportOpted") as string) === "yes";

        const password = formData.get("password") as string;
        if (!password) {
            toast.error("Password is required");
            return;
        }

        const email = (formData.get("email") as string) || `${fullName.toLowerCase().replace(/\s+/g, '.')}@student.mlzs.edu.in`;

        // Combine parents into parentName / parentContact columns
        const combinedParentName = [fatherName, motherName].filter(Boolean).join(" / ");
        const combinedParentContact = [fatherContact, motherContact].filter(Boolean).join(" / ");

        const rollNumberFormatted = rollNumber
            ? (rollNumber.startsWith("EZNK") ? rollNumber : `EZNK${rollNumber}`)
            : undefined;

        try {
            await addStudent({
                userEmail: email,
                password,
                admissionNumber,
                admissionYear: currentYear,
                rollNumber: rollNumberFormatted,
                fullName,
                dob,
                gender,
                residentialAddress,
                primaryContact,
                secondaryContact: secondaryContact || undefined,
                nationality: nationality || "Indian",
                caste: caste || undefined,
                isPwd,
                aadharNo: aadharNo || undefined,
                identificationMark: identificationMark || undefined,
                parentName: combinedParentName || undefined,
                parentContact: combinedParentContact || undefined,
                transportOpted,
                classroomId,
            }).unwrap();

            toast.success("Student admitted successfully!");
            onSuccess();
        } catch (err: any) {
            toast.error(err?.data?.message ?? "Failed to admit student. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Admit New Student</h2>
                        <p className="text-purple-100 text-sm mt-1">{classroom.name} &mdash; Grade {classroom.grade}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Login Credentials */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                            <UserIcon size={18} />
                            <span>Login Credentials</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Student Email<span className="text-red-500">*</span></label>
                                <input name="email" type="email" required className="input" placeholder="student@mlzs.edu.in" />
                            </div>
                            <div>
                                <label className="label">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="input pr-10"
                                        placeholder="Set student login password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                            <UserIcon size={18} />
                            <span>Personal Details</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Full Name <span className="text-red-500">*</span></label>
                                <input name="fullName" required className="input" placeholder="Enter student's full name" />
                            </div>
                            <div>
                                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                                <input name="dob" type="date" required className="input" />
                            </div>
                            <div>
                                <label className="label">Gender <span className="text-red-500">*</span></label>
                                <select name="gender" required className="input">
                                    <option value="">Select Gender</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
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
                            <div>
                                <label className="label">Identification Mark (if any)</label>
                                <input name="identificationMark" className="input" placeholder="e.g., mole on left cheek" />
                            </div>
                            <div>
                                <label className="label">Primary Contact <span className="text-red-500">*</span></label>
                                <input name="primaryContact" required className="input" placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div>
                                <label className="label">Secondary / Emergency Contact</label>
                                <input name="secondaryContact" className="input" placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Residential Address <span className="text-red-500">*</span></label>
                                <textarea name="residentialAddress" required className="input h-20" placeholder="Enter complete address"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Academic Details */}
                    {/* <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Academic Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Roll Number (EZNK)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-2 rounded-l border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-xs font-mono">EZNK</span>
                                    <input name="rollNumber" className="input rounded-l-none" placeholder="0001" />
                                </div>
                            </div>
                        </div>
                    </div> */}

                    {/* Parent / Guardian Details */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Parent / Guardian Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Father's Name</label>
                                <input name="fatherName" className="input" placeholder="e.g. Mr. Rajesh Kumar" />
                            </div>
                            <div>
                                <label className="label">Father's Contact No.</label>
                                <input name="fatherContact" type="tel" className="input" placeholder="+91..." />
                            </div>
                            <div>
                                <label className="label">Mother's Name</label>
                                <input name="motherName" className="input" placeholder="e.g. Mrs. Priya Kumar" />
                            </div>
                            <div>
                                <label className="label">Mother's Contact No.</label>
                                <input name="motherContact" type="tel" className="input" placeholder="+91..." />
                            </div>
                        </div>
                    </div>

                    {/* Transportation Service */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Transportation Service</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="label">
                                    Do you need transportation service? <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-6 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="transportOpted"
                                            value="yes"
                                            required
                                            defaultChecked={false}
                                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700 font-medium">Yes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="transportOpted"
                                            value="no"
                                            required
                                            defaultChecked
                                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                        />
                                        <span className="text-gray-700 font-medium">No</span>
                                    </label>
                                </div>
                                {/* <p className="text-xs text-gray-500 mt-2">
                                    If Yes, the school transport office will assign a bus route and stop after admission.
                                </p> */}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="pt-4 flex justify-end space-x-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg"
                        >
                            {isLoading ? "Admitting..." : "Admit Student"}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 0.375rem;
                }
                .input {
                    width: 100%;
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    padding: 0.625rem;
                    color: #111827;
                    transition: all 0.2s;
                }
                .input:focus {
                    outline: none;
                    border-color: #9333ea;
                    ring: 2px;
                    ring-color: #9333ea20;
                }
            `}</style>
        </div>
    );
}