import LoginForm from "@/components/LoginForm";

export default function TeacherLoginPage() {
    return <LoginForm title="Teacher Login" description="Manage classes, attendance, and exams" redirectTo="/teacher" />;
}
