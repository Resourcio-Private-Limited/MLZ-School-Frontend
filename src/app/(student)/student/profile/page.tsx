"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Lock, Edit2, Save, X, Upload } from "lucide-react";
import { useState, useRef } from "react";

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock student data - replace with actual data from backend
    const [studentData, setStudentData] = useState({
        personal: {
            image: "/MLZS_contents/Students Stage 1.png", // Placeholder
            fullName: "Student Name",
            dob: "01/01/2010",
            gender: "Male",
            residentialAddress: "123 Main Street, City, State - 123456",
            nationality: "Indian",
            caste: "General",
            pwd: "No",
            aadharNo: "1234 5678 9012",
            primaryContact: "+91 98765 43210",
            secondaryContact: "+91 98765 43211",
            email: "student@school.com",
            identificationMark: "Mole on left cheek"
        },
        academic: {
            admissionNo: "MLZS/2023/001",
            admissionYear: "2023",
            dateOfAdmission: "15/04/2023",
            currentClass: "Class 10",
            currentSection: "A",
            rollNo: "ENZK001",
            passingYear: "2025",
            transportationFees: "Yes"
        }
    });

    // Editable fields state
    const [editableData, setEditableData] = useState({
        primaryContact: studentData.personal.primaryContact,
        secondaryContact: studentData.personal.secondaryContact,
        identificationMark: studentData.personal.identificationMark,
        residentialAddress: studentData.personal.residentialAddress,
        pwd: studentData.personal.pwd,
        image: studentData.personal.image
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        // Reset editable data to original values
        setEditableData({
            primaryContact: studentData.personal.primaryContact,
            secondaryContact: studentData.personal.secondaryContact,
            identificationMark: studentData.personal.identificationMark,
            residentialAddress: studentData.personal.residentialAddress,
            pwd: studentData.personal.pwd,
            image: studentData.personal.image
        });
        setIsEditing(false);
    };

    const handleSave = () => {
        // TODO: Send updated data to backend API
        setStudentData({
            ...studentData,
            personal: {
                ...studentData.personal,
                primaryContact: editableData.primaryContact,
                secondaryContact: editableData.secondaryContact,
                identificationMark: editableData.identificationMark,
                residentialAddress: editableData.residentialAddress,
                pwd: editableData.pwd,
                image: editableData.image
            }
        });
        setIsEditing(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // TODO: Upload to backend and get URL
            // For now, create a local preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditableData({
                    ...editableData,
                    image: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800">Student Profile</h1>
            </div>

            {/* Personal Details Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6 border-b pb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Personal Details</h2>
                    {!isEditing ? (
                        <button
                            onClick={handleEdit}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit2 size={18} />
                            <span>Edit</span>
                        </button>
                    ) : (
                        <div className="flex space-x-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Save size={18} />
                                <span>Save</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <X size={18} />
                                <span>Cancel</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Image */}
                    <div className="md:col-span-1 flex flex-col items-center">
                        <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 mb-3 relative group">
                            <Image
                                src={isEditing ? editableData.image : studentData.personal.image}
                                alt="Student Photo"
                                width={160}
                                height={160}
                                className="object-cover w-full h-full"
                            />
                            {isEditing && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Upload className="text-white" size={32} />
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <p className="text-sm text-gray-500">Student Photo</p>
                        {isEditing && (
                            <p className="text-xs text-blue-600 mt-1">Click to upload</p>
                        )}
                    </div>

                    {/* Personal Information Grid */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField label="Full Name" value={studentData.personal.fullName} />
                        <InfoField label="Date of Birth" value={studentData.personal.dob} />
                        <InfoField label="Gender" value={studentData.personal.gender} />
                        <InfoField label="Nationality" value={studentData.personal.nationality} />
                        <InfoField label="Caste" value={studentData.personal.caste} />

                        {/* PWD - Editable */}
                        {isEditing ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">PWD</label>
                                <select
                                    value={editableData.pwd}
                                    onChange={(e) => setEditableData({ ...editableData, pwd: e.target.value })}
                                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        ) : (
                            <InfoField label="PWD" value={studentData.personal.pwd} />
                        )}

                        <InfoField label="Aadhar No." value={studentData.personal.aadharNo} />

                        {/* Primary Contact - Editable */}
                        {isEditing ? (
                            <EditableField
                                label="Primary Contact No."
                                value={editableData.primaryContact}
                                onChange={(value) => setEditableData({ ...editableData, primaryContact: value })}
                            />
                        ) : (
                            <InfoField label="Primary Contact No." value={studentData.personal.primaryContact} />
                        )}

                        {/* Secondary Contact - Editable */}
                        {isEditing ? (
                            <EditableField
                                label="Secondary Contact No."
                                value={editableData.secondaryContact}
                                onChange={(value) => setEditableData({ ...editableData, secondaryContact: value })}
                            />
                        ) : (
                            <InfoField label="Secondary Contact No." value={studentData.personal.secondaryContact} />
                        )}

                        <InfoField label="Email ID" value={studentData.personal.email} />

                        {/* Identification Mark - Editable */}
                        {isEditing ? (
                            <EditableField
                                label="Identification Mark"
                                value={editableData.identificationMark}
                                onChange={(value) => setEditableData({ ...editableData, identificationMark: value })}
                                className="md:col-span-2"
                            />
                        ) : (
                            <InfoField label="Identification Mark" value={studentData.personal.identificationMark} className="md:col-span-2" />
                        )}

                        {/* Residential Address - Editable */}
                        {isEditing ? (
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Residential Address</label>
                                <textarea
                                    value={editableData.residentialAddress}
                                    onChange={(e) => setEditableData({ ...editableData, residentialAddress: e.target.value })}
                                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={2}
                                />
                            </div>
                        ) : (
                            <InfoField label="Residential Address" value={studentData.personal.residentialAddress} className="md:col-span-2" />
                        )}
                    </div>
                </div>
            </div>

            {/* Academic Details Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Academic Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoField label="Admission No." value={studentData.academic.admissionNo} />
                    <InfoField label="Admission Year" value={studentData.academic.admissionYear} />
                    <InfoField label="Date of Admission" value={studentData.academic.dateOfAdmission} />
                    <InfoField label="Current Class" value={studentData.academic.currentClass} />
                    <InfoField label="Current Section" value={studentData.academic.currentSection} />
                    <InfoField label="Roll No. (ENZK)" value={studentData.academic.rollNo} />
                    <InfoField label="Passing Year" value={studentData.academic.passingYear} />
                    <InfoField label="Transportation Fees" value={studentData.academic.transportationFees} />
                </div>
            </div>


            {/* Reset Password Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Reset Password</h2>

                <p className="text-gray-600 mb-4">Click the button below to reset your password securely.</p>

                <Link href="/student/profile/reset-password">
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200">
                        <Lock size={18} />
                        <span>Reset Password</span>
                    </button>
                </Link>
            </div>
        </div>
    );
}

// Reusable component for displaying information fields
function InfoField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
    return (
        <div className={`${className}`}>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            <p className="text-gray-800 font-medium">{value}</p>
        </div>
    );
}

// Editable field component
function EditableField({
    label,
    value,
    onChange,
    className = ""
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <div className={`${className}`}>
            <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full border border-blue-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        </div>
    );
}
