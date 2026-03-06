import LoginForm from "@/components/LoginForm";

export default function StudentLoginPage() {
    return (
        <LoginForm
            title="Student Login"
            description="Access your dashboard and learning resources"
            redirectTo="/student"
        />
    );
}
