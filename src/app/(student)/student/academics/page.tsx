import { getMockSession, MOCK_ATTENDANCE, MOCK_EXAM_RESULTS } from "@/lib/mocks";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock } from "lucide-react";

async function getStudentAcademics(studentId: string) {
    // Return mock data directly
    return { attendance: MOCK_ATTENDANCE, examResults: MOCK_EXAM_RESULTS };
}

export default async function StudentAcademicsPage() {
    const session = await getMockSession();
    if (!session) return null;

    const { attendance, examResults } = await getStudentAcademics(session.user.id);

    // Calculate Attendance Stats
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'PRESENT').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Academics</h1>

            <Tabs defaultValue="exams" className="w-full space-y-6">
                <TabsList className="bg-white border text-gray-500">
                    <TabsTrigger value="exams" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">Exam Results</TabsTrigger>
                    <TabsTrigger value="attendance" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="exams" className="space-y-4">
                    {examResults.length > 0 ? (
                        <div className="grid gap-4">
                            {examResults.map(result => (
                                <div key={result.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{result.exam.name}</h3>
                                        <p className="text-sm text-gray-500">{result.exam.subject.name}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(result.exam.date!).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-900">
                                            {result.marksObtained} <span className="text-sm text-gray-400">/ {result.exam.totalMarks}</span>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded inline-block mt-1
                                    ${result.marksObtained >= result.exam.passingMarks ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                `}>
                                            {result.marksObtained >= result.exam.passingMarks ? 'PASS' : 'FAIL'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 text-gray-500 bg-white rounded-xl border">
                            No exam results published yet.
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="attendance">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card className="p-4 bg-blue-50 border-blue-100">
                            <div className="text-blue-900 font-bold text-xl">{percentage}%</div>
                            <div className="text-blue-700 text-sm">Attendance Rate</div>
                        </Card>
                        <Card className="p-4 bg-green-50 border-green-100">
                            <div className="text-green-900 font-bold text-xl">{present}</div>
                            <div className="text-green-700 text-sm">Days Present</div>
                        </Card>
                        <Card className="p-4 bg-red-50 border-red-100">
                            <div className="text-red-900 font-bold text-xl">{total - present}</div>
                            <div className="text-red-700 text-sm">Days Absent</div>
                        </Card>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Recorded By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {attendance.map(record => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            {record.status === 'PRESENT' && <span className="flex items-center text-green-600 font-bold text-xs"><CheckCircle size={14} className="mr-1" /> Present</span>}
                                            {record.status === 'ABSENT' && <span className="flex items-center text-red-600 font-bold text-xs"><XCircle size={14} className="mr-1" /> Absent</span>}
                                            {record.status === 'LATE' && <span className="flex items-center text-yellow-600 font-bold text-xs"><Clock size={14} className="mr-1" /> Late</span>}
                                            {record.status === 'EXCUSED' && <span className="flex items-center text-gray-600 font-bold text-xs">Excused</span>}
                                        </td>
                                        <td className="p-4 text-xs text-gray-400">Teacher</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
