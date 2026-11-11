// Mock API for visual checks of the Student portal. No real backend or credentials involved.
const now = new Date();
const iso = (d) => d.toISOString();
const day = (offset, hour = 10, minute = 0) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);
const year = now.getFullYear();
const month = now.getMonth() + 1;

const me = "u-stu-1";
const classroomId = "cls-7b";

const profile = {
    personal: {
        fullName: "Ananya Ghosh", dob: "2013-06-14", gender: "FEMALE", nationality: "Indian", caste: "General", aadharNo: "4521 8890 1123", email: "ananya.ghosh@mlzs.in",
        isPwd: false, primaryContact: "98300 12345", secondaryContact: "98300 54321", identificationMark: "Mole on the left cheek", residentialAddress: "21 Barrackpore Trunk Road, Kolkata 700123", profileImage: null,
    },
    academic: { admissionNumber: "MLZS/2019/0412", admissionYear: 2019, admissionDate: "2019-04-03", rollNumber: "7B-14", classRoll: 14, passingYear: null, transportOpted: true, parentName: "Subrata Ghosh", parentContact: "98300 67890" },
    currentClass: { id: classroomId, name: "Class 7 - Section B", grade: "Class 7", section: "B" },
    userEmail: "ananya.ghosh@mlzs.in",
    marksByClass: {
        [`Class 7 - Section B (${year})`]: ["English", "Mathematics", "Science", "Bengali", "History"].map((s, i) => ({ id: `m7${i}`, score: [86, 92, 78, 88, 81][i], examId: `e${i}`, studentId: "s1", exam: { id: `e${i}`, name: "Half-yearly", examDate: iso(day(-60)), submissionOpen: true, subject: { name: s }, classroom: { name: "Class 7", grade: "7" } } })),
        [`Class 6 - Section B (${year - 1})`]: ["English", "Mathematics", "Science", "Bengali"].map((s, i) => ({ id: `m6${i}`, score: [82, 95, 74, 90][i], examId: `f${i}`, studentId: "s1", exam: { id: `f${i}`, name: "Final", examDate: iso(day(-300)), submissionOpen: true, subject: { name: s }, classroom: { name: "Class 6", grade: "6" } } })),
    },
};

const dashboard = {
    classroom: { id: classroomId, name: "Class 7 - Section B", classTeacher: "Rituparna Sen", studentCount: 34, subjectCount: 7, noticeCount: 6 },
    upcomingOnlineClasses: [
        { id: "oc1", topic: "Fractions and decimals revision", meetingLink: "https://meet.example.com/abc", date: iso(day(1, 16)) },
        { id: "oc2", topic: "Photosynthesis, doubt clearing", meetingLink: "https://meet.example.com/def", date: iso(day(3, 17)) },
        { id: "oc3", topic: "English grammar: tenses", meetingLink: "https://meet.example.com/ghi", date: iso(day(6, 15, 30)) },
    ],
    latestExams: [
        { id: "x1", name: "Unit test 3", examDate: iso(day(9)) },
        { id: "x2", name: "Half-yearly", examDate: iso(day(-60)) },
    ],
};

const subjects = ["English", "Mathematics", "Science", "Bengali", "History", "Geography", "Computer"];
const exams = [
    ...subjects.map((s, i) => ({ id: `up${i}`, name: "Unit test 3", examDate: iso(day(9 + i)), submissionOpen: i !== 5, subject: s, admitCard: i < 3 ? { fileUrl: "/admit/Admit Card-Half Year.svg", issuedAt: iso(day(-1)) } : null, result: null })),
    ...subjects.map((s, i) => ({ id: `hy${i}`, name: "Half-yearly", examDate: iso(day(-60 + i)), submissionOpen: true, subject: s, admitCard: { fileUrl: "/admit/Admit Card-Half Year.svg", issuedAt: iso(day(-70)) }, result: i < 5 ? { fileUrl: "/admit/Admit Card-Half Year.svg", publishedAt: iso(day(-40)) } : null })),
];

const admitCards = [
    { id: "ac1", issuedAt: iso(day(-1)), fileUrl: "/admit/Admit Card-Half Year.svg", svgUrl: "/admit/Admit Card-Half Year.svg", examName: "Unit test 3", examDate: iso(day(9)) },
    { id: "ac2", issuedAt: iso(day(-70)), fileUrl: "/admit/Admit Card-Final Exam.svg", svgUrl: "/admit/Admit Card-Final Exam.svg", examName: "Half-yearly", examDate: iso(day(-60)) },
];

const fees = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const paid = m < month - 1;
    const tuition = 3200, transport = 900, other = m === 4 ? 1500 : 0, penalty = m === month - 1 ? 150 : 0;
    const total = tuition + transport + other + penalty;
    return {
        id: `f${m}`, month: m, year, tuitionFees: tuition, annualCharges: 0, annualContributionRequired: 0, transportFees: transport, otherFees: other, penalty, discount: 0,
        totalAmount: total, isPaid: paid, paidAmount: paid ? total : 0, paidAt: paid ? iso(new Date(year, m - 1, 8)) : null, receiptUrl: null, paymentId: paid ? `pay${m}` : null,
    };
});
const monthlyFees = { year, annualSummary: { total: 24000, paid: 12000, remaining: 12000, expiryDate: iso(new Date(year, 11, 31)), isOverdue: false, isConfigured: true }, fees };

const receipt = (id) => ({
    receiptNumber: `MLZS-R-${id.toUpperCase()}`, paidAt: iso(day(-20)),
    student: { admissionNumber: profile.academic.admissionNumber, fullName: profile.personal.fullName, parentName: profile.academic.parentName, className: "Class 7", section: "B" },
    academicSession: `${year - 1}-${year}`, feesForPeriod: "Monthly fees",
    fees: { application: 0, admission: 0, security: 0, annual: 0, tuition: 3200, transport: 900, stationery: 0, miscellaneous: 0 }, total: 4100, paymentMode: "Online",
});

const recipients = [
    { id: "u-t1", name: "Rituparna Sen", role: "Class Teacher" },
    { id: "u-t2", name: "Arnab Chatterjee", role: "TEACHER" },
    { id: "u-t3", name: "Payel Mitra", role: "TEACHER" },
    { id: "u-t4", name: "Sourav Basu", role: "TEACHER" },
    { id: "u-t5", name: "Debjani Roy", role: "TEACHER" },
    { id: "u-p1", name: "Dr. Sunita Mukherjee", role: "PRINCIPAL" },
    { id: "u-acc1", name: "Priyanka Sen", role: "ACCOUNTANT" },
    { id: "u-sa1", name: "Vikram Seth", role: "SUPER_ADMIN" },
];
const teachers = [
    { id: "t1", fullName: "Rituparna Sen", primaryContact: null, designation: "English", isClassTeacher: true },
    { id: "t2", fullName: "Arnab Chatterjee", primaryContact: null, designation: "Mathematics", isClassTeacher: false },
    { id: "t3", fullName: "Payel Mitra", primaryContact: null, designation: "Science", isClassTeacher: false },
    { id: "t4", fullName: "Sourav Basu", primaryContact: null, designation: "History", isClassTeacher: false },
    { id: "t5", fullName: "Debjani Roy", primaryContact: null, designation: "Bengali", isClassTeacher: false },
];

const annTopics = [
    ["Science project groups", "Groups for the science fair are posted on the class board. Meet your group leader by Friday.", "Payel Mitra"],
    ["Maths homework, chapter 6", "Complete exercises 6.2 and 6.3. We will check them on Monday.", "Arnab Chatterjee"],
    ["Library books due", "Return library books issued last month by Wednesday.", "Rituparna Sen"],
    ["History map work", "Bring a blank political map of India for Thursday's class.", "Sourav Basu"],
    ["Bengali recitation", "Pick one poem from the list for the recitation round next week.", "Debjani Roy"],
];
const announcements = Array.from({ length: 14 }, (_, i) => {
    const [title, content, teacher] = annTopics[i % annTopics.length];
    return { id: `a${i}`, title, content, fileUrl: i % 4 === 0 ? "https://mlzs.in/files/worksheet.pdf" : null, createdAt: iso(day(-Math.floor(i * 1.5), 9 + (i % 5))), teacherId: `t${(i % 5) + 1}`, classroomId, teacher: { fullName: teacher } };
});

const noticeTopics = [
    ["Winter vacation schedule", "School remains closed from 25 December to 1 January. Classes resume on 2 January.", "HOLIDAYS"],
    ["Half-yearly exam timetable", "The timetable for the half-yearly examinations is attached. Students must report by 8:30 am.", "EXAMS"],
    ["Annual sports meet", "The annual sports meet will be held on the main ground. Parents are welcome.", "EVENTS"],
    ["Fee payment reminder", "Please clear pending fees for the second quarter by the 15th.", "GENERAL"],
    ["Water supply disruption", "Drinking water will be supplied from tankers on Friday due to maintenance work.", "EMERGENCY"],
    ["Science exhibition", "Entries for the inter-house science exhibition close next week.", "EVENTS"],
];
const notices = Array.from({ length: 13 }, (_, i) => {
    const [title, content, tag] = noticeTopics[i % noticeTopics.length];
    return { id: `n${i}`, title, content, senderName: "Vikram Seth", link: i === 1 ? "https://mlzs.in/exams" : null, file: i === 2 ? "https://mlzs.in/files/sports-meet-schedule.pdf" : null, tag, createdAt: iso(day(-i * 2, 11)) };
});

const conversations = [
    { otherUserId: "u-t1", otherUserRole: "TEACHER", lastMessage: "Yes, you can submit the project on Monday.", lastMessageAt: iso(day(0, 9)), direction: "received" },
    { otherUserId: "u-acc1", otherUserRole: "ACCOUNTANT", lastMessage: "Your October fee receipt has been issued.", lastMessageAt: iso(day(-4)), direction: "received" },
];
const thread = (other) => [
    { id: "m1", createdAt: iso(day(-1, 18)), content: "Good evening ma'am. I was unwell today. Can I submit the science project on Monday?", senderId: me, receiverId: other },
    { id: "m2", createdAt: iso(day(0, 9)), content: "Yes, you can submit the project on Monday. Get well soon.", senderId: other, receiverId: me },
].map((m) => ({ ...m, sender: { id: m.senderId, email: "", role: "" }, receiver: { id: m.receiverId, email: "", role: "" } }));

function respond(url) {
    const u = new URL(url);
    const p = u.pathname;
    if (p === "/student/profile") return profile;
    if (p === "/student/dashboard") return dashboard;
    if (p === "/student/exams") return exams;
    if (p === "/student/admit-cards") return admitCards;
    if (p === "/student/message-recipients") return recipients;
    if (p === "/student/fees/monthly") return monthlyFees;
    if (p.startsWith("/student/payments/")) return receipt(p.split("/")[3]);
    if (p === "/operations/notices") return notices;
    if (p === `/operations/announcements/${classroomId}`) return announcements;
    if (p === `/operations/classroom/${classroomId}/teachers`) return teachers;
    if (p === "/operations/conversations") return conversations;
    if (p === "/operations/conversation") return thread(u.searchParams.get("otherUserId"));
    return [];
}

module.exports = { respond, me };
