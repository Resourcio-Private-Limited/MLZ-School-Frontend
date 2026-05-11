"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useResetPasswordMutation } from "@/redux/api/authApi";

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid or expired reset link. Please request a new password reset.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        try {
            await resetPassword({ token, newPassword: password }).unwrap();
            setSuccess(true);
        } catch (err: unknown) {
            const e2 = err as { data?: { message?: string }; message?: string };
            const msg =
                typeof e2?.data?.message === "string"
                    ? e2.data.message
                    : e2?.message ?? "Failed to reset password. The link may have expired.";
            setError(msg);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Complete!</h1>
                    <p className="text-gray-500 mb-6">Your password has been successfully changed. You can now log in with your new password.</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="w-full bg-blue-900 text-white py-2 rounded font-bold hover:bg-blue-800 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Set New Password</h1>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    Enter your new password below.
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full border rounded-lg p-2.5 pr-10 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1 text-gray-700">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                className="w-full border rounded-lg p-2.5 pr-10 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Re-enter password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirm && password !== confirm && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || (confirm !== "" && password !== confirm)}
                        className="w-full bg-blue-900 text-white py-2.5 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
