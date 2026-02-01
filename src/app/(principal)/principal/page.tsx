"use client";

import { useState } from "react";
import { BookOpen, Users, ArrowRight, Settings, X, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

interface Subject {
    id: number;
    name: string;
    teacher: string;
}

interface Classroom {
    id: number;
    name: string;
    level: string;
    students: number;
    classTeacher: string;
    isActive: boolean;
    subjects: Subject[];
}

export default function PrincipalHomePage() {
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
    const [editedClassroom, setEditedClassroom] = useState<Classroom | null>(null);

    // Master list of all teachers in the school
    const allTeachers = [
        "Ms. Priya Sharma", "Ms. Anjali Verma", "Ms. Kavita Singh",
        "Ms. Neha Gupta", "Ms. Ritu Patel", "Ms. Pooja Reddy",
        "Ms. Sunita Joshi", "Ms. Meera Nair", "Ms. Divya Iyer",
        "Ms. Rekha Menon", "Ms. Shalini Rao", "Ms. Lakshmi Pillai",
        "Mr. Rajesh Kumar", "Ms. Geeta Desai", "Ms. Radha Krishnan",
        "Mr. Suresh Babu", "Ms. Usha Menon", "Ms. Vidya Shetty",
        "Mr. Anil Sharma", "Ms. Swati Jain", "Ms. Nisha Agarwal",
        "Mr. Vinod Kulkarni", "Ms. Preeti Chopra", "Ms. Asha Bhat",
        "Mr. Prakash Rao", "Ms. Smita Pandey", "Ms. Anita Malhotra",
        "Mr. Deepak Mishra", "Ms. Kiran Deshmukh", "Ms. Madhuri Patil",
        "Mr. Ramesh Nair", "Ms. Savita Kaur", "Ms. Pallavi Joshi",
        "Mr. Mohan Das", "Ms. Shobha Reddy", "Ms. Renuka Iyer",
        "Mr. Ashok Mehta", "Ms. Vandana Saxena", "Ms. Seema Kapoor",
        "Mr. Sanjay Gupta", "Ms. Ranjana Singh", "Ms. Archana Rao",
        "Mr. Vijay Kumar", "Ms. Meena Sharma", "Ms. Sunanda Nair",
        // Additional teachers not currently assigned
        "Mr. Arjun Patel", "Ms. Deepa Nambiar", "Mr. Karthik Reddy",
        "Ms. Lata Deshmukh", "Mr. Manish Jain", "Ms. Nandini Iyer",
        "Mr. Omkar Kulkarni", "Ms. Priyanka Mehta", "Mr. Rahul Sharma",
        "Ms. Sneha Kapoor", "Mr. Tarun Gupta", "Ms. Uma Rao"
    ];

    // Generate all classrooms: Nursery, Junior KG, Upper KG, Class 1-12 with sections A, B, C
    const [classrooms, setClassrooms] = useState<Classroom[]>([
        // Pre-primary
        {
            id: 1, name: "Nursery - Section A", level: "Pre-Primary", students: 25, classTeacher: "Ms. Priya Sharma", isActive: true, subjects: [
                { id: 1, name: "English", teacher: "Ms. Priya Sharma" },
                { id: 2, name: "Mathematics", teacher: "Ms. Anjali Verma" }
            ]
        },
        { id: 2, name: "Nursery - Section B", level: "Pre-Primary", students: 24, classTeacher: "Ms. Anjali Verma", isActive: true, subjects: [] },
        { id: 3, name: "Nursery - Section C", level: "Pre-Primary", students: 26, classTeacher: "Ms. Kavita Singh", isActive: true, subjects: [] },

        { id: 4, name: "Junior KG - Section A", level: "Pre-Primary", students: 28, classTeacher: "Ms. Neha Gupta", isActive: true, subjects: [] },
        { id: 5, name: "Junior KG - Section B", level: "Pre-Primary", students: 27, classTeacher: "Ms. Ritu Patel", isActive: true, subjects: [] },
        { id: 6, name: "Junior KG - Section C", level: "Pre-Primary", students: 29, classTeacher: "Ms. Pooja Reddy", isActive: true, subjects: [] },

        { id: 7, name: "Upper KG - Section A", level: "Pre-Primary", students: 30, classTeacher: "Ms. Sunita Joshi", isActive: true, subjects: [] },
        { id: 8, name: "Upper KG - Section B", level: "Pre-Primary", students: 28, classTeacher: "Ms. Meera Nair", isActive: true, subjects: [] },
        { id: 9, name: "Upper KG - Section C", level: "Pre-Primary", students: 31, classTeacher: "Ms. Divya Iyer", isActive: true, subjects: [] },

        // Primary (Class 1-5)
        { id: 10, name: "Class 1 - Section A", level: "Primary", students: 35, classTeacher: "Ms. Rekha Menon", isActive: true, subjects: [] },
        { id: 11, name: "Class 1 - Section B", level: "Primary", students: 34, classTeacher: "Ms. Shalini Rao", isActive: true, subjects: [] },
        { id: 12, name: "Class 1 - Section C", level: "Primary", students: 36, classTeacher: "Ms. Lakshmi Pillai", isActive: true, subjects: [] },

        { id: 13, name: "Class 2 - Section A", level: "Primary", students: 38, classTeacher: "Mr. Rajesh Kumar", isActive: true, subjects: [] },
        { id: 14, name: "Class 2 - Section B", level: "Primary", students: 37, classTeacher: "Ms. Geeta Desai", isActive: true, subjects: [] },
        { id: 15, name: "Class 2 - Section C", level: "Primary", students: 39, classTeacher: "Ms. Radha Krishnan", isActive: true, subjects: [] },

        { id: 16, name: "Class 3 - Section A", level: "Primary", students: 40, classTeacher: "Mr. Suresh Babu", isActive: true, subjects: [] },
        { id: 17, name: "Class 3 - Section B", level: "Primary", students: 38, classTeacher: "Ms. Usha Menon", isActive: true, subjects: [] },
        { id: 18, name: "Class 3 - Section C", level: "Primary", students: 41, classTeacher: "Ms. Vidya Shetty", isActive: true, subjects: [] },

        { id: 19, name: "Class 4 - Section A", level: "Primary", students: 42, classTeacher: "Mr. Anil Sharma", isActive: true, subjects: [] },
        { id: 20, name: "Class 4 - Section B", level: "Primary", students: 40, classTeacher: "Ms. Swati Jain", isActive: true, subjects: [] },
        { id: 21, name: "Class 4 - Section C", level: "Primary", students: 43, classTeacher: "Ms. Nisha Agarwal", isActive: true, subjects: [] },

        { id: 22, name: "Class 5 - Section A", level: "Primary", students: 44, classTeacher: "Mr. Vinod Kulkarni", isActive: true, subjects: [] },
        { id: 23, name: "Class 5 - Section B", level: "Primary", students: 42, classTeacher: "Ms. Preeti Chopra", isActive: true, subjects: [] },
        { id: 24, name: "Class 5 - Section C", level: "Primary", students: 45, classTeacher: "Ms. Asha Bhat", isActive: true, subjects: [] },

        // Middle School (Class 6-8)
        { id: 25, name: "Class 6 - Section A", level: "Middle School", students: 45, classTeacher: "Mr. Prakash Rao", isActive: true, subjects: [] },
        { id: 26, name: "Class 6 - Section B", level: "Middle School", students: 44, classTeacher: "Ms. Smita Pandey", isActive: true, subjects: [] },
        { id: 27, name: "Class 6 - Section C", level: "Middle School", students: 46, classTeacher: "Ms. Anita Malhotra", isActive: true, subjects: [] },

        { id: 28, name: "Class 7 - Section A", level: "Middle School", students: 46, classTeacher: "Mr. Deepak Mishra", isActive: true, subjects: [] },
        { id: 29, name: "Class 7 - Section B", level: "Middle School", students: 45, classTeacher: "Ms. Kiran Deshmukh", isActive: true, subjects: [] },
        { id: 30, name: "Class 7 - Section C", level: "Middle School", students: 47, classTeacher: "Ms. Madhuri Patil", isActive: true, subjects: [] },

        { id: 31, name: "Class 8 - Section A", level: "Middle School", students: 48, classTeacher: "Mr. Ramesh Nair", isActive: true, subjects: [] },
        { id: 32, name: "Class 8 - Section B", level: "Middle School", students: 46, classTeacher: "Ms. Savita Kaur", isActive: true, subjects: [] },
        { id: 33, name: "Class 8 - Section C", level: "Middle School", students: 49, classTeacher: "Ms. Pallavi Joshi", isActive: true, subjects: [] },

        // High School (Class 9-10)
        { id: 34, name: "Class 9 - Section A", level: "High School", students: 50, classTeacher: "Mr. Mohan Das", isActive: true, subjects: [] },
        { id: 35, name: "Class 9 - Section B", level: "High School", students: 48, classTeacher: "Ms. Shobha Reddy", isActive: true, subjects: [] },
        { id: 36, name: "Class 9 - Section C", level: "High School", students: 51, classTeacher: "Ms. Renuka Iyer", isActive: true, subjects: [] },

        { id: 37, name: "Class 10 - Section A", level: "High School", students: 52, classTeacher: "Mr. Ashok Mehta", isActive: true, subjects: [] },
        { id: 38, name: "Class 10 - Section B", level: "High School", students: 50, classTeacher: "Ms. Vandana Saxena", isActive: true, subjects: [] },
        { id: 39, name: "Class 10 - Section C", level: "High School", students: 53, classTeacher: "Ms. Seema Kapoor", isActive: true, subjects: [] },

        // Senior Secondary (Class 11-12)
        { id: 40, name: "Class 11 - Section A", level: "Senior Secondary", students: 48, classTeacher: "Mr. Sanjay Gupta", isActive: true, subjects: [] },
        { id: 41, name: "Class 11 - Section B", level: "Senior Secondary", students: 46, classTeacher: "Ms. Ranjana Singh", isActive: true, subjects: [] },
        { id: 42, name: "Class 11 - Section C", level: "Senior Secondary", students: 49, classTeacher: "Ms. Archana Rao", isActive: true, subjects: [] },

        { id: 43, name: "Class 12 - Section A", level: "Senior Secondary", students: 50, classTeacher: "Mr. Vijay Kumar", isActive: true, subjects: [] },
        { id: 44, name: "Class 12 - Section B", level: "Senior Secondary", students: 48, classTeacher: "Ms. Meena Sharma", isActive: true, subjects: [] },
        { id: 45, name: "Class 12 - Section C", level: "Senior Secondary", students: 51, classTeacher: "Ms. Sunanda Nair", isActive: true, subjects: [] },
    ]);

    const handleOpenSettings = (classroom: Classroom, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClassroom(classroom);
        setEditedClassroom({ ...classroom, subjects: [...classroom.subjects] });
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

    const handleAddSubject = () => {
        if (editedClassroom) {
            const newSubject: Subject = {
                id: Date.now(),
                name: "",
                teacher: ""
            };
            setEditedClassroom({
                ...editedClassroom,
                subjects: [...editedClassroom.subjects, newSubject]
            });
        }
    };

    const handleRemoveSubject = (subjectId: number) => {
        if (editedClassroom) {
            setEditedClassroom({
                ...editedClassroom,
                subjects: editedClassroom.subjects.filter(s => s.id !== subjectId)
            });
        }
    };

    const handleSubjectChange = (subjectId: number, field: 'name' | 'teacher', value: string) => {
        if (editedClassroom) {
            setEditedClassroom({
                ...editedClassroom,
                subjects: editedClassroom.subjects.map(s =>
                    s.id === subjectId ? { ...s, [field]: value } : s
                )
            });
        }
    };

    // Get available teachers (excluding those already assigned as class teachers to other classrooms)
    const getAvailableTeachers = () => {
        if (!editedClassroom) return allTeachers;

        const assignedTeachers = classrooms
            .filter(c => c.id !== editedClassroom.id) // Exclude current classroom
            .map(c => c.classTeacher);

        // Include current classroom's teacher and filter out others
        return allTeachers.filter(teacher =>
            teacher === editedClassroom.classTeacher || !assignedTeachers.includes(teacher)
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">All Classrooms</h1>
                    <p className="text-gray-500 mt-1">Overview of all classes and sections</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Classroom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {classrooms.map((classroom) => {
                    const capacityPercentage = (classroom.students / 100) * 100;
                    const getCapacityColor = () => {
                        if (capacityPercentage >= 95) return "bg-red-100 text-red-700 border-red-200";
                        if (capacityPercentage >= 80) return "bg-yellow-100 text-yellow-700 border-yellow-200";
                        return "bg-green-100 text-green-700 border-green-200";
                    };

                    return (
                        <Link key={classroom.id} href={`/principal/classroom/${classroom.id}`} className="block group">
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-purple-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative h-full cursor-pointer">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classroom.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {classroom.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <button
                                                onClick={(e) => handleOpenSettings(classroom, e)}
                                                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                                                title="Classroom Settings"
                                            >
                                                <Settings size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{classroom.name}</h3>
                                    <p className="text-purple-600 font-medium text-sm mb-4">{classroom.level}</p>

                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <Users size={16} className="mr-2 text-gray-400" />
                                                <span>{classroom.students} Students</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getCapacityColor()}`}>
                                                {classroom.students}/100
                                            </span>
                                        </div>
                                        <div className="text-gray-600 text-sm">
                                            <span className="font-semibold">Class Teacher:</span>
                                            <br />
                                            <span className="text-gray-500">{classroom.classTeacher}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end items-center">
                                    <span className="text-purple-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                        View Details <ArrowRight size={16} className="ml-1" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Settings Modal */}
            {showSettingsModal && editedClassroom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Classroom Settings</h2>
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
                            {/* Class Teacher */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Class Teacher <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editedClassroom.classTeacher}
                                    onChange={(e) => setEditedClassroom({ ...editedClassroom, classTeacher: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                >
                                    <option value="">Select a teacher...</option>
                                    {getAvailableTeachers().map((teacher, idx) => (
                                        <option key={idx} value={teacher}>
                                            {teacher}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Active Status */}
                            <div>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedClassroom.isActive}
                                        onChange={(e) => setEditedClassroom({ ...editedClassroom, isActive: e.target.checked })}
                                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-gray-700">Classroom Active</span>
                                        <p className="text-xs text-gray-500">Inactive classrooms won't appear in student/teacher portals</p>
                                    </div>
                                </label>
                            </div>

                            {/* Subjects */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Subjects & Teachers
                                    </label>
                                    <button
                                        onClick={handleAddSubject}
                                        className="flex items-center space-x-1 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Add Subject</span>
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {editedClassroom.subjects.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <BookOpen className="mx-auto text-gray-400 mb-2" size={32} />
                                            <p className="text-sm text-gray-500">No subjects added yet</p>
                                            <button
                                                onClick={handleAddSubject}
                                                className="mt-3 text-sm font-medium text-purple-600 hover:text-purple-700"
                                            >
                                                Add your first subject
                                            </button>
                                        </div>
                                    ) : (
                                        editedClassroom.subjects.map((subject) => (
                                            <div key={subject.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={subject.name}
                                                        onChange={(e) => handleSubjectChange(subject.id, 'name', e.target.value)}
                                                        placeholder="Subject name"
                                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={subject.teacher}
                                                        onChange={(e) => handleSubjectChange(subject.id, 'teacher', e.target.value)}
                                                        placeholder="Teacher name"
                                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveSubject(subject.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove subject"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end space-x-3">
                            <button
                                onClick={handleCloseSettings}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                            >
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
