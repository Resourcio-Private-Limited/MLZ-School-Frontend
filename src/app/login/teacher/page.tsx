import LoginForm from "@/components/auth/LoginForm";

export default function TeacherLoginPage() {
    return (
        <LoginForm
            expectedRole="TEACHER"
            roleLabel="Teacher"
            colorScheme={{
                primary: "emerald-600",
                primaryHover: "emerald-700",
                primaryLight: "emerald-200",
                accent: "text-emerald-500",
            }}
            redirectPath="/teacher"
        />
    );
}