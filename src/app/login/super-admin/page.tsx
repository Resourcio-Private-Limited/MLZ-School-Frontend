import LoginForm from "@/components/auth/LoginForm";

export default function SuperAdminLoginPage() {
    return (
        <LoginForm
            expectedRole="SUPER_ADMIN"
            roleLabel="Super Admin"
            colorScheme={{
                primary: "rose-600",
                primaryHover: "rose-700",
                primaryLight: "rose-200",
                accent: "text-rose-500",
            }}
            redirectPath="/super-admin"
        />
    );
}