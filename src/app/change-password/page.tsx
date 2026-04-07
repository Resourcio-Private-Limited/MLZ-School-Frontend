"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/redux/api/authApi";
import { setResetEmail } from "@/redux/slices/authSlice";
import { store } from "@/redux";

export default function ChangePasswordPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"email" | "reset">("email");
    const router = useRouter();

    const [forgotPassword] = useForgotPasswordMutation();
    const [resetPassword] = useResetPasswordMutation();

    // ─── Step 1: Submit email, receive token, move to reset step ───────
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await forgotPassword({ email }).unwrap();

            // Store email in Redux so we know which account we're resetting
            store.dispatch(setResetEmail(email));

            // Token may be in the response or you'd retrieve it via email link.
            // If the backend returns `resetToken` directly, store it; otherwise
            // the user arrives here via the email link which embeds the token.
            // For now we treat the server response as confirmation to proceed.
            setStep("reset");
        } catch (err: unknown) {
            const e2 = err as { data?: { message?: string }; message?: string };
            const msg =
                typeof e2?.data?.message === "string"
                    ? e2.data.message
                    : e2?.message ?? "Failed to request password reset.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: Submit token + new password ──────────────────────────
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        // Read the token from the URL query param (sent via email link)
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
            setError("Missing reset token. Please use the link from your email.");
            return;
        }

        setLoading(true);

        try {
            await resetPassword({ token, newPassword: password }).unwrap();

            // Clear the stored reset email
            const { default: store2 } = await import("@/redux");
            store2.dispatch(setResetEmail(""));

            router.push("/login");
        } catch (err: unknown) {
            const e2 = err as { data?: { message?: string }; message?: string };
            const msg =
                typeof e2?.data?.message === "string"
                    ? e2.data.message
                    : e2?.message ?? "Failed to reset password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // ─── UI ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">
                    {step === "email" ? "Request Password Reset" : "Set New Password"}
                </h1>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    {step === "email"
                        ? "Enter your registered email and we'll send you a reset link."
                        : "Enter your new password below."}
                </p>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded">
                        {error}
                    </div>
                )}

                {step === "email" ? (
                    // ── Step 1: Email form ───────────────────────────────
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="w-full border rounded p-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-900 text-white py-2 rounded font-bold hover:bg-blue-800 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                ) : (
                    // ── Step 2: New password form ───────────────────────
                    <form onSubmit={handleResetSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                className="w-full border rounded p-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="w-full border rounded p-2 text-gray-900 placeholder-gray-500 focus:ring focus:ring-blue-500"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-900 text-white py-2 rounded font-bold hover:bg-blue-800 disabled:opacity-50"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                )}

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