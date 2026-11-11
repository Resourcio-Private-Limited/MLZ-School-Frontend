/**
 * Extracts the server's error message from an RTK Query / fetch error so users
 * see the real reason ("Email already in use", "Annual fee expiry date is required")
 * instead of a generic failure. Falls back to `fallback` when none is available.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
    const e = err as { status?: number | string; data?: { message?: unknown } } | null;
    const message = e?.data?.message;
    const serverMsg = Array.isArray(message)
        ? message.filter((m) => typeof m === "string").join(", ")
        : typeof message === "string" && message.trim()
            ? message
            : "";
    // Nest's default 500 body says "Internal server error" — not worth showing.
    if (serverMsg && serverMsg !== "Internal server error") return serverMsg;
    if (typeof e?.status === "number" && e.status >= 500) return "Something went wrong on our side. Try again in a moment.";
    if (typeof e?.status === "number" && e.status === 404) return "That record wasn't found. It may have been removed — refresh and try again.";
    if (e?.status === "FETCH_ERROR") return "Can't reach the server. Check your connection and try again.";
    return fallback;
}
