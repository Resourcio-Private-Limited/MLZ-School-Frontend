"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Download, Printer, CheckCircle, Loader2 } from "lucide-react";
import { useGetAllClassroomsQuery, useGetClassroomStudentsQuery, useGetExamScheduleQuery, useGetStudentAdmitCardPreviewQuery, useGetSubjectsByClassroomQuery, useCreateAdmitCardMutation, useSetExamScheduleMutation } from "@/redux/api/principalApi";

const EXAM_TYPES = [
    { value: "HALF_YEARLY", label: "Half Yearly Examination", svg: "/admit/Admit Card-Half Year.svg" },
    { value: "FINAL", label: "Final Examination", svg: "/admit/Admit Card-Final Exam.svg" },
];

export default function AdmitCardPage() {
    const [selectedClassroomId, setSelectedClassroomId] = useState("");
    const [selectedExamType, setSelectedExamType] = useState<"HALF_YEARLY" | "FINAL" | "">("");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [examScheduleDates, setExamScheduleDates] = useState<Record<string, string>>({});
    const [scheduleSaved, setScheduleSaved] = useState(false);

    const { data: classrooms = [], isLoading: loadingClassrooms } = useGetAllClassroomsQuery();
    const { data: students = [], isLoading: loadingStudents } = useGetClassroomStudentsQuery(selectedClassroomId, { skip: !selectedClassroomId });
    const { data: subjects = [], isLoading: loadingSubjects } = useGetSubjectsByClassroomQuery(selectedClassroomId, { skip: !selectedClassroomId });
    const { data: examSchedule = [], isFetching: loadingExamSchedule } = useGetExamScheduleQuery(
        { classroomId: selectedClassroomId, examType: selectedExamType },
        { skip: !selectedClassroomId || !selectedExamType },
    );
    const [setExamSchedule, { isLoading: savingSchedule }] = useSetExamScheduleMutation();
    const [createAdmitCard] = useCreateAdmitCardMutation();
    const selectedStudentId = selectedStudentIds[0] ?? '';
    const { data: admitCardPreview, isFetching: loadingPreview } = useGetStudentAdmitCardPreviewQuery(
        { studentId: selectedStudentId, examType: selectedExamType },
        { skip: !selectedStudentId || !selectedExamType },
    );

    // Reset student selection when classroom changes
    useEffect(() => {
        setSelectedStudentIds([]);
        setSelectAll(false);
    }, [selectedClassroomId]);

    useEffect(() => {
        setExamScheduleDates({});
        setScheduleSaved(false);
    }, [selectedClassroomId, selectedExamType]);

    useEffect(() => {
        if (!loadingExamSchedule && subjects.length > 0 && examSchedule.length > 0) {
            const initialDates: Record<string, string> = {};
            subjects.forEach((subject) => {
                const existing = examSchedule.find((entry) => entry.subjectId === subject.id);
                initialDates[subject.id] = existing?.examDate ?? '';
            });
            setExamScheduleDates(initialDates);
            setScheduleSaved(subjects.every((subject) => Boolean(initialDates[subject.id])));
        }
    }, [examSchedule, loadingExamSchedule, subjects]);

    const handleSelectAll = () => {
        if (selectAll || selectedStudentIds.length === students.length) {
            setSelectedStudentIds([]);
            setSelectAll(false);
        } else {
            setSelectedStudentIds(students.map(s => s.id));
            setSelectAll(true);
        }
    };

    const handleStudentToggle = (studentId: string) => {
        if (selectedStudentIds.includes(studentId)) {
            setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
        } else {
            setSelectedStudentIds([...selectedStudentIds, studentId]);
        }
    };

    const scheduleComplete = subjects.length > 0 && subjects.every((subject) => Boolean(examScheduleDates[subject.id]));
    const canGenerate = selectedClassroomId && selectedExamType && selectedStudentIds.length > 0 && scheduleSaved;

    const handleSaveExamSchedule = async () => {
        if (!selectedClassroomId || !selectedExamType || !scheduleComplete) return;

        try {
            await setExamSchedule({
                classroomId: selectedClassroomId,
                examType: selectedExamType,
                schedule: subjects.map((subject) => ({
                    subjectId: subject.id,
                    examDate: examScheduleDates[subject.id],
                })),
            }).unwrap();
            setScheduleSaved(true);
            alert('Exam dates saved. You can now generate admit cards.');
        } catch (err) {
            console.error('Failed to save exam schedule:', err);
            alert('Failed to save exam schedule. Please try again.');
        }
    };

    const handleGenerateAdmitCards = async () => {
        if (!canGenerate) return;
        setGenerating(true);
        try {
            for (const studentId of selectedStudentIds) {
                await createAdmitCard({
                    studentId,
                    examType: selectedExamType,
                }).unwrap();
            }
            alert(`Admit cards generated for ${selectedStudentIds.length} student(s)!`);
            setSelectedStudentIds([]);
            setSelectAll(false);
        } catch (err) {
            console.error("Failed to generate admit cards:", err);
            alert("Failed to generate admit cards. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId);
    const scheduleStatus = scheduleSaved ? 'Saved' : scheduleComplete ? 'Ready to save' : 'Incomplete';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/principal">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h1 className="text-3xl font-bold text-gray-800">Create Admit Card</h1>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-purple-600">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                    <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                        <FileText size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Admit Card Generator</h2>
                </div>

                <div className="p-6 space-y-6">
                    {/* Selection Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Classroom Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Class <span className="text-red-500">*</span>
                            </label>
                            {loadingClassrooms ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">Loading classrooms...</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedClassroomId}
                                    onChange={(e) => setSelectedClassroomId(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-purple-300 shadow-sm"
                                >
                                    <option value="">Choose class...</option>
                                    {classrooms.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.total} students)
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Exam Type Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Examination Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedExamType}
                                onChange={(e) => setSelectedExamType(e.target.value as "HALF_YEARLY" | "FINAL" | "")}
                                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-purple-300 shadow-sm"
                            >
                                <option value="">Choose exam type...</option>
                                {EXAM_TYPES.map((exam) => (
                                    <option key={exam.value} value={exam.value}>{exam.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Exam Schedule */}
                    {selectedClassroomId && selectedExamType && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Exam Schedule</h3>
                                    <p className="text-sm text-gray-500">Set the date for each subject before generating admit cards.</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-slate-700">Schedule status</p>
                                    <p className={`text-sm ${scheduleSaved ? 'text-emerald-600' : scheduleComplete ? 'text-amber-600' : 'text-slate-500'}`}>
                                        {scheduleStatus}
                                    </p>
                                </div>
                            </div>

                            {loadingSubjects ? (
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-sm">Loading subjects...</span>
                                </div>
                            ) : subjects.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No subjects found for this classroom.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subjects.map((subject) => (
                                        <div key={subject.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
                                            <p className="text-sm font-medium text-gray-800">{subject.name}</p>
                                            <input
                                                type="date"
                                                value={examScheduleDates[subject.id] ?? ''}
                                                onChange={(e) => {
                                                    setScheduleSaved(false);
                                                    setExamScheduleDates((prev) => ({ ...prev, [subject.id]: e.target.value }));
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <button
                                    onClick={handleSaveExamSchedule}
                                    disabled={!scheduleComplete || savingSchedule}
                                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                                        scheduleComplete && !savingSchedule
                                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {savingSchedule ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                    <span>{savingSchedule ? 'Saving Schedule...' : 'Save Exam Dates'}</span>
                                </button>
                                <p className="text-sm text-gray-500">
                                    {scheduleSaved
                                        ? 'Exam schedule has been saved and is ready for admit card generation.'
                                        : 'All subjects must have an exam date before you can generate admit cards.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Student Selection */}
                    {selectedClassroomId && (
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Select Students
                                    {loadingStudents && <Loader2 size={16} className="inline ml-2 animate-spin" />}
                                </h3>
                                <button
                                    onClick={handleSelectAll}
                                    disabled={students.length === 0}
                                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {selectAll || selectedStudentIds.length === students.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            {students.length === 0 && !loadingStudents ? (
                                <div className="text-center py-8 text-gray-500">
                                    No students found in this class.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                                    {students.map((student) => (
                                        <label
                                            key={student.id}
                                            className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                                selectedStudentIds.includes(student.id)
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIds.includes(student.id)}
                                                onChange={() => handleStudentToggle(student.id)}
                                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{student.fullName}</p>
                                                <p className="text-xs text-gray-500">Adm: {student.admissionNo}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {selectedStudentIds.length > 0 && (
                                <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="font-medium">{selectedStudentIds.length} student(s) selected</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admit Card Preview */}
                    {canGenerate && selectedExamType && (
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admit Card Preview</h3>
                            <div className="relative bg-white border-2 border-purple-600 rounded-lg overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: '400px', margin: '0 auto' }}>
                                <Image
                                    src={EXAM_TYPES.find(e => e.value === selectedExamType)?.svg || ''}
                                    alt="Admit Card Template"
                                    fill
                                    className="object-contain"
                                />
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute left-[74.1%] top-[23.6%] w-[18.85%] h-[14.8%] rounded-lg overflow-hidden border border-slate-300 bg-white/80 flex items-center justify-center">
                                        {admitCardPreview?.profileImage ? (
                                            <img src={admitCardPreview.profileImage} alt="Student photo" className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-[8px] text-slate-500">Photo</span>
                                        )}
                                    </div>

                                    <div className="absolute left-[5.2%] top-[41%] w-[21.2%] text-[9px] leading-tight text-slate-900">
                                        <p className="font-semibold">{admitCardPreview?.studentName ?? 'Student Full Name'}</p>
                                    </div>

                                    <div className="absolute left-[26.4%] top-[41%] w-[47.1%] text-[9px] leading-tight text-slate-900">
                                        <p className="font-semibold">{admitCardPreview ? `${admitCardPreview.classroom.grade} ${admitCardPreview.classroom.section}` : 'Grade Section'}</p>
                                    </div>

                                    <div className="absolute left-[73.5%] top-[41%] w-[21.2%] text-[9px] leading-tight text-slate-900">
                                        <p className="font-semibold">{admitCardPreview?.rollNumber ?? 'Roll No.'}</p>
                                    </div>

                                    <div className="absolute left-[26.4%] top-[45.7%] w-[47.1%] text-[8px] leading-[1.3] text-slate-900">
                                        {loadingPreview ? (
                                            <p className="text-[8px] text-slate-500">Loading schedule...</p>
                                        ) : admitCardPreview?.examSchedule?.length ? (
                                            admitCardPreview.examSchedule.slice(0, 12).map((entry, index) => (
                                                <p key={index} className="text-[8px] truncate">{entry.subjectName}</p>
                                            ))
                                        ) : admitCardPreview?.subjects?.length ? (
                                            admitCardPreview.subjects.slice(0, 12).map((subject, index) => (
                                                <p key={index} className="text-[8px] truncate text-slate-500">{subject}</p>
                                            ))
                                        ) : (
                                            <p className="text-[8px] text-slate-500">Subjects will be fetched from backend</p>
                                        )}
                                    </div>

                                    <div className="absolute left-[73.5%] top-[45.7%] w-[21.2%] text-[8px] leading-[1.3] text-slate-900 text-right">
                                        {loadingPreview ? (
                                            <p className="text-[8px] text-slate-500">Loading schedule...</p>
                                        ) : admitCardPreview?.examSchedule?.length ? (
                                            admitCardPreview.examSchedule.slice(0, 12).map((entry, index) => (
                                                <p key={index} className="text-[8px]">{entry.examDate ? new Date(entry.examDate).toLocaleDateString() : 'TBD'}</p>
                                            ))
                                        ) : admitCardPreview?.subjects?.length ? (
                                            admitCardPreview.subjects.slice(0, 12).map((subject, index) => (
                                                <p key={index} className="text-[8px] text-slate-500">TBD</p>
                                            ))
                                        ) : (
                                            <p className="text-[8px] text-slate-500">TBD</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-3">
                                {selectedClassroom?.name} — {EXAM_TYPES.find(e => e.value === selectedExamType)?.label}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            disabled={!canGenerate || generating}
                            onClick={handleGenerateAdmitCards}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                                canGenerate && !generating
                                    ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {generating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                            <span>{generating ? "Generating..." : "Generate Admit Cards"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
