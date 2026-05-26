"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, Settings, X, Save, IndianRupee } from "lucide-react";
import { useGetClassroomsWithFeesQuery, useUpsertClassroomFeesMutation } from "@/redux/api/accountsApi";
import toast from "react-hot-toast";
import { Tooltip } from "@/components/ui/tooltip";

const GRADE_LEVELS: Record<string, string> = {
    'Nursery': 'Pre-Primary',
    'KG': 'Pre-Primary',
    '1': 'Primary', '2': 'Primary', '3': 'Primary', '4': 'Primary', '5': 'Primary',
    '6': 'Middle School', '7': 'Middle School', '8': 'Middle School',
    '9': 'High School', '10': 'High School',
    '11': 'Senior Secondary', '12': 'Senior Secondary',
};

export default function AccountantHomePage() {
    const { data: apiClassrooms = [], isLoading } = useGetClassroomsWithFeesQuery();
    const [upsertClassroomFees] = useUpsertClassroomFeesMutation();

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
    const [editedClassroom, setEditedClassroom] = useState<any>(null);
    const router = useRouter();

    const classrooms = apiClassrooms.map(cls => ({
        id: cls.classroomId,
        name: cls.className,
        level: GRADE_LEVELS[cls.grade] ?? cls.grade,
        students: cls.totalStudents,
        tuitionFees: cls.tuitionFees,
        lateFees: cls.lateFees,
        annualCharges: cls.annualCharges,
        _api: cls,
    }));

    const handleOpenSettings = (classroom: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClassroom(classroom);
        setEditedClassroom({ ...classroom });
        setShowSettingsModal(true);
    };

    const handleCloseSettings = () => {
        setShowSettingsModal(false);
        setSelectedClassroom(null);
        setEditedClassroom(null);
    };

    const handleSaveSettings = async () => {
        if (!editedClassroom) return;
        try {
            await upsertClassroomFees({
                classroomId: editedClassroom.id,
                tuitionFees: editedClassroom.tuitionFees,
                lateFees: editedClassroom.lateFees,
                annualCharges: editedClassroom.annualCharges,
            }).unwrap();
            toast.success("Fee settings saved successfully!");
        } catch {
            toast.error("Failed to save fee settings.");
        }
        handleCloseSettings();
    };

    const handleOpenStudentModal = (classroom: any) => {
        router.push(`/accounts/student/${classroom.id}`);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Fee Management</h1>
                    <p className="text-gray-500 mt-1">Manage fees for all classrooms</p>
                </div>

                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Classroom Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading classrooms...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No classrooms found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classrooms.map((classroom) => (
                        <div
                            key={classroom.id}
                            onClick={() => handleOpenStudentModal(classroom)}
                            className="block group cursor-pointer"
                        >
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-amber-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative h-full">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-lg bg-gray-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                            <BookOpen size={24} />
                                        </div>
                                        <Tooltip content="Fee Settings" side="left">
                                        <button
                                            onClick={(e) => handleOpenSettings(classroom, e)}
                                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-500 transition-colors"
                                        >
                                            <Settings size={16} />
                                        </button>
                                        </Tooltip>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{classroom.name}</h3>
                                    <p className="text-amber-500 font-medium text-sm mb-4">{classroom.level}</p>

                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <Users size={16} className="mr-2 text-gray-400" />
                                                <span>{classroom.students} Students</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Tuition Fees</span>
                                                <span className="font-bold text-amber-600">₹{classroom.tuitionFees}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Late Fees</span>
                                                <span className="font-bold text-red-600">₹{classroom.lateFees}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Annual Charges</span>
                                                <span className="font-bold text-purple-600">₹{classroom.annualCharges}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-center items-center">
                                    <span className="text-amber-500 text-sm font-semibold">
                                        Click to view students
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && editedClassroom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl sticky top-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Fee Settings</h2>
                                <p className="text-sm text-gray-500 mt-1">{editedClassroom.name}</p>
                            </div>
                            <button onClick={handleCloseSettings} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tuition Fees (Monthly) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={editedClassroom.tuitionFees}
                                        onChange={(e) => setEditedClassroom({ ...editedClassroom, tuitionFees: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Late Fees (Penalty) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={editedClassroom.lateFees}
                                        onChange={(e) => setEditedClassroom({ ...editedClassroom, lateFees: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>

                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Annual Charges
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={editedClassroom.annualCharges}
                                        onChange={(e) => setEditedClassroom({ ...editedClassroom, annualCharges: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3 rounded-b-xl">
                            <button onClick={handleCloseSettings}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                Cancel
                            </button>
                            <button onClick={handleSaveSettings}
                                className="flex items-center space-x-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-md hover:shadow-lg">
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}