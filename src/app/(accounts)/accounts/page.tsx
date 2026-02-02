"use client";

import { useState } from "react";
import { BookOpen, Users, Settings, X, Save, IndianRupee } from "lucide-react";
import StudentFeeModal from "./StudentFeeModal";

interface Classroom {
    id: number;
    name: string;
    level: string;
    students: number;
    standardFees: number;
    lateFees: number;
}

export default function AccountantHomePage() {
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [editedClassroom, setEditedClassroom] = useState<Classroom | null>(null);

    // Generate all classrooms: Nursery, Junior KG, Upper KG, Class 1-12 with sections A, B, C
    const [classrooms, setClassrooms] = useState<Classroom[]>([
        // Pre-primary
        { id: 1, name: "Nursery - Section A", level: "Pre-Primary", students: 25, standardFees: 2500, lateFees: 100 },
        { id: 2, name: "Nursery - Section B", level: "Pre-Primary", students: 24, standardFees: 2500, lateFees: 100 },
        { id: 3, name: "Nursery - Section C", level: "Pre-Primary", students: 26, standardFees: 2500, lateFees: 100 },

        { id: 4, name: "Junior KG - Section A", level: "Pre-Primary", students: 28, standardFees: 2800, lateFees: 100 },
        { id: 5, name: "Junior KG - Section B", level: "Pre-Primary", students: 27, standardFees: 2800, lateFees: 100 },
        { id: 6, name: "Junior KG - Section C", level: "Pre-Primary", students: 29, standardFees: 2800, lateFees: 100 },

        { id: 7, name: "Upper KG - Section A", level: "Pre-Primary", students: 30, standardFees: 3000, lateFees: 100 },
        { id: 8, name: "Upper KG - Section B", level: "Pre-Primary", students: 28, standardFees: 3000, lateFees: 100 },
        { id: 9, name: "Upper KG - Section C", level: "Pre-Primary", students: 31, standardFees: 3000, lateFees: 100 },

        // Primary (Class 1-5)
        { id: 10, name: "Class 1 - Section A", level: "Primary", students: 35, standardFees: 3500, lateFees: 150 },
        { id: 11, name: "Class 1 - Section B", level: "Primary", students: 34, standardFees: 3500, lateFees: 150 },
        { id: 12, name: "Class 1 - Section C", level: "Primary", students: 36, standardFees: 3500, lateFees: 150 },

        { id: 13, name: "Class 2 - Section A", level: "Primary", students: 38, standardFees: 3500, lateFees: 150 },
        { id: 14, name: "Class 2 - Section B", level: "Primary", students: 37, standardFees: 3500, lateFees: 150 },
        { id: 15, name: "Class 2 - Section C", level: "Primary", students: 39, standardFees: 3500, lateFees: 150 },

        { id: 16, name: "Class 3 - Section A", level: "Primary", students: 40, standardFees: 3800, lateFees: 150 },
        { id: 17, name: "Class 3 - Section B", level: "Primary", students: 38, standardFees: 3800, lateFees: 150 },
        { id: 18, name: "Class 3 - Section C", level: "Primary", students: 41, standardFees: 3800, lateFees: 150 },

        { id: 19, name: "Class 4 - Section A", level: "Primary", students: 42, standardFees: 4000, lateFees: 150 },
        { id: 20, name: "Class 4 - Section B", level: "Primary", students: 40, standardFees: 4000, lateFees: 150 },
        { id: 21, name: "Class 4 - Section C", level: "Primary", students: 43, standardFees: 4000, lateFees: 150 },

        { id: 22, name: "Class 5 - Section A", level: "Primary", students: 44, standardFees: 4200, lateFees: 150 },
        { id: 23, name: "Class 5 - Section B", level: "Primary", students: 42, standardFees: 4200, lateFees: 150 },
        { id: 24, name: "Class 5 - Section C", level: "Primary", students: 45, standardFees: 4200, lateFees: 150 },

        // Middle School (Class 6-8)
        { id: 25, name: "Class 6 - Section A", level: "Middle School", students: 45, standardFees: 4500, lateFees: 200 },
        { id: 26, name: "Class 6 - Section B", level: "Middle School", students: 44, standardFees: 4500, lateFees: 200 },
        { id: 27, name: "Class 6 - Section C", level: "Middle School", students: 46, standardFees: 4500, lateFees: 200 },

        { id: 28, name: "Class 7 - Section A", level: "Middle School", students: 46, standardFees: 4800, lateFees: 200 },
        { id: 29, name: "Class 7 - Section B", level: "Middle School", students: 45, standardFees: 4800, lateFees: 200 },
        { id: 30, name: "Class 7 - Section C", level: "Middle School", students: 47, standardFees: 4800, lateFees: 200 },

        { id: 31, name: "Class 8 - Section A", level: "Middle School", students: 48, standardFees: 5000, lateFees: 200 },
        { id: 32, name: "Class 8 - Section B", level: "Middle School", students: 46, standardFees: 5000, lateFees: 200 },
        { id: 33, name: "Class 8 - Section C", level: "Middle School", students: 49, standardFees: 5000, lateFees: 200 },

        // High School (Class 9-10)
        { id: 34, name: "Class 9 - Section A", level: "High School", students: 50, standardFees: 5500, lateFees: 250 },
        { id: 35, name: "Class 9 - Section B", level: "High School", students: 48, standardFees: 5500, lateFees: 250 },
        { id: 36, name: "Class 9 - Section C", level: "High School", students: 51, standardFees: 5500, lateFees: 250 },

        { id: 37, name: "Class 10 - Section A", level: "High School", students: 52, standardFees: 6000, lateFees: 250 },
        { id: 38, name: "Class 10 - Section B", level: "High School", students: 50, standardFees: 6000, lateFees: 250 },
        { id: 39, name: "Class 10 - Section C", level: "High School", students: 53, standardFees: 6000, lateFees: 250 },

        // Senior Secondary (Class 11-12)
        { id: 40, name: "Class 11 - Section A", level: "Senior Secondary", students: 48, standardFees: 6500, lateFees: 300 },
        { id: 41, name: "Class 11 - Section B", level: "Senior Secondary", students: 46, standardFees: 6500, lateFees: 300 },
        { id: 42, name: "Class 11 - Section C", level: "Senior Secondary", students: 49, standardFees: 6500, lateFees: 300 },

        { id: 43, name: "Class 12 - Section A", level: "Senior Secondary", students: 50, standardFees: 7000, lateFees: 300 },
        { id: 44, name: "Class 12 - Section B", level: "Senior Secondary", students: 48, standardFees: 7000, lateFees: 300 },
        { id: 45, name: "Class 12 - Section C", level: "Senior Secondary", students: 51, standardFees: 7000, lateFees: 300 },
    ]);

    const handleOpenSettings = (classroom: Classroom, e: React.MouseEvent) => {
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

    const handleSaveSettings = () => {
        if (editedClassroom) {
            setClassrooms(classrooms.map(c =>
                c.id === editedClassroom.id ? editedClassroom : c
            ));
        }
        handleCloseSettings();
    };

    const handleOpenStudentModal = (classroom: Classroom) => {
        setSelectedClassroom(classroom);
        setShowStudentModal(true);
    };

    const handleCloseStudentModal = () => {
        setShowStudentModal(false);
        setSelectedClassroom(null);
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
                                    <button
                                        onClick={(e) => handleOpenSettings(classroom, e)}
                                        className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-500 transition-colors"
                                        title="Fee Settings"
                                    >
                                        <Settings size={16} />
                                    </button>
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
                                            <span className="text-gray-600">Standard Fees</span>
                                            <span className="font-bold text-amber-600">₹{classroom.standardFees}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Late Fees</span>
                                            <span className="font-bold text-red-600">₹{classroom.lateFees}</span>
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

            {/* Settings Modal */}
            {showSettingsModal && editedClassroom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-xl">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Fee Settings</h2>
                                <p className="text-sm text-gray-500 mt-1">{editedClassroom.name}</p>
                            </div>
                            <button
                                onClick={handleCloseSettings}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Standard Fees */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Standard Fees (Monthly) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <IndianRupee size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        value={editedClassroom.standardFees}
                                        onChange={(e) => setEditedClassroom({ ...editedClassroom, standardFees: Number(e.target.value) })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none text-gray-800"
                                        placeholder="Enter standard fees"
                                    />
                                </div>
                            </div>

                            {/* Late Fees */}
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
                                        placeholder="Enter late fees"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3 rounded-b-xl">
                            <button
                                onClick={handleCloseSettings}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex items-center space-x-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Student Fee Modal */}
            {showStudentModal && selectedClassroom && (
                <StudentFeeModal
                    classroom={selectedClassroom}
                    onClose={handleCloseStudentModal}
                />
            )}
        </div>
    );
}
