import LoginForm from "@/components/auth/LoginForm";

export default function StudentLoginPage() {
    return (
        <LoginForm
            expectedRole="STUDENT"
            roleLabel="Student"
            colorScheme={{
                primary: "blue-600",
                primaryHover: "blue-700",
                primaryLight: "blue-200",
                accent: "text-blue-500",
            }}
            redirectPath="/student"
        />
    );
}