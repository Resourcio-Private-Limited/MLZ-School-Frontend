// Mock API for visual checks of the Accounts portal. No real backend or credentials involved.
// Shapes follow src/redux/api/accountsApi.ts, operationsApi.ts (messaging) and teacherApi.ts (class students).
const now = new Date();
const iso = (d) => d.toISOString();
const day = (offset, hour = 10, minute = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);

const me = "u-acc-1";
const meUser = { id: me, role: "ACCOUNTANT", name: "Partha Sarathi Ghosh", email: "accounts@mlzs.in" };
// Unknown GET paths are collected here so the tour can report them.
const unknown = new Set();

const first = ["Ananya", "Rohan", "Ishita", "Arjun", "Meghna", "Sayan", "Priya", "Aditya", "Riya", "Kunal", "Sneha", "Arnab", "Tania", "Soham", "Puja", "Rahul", "Diya", "Aritra", "Sreya", "Nikhil", "Moumita", "Debjit", "Rupsa", "Anirban"];
const last = ["Ghosh", "Das", "Sen", "Banerjee", "Mukherjee", "Chatterjee", "Roy", "Basu", "Dutta", "Saha", "Paul", "Mitra", "Bose", "Sarkar"];
const nameAt = (i, salt = 0) => `${first[(i * 7 + salt) % first.length]} ${last[(i * 5 + salt * 3) % last.length]}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─── Classrooms with fees: Nursery to 12 (31 sections) ───
const grades = [
    ["Nursery", 2], ["KG", 2], ["1", 3], ["2", 3], ["3", 3], ["4", 2], ["5", 2], ["6", 2], ["7", 3], ["8", 2], ["9", 2], ["10", 2], ["11", 2], ["12", 1],
];
const classrooms = [];
for (const [grade, sections] of grades) {
    const n = Number(grade);
    // Fees rise with the grade; two sections have no fee set yet.
    const tuition = Number.isNaN(n) ? 2200 : 2400 + n * 150;
    for (let s = 0; s < sections; s++) {
        const section = "ABC"[s];
        const label = /^\d+$/.test(grade) ? `Class ${grade}` : grade;
        const idx = classrooms.length;
        const unset = idx === 5 || idx === 22;
        classrooms.push({
            classroomId: `cls-${grade.toLowerCase()}${section.toLowerCase()}`,
            className: `${label} - Section ${section}`,
            grade,
            section,
            totalStudents: 22 + ((idx * 7) % 17),
            tuitionFees: unset ? 0 : tuition,
            lateFees: unset ? 0 : 100,
            annualCharges: unset ? 0 : 6000 + (Number.isNaN(n) ? 0 : n * 250),
            annualFeeExpiryDate: unset ? null : `${now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear()}-03-31`,
        });
    }
}
const classById = (id) => classrooms.find((c) => c.classroomId === id) ?? classrooms[0];

// ─── Students per classroom ───
const studentsByClass = {};
let serial = 0;
for (const c of classrooms) {
    studentsByClass[c.classroomId] = Array.from({ length: c.totalStudents }, (_, i) => {
        const k = serial++;
        return {
            studentId: `st-${k}`,
            userId: `u-st-${k}`,
            fullName: nameAt(k, 3),
            rollNumber: String(i + 1),
            classRoll: i + 1,
            admissionNumber: `MLZS/${2019 + (k % 6)}/${1000 + k}`,
            transportOpted: k % 4 === 0,
            examEligibility: k % 11 !== 4,
            classroomId: c.classroomId,
        };
    });
}
const allStudents = Object.values(studentsByClass).flat();
const studentById = (id) => allStudents.find((s) => s.studentId === id) ?? allStudents[0];

// Fee record for one student and month: paid, partly paid or unpaid, deterministic by index.
function feeRecord(s, month) {
    const c = classById(s.classroomId);
    const k = Number(s.studentId.slice(3));
    const transportFees = s.transportOpted ? 900 : 0;
    const annualCharges = month === 4 ? c.annualCharges : 0;
    const otherFees = month === 11 && k % 3 === 0 ? 500 : 0;
    const penalty = k % 9 === 2 ? c.lateFees : 0;
    const discount = k % 13 === 0 ? 300 : 0;
    const previousAmount = k % 17 === 5 ? 1200 : 0;
    const totalAmount = c.tuitionFees + transportFees + annualCharges + otherFees + penalty + previousAmount - discount;
    const state = (k + month) % 7; // 0–3 paid, 4 partial, 5–6 unpaid
    const isPaid = state <= 3;
    const paidAmount = isPaid ? totalAmount : state === 4 ? Math.round(totalAmount / 2) : 0;
    return {
        studentId: s.studentId,
        rollNumber: s.rollNumber,
        fullName: s.fullName,
        tuitionFees: c.tuitionFees,
        transportFees,
        annualCharges,
        otherFees,
        otherFeesRemarks: otherFees ? "Science exhibition" : null,
        penalty,
        previousAmount,
        discount,
        totalAmount,
        isPaid,
        paidAmount,
        examEligibility: s.examEligibility,
        transportOpted: s.transportOpted,
        classroomId: c.classroomId,
        classroomName: c.className,
    };
}

// Academic year months, April to the current month.
function academicMonths(year) {
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const y0 = year ?? startYear;
    const out = [];
    for (let i = 0; i < 12; i++) {
        const d = new Date(y0, 3 + i, 1);
        out.push({ month: d.getMonth() + 1, year: d.getFullYear(), future: d > now });
    }
    return out;
}

function studentDetail(id, year) {
    const s = studentById(id);
    const c = classById(s.classroomId);
    const k = Number(s.studentId.slice(3));
    const monthlyBreakdown = academicMonths(year).map(({ month, year: y, future }, i) => {
        const r = feeRecord(s, month, y);
        const paid = !future && r.isPaid;
        return {
            month, year: y,
            recordId: future ? null : `fr-${s.studentId}-${y}-${month}`,
            tuitionFees: r.tuitionFees, transportFees: r.transportFees, annualCharges: r.annualCharges,
            annualChargesApplicable: month === 4, otherFees: r.otherFees, otherFeesRemarks: r.otherFeesRemarks,
            penalty: future ? 0 : r.penalty, previousAmount: r.previousAmount, discount: r.discount,
            totalAmount: r.totalAmount, isPaid: paid, paidAmount: future ? 0 : r.paidAmount,
            paidAt: paid ? iso(new Date(y, month - 1, 5 + (i % 9), 11)) : null,
            paymentMode: paid ? ["ONLINE", "CASH", "ONLINE", "CHEQUE", "NEFT"][(k + i) % 5] : null,
        };
    });
    const sum = (f) => monthlyBreakdown.reduce((n, m) => n + m[f], 0);
    const totalOverall = sum("totalAmount");
    const totalPaid = sum("paidAmount");
    return {
        studentId: s.studentId,
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        classRoll: s.classRoll,
        admissionNumber: s.admissionNumber,
        dob: `${2008 + (k % 12)}-0${1 + (k % 9)}-1${k % 9}`,
        gender: k % 2 ? "MALE" : "FEMALE",
        parentName: nameAt(k, 9),
        parentContact: `90733${String(55000 + k * 17).slice(0, 5)}`,
        primaryContact: `98300${String(11000 + k * 13).slice(0, 5)}`,
        secondaryContact: k % 3 ? null : `94330${String(22000 + k).slice(0, 5)}`,
        email: `${s.fullName.toLowerCase().replace(/\s+/g, ".")}.${k}@student.mlzs.in`,
        residentialAddress: `${10 + (k % 80)}, Station Road, Barrackpore, Kolkata 700120`,
        classroom: { id: c.classroomId, name: c.className, grade: c.grade, section: c.section },
        examEligibility: s.examEligibility,
        transportOpted: s.transportOpted,
        feeStructure: { tuitionFees: c.tuitionFees, annualCharges: c.annualCharges, transportOpted: s.transportOpted },
        kpis: {
            totalTuition: sum("tuitionFees"),
            totalTransport: sum("transportFees"),
            totalAnnual: sum("annualCharges"),
            totalOther: sum("otherFees"),
            totalDiscount: sum("discount"),
            totalPrevDue: sum("previousAmount"),
            totalPaid,
            totalDue: totalOverall - totalPaid,
            totalOverall,
            paidMonths: monthlyBreakdown.filter((m) => m.isPaid).length,
            unpaidMonths: monthlyBreakdown.filter((m) => !m.isPaid && m.recordId).length,
        },
        monthlyBreakdown,
    };
}

function studentFees(classroomId, month, year) {
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    return (studentsByClass[classroomId] ?? []).map((s) => feeRecord(s, m, y));
}

function searchFees(params) {
    const q = (params.get("query") || "").toLowerCase();
    const cls = params.get("classroomId");
    const status = params.get("status");
    const m = Number(params.get("month")) || now.getMonth() + 1;
    const y = Number(params.get("year")) || now.getFullYear();
    return allStudents
        .filter((s) => (!cls || s.classroomId === cls) && (!q || s.fullName.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q)))
        .map((s) => feeRecord(s, m, y))
        .filter((r) => !status || (status === "PAID" ? r.isPaid : status === "PARTIAL" ? !r.isPaid && r.paidAmount > 0 : r.paidAmount === 0))
        .slice(0, 60);
}

// ─── Income and expenses over the last eight months ───
const incomeSources = [
    ["DONATIONS", "Alumni association donation", "Donations"],
    ["EVENTS", "Annual day ticket sales", "Events"],
    ["EVENTS", "Science fair stall rent", "Events"],
    ["OTHER", "Uniform shop commission", "Other"],
    ["OTHER", "Auditorium hire", "Other"],
    ["DONATIONS", "Library fund donation", "Donations"],
];
const expenseReasons = [
    ["SALARIES", "Support staff salaries", "Salaries", "Staff payroll"],
    ["UTILITIES", "Electricity bill", "Utilities", "CESC"],
    ["MAINTENANCE", "Classroom fan repairs", "Maintenance", "Sarkar Electricals"],
    ["SUPPLIES", "Chalk, markers and registers", "Supplies", "Dey Stationers"],
    ["UTILITIES", "Internet and phone", "Utilities", "Jio Business"],
    ["MAINTENANCE", "Water purifier service", "Maintenance", "Aquaguard"],
    ["OTHER", "Sports day refreshments", "Other", "Ganguly Caterers"],
    ["SUPPLIES", "Lab chemicals", "Supplies", "Scientific Traders"],
];
const modes = ["CASH", "ONLINE", "NEFT", "CHEQUE", "CARD"];
const incomes = [];
const expenses = [];
for (let mo = 0; mo < 8; mo++) {
    const base = new Date(now.getFullYear(), now.getMonth() - mo, 1);
    const daysIn = mo === 0 ? now.getDate() : new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const nInc = 3 + ((mo * 3) % 4);
    const nExp = 5 + ((mo * 5) % 5);
    for (let i = 0; i < nInc; i++) {
        const [category, source, categoryName] = incomeSources[(i + mo) % incomeSources.length];
        const d = new Date(base.getFullYear(), base.getMonth(), 1 + ((i * 7 + mo) % daysIn), 11);
        const paymentMode = modes[(i + mo) % modes.length];
        incomes.push({
            id: `inc-${mo}-${i}`, date: iso(d), source, category, categoryName,
            amount: 8000 + ((i * 3571 + mo * 1777) % 42000), paymentMode,
            chequeNumber: paymentMode === "CHEQUE" ? `00${4410 + i + mo}` : null,
            addedBy: "Partha Sarathi Ghosh", createdAt: iso(d),
        });
    }
    for (let i = 0; i < nExp; i++) {
        const [category, reason, categoryName, partyName] = expenseReasons[(i + mo * 2) % expenseReasons.length];
        const d = new Date(base.getFullYear(), base.getMonth(), 1 + ((i * 5 + mo * 2) % daysIn), 15);
        const paymentMode = modes[(i * 2 + mo) % modes.length];
        expenses.push({
            id: `exp-${mo}-${i}`, date: iso(d), reason, partyName, category, categoryName,
            amount: category === "SALARIES" ? 145000 : 2500 + ((i * 4127 + mo * 991) % 38000), paymentMode,
            chequeNumber: paymentMode === "CHEQUE" ? `00${7720 + i + mo}` : null,
            addedBy: "Partha Sarathi Ghosh", createdAt: iso(d),
        });
    }
}
incomes.sort((a, b) => b.date.localeCompare(a.date));
expenses.sort((a, b) => b.date.localeCompare(a.date));

// P&L: recorded income plus fees collected that month, against recorded expenses.
function balance(month, year) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const inMonth = (r) => r.date.slice(0, 7) === key;
    const monthsBack = (now.getFullYear() - year) * 12 + now.getMonth() + 1 - month;
    const fees = monthsBack < 0 || monthsBack > 7 ? 0 : 520000 - monthsBack * 23000 + (month % 3) * 41000;
    const totalIncome = incomes.filter(inMonth).reduce((n, r) => n + r.amount, 0) + fees;
    const totalExpenses = expenses.filter(inMonth).reduce((n, r) => n + r.amount, 0) + (monthsBack >= 0 && monthsBack <= 7 ? 380000 + (month % 4) * 52000 : 0);
    return { month, year, totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
}

// ─── Latest payments (last 10 days) ───
const latestPayments = Array.from({ length: 34 }, (_, i) => {
    const s = allStudents[(i * 37) % allStudents.length];
    const c = classById(s.classroomId);
    const mode = i % 9 === 4 ? null : ["ONLINE", "ONLINE", "CASH", "ONLINE", "CHEQUE", "NEFT"][i % 6];
    const months = i % 5 === 0 ? 2 : 1;
    const m0 = now.getMonth() - (i % 3 === 0 ? 1 : 0);
    const label = Array.from({ length: months }, (_, j) => MONTHS[(m0 + j + 12) % 12]).join(", ");
    const annual = i % 8 === 1 ? c.annualCharges : 0;
    return {
        id: `pay-${i}`,
        paidAt: iso(day(-Math.floor(i / 4), 9 + (i % 8), (i * 13) % 60)),
        amountPaid: c.tuitionFees * months + annual + (s.transportOpted ? 900 * months : 0),
        monthsPaid: label,
        paymentMode: mode,
        receiptUrl: mode === "ONLINE" || i % 3 === 0 ? `https://mlzs.in/receipts/R${20260 + i}.pdf` : null,
        razorpayPaymentId: mode === "ONLINE" ? `pay_N${(98431 + i * 7).toString(36).toUpperCase()}` : null,
        annualContribution: annual,
        student: { id: s.studentId, fullName: s.fullName, admissionNumber: s.admissionNumber, classroomName: c.className },
    };
});

// ─── Messaging ───
const principalUser = { id: "u-principal-1", role: "PRINCIPAL", email: "principal@mlzs.in" };
const superAdminUser = { id: "u-sa-1", role: "SUPER_ADMIN", email: "admin@mlzs.in" };
const firstStudents = allStudents.slice(40, 44);
const conversations = [
    { otherUserId: principalUser.id, otherUserRole: "PRINCIPAL", lastMessage: "Please send the fee defaulters list for Class 7 before Friday.", lastMessageAt: iso(day(0, 9, 40)), direction: "received" },
    { otherUserId: superAdminUser.id, otherUserRole: "SUPER_ADMIN", lastMessage: "The November salary sheet is approved.", lastMessageAt: iso(day(-1, 16)), direction: "received" },
    { otherUserId: "u-t-3", otherUserRole: "TEACHER", lastMessage: "Thank you, I have told the parents about the late fee.", lastMessageAt: iso(day(-2, 12)), direction: "received" },
    ...firstStudents.map((s, i) => ({
        otherUserId: s.userId, otherUserRole: "STUDENT",
        lastMessage: i % 2 ? "Your October fee receipt is attached to your account." : "Can I pay the annual charges in two parts?",
        lastMessageAt: iso(day(-3 - i, 11)), direction: i % 2 ? "sent" : "received",
    })),
];
const thread = (other) =>
    [
        { id: "m1", createdAt: iso(day(-1, 10)), content: "Good morning. Could you share the list of students with dues above ₹5,000?", senderId: other, receiverId: me },
        { id: "m2", createdAt: iso(day(-1, 11)), content: "Yes, I will prepare it class by class and send it this afternoon.", senderId: me, receiverId: other },
        { id: "m3", createdAt: iso(day(0, 9, 40)), content: "Please send the fee defaulters list for Class 7 before Friday. The parent meeting is on Saturday morning.", senderId: other, receiverId: me },
    ].map((m) => ({ ...m, sender: { id: m.senderId, email: "", role: m.senderId === me ? "ACCOUNTANT" : "PRINCIPAL" }, receiver: { id: m.receiverId, email: "", role: "" } }));

function sectionsByGrade(grade) {
    const groups = new Map();
    for (const c of classrooms) {
        if (grade && c.grade !== grade) continue;
        const list = groups.get(c.grade) ?? [];
        list.push({
            id: c.classroomId, name: c.className, grade: c.grade, section: c.section, capacity: 40, total: c.totalStudents,
            classTeacher: { id: `t-${list.length + 1}`, fullName: nameAt(c.totalStudents, 11), userId: `u-t-${c.totalStudents}` },
        });
        groups.set(c.grade, list);
    }
    return [...groups.entries()].map(([g, sections]) => ({ grade: g, sections }));
}

function classStudents(classroomId) {
    return (studentsByClass[classroomId] ?? []).map((s) => ({
        id: s.studentId, userId: s.userId, fullName: s.fullName, rollNumber: s.rollNumber, attendance: null, overallGrade: null, lastExam: null,
    }));
}

function respond(url) {
    const u = new URL(url);
    const p = u.pathname;
    let m;
    if (p === "/accounts/classrooms/fees") return classrooms;
    if ((m = p.match(/^\/accounts\/classrooms\/([^/]+)\/students\/fees$/))) return studentFees(m[1], Number(u.searchParams.get("month")), Number(u.searchParams.get("year")));
    if (p === "/accounts/students/search") return searchFees(u.searchParams);
    if ((m = p.match(/^\/accounts\/students\/([^/]+)$/))) return studentDetail(m[1], Number(u.searchParams.get("year")) || undefined);
    if (p === "/accounts/payments/latest") return latestPayments;
    if (p === "/accounts/incomes") return incomes;
    if (p === "/accounts/expenses") return expenses;
    if (p === "/accounts/balance") return balance(Number(u.searchParams.get("month")) || now.getMonth() + 1, Number(u.searchParams.get("year")) || now.getFullYear());
    if (p === "/operations/conversations") return conversations;
    if (p === "/operations/conversation") return thread(u.searchParams.get("otherUserId"));
    if (p === "/operations/user-by-role") return u.searchParams.get("role") === "SUPER_ADMIN" ? superAdminUser : u.searchParams.get("role") === "PRINCIPAL" ? principalUser : { id: me, role: "ACCOUNTANT", email: meUser.email };
    if (p === "/operations/classrooms") return sectionsByGrade(u.searchParams.get("grade"));
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/students$/))) return classStudents(m[1]);
    unknown.add(p);
    return [];
}

// Non-GET requests: echo something plausible so success toasts fire.
function respondWrite(method, url, body) {
    const p = new URL(url).pathname;
    let m;
    if (method === "DELETE") return { success: true };
    if ((m = p.match(/^\/accounts\/classrooms\/([^/]+)\/fees$/))) return { ...classById(m[1]), ...body };
    if ((m = p.match(/^\/accounts\/classrooms\/([^/]+)\/other-fees$/))) return { classroomId: m[1], appliedCount: 24, skippedPaidCount: 3, otherFeesRemarks: null, ...body };
    if ((m = p.match(/^\/accounts\/students\/([^/]+)\/fees(\/payment)?$/))) return { ...feeRecord(studentById(m[1]), body?.month ?? now.getMonth() + 1, body?.year ?? now.getFullYear()), ...body };
    if ((m = p.match(/^\/accounts\/students\/([^/]+)\/(eligibility|transport)$/))) return { id: m[1], fullName: studentById(m[1]).fullName, ...body };
    if (p === "/accounts/incomes" || p === "/accounts/expenses") return { id: `new-${Date.now()}`, createdAt: iso(now), categoryName: null, chequeNumber: null, ...body };
    if (p === "/operations/message") return { id: `msg-${Date.now()}`, senderId: me, ...body };
    return { id: "new", success: true, ...(body && typeof body === "object" ? body : {}) };
}

module.exports = { respond, respondWrite, me, meUser, unknown, classrooms, allStudents };
