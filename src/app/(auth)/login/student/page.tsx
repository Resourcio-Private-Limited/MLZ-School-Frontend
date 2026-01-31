import LoginForm from "@/components/LoginForm";

export default function StudentLoginPage() {
    return <LoginForm title="Student Login" description="Access your grades, attendance, and more" redirectTo="/student" />;
}
