# MLZS full-site QA & UI/UX audit

**Date:** 11 November 2026 · **Build:** frontend `main` (dev-Ind merged) + backend `master` (PR #31) · **Status:** triaged with the team's decisions — each finding is tagged **Fix now**, **High**, **Fixed**, or **Accepted** (deliberate behaviour, no change planned), and marked **`FE`** (frontend repo), **`BE`** (backend repo) or **`FE+BE`** for where the fix lives.

**Method:** every portal was driven in a real browser (Playwright, 1440px and 390px), logged in as each role, every screen visited, every create/edit/delete flow exercised, and each form probed with invalid input (bad emails, negative amounts, future dates, letters in phone fields, out-of-range marks, XSS strings, over-payments). API-level probes were run with curl where the UI blocked input, to check server-side validation separately. Test data created during the audit has been removed from the dev database.

---

## 1. Fix now — **all `FE` items in this section fixed on 11 Nov 2026** (verified in the browser; `tsc` + `eslint` clean; all five mocked-API tours pass 206/206)

### 1.1 Teacher Messages page exists but is unreachable — `FE` · **Fixed**

`/teacher/messages` is a complete, working page (students / principal / school office tabs) — and nothing links to it. The teacher sidebar only has My classes, Notice board, Marks entry. **Add "Messages" to the teacher sidebar.** Teacher↔principal messaging is otherwise invisible; the seeded data even contains such threads. Smallest fix in this document.

### 1.2 Fee-settings dialog contradicts the server — `FE` *or* `BE` · **Fixed on the FE side**: the dialog now matches the server's rule — the end date is required whenever annual charges > 0, with an inline error and no misleading "leave it empty" hint.

*Accounts → class gear → Fee settings.*
The form says **"Annual fee end date (optional) — leave it empty if the annual charges don't have an end date"**, but the API rejects exactly that: `400 "Annual fee expiry date is required"` whenever annual charges > 0. The save fails and the dialog stays open. Pick one rule and apply it to both sides — either make the field truly optional on the server, or mark it required in the dialog (and drop the "leave it empty" hint).

### 1.3 Input-handling gaps, per form — **all `FE` halves fixed** (`src/lib/validation.ts` holds the shared email/password/phone/Aadhaar checks; the `BE` halves still need §3.1)

| Form                                    | Where                      | Gap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add user (super admin)                  | `FE+BE`                  | Email format not checked (native check is bypassed because submit is a JS click — `FE`; and the server doesn't check either — `BE`: `notanemail` created a real account). No password rules (`FE+BE`). Phone/Aadhaar fields accept anything (`FE+BE`).                                                                                                                                                                                                                    |
| Admission form (principal)              | `FE+BE`                  | Phone accepts letters — `abcdefg` stored as the primary contact (no pattern `FE`, no server check `BE`). Aadhaar hint says "12 digits, no spaces" but any string is accepted (`FE+BE`). Gender is required, yet submitting without it does nothing visible — the native bubble anchors to a visually-hidden radio, so the form appears frozen (`FE`). DOB is correctly capped at today ✔. Class capacity **is** enforced server-side ("Z is full (capacity 1)") ✔ |
| Create classroom (principal)            | `FE` (+`BE` whitelist) | Grade is free text: `"QA Class 99 - Section Z"` was accepted as a grade and the class was silently bucketed under "Senior secondary". Make grade a select of real grades (`FE`); ideally the API rejects unknown grades too (`BE`). Capacity min=1 enforced ✔                                                                                                                                                                                                                  |
| Record payment (accounts)               | `FE`                     | Overpay warning appears ("That's more than this month's total") but the button stays enabled; ₹0 also leaves it enabled. Combined with §2.1 this is risky.                                                                                                                                                                                                                                                                                                                          |
| Reset password (`/reset-password`)    | `FE`                     | Renders and submits with **no token in the URL**; a short password + click produces no feedback at all (silent native block). Detect the missing token and show per-field errors.                                                                                                                                                                                                                                                                                               |
| Login                                   | `FE`                     | One niche issue — input typed before hydration finishes is wiped (heavy hero images slow first paint; typing on a slow device can get eaten). Preload less, or make the inputs uncontrolled until hydration.                                                                                                                                                                                                                                                                         |
| Income/expense (super admin & accounts) | `BE`                     | UI is solid (strips `-`/letters, 0 disables submit, cheque number required ✔) — but the API accepts negatives (§3.1).                                                                                                                                                                                                                                                                                                                                                            |
| Marks entry (teacher)                   | —                         | Nothing to fix — best form in the app: per-field "Enter 0 to 10/5/80" errors, save disabled while invalid, **and** the server re-validates ✔                                                                                                                                                                                                                                                                                                                                  |
| Notices                                 | —                         | Nothing to fix — link validation and disabled-publish gating work ✔                                                                                                                                                                                                                                                                                                                                                                                                                 |

### 1.4 Copy & polish batch — all `FE` unless noted · **Fixed, two exceptions noted below**

- **"Welcome back, Dr.."** (principal dashboard) — greeting takes the first word of "Dr. Kriti Dutta" and adds a period. Same logic produces "Good afternoon, QA" for "QA Student One". Use the full name or strip honorifics. `FE`
- Error copy blames the connection for server errors: "Marks for this class couldn't be loaded. **Check your connection**" (it was a 500), "The fee list didn't load. Check your connection" (it was a 404 for a bad ID). Say "Something went wrong on our side" when status ≥ 500 / "Class not found" for 404s. `FE`
- Accounts income table shows **₹-500** (sign inside) — should be −₹500 (`FE`); better, reject negatives at the API (§3.1, `BE`).
- Student fee page with *no fees configured* says "**Annual fees are fully paid**" (₹0 of ₹0). Say "No fees set for this class yet." `FE`
- After "Save November" in the fee breakdown the row still says "Not billed" until reload. **Re-reviewed: the page already refetches after save** — could not reproduce on re-inspection; if it recurs, the suspect is the GET response's `recordId` (`BE`), not the frontend cache.
- Attendance register shows roll "—" (uses `rollNumber`) while marks entry shows the same child as roll 1 (uses `classRoll`). **Reclassified `FE+BE`**: the attendance endpoints don't return `classRoll` at all (`teacher.service.ts` selects only `rollNumber`), so the frontend has nothing to switch to until the payload carries it.
- Attendance history counts weekends in "1 of 11 days so far". `FE` **Fixed**: the headline now counts school days (Sundays excluded — the school runs Saturdays), Sunday rows are labelled "Sunday" instead of "Not marked", and the "Not marked" filter skips them.
- Super-admin dashboard "Pending admissions: 81" — the API number actually counts **students admitted this calendar year**, and there is no approval flow. **Fixed** by renaming the card to "Admissions in {year}" with honest copy.
- Edit-user modal's primary button is blue in the rose portal (standard: one accent per portal). `FE`
- Console noise on every page: `next/image` warning for `/sidebar_logo_expanded.png` (width/height modified without `auto`) + an LCP `loading="eager"` hint for the login hero. Two-line fix. `FE`
- `eslint src` currently reports 30 errors (22 `no-explicit-any`, 3 `no-html-link-for-pages`, …). Won't block `next build` (Next 16 doesn't lint builds) but worth burning down. `FE`

---

## 2. High — money correctness & dead flows (no team decision yet)

### 2.1 A part payment writes off the rest of the month — `BE`

*Accounts → class → Record payment.*
The dialog explicitly invites part payments ("Change it for a part payment"), but `recordPayment` **resets `totalAmount` to 0 and sets `isPaid: true` for any amount**. Recording ₹500 against a ₹9,900 month marked the month **Paid** and erased the remaining ₹9,400 from everywhere (row shows "Billed ₹0 / Paid ₹500 / Paid"). The "Part paid" filter on that page can never match anything.
→ Keep the outstanding balance; status should be `PART_PAID` until `paidAmount ≥ total`.

### 2.2 Accountant's "Due" figure is inflated ~7× — `BE`

*Accounts → student → monthly fee breakdown.*
Each month's "Total" includes the previous months' dues (by design), but the headline card **sums those cumulative totals**: a student owing ₹29,600 (12 × ₹1,800 + ₹8,000 annual) is shown as **"Due ₹2,12,400 of ₹2,12,400 billed"**. The inflated `kpis.totalDue` / `kpis.totalOverall` come from the student-detail API response (the frontend just renders `student.kpis`), so the fix is in the backend's KPI calculation. The student-facing pages compute the same data correctly. Sum the base charges once, not the cumulative column.

### 2.3 Principal can't open any student record (403) — `BE` (roles) or `FE+BE` (own endpoint)

*Principal → classroom → student "View".*
The modal always fails with "Forbidden resource". `StudentDetailModal` imports `useGetStudentDetailQuery` / `useUpdateExamEligibilityMutation` from **accountsApi** (`/accounts/students/:id`), and the whole accounts controller is `@Roles(ACCOUNTANT)`. Both the record view and the exam-eligibility toggle are dead for principals. Either add `PRINCIPAL` to those routes' roles or give the principal its own endpoint.

---

## 3. High — backend validation layer

### 3.1 No request validation on the API — `BE`

There is no global `ValidationPipe` and no class-validator DTOs; controllers take raw bodies. Verified consequences:

| Probe                                                             | Result                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST /super-admin/users` with email `notanemail`             | **account created**                                                                                                                  |
| password `"1"` on create, `"x"` on change-password            | **accepted**                                                                                                                         |
| DOB `2031-01-01` (future)                                       | accepted (UI blocks, API doesn't)                                                                                                          |
| `currentSalary: -5000`                                          | accepted                                                                                                                                   |
| `POST /super-admin/incomes` with `amount: -500`               | accepted — and visibly shifted the November figures on the Financial overview                                                             |
| `POST /accounts/classrooms/:id/fees` with `tuitionFees: -999` | accepted                                                                                                                                   |
| Unknown/missing body fields                                       | silently ignored → wrong field names "save" zeros; a missing `addedBy` returns a raw **500 Internal Server Error** instead of 400 |

Fix once, centrally: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` + DTOs with `@IsEmail`, `@MinLength`, `@Min(0)`, `@MaxDate`, etc. The UI already blocks most of this; the API is the unlocked back door. This also closes most of the server-side halves of §1.3.

---

## 4. Navigation (the back-button complaint) — **Fixed** · `FE`

Sub-pages had a text breadcrumb at most, and several had nothing. **Change made in this pass:** every portal's `PageHeader` now renders a proper **← back button** (bordered, 28px, focus-ring, `aria-label="Back to {parent}"`) in front of the breadcrumb whenever a page has a parent. This covers every sub-page that passes `crumb` — classroom pages, attendance/history, exam marks, announcements, messages-in-class, fee details, etc. `tsc` and `eslint` pass; verified rendering in the browser.

Still worth doing later (both `FE`):

- ~~The default Next **404 page** is an unstyled dead end~~ **Done (11 Nov 2026)**: custom `src/app/not-found.tsx` built from school assets — logo, the star as the "0" in 404, the students-with-microscope photo on a night-sky panel — with a role-aware "Take me to my dashboard" button and a "Go back" fallback.
- `/unauthorized` ("Access Denied") is still an unstyled dead end — give it the same treatment.
- Retired routes (`/principal/fees`, `/principal/students`, `/principal/promotion`, `/teacher/salary`, `/teacher/attendance`, `/teacher/exams/create`) silently redirect home — fine, but anyone with an old bookmark gets no explanation. A toast ("That page moved into Classrooms") would help.

---

## 5. Accepted — team decisions, no change planned

### 5.1 Plaintext passwords visible in Super Admin → User management — `BE` (storage) + `FE` (column)

**Client requirement; stays as is.** The password column's eye toggle shows each user's real password, which means the backend stores and returns them in plaintext. Recorded for the file: one leaked super-admin session exposes every credential in the school, and people reuse passwords elsewhere. If the requirement is ever renegotiated, the fix is: store hashes, drop the column, replace with an admin "Reset password" action (which would also remove the odd "enter the user's *current* password" step in the change-password modal).

### 5.2 Fresh DB needs a manual schema sync — environment (`BE` repo workflow)

On a fresh pull, teacher marks entry and the student report card 500 because the dev DB (managed with `prisma db push`) lacked the new `SubjectAssessment` / `StudentExamRemark` tables; the repo's 6 migrations are intentionally not applied locally. **Leaving the workflow as is.** Dev note: run `npx prisma db push` after pulling backend schema changes. After the sync, the whole chain works: marks entered → report card published → SVG + PDF download ✔. (If production is ever migrated differently, confirm the deploy pipeline applies the schema.)

### 5.3 Months are billed manually before payments — courtesy copy `FE` · **Done**: a 404 on Record payment now explains "…hasn't been billed yet. Open the student's fee page and save the month first."

"Record payment" on the accounts class page returns 404 "Fee record not found" until the month is saved from the student's Monthly fee breakdown (pencil → "Save November"), which creates the `StudentFee` row. **This stays manual by design.** Suggested courtesy only: when the 404 happens, show "Save this month from the student's fee page first" instead of a generic failure, so new accountants learn the sequence.

### 5.4 Razorpay order creation 500s locally — optional hardening is `BE`

`POST /student/fees/monthly/order` fails locally because the real keys only exist in the deployed environment — **expected**. Optional hardening someday: `RazorpayService.createOrder` has no error handling, so any upstream failure surfaces as a raw 500; catching it and returning a clear 4xx/502 would make gateway hiccups in production easier to read. The frontend already copes (toast + button recovers).

---

## 6. What held up well

- **No horizontal scroll at 390px anywhere tested** (all five portals, including tables→cards). Mobile drawer + gradient top bar work.
- Role guards: visiting another role's portal redirects to that portal's login; API returns 401/403 properly.
- XSS: a user named `<script>alert(1)</script>` renders escaped everywhere it was displayed, and both SVG generators (report card, admit card) escape XML properly. The stored name is still junk — length/charset limits would help (§3.1).
- Marks entry (new feature) validates on both sides; report card publishes exactly when every subject is complete; PDF endpoint returns a real 337KB PDF.
- Duplicate email on user creation → clean 400 "Email already in use", surfaced as a toast.
- Attendance flow: review step, "a saved register can't be changed", success toast repeating the action, button flips to "Marked for today".
- Notices: live preview, category chips, link validation, delete confirm that names the notice and its blast radius.
- Messaging works across portals (super admin → principal verified end-to-end; teacher announcement → student classroom verified).
- Deactivate user = instant with an **Undo** toast; row actions have personalised aria-labels.

---

## 7. Priority order (reflecting the team's calls)

1. **Fix now** — ✅ done 11 Nov 2026: §1.1 teacher Messages link · §1.2 (FE side) · §1.3 FE halves · §1.4 batch (incl. status-aware error copy, −₹ formatting, greeting, image warnings, eslint 0 errors) · §5.3 courtesy copy. Still open from the batch: roll consistency (now `FE+BE`, needs `classRoll` in the attendance payloads).
2. **High** — §2.1 part-payment write-off (`BE`) + §2.2 inflated Due (`BE`) (money correctness) · §2.3 principal student record 403 (`BE`)
3. **High** — §3.1 ValidationPipe + DTOs (`BE`, closes a dozen §1.3 holes at once)
4. **Later** — §4's leftover items (styled 404/unauthorized, retired-route toasts — `FE`) · §5.3 friendlier 404 copy (`FE`) · §5.4 Razorpay error handling (`BE`)
5. **No action** — §5.1 plaintext passwords (client requirement) · §5.2 local DB workflow

Already done in this pass: back buttons on every sub-page across all four portal kits (§4, `FE`).

**By repo, at a glance:**

- **Frontend only:** §1.1 · §1.4 (all bullets) · §1.3 rows: record-payment button, reset-password token, login hydration, classroom grade select · §4 leftovers · §5.3 courtesy copy
- **Backend only:** §2.1 · §2.2 · §2.3 · §3.1 (incl. negative amounts, email/password rules server-side) · §5.4
- **Either / both:** §1.2 (pick the rule's side) · §1.3 add-user + admission validation (mirror rules on both sides) · §5.1 (accepted)

---

*Audit performed with a scripted browser against `http://localhost:3000` (frontend `next dev`) and `http://localhost:6969` (backend `dist`, master). 139 screenshots were captured during the run.*
