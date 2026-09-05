"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Eye, IndianRupee, Loader2, Search, Users,
    ShieldCheck, ShieldX, Bus, BusFront, X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    useGetStudentFeesQuery,
    useSearchStudentsFeesQuery,
    useGetStudentDetailQuery,
    useUpdateExamEligibilityMutation,
} from "@/redux/api/accountsApi";
import { Tooltip } from "@/components/ui/tooltip";

export default function StudentFeePage() {
    const params = useParams();
    const router = useRouter();
    const classroomId = Array.isArray(params.id) ? (params.id as string[])[0] : (params.id as string) ?? "";

    const [searchQuery, setSearchQuery] = useState("");

    // Default list = classroom students for the current month
    const now = new Date();
    const { data: studentFees = [], isLoading, refetch } = useGetStudentFeesQuery({
        classroomId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    }, { skip: !classroomId || searchQuery.trim().length > 0 });

    const { data: searchResults = [], isFetching: isSearching } = useSearchStudentsFeesQuery({
        classroomId,
        query: searchQuery.trim() || undefined,
    }, { skip: !searchQuery.trim() });

    const display = (searchQuery.trim() ? searchResults : studentFees) as any[];

    const classroomName = display?.[0]?.classroomName ?? "Classroom";

    // Eligibility + transport toggles
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const { data: selectedStudentDetail } = useGetStudentDetailQuery(
        { studentId: selectedStudentId! },
        { skip: !selectedStudentId }
    );
    const [updateEligibility, { isLoading: isUpdatingEligibility }] = useUpdateExamEligibilityMutation();

    const handleToggleEligibility = async () => {
        if (!selectedStudentDetail) return;
        const newVal = !selectedStudentDetail.examEligibility;
        try {
            await updateEligibility({
                studentId: selectedStudentId!,
                examEligibility: newVal,
            }).unwrap();
            toast.success(`Exam eligibility ${newVal ? 'enabled' : 'disabled'}`);
            setSelectedStudentId(null);
            refetch();
        } catch {
            toast.error("Failed to update exam eligibility.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{classroomName} — Students</h1>
                        <p className="text-gray-500 text-sm mt-1">{display.length} Students</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search student by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-gray-900"
                    />
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-amber-500 overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading || isSearching ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                        </div>
                    ) : display.length === 0 ? (
                        <div className="text-center py-12">
                            <Users size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">No students found</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Transport</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Exam Eligibility</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {display.map((s) => (
                                    <tr key={s.studentId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">{s.rollNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                                                    {s.fullName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-800">{s.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {s.transportOpted ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                                    <BusFront size={12} /> Yes
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                                                    <Bus size={12} /> No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedStudentId(s.studentId)}
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                    s.examEligibility
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                                title="Click to toggle exam eligibility"
                                            >
                                                {s.examEligibility ? (
                                                    <><ShieldCheck size={12} /> Eligible</>
                                                ) : (
                                                    <><ShieldX size={12} /> Not Eligible</>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Tooltip content="View Fee Details" side="top">
                                                <Link
                                                    href={`/accounts/student/${classroomId}/details/${s.studentId}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors text-xs font-semibold"
                                                >
                                                    <Eye size={14} />
                                                    View Details
                                                </Link>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Exam Eligibility Modal */}
            {selectedStudentId && selectedStudentDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-xl shadow-2xl max-w-md w-full overflow-hidden`}>
                        <div className={`p-5 flex items-center justify-between text-white ${
                            selectedStudentDetail.examEligibility ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                            <div className="flex items-center gap-3">
                                {selectedStudentDetail.examEligibility ? <ShieldCheck size={28} /> : <ShieldX size={28} />}
                                <div>
                                    <h3 className="text-xl font-bold">Exam Eligibility</h3>
                                    <p className="text-sm opacity-80">{selectedStudentDetail.fullName}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudentId(null)} className="p-1 hover:bg-white/20 rounded transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 bg-white">
                            <div className="text-center mb-6">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold mb-3 ${
                                    selectedStudentDetail.examEligibility
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {selectedStudentDetail.examEligibility
                                        ? <><ShieldCheck size={18} /> Currently Eligible</>
                                        : <><ShieldX size={18} /> Currently Not Eligible</>}
                                </div>
                                <p className="text-gray-600 text-sm">
                                    {selectedStudentDetail.examEligibility
                                        ? 'This student can appear for exams.'
                                        : 'This student is NOT eligible to appear for exams.'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedStudentId(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleToggleEligibility}
                                    disabled={isUpdatingEligibility}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${
                                        selectedStudentDetail.examEligibility
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isUpdatingEligibility ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin" size={16} /> Updating...
                                        </span>
                                    ) : (
                                        selectedStudentDetail.examEligibility ? 'Mark as Not Eligible' : 'Mark as Eligible'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
