"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

// Retired routes redirect to the portal home with ?notice=<text>. This shows the
// text once as a toast, then removes the parameter so a refresh doesn't repeat it.
function Notice() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const notice = params.get("notice");
    const shown = useRef<string | null>(null);

    useEffect(() => {
        if (!notice || shown.current === notice) return;
        shown.current = notice;
        toast(notice, { id: `retired-${notice}` });
        router.replace(pathname, { scroll: false });
    }, [notice, pathname, router]);

    return null;
}

export function RetiredRouteNotice() {
    return (
        <Suspense fallback={null}>
            <Notice />
        </Suspense>
    );
}
