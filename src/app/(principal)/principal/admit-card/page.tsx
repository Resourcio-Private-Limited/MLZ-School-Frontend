"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Download, Printer, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import toast from 'react-hot-toast';
import { useGetAllClassroomsQuery, useGetClassroomStudentsQuery, useGetExamScheduleQuery, useGetStudentAdmitCardPreviewQuery, useGetSubjectsByClassroomQuery, useCreateAdmitCardMutation, useSetExamScheduleMutation, AdmitCardPreview as AdmitCardPreviewData } from "@/redux/api/principalApi";
import { Tooltip } from "@/components/ui/tooltip";

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
    const [isEditingSchedule, setIsEditingSchedule] = useState(false);

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
        setIsEditingSchedule(false);
    }, [selectedClassroomId, selectedExamType]);

    useEffect(() => {
        if (loadingExamSchedule) return;

        if (subjects.length > 0 && examSchedule.length > 0) {
            const initialDates: Record<string, string> = {};
            subjects.forEach((subject) => {
                const existing = examSchedule.find((entry) => entry.subjectId === subject.id);
                initialDates[subject.id] = existing?.examDate ?? '';
            });
            setExamScheduleDates(initialDates);
            const allSaved = subjects.every((subject) => Boolean(initialDates[subject.id]));
            setScheduleSaved(allSaved);
            setIsEditingSchedule(false);
        } else if (subjects.length > 0 && (!examSchedule || examSchedule.length === 0)) {
            const emptyDates: Record<string, string> = {};
            subjects.forEach((subject) => {
                emptyDates[subject.id] = '';
            });
            setExamScheduleDates(emptyDates);
            setScheduleSaved(false);
            setIsEditingSchedule(false);
        }
    }, [examSchedule, loadingExamSchedule, subjects]);

    const handleSelectAll = () => {
        const eligibleStudents = students.filter(s => s.examEligibility === true);
        if (selectAll || selectedStudentIds.length === eligibleStudents.length) {
            setSelectedStudentIds([]);
            setSelectAll(false);
        } else {
            setSelectedStudentIds(eligibleStudents.map(s => s.id));
            setSelectAll(true);
        }
    };

    const handleStudentToggle = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        // Prevent selecting students who are not exam eligible
        if (!selectedStudentIds.includes(studentId) && student && student.examEligibility !== true) {
            toast.error(`${student.fullName} is not eligible for exam.`);
            return;
        }

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
            setIsEditingSchedule(false);
            toast.success('Exam dates saved. You can now generate admit cards.');
        } catch (err) {
            console.error('Failed to save exam schedule:', err);
            toast.error('Failed to save exam schedule. Please try again.');
        }
    };

    const handleGenerateAdmitCards = async () => {
        if (!canGenerate) return;

        // Check for ineligible students - only allow students with examEligibility === true
        const ineligibleStudents = students.filter(s =>
            selectedStudentIds.includes(s.id) && s.examEligibility !== true
        );

        if (ineligibleStudents.length > 0) {
            const names = ineligibleStudents.map(s => s.fullName).join(', ');
            toast.error(`Cannot generate admit cards: ${names} ${ineligibleStudents.length === 1 ? 'is' : 'are'} not eligible for exam. Please deselect ${ineligibleStudents.length === 1 ? 'them' : 'them'} and try again.`);
            return;
        }

        setGenerating(true);
        try {
            let successCount = 0;
            for (const studentId of selectedStudentIds) {
                try {
                    const blob = await createAdmitCard({
                        studentId,
                        examType: selectedExamType as 'HALF_YEARLY' | 'FINAL',
                    }).unwrap();

                    // Determine filename from selected student (if available)
                    const student = students.find(s => s.id === studentId);
                    const safeName = (student?.fullName ?? studentId)
                        .replace(/[^\w\-]+/g, '_').slice(0, 40);
                    const filename = `AdmitCard_${safeName}_${selectedExamType}.pdf`;

                    // Trigger a browser download for this PDF
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    successCount += 1;
                } catch (innerErr) {
                    console.error('Failed to generate admit card for student', studentId, innerErr);
                }
            }
            if (successCount > 0) {
                toast.success(`Generated & downloaded ${successCount} admit card(s).`);
            } else {
                toast.error('Failed to generate any admit cards.');
            }
            setSelectedStudentIds([]);
            setSelectAll(false);
        } catch (err) {
            console.error("Failed to generate admit cards:", err);
            toast.error("Failed to generate admit cards. Please try again.");
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
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-700">Schedule status</p>
                                        <p className={`text-sm ${scheduleSaved ? 'text-emerald-600' : scheduleComplete ? 'text-amber-600' : 'text-slate-500'}`}>
                                            {scheduleStatus}
                                        </p>
                                    </div>
                                    {scheduleSaved && !isEditingSchedule && (
                                        <button
                                            onClick={() => setIsEditingSchedule(true)}
                                            className="px-3 py-1.5 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
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
                                <>
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
                                                    disabled={scheduleSaved && !isEditingSchedule}
                                                    className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                                        scheduleSaved && !isEditingSchedule ? 'bg-gray-100 cursor-not-allowed' : ''
                                                    }`}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        {isEditingSchedule || !scheduleSaved ? (
                                            <>
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
                                                {scheduleSaved && (
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingSchedule(false);
                                                            // Restore original saved dates
                                                            const initialDates: Record<string, string> = {};
                                                            subjects.forEach((subject) => {
                                                                const existing = examSchedule.find((entry) => entry.subjectId === subject.id);
                                                                initialDates[subject.id] = existing?.examDate ?? '';
                                                            });
                                                            setExamScheduleDates(initialDates);
                                                            setScheduleSaved(true);
                                                        }}
                                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center space-x-2 text-emerald-600">
                                                <CheckCircle size={16} />
                                                <span className="text-sm">Exam schedule saved</span>
                                            </div>
                                        )}
                                        <p className="text-sm text-gray-500">
                                            {scheduleSaved && !isEditingSchedule
                                                ? 'Click Edit to modify exam dates.'
                                                : 'All subjects must have an exam date before you can generate admit cards.'}
                                        </p>
                                    </div>
                                </>
                            )}
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
                                    {selectAll || selectedStudentIds.length === students.filter(s => s.examEligibility === true).length ? "Deselect All" : "Select All (Eligible Only)"}
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
                                                    : student.examEligibility !== true
                                                        ? 'border-red-200 bg-red-50 opacity-70'
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
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-800 truncate">{student.fullName}</p>
                                                    {student.examEligibility !== true && (
                                                        <span title="Not eligible for exam" className="shrink-0">
                                                            <AlertTriangle size={14} className="text-red-500" />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">Adm: {student.admissionNo}</p>
                                                {student.examEligibility !== true && (
                                                    <p className="text-xs text-red-500 mt-1">Not eligible</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {selectedStudentIds.length > 0 && (
                                <div className="mt-4 flex items-center space-x-2 text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                                    <CheckCircle size={16} />
                                    <span className="font-medium">{selectedStudentIds.length} eligible student(s) selected</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admit Card Preview (true HTML — matches the Puppeteer PDF) */}
                    {canGenerate && selectedExamType && (
                        <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admit Card Preview</h3>
                            <AdmitCardPreview
                                preview={admitCardPreview ?? null}
                                loading={loadingPreview}
                                examLabel={EXAM_TYPES.find(e => e.value === selectedExamType)?.label ?? ''}
                            />
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

// ─── HTML Admit Card Preview ────────────────────────────────────────────
// Mirrors the backend Puppeteer template (admit-card-template.ts) so the
// user sees exactly what will be downloaded. Always renders 10 table rows
// (empty cells if fewer subjects are scheduled).
function AdmitCardPreview({
    preview,
    loading,
    examLabel,
}: {
    preview: AdmitCardPreviewData | null;
    loading: boolean;
    examLabel: string;
}) {
    const ROWS = 10;
    const schedule = preview?.examSchedule?.length ? preview.examSchedule : [];
    const sessionYear = preview?.examDate
        ? (() => {
              const d = new Date(preview.examDate);
              const start = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
              const end = String((start + 1) % 100).padStart(2, '0');
              return `${start}-${end}`;
          })()
        : `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`;

    const fmt = (iso: string | null | undefined) => {
        if (!iso) return 'TBD';
        try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return 'TBD'; }
    };

    return (
        <div className="bg-white border-2 border-blue-900 rounded-lg overflow-hidden max-w-2xl mx-auto shadow-lg">
            <style jsx>{`
                .ac-header { display: flex; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                .ac-header img { width: 56px; height: 56px; object-fit: contain; }
                .ac-school { flex: 1; text-align: center; font-weight: 700; font-size: 14px; line-height: 1.25; color: #0f172a; }
                .ac-school small { display: block; font-size: 10px; font-weight: 500; color: #475569; margin-top: 2px; }
                .ac-title { text-align: center; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 12px 0 4px; color: #1e3a8a; }
                .ac-exam { text-align: center; font-size: 12px; margin-bottom: 14px; color: #334155; }
                .ac-exam strong { color: #1e3a8a; }
                .ac-row { display: flex; gap: 14px; margin: 12px 0 6px; }
                .ac-text { flex: 1; }
                .ac-label { font-weight: 700; font-size: 11px; color: #475569; margin-top: 4px; }
                .ac-value { font-size: 13px; border-bottom: 1px dotted #94a3b8; padding: 0 0 2px 0; color: #0f172a; }
                .ac-photo { width: 90px; height: 110px; border: 1.5px solid #1e3a8a; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; }
                .ac-photo img { width: 100%; height: 100%; object-fit: cover; }
                .ac-photo-ph { font-size: 10px; color: #94a3b8; font-weight: 600; }
                .ac-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                .ac-table th, .ac-table td { border: 1px solid #1e3a8a; padding: 6px 8px; font-size: 11px; text-align: left; }
                .ac-table th { background: #f1f5f9; text-align: center; color: #1e3a8a; }
                .ac-table td:nth-child(1) { width: 28%; }
                .ac-table td:nth-child(2) { width: 56%; }
                .ac-table td:nth-child(3) { width: 16%; }
                .ac-sig { text-align: center; margin-top: 24px; font-size: 11px; }
                .ac-sig .line { display: inline-block; border-top: 1px solid #1e293b; padding-top: 3px; min-width: 180px; font-weight: 600; }
            `}</style>

            <div className="p-5">
                <div className="ac-header">
                    <Image src="/MLZS_contents/Horizontal MLZS Logo.png" alt="MLZS" width={56} height={56} />
                    <div className="ac-school">
                        Mount Litera Zee School
                        <small>North Kolkata, Barrackpore</small>
                    </div>
                </div>

                <div className="ac-title">ADMIT CARD</div>
                <div className="ac-exam">
                    <strong>{examLabel || 'Examination'}</strong><br />
                    Session: <strong>{sessionYear}</strong>
                </div>

                <div className="ac-row">
                    <div className="ac-text">
                        <div className="ac-label">Name:</div>
                        <div className="ac-value">{preview?.studentName ?? '—'}</div>
                        <div className="ac-label">Class:</div>
                        <div className="ac-value">{preview ? `${preview.classroom.grade} ${preview.classroom.section}` : '—'}</div>
                        <div className="ac-label">Section:</div>
                        <div className="ac-value">{preview?.classroom.section ?? '—'}</div>
                        <div className="ac-label">Roll No.:</div>
                        <div className="ac-value">{preview?.rollNumber ?? '—'}</div>
                    </div>
                    <div className="ac-photo">
                        {preview?.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={preview.profileImage} alt="Photo" />
                        ) : (
                            <span className="ac-photo-ph">PHOTO</span>
                        )}
                    </div>
                </div>

                <table className="ac-table">
                    <thead>
                        <tr><th>DATE</th><th>SUBJECT</th><th>SIGN</th></tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="text-center text-slate-500">Loading schedule…</td></tr>
                        ) : (
                            Array.from({ length: ROWS }).map((_, i) => {
                                const entry = schedule[i];
                                return (
                                    <tr key={i}>
                                        <td>{entry ? fmt(entry.examDate) : ' '}</td>
                                        <td>{entry?.subjectName ?? ' '}</td>
                                        <td>{' '}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                <div className="ac-sig">
                    <div className="line">Signature of Principal</div>
                </div>
            </div>
        </div>
    );
}
