"use client";

import { useState, useEffect } from "react";
import { X, Users, AlertCircle, Calendar, Award, User as UserIcon } from "lucide-react";
import { createStudentInClassroomAction } from "@/actions/user-actions";
import { AdmissionService } from "@/services/admission";

type Section = {
    id: string;
    name: string;
    _count?: { students: number };
};

type Classroom = {
    id: string;
    name: string;
    level: string;
    classTeacher: string;
    capacity: number;
};

const MAX_STUDENTS_PER_SECTION = 100;

export default function ClassroomAdmissionForm({
    classroom,
    sections,
    onClose
}: {
    classroom: Classroom;
    sections: Section[];
    onClose: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("");
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [passingYear, setPassingYear] = useState(0);

    const selectedSection = sections.find(s => s.id === selectedSectionId);
    const currentStudentCount = selectedSection?._count?.students || 0;
    const availableCapacity = MAX_STUDENTS_PER_SECTION - currentStudentCount;

    // Get current admission info
    const admissionInfo = AdmissionService.getCurrentAdmissionInfo();
    const currentDate = admissionInfo.admissionDate.toISOString().split('T')[0];

    // Generate admission number and calculate passing year on mount
    useEffect(() => {
        const generateAdmissionNo = async () => {
            const admNo = await AdmissionService.generateAdmissionNumber();
            setAdmissionNumber(admNo);
        };
        generateAdmissionNo();

        const passYear = AdmissionService.calculatePassingYear(classroom.name);
        setPassingYear(passYear);
    }, [classroom.name]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const data = {
            // Auto-generated fields
            admissionNo: admissionNumber,
            joiningDate: admissionInfo.admissionDate,
            admissionYear: admissionInfo.admissionYear,
            passingYear: passingYear,
            academicYear: admissionInfo.academicYear,

            // Classroom context
            classroomId: classroom.id,
            sectionId: formData.get("sectionId") as string,

            // Personal details
            name: formData.get("name") as string,
            email: (formData.get("email") as string) || null,
            dob: new Date(formData.get("dob") as string),
            gender: formData.get("gender") as "MALE" | "FEMALE" | "OTHER",
            bloodGroup: formData.get("bloodGroup") as string,
            religion: formData.get("religion") as string,
            category: formData.get("category") as string,
            nationality: formData.get("nationality") as string,

            // Parent details
            fatherName: formData.get("fatherName") as string,
            motherName: formData.get("motherName") as string,
            parentContact: formData.get("parentContact") as string,
            emergencyContact: formData.get("emergencyContact") as string,

            // Guardian (optional)
            guardianName: (formData.get("guardianName") as string) || null,
            guardianContact: (formData.get("guardianContact") as string) || null,
            guardianRelation: (formData.get("guardianRelation") as string) || null,

            // Address
            address: formData.get("address") as string,

            // Previous school (optional)
            previousSchool: (formData.get("previousSchool") as string) || null,
        };

        const res = await createStudentInClassroomAction(data);

        if (res.success) {
            onClose();
            window.location.reload(); // Refresh to show new student
        } else {
            setError(res.error || "Failed to admit student");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Admit New Student</h2>
                        <p className="text-purple-100 text-sm mt-1">{classroom.name}</p>
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
                                <p className="text-purple-900 font-semibold">{admissionInfo.academicYear}</p>
                            </div>
                            <div>
                                <p className="text-purple-600 font-medium">Expected Passing Year</p>
                                <p className="text-purple-900 font-semibold">{passingYear}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section Selection */}
                    <div>
                        <label className="label">Section <span className="text-red-500">*</span></label>
                        <select
                            name="sectionId"
                            required
                            className="input"
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                        >
                            <option value="">Select Section</option>
                            {sections.map(s => {
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

                        {/* Capacity Indicator */}
                        {selectedSection && (
                            <div className={`mt-2 p-2 rounded-lg border text-sm ${availableCapacity > 20
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : availableCapacity > 0
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                <Users size={14} className="inline mr-1" />
                                {availableCapacity > 0
                                    ? `${availableCapacity} seat${availableCapacity !== 1 ? 's' : ''} available`
                                    : 'Section is full'}
                            </div>
                        )}
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
                                <input name="name" required className="input" placeholder="Enter student's full name" />
                            </div>
                            <div>
                                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                                <input name="dob" type="date" required className="input" />
                            </div>
                            <div>
                                <label className="label">Gender <span className="text-red-500">*</span></label>
                                <select name="gender" required className="input">
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Blood Group <span className="text-red-500">*</span></label>
                                <select name="bloodGroup" required className="input">
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Religion <span className="text-red-500">*</span></label>
                                <input name="religion" required className="input" placeholder="e.g., Hindu, Muslim, Christian" />
                            </div>
                            <div>
                                <label className="label">Category <span className="text-red-500">*</span></label>
                                <select name="category" required className="input">
                                    <option value="">Select Category</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Nationality <span className="text-red-500">*</span></label>
                                <input name="nationality" required className="input" defaultValue="Indian" />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Email (Optional - Auto-generated if empty)</label>
                                <input name="email" type="email" className="input" placeholder="student@mlzs.edu.in" />
                            </div>
                        </div>
                    </div>

                    {/* Parent Details */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Parent Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Father's Name <span className="text-red-500">*</span></label>
                                <input name="fatherName" required className="input" />
                            </div>
                            <div>
                                <label className="label">Mother's Name <span className="text-red-500">*</span></label>
                                <input name="motherName" required className="input" />
                            </div>
                            <div>
                                <label className="label">Parent Contact <span className="text-red-500">*</span></label>
                                <input name="parentContact" required className="input" placeholder="+91 XXXXX XXXXX" />
                            </div>
                            <div>
                                <label className="label">Emergency Contact <span className="text-red-500">*</span></label>
                                <input name="emergencyContact" required className="input" placeholder="+91 XXXXX XXXXX" />
                            </div>
                        </div>
                    </div>

                    {/* Guardian Details (Optional) */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-1">Guardian Details (If different from parents)</h3>
                        <p className="text-xs text-gray-500 mb-3">Leave blank if parents are the guardians</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Guardian Name</label>
                                <input name="guardianName" className="input" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="label">Guardian Contact</label>
                                <input name="guardianContact" className="input" placeholder="Optional" />
                            </div>
                            <div>
                                <label className="label">Relation</label>
                                <input name="guardianRelation" className="input" placeholder="e.g., Uncle, Aunt" />
                            </div>
                        </div>
                    </div>

                    {/* Address & Previous School */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-700 mb-3">Additional Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Residential Address <span className="text-red-500">*</span></label>
                                <textarea name="address" required className="input h-20" placeholder="Enter complete address"></textarea>
                            </div>
                            <div>
                                <label className="label">Previous School (Optional)</label>
                                <input name="previousSchool" className="input" placeholder="Name of previous school, if any" />
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
                            disabled={loading || availableCapacity <= 0}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-md hover:shadow-lg"
                        >
                            {loading ? "Admitting..." : "Admit Student"}
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
                .input:disabled { 
                    background-color: #f3f4f6; 
                    cursor: not-allowed; 
                }
            `}</style>
        </div>
    );
}
