"use client";

import Image from "next/image";
import Link from "next/link";
import {
    Edit2,
    Save,
    X,
    Upload,
    User,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Briefcase,
    IdCard,
    GraduationCap,
    Book,
    Lock,
    Shield,
    IndianRupee,
    FileText,
    Activity
} from "lucide-react";
import { useState, useRef } from "react";

export default function TeacherProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mock teacher data
    const [teacherData, setTeacherData] = useState({
        personal: {
            image: "/MLZS_contents/Students Stage 1.png", // Using same placeholder as student for now
            name: "Rajesh Kumar",
            email: "rajesh.kumar@school.com",
            phone: "+91 98765 43210",
            dob: "1985-05-15",
            address: "123, Green Avenue, Mumbai, Maharashtra",
            bloodGroup: "O+",
            gender: "Male"
        },
        official: {
            employeeId: "TCH-2015-042",
            designation: "Teacher", // Options: "Teacher", "Principal", "Accountant", "Staff"
            department: "Science & Mathematics",
            subjects: "Mathematics, Physics",
            qualifications: ["M.Sc. Mathematics", "B.Ed.", "PhD (Pursuing)"],
            joiningDate: "2015-06-01",
            currentSalary: "55,000",
            status: "Active",
            officialDocumentNumber: "PAN: ABCDE1234F",
            classTeacherOf: "10-A"
        }
    });

    // Editable fields state
    const [editableData, setEditableData] = useState({
        phone: teacherData.personal.phone,
        address: teacherData.personal.address,
        image: teacherData.personal.image,
        bloodGroup: teacherData.personal.bloodGroup
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditableData({
            phone: teacherData.personal.phone,
            address: teacherData.personal.address,
            image: teacherData.personal.image,
            bloodGroup: teacherData.personal.bloodGroup
        });
        setIsEditing(false);
    };

    const handleSave = () => {
        // TODO: Send updated data to backend API
        setTeacherData({
            ...teacherData,
            personal: {
                ...teacherData.personal,
                phone: editableData.phone,
                address: editableData.address,
                image: editableData.image,
                bloodGroup: editableData.bloodGroup
            }
        });
        setIsEditing(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* 1. Dark Hero Section (Top 40% visual weight) */}
            <div className="bg-slate-900 pt-12 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                        {/* Profile Image */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-700 overflow-hidden shadow-2xl shrink-0 bg-slate-800">
                            <Image
                                src={isEditing ? editableData.image : teacherData.personal.image}
                                alt="Teacher Photo"
                                width={160}
                                height={160}
                                className="object-cover w-full h-full"
                            />
                        </div>

                        <div className="text-center md:text-left text-white">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{teacherData.personal.name}</h1>
                            <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <Briefcase size={18} className="text-blue-400" />
                                    {teacherData.official.designation}
                                </span>
                                <span className="flex items-center gap-1">
                                    <IdCard size={18} className="text-blue-400" />
                                    ID: {teacherData.official.employeeId}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar size={18} className="text-blue-400" />
                                    Joined: {new Date(teacherData.official.joiningDate).getFullYear()}
                                </span>
                                {teacherData.official.designation === "Teacher" && teacherData.official.classTeacherOf && (
                                    <span className="flex items-center gap-1">
                                        <User size={18} className="text-emerald-400" />
                                        Class Teacher: {teacherData.official.classTeacherOf}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Floating Cards (Overlap -mt-24) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 space-y-8">
                {/* Personal Details Card */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
                                    <p className="text-sm text-gray-500">Manage your personal information</p>
                                </div>
                            </div>

                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                                >
                                    <Edit2 size={18} />
                                    <span className="hidden sm:inline">Edit Profile</span>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-md"
                                    >
                                        <Save size={18} />
                                        <span>Save</span>
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <X size={18} />
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                            {/* Image Upload Input */}
                            {isEditing && (
                                <div className="md:col-span-3 mb-4 p-4 border border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center gap-4">
                                    <div className="shrink-0 p-3 bg-white rounded-full shadow-sm">
                                        <Upload size={20} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Update Profile Photo</p>
                                        <p className="text-xs text-gray-500">Click the button to select a new image</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        Browse
                                    </button>
                                </div>
                            )}

                            <InfoField label="Full Name" value={teacherData.personal.name} icon={<User size={16} />} />
                            <InfoField label="Date of Birth" value={new Date(teacherData.personal.dob).toLocaleDateString()} icon={<Calendar size={16} />} />
                            <InfoField label="Gender" value={teacherData.personal.gender} icon={<User size={16} />} />
                            <InfoField label="Email ID" value={teacherData.personal.email} icon={<Mail size={16} />} />

                            {/* Blood Group - Editable */}
                            {isEditing ? (
                                <EditableField
                                    label="Blood Group"
                                    value={editableData.bloodGroup}
                                    icon={<Shield size={14} />}
                                    onChange={(value) => setEditableData({ ...editableData, bloodGroup: value })}
                                />
                            ) : (
                                <InfoField label="Blood Group" value={teacherData.personal.bloodGroup} icon={<Shield size={16} />} />
                            )}

                            {/* Phone - Editable */}
                            {isEditing ? (
                                <EditableField
                                    label="Contact No."
                                    value={editableData.phone}
                                    icon={<Phone size={14} />}
                                    onChange={(value) => setEditableData({ ...editableData, phone: value })}
                                />
                            ) : (
                                <InfoField label="Contact No." value={teacherData.personal.phone} icon={<Phone size={16} />} />
                            )}

                            {/* Residential Address - Editable */}
                            {isEditing ? (
                                <div className="md:col-span-3">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                        <MapPin size={14} /> Residential Address
                                    </label>
                                    <textarea
                                        value={editableData.address}
                                        onChange={(e) => setEditableData({ ...editableData, address: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none min-h-[80px]"
                                    />
                                </div>
                            ) : (
                                <InfoField label="Residential Address" value={teacherData.personal.address} icon={<MapPin size={16} />} className="md:col-span-3" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Professional Details Section */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-blue-500">
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Professional Details</h2>
                                <p className="text-sm text-gray-500">Official records and information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoField label="Employee ID" value={teacherData.official.employeeId} icon={<IdCard size={16} />} />
                            <InfoField label="Designation" value={teacherData.official.designation} icon={<Briefcase size={16} />} />
                            <InfoField label="Department / Subjects" value={`${teacherData.official.department} | ${teacherData.official.subjects}`} icon={<Book size={16} />} />

                            <div className="group md:col-span-2 lg:col-span-3">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <GraduationCap size={14} /> Education Qualifications
                                </label>
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {teacherData.official.qualifications.map((qual, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                            {qual}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <InfoField label="Date of Joining" value={new Date(teacherData.official.joiningDate).toLocaleDateString()} icon={<Calendar size={16} />} />
                            <InfoField label="Current Salary" value={`₹ ${teacherData.official.currentSalary}`} icon={<IndianRupee size={16} />} />

                            <div className="group">
                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    <Activity size={14} /> Status
                                </label>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${teacherData.official.status === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800'}`}>
                                    {teacherData.official.status}
                                </span>
                            </div>

                            <InfoField label="Official Document No." value={teacherData.official.officialDocumentNumber} icon={<FileText size={16} />} />
                        </div>
                    </div>
                </div>

                {/* Security Settings Section (Role-Based) */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-purple-500 mb-12">
                    <div className="p-6 md:p-8 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Security Settings</h2>
                                <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/teacher/profile/reset-password">
                                <button className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-all shadow-lg hover:shadow-slate-500/30">
                                    <Lock size={18} />
                                    <span>Reset Password</span>
                                </button>
                            </Link>

                            {/* Principal Specific Options */}
                            {teacherData.official.designation === "Principal" && (
                                <button
                                    onClick={() => alert("Principal Portal Password Reset Link sent to email.")}
                                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30"
                                >
                                    <Shield size={18} />
                                    <span>Reset Principal Portal Password</span>
                                </button>
                            )}

                            {/* Accountant Specific Options */}
                            {teacherData.official.designation === "Accountant" && (
                                <button
                                    onClick={() => alert("Accountant Portal Password Reset Link sent to email.")}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                                >
                                    <Shield size={18} />
                                    <span>Reset Accountant Portal Password</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Reusable component for display fields
function InfoField({ label, value, icon, className = "" }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
    return (
        <div className={`group ${className}`}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            <p className="text-gray-900 font-medium text-base truncate border-b border-transparent group-hover:border-gray-200 pb-1 transition-colors">
                {value}
            </p>
        </div>
    );
}

// Editable field component
function EditableField({
    label,
    value,
    onChange,
    icon,
    className = ""
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`${className}`}>
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {icon} {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
            />
        </div>
    );
}
