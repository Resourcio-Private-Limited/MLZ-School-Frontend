import LoginForm from "@/components/LoginForm";

export default function SuperAdminLoginPage() {
    return (
        <LoginForm
            title="Super Admin Login"
            description="Complete system administration and control"
            redirectTo="/super-admin"
        />
    );
}
