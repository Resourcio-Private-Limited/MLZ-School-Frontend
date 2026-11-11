// Mock API for visual checks of the Teacher portal. No real backend or credentials involved.
const now = new Date();
const iso = (d) => d.toISOString();
const day = (offset, hour = 10, minute = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);
const key = (d) => d.toISOString().slice(0, 10);

const me = "u-teach-1";
const teacherId = "t-1";
// Scenarios flip this to show today's register before and after it is marked.
const state = { todayMarked: false };

const classes = [
    { id: "cls-7b", name: "Class 7 - Section B", grade: "7", section: "B", subjects: ["English"], studentCount: 34, isClassTeacher: true },
    { id: "cls-7a", name: "Class 7 - Section A", grade: "7", section: "A", subjects: ["English"], studentCount: 32, isClassTeacher: false },
    { id: "cls-8a", name: "Class 8 - Section A", grade: "8", section: "A", subjects: ["English", "Literature"], studentCount: 30, isClassTeacher: false },
    { id: "cls-3a", name: "Class 3 - Section A", grade: "3", section: "A", subjects: ["English"], studentCount: 26, isClassTeacher: false },
];

const first = ["Ananya", "Rohan", "Ishita", "Arjun", "Meghna", "Sayan", "Priya", "Aditya", "Riya", "Kunal", "Sneha", "Arnab", "Tania", "Soham", "Puja", "Rahul", "Diya", "Aritra", "Sreya", "Nikhil"];
const last = ["Ghosh", "Das", "Sen", "Banerjee", "Mukherjee", "Chatterjee", "Roy", "Basu", "Dutta", "Saha", "Paul", "Mitra"];
const studentsFor = (cls) =>
    Array.from({ length: cls.studentCount }, (_, i) => ({
        id: `${cls.id}-s${i + 1}`,
        userId: `u-${cls.id}-s${i + 1}`,
        fullName: `${first[(i * 7 + cls.id.length) % first.length]} ${last[(i * 5 + 3) % last.length]}`,
        rollNumber: String(i + 1),
        attendance: i % 9 === 4 ? "ABSENT" : i === 30 ? null : "PRESENT",
        overallGrade: i % 6 === 5 ? null : ["A1", "A2", "B1", "B2", "C1"][i % 5],
        lastExam: i % 6 === 5 ? null : { name: "Half-yearly", examDate: iso(day(-40)) },
    }));
const students = Object.fromEntries(classes.map((c) => [c.id, studentsFor(c)]));

const profile = {
    halfYearlyMarksEntryEnabled: true,
    finalMarksEntryEnabled: false,
    fullName: "Rituparna Sen", email: "rituparna.sen@mlzs.in", primaryContact: "98300 11223", dob: "1988-03-21", gender: "FEMALE",
    residentialAddress: "14 Ghosh Para Road, Barrackpore, Kolkata 700120", profileImage: null,
    employeeId: "EMP104", highestQualification: "M.A. English, B.Ed.", salary: "48500", designation: "Senior teacher", status: "ACTIVE",
    nationality: "Indian", caste: "General", isPwd: false, aadharNo: "5521 7789 0012", secondaryContact: "98300 44556", identificationMark: "Mole on the right hand",
    joiningDate: "2016-06-01", department: "English",
    classTeacherOf: { id: "cls-7b", name: "Class 7 - Section B", grade: "7", section: "B" },
    assignedClassrooms: classes,
    userEmail: "rituparna.sen@mlzs.in",
};

const details = (id) => {
    const c = classes.find((x) => x.id === id) ?? classes[0];
    return { className: `Class ${c.grade}`, classTeacherName: c.isClassTeacher ? "Rituparna Sen" : "Arnab Chatterjee", section: c.section, totalStudents: c.studentCount };
};

const recipients = [
    { id: "u-p1", name: "Principal", role: "PRINCIPAL" },
    { id: "u-acc1", name: "Accountant", role: "ACCOUNTANT" },
    { id: "u-sa1", name: "Super Admin", role: "SUPER_ADMIN" },
];

function history(id, year, month) {
    const list = students[id] ?? [];
    const total = list.length;
    const daysIn = new Date(year, month, 0).getDate();
    const days = [];
    let marked = 0;
    let present = 0;
    for (let d = 1; d <= daysIn; d++) {
        const date = new Date(year, month - 1, d);
        const k = key(new Date(Date.UTC(year, month - 1, d)));
        const isToday = k === key(now);
        const weekend = date.getDay() === 0;
        const isMarked = date <= now && !weekend && d !== 6 && (!isToday || state.todayMarked);
        const absent = isMarked ? (d * 3) % 5 : 0;
        if (isMarked) {
            marked++;
            present += total - absent;
        }
        days.push({ date: k, dayName: date.toLocaleDateString("en-US", { weekday: "short" }), present: isMarked ? total - absent : 0, absent, totalStudents: total, isMarked, teacherId: isMarked ? teacherId : null });
    }
    return { classroomId: id, year, month, totalStudents: total, avgAttendance: marked ? Math.round((present / (marked * total)) * 100) : 0, totalWorkingDays: marked, days };
}

function byDate(id, date) {
    const list = students[id] ?? [];
    if (date === key(now) && !state.todayMarked) return { date, total: 0, present: 0, absent: 0, records: [] };
    const records = list.map((s, i) => ({ studentId: s.id, fullName: s.fullName, rollNumber: s.rollNumber, status: i % 9 === 4 ? "ABSENT" : "PRESENT" }));
    return { date, total: records.length, present: records.filter((r) => r.status === "PRESENT").length, absent: records.filter((r) => r.status === "ABSENT").length, records };
}

const subjects = ["English", "Mathematics", "Science", "Bengali", "History"];
const classExams = (id) => [
    ...subjects.map((s, i) => ({ id: `${id}-fin-${i}`, name: "Final", examDate: iso(day(30 + i)), subject: { id: `sub${i}`, name: s }, subjectId: `sub${i}`, classroomId: id })),
    ...subjects.map((s, i) => ({ id: `${id}-hy-${i}`, name: "Half-yearly", examDate: iso(day(-45 + i)), subject: { id: `sub${i}`, name: s }, subjectId: `sub${i}`, classroomId: id })),
];
const classMarks = (id, examId) => {
    const primary = id === "cls-3a";
    const final = examId.includes("-fin-");
    return (students[id] ?? []).map((s, i) => {
        const score = final ? null : i % 7 === 3 ? null : 38 + ((i * 17) % 60);
        return {
            studentId: s.id, fullName: s.fullName, rollNumber: s.rollNumber, subjectId: "sub0", subjectName: "English", examId, examName: final ? "Final" : "Half-yearly",
            subjects: [{ subjectId: "sub0", subjectName: "English", score, maxScore: 100 }],
            totalObtained: score ?? 0, totalMax: 500, percentage: score ? Math.round(score / 5) : 0, grade: "F", classType: primary ? "PRIMARY" : "SECONDARY",
        };
    });
};

const examTypes = classes.map((c) => ({
    classroomId: c.id, classroomName: c.name, grade: c.grade, section: c.section,
    exams: [
        { examId: `${c.id}-ut3`, examName: "Unit test 3", subjectName: "English", subjectId: "sub0", examDate: iso(day(-3)), submissionOpen: true, totalResults: 12 },
        { examId: `${c.id}-hy`, examName: "Half-yearly", subjectName: "English", subjectId: "sub0", examDate: iso(day(-45)), submissionOpen: false, totalResults: c.studentCount },
    ],
}));
const examMarks = (examId) => {
    const clsId = examId.replace(/-(ut3|hy)$/, "");
    const c = classes.find((x) => x.id === clsId) ?? classes[0];
    const open = examId.endsWith("-ut3");
    const records = (students[c.id] ?? []).map((s, i) => {
        const m = open && i >= 12 ? null : 35 + ((i * 13) % 65);
        return { studentId: s.id, rollNumber: s.rollNumber, fullName: s.fullName, marksObtained: m, totalMarks: 100, percentage: m, grade: m === null ? null : m >= 90 ? "A+" : m >= 75 ? "A" : m >= 60 ? "B" : m >= 40 ? "C" : "F", status: m !== null && m < 40 ? "Fail" : m === null ? null : "Pass" };
    });
    const scored = records.filter((r) => r.marksObtained !== null).map((r) => r.marksObtained);
    return {
        examId, examName: open ? "Unit test 3" : "Half-yearly", examDate: iso(day(open ? -3 : -45)), subjectName: "English", classroomName: c.name, totalStudents: records.length, totalMarks: 100,
        avgMarks: scored.reduce((a, b) => a + b, 0) / Math.max(1, scored.length), highestMarks: Math.max(...scored), lowestMarks: Math.min(...scored), records,
    };
};

const annTopics = [
    ["Essay due on Friday", "Submit your essay on 'My favourite festival' by Friday. 300 to 400 words, handwritten.", "https://mlzs.in/files/essay-guidelines.pdf"],
    ["Library period moved", "This week's library period moves from Wednesday to Thursday, third period.", null],
    ["Spelling test", "Spelling test on lesson 6 next Monday. Revise the word list in your notebook.", null],
    ["Parent-teacher meeting", "The parent-teacher meeting is on Saturday from 10 am. Please remind your parents.", null],
];
const announcements = (id) =>
    Array.from({ length: 13 }, (_, i) => {
        const [title, content, fileUrl] = annTopics[i % annTopics.length];
        return { id: `${id}-a${i}`, title, content, fileUrl, createdAt: iso(day(-Math.floor(i * 1.7), 9 + (i % 5))), teacherId, classroomId: id, teacher: { fullName: "Rituparna Sen" } };
    });

const noticeTopics = [
    ["Winter vacation schedule", "School remains closed from 25 December to 1 January. Classes resume on 2 January.", "HOLIDAYS"],
    ["Half-yearly marks deadline", "Teachers must finish entering half-yearly marks by the 20th.", "EXAMS"],
    ["Annual sports meet", "The annual sports meet will be held on the main ground. House teachers, please coordinate.", "EVENTS"],
    ["Staff meeting", "All teachers meet in the staff room at 2:30 pm on Friday.", "GENERAL"],
    ["Water supply disruption", "Drinking water will be supplied from tankers on Friday due to maintenance work.", "EMERGENCY"],
];
const notices = Array.from({ length: 12 }, (_, i) => {
    const [title, content, tag] = noticeTopics[i % noticeTopics.length];
    return { id: `n${i}`, title, content, senderName: "Vikram Seth", link: i === 1 ? "https://mlzs.in/exams" : null, file: i === 2 ? "https://mlzs.in/files/sports-meet-schedule.pdf" : null, tag, createdAt: iso(day(-i * 2, 11)) };
});

const conversations = [
    { otherUserId: "u-cls-7b-s3", otherUserRole: "STUDENT", lastMessage: "Thank you ma'am, I will submit it tomorrow.", lastMessageAt: iso(day(0, 9)), direction: "received" },
    { otherUserId: "u-p1", otherUserRole: "PRINCIPAL", lastMessage: "Please share the half-yearly results by Friday.", lastMessageAt: iso(day(-1, 15)), direction: "received" },
    { otherUserId: "u-acc1", otherUserRole: "ACCOUNTANT", lastMessage: "Your October salary slip has been issued.", lastMessageAt: iso(day(-6)), direction: "received" },
];
const thread = (other) =>
    [
        { id: "m1", createdAt: iso(day(-1, 18)), content: "Good evening ma'am. I was unwell today. Can I submit the essay tomorrow?", senderId: other, receiverId: me },
        { id: "m2", createdAt: iso(day(0, 8, 30)), content: "Yes, you can submit it tomorrow. Get well soon.", senderId: me, receiverId: other },
        { id: "m3", createdAt: iso(day(0, 9)), content: "Thank you ma'am, I will submit it tomorrow.", senderId: other, receiverId: me },
    ].map((m) => ({ ...m, sender: { id: m.senderId, email: "", role: "" }, receiver: { id: m.receiverId, email: "", role: "" } }));


// Component-wise marks (GET /teacher/class/:id/assessments?examType=). Labels and limits follow
// the backend's assessment.constants.ts. Half yearly entry is open, final is locked.
const PRIMARY_GRADES = [
    { code: "BG", label: "Beginners" },
    { code: "PG", label: "Progressing" },
    { code: "PF", label: "Proficient" },
    { code: "NA", label: "Not Assessing At This Time" },
];
const GRADE_FIELDS = {
    HALF_YEARLY: [{ key: "term1Grade", label: "Term 1 Grade" }, { key: "term2Grade", label: "Term 2 Grade" }],
    FINAL: [{ key: "term3Grade", label: "Term 3 Grade" }],
};
const COMPONENT_LABELS = {
    HALF_YEARLY: ["Periodic Test-1", "MA-1 / PF-1", "SEA-1", "Half Yearly Exam"],
    FINAL: ["Periodic Test-2", "MA-2 / PF-2", "SEA-2", "Yearly Exam"],
};
const COMPONENT_KEYS = ["periodicTest", "multipleAssessment", "subjectEnrichment", "examMarks"];
const COMPONENT_MAX = [10, 5, 5, 80];
const assessments = (classroomId, examType) => {
    const cls = classes.find((c) => c.id === classroomId) ?? classes[0];
    const primary = Number(cls.grade) <= 5;
    const final = examType === "FINAL";
    const subs = subjects.map((name, i) => ({ id: `sub${i}`, name, editable: cls.isClassTeacher || cls.subjects.includes(name) }));
    const fields = GRADE_FIELDS[examType];
    return {
        classroomId: cls.id,
        classroomName: cls.name,
        classType: primary ? "PRIMARY" : "SECONDARY",
        examType,
        session: "2026-27",
        entryEnabled: !final,
        isClassTeacher: cls.isClassTeacher,
        showRemarks: cls.isClassTeacher && final,
        gradeOptions: PRIMARY_GRADES,
        gradeFields: primary ? fields : [],
        components: primary ? [] : COMPONENT_KEYS.map((key, i) => ({ key, label: COMPONENT_LABELS[examType][i], maxMarks: COMPONENT_MAX[i] })),
        subjectMaxMarks: primary ? null : 100,
        subjects: subs,
        students: (students[cls.id] ?? []).map((st, si) => {
            // Some students done, some part-way, some not started.
            const doneSubjects = final ? 0 : si % 5 === 4 ? 0 : si % 3 === 2 ? 2 : subs.length;
            return {
                studentId: st.id,
                fullName: st.fullName,
                rollNumber: st.rollNumber,
                classRoll: si + 1,
                ...(cls.isClassTeacher && final ? { remarks: si % 4 === 0 ? "Attentive in class; needs to revise maths regularly." : null } : {}),
                assessments: subs.slice(0, doneSubjects).map((sub, j) => {
                    const v = COMPONENT_KEYS.map((k, ci) => Math.max(0, COMPONENT_MAX[ci] - ((si + j * 3 + ci) % (ci === 3 ? 30 : 4))));
                    return {
                        subjectId: sub.id,
                        term1Grade: primary ? PRIMARY_GRADES[(si + j) % 3].code : null,
                        term2Grade: primary ? PRIMARY_GRADES[(si + j + 1) % 3].code : null,
                        term3Grade: null,
                        periodicTest: primary ? null : v[0],
                        multipleAssessment: primary ? null : v[1],
                        subjectEnrichment: primary ? null : v[2],
                        examMarks: primary ? null : v[3],
                        total: primary ? null : v.reduce((a, b) => a + b, 0),
                    };
                }),
            };
        }),
    };
};

function respond(url) {
    const u = new URL(url);
    const p = u.pathname;
    let m;
    if (p === "/teacher/full-profile") return profile;
    if (p === "/teacher/my-classes") return classes;
    if (p === "/teacher/message-recipients") return recipients;
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/details$/))) return details(m[1]);
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/students$/))) return students[m[1]] ?? [];
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/assessments$/))) return assessments(m[1], u.searchParams.get("examType") || "HALF_YEARLY");
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/exams$/))) return classExams(m[1]);
    if ((m = p.match(/^\/teacher\/class\/([^/]+)\/exam\/([^/]+)\/marks$/))) return classMarks(m[1], m[2]);
    if ((m = p.match(/^\/operations\/attendance\/([^/]+)\/history$/))) return history(m[1], Number(u.searchParams.get("year")), Number(u.searchParams.get("month")));
    if ((m = p.match(/^\/operations\/attendance\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/))) return byDate(m[1], m[2]);
    if (p === "/academic/teacher/exam-types") return examTypes;
    if ((m = p.match(/^\/academic\/exam\/([^/]+)\/marks$/))) return examMarks(m[1]);
    if (p === "/operations/notices") return notices;
    if ((m = p.match(/^\/operations\/announcements\/([^/]+)$/))) return announcements(m[1]);
    if (p === "/operations/conversations") return conversations;
    if (p === "/operations/conversation") return thread(u.searchParams.get("otherUserId"));
    return [];
}

module.exports = { respond, me, teacherId, state };
