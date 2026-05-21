import LoginForm from "@/components/auth/LoginForm";

export default function AccountsLoginPage() {
    return (
        <LoginForm
            expectedRole="ACCOUNTANT"
            roleLabel="Accounts"
            colorScheme={{
                primary: "amber-600",
                primaryHover: "amber-700",
                primaryLight: "amber-200",
                accent: "text-amber-500",
            }}
            redirectPath="/accounts"
        />
    );
}