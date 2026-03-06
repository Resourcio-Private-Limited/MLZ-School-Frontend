import { getMockSession, MOCK_EXAM_RESULTS, MOCK_STUDENTS_LIST } from "@/lib/mocks";
import MarksEntrySheet from "@/components/MarksEntrySheet";
import { notFound } from "next/navigation";

export default async function ExamEntryPage({ params }: { params: Promise<{ examId: string }> }) {
    const session = await getMockSession();
    if (!session) return null;
    const { examId } = await params;

    // Find mock exam
    const mockResult = MOCK_EXAM_RESULTS.find(r => r.exam.id === examId);
    if (!mockResult) {
        // Fallback for demo if id not found exactly, or just use first one
        // notFound(); 
        // For demo flow, let's just pick the first mock exam data if explicit id not found
    }

    // Construct mock exam object
    const exam = mockResult ? mockResult.exam : MOCK_EXAM_RESULTS[0].exam;

    // Add classroom info to exam subject for display
    const examWithClass = {
        ...exam,
        subject: {
            ...exam.subject,
            classroomId: 'class-1',
            classroom: { name: 'Class 1-A' }
        }
    };

    // Mock students
    const students = MOCK_STUDENTS_LIST;

    // Mock existing results
    const results = MOCK_EXAM_RESULTS.filter(r => r.exam.id === examId || r.exam.id === examWithClass.id);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Result Entry : {examWithClass.name}</h1>
                <p className="text-gray-500">{examWithClass.subject.name} - {examWithClass.subject.classroom.name}</p>
            </div>

            <MarksEntrySheet
                exam={examWithClass}
                students={students}
                existingResults={results}
            />
        </div>
    );
}
