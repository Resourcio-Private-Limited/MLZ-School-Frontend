# Change Log: Marks Entry, Report Cards, QA Fixes

**Date:** 11 November 2026
**Repositories:** `MLZ-School-Backend` (branch `dev`) and `MLZ-School-Frontend` (branch `main`)

This one file covers changes in both repositories, so the same copy is in each repo root. The work was done in five rounds:

1. Login, user-management, fee-order and marks-permission fixes.
2. Marks entry rebuilt for primary and secondary classes.
3. End-to-end testing of marks entry as a teacher and as the principal.
4. Report cards (SVG templates) and the student Results page.
5. A full QA pass of every role and page, with fixes for everything found.

---

## 1. Deployment steps (do these first)

1. **Run the database migrations.** There are two new migrations in the backend:
   ```bash
   npx prisma migrate deploy
   ```
   - `20261110_subject_assessments` creates the `ExamTerm` enum and two tables, `SubjectAssessment` and `StudentExamRemark`.
   - `20261111_primary_term3_grade` adds a nullable `term3Grade` column to `SubjectAssessment`.

   Both migrations only add things, so no existing data is changed.
2. **Regenerated Prisma client.** The updated client in `src/generated/prisma` is committed. No extra step is needed unless you regenerate it yourself.
3. **Report-card templates.** They are new files in `src/assets/result/`:
   - `DIGITAL OTHER CLASS Report-New.svg`
   - `DIGITAL PRIMARY Report-New.svg`

   They must ship with the backend build.
4. **Razorpay live keys.** The frontend falls back to a **test** key when no key is configured. Set the live Razorpay keys on both backend and frontend before go-live.
5. **Optional frontend setting.** `next.config.ts` now reads `NEXT_DIST_DIR` to choose the build output folder. The default is still `.next`, so existing deployments need no change.

---

## 2. Feature changes

### 2.1 Login and user management
- **Users with the STAFF role can't log in to any portal.** Only staff who also have an accountant record can log in, through the Accounts portal. Others see: *"This account does not have portal access. Please contact the administrator."*
  - Code: `auth.service.ts`.
- **Clearer login error.** A wrong email or password now shows *"Invalid email or password"*.
  - Code: `local.strategy.ts`.
- **Edit and Change Password icons fixed.** They were not showing on the Super Admin Users page. They now display correctly and have accessible labels.
- **Editing a user no longer loses data.** Editing a teacher, staff member or accountant used to silently wipe their personal details (Aadhaar, secondary contact and so on). `getAllUsers` now returns those details, so they reach the Edit form and are saved back.
  - Code: `super-admin.service.ts`.

### 2.2 Fees: month-by-month payment
- **Students pay in strict month order.** They can only select the earliest unpaid months, in sequence. Paying in advance follows the same order.
- **The backend checks the order too.** `createRazorpayOrder` refuses any selection that skips a month: *"Fees must be paid month by month. Please pay X before Y."*
- **Annual charge timing.** The annual charge is carried on the first unpaid month.
  - Code: `fee-calculation.service.ts`.
- **Payment page clean-up.** Server errors are shown to the user, month checkboxes have accessible labels, and disabled months are styled clearly.

### 2.3 Marks entry (rebuilt)
Marks are now stored per subject and per component in the new `SubjectAssessment` table. Each row is keyed by student, subject, exam (Half Yearly / Final) and academic session. The session starts in April.

| Class type | Half Yearly | Final |
|---|---|---|
| **PRIMARY** | Term 1 grade + Term 2 grade | Term 3 grade |
| **SECONDARY** | Periodic Test-1 (10), MA-1/PF-1 (5), SEA-1 (5), Half Yearly Exam (80) | Periodic Test-2 (10), MA-2/PF-2 (5), SEA-2 (5), Yearly Exam (80) |

- **Grading scale for primary classes:** BG, PG, PF, NA. Secondary classes show a total out of 100.
- **Partial saves are allowed.** Teachers can enter some marks now and the rest later. A row cleared of all values is deleted.
- **Class-teacher remarks.** These are stored in the new `StudentExamRemark` table. Only the class teacher can enter them, and only on the **Final** exam.
- **Who can edit:**
  - The class teacher can edit every subject in the class.
  - A subject teacher can edit only their own subjects.
  - Teachers not assigned to the class get `403`.
- **Principal toggle respected.** The principal's "marks entry enabled" setting is now read from the active principal account. Previously teachers were blocked even when it was switched on.
- **Old marks table kept in sync.** For secondary classes, the legacy `Mark` rows are updated so older screens keep working.
- **New endpoints** (TEACHER only):
  - `GET /teacher/class/:classroomId/assessments?examType=HALF_YEARLY|FINAL`
  - `PUT /teacher/class/:classroomId/assessments`
- **Shared constants** (grade fields, maximum marks, labels, completeness checks) are in `src/teacher/assessment.constants.ts`.
- **Frontend.** `teacher/classroom/[id]/exams` was rewritten. It has Half Yearly and Final tabs, a student list with progress, and a per-student marks dialog. When the principal has disabled entry, a lock banner is shown.

### 2.4 Report cards and the student Results page
- **Report cards built from the school's templates.** `src/student/report-card-svg.ts` fills the official SVG templates with the student's details, photo, subject rows, totals and remarks. Long text shrinks or wraps to fit its cell.
  - Secondary classes use the "Other Class" template. For the Final columns, the Term 2 headers are relabelled to *Periodic Test-2 / NB 2 / SEA 2 / Yearly Exam*.
  - Primary classes use the Primary template.
  - Co-scholastic areas and "Promoted to Class" are left blank, as agreed with the client.
- **When a result is released.** A result appears only when marks for **every subject** of that exam are complete.
- **New endpoints** (STUDENT only):
  - `GET /student/report-card` returns the release status for each exam and the SVG.
  - `GET /student/report-card/pdf` returns a landscape A4 PDF, rendered by Puppeteer. `renderPdf` now accepts `landscape` and `margin` options.
- **Frontend.** New page `student/results`, linked as **Results** in the student navigation on desktop and mobile. It shows a status card per exam, a preview of the report card, **Download PDF** and **Download Image**.

### 2.5 Principal portal
- **New Messages page** (`principal/messages`), added to the navigation. It is backed by `GET /principal/message-recipients` (PRINCIPAL only). Recipients are active super admins and teachers, plus accountants who have an accountant record.
- **Classroom student list shows real figures.** Attendance %, average marks and fee status are now calculated from the database. They used to be **random numbers**.
- **Admissions:**
  - A repeated email gets a clear error ("A user with this email already exists") instead of a crash.
  - Classroom capacity is enforced.
  - A free admission number is allocated automatically if the proposed one is taken.
  - If the admission fails partway, the user account just created is removed.
- **Subjects:**
  - Duplicate subject names in a class are rejected. The check ignores case and surrounding spaces.
  - Deleting a subject no longer crashes once marks or admit cards exist. It runs in one transaction:
    - Admit cards move to a sibling exam of the same name, or are deleted if there is none.
    - Marks, results, exams, assessments, online classes and teacher assignments for that subject are then removed.
  - When editing a subject, the teacher list now includes the teacher already assigned.
- **Admit cards.** Generating an admit card always showed a failure message even though the card was created. This was a response-handling bug on the frontend and is fixed.
- **Arrange Roll.** The roll column now shows the class roll, and the button was restyled for contrast.

### 2.6 Teacher portal
- **Attendance rules.** Only the **class teacher** can mark attendance, for their own class and enrolled students only. Each student is PRESENT or ABSENT, and a class can be marked once per school day (*"Today's attendance has already been submitted for this classroom"*).
- **Attendance dates use India time.** All attendance dates use Asia/Kolkata (UTC+5:30). Previously records were saved a day early, and the history page labelled today as "Future".
- **Announcements update straight away.** A newly posted announcement now appears in the list without reloading the page.
- **Workspace card renamed.** The marks card is now **Exam Marks**.
- **Accessible attendance switches.** They are announced as switches, with state and labels, to screen readers.

### 2.7 Student portal
- **Announcements without a link parameter.** The announcements page now finds the student's classroom from the dashboard, so it no longer depends on a URL parameter.
- **New Results page.** See 2.4.

### 2.8 Accountant portal
- **Correct author on income and expenses.** Records now show the logged-in user as "Added by", read from the login on the server. Previously every record said "Mr. Rakesh Kapoor".
- **Fee-settings errors.** The server's actual error message is shown.

---

## 3. Security fixes

Before these fixes, any logged-in user, a student included, could call several staff-only endpoints. `RolesGuard` was missing on some controllers, so their `@Roles(...)` annotations had no effect.

| Area | Fix |
|---|---|
| `academic.controller.ts` | `RolesGuard` added. Creating exams and writing marks is PRINCIPAL only. Creating online classes is TEACHER/PRINCIPAL. Reading marks is staff only. |
| `operations.controller.ts` | `RolesGuard` added. Announcements and attendance are TEACHER only, and the teacher ID comes from the login, not the request body. Notices: create/edit/delete is SUPER_ADMIN/PRINCIPAL. Attendance reads are staff only. |
| Messages | Conversations are always loaded for the logged-in user. Previously anyone could read anyone's messages by changing the user ID in the URL. |
| `student.controller.ts` | `RolesGuard` added. Every endpoint is STUDENT only. |
| `teacher.controller.ts` | `RolesGuard` added. Recipient lists leave out non-portal staff. |

A student account was blocked on all 11 security probes after the fixes. Five of them got through before.

> **By client request, unchanged:** passwords are stored and shown to the Super Admin in plain text.

---

## 4. Frontend-wide quality fixes

- **Error messages.** New helper `src/lib/apiError.ts` (`apiErrorMessage`). 27 generic "Failed…" toasts across 19 files now show the server's real reason.
- **Default dates.** New helper `src/lib/dates.ts` (`todayLocal`). Date fields (income, expense, admission, attendance) used to default to the UTC date, which is yesterday before 5:30 am in India. They now default to the local date.
- **Data refresh.** RTK Query has new cache tags `ClassAssessments` and `Announcements`, so lists refresh after saves. The serializable-check warnings in the store are silenced (`src/redux/index.ts`).
- **Accessibility and visibility.** Every page was checked at 320, 375, 768, 1024 and 1440 px.
  - Icon-only buttons now have labels: sidebar collapse, edit/delete, password "show" eyes, reply, settings.
  - `components/ui/tooltip.tsx` adds a label to icon-only buttons automatically, and leaves buttons with visible text alone.
  - Low-contrast text was darkened: `gray-400`/`slate-400` → `500`, light amber/emerald → darker shades.
  - Profile-page icons no longer collapse (`shrink-0`).
  - Images and SVGs inside `main` can no longer overflow the screen (`globals.css`).
  - The login form's accent colours now use fixed class names, so Tailwind generates them.
- **Mock pages retired.** 11 prototype pages showing fake data were still reachable by URL. They now redirect to the real screens:
  - principal: `promotion`, `fees`, `students`, `teachers`
  - teacher: `attendance`, `exams`, `exams/create`, `exams/[examId]`, `salary`
  - student: `academics`, `fees`
- **`.gitignore`** now ignores `/.next-qa/`.
- **Admit templates removed from the frontend.** `public/admit/*.svg` is no longer referenced by the frontend; admit cards are generated by the backend from `src/assets/admit/`.

---

## 5. Files changed

**Backend**
- **New files:**
  - `prisma/migrations/20261110_subject_assessments/`
  - `prisma/migrations/20261111_primary_term3_grade/`
  - `src/assets/result/` (the two report-card templates)
  - `src/student/report-card-svg.ts`
  - `src/teacher/assessment.constants.ts`
- **Modified source:**
  - `prisma/schema.prisma`
  - `auth/auth.service.ts`, `auth/strategies/local.strategy.ts`
  - `academic/academic.controller.ts`
  - `accounts/accounts.controller.ts`, `accounts/accounts.service.ts`
  - `common/fee-calculation.service.ts`, `common/puppeteer.service.ts`
  - `operations/operations.controller.ts`, `operations/operations.service.ts`
  - `principal/principal.controller.ts`, `principal/principal.service.ts`
  - `student/student.controller.ts`, `student/student.service.ts`
  - `super-admin/super-admin.service.ts`
  - `teacher/teacher.controller.ts`, `teacher/teacher.service.ts`
- **Generated:** `src/generated/prisma/**`, including the new `SubjectAssessment` and `StudentExamRemark` models.

**Frontend**
- **New files:**
  - `src/app/(principal)/principal/messages/`
  - `src/app/(student)/student/results/`
  - `src/lib/apiError.ts`
  - `src/lib/dates.ts`
- **Main rewrites:**
  - `teacher/classroom/[id]/exams/page.tsx`
  - `student/payment/page.tsx`
  - `redux/api/teacherApi.ts`, `studentApi.ts`, `principalApi.ts`, `operationsApi.ts`
- **Other changes:** about 60 further pages and components across all five portals, for the error-message, date, accessibility and contrast fixes above, plus the 11 redirect stubs.

---

## 6. Verification

- **End-to-end tests:** browser tests (Playwright) passed **77/77** steps across every role: Super Admin 17, Principal 15, Accountant 16, Teacher 9, Student 20.
- **Promotion and payment:** both work end to end, including a full Razorpay test-mode payment.
- **Report cards:** checked for Half Yearly only, Final only, and both, in primary and secondary classes.
- **Screen sizes:** at all five widths there was no sideways scrolling, no collapsed icons, no low-contrast text, no unlabelled icon buttons and no script or API errors.
- **Builds:** `next build` passes. The backend passes `tsc -p tsconfig.build.json`.
- **Unit tests:** backend Jest suites still fail to start. This was already the case: Jest can't load the Prisma client.

---

## 7. Known open items (not fixed in this commit)

1. **Accountant login.** The seeded accountant (Prabir Halder) was created as STAFF without an accountant record, so the new STAFF block stops him logging in. Re-create him as an Accountant, or convert the record.
2. **Cash and cheque payments.** There is no screen to record offline fee payments. Only Razorpay payments are captured.
3. **Mid-year admissions.** Students admitted mid-year are billed from January.
4. **Teacher subjects.** A teacher can hold only one subject per class.
5. **Super Admin password.** Changing the Super Admin's own password requires the current password.
6. **Accountant profile.** The accountant has no profile page.
7. **Inactive principals.** They still appear in message-recipient lists.
8. **Attendance button.** The *Mark Attendance* button stays enabled after today's submission. The server refuses a second submission.
9. **Razorpay orders.** Orders left PENDING are never expired.
10. **Teacher student list.** The ⋮ button has no action.
11. **Report-card template.** The secondary template prints the maximum marks as "81-80".
12. **QA test data.** Records created during testing are still in the database. All of them start with "QA": accounts, two QA classrooms, notices and payments. Remove them before handover if needed.
