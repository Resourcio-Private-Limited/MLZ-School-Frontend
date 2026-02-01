import { prisma } from "@/lib/prisma";

export class PromotionService {
    /**
     * Get next classroom for promotion
     * @param currentClassName - e.g., "Class 5", "Class 11"
     * @returns Next class name or null if Class 12 (graduation)
     */
    static getNextClass(currentClassName: string): string | null {
        const classMatch = currentClassName.match(/Class (\d+)/i);
        if (!classMatch) return null;

        const classNumber = parseInt(classMatch[1]);

        // Class 12 students graduate, no next class
        if (classNumber >= 12) {
            return null;
        }

        // Return next class
        return `Class ${classNumber + 1}`;
    }

    /**
     * Get classroom ID by class name
     * In production, this would query the database
     */
    static getClassroomIdByName(className: string): string | null {
        const classMatch = className.match(/Class (\d+)/i);
        if (!classMatch) return null;
        return classMatch[1];
    }

    /**
     * Check if a student is eligible for promotion
     * @param student - Student with exam results
     * @returns true if student passed final exam
     */
    static isEligibleForPromotion(student: any): boolean {
        // Check if student has exam results
        if (!student.examResults || student.examResults.length === 0) {
            return false;
        }

        // Find final exam result
        const finalExam = student.examResults.find((exam: any) =>
            exam.examName.toLowerCase().includes('final')
        );

        if (!finalExam) {
            // If no final exam, check overall exam status
            return student.examStatus === 'PASS';
        }

        // Student must pass final exam
        return finalExam.status === 'PASS';
    }

    /**
     * Check if higher classes have been promoted first
     * @param currentClassNumber - e.g., 5 for Class 5
     * @returns Error message if validation fails, null if ok
     */
    static async validatePromotionOrder(currentClassNumber: number): Promise<string | null> {
        // Class 12 can always be promoted (graduated)
        if (currentClassNumber >= 12) {
            return null;
        }

        // Check if higher classes still have students
        for (let i = 12; i > currentClassNumber; i--) {
            const classroomId = i.toString();
            const studentCount = await prisma.studentProfile?.count?.({
                where: {
                    classroomId: classroomId,
                    // Only count students who haven't been promoted yet
                    // In production, you'd have a 'promoted' or 'status' field
                }
            }) || 0;

            if (studentCount > 0) {
                return `Please promote Class ${i} students first before promoting Class ${currentClassNumber} students.`;
            }
        }

        return null;
    }

    /**
     * Get promotion summary for a classroom
     */
    static getPromotionSummary(students: any[]) {
        const eligible = students.filter(s => this.isEligibleForPromotion(s));
        const notEligible = students.filter(s => !this.isEligibleForPromotion(s));

        return {
            total: students.length,
            eligible: eligible.length,
            notEligible: notEligible.length,
            eligibleStudents: eligible,
            notEligibleStudents: notEligible,
        };
    }

    /**
     * Check if promotion is graduation (Class 12)
     */
    static isGraduation(className: string): boolean {
        const classMatch = className.match(/Class (\d+)/i);
        if (!classMatch) return false;
        return parseInt(classMatch[1]) >= 12;
    }
}
