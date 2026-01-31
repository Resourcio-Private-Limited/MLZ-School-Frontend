"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";

export default function ExamsPage() {
    // Mock exam data
    const exams = [
        {
            id: 1,
            name: "Half Yearly Examination",
            date: "2024-09-15",
            eligibility: true,
            admitCardAvailable: true,
            resultAvailable: true,
            admitCardUrl: "#",
            resultUrl: "#"
        },
        {
            id: 2,
            name: "Final Examination",
            date: "2024-03-20",
            eligibility: true,
            admitCardAvailable: false,
            resultAvailable: false,
            admitCardUrl: "#",
            resultUrl: "#"
        }
    ];

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
                    <div className="h-6 w-px bg-slate-300"></div>
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
                                <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Exam Date</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Eligibility</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Admit Card</th>
                                <th className="px-6 py-4 text-center text-sm font-bold text-slate-700 uppercase tracking-wider">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {exams.map((exam) => (
                                <tr key={exam.id} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="px-6 py-4 text-slate-800 font-bold">{exam.name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(exam.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {exam.eligibility ? (
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
                                        {exam.admitCardAvailable ? (
                                            <button className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium">
                                                <Download size={16} />
                                                <span>Download</span>
                                            </button>
                                        ) : (
                                            <span className="text-slate-400 text-sm italic">Not Issued</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {exam.resultAvailable ? (
                                            <button className="inline-flex items-center space-x-2 bg-white border-2 border-purple-600 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm font-bold">
                                                <FileText size={16} />
                                                <span>View Result</span>
                                            </button>
                                        ) : (
                                            <span className="text-slate-400 text-sm italic">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start gap-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
                    <FileText size={20} />
                </div>
                <div>
                    <h3 className="text-blue-800 font-bold mb-1">Examination Guidelines</h3>
                    <p className="text-sm text-blue-700/80 leading-relaxed">
                        Admit cards are usually available 1 week before the scheduled date.
                        Results will be published within 15 days of the final examination.
                        Please ensure all dues are cleared to download admit cards.
                    </p>
                </div>
            </div>
        </div>
    );
}
