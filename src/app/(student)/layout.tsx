"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Bell, CreditCard, User, LogOut, ChevronLeft, ChevronRight } from "lucide-react";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // TODO: Connect to new backend API for authentication
    // For now, layout is accessible without authentication
    const mockUser = {
        name: "Student User",
        email: "student@school.com"
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 shadow-xl flex flex-col transition-all duration-300 relative border-r border-slate-800`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-blue-600 text-white rounded-full p-1.5 shadow-lg hover:bg-blue-500 transition-colors z-10 border-2 border-slate-900"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                <div className="p-4 border-b border-slate-800">
                    {!isCollapsed ? (
                        <div className="flex flex-col items-center">
                            {/* Expanded Logo */}
                            <div className="relative w-32 h-auto mb-2">
                                <Image
                                    src="/sidebar_logo_expanded.png"
                                    alt="Mount Litera Zee School"
                                    width={128}
                                    height={40}
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Student Portal</p>
                        </div>
                    ) : (
                        /* Collapsed Logo (Favicon) */
                        <div className="flex justify-center">
                            <Image
                                src="/favicon.png"
                                alt="MLZS"
                                width={40}
                                height={40}
                                className="h-10 w-10 object-contain rounded-lg"
                            />
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink href="/student" icon={<Home size={20} />} label="Home" isCollapsed={isCollapsed} />
                    <NavLink href="/student/noticeboard" icon={<Bell size={20} />} label="Notice Board" isCollapsed={isCollapsed} />
                    <NavLink href="/student/payment" icon={<CreditCard size={20} />} label="Payment Area" isCollapsed={isCollapsed} />
                    <NavLink href="/student/profile" icon={<User size={20} />} label="Profile" isCollapsed={isCollapsed} />
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400 font-bold">
                                    {mockUser.name?.[0] || "S"}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-slate-200">{mockUser.name}</p>
                                    <p className="text-xs text-slate-500">{mockUser.email}</p>
                                </div>
                            </div>
                            <Link href="/" className="flex items-center space-x-3 text-red-400 p-2 hover:bg-red-950/30 rounded-lg transition-colors text-sm font-medium">
                                <LogOut size={18} />
                                <span>Logout</span>
                            </Link>
                        </>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-700/50 flex items-center justify-center text-blue-400 font-bold">
                                {mockUser.name?.[0] || "S"}
                            </div>
                            <Link href="/" className="text-red-400 p-2 hover:bg-red-950/30 rounded-lg transition-colors">
                                <LogOut size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label, isCollapsed }: { href: string; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg text-slate-400 hover:bg-blue-600 hover:text-white transition-all duration-200 group`}
            title={isCollapsed ? label : undefined}
        >
            <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
            {!isCollapsed && <span className="font-medium">{label}</span>}
        </Link>
    );
}
