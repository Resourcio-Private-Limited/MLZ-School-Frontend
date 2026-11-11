# Backend handoff — what the frontend now expects

**Audience:** whoever picks up the MLZS backend next.
**Context:** the 11 Nov 2026 QA audit ([qa-ui-audit.md](./qa-ui-audit.md)) was triaged and every frontend-side fix has shipped (frontend `main`, commits `7ceb71d..f5b8fd2`). This doc lists the places where the frontend is done but the behaviour isn't complete until the backend side lands — with the exact endpoints, field names and acceptance checks. Items are ordered by how much they matter.

---

## 1. Money correctness (audit §2.1, §2.2) — the only items that lose real money

### 1.1 `recordPayment` writes off the unpaid balance
`POST /accounts/students/:studentId/fees/payment` (accounts.service `recordPayment`) sets `totalAmount = 0` and `isPaid = true` for **any** amount. A ₹500 cash payment against a ₹9,900 month erased ₹9,400 of dues (verified in the DB during the audit).

What the frontend already does — and therefore expects:
- The payment dialog invites part payments ("Change it for a part payment") and now **blocks overpayment client-side** (amount must be `0 < amount ≤ totalAmount`). Server should still reject `paidAmount > outstanding` with a 400.
- The class page has a **"Part paid" filter** and a part-paid row state that can never match today.

Backend change: keep the outstanding balance (`totalAmount -= paidAmount`, accumulate `paidAmount`), set `isPaid` only when the balance reaches 0, and expose a part-paid state the list endpoint already implies (`paidAmount > 0 && !isPaid`). No frontend change needed afterwards.

### 1.2 Student-detail KPIs are inflated ~7×
`GET /accounts/students/:studentId` returns `kpis.totalDue` / `kpis.totalOverall` that **sum each month's cumulative total** (previous dues re-counted every month): a student owing ₹29,600 reports `totalDue: 212400`. The frontend renders `student.kpis` verbatim (accounts student-detail page headline + Excel export), so the fix is purely in the KPI calculation: sum base charges once, not the cumulative column. The per-month `monthlyBreakdown[].totalAmount` (cumulative) is fine and should stay as is — the frontend's table depends on it.

---

## 2. Principal's student record is dead (audit §2.3)

From the principal portal, `StudentDetailModal` calls:
- `GET /accounts/students/:studentId` (record view)
- `PATCH /accounts/students/:studentId/eligibility` (exam-eligibility toggle)

The whole accounts controller is `@Roles(ACCOUNTANT)`, so principals get `403 Forbidden resource` on every click of "View".

**Preferred (no frontend change):** add `PRINCIPAL` to the roles of exactly those two routes. The service methods don't assume an accountant.
**Alternative:** expose `GET /principal/students/:id` + `PATCH /principal/students/:id/eligibility` with the same response shape — then tell frontend, it's a two-line import switch in `StudentDetailModal.tsx` (from `accountsApi` to `principalApi`).

Acceptance: log in as `principal@…`, open any classroom, click **View** on a student — record loads, eligibility toggle saves.

---

## 3. Request validation layer (audit §3.1 + the `BE` halves of §1.3)

There is no global `ValidationPipe` and no DTO classes; controllers take raw typed bodies. Everything below was **verified accepted** by the live API during the audit:

| Probe | Today | Should be |
|---|---|---|
| `POST /super-admin/users`, email `notanemail` | account created | 400 |
| password `"1"` (create) / `"x"` (change) | accepted | 400 (min 8) |
| `dob: "2031-01-01"` | accepted | 400 (not future; UI enforces age ≥ 20) |
| `currentSalary: -5000` | accepted | 400 (≥ 0) |
| `POST /super-admin/incomes`, `amount: -500` | accepted, corrupts Financial overview | 400 (> 0) |
| `POST /accounts/classrooms/:id/fees`, `tuitionFees: -999` | accepted | 400 (≥ 0) |
| phone `"abcdefg"`, Aadhaar `"12"` (admission/users) | stored | 400 |
| unknown / missing body fields | silently ignored; a missing field can 500 | stripped (`whitelist: true`); missing required → 400 |
| `POST /principal/classrooms`, `grade: "<anything>"` | stored | 400 unless in the known grade list |

One central fix covers all of it:

```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

plus DTOs. **Mirror the client rules** so both sides agree — the frontend now enforces, via `src/lib/validation.ts`:
- email: `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`
- password: ≥ 8 characters
- phone (optional fields): digits/`+ ( ) - space` only, 10–15 digits
- Aadhaar (optional): exactly 12 digits
- grades: `Nursery, LKG, UKG, 1…12` (the create-classroom select offers exactly these)

Two related cleanups while you're in there:
- **`addedBy` from the JWT**: income/expense creation takes `addedBy` from the request body. Derive the actor from the token and ignore the field.
- **Error bodies**: the frontend shows `data.message` to the user whenever it isn't Nest's default `"Internal server error"` (5xx fall back to a generic "on our side" message). So every meaningful 400 message you return is user-visible for free — write them for people, like the existing good ones ("Email already in use", "Z is full (capacity 1)").

---

## 4. `classRoll` in the attendance payloads (audit §1.4, reclassified `FE+BE`)

The attendance register shows roll "—" while marks entry shows the same child as roll 1: the marks endpoint returns `classRoll`, but the attendance endpoints (`teacher.service.ts` — today's register, attendance by date, history/download; the `select` blocks around lines 380–535) return only `rollNumber`.

Backend: add `classRoll: student.classRoll` to those record payloads.
Frontend follow-up (ours, one line per spot): display `classRoll ?? rollNumber`. Tell us when the field is live.

---

## 5. Contracts the frontend now relies on — don't change silently

- **Fee settings** (`POST /accounts/classrooms/:id/fees`): server requires `annualFeeExpiryDate` whenever `annualCharges > 0`. The dialog now enforces and explains the same rule, so they match. If this rule is ever relaxed, tell frontend — the dialog copy must change with it.
- **Record payment 404**: when `POST /accounts/students/:id/fees/payment` returns **404** ("Fee record not found"), the frontend shows "this month hasn't been billed yet — save it from the student's fee page first." Keeping months manual was a team decision (audit §5.3); just keep the 404 semantics for the unbilled case.
- **Marks entry** validates correctly on both sides already (audit calls it the best-validated feature) — nothing to do, just don't regress the per-component messages ("QA Maths: Periodic Test-1 must be between 0 and 10").

---

## 6. Smaller, optional

- **Razorpay** (audit §5.4): `RazorpayService.createOrder` has no error handling, so any gateway failure is a raw 500. Wrap it and return a 502/400 with a message — the frontend will toast it as-is. (Local 500s are expected: real keys only exist in the deployed env.)
- **Deploy note** (audit §5.2): local DBs are synced with `prisma db push` and the repo's migrations are intentionally unapplied locally. Whatever path production uses, make sure the `SubjectAssessment` / `StudentExamRemark` tables exist before shipping the marks/results features — they 500 without them.

---

## How to re-verify quickly

Seed logins are printed at the end of `prisma/seed.ts`. The audit's curl probes are reproducible one-liners — e.g. after the ValidationPipe lands:

```bash
TOK=$(curl -s -X POST localhost:6969/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@school.com","password":"superadmin123"}' | jq -r .access_token)
curl -s -X POST localhost:6969/super-admin/users -H "Authorization: Bearer $TOK" \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"X","email":"notanemail","password":"1","role":"TEACHER"}'
# expect: 400 with field messages, not a created user
```

Frontend-side acceptance for §1–§2: accounts → class → record a ₹500 part payment on a ₹9,900 month → row shows **Part paid**, due ₹9,400; student detail headline shows the real outstanding; principal → classroom → View loads.
