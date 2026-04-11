"use client";

import { useState } from "react";
import { BookOpen, Users, ArrowRight, Settings, X, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import {
    useGetAllClassroomsQuery,
    useGetAllStudentsQuery,
    useGetAllTeachersQuery,
    useGetSubjectsByClassroomQuery,
    useAssignClassTeacherMutation,
    useAddSubjectWithTeacherMutation,
    ClassroomSummary,
    TeacherSummary,
    SubjectSummary,
} from "@/redux/api/principalApi";

function getLevel(grade: string): string {
    if (grade === "Nursery" || grade === "KG") return "Pre-Primary";
    const num = parseInt(grade);
    if (isNaN(num)) return "Other";
    if (num <= 5) return "Primary";
    if (num <= 8) return "Middle School";
    if (num <= 10) return "High School";
    return "Senior Secondary";
}

function getCapacityColor(current: number, capacity: number) {
    const pct = capacity > 0 ? (current / capacity) * 100 : 0;
    if (pct >= 95) return "bg-red-100 text-red-700 border-red-200";
    if (pct >= 80) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
}

export default function PrincipalHomePage() {
    const { data: classrooms = [], isLoading } = useGetAllClassroomsQuery();
    const { data: students = [] } = useGetAllStudentsQuery();
    const { data: allTeachers = [] } = useGetAllTeachersQuery();
    const [assignClassTeacher] = useAssignClassTeacherMutation();
    const [addSubjectWithTeacher] = useAddSubjectWithTeacherMutation();

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState<ClassroomSummary | null>(null);
    const [editedClassTeacherId, setEditedClassTeacherId] = useState<string>("");
    const [newSubjectName, setNewSubjectName] = useState("");
    const [newSubjectTeacherId, setNewSubjectTeacherId] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const { data: classroomSubjects = [] } = useGetSubjectsByClassroomQuery(
        selectedClassroom?.id ?? "",
        { skip: !selectedClassroom }
    );

    // Derive actual student count per classroom
    const studentCountMap: Record<string, number> = {};
    for (const s of students) {
        studentCountMap[s.classroomId] = (studentCountMap[s.classroomId] ?? 0) + 1;
    }

    // Group classrooms by level
    const levels = ["Pre-Primary", "Primary", "Middle School", "High School", "Senior Secondary"] as const;
    const byLevel = (level: string) =>
        classrooms.filter((c) => getLevel(c.grade) === level).sort((a, b) => a.name.localeCompare(b.name));

    const handleOpenSettings = (classroom: ClassroomSummary, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClassroom(classroom);
        setEditedClassTeacherId(classroom.classTeacher?.id ?? "");
        setNewSubjectName("");
        setNewSubjectTeacherId("");
        setFeedback(null);
        setShowSettingsModal(true);
    };

    const handleCloseSettings = () => {
        setShowSettingsModal(false);
        setSelectedClassroom(null);
        setEditedClassTeacherId("");
        setNewSubjectName("");
        setNewSubjectTeacherId("");
        setFeedback(null);
    };

    const showFeedback = (type: "success" | "error", msg: string) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handleSaveClassTeacher = async () => {
        if (!selectedClassroom || !editedClassTeacherId) return;
        setSaving(true);
        try {
            await assignClassTeacher({
                teacherId: editedClassTeacherId,
                classroomId: selectedClassroom.id,
            }).unwrap();
            showFeedback("success", "Class teacher assigned successfully!");
        } catch {
            showFeedback("error", "Failed to assign class teacher.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddSubject = async () => {
        if (!selectedClassroom || !newSubjectName.trim() || !newSubjectTeacherId) return;
        setSaving(true);
        try {
            await addSubjectWithTeacher({
                subjectName: newSubjectName.trim(),
                classroomId: selectedClassroom.id,
                teacherId: newSubjectTeacherId,
            }).unwrap();
            setNewSubjectName("");
            setNewSubjectTeacherId("");
            showFeedback("success", "Subject added successfully!");
        } catch {
            showFeedback("error", "Failed to add subject.");
        } finally {
            setSaving(false);
        }
    };

    // Filter teachers: exclude teachers already assigned as class teacher to OTHER classrooms
    const availableTeachers = allTeachers.filter(
        (t) => !t.classTeacherOf || t.classTeacherOf.id === selectedClassroom?.id
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">All Classrooms</h1>
                    <p className="text-gray-500 mt-1">Overview of all classes and sections</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No classrooms found. Run the seed to populate classrooms.</p>
                </div>
            ) : (
                levels.map((level) => {
                    const levelClassrooms = byLevel(level);
                    if (levelClassrooms.length === 0) return null;
                    return (
                        <div key={level}>
                            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                {level}
                                <span className="text-gray-400 font-normal text-sm">({levelClassrooms.length} sections)</span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {levelClassrooms.map((cls) => {
                                    const enrolled = studentCountMap[cls.id] ?? cls.total ?? 0;
                                    return (
                                        <div key={cls.id} className="block group">
                                            <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-purple-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <Link href={`/principal/classroom/${cls.id}`} className="flex-1">
                                                            <div className="p-3 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 inline-flex">
                                                                <BookOpen size={24} />
                                                            </div>
                                                        </Link>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Active
                                                            </span>
                                                            <button
                                                                onClick={(e) => handleOpenSettings(cls, e)}
                                                                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                                                                title="Classroom Settings"
                                                            >
                                                                <Settings size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <Link href={`/principal/classroom/${cls.id}`} className="block flex-1">
                                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{cls.name}</h3>
                                                        <p className="text-purple-600 font-medium text-sm mb-4">{getLevel(cls.grade)}</p>

                                                        <div className="space-y-3 pt-4 border-t border-gray-100">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center text-gray-600 text-sm">
                                                                    <Users size={16} className="mr-2 text-gray-400" />
                                                                    <span>{enrolled} Students</span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getCapacityColor(enrolled, cls.capacity)}`}>
                                                                    {enrolled}/{cls.capacity}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-600 text-sm">
                                                                <span className="font-semibold">Class Teacher:</span>
                                                                <br />
                                                                <span className="text-gray-500">
                                                                    {cls.classTeacher?.fullName ?? "—"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>

                                                <Link href={`/principal/classroom/${cls.id}`} className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end items-center">
                                                    <span className="text-purple-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                                                        View Details <ArrowRight size={16} className="ml-1" />
                                                    </span>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {/* ─── Settings Modal ─────────────────────────────────────────── */}
            {showSettingsModal && selectedClassroom && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Classroom Settings</h2>
                                <p className="text-sm text-gray-500 mt-1">{selectedClassroom.name}</p>
                            </div>
                            <button onClick={handleCloseSettings} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={24} className="text-gray-600" />
                            </button>
                        </div>

                        {/* Feedback */}
                        {feedback && (
                            <div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                                feedback.type === "success"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                                {feedback.msg}
                            </div>
                        )}

                        <div className="p-6 space-y-8">
                            {/* ── Class Teacher ── */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    Class Teacher
                                </h3>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Select Teacher <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={editedClassTeacherId}
                                            onChange={(e) => setEditedClassTeacherId(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900"
                                        >
                                            <option value="">— No Class Teacher —</option>
                                            {availableTeachers.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.fullName} {t.employeeId ? `(${t.employeeId})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleSaveClassTeacher}
                                        disabled={saving}
                                        className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium shadow-md flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>

                            {/* ── Subjects ── */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                    Subjects & Teachers
                                </h3>

                                {/* Existing subjects */}
                                <div className="space-y-2 mb-4">
                                    {classroomSubjects.length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <BookOpen className="mx-auto text-gray-400 mb-2" size={28} />
                                            <p className="text-sm text-gray-500">No subjects added yet</p>
                                        </div>
                                    ) : (
                                        classroomSubjects.map((subj) => (
                                            <div key={subj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div>
                                                    <p className="font-medium text-gray-800">{subj.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {subj.teachers.length > 0
                                                            ? subj.teachers.map((t) => t.fullName).join(", ")
                                                            : "No teacher assigned"}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                    {subj.teachers.length} teacher{subj.teachers.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add new subject */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <p className="text-sm font-semibold text-gray-700">Add New Subject</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Name</label>
                                            <input
                                                type="text"
                                                value={newSubjectName}
                                                onChange={(e) => setNewSubjectName(e.target.value)}
                                                placeholder="e.g. Mathematics"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Assign Teacher</label>
                                            <select
                                                value={newSubjectTeacherId}
                                                onChange={(e) => setNewSubjectTeacherId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none text-gray-900"
                                            >
                                                <option value="">Select teacher</option>
                                                {availableTeachers.map((t) => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.fullName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleAddSubject}
                                                disabled={!newSubjectName.trim() || !newSubjectTeacherId || saving}
                                                className="flex items-center gap-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium text-sm justify-center"
                                            >
                                                <Plus size={16} />
                                                {saving ? "Adding..." : "Add Subject"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
                            <button
                                onClick={handleCloseSettings}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
