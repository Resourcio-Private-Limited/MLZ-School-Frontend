"use client";

import { useState } from "react";
import { X, AlertCircle, Calendar, Award, User as UserIcon, Eye, EyeOff } from "lucide-react";
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
    const [error, setError] = useState("");
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
        setError("");
        const form = e.currentTarget;
        const formData = new FormData(form);

        const fullName = formData.get("fullName") as string;
        const dob = formData.get("dob") as string;
        const gender = formData.get("gender") as string;
        const residentialAddress = formData.get("residentialAddress") as string;
        const primaryContact = formData.get("primaryContact") as string;
        const parentName = formData.get("parentName") as string;
        const parentContact = formData.get("parentContact") as string;

        const password = formData.get("password") as string;
        if (!password) {
            setError("Password is required");
            return;
        }

        const email = (formData.get("email") as string) || `${fullName.toLowerCase().replace(/\s+/g, '.')}@student.mlzs.edu.in`;

        try {
            await addStudent({
                userEmail: email,
                password,
                admissionNumber,
                admissionYear: currentYear,
                fullName,
                dob,
                gender,
                residentialAddress,
                primaryContact,
                parentName: parentName || undefined,
                parentContact: parentContact || undefined,
                classroomId,
            }).unwrap();

            onSuccess();
        } catch (err: any) {
            setError(err?.data?.message ?? "Failed to admit student. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Admit New Student</h2>
                        <p className="text-purple-100 text-sm mt-1">{classroom.name} &mdash; Grade {classroom.grade}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start space-x-2">
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Auto-Generated Info */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                            <Award size={18} />
                            <span>Admission Information</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-purple-600 font-medium">Admission No</p>
                                <p className="text-purple-900 font-mono font-semibold">{admissionNumber}</p>
                            </div>
                            <div>
                                <p className="text-purple-600 font-medium">Admission Date</p>
                                <p className="text-purple-900 font-semibold">{new Date(currentDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-purple-600 font-medium">Academic Year</p>
                                <p className="text-purple-900 font-semibold">{academicYear}</p>
                            </div>
                            <div>
                                <p className="text-purple-600 font-medium">Expected Passing Year</p>
                                <p className="text-purple-900 font-semibold">{passingYear}</p>
                            </div>
                        </div>
                    </div>

                    {/* Login Credentials */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                            <UserIcon size={18} />
                            <span>Login Credentials</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Student Email</label>
                                <input name="email" type="email" className="input" placeholder="student@mlzs.edu.in" />
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
                                <label className="label">Primary Contact <span className="text-red-500">*</span></label>
                                <input name="primaryContact" required className="input" placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Residential Address <span className="text-red-500">*</span></label>
                                <textarea name="residentialAddress" required className="input h-20" placeholder="Enter complete address"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Parent Details */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Parent Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Parent/Guardian Name <span className="text-red-500">*</span></label>
                                <input name="parentName" required className="input" placeholder="Parent or Guardian name" />
                            </div>
                            <div>
                                <label className="label">Parent Contact <span className="text-red-500">*</span></label>
                                <input name="parentContact" required className="input" placeholder="+91 XXXXX XXXXX" />
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