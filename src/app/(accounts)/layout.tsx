"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutDashboard, PlusCircle, TrendingDown, BarChart3, MessageCircleIcon, LogOut, ChevronLeft, ChevronRight, User, Loader2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export default function AccountantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [accountantName, setAccountantName] = useState("Accountant");
    const [accountantEmail, setAccountantEmail] = useState("accountant@school.com");
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("accessToken");
            const authUser = localStorage.getItem("authUser");
            if (!token || !authUser) {
                router.push("/login/accounts");
            } else {
                try {
                    const user = JSON.parse(authUser);
                    if (user.role !== 'ACCOUNTANT') {
                        router.push("/login/accounts");
                    } else {
                        setAccountantName(user.name ?? user.fullName ?? "Accountant");
                        setAccountantEmail(user.email ?? "accountant@school.com");
                    }
                } catch {
                    router.push("/login/accounts");
                }
            }
            setIsAuthChecked(true);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("userRole");
        router.push("/login/accounts");
    };

    if (!isAuthChecked) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 shadow-xl flex flex-col transition-all duration-300 relative border-r border-slate-800`}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-orange-600 text-white rounded-full p-1.5 shadow-lg hover:bg-orange-500 transition-colors z-10 border-2 border-slate-900"
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
                            <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Accountant Portal</p>
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
                    <NavLink href="/accounts" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} />
                    <NavLink href="/accounts/income" icon={<PlusCircle size={20} />} label="Add Income" isCollapsed={isCollapsed} />
                    <NavLink href="/accounts/expenses" icon={<TrendingDown size={20} />} label="Expenses" isCollapsed={isCollapsed} />
                    <NavLink href="/accounts/analysis" icon={<BarChart3 size={20} />} label="Analysis" isCollapsed={isCollapsed} />
                    <NavLink href="/accounts/messages" icon={<MessageCircleIcon size={20} />} label="Messages" isCollapsed={isCollapsed} />
                    {/* <NavLink href="/accounts/profile" icon={<User size={20} />} label="Profile" isCollapsed={isCollapsed} /> */}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                    {!isCollapsed ? (
                        <>
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-orange-900/50 border border-orange-700/50 flex items-center justify-center text-orange-400 font-bold">
                                    {accountantName?.[0] || "A"}
                                </div>
                                <div>
                                    <p className="font-medium text-sm text-slate-200">{accountantName}</p>
                                    <p className="text-xs text-slate-500">{accountantEmail}</p>
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
                            <div className="w-10 h-10 rounded-full bg-orange-900/50 border border-orange-700/50 flex items-center justify-center text-orange-400 font-bold">
                                {accountantName?.[0] || "A"}
                            </div>
                            <Tooltip content="Logout" side="right">
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white p-3 rounded-lg transition-colors shadow-lg hover:shadow-red-600/50"
                            >
                                <LogOut size={18} />
                            </button>
                            </Tooltip>
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
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg text-slate-400 hover:bg-orange-600 hover:text-white transition-all duration-200 group`}
        >
            <Tooltip content={label} side="right">
                <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
            </Tooltip>
            {!isCollapsed && <span className="font-medium">{label}</span>}
        </Link>
    );
}