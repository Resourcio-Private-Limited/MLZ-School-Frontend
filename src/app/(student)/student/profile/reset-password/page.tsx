"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { PageHeader, focusRing, inputClass, primaryBtn, secondaryBtn } from "@/components/student/ui";

const MIN_LENGTH = 8;

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [show, setShow] = useState(false);
    const [touched, setTouched] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [resetPassword] = useResetPasswordMutation();

    const longEnough = newPassword.length >= MIN_LENGTH;
    const matches = confirmPassword.length > 0 && newPassword === confirmPassword;
    const mismatch = touched && confirmPassword.length > 0 && !matches;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (!longEnough || !matches) return;

        // If the student arrived here from an email link, use that token.
        // Otherwise use the session token; the backend auth guard attaches the user to the request.
        const urlToken = new URLSearchParams(window.location.search).get("token");
        const token = urlToken ?? localStorage.getItem("accessToken");
        if (!token) {
            toast.error("Your session has ended. Log in again, then change your password.");
            return;
        }

        setLoading(true);
        try {
            await resetPassword({ token, newPassword }).unwrap();
            toast.success("Password changed.");
            router.push("/student/profile");
        } catch (err: unknown) {
            const e2 = err as { data?: { message?: string }; message?: string };
            const msg = typeof e2?.data?.message === "string" ? e2.data.message : e2?.message;
            toast.error(msg ? `Password not changed. ${msg}` : "Password not changed. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl space-y-6">
            <PageHeader title="Change password" subtitle="You'll use the new password the next time you log in." crumb={{ href: "/student/profile", label: "Your profile" }} />

            <section className="max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="space-y-5 px-4 py-5 sm:px-6">
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="new-password" className="text-sm font-medium text-gray-700">New password</label>
                                <button
                                    type="button"
                                    onClick={() => setShow((s) => !s)}
                                    aria-pressed={show}
                                    className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-sm font-medium text-gray-600 hover:text-gray-900 ${focusRing}`}
                                >
                                    {show ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                                    {show ? "Hide" : "Show"}
                                </button>
                            </div>
                            <input
                                id="new-password"
                                type={show ? "text" : "password"}
                                autoComplete="new-password"
                                autoFocus
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                aria-describedby="password-rule"
                                aria-invalid={touched && !longEnough}
                                className={`${inputClass} mt-1.5`}
                            />
                            <p id="password-rule" className={`mt-1.5 inline-flex items-center gap-1.5 text-xs ${longEnough ? "text-emerald-700" : touched ? "text-red-700" : "text-gray-500"}`}>
                                {longEnough && <Check size={14} aria-hidden="true" />}
                                At least {MIN_LENGTH} characters
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">Confirm new password</label>
                            <input
                                id="confirm-password"
                                type={show ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() => confirmPassword && setTouched(true)}
                                aria-describedby={mismatch ? "confirm-error" : undefined}
                                aria-invalid={mismatch}
                                className={`${inputClass} mt-1.5 ${mismatch ? "border-red-400 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                            />
                            {mismatch && (
                                <p id="confirm-error" className="mt-1.5 text-xs text-red-700">The two passwords don&apos;t match. Type the new password again.</p>
                            )}
                            {matches && longEnough && (
                                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-emerald-700">
                                    <Check size={14} aria-hidden="true" />
                                    Passwords match
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <Link href="/student/profile" className={`${secondaryBtn} h-10`}>Cancel</Link>
                        <button type="submit" disabled={loading} className={primaryBtn}>
                            {loading ? "Changing password…" : "Change password"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
