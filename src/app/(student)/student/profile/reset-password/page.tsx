"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);

        // TODO: Connect to backend API for password reset
        // Simulate API call
        setTimeout(() => {
            setSuccess("Password reset successful! Redirecting to profile...");
            setTimeout(() => {
                router.push("/student/profile");
            }, 2000);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-2xl border border-white/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                    <Link href="/student/profile" className="flex items-center space-x-2 text-white/90 hover:text-white mb-4 transition-colors">
                        <ArrowLeft size={20} />
                        <span>Back to Profile</span>
                    </Link>
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/MLZS_contents/Horizontal MLZS Logo.png"
                            alt="Mount Litera Zee School"
                            width={200}
                            height={60}
                            className="h-auto brightness-0 invert"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-center">Reset Password</h1>
                    <p className="text-center text-purple-100 mt-2">Enter your details to reset your password</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm border border-green-100">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                placeholder="student@school.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                placeholder="Enter new password"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none transition-all"
                                placeholder="Re-enter new password"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                        >
                            {loading ? "Resetting Password..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
