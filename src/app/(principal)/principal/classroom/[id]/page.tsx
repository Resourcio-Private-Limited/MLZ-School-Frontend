import ClassroomStudentsClient from "./ClassroomStudentsClient";

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = await params;

    return (
        <ClassroomStudentsClient
            classroom={{
                id: classroomId,
                name: "Loading...",
                grade: "",
                section: "",
                capacity: 100,
                total: 0,
                classTeacher: null,
            }}
            classroomId={classroomId}
        />
    );
}