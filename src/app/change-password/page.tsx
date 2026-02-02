"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockAction } from "@/lib/mocks";

export default function ChangePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Mock session update
    const update = async (data: any) => { return null; };

    const handleSubmit = async (e: React.FormEvent) => {
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

        setLoading(true);

        try {
            // Use mock action
            const res = await mockAction("changePassword", { password });

            if (!res.success) {
                throw new Error(res.message);
            }

            // Update session locally to reflect change (isFirstLogin: false)
            await update({ isFirstLogin: false });

            router.refresh();
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">Change Password</h1>
                <p className="text-sm text-gray-500 mb-6 text-center">
                    This is your first login. For security, please set a new password.
                </p>

                {error && <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">New Password</label>
                        <input
                            type="password"
                            className="w-full border p-2 rounded"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full border p-2 rounded"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
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

                    <div className="text-center mt-4">
                        <button type="button" onClick={() => router.push('/login')} className="text-sm text-gray-500 hover:text-gray-700">
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
