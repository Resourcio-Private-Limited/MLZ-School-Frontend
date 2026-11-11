# MLZS portal UI standard

This document records the Super Admin redesign, finished in November 2026, and turns it into the standard for every other portal: Student, Teacher, Principal and Accounts. The rule that enforces it is in [`CLAUDE.md`](../CLAUDE.md).

Read this document before changing any portal page. Where it disagrees with [`design_style.txt`](../design_style.txt), this document wins.

---

## 1. What changed in the Super Admin portal

The changes are listed in the order they were requested. File paths are relative to `src/`.

### 1.1 Global fixes (apply to every portal already)

| Problem | Cause | Fix |
|---|---|---|
| Pagination buttons were invisible | The OS dark mode turned `--foreground` near-white while the pages stayed white | The app is now **light-only**. In `app/globals.css`, `color-scheme: light` is set, the `prefers-color-scheme: dark` block is removed, and `@custom-variant dark (&:where(.dark, .dark *))` makes `dark:` classes opt-in only |
| Pagination ran to 93 page buttons | Every page number was rendered | A windowed `getPageItems(current, total)` shows `1 … 4 5 6 … 93`. The row is allowed to wrap |
| Lucide icons shrank to 0 px in table cells | A global `main svg { max-width: 100% }` rule | The rule now reads `main svg:not(.lucide)` |

### 1.2 Pages redesigned

| Page | File | What it does now |
|---|---|---|
| Dashboard | `app/(super-admin)/super-admin/page.tsx` | Gradient band with the month's income, expenses, net balance and a spend meter. People strip linking to `users?tab=…`. Latest transactions with an All / Income / Expenses switch. Pending admissions and notice board panels. Refresh button showing when figures were last updated. |
| User management | `app/(super-admin)/super-admin/users/page.tsx` | Tabs with counts, deep-linked via `?tab=`. Search by name, email or ID. Passwords hidden behind a reveal button. Active switch with an Undo toast. Windowed pagination. **Cards below `xl`**, table from `xl` up. |
| Notice board | `app/(super-admin)/super-admin/noticeboard/page.tsx` | One `CATEGORIES` map (this fixed the tag-colour bug). Notices grouped by day. Inline composer with a live preview and link validation. Delete confirmation dialog. |
| Messages | `app/(super-admin)/super-admin/messages/page.tsx` | **Formal single column, not a two-pane chat** (the user asked for the two-pane version to be reverted). Tabs: Principals, Accountants, Teachers, Students. Students are filtered by class chips, a section switch and a "Recent" chip. 10 people per page. Conversation and New message open in dialogs. The thread polls every 5 s and the list every 30 s; both pause in background tabs. |
| Financial overview | `app/(super-admin)/super-admin/financial/page.tsx` | Month stepper with ‹ › and "This month". Gradient summary with plain-language comparisons ("82% less than October"). Six-month bar chart where each bar opens that month. Category breakdowns. Monthly entries with a filter and pagination. |
| Income / Expenses | `components/super-admin/LedgerPage.tsx`, used by `income/page.tsx` and `expenses/page.tsx` | One shared ledger. Period switch: This month / Academic year (April to March) / All time. Gradient summary with a category split bar. Category tabs, search, sorting, pagination, a total row, and CSV export with a BOM so Excel reads it correctly. Record dialog with chip pickers. "Added by" uses the profile name. |
| Profile | `app/(super-admin)/super-admin/profile/page.tsx` | Gradient header with the photo and a camera button. One Details panel with an "Edit details" button that switches it into a form (it used to show a read-only list *and* an always-open form). Toasts replace `alert()`. |
| Layout and sidebar | `app/(super-admin)/layout.tsx` | Sidebar gradient. Grouped navigation (Overview, School, Finance) with a sliding highlight for the current page. Profile link at the bottom. Plain "Log out" button. Collapsed mode with tooltips. **On phones:** a gradient top bar with the menu button, page title and avatar, plus a slide-in drawer that reuses the sidebar content. `MobileRoleNavigation` and its "Back to menu" button are no longer used here. |

### 1.3 Shared pieces created

| File | Purpose |
|---|---|
| `components/super-admin/brand.ts` | `heroGradient` and `sidebarGradient`: the portal's signature colours |
| `components/ui/dialog.tsx` | `Dialog` and `DialogHeader`. Esc and backdrop close it, Tab stays inside, focus returns to the opener, and it opens as a bottom sheet on phones |
| `components/super-admin/LedgerPage.tsx` | The income and expense ledger, set up through a config object |
| `scripts/ui-tour/` | Playwright screenshot tour with a mocked API (see section 5) |

### 1.4 Still open

- The User management popups (Add user, Edit user, Change password) still use the old blue and orange styling.
- The deactivate Undo toast is dark and hard to see where it sits on the dark mobile top bar.
- The **backend returns plaintext passwords** to the Users page. They should be hashed, with a reset-only flow.
- ~~The Principal notice board has the same tag-colour bug that was fixed for Super Admin.~~ Fixed in the Principal redesign (1.7).
- There is no Super Admin admissions page, even though the dashboard shows pending admissions.
- `app/(super-admin)/layout.tsx` has one lint error (`set-state-in-effect`) in the existing login check, left alone on purpose. `users/page.tsx` has 18 existing `no-explicit-any` errors.

---

### 1.5 Student portal (November 2026)

The Student portal follows the standard with a **sky** accent. Shared pieces live in `components/student/`:

| File | Purpose |
|---|---|
| `components/student/brand.ts` | Sky `heroGradient` and `sidebarGradient` |
| `components/student/ui.tsx` | `PageHeader` (with an optional breadcrumb), `Panel`, `EmptyState`, `Pager` plus `paginate`, `Skeleton`, button and input classes, and date helpers (`dayHeading`, `groupByDay`, `relativeDay`) |
| `components/ui/dialog.tsx` | `DialogHeader` takes `accent="sky"` for the close button's focus ring (default `rose`) |

| Page | What it does now |
|---|---|
| Layout | Gradient sidebar grouped into Overview, School, Exams and Fees. The most specific route wins, so Messages doesn't also light up Classroom. Mobile top bar and drawer. `MobileRoleNavigation` is gone. |
| Home | Gradient classroom summary (class teacher, subjects, roll number, next online class). Upcoming online classes, this month's fees from the fees endpoint, exams and the latest three notices. |
| Classroom | Gradient summary, latest announcements, and the class's teachers with a Message link that opens `messages?to=<userId>`. |
| Announcements | Breadcrumb back to Classroom. Filter by teacher, search, grouped by day, 10 per page. Falls back to the student's own classroom when `?classroomId=` is missing. |
| Messages | The Super Admin pattern with three tabs: Teachers, Principal and School office. School office is read-only, with a notice saying so. New message lists only the people a student may write to. |
| Notice board | A read-only copy of the Super Admin board, showing file attachments as well as links, with 10 per page. |
| Exams and results | Gradient "Next exam" summary, Upcoming and Past tabs, cards below `xl` and a table from `xl` up. |
| Admit cards | A card grid with a preview dialog and a PDF download. |
| Fee payment | Gradient annual-fees summary with a paid meter. Months filtered by All, Due and Paid, opening on Due when anything is due. A summary panel on desktop, and a bar pinned to the bottom on phones. Receipts open in `Dialog`. Toasts replace the inline message. The Razorpay flow is unchanged. |
| Profile | Gradient header with a photo button. Personal details, school record and marks by class. The fake "Download marksheet" button (it only logged to the console) was removed. Links to Change password. |
| Change password | A standard page with a breadcrumb, a show and hide toggle, and inline length and match checks. |

Screenshot tour: `node scripts/ui-tour/student-tour.js ../mobile-ui/student-390 390 844` (mock data in `student-mock.js`). It also reports any horizontal overflow.

Still open for Student:

- `student/fees/page.tsx` (an old fee history table) and `student/academics/page.tsx` (a server component that renders **mock** attendance and results from `lib/mocks`) aren't linked from the navigation and weren't redesigned. Delete them or rebuild them on real endpoints.
- Students can't edit their own details, though `PATCH /student/update-profile` exists. Decide whether they should.
- The Change password page sends the session token as a reset token and never asks for the current password. That's a backend question.

### 1.6 Teacher portal (November 2026)

The Teacher portal follows the standard with an **emerald** (green) accent. Shared pieces live in `components/teacher/`:

| File | Purpose |
|---|---|
| `components/teacher/brand.ts` | Emerald `heroGradient` and `sidebarGradient` |
| `components/teacher/ui.tsx` | The Student `ui.tsx` helpers in emerald, plus `FilterChips`, `Tabs`, `SearchBox`, `AttendanceBadge`, `readAuthUser`, `errorMessage` and `initials` |
| `components/teacher/marks.tsx` | `MarksSummary`, `MarksList` and `MarksDialog`, shared by both marks pages. Grades are worked out from the score, with A1 to D for primary classes |
| `components/ui/dialog.tsx` | `DialogHeader` now also takes `accent="emerald"` |

| Page | What it does now |
|---|---|
| Layout | Gradient sidebar grouped into Overview (My classes, which also stays lit on every classroom page), Communication (Notice board) and Exams (Marks entry). Mobile top bar and drawer. `MobileRoleNavigation` is gone. |
| My classes | Gradient summary (classes, students taught, class teacher of) and a grid of class cards, your own class first. |
| Classroom | Breadcrumb, gradient summary (students, class teacher, your role), a Class tools list (Exam marks only for the class teacher) and the latest announcements. |
| Students | Filter by last attendance, search, cards below `xl`, table from `xl` up, 10 per page, and a Message link per student. |
| Attendance | Today's register comes from the by-date endpoint, not the students list. The gradient shows present, absent and a split bar. Marking happens in a dialog where everyone starts present, with All present and All absent buttons, search, `role="switch"` toggles and a review step listing the absentees. Once today is saved, marking is disabled, because the backend would create duplicate rows. Subject teachers see a view-only notice. Excel download. |
| Attendance history | Month stepper with ‹ › and "This month". Gradient summary (average, days marked, students). Days are filtered by Marked and Not marked, future days are hidden, 10 per page. A dialog shows a day's register filtered by present or absent. |
| Announcements | Inline composer with a live preview, a title counter and link validation. Posted items are grouped by day, searchable and 10 per page. The list refetches after posting (the endpoint has no cache tags). |
| Messages (`/teacher/messages`) | The Super Admin pattern with Students, Principal and School office tabs. Students are picked by class chips, then a section switch. The office is read-only, matching the old rules. `?class=` and `?to=` deep-link. `classroom/[id]/messages` redirects here. |
| Exam marks (class teacher) | Exam chips, then subject chips (it used to hide every subject but one per exam name). Opens on the latest exam already held. Shows a lock notice when the principal hasn't opened entry. Gradient summary, list, and a dialog with Save and next. |
| Marks entry (subject teacher) | `/teacher/exams`, now linked from the sidebar. Class chips, an exam select grouped by exam, a closed-entry notice, the same summary, list and dialog. |
| Notice board | A read-only copy of the standard board. |
| Profile | Gradient header with a photo button. Personal details, work details, and classes and subjects. Missing fields read "Not added" instead of invented defaults (it used to show "Indian" when nationality was empty). |

Screenshot tour: `node scripts/ui-tour/teacher-tour.js ../mobile-ui/teacher-390 390 844` (mock data in `teacher-mock.js`; `state.todayMarked` switches today's register). From 768 px up, the two drawer captures fail by design, because there is no menu button.

Still open for Teacher:

- Messages isn't in the sidebar. It was taken out during the redesign; it's reachable from each classroom's tools and from the Students list.
- `GET /teacher/class/:id/exam/:examId/marks` returns `percentage` and `grade` as one subject's score divided by every subject in the class, so a 90 shows as about 13%. The page ignores them and works from the score. Fix the backend.
- `POST /operations/attendance` uses `createMany` with no uniqueness check, so marking twice in a day duplicates rows. The page blocks it, but the backend should too. Its class teacher check is commented out.
- The students endpoint's `attendance` is the most recent record, whatever the date. It's labelled "Last attendance" for that reason.
- `teacher/attendance`, `teacher/exams/create`, `teacher/exams/[examId]` and `teacher/salary` render **mock** data from `lib/mocks` or hard-coded arrays and aren't linked. Delete them or rebuild them on real endpoints.
- Teachers can't edit their own details, though `PATCH /teacher/update-profile` exists (it also accepts salary and employee ID, which a teacher shouldn't set). There is no Change password page.

### 1.7 Principal portal (November 2026)

The Principal portal follows the standard with a **purple** accent. Shared pieces live in `components/principal/`:

| File | Purpose |
|---|---|
| `components/principal/brand.ts` | Purple `heroGradient` and `sidebarGradient` |
| `components/principal/ui.tsx` | The Teacher `ui.tsx` helpers in purple. `AttendanceBadge` keeps emerald for Present, because that's a status colour |
| `components/ui/dialog.tsx` | `DialogHeader` now also takes `accent="purple"` |

| Page | What it does now |
|---|---|
| Layout | Gradient sidebar grouped into Overview (Classrooms, which stays lit on every classroom page), School (Teachers, newly linked), Exams (Admit cards) and Communication (Notice board). Profile and Log out at the bottom. Mobile top bar and drawer. `MobileRoleNavigation` is gone. |
| Classrooms (home) | Gradient "School at a glance": classrooms, students enrolled against seats, active teachers, and classes without a class teacher, with a "Show them" filter. Marks entry is a panel with two `role="switch"` rows that wait for the server before toasting. Classes are grouped by level, with level chips, search and a "No class teacher" toggle. "All levels" shows 6 per level with "Show all N"; a single level shows 12 per page. Cards are quiet and have a seats meter (amber "Filling up" at 80%, red at 95%). Settings, Create and Delete are all `Dialog`. The fake "Active" badge is gone. |
| Classroom | Breadcrumb, gradient enrolment meter, class teacher, exam eligibility and class type. Students: search, sort, eligibility and inactive chips, 10 per page, cards below `xl`, table from `xl` up. Attendance, marks and fee columns appear only when the endpoint fills them, and Parent contact appears only from `2xl`. Student detail, Promote (two steps with an over-capacity warning), Admit student and Arrange rolls are all dialogs. Student detail dropped its Attendance and Exams tabs, which read fields the endpoint never returns. |
| Teachers | `GET /principal/teachers` only. Gradient summary, All / Class teachers / Subject teachers / Inactive chips, search, 10 per page, cards below `xl`. `CreateTeacherForm` only called `mockAction`, so it was deleted along with its button. |
| Admit cards | Class select grouped by level and Half-yearly / Final chips. Gradient summary: exam dates "X of Y set" and eligible students. Exam dates panel with Save and Update. Students with eligibility chips, search, selection and bulk download with progress. Per-student Preview `Dialog` and PDF download. Students who aren't eligible can't be selected. |
| Notice board | The Super Admin board with publish, edit and delete. One `CATEGORIES` map fixes the tag-colour bug, and old "All notices" tags read as General. |
| Profile | Gradient header with a photo button, a Details panel with "Edit details" that sends only the changed fields, and a read-only School record. Missing fields read "Not added", with no invented "Indian" or "Active". |

Screenshot tour: `node scripts/ui-tour/principal-tour.js ../mobile-ui/principal-390 390 844` (mock data in `principal-mock.js`). From 768 px up, the two drawer captures fail by design, because there is no menu button.

Still open for Principal:

- `principal/students`, `principal/fees` and `principal/promotion` render **mock** data from `lib/mocks` and aren't linked. `GET /principal/students` exists, so a real student directory (class, then section) could replace the first one. Delete them or rebuild them on real endpoints.
- ~~There is no Principal Messages page.~~ Added in the dev-Ind merge (1.9).
- The classroom page calls `/accounts/students/:id` and `/accounts/students/:id/eligibility`, so the backend must allow the PRINCIPAL role there.
- `getClassroom` and `getClassroomStudents` have no cache tags, so promoting or admitting a student leaves the Classrooms counts stale until they refetch. `updatePrincipalProfile` doesn't invalidate `PrincipalProfile`, so the page refetches by hand.
- The admission number is still generated in the browser from a random number, so duplicates are possible.
- There's no bulk admit-card PDF endpoint, so bulk download makes one request per student.
- `PrincipalFullProfile` lacks employee ID, joining date, qualification and status. The profile shows them only if the server sends them.

### 1.8 Accounts portal (November 2026)

The Accounts portal follows the standard with a **yellow** accent. The doc first said amber, but amber-500 renders orange in Tailwind v4, and the user asked for yellow. Shared pieces:

| File | Purpose |
|---|---|
| `components/accounts/brand.ts` | Yellow `heroGradient` and `sidebarGradient` |
| `components/accounts/ui.tsx` | The Principal helpers in yellow. Filled surfaces are `yellow-400` with dark text, and focus rings are `yellow-600` |
| `components/ui/dialog.tsx` | `DialogHeader` now also takes `accent="yellow"` |
| `components/super-admin/LedgerPage.tsx` | Now takes `accent: "rose" \| "yellow"` (a map of literal classes) and optional `onUpdate` and `onDelete`, which add Edit and Delete with a confirm dialog. Without them, Super Admin is unchanged (26 of 28 before-and-after captures were byte-identical, and the other two differed only by anti-aliasing) |

Warnings in this portal are **orange** with an icon and a word, never yellow.

| Page | What it does now |
|---|---|
| Layout | Gradient sidebar grouped into Fees (Fee management, which stays lit on every class and student page, and Latest payments), Finance (Income, Expenses, Analysis) and Communication (Messages). The account block shows the name and email from `authUser`; there is no profile page or endpoint. Mobile top bar and drawer. `MobileRoleNavigation` is gone. |
| Fee management | **Find a student** comes first: search every class by name or roll number (`GET /accounts/students/search`), with up to 8 results that link straight to the student's fee page. Then the gradient "Fees at a glance" and the classes, grouped by level, with chips, search and a "Fees not set" toggle, as cards below `xl` and a table from `xl` up. Each class has **Open class** (and the whole card or row opens it too), plus Fee settings and Add other fees icon buttons. |
| Record payment (`feeForms.tsx`) | `RecordPaymentDialog`, opened from each unpaid student on the class page, with payment mode chips. `feeForms.tsx` also holds the shared money input, month stepper and form classes. The old Collect fees dialog (`StudentFeeModal.tsx`) was removed: it was a second student list competing with the class page. Its Adjust view duplicated the student page's month edit. |
| Class fees (`student/[id]`) | Breadcrumb, month stepper, and a gradient with collected against billed and paid, part paid and unpaid counts. Status chips, search and 10 per page. Each row opens the student's fees (the name, a "View fees" button, or a click on the table row). Unpaid students have **Record payment**. Exam eligibility switch. |
| Student fees (`details/[studentId]`) | **Layout set by the accountant; keep its structure.** Back link, avatar, name and record line, with a year select and Export to Excel on the right. A strip with "Exam eligible" and "Transport" chips, each with a pencil that confirms the change, and "N of 12 months paid". Six figure tiles (Tuition, Transport, Annual, Paid, Other + penalty − discount, and Due as the page's one gradient tile). The monthly fee breakdown table has every column (Month, Tuition, Transport, Annual, Other, Remarks, Penalty, Prev. due, Discount, Total, Status, Action), a sticky month column with a status bar, a pencil per month opening the edit dialog, and a totals row. It shows as cards below `xl`. Contact details are at the bottom. |
| Income / Expenses | `LedgerPage` in yellow with edit and delete. "Added by" uses the accountant's name; the old pages hard-coded "Mr. Rakesh Kapoor". Edits don't overwrite the original author. |
| Analysis | The Super Admin financial overview pattern on `/accounts/balance`, with a month stepper, plain-language comparisons, a six-month chart (teal and violet, validated against yellow) and category breakdowns from the entries. |
| Latest payments | Gradient with total received and every payment mode, search, mode chips, grouped by day, 10 per page, cards below `xl`. |
| Messages | The Super Admin pattern with Principal and admin, Class teachers and Students tabs. Students are picked by Recent, class chips and a section switch. `?to=` deep links. Sending is allowed to all four roles, as before. |

Fee flow: **Fee management → Open class → View fees** (class page, then student page), or **Find a student → result** (straight to the student page). Payments are recorded on the class page. The tour checks the URL each flow lands on (`05-flow-search-to-student`, `06-flow-open-class`, `02-class/05-flow-view-fees`).

Screenshot tour: `node scripts/ui-tour/accounts-tour.js ../mobile-ui/accounts-390 390 844` (mock data in `accounts-mock.js`). From 768 px up, the two drawer captures fail by design.

Still open for Accounts:

- The Students tab in Messages uses `GET /teacher/class/:id/students`, so the backend must allow ACCOUNTANT there. There's no teacher directory for accountants, so only class teachers can be written to first.
- No accounts endpoint has cache tags; pages refetch by hand after each change.
- On income and expense updates, cleared fields (cheque number, paid to) are sent as `undefined`, so they can't be cleared. Sending `null` would fix it if the backend accepts it.
- Unclear backend semantics: whether `totalAmount` on a part-paid month is the full total or the balance, and whether class-wide other fees replace or add to a student's existing other fees.
- `/accounts/balance` totals include fees, so they don't equal the sum of income and expense entries. Analysis labels its category panels as coming from the entries.
- Accounts has no profile page or endpoint, and no Change password page.

### 1.9 Merge of `dev-Ind` (November 2026)

IndraniSom's QA and feature branch (`dev-Ind`, described in `CHANGES.md`) was built on the old UI. It was merged into the redesign: **the redesigned UI was kept, and every fix and feature was ported into it.**

| Area | What came in |
|---|---|
| Teacher marks entry | `teacher/classroom/[id]/exams` runs on the new `SubjectAssessment` API (`GET`/`PUT /teacher/class/:id/assessments`). Primary classes get grades BG, PG, PF and NA for terms 1 to 3. Secondary classes get component marks out of their maximums. Saves can be partial. Class teacher remarks appear on the Final only. Each teacher can edit only what they're allowed to. A lock banner shows when the principal hasn't opened entry. `/teacher/exams` is now a class picker that links to each class's exams page, and `components/teacher/marks.tsx` is gone. |
| Student Results | New `student/results` page in sky, on `GET /student/report-card` and `/pdf`, linked under Exams. |
| Student payment | Months are paid strictly in order: picking a month picks every earlier unpaid month, and the server's refusal message is shown. |
| Principal Messages | New `principal/messages` page on the Super Admin pattern, using `GET /principal/message-recipients`, linked under Communication. |
| Everywhere | `src/lib/apiError.ts` (`apiErrorMessage`). The Accounts `errorMessage` now delegates to it. `src/lib/dates.ts` (`todayLocal`) is used for date defaults instead of the UTC date. Contrast fixes, labels on icon-only buttons (`tooltip.tsx` now adds them automatically), and her mock-page redirects. |
| Kept from the redesign over hers | The real Principal Teachers page (she had redirected it as a mock). The deletion of `StudentFeeModal.tsx` and `MessagesCenter.tsx`. |

The backend side of `CHANGES.md` (migrations, role guards, report-card templates) must be deployed with this frontend.

## 2. Design principles

These come from the requests made during the redesign, so they reflect what the client wants.

1. **Professional and formal.** Quiet white panels, one accent colour, sentence case everywhere. No playful chat-app layouts; the user rejected the two-pane inbox.
2. **Never an endless scroll.** Any list that can grow past about 10 to 15 items gets grouping, filters and pagination (10 per page). Group large populations the way the school does: students by **class, then section**.
3. **One signature gradient per page.** The navy-to-accent gradient goes on the page's headline summary only, plus the sidebar and the mobile top bar. Everything else stays white.
4. **Motion only answers the user.** It shows on tab underlines, switches, opening dialogs and rows, and new rows arriving. There's at most one load moment (bars growing, the spend meter filling). Respect `prefers-reduced-motion` with `useReducedMotion()` and `MotionConfig reducedMotion="user"`. Width and height animations need `duration: 0` when motion is reduced, because `MotionConfig` doesn't cover them.
5. **Honest data.** Show nothing fake (a fake "System status" card was removed). Show plain-language comparisons instead of misleading percentages; for example, use a rupee difference for net balance rather than a % change of a negative number. Headline totals come from the same endpoint the owning team uses.
6. **Copy.** Sentence case, active verbs. Buttons and their toasts use the same verb ("Record income" → "₹18,500 recorded."). Errors say what happened and what to do, with no apology. Empty states tell the user what to do next. No ALL-CAPS labels, no middle-dot meta strings, no "→" on links.
7. **Accessible by default.** A visible focus ring on everything (`focus-visible:ring-2 ring-{accent}-500`), `aria-pressed` on toggles, `role="switch"` on switches, `aria-current="page"` on navigation, `aria-sort` on sortable headers. Colour is never the only signal: an icon and a word go with it.

---

## 3. Tokens

### 3.1 Portal accents

The accent drives buttons, active tabs, focus rings and the gradient's end colour. Replace `rose` with the portal's accent.

| Portal | Accent | Gradient (`heroGradient`) | Sidebar (`sidebarGradient`) |
|---|---|---|---|
| Super Admin | `rose` | `from-slate-900 via-slate-900 to-rose-900` | `from-slate-900 via-slate-900 to-rose-950` |
| Principal | `purple` | `… to-purple-900` | `… to-purple-950` |
| Teacher | `emerald` | `… to-emerald-900` | `… to-emerald-950` |
| Student | `sky` | `… to-sky-900` | `… to-sky-950` |
| Accounts | `yellow` | `… to-yellow-900` | `… to-yellow-950` |

Every gradient is written in full: `bg-gradient-to-br from-slate-900 via-slate-900 to-{accent}-900 text-white`. The sidebar uses `bg-gradient-to-b`. Each portal gets its own `components/<portal>/brand.ts`, or one shared `brand.ts` keyed by portal. Tailwind needs **literal class strings**, so never build them by string interpolation.

### 3.2 Neutrals and status colours

- Page `bg-gray-50`; panels `bg-white rounded-xl border border-gray-200`.
- Text: `gray-900` for headings and values, `gray-500` or `gray-600` for labels and secondary text.
- On the gradient: white values, `slate-300` labels, `slate-400` notes, `bg-white/10` tracks and skeletons, good news `emerald-300`, bad news `rose-300`.
- Status colours are reserved: emerald = good, amber = warning, red = bad. Never use them as decoration. In the Accounts portal, warnings use **orange** instead, so they don't read as its yellow accent.
- On a light accent (Accounts yellow), white text fails contrast. Filled surfaces use `yellow-400` with `text-yellow-950`, and focus rings on white use `yellow-600`.
- Figures use `tabular-nums` and `en-IN` formatting (`₹1,06,800`). Short axis labels use `₹1.2L`, `₹45k`, `₹2Cr`.

### 3.3 Chart colours

- Income is `teal-600`, expenses `violet-600`. Both passed the colour-blindness validator (ΔE 21).
- **Re-validate whenever a portal's accent is close to a series colour.** For example, Principal's purple is close to violet. Use the `dataviz` skill's `validate_palette.js`.
- Every chart needs a legend, a hover or focus tooltip, and accessible labels on each mark.

### 3.4 Type and spacing

- Page header: `border-b border-gray-200 pb-6`. The h1 is `text-2xl sm:text-3xl font-bold tracking-tight text-gray-900`, with a `text-sm text-gray-500` subtitle under it and actions on the right.
- Page wrapper: `max-w-7xl space-y-6`. Panel padding: `px-4 sm:px-6`.
- Panel heading: `text-base font-semibold text-gray-900`.

---

## 4. Patterns to copy

| Need | Copy from |
|---|---|
| Page header plus gradient summary band | `LedgerPage.tsx` (summary section), dashboard band |
| Tabs with counts and a sliding underline | `users/page.tsx` or `messages/page.tsx` (`layoutId` underline) |
| Segmented switch (`aria-pressed`) | `FilterSwitch` in the dashboard or `financial/page.tsx` |
| Windowed pagination | `getPageItems` plus the pager markup in `LedgerPage.tsx` |
| Class → section filter for large student lists | `messages/page.tsx` (`parseClass`, class chips, section switch) |
| Table on desktop, cards on phones and tablets | `users/page.tsx` and `LedgerPage.tsx`: cards `xl:hidden`, table `hidden xl:block` |
| Sort menu for card layouts | `LedgerPage.tsx` (`select` with `xl:hidden`) |
| Dialog / bottom sheet | `components/ui/dialog.tsx` |
| Form chips (radio buttons styled as chips) | `ChoiceChips` in `LedgerPage.tsx` |
| Read-only details that switch into a form | `profile/page.tsx` |
| Sidebar, mobile top bar and drawer | `app/(super-admin)/layout.tsx` |
| Bar chart with tooltip and clickable months | `financial/page.tsx` |

### 4.1 Responsive rules

- **Phones (< 768 px):** gradient top bar with menu, page title and avatar; the drawer holds the navigation. No tile-menu home screens and no "Back to menu" buttons.
- **Wide tables** switch to cards below `xl` (1280 px), because the sidebar takes 256 px on tablets.
- **Rows of three or more figures** stack until `lg`.
- **Segmented controls** fill the width on phones (`grid grid-cols-3 sm:inline-flex`), with short labels on phones (`2026–27` instead of `Academic year 2026–27`).
- **Tab rows** scroll sideways (`overflow-x-auto`, `shrink-0` on each tab).
- **Dialogs** become bottom sheets on phones (built into `Dialog`).
- **Never horizontal page scroll** at 390 px, 768 px, 1024 px or 1440 px. The tour script checks this.

---

## 5. Verifying with screenshots

`scripts/ui-tour/` contains:

- `mock.js`: sample data in the real API shapes (923 students, 57 teachers, income and expenses, notices, conversations).
- `tour.js`: signs in a fake user in the browser, intercepts the API on port 6969, and captures every screen, popup and action into folders.

```bash
# dev server must be running on :3000
node scripts/ui-tour/tour.js ../mobile-ui 390 844             # full phone tour
node scripts/ui-tour/tour.js ../mobile-ui 390 844 04-messages # only the messages captures
```

To add another portal, add its endpoints to `mock.js`, set the fake user's `role` (for example `TEACHER`), and add scenarios to `tour.js`.

The script needs no real account and writes nothing to the backend. Review the captures at phone, tablet and desktop sizes before calling a portal done. The Super Admin set is in `../mobile-ui/`.

---

## 6. Rollout checklist for each portal

Do these in order for Principal, Teacher, Student and Accounts:

1. Add the portal's `brand.ts` gradients with its accent (section 3.1).
2. Layout: grouped sidebar with the gradient and active state, mobile top bar and drawer, and remove `MobileRoleNavigation` from that portal.
3. Every page:
   - Standard header.
   - One gradient summary, if the page has a headline figure.
   - White panels.
   - Sentence case.
   - Accent focus rings.
4. Long lists: grouping, filters and 10-per-page pagination. Students go by class, then section.
5. Tables become cards below `xl`; figure rows stack below `lg`.
6. Modals move to `components/ui/dialog.tsx`; forms use labels, chips and inline hints; actions end in matching toasts.
7. Shared screens:
   - **Messages:** done for every portal. `components/messages/MessagesCenter.tsx` was removed.
   - **Notice board:** copy the Super Admin notice board, read-only where the role can't publish.
   - **Income / Expenses (Accounts):** done, on `LedgerPage` with `accent="yellow"`, `onUpdate` and `onDelete`.
8. Fix the Principal notice board tag-colour bug while you're there.
9. Run `tsc --noEmit` and `eslint` on the changed files, then the screenshot tour at 390, 768, 1024 and 1440 px.
