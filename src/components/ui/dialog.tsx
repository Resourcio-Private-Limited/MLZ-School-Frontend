"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";

/** Centered dialog: Escape and the backdrop close it, Tab stays inside, focus returns to the opener. */
export function Dialog({
    open,
    onClose,
    labelledBy,
    className,
    children,
}: {
    open: boolean;
    onClose: () => void;
    labelledBy: string;
    className: string;
    children: React.ReactNode;
}) {
    const reduceMotion = useReducedMotion();
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) return;
        const opener = document.activeElement as HTMLElement | null;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCloseRef.current();
            if (e.key !== "Tab" || !panelRef.current) return;
            const items = panelRef.current.querySelectorAll<HTMLElement>(
                "button:not([disabled]), textarea:not([disabled]), select:not([disabled]), input:not([disabled]), a[href]"
            );
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        const { overflow } = document.body.style;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
            opener?.focus?.();
        };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 sm:items-center sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.15 }}
                    onMouseDown={(e) => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl ring-1 ring-gray-200 sm:rounded-xl ${className}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Literal class strings so Tailwind keeps each portal's focus ring.
const ACCENT_RING = {
    rose: focusRing,
    sky: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
    emerald: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
    purple: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
    yellow: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600",
} as const;

export function DialogHeader({ id, title, subtitle, leading, onClose, accent = "rose" }: { id: string; title: string; subtitle?: string; leading?: React.ReactNode; onClose: () => void; accent?: keyof typeof ACCENT_RING }) {
    return (
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
            {leading}
            <div className="min-w-0 flex-1">
                <h2 id={id} className="truncate text-base font-semibold text-gray-900">{title}</h2>
                {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
            </div>
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className={`-mr-2 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 motion-safe:transition-colors ${ACCENT_RING[accent]}`}
            >
                <X size={18} aria-hidden="true" />
            </button>
        </div>
    );
}
