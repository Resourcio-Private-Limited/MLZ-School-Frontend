# MLZS frontend

This is a Next.js 16 (App Router), React 19, Tailwind v4, RTK Query and framer-motion app with five portals under `src/app/`: `(super-admin)`, `(principal)`, `(teacher)`, `(student)` and `(accounts)`. The API base URL is `NEXT_PUBLIC_API_BASE_URL` (locally `http://localhost:6969`).

## Rule: every portal follows the Super Admin UI standard

The Super Admin portal was fully redesigned and made mobile-responsive in November 2026. **The same standard must be applied to the Principal, Teacher, Student and Accounts portals.** Any new or changed page in any portal has to meet it.

The full standard, the change log, the patterns to copy and the rollout checklist are in **[`docs/portal-ui-standard.md`](docs/portal-ui-standard.md)**. Read it before touching portal UI. It replaces `design_style.txt` wherever the two disagree.

The short version:

- **Look:** quiet white panels on `bg-gray-50`, one accent per portal (Super Admin rose, Principal purple, Teacher emerald, Student sky, Accounts yellow), sentence case, `tabular-nums`, `en-IN` rupee formatting. No ALL-CAPS labels and no cards that lift on hover.
- **Signature gradient:** `from-slate-900 via-slate-900 to-{accent}-900`, used **once per page** on the headline summary, plus the sidebar and the mobile top bar. Keep gradients in a `brand.ts` as literal class strings.
- **No endless scrolling:** group, filter and paginate at 10 per page. Students are grouped by class, then section. Messaging is a formal single-column list with conversations in a dialog, never a two-pane chat.
- **Mobile first:**
  - On phones, use a gradient top bar plus a slide-in drawer, not tile menus or "Back to menu" buttons.
  - Tables switch to cards below `xl`.
  - Rows of three figures stack below `lg`.
  - Dialogs become bottom sheets.
  - No horizontal page scroll at 390, 768, 1024 or 1440 px.
- **Reuse, don't copy-paste:**
  - `components/ui/dialog.tsx` for popups.
  - `components/super-admin/LedgerPage.tsx` for income and expense ledgers.
  - The Super Admin layout for the sidebar, top bar and drawer.
  - The Super Admin Messages and Notice Board pages as templates.
- **Behaviour:**
  - Motion only in response to the user, and reduced motion respected.
  - Visible focus rings.
  - Toasts that repeat the action's verb.
  - Errors say what to do next.
  - Never show fake data.
- **Verify before calling a portal done:**
  - `npx tsc --noEmit -p .` and `npx eslint <changed files>` must pass.
  - Run the screenshot tour in `scripts/ui-tour/`, which uses a mocked API and needs no login, and look at the captures.

## Working notes

- The app is light-only. Don't add `prefers-color-scheme` dark styles; `dark:` classes only apply under a `.dark` class.
- Portal layouts render children only after their localStorage auth check, so a lazy `useState` that reads `localStorage` is safe inside portal pages.
- Don't change the auth checks in the portal layouts while doing UI work.
- Commit or push only when asked.
