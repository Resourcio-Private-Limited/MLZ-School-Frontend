"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Home, User, FileText, Bell, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { logout } from "@/redux/slices/authSlice";
import { useGetPrincipalProfileQuery } from "@/redux/api/principalApi";

export default function PrincipalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const { data: profile } = useGetPrincipalProfileQuery();

    const handleLogout = () => {
        dispatch(logout());
        router.push("/login");
    };

    const displayName = profile?.fullName ?? "Principal";
    const displayEmail = profile?.userEmail ?? profile?.email ?? "principal@school.com";

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 shadow-xl flex flex-col transition-all duration-300 relative border-r border-slate-800`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-purple-600 text-white rounded-full p-1.5 shadow-lg hover:bg-purple-500 transition-colors z-10 border-2 border-slate-900"
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
                            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Principal Portal</p>
                        </div>
                    ) : (
                        /* Collapsed Logo (Favicon) */
                        <div className="flex justify-center">
                            <Image
                                src="/favicon.png"
                                alt="Mount Litera Zee School, North Kolkata, Barrackpore"
                                width={40}
                                height={40}
                                className="h-10 w-10 object-contain rounded-lg"
                            />
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink href="/principal" icon={<Home size={20} />} label="Home" isCollapsed={isCollapsed} />
                    <NavLink href="/principal/admit-card" icon={<FileText size={20} />} label="Create Admit Card" isCollapsed={isCollapsed} />
                    <NavLink href="/principal/noticeboard" icon={<Bell size={20} />} label="Notice Board" isCollapsed={isCollapsed} />
                    <NavLink href="/principal/profile" icon={<User size={20} />} label="Profile" isCollapsed={isCollapsed} />
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-purple-400 font-bold">
                                    {displayName?.[0] ?? "P"}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-slate-200 truncate max-w-35">{displayName}</p>
                                    <p className="text-xs text-slate-500 truncate max-w-35">{displayEmail}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-3 rounded-lg transition-colors text-sm font-semibold shadow-lg hover:shadow-red-600/50 w-full"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-purple-400 font-bold">
                                {displayName?.[0] ?? "P"}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-red-600/50"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
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
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg text-slate-400 hover:bg-purple-600 hover:text-white transition-all duration-200 group`}
            title={isCollapsed ? label : undefined}
        >
            <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
            {!isCollapsed && <span className="font-medium">{label}</span>}
        </Link>
    );
}
