"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react";

export type MobileNavItem = { href: string; label: string; icon: LucideIcon };

export function MobileBackToMenu({ href, title = "Back to menu" }: { href: string; title?: string }) {
    return <Link href={href} className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"><ArrowLeft size={17} /> {title}</Link>;
}

function defaultLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("userRole");
    window.location.href = "/login";
}

export default function MobileRoleNavigation({ title, subtitle, items, accent = "indigo", onLogout = defaultLogout }: { title: string; subtitle: string; items: MobileNavItem[]; accent?: "indigo" | "emerald" | "rose" | "amber" | "sky"; onLogout?: () => void }) {
    const accents = { indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100", emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100", rose: "bg-rose-50 text-rose-700 ring-rose-100", amber: "bg-amber-50 text-amber-700 ring-amber-100", sky: "bg-sky-50 text-sky-700 ring-sky-100" };
    return <section className="md:hidden min-h-[calc(100vh-2rem)] p-5 sm:p-8">
        <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Mount Litera Zee School</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>
        <div className="grid grid-cols-2 gap-4">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-lg"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${accents[accent]}`}><Icon size={24} strokeWidth={1.8} /></span><span className="mt-4 flex items-center justify-between gap-2 text-sm font-bold text-slate-800">{label}</span></Link>)}<button onClick={onLogout} className="group rounded-2xl bg-red-600 p-5 text-left text-white shadow-sm transition hover:bg-red-700"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><LogOut size={24} /></span><span className="mt-4 block text-sm font-bold">Logout</span></button></div>
    </section>;
}
