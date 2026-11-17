/**
 * There is no shared /login page: each role has its own login screen, and the
 * home page (/) is the role picker. Use these helpers wherever a page needs to
 * send someone "back to login".
 */
export const ROLE_LOGIN_PATH: Record<string, string> = {
    SUPER_ADMIN: "/login/super-admin",
    PRINCIPAL: "/login/principal",
    TEACHER: "/login/teacher",
    STUDENT: "/login/student",
    ACCOUNTANT: "/login/accounts",
};

/** The role's own login page, or the home page role picker when the role is unknown. */
export function loginPathForRole(role?: string | null): string {
    return (role && ROLE_LOGIN_PATH[role.toUpperCase()]) || "/";
}

/**
 * Best guess at the current visitor's login page. Looks at, in order: the
 * `?role=` query param (set by the role login's "Forgot password" link and the
 * reset-password email), then the role remembered on this device, then falls
 * back to the home page. Call it from event handlers only (it reads `window`).
 */
export function currentLoginPath(): string {
    try {
        const fromQuery = new URLSearchParams(window.location.search).get("role");
        if (fromQuery && ROLE_LOGIN_PATH[fromQuery.toUpperCase()]) return loginPathForRole(fromQuery);
        const stored =
            localStorage.getItem("userRole") ??
            (JSON.parse(localStorage.getItem("authUser") ?? "null")?.role as string | undefined);
        return loginPathForRole(stored);
    } catch {
        return "/";
    }
}
