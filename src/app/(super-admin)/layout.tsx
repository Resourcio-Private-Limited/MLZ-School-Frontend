"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Users, Bell, BarChart3, LogOut, ChevronLeft, ChevronRight, Loader2, MessageSquare, PlusCircle, TrendingDown, Menu, X, type LucideIcon } from "lucide-react";
import { logout } from "@/redux/slices/authSlice";
import { useGetSuperAdminProfileQuery } from "@/redux/api/superAdminApi";
import { Tooltip } from "@/components/ui/tooltip";
import { heroGradient, sidebarGradient } from "@/components/super-admin/brand";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
    { label: "Overview", items: [{ href: "/super-admin", label: "Dashboard", icon: LayoutDashboard }] },
    {
        label: "School",
        items: [
            { href: "/super-admin/users", label: "User management", icon: Users },
            { href: "/super-admin/noticeboard", label: "Notice board", icon: Bell },
            { href: "/super-admin/messages", label: "Messages", icon: MessageSquare },
        ],
    },
    {
        label: "Finance",
        items: [
            { href: "/super-admin/financial", label: "Financial overview", icon: BarChart3 },
            { href: "/super-admin/income", label: "Income", icon: PlusCircle },
            { href: "/super-admin/expenses", label: "Expenses", icon: TrendingDown },
        ],
    },
];

// The dashboard matches exactly; every other section also owns its sub-pages.
const isActive = (pathname: string, href: string) => (href === "/super-admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

const pageTitle = (pathname: string) =>
    pathname === "/super-admin/profile" ? "Your profile" : NAV_GROUPS.flatMap((g) => g.items).find((i) => isActive(pathname, i.href))?.label ?? "Super Admin";

function SuperAdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const pathname = usePathname();
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const dispatch = useDispatch();
    const router = useRouter();
    const { data: profile, isLoading } = useGetSuperAdminProfileQuery();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("accessToken");
            const authUser = localStorage.getItem("authUser");
            if (!token || !authUser) {
                router.push("/login/super-admin");
            } else {
                try {
                    const user = JSON.parse(authUser);
                    if (user.role !== 'SUPER_ADMIN') {
                        router.push("/login/super-admin");
                    }
                } catch {
                    router.push("/login/super-admin");
                }
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage auth gate; project rule: keep portal auth checks as they are (CLAUDE.md)
            setIsAuthChecked(true);
        }
    }, [router]);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
        localStorage.removeItem("userRole");
        router.push("/login/super-admin");
    };

    const displayName = profile?.fullName ?? "Super Admin";
    const displayEmail = profile?.userEmail ?? profile?.email ?? "superadmin@school.com";

    if (!isAuthChecked || (isLoading && isAuthChecked)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-600 mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    const account = { name: displayName, email: displayEmail, image: profile?.profileImage ?? null };

    return (
        <div className="flex h-dvh bg-gray-50">
            {/* Sidebar (tablet and up) */}
            <aside
                aria-label="Super Admin"
                className={`relative hidden shrink-0 flex-col border-r border-white/5 md:flex ${sidebarGradient} ${isCollapsed ? "w-20" : "w-64"} motion-safe:transition-[width] motion-safe:duration-300`}
            >
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
                    className="absolute -right-3 top-8 z-10 rounded-full border-2 border-slate-900 bg-rose-600 p-1.5 text-white shadow-lg hover:bg-rose-500 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                >
                    {isCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronLeft size={16} aria-hidden="true" />}
                </button>
                <SidebarContent pathname={pathname} isCollapsed={isCollapsed} account={account} onLogout={handleLogout} layoutGroup="desktop" />
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top bar (phones) */}
                <header className={`flex h-14 shrink-0 items-center gap-3 px-2 shadow-sm md:hidden ${heroGradient}`}>
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={drawerOpen}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>
                    <Link href="/super-admin" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                        <Image src="/favicon.png" alt="Mount Litera Zee School" width={32} height={32} className="h-8 w-8 rounded-md object-contain" />
                    </Link>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{pageTitle(pathname)}</p>
                    <Link
                        href="/super-admin/profile"
                        aria-label="Your profile"
                        className="mr-1 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        <Avatar account={account} size="sm" />
                    </Link>
                </header>

                <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">{children}</main>
            </div>

            <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <SidebarContent pathname={pathname} isCollapsed={false} account={account} onLogout={handleLogout} onNavigate={() => setDrawerOpen(false)} layoutGroup="mobile" />
            </MobileDrawer>
        </div>
    );
}

export default function SuperAdminLayout(props: { children: React.ReactNode }) {
    return <Suspense fallback={<div className="min-h-screen bg-gray-50" />}><SuperAdminLayoutContent {...props} /></Suspense>;
}

type Account = { name: string; email: string; image: string | null };

function Avatar({ account, size = "md" }: { account: Account; size?: "sm" | "md" }) {
    const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
    return account.image ? (
        <Image src={account.image} alt="" width={36} height={36} unoptimized className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white/10`} />
    ) : (
        <span aria-hidden="true" className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-rose-500/20 font-semibold text-rose-200 ring-1 ring-rose-400/30`}>
            {account.name?.[0]?.toUpperCase() ?? "S"}
        </span>
    );
}

/** Slide-in navigation for phones. Escape or the backdrop closes it; focus returns to the menu button. */
function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    const reduceMotion = useReducedMotion();
    const closeRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });
    useEffect(() => {
        if (!open) return;
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            opener?.focus?.();
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <motion.div
                        className="absolute inset-0 bg-slate-950/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu"
                        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col shadow-2xl ${sidebarGradient}`}
                        initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
                        animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
                        transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={onClose}
                            aria-label="Close menu"
                            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function SidebarContent({
    pathname,
    isCollapsed,
    account,
    onLogout,
    onNavigate,
    layoutGroup,
}: {
    pathname: string;
    isCollapsed: boolean;
    account: Account;
    onLogout: () => void;
    onNavigate?: () => void;
    layoutGroup: string;
}) {
    const onProfile = pathname === "/super-admin/profile";
    return (
        <>
            <Link
                href="/super-admin"
                onClick={onNavigate}
                className="block border-b border-white/10 px-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
            >
                {!isCollapsed ? (
                    <span className="flex flex-col items-center gap-2">
                        <Image src="/sidebar_logo_expanded.png" alt="Mount Litera Zee School" width={128} height={64} priority className="h-auto w-32 rounded-lg object-contain" />
                        <span className="text-xs font-medium text-slate-400">Super Admin portal</span>
                    </span>
                ) : (
                    <span className="flex justify-center">
                        <Image src="/favicon.png" alt="Mount Litera Zee School" width={40} height={40} className="h-10 w-10 rounded-lg object-contain" />
                    </span>
                )}
            </Link>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                {NAV_GROUPS.map((group) => (
                    <div key={group.label}>
                        {isCollapsed ? (
                            <div aria-hidden="true" className="mx-3 mb-2 border-t border-white/10" />
                        ) : (
                            <p className="mb-2 px-3 text-xs font-medium text-slate-500">{group.label}</p>
                        )}
                        <ul className="space-y-1">
                            {group.items.map((item) => (
                                <li key={item.href} className={isCollapsed ? "flex justify-center" : undefined}>
                                    <NavLink item={item} active={isActive(pathname, item.href)} isCollapsed={isCollapsed} onNavigate={onNavigate} layoutGroup={layoutGroup} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="space-y-2 border-t border-white/10 p-3">
                <Link
                    href="/super-admin/profile"
                    onClick={onNavigate}
                    aria-current={onProfile ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg p-2 hover:bg-white/5 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${isCollapsed ? "justify-center" : ""} ${onProfile ? "bg-white/10" : ""}`}
                >
                    <Avatar account={account} />
                    {isCollapsed ? (
                        <span className="sr-only">Your profile</span>
                    ) : (
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-slate-100">{account.name}</span>
                            <span className="block truncate text-xs text-slate-400">{account.email}</span>
                        </span>
                    )}
                </Link>
                {isCollapsed ? (
                    <div className="flex justify-center">
                        <Tooltip content="Log out" side="right">
                            <button
                                type="button"
                                onClick={onLogout}
                                aria-label="Log out"
                                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                            >
                                <LogOut size={18} aria-hidden="true" />
                            </button>
                        </Tooltip>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                    >
                        <LogOut size={18} aria-hidden="true" />
                        Log out
                    </button>
                )}
            </div>
        </>
    );
}

function NavLink({ item, active, isCollapsed, onNavigate, layoutGroup }: { item: NavItem; active: boolean; isCollapsed: boolean; onNavigate?: () => void; layoutGroup: string }) {
    const reduceMotion = useReducedMotion();
    const Icon = item.icon;
    const link = (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={isCollapsed ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${isCollapsed ? "h-11 w-11 justify-center px-0 py-0" : ""} ${active ? "text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
        >
            {active && (
                <motion.span
                    layoutId={`sidebar-active-${layoutGroup}`}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-lg bg-white/10"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                >
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-rose-400" />
                </motion.span>
            )}
            <Icon size={20} aria-hidden="true" className={`relative shrink-0 ${active ? "text-rose-300" : "group-hover:text-white"}`} />
            {!isCollapsed && <span className="relative truncate">{item.label}</span>}
        </Link>
    );
    return isCollapsed ? <Tooltip content={item.label} side="right">{link}</Tooltip> : link;
}
