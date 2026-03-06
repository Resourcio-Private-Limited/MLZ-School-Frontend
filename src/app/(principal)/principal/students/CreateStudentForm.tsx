"use client";

import { useState } from "react";
import { Plus, X, Users, AlertCircle } from "lucide-react";
import { mockAction } from "@/lib/mocks";

type Section = {
    id: string;
    name: string;
    _count?: { students: number };
};

type Classroom = {
    id: string;
    name: string;
    sections: Section[];
};

const MAX_STUDENTS_PER_SECTION = 100;

export default function CreateStudentForm({ classrooms }: { classrooms: Classroom[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");

    const selectedClass = classrooms.find(c => c.id === selectedClassId);
    const selectedSection = selectedClass?.sections.find(s => s.id === selectedSectionId);
    const currentStudentCount = selectedSection?._count?.students || 0;
    const availableCapacity = MAX_STUDENTS_PER_SECTION - currentStudentCount;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name") as string,
            email: (formData.get("email") as string) || null,
            admissionNo: formData.get("admissionNo") as string,
            joiningDate: new Date(formData.get("joiningDate") as string),
            dob: new Date(formData.get("dob") as string),
            gender: formData.get("gender") as "MALE" | "FEMALE" | "OTHER",
            fatherName: formData.get("fatherName") as string,
            motherName: formData.get("motherName") as string,
            parentContact: formData.get("parentContact") as string,
            address: formData.get("address") as string,
            nationality: formData.get("nationality") as string,
            classroomId: formData.get("classroomId") as string,
            sectionId: formData.get("sectionId") as string,
        };

        const res = await mockAction("createStudent", data);

        if (res.success) {
            setIsOpen(false);
            // Reset form
            setSelectedClassId("");
            setSelectedSectionId("");
        } else {
            setError("Failed to create student (Mock)");
        }
        setLoading(false);
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b bg-gray-50 sticky top-0">
                    <h2 className="text-xl font-bold text-gray-800">Admit New Student</h2>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex items-start space-x-2">
                            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input name="name" required className="input" placeholder="Student Name" />
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select name="gender" className="input">
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date of Birth</label>
                            <input name="dob" type="date" required className="input" />
                        </div>
                        <div>
                            {/* Email optional, auto-generated if empty */}
                            <label className="label">Email (Optional)</label>
                            <input name="email" type="email" className="input" placeholder="student@..." />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-gray-600 mb-3">Academic Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Admission No</label>
                                <input name="admissionNo" required className="input" placeholder="ADM-202X-001" />
                            </div>
                            <div>
                                <label className="label">Admission Date</label>
                                <input name="joiningDate" type="date" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label">Classroom</label>
                                <select
                                    name="classroomId"
                                    required
                                    className="input"
                                    value={selectedClassId}
                                    onChange={(e) => {
                                        setSelectedClassId(e.target.value);
                                        setSelectedSectionId("");
                                    }}
                                >
                                    <option value="">Select Class</option>
                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Section</label>
                                <select
                                    name="sectionId"
                                    required
                                    className="input"
                                    disabled={!selectedClass}
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                >
                                    <option value="">Select Section</option>
                                    {selectedClass?.sections.map(s => {
                                        const studentCount = s._count?.students || 0;
                                        const isFull = studentCount >= MAX_STUDENTS_PER_SECTION;
                                        return (
                                            <option
                                                key={s.id}
                                                value={s.id}
                                                disabled={isFull}
                                            >
                                                {s.name} ({studentCount}/{MAX_STUDENTS_PER_SECTION}) {isFull ? '- FULL' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Capacity Indicator */}
                        {selectedSection && (
                            <div className={`mt-3 p-3 rounded-lg border ${availableCapacity > 20
                                ? 'bg-green-50 border-green-200'
                                : availableCapacity > 0
                                    ? 'bg-yellow-50 border-yellow-200'
                                    : 'bg-red-50 border-red-200'
                                }`}>
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
                                            : 'text-red-700'
                                        }`}>
                                        {availableCapacity > 0
                                            ? `${availableCapacity} seat${availableCapacity !== 1 ? 's' : ''} available`
                                            : 'Section is full'}
                                    </span>
                                    <span className="text-gray-500">
                                        ({currentStudentCount}/{MAX_STUDENTS_PER_SECTION} students)
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-gray-600 mb-3">Parent & Contact</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Father Name</label>
                                <input name="fatherName" required className="input" />
                            </div>
                            <div>
                                <label className="label">Mother Name</label>
                                <input name="motherName" required className="input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="label">Parent Contact</label>
                                <input name="parentContact" required className="input" placeholder="+91..." />
                            </div>
                            <div>
                                <label className="label">Nationality</label>
                                <input name="nationality" required className="input" defaultValue="Indian" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="label">Address</label>
                            <textarea name="address" required className="input h-20"></textarea>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
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
        .input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.5rem; color: #111827; }
        .input:disabled { background-color: #f3f4f6; cursor: not-allowed; }
      `}</style>
        </div>
    );
}

