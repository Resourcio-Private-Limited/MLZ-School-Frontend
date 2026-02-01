import { prisma } from "@/lib/prisma";

export class AdmissionService {
    /**
     * Generate admission number in format: MLZS/YYYY/XXXX
     * Example: MLZS/2026/0001
     */
    static async generateAdmissionNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();

        // Get the count of students admitted this year
        const count = await prisma.studentProfile?.count?.({
            where: {
                admissionYear: currentYear
            }
        }) || 0;

        // Increment and pad with zeros
        const sequentialNumber = (count + 1).toString().padStart(4, '0');

        return `MLZS/${currentYear}/${sequentialNumber}`;
    }

    /**
     * Calculate expected passing year based on class level
     * @param className - e.g., "Class 1", "Nursery", "Class 12"
     * @returns Expected passing year
     */
    static calculatePassingYear(className: string): number {
        const currentYear = new Date().getFullYear();

        // Extract class number from className
        const classMatch = className.match(/Class (\d+)/i);
        if (classMatch) {
            const classNumber = parseInt(classMatch[1]);
            // Class 12 is the final year, so calculate years remaining
            const yearsRemaining = 12 - classNumber;
            return currentYear + yearsRemaining;
        }

        // Handle pre-primary classes
        if (className.toLowerCase().includes('nursery')) {
            return currentYear + 13; // Nursery + 13 years to Class 12
        }
        if (className.toLowerCase().includes('junior kg') || className.toLowerCase().includes('lkg')) {
            return currentYear + 12; // Junior KG + 12 years to Class 12
        }
        if (className.toLowerCase().includes('upper kg') || className.toLowerCase().includes('ukg')) {
            return currentYear + 11; // Upper KG + 11 years to Class 12
        }

        // Default: assume current year + 1 if unable to determine
        return currentYear + 1;
    }

    /**
     * Get current admission date and year
     */
    static getCurrentAdmissionInfo() {
        const now = new Date();
        return {
            admissionDate: now,
            admissionYear: now.getFullYear(),
            academicYear: this.getAcademicYear(now)
        };
    }

    /**
     * Get academic year string (e.g., "2025-2026")
     * Academic year typically starts in April
     */
    static getAcademicYear(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-indexed

        // If before April (month < 3), academic year is previous year to current
        // If April or after (month >= 3), academic year is current to next year
        if (month < 3) {
            return `${year - 1}-${year}`;
        } else {
            return `${year}-${year + 1}`;
        }
    }
}
