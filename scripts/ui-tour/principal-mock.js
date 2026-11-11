// Mock API for visual checks of the Principal portal. No real backend or credentials involved.
// Shapes follow src/redux/api/principalApi.ts, operationsApi.ts (notices) and accountsApi.ts (student detail).
const now = new Date();
const iso = (d) => d.toISOString();
const day = (offset, hour = 10, minute = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);

const me = "u-principal-1";
// Unknown GET paths are collected here so the tour can report them.
const unknown = new Set();

const first = ["Ananya", "Rohan", "Ishita", "Arjun", "Meghna", "Sayan", "Priya", "Aditya", "Riya", "Kunal", "Sneha", "Arnab", "Tania", "Soham", "Puja", "Rahul", "Diya", "Aritra", "Sreya", "Nikhil", "Moumita", "Debjit", "Rupsa", "Anirban"];
const last = ["Ghosh", "Das", "Sen", "Banerjee", "Mukherjee", "Chatterjee", "Roy", "Basu", "Dutta", "Saha", "Paul", "Mitra", "Bose", "Sarkar"];
const nameAt = (i, salt = 0) => `${first[(i * 7 + salt) % first.length]} ${last[(i * 5 + salt * 3) % last.length]}`;

// ─── Classrooms: Nursery to 12, one to three sections each (31 sections) ───
const grades = [
    ["Nursery", 2], ["KG", 2], ["1", 3], ["2", 3], ["3", 3], ["4", 2], ["5", 2], ["6", 2], ["7", 3], ["8", 2], ["9", 2], ["10", 2], ["11", 2], ["12", 1],
];
const classrooms = [];
for (const [grade, sections] of grades) {
    for (let s = 0; s < sections; s++) {
        const section = "ABC"[s];
        const label = /^\d+$/.test(grade) ? `Class ${grade}` : grade;
        const n = Number(grade);
        classrooms.push({
            id: `cls-${grade.toLowerCase()}${section.toLowerCase()}`,
            name: `${label} - Section ${section}`,
            grade,
            section,
            classType: Number.isNaN(n) || n <= 5 ? "PRIMARY" : "SECONDARY",
            capacity: 40,
            total: 0,
            classTeacher: null,
        });
    }
}

// ─── Teachers (56): most are class or subject teachers; a few inactive ───
const subjectNames = {
    PRIMARY: ["English", "Mathematics", "Environmental Studies", "Bengali", "Hindi"],
    SECONDARY: ["English", "Mathematics", "Science", "Social Science", "Bengali", "Computer Science"],
};
const departments = ["English", "Mathematics", "Science", "Social Science", "Languages", "Computer Science", "Pre-primary"];
const teachers = Array.from({ length: 56 }, (_, i) => {
    const fullName = nameAt(i, 11);
    const isActive = i % 19 !== 7;
    return {
        id: `t-${i + 1}`,
        fullName,
        employeeId: `EMP${String(101 + i).padStart(3, "0")}`,
        gender: i % 3 === 0 ? "MALE" : "FEMALE",
        designation: i % 8 === 0 ? "Senior teacher" : i % 5 === 0 ? "Assistant teacher" : "Teacher",
        department: departments[i % departments.length],
        primaryContact: i % 13 === 5 ? null : `98${String(30011223 + i * 7919).slice(0, 8)}`,
        email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@mlzs.in`,
        status: isActive ? "ACTIVE" : "INACTIVE",
        isActive,
        isClassTeacher: false,
        classTeacherOf: null,
        subjects: [],
    };
});

// Class teachers: one active teacher per section, except two sections left without one.
const activeTeachers = teachers.filter((t) => t.isActive);
classrooms.forEach((c, i) => {
    if (i === 4 || i === 17) return;
    const t = activeTeachers[i % activeTeachers.length];
    if (t.classTeacherOf) return;
    t.isClassTeacher = true;
    t.classTeacherOf = { name: c.name, grade: c.grade, section: c.section };
    c.classTeacher = { id: t.id, fullName: t.fullName, employeeId: t.employeeId };
});

// Subjects per classroom, spread across the active teachers.
const subjectsByClassroom = {};
classrooms.forEach((c, ci) => {
    const names = subjectNames[c.classType];
    subjectsByClassroom[c.id] = names.map((name, si) => {
        const assigned = !(ci === 6 && si === names.length - 1);
        const t = activeTeachers[(ci * 3 + si * 5) % activeTeachers.length];
        if (assigned) t.subjects.push({ subjectName: name, classroomName: c.name });
        return {
            id: `${c.id}-sub${si}`,
            name,
            classroom: { id: c.id, name: c.name, grade: c.grade, section: c.section },
            teachers: assigned ? [{ id: t.id, fullName: t.fullName, employeeId: t.employeeId }] : [],
        };
    });
});

// ─── Students (~900) ───
const studentsByClassroom = {};
const allStudents = [];
classrooms.forEach((c, ci) => {
    const count = 22 + ((ci * 7) % 15);
    c.total = count;
    studentsByClassroom[c.id] = Array.from({ length: count }, (_, i) => {
        const id = `${c.id}-s${i + 1}`;
        const fullName = nameAt(i, ci);
        const s = {
            id,
            admissionNo: `MLZS/${2019 + (ci % 6)}/${String(1000 + ci * 40 + i)}`,
            fullName,
            email: `${fullName.toLowerCase().replace(/\s+/g, ".")}.${ci}${i}@student.mlzs.in`,
            isActive: i % 41 !== 9,
            dob: new Date(2008 + (ci % 14), (i * 3) % 12, (i % 27) + 1).toISOString(),
            gender: i % 2 === 0 ? "FEMALE" : "MALE",
            residentialAddress: `${10 + i}, Station Road, Barrackpore, Kolkata 7001${20 + (i % 9)}`,
            primaryContact: `90${String(51122330 + ci * 997 + i * 31).slice(0, 8)}`,
            parentName: `${first[(i + 3) % first.length]} ${fullName.split(" ")[1]}`,
            parentContact: `90${String(73344550 + ci * 557 + i * 17).slice(0, 8)}`,
            rollNumber: String(i + 1),
            classRoll: i + 1,
            profileImage: null,
            examEligibility: i % 11 !== 4,
            classroom: { id: c.id, name: c.name, grade: c.grade, section: c.section },
            attendancePercentage: 70 + ((i * 13) % 30),
            averageMarks: 45 + ((i * 17) % 50),
            feeStatus: i % 9 === 2 ? "OVERDUE" : i % 5 === 1 ? "PENDING" : "CLEARED",
        };
        allStudents.push({
            studentId: id,
            admissionNumber: s.admissionNo,
            fullName,
            classroomId: c.id,
            classroomName: c.name,
            section: c.section,
            attendance: i % 9 === 4 ? "ABSENT" : "PRESENT",
            avgMarks: s.averageMarks,
            feeStatus: s.feeStatus === "CLEARED" ? "PAID" : s.feeStatus === "OVERDUE" ? "UNPAID" : "PARTIAL",
        });
        return s;
    });
});
const findStudent = (id) => {
    for (const list of Object.values(studentsByClassroom)) {
        const s = list.find((x) => x.id === id);
        if (s) return s;
    }
    return Object.values(studentsByClassroom)[0][0];
};

// ─── Exam schedule and admit card ───
const examSchedule = (classroomId, examType) =>
    (subjectsByClassroom[classroomId] ?? []).map((s, i) => ({
        subjectId: s.id,
        subjectName: s.name,
        // Half-yearly is fully scheduled; the final exam has the last subject still undated.
        examDate: examType === "FINAL" && i === (subjectsByClassroom[classroomId].length - 1) ? null : iso(day((examType === "FINAL" ? 40 : 12) + i * 2, 9)),
    }));
const admitPreview = (studentId, examType) => {
    const s = findStudent(studentId);
    const schedule = examSchedule(s.classroom.id, examType);
    return {
        studentId: s.id,
        studentName: s.fullName,
        admissionNumber: s.admissionNo,
        rollNumber: s.rollNumber,
        classroom: { grade: s.classroom.grade, section: s.classroom.section, name: s.classroom.name },
        examName: examType === "FINAL" ? "Final Examination" : "Half Yearly Examination",
        examDate: schedule[0]?.examDate ?? null,
        examSubject: null,
        subjects: schedule.map((x) => x.subjectName),
        examSchedule: schedule,
        profileImage: null,
        center: "Mount Litera Zee School, Barrackpore",
        issuedAt: iso(now),
    };
};

// ─── Student detail (accounts endpoint, used by the student dialog) ───
const studentDetail = (studentId) => {
    const s = findStudent(studentId);
    const yearStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const month = ((3 + i) % 12) + 1;
        const year = month >= 4 ? yearStart : yearStart + 1;
        const due = new Date(year, month - 1, 10) <= now;
        const isPaid = due && !(s.feeStatus !== "CLEARED" && i >= 5);
        const annual = i === 0 ? 12000 : 0;
        const total = 3200 + annual;
        return {
            month, year, recordId: due ? `rec-${s.id}-${i}` : null, tuitionFees: 3200, transportFees: 0, annualCharges: annual, annualChargesApplicable: i === 0,
            otherFees: 0, otherFeesRemarks: null, penalty: 0, previousAmount: 0, discount: 0, totalAmount: total, isPaid, paidAmount: isPaid ? total : 0,
            paidAt: isPaid ? iso(new Date(year, month - 1, 8)) : null, paymentMode: isPaid ? "UPI" : null,
        };
    });
    const paid = monthlyBreakdown.filter((m) => m.isPaid);
    const dueRows = monthlyBreakdown.filter((m) => m.recordId && !m.isPaid);
    const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
    return {
        studentId: s.id, fullName: s.fullName, rollNumber: s.rollNumber, classRoll: s.classRoll, admissionNumber: s.admissionNo, dob: s.dob, gender: s.gender,
        parentName: s.parentName, parentContact: s.parentContact, primaryContact: s.primaryContact, secondaryContact: null, email: s.email,
        residentialAddress: s.residentialAddress, classroom: s.classroom, examEligibility: s.examEligibility, transportOpted: false,
        feeStructure: { tuitionFees: 3200, annualCharges: 12000, transportOpted: false },
        kpis: {
            totalTuition: sum(monthlyBreakdown, "tuitionFees"), totalTransport: 0, totalAnnual: 12000, totalOther: 0, totalDiscount: 0, totalPrevDue: 0,
            totalPaid: sum(paid, "paidAmount"), totalDue: sum(dueRows, "totalAmount"), totalOverall: sum(monthlyBreakdown, "totalAmount"),
            paidMonths: paid.length, unpaidMonths: dueRows.length,
        },
        monthlyBreakdown,
    };
};

// ─── Profile ───
const profile = {
    id: "p-1",
    halfYearlyMarksEntryEnabled: true,
    finalMarksEntryEnabled: false,
    fullName: "Sudeshna Chakraborty",
    dob: "1974-08-14",
    gender: "FEMALE",
    residentialAddress: "22 Barasat Road, Barrackpore, Kolkata 700120",
    nationality: "Indian",
    caste: "General",
    isPwd: false,
    aadharNo: "4412 8890 1123",
    identificationMark: null,
    primaryContact: "98300 77881",
    secondaryContact: null,
    email: "sudeshna.c@mlzs.in",
    bloodGroup: "B+",
    designation: "Principal",
    department: "Administration",
    user: { email: "principal@mlzs.in" },
    profileImage: null,
};

// ─── Notices ───
const noticeTopics = [
    ["Winter vacation schedule", "School remains closed from 25 December to 1 January. Classes resume on 2 January.", "HOLIDAYS"],
    ["Half-yearly marks deadline", "Teachers must finish entering half-yearly marks by the 20th.", "EXAMS"],
    ["Annual sports meet", "The annual sports meet will be held on the main ground. House teachers, please coordinate.", "EVENTS"],
    ["Staff meeting", "All teachers meet in the staff room at 2:30 pm on Friday.", "GENERAL"],
    ["Water supply disruption", "Drinking water will be supplied from tankers on Friday due to maintenance work.", "EMERGENCY"],
];
const notices = Array.from({ length: 14 }, (_, i) => {
    const [title, content, tag] = noticeTopics[i % noticeTopics.length];
    return {
        id: `n${i}`, title, content, senderName: i % 3 === 0 ? "Sudeshna Chakraborty" : "Vikram Seth",
        link: i === 1 ? "https://mlzs.in/exams" : null, file: i === 2 ? "https://mlzs.in/files/sports-meet-schedule.pdf" : null,
        tag, createdAt: iso(day(-Math.floor(i * 1.6), 11 - (i % 3))),
    };
});

const classroomById = (id) => classrooms.find((c) => c.id === id) ?? classrooms[0];
const order = classrooms.map((c) => c.id);

function respond(url) {
    const u = new URL(url);
    const p = u.pathname;
    let m;
    if (p === "/principal/profile") return profile;
    if (p === "/principal/classrooms") return classrooms;
    if ((m = p.match(/^\/principal\/classrooms\/([^/]+)$/))) return classroomById(m[1]);
    if ((m = p.match(/^\/principal\/classrooms\/([^/]+)\/students$/))) return studentsByClassroom[m[1]] ?? [];
    if ((m = p.match(/^\/principal\/classrooms\/([^/]+)\/next-classes$/))) {
        const idx = order.indexOf(m[1]);
        const nextGrade = classrooms[idx + 1] ? classrooms.find((c, i) => i > idx && c.grade !== classroomById(m[1]).grade)?.grade : null;
        return classrooms.filter((c) => c.grade === nextGrade);
    }
    if ((m = p.match(/^\/principal\/classrooms\/([^/]+)\/exam-schedule$/))) return examSchedule(m[1], u.searchParams.get("examType") || "HALF_YEARLY");
    if (p === "/principal/students") return allStudents;
    if (p === "/principal/teachers") return teachers;
    if ((m = p.match(/^\/principal\/subjects\/([^/]+)$/))) return subjectsByClassroom[m[1]] ?? [];
    if ((m = p.match(/^\/principal\/students\/([^/]+)\/admit-card-preview$/))) return admitPreview(m[1], u.searchParams.get("examType") || "HALF_YEARLY");
    if ((m = p.match(/^\/accounts\/students\/([^/]+)$/))) return studentDetail(m[1]);
    if (p === "/operations/notices") return notices;
    unknown.add(p);
    return [];
}

// Non-GET requests: echo something plausible so success toasts fire.
function respondWrite(method, url, body) {
    const p = new URL(url).pathname;
    if (p === "/principal/marks-entry-setting") return { enabled: Boolean(body?.enabled) };
    if (p === "/upload/profile-image") return { success: true, imageUrl: body?.imageUrl ?? "" };
    if (/\/roll-arrange$/.test(p)) return { count: 30 };
    if (p === "/principal/exam-schedule") return body?.schedule ?? [];
    return { id: "new", success: true, count: 1, ...(body && typeof body === "object" ? body : {}) };
}

module.exports = { respond, respondWrite, me, unknown, classrooms };
