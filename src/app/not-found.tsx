"use client";

/**
 * Custom 404. Friendly and on-brand: the school star sits in the middle of the
 * "404" (click it for a little spin), and the night-sky panel shows our
 * students searching for the page. The dashboard button works out where to go
 * from the stored login at click time, so one page serves every portal.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";

const ROLE_HOME: Record<string, string> = {
    SUPER_ADMIN: "/super-admin",
    PRINCIPAL: "/principal",
    TEACHER: "/teacher",
    STUDENT: "/student",
    ACCOUNTANT: "/accounts",
};

/** Where "my dashboard" is for whoever is logged in right now; /login otherwise. */
function dashboardPath(): string {
    try {
        const role = localStorage.getItem("userRole") ?? (JSON.parse(localStorage.getItem("authUser") ?? "null")?.role as string | undefined);
        return (role && ROLE_HOME[role]) || "/login";
    } catch {
        return "/login";
    }
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

export default function NotFound() {
    const router = useRouter();
    const [wobble, setWobble] = useState(false);

    const goBack = () => {
        if (window.history.length > 1) router.back();
        else router.push(dashboardPath());
    };

    return (
        <main className="flex min-h-screen items-center bg-gray-50 px-4 py-10 sm:px-6">
            <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-2">
                {/* ── The facts ───────────────────────────────────── */}
                <div className="flex flex-col justify-center gap-6 px-6 py-10 sm:px-10">
                    <Image src="/sidebar_logo_expanded.png" alt="Mount Litera Zee School" width={128} height={64} priority className="h-auto w-32 rounded-lg object-contain" />

                    <p className="flex items-end gap-1 text-7xl font-bold tracking-tight text-slate-900 sm:text-8xl" aria-label="Error 404, page not found">
                        <span aria-hidden="true">4</span>
                        <button
                            type="button"
                            aria-label="Spin the school star"
                            onClick={() => {
                                setWobble(false);
                                requestAnimationFrame(() => setWobble(true));
                            }}
                            className={`mx-1 inline-flex self-center rounded-full ${focusRing}`}
                        >
                            <Image
                                src="/favicon.png"
                                alt=""
                                width={96}
                                height={96}
                                priority
                                className={`h-16 w-16 rounded-full ring-1 ring-gray-200 sm:h-20 sm:w-20 ${wobble ? "motion-safe:animate-[mlzs-wobble_0.7s_ease-in-out]" : ""}`}
                            />
                        </button>
                        <span aria-hidden="true">4</span>
                    </p>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">This page wandered off.</h1>
                        <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
                            Our students put the address under the microscope and it&apos;s simply not in the syllabus. It may have moved,
                            or the link has a typo in it.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => router.push(dashboardPath())}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 motion-safe:transition-colors ${focusRing}`}
                        >
                            <Home size={16} aria-hidden="true" />
                            Take me to my dashboard
                        </button>
                        <button
                            type="button"
                            onClick={goBack}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 motion-safe:transition-colors ${focusRing}`}
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                            Go back
                        </button>
                    </div>

                    <p className="text-xs text-gray-500">If a school link brought you here, tell your class teacher so it can be fixed.</p>
                </div>

                {/* ── The night sky ────────────────────────────────── */}
                <div className="relative min-h-80 overflow-hidden bg-linear-to-b from-slate-900 via-slate-900 to-blue-900 lg:min-h-130">
                    <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-40">
                        {[
                            [8, 12], [22, 6], [37, 18], [55, 9], [71, 15], [88, 8],
                            [14, 34], [46, 30], [80, 36], [30, 48], [64, 52], [90, 58],
                        ].map(([x, y], i) => (
                            <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 3 === 0 ? 1.8 : 1.1} fill="#e2e8f0" />
                        ))}
                    </svg>

                    <Image
                        src="/MLZS_contents/Student (2).png"
                        alt="Two Mount Litera students examining a microscope"
                        width={420}
                        height={406}
                        priority
                        className="pointer-events-none absolute -bottom-2 left-1/2 h-auto w-64 -translate-x-1/2 select-none sm:w-72"
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-slate-950/80 to-transparent" />
                    <p className="absolute inset-x-0 bottom-2 z-10 text-center text-[11px] text-slate-300">Searching the whole sky for that page…</p>
                </div>
            </div>

            {/* the star's little celebration spin */}
            <style>{`
                @keyframes mlzs-wobble {
                    0% { transform: rotate(0deg) scale(1); }
                    30% { transform: rotate(-14deg) scale(1.08); }
                    60% { transform: rotate(10deg) scale(1.05); }
                    100% { transform: rotate(0deg) scale(1); }
                }
            `}</style>
        </main>
    );
}
