"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LoginFormProps {
    title: string;
    description?: string;
    redirectTo?: string;
    identifierLabel?: string;
    identifierPlaceholder?: string;
    identifierType?: string;
}

export default function LoginForm({
    title,
    description,
    redirectTo = "/student",
    identifierLabel = "Email Address",
    identifierPlaceholder = "name@school.com",
    identifierType = "email"
}: LoginFormProps) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // TODO: Connect to new backend API for authentication
        // For now, just redirect to dashboard
        setTimeout(() => {
            router.push(redirectTo);
        }, 500);
    };

    return (
        <div className="min-h-screen flex items-stretch">
            {/* Left Side: Hero Section (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 text-white mb-12">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                        </div>
                        <span className="text-xl font-bold tracking-wide">MLZS PORTAL</span>
                    </div>

                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Nurturing Potential,<br />
                        <span className="text-blue-500">Unleashing Brilliance</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-8">
                        Welcome to the Mount Litera Zee School digital learning environment. Access your dashboard to manage academics, resources, and more.
                    </p>

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
                        <Image
                            src="/MLZS_contents/Students Stage 1.png"
                            alt="Students Learning"
                            width={500}
                            height={300}
                            className="object-cover w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    </div>
                </div>

                <div className="relative z-10 text-slate-500 text-sm">
                    © {new Date().getFullYear()} Mount Litera Zee School. All rights reserved.
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 bg-slate-50 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

                    <div className="mb-8 text-center lg:text-left">
                        <div className="lg:hidden flex justify-center mb-6">
                            <Image
                                src="/MLZS_contents/Horizontal MLZS Logo.png"
                                alt="Mount Litera Zee School"
                                width={180}
                                height={50}
                                className="h-auto"
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
                        {description && <p className="text-slate-500">{description}</p>}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100 flex items-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-slate-700">{identifierLabel}</label>
                            <input
                                type={identifierType}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300"
                                placeholder={identifierPlaceholder}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="block text-sm font-bold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot Password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 hover:bg-white hover:border-slate-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </span>
                            ) : "Sign In"}
                        </button>

                        <div className="text-center pt-2">
                            <a href="/" className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                                <span>Back to Home</span>
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
