// Mock API for visual checks of the Super Admin portal. No real backend or credentials involved.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const first = ["Aarav", "Ishita", "Rohan", "Ananya", "Kabir", "Meera", "Arjun", "Diya", "Vihaan", "Saanvi", "Reyansh", "Aditi", "Krish", "Tanvi", "Aryan", "Riya", "Dev", "Nisha", "Sourav", "Payel", "Debjani", "Arnab", "Sneha", "Ritwik"];
const last = ["Sen", "Das", "Ghosh", "Banerjee", "Chatterjee", "Mukherjee", "Roy", "Bose", "Dutta", "Sarkar", "Mitra", "Paul", "Saha", "Basu"];
const name = () => `${pick(first)} ${pick(last)}`;

const now = new Date();
const iso = (d) => d.toISOString();
const daysAgo = (n) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 10);

const students = [];
let sid = 0;
for (let g = 1; g <= 10; g++)
    for (const sec of ["A", "B", "C"]) {
        const n = 28 + Math.floor(rnd() * 8);
        for (let i = 0; i < n && students.length < 923; i++) {
            sid++;
            students.push({ id: `st${sid}`, userId: `u-st${sid}`, fullName: name(), admissionNumber: `MLZS/2026/${String(sid).padStart(4, "0")}`, classroom: `Class ${g} - Section ${sec}`, isActive: rnd() > 0.05, email: `student${sid}@mlzs.in`, role: "STUDENT", primaryContact: "98300 12345", password: "secret" });
        }
    }
const teachers = Array.from({ length: 57 }, (_, i) => ({ id: `t${i}`, userId: `u-t${i}`, fullName: name(), employeeId: `EMP${100 + i}`, isActive: true, email: `teacher${i}@mlzs.in`, role: "TEACHER", department: pick(["Science", "Maths", "English", "Bengali", "Arts"]), designation: "Teacher", primaryContact: "98300 22222", password: "secret" }));
const staff = [
    { id: "s1", userId: "u-acc1", fullName: "Priyanka Sen", employeeId: "ACC01", isActive: true, email: "priyanka@mlzs.in", role: "ACCOUNTANT", primaryContact: "98300 33333", password: "secret" },
    { id: "s2", userId: "u-acc2", fullName: "Payel Dasgupta", employeeId: "ACC02", isActive: true, email: "payel@mlzs.in", role: "ACCOUNTANT", primaryContact: "98300 44444", password: "secret" },
    { id: "s3", userId: "u-st-1", fullName: "Ramesh Kumar", employeeId: "STF01", isActive: true, email: "ramesh@mlzs.in", role: "STAFF", customRole: "Librarian", primaryContact: "98300 55555", password: "secret" },
];
const principals = [{ id: "p1", userId: "u-p1", fullName: "Dr. Sunita Mukherjee", employeeId: "PR01", isActive: true, email: "principal@mlzs.in", role: "PRINCIPAL", primaryContact: "98300 66666", password: "secret" }];

const incomes = [];
const expenses = [];
const people = ["Priyanka Sen", "Payel Dasgupta", "Vikram Seth"];
for (let m = 0; m < 9; m++) {
    for (let k = 0; k < 4; k++) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 2 + Math.floor(rnd() * 25), 10);
        if (d > now) continue;
        const cat = pick(["DONATIONS", "EVENTS", "OTHER"]);
        const mode = pick(["CASH", "CHEQUE", "NEFT", "ONLINE"]);
        incomes.push({ id: `i${m}${k}`, date: iso(d), createdAt: iso(d), source: pick({ DONATIONS: ["Alumni Association donation", "Parent trust donation"], EVENTS: ["Sports meet sponsorship", "Annual day tickets"], OTHER: ["Canteen lease rent", "Bus hire for wedding event"] }[cat]), category: cat, categoryName: null, amount: Math.round(5 + rnd() * 60) * 1000, paymentMode: mode, chequeNumber: mode === "CHEQUE" ? String(100000 + Math.floor(rnd() * 899999)) : null, addedBy: pick(people) });
    }
    for (let k = 0; k < 5; k++) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1 + Math.floor(rnd() * 26), 11);
        if (d > now) continue;
        const cat = k === 0 ? "SALARIES" : pick(["UTILITIES", "MAINTENANCE", "SUPPLIES", "OTHER"]);
        const mode = pick(["NEFT", "CHEQUE", "CASH"]);
        expenses.push({ id: `e${m}${k}`, date: iso(d), createdAt: iso(d), reason: { SALARIES: "Staff salaries", UTILITIES: "Electricity bill", MAINTENANCE: "Classroom repainting", SUPPLIES: "Lab consumables", OTHER: "Printing of report cards" }[cat], partyName: { SALARIES: null, UTILITIES: "CESC Ltd", MAINTENANCE: "Kolkata Paints & Co", SUPPLIES: "Scientific Traders", OTHER: "Saraswati Press" }[cat], category: cat, categoryName: null, amount: cat === "SALARIES" ? 2400000 + Math.round(rnd() * 200000) : Math.round(3 + rnd() * 40) * 1000, paymentMode: mode, chequeNumber: mode === "CHEQUE" ? String(100000 + Math.floor(rnd() * 899999)) : null, addedBy: pick(people) });
    }
}

function balance(month, year) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const ti = incomes.filter((r) => r.date.slice(0, 7) === key).reduce((n, r) => n + r.amount, 0);
    const te = expenses.filter((r) => r.date.slice(0, 7) === key).reduce((n, r) => n + r.amount, 0);
    return { month, year, totalIncome: ti, totalExpenses: te, netBalance: ti - te };
}

const notices = [
    ["Winter vacation schedule", "School remains closed from 25 December to 1 January. Classes resume on 2 January.", "HOLIDAYS", 0],
    ["Half-yearly exam timetable", "The timetable for the half-yearly examinations is attached. Students must report by 8:30 am.", "EXAMS", 1],
    ["Annual sports meet", "The annual sports meet will be held on the main ground. Parents are welcome.", "EVENTS", 3],
    ["Fee payment reminder", "Please clear pending fees for the second quarter by the 15th.", "GENERAL", 4],
    ["Water supply disruption", "Drinking water will be supplied from tankers on Friday due to maintenance work.", "EMERGENCY", 8],
    ["Science exhibition", "Entries for the inter-house science exhibition close next week.", "EVENTS", 12],
].map(([title, content, tag, ago], i) => ({ id: `n${i}`, title, content, senderName: "Vikram Seth", link: i === 1 ? "https://mlzs.in/exams" : null, file: null, tag, createdAt: iso(daysAgo(ago)) }));

const me = "sa-1";
const conversations = [
    { otherUserId: "u-p1", otherUserRole: "PRINCIPAL", lastMessage: "Please share the revised budget before Friday.", lastMessageAt: iso(daysAgo(0)), direction: "received" },
    { otherUserId: "u-acc1", otherUserRole: "ACCOUNTANT", lastMessage: "Salary sheet for November is ready for approval.", lastMessageAt: iso(daysAgo(1)), direction: "received" },
    { otherUserId: "u-t3", otherUserRole: "TEACHER", lastMessage: "Thanks, I will update the lab register.", lastMessageAt: iso(daysAgo(3)), direction: "sent" },
    { otherUserId: "u-st5", otherUserRole: "STUDENT", lastMessage: "Your scholarship form has been received.", lastMessageAt: iso(daysAgo(6)), direction: "sent" },
];
const thread = (other) => [
    { id: "m1", createdAt: iso(daysAgo(1)), content: "Good morning. Could you share the revised budget for the sports meet?", senderId: me, receiverId: other },
    { id: "m2", createdAt: iso(daysAgo(1)), content: "Sure, I will send it by this evening.", senderId: other, receiverId: me },
    { id: "m3", createdAt: iso(daysAgo(0)), content: "Please share the revised budget before Friday. The committee meets on Saturday morning and needs the final figures.", senderId: other, receiverId: me },
].map((m) => ({ ...m, sender: { id: m.senderId, email: "", role: "" }, receiver: { id: m.receiverId, email: "", role: "" } }));

function respond(url) {
    const u = new URL(url);
    const p = u.pathname;
    if (p === "/super-admin/profile") return { id: "prof1", fullName: "Vikram Seth", user: { email: "superadmin@school.com" }, email: "superadmin@school.com", dob: "1975-04-12", gender: "MALE", residentialAddress: "12 Lake Road, Kolkata 700029", nationality: "Indian", primaryContact: "98300 77777", secondaryContact: null, designation: "Director", department: "Administration", profileImage: null };
    if (p === "/super-admin/dashboard-kpis") return { totalStudents: students.length, totalTeachers: teachers.length, administrativeStaff: 4, activeNotices: notices.length, monthlyRevenue: 0, pendingAdmissions: 3 };
    if (p === "/super-admin/user-management-kpis") return { totalTeachers: teachers.length, totalStudents: students.length, staffMembers: staff.length, totalUsers: students.length + teachers.length + staff.length + 1 };
    if (p === "/super-admin/users") return { teachers, students, staff, principals };
    if (p === "/super-admin/incomes") return incomes;
    if (p === "/super-admin/expenses") return expenses;
    if (p === "/accounts/balance") return balance(Number(u.searchParams.get("month")), Number(u.searchParams.get("year")));
    if (p === "/operations/notices") return notices;
    if (p === "/operations/conversations") return conversations;
    if (p === "/operations/conversation") return thread(u.searchParams.get("otherUserId"));
    return [];
}

module.exports = { respond };
