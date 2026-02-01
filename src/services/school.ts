import { prisma } from "@/lib/prisma";

export class SchoolService {
    static async getDetails() {
        return { name: "Mount Litera Zee School" };
    }

    static async getAllClassrooms() {
        // Mock implementation - returns classrooms with sections
        // In production, this would query the database
        const classrooms = await prisma.classroom?.findMany?.({
            include: {
                sections: {
                    include: {
                        _count: {
                            select: { students: true }
                        }
                    }
                }
            }
        }) || [];

        return classrooms;
    }

    static async getSectionStudentCount(sectionId: string): Promise<number> {
        // Mock implementation - returns current student count for a section
        const count = await prisma.studentProfile?.count?.({
            where: { sectionId }
        }) || 0;

        return count;
    }
}
