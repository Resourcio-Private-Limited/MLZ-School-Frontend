// Shared client-side input checks. Each returns null when the value is fine,
// or a short message the form can show. Optional fields accept the empty string.

/** Pragmatic email shape check: one @, something either side, a dot in the domain. */
export function emailIssue(value: string): string | null {
    const v = value.trim();
    if (!v) return "Enter an email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, like name@school.com.";
    return null;
}

/** Matches the password rule shown on the reset page: at least 8 characters. */
export function passwordIssue(value: string): string | null {
    if (!value) return "Enter a password.";
    if (value.length < 8) return "Use at least 8 characters.";
    return null;
}

/** Optional phone: 10–15 digits, with +, spaces, dashes and brackets allowed. */
export function phoneIssue(value: string): string | null {
    const v = value.trim();
    if (!v) return null;
    if (!/^[+()\d\s-]+$/.test(v)) return "A phone number can only have digits, spaces, + and -.";
    const digits = v.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) return "Enter a phone number with 10 to 15 digits.";
    return null;
}

/** Optional Aadhaar: exactly 12 digits, no spaces. */
export function aadhaarIssue(value: string): string | null {
    const v = value.trim();
    if (!v) return null;
    if (!/^\d{12}$/.test(v)) return "An Aadhaar number is exactly 12 digits, no spaces.";
    return null;
}
