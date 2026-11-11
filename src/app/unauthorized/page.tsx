import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
                <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <ShieldAlert size={28} />
                </span>
                <h1 className="mt-5 text-2xl font-semibold text-gray-900">You can&apos;t open this page</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Your account doesn&apos;t have access to this part of the school portal. Sign out and log in with the account that has access.
                </p>
                <Link
                    href="/api/auth/signout"
                    className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 motion-safe:transition-colors"
                >
                    Sign out and switch account
                </Link>
            </div>
        </main>
    );
}
