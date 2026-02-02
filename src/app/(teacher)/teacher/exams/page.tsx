import { getMockSession, MOCK_EXAM_RESULTS } from "@/lib/mocks";
import Link from "next/link";
import { FileText, Calendar } from "lucide-react";

export default async function TeacherExamsPage() {
    const session = await getMockSession();
    if (!session) return null;

    // Use mock data for exams. 
    // MOCK_EXAM_RESULTS contains exam details inside 'exam' property.
    // We can extract unique exams from there.
    const exams = Array.from(new Map(MOCK_EXAM_RESULTS.map(r => [r.exam.id, r.exam])).values()).map(e => ({
        ...e,
        isPublished: true, // Mock value
        subject: { // Mock subject structure to match usage
            name: e.subject.name,
            classroom: { name: 'Class 10-A' }
        },
        _count: { results: 25 } // Mock count
    }));

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Exam Results</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map(exam => (
                    <Link key={exam.id} href={`/teacher/exams/${exam.id}`} className="group">
                        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-emerald-500 hover:shadow-lg transition-all duration-300 h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded font-bold ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {exam.isPublished ? "PUBLISHED" : "DRAFT"}
                                </span>
                            </div>

                            <h2 className="text-lg font-bold text-gray-800 mb-1">{exam.name}</h2>
                            <p className="text-sm text-gray-500 mb-4">{exam.subject.name} ({exam.subject.classroom.name})</p>

                            <div className="flex items-center text-xs text-gray-400 mb-4">
                                <Calendar size={14} className="mr-1" />
                                {exam.date ? new Date(exam.date).toLocaleDateString() : "Date TBD"}
                            </div>

                            <div className="border-t pt-4 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Results Uploaded:</span>
                                <span className="font-bold text-gray-900">{exam._count.results}</span>
                            </div>
                        </div>
                    </Link>
                ))}

                {exams.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-white rounded-xl border text-gray-500">
                        No exams found for your subjects. Contact Admin to schedule exams.
                    </div>
                )}
            </div>
        </div>
    );
}
