import ClassroomStudentsClient from "./ClassroomStudentsClient";

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: classroomId } = await params;

    return <ClassroomStudentsClient classroomId={classroomId} />;
}
