"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileText, AlertCircle } from "lucide-react";
import { useGetExamsQuery } from "@/redux/api/studentApi";

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
};

export default function ExamsPage() {
    const { data: exams = [], isLoading, error } = useGetExamsQuery();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/student">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300" />
                    <h1 className="text-3xl font-bold text-slate-800">Exam Area</h1>
                </div>
            </div>

            {/* Exams Table */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-purple-500 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Exam Name</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Exam Date</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Eligibility</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Admit Card</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">Loading exams...</p>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-red-500 text-sm">Failed to load exams. Please try again.</p>
                                    </td>
                                </tr>
                            ) : exams.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <p className="text-slate-500 text-sm">No exams found for your classroom.</p>
                                    </td>
                                </tr>
                            ) : (
                                exams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-slate-800 font-semibold">{exam.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{exam.subject}</td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(exam.examDate)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {exam.submissionOpen ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                                                    Eligible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wide">
                                                    Ineligible
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {exam.admitCard ? (
                                                <a
                                                    href={exam.admitCard.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                                                >
                                                    <Download size={16} />
                                                    <span>Download</span>
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Not Published</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {exam.result ? (
                                                <a
                                                    href={exam.result.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center space-x-2 bg-white border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-bold"
                                                >
                                                    <FileText size={16} />
                                                    <span>View Result</span>
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Not Published</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 flex items-start gap-4">
                <div className="bg-purple-100 p-2 rounded-full text-purple-600 mt-1">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h3 className="text-purple-800 font-bold mb-1">Examination Guidelines</h3>
                    <p className="text-sm text-purple-700/80 leading-relaxed">
                        Admit cards are usually available 1 week before the scheduled exam date.
                        Results will be published within 15 days of the final examination.
                        Please ensure all school dues are cleared before downloading admit cards.
                    </p>
                </div>
            </div>
        </div>
    );
}
