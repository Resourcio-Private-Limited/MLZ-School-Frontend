/**
 * Extracts the server's error message from an RTK Query / fetch error so users
 * see the real reason ("Email already in use", "Annual fee expiry date is required")
 * instead of a generic failure. Falls back to `fallback` when none is available.
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
    const message = (err as { data?: { message?: unknown } } | null)?.data?.message;
    if (Array.isArray(message)) return message.filter((m) => typeof m === "string").join(", ") || fallback;
    return typeof message === "string" && message.trim() ? message : fallback;
}
