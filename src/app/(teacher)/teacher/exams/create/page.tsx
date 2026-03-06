import { getMockSession, MOCK_TEACHERS } from "@/lib/mocks";
import CreateExamForm from "./CreateExamForm";

export default async function CreateExamPage() {
    const session = await getMockSession();
    if (!session) return null;

    // Mock teacher details - getting the first mock teacher for demo
    const teacherProfile = {
        ...MOCK_TEACHERS[0],
        subjectsTaught: MOCK_TEACHERS[0].subjectsTaught.map(s => ({
            ...s,
            classroom: { name: 'Class 10-A', section: 'A' } // Mock details
        }))
    };

    if (!teacherProfile) return <div>Access Denied</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Exam</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <CreateExamForm subjects={teacherProfile.subjectsTaught} />
            </div>
        </div>
    );
}
