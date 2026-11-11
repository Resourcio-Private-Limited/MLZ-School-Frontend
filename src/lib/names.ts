// "Dr. Kriti Dutta" → "Kriti", "Aman Khan" → "Aman".
// Skips honorifics so greetings never read "Welcome back, Dr..".
const HONORIFICS = new Set(["dr", "mr", "mrs", "ms", "miss", "md", "prof", "shri", "smt", "sri"]);

export function firstNameOf(fullName: string | null | undefined): string | null {
    if (!fullName) return null;
    const words = fullName.trim().split(/\s+/);
    const first = words.find((w) => !HONORIFICS.has(w.replace(/\./g, "").toLowerCase()));
    return first ?? words[0] ?? null;
}
