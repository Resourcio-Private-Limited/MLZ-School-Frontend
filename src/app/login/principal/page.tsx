import LoginForm from "@/components/auth/LoginForm";

export default function PrincipalLoginPage() {
    return (
        <LoginForm
            expectedRole="PRINCIPAL"
            roleLabel="Principal"
            colorScheme={{
                primary: "purple-600",
                primaryHover: "purple-700",
                primaryLight: "purple-200",
                accent: "text-purple-500",
            }}
            redirectPath="/principal"
        />
    );
}