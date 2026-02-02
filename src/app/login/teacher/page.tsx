import LoginForm from "@/components/LoginForm";

export default function TeacherLoginPage() {
    return (
        <LoginForm
            title="Teacher Login"
            description="Manage your classroom and students"
            redirectTo="/teacher"
        />
    );
}
