import LoginForm from "@/components/LoginForm";

export default function AccountsLoginPage() {
    return (
        <LoginForm
            title="Accounts Login"
            description="Access the financial management portal"
            redirectTo="/accounts"
        />
    );
}
