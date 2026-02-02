import LoginForm from "@/components/LoginForm";

export default function PrincipalLoginPage() {
    return (
        <LoginForm
            title="Principal Login"
            description="School administration and oversight"
            redirectTo="/principal"
            identifierLabel="User ID"
            identifierPlaceholder="Enter User ID"
            identifierType="text"
        />
    );
}
