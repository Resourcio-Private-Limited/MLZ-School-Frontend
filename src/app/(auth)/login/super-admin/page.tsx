import LoginForm from "@/components/LoginForm";

export default function SuperAdminLoginPage() {
    return <LoginForm title="Super Admin Login" description="System Configuration & User Management" redirectTo="/super-admin" />;
}
