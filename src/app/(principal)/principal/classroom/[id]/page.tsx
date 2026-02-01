import { prisma } from "@/lib/prisma";
import ClassroomStudentsClient from "./ClassroomStudentsClient";

// Mock student data generator
function generateMockStudents(classroomId: string, classroomName: string, sectionId: string, sectionName: string, count: number) {
    const firstNames = ["Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Ananya", "Diya", "Isha", "Priya", "Riya", "Kavya", "Saanvi", "Aryan", "Rohan", "Karan", "Neha", "Pooja", "Shreya", "Tanvi", "Vihaan"];
    const lastNames = ["Sharma", "Patel", "Kumar", "Singh", "Reddy", "Nair", "Gupta", "Verma", "Iyer", "Joshi", "Mehta", "Rao", "Desai", "Agarwal", "Chopra"];
    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist"];
    const categories = ["General", "OBC", "SC", "ST"];

    const students = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const admissionNo = `MLZS/${currentYear}/${String(i + 1).padStart(4, '0')}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.mlzs.edu.in`;

        // Random but realistic data
        const attendancePercentage = 60 + Math.random() * 40; // 60-100%
        const averageMarks = 40 + Math.random() * 60; // 40-100
        const totalDays = 180;
        const totalPresent = Math.floor((attendancePercentage / 100) * totalDays);
        const totalAbsent = totalDays - totalPresent;

        const feeStatuses: Array<'CLEARED' | 'PENDING' | 'OVERDUE'> = ['CLEARED', 'PENDING', 'OVERDUE'];
        const feeStatus = feeStatuses[Math.floor(Math.random() * feeStatuses.length)];

        const examStatus: 'PASS' | 'FAIL' = averageMarks >= 40 ? 'PASS' : 'FAIL';

        const totalFees = 50000;
        const paidFees = feeStatus === 'CLEARED' ? totalFees : Math.floor(Math.random() * totalFees);
        const pendingFees = totalFees - paidFees;

        students.push({
            id: `student-${classroomId}-${sectionId}-${i}`,
            admissionNo,
            user: {
                id: `user-${i}`,
                name: fullName,
                email,
            },
            section: {
                id: sectionId,
                name: sectionName,
            },
            parentContact: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
            dob: new Date(2010 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: Math.random() > 0.5 ? "MALE" : "FEMALE",
            bloodGroup: bloodGroups[Math.floor(Math.random() * bloodGroups.length)],
            religion: religions[Math.floor(Math.random() * religions.length)],
            category: categories[Math.floor(Math.random() * categories.length)],
            nationality: "Indian",
            fatherName: `Mr. ${lastName}`,
            motherName: `Mrs. ${lastName}`,
            emergencyContact: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
            guardianName: Math.random() > 0.8 ? `Guardian ${lastName}` : null,
            guardianContact: Math.random() > 0.8 ? `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}` : null,
            address: `${Math.floor(Math.random() * 999) + 1}, ${["MG Road", "Park Street", "Gandhi Nagar", "Nehru Place", "Rajpath"][Math.floor(Math.random() * 5)]}, Mumbai, Maharashtra - 400001`,
            previousSchool: Math.random() > 0.5 ? ["St. Mary's School", "Delhi Public School", "Kendriya Vidyalaya", "DAV Public School"][Math.floor(Math.random() * 4)] : null,
            admissionYear: currentYear,
            passingYear: currentYear + (12 - parseInt(classroomName.match(/\d+/)?.[0] || "1")),
            academicYear: `${currentYear}-${currentYear + 1}`,
            attendancePercentage,
            totalPresent,
            totalAbsent,
            totalDays,
            averageMarks,
            highestMarks: Math.min(100, averageMarks + Math.random() * 20),
            lowestMarks: Math.max(0, averageMarks - Math.random() * 30),
            examStatus,
            examResults: [
                {
                    examName: "Mid-Term Exam",
                    marks: Math.floor(averageMarks - 10 + Math.random() * 20),
                    maxMarks: 100,
                    grade: averageMarks >= 90 ? "A+" : averageMarks >= 80 ? "A" : averageMarks >= 70 ? "B+" : averageMarks >= 60 ? "B" : averageMarks >= 50 ? "C" : averageMarks >= 40 ? "D" : "F",
                    status: averageMarks >= 40 ? "PASS" as const : "FAIL" as const,
                },
                {
                    examName: "Final Exam",
                    marks: Math.floor(averageMarks - 5 + Math.random() * 15),
                    maxMarks: 100,
                    grade: averageMarks >= 90 ? "A+" : averageMarks >= 80 ? "A" : averageMarks >= 70 ? "B+" : averageMarks >= 60 ? "B" : averageMarks >= 50 ? "C" : averageMarks >= 40 ? "D" : "F",
                    status: averageMarks >= 40 ? "PASS" as const : "FAIL" as const,
                },
            ],
            feeStatus,
            totalFees,
            paidFees,
            pendingFees,
            lastPaymentDate: new Date(currentYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        });
    }

    return students;
}

export default async function ClassroomDetailPage({ params }: { params: { id: string } }) {
    const classroomId = params.id;

    // Mock classroom data based on ID
    const classroomMap: Record<string, any> = {
        "1": { name: "Class 1", level: "Primary", classTeacher: "Ms. Priya Sharma" },
        "2": { name: "Class 2", level: "Primary", classTeacher: "Mr. Rajesh Kumar" },
        "3": { name: "Class 3", level: "Primary", classTeacher: "Ms. Anjali Verma" },
        "4": { name: "Class 4", level: "Primary", classTeacher: "Mr. Suresh Patel" },
        "5": { name: "Class 5", level: "Primary", classTeacher: "Ms. Kavita Reddy" },
        "6": { name: "Class 6", level: "Middle School", classTeacher: "Mr. Arun Nair" },
        "7": { name: "Class 7", level: "Middle School", classTeacher: "Ms. Deepa Iyer" },
        "8": { name: "Class 8", level: "Middle School", classTeacher: "Mr. Vikram Joshi" },
        "9": { name: "Class 9", level: "High School", classTeacher: "Ms. Sunita Mehta" },
        "10": { name: "Class 10", level: "High School", classTeacher: "Mr. Ramesh Rao" },
        "11": { name: "Class 11", level: "Senior Secondary", classTeacher: "Ms. Lakshmi Desai" },
        "12": { name: "Class 12", level: "Senior Secondary", classTeacher: "Mr. Karthik Agarwal" },
    };

    const classroomData = classroomMap[classroomId] || { name: "Class 1", level: "Primary", classTeacher: "Ms. Priya Sharma" };

    const classroom = {
        id: classroomId,
        name: classroomData.name,
        level: classroomData.level,
        classTeacher: classroomData.classTeacher,
        capacity: 100
    };

    // Mock sections with varying student counts
    const sections = [
        { id: `${classroomId}-a`, name: "Section A", _count: { students: 45 } },
        { id: `${classroomId}-b`, name: "Section B", _count: { students: 38 } },
        { id: `${classroomId}-c`, name: "Section C", _count: { students: 42 } },
    ];

    // Generate mock students for all sections
    const allStudents = [
        ...generateMockStudents(classroomId, classroom.name, sections[0].id, sections[0].name, 45),
        ...generateMockStudents(classroomId, classroom.name, sections[1].id, sections[1].name, 38),
        ...generateMockStudents(classroomId, classroom.name, sections[2].id, sections[2].name, 42),
    ];

    return (
        <ClassroomStudentsClient
            classroom={classroom}
            students={allStudents}
            sections={sections}
        />
    );
}
