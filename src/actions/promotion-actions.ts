"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PromotionService } from "@/services/promotion";

export const promoteStudentsAction = async (data: {
    studentIds: string[];
    currentClassroomId: string;
    currentClassName: string;
}) => {
    try {
        const { studentIds, currentClassroomId, currentClassName } = data;

        // Get current class number for validation
        const classMatch = currentClassName.match(/Class (\d+)/i);
        if (!classMatch) {
            return { success: false, error: "Invalid classroom name" };
        }
        const currentClassNumber = parseInt(classMatch[1]);

        // Validate promotion order (senior classes first)
        const orderValidation = await PromotionService.validatePromotionOrder(currentClassNumber);
        if (orderValidation) {
            return { success: false, error: orderValidation };
        }

        // Check if this is graduation (Class 12)
        const isGraduation = PromotionService.isGraduation(currentClassName);
        const nextClassName = PromotionService.getNextClass(currentClassName);

        if (isGraduation) {
            // Graduate Class 12 students
            // Update student status to GRADUATED and revoke portal access
            for (const studentId of studentIds) {
                // In production, update student profile
                await prisma.studentProfile?.update?.({
                    where: { id: studentId },
                    data: {
                        status: 'GRADUATED',
                        classroomId: null,
                        sectionId: null,
                        graduationDate: new Date(),
                    }
                });

                // Revoke access by updating user role or adding restrictions
                const student = await prisma.studentProfile?.findUnique?.({
                    where: { id: studentId },
                    include: { user: true }
                });

                if (student?.user) {
                    await prisma.user?.update?.({
                        where: { id: student.user.id },
                        data: {
                            // Add a flag to restrict access
                            status: 'GRADUATED',
                            // In production, you might have specific access control fields
                        }
                    });
                }
            }

            revalidatePath(`/principal/classroom/${currentClassroomId}`);
            return {
                success: true,
                message: `Successfully graduated ${studentIds.length} student(s) from Class 12`,
                graduated: true
            };
        } else {
            // Promote to next class
            if (!nextClassName) {
                return { success: false, error: "Unable to determine next class" };
            }

            const nextClassroomId = PromotionService.getClassroomIdByName(nextClassName);
            if (!nextClassroomId) {
                return { success: false, error: "Next classroom not found" };
            }

            // Move students to next class (same section)
            for (const studentId of studentIds) {
                const student = await prisma.studentProfile?.findUnique?.({
                    where: { id: studentId },
                    include: { section: true }
                });

                if (student) {
                    // Determine next section ID (keep same section letter)
                    const sectionName = student.section?.name || "Section A";
                    const nextSectionId = `${nextClassroomId}-${sectionName.toLowerCase().replace('section ', '')}`;

                    await prisma.studentProfile?.update?.({
                        where: { id: studentId },
                        data: {
                            classroomId: nextClassroomId,
                            sectionId: nextSectionId,
                            // Update academic year if needed
                        }
                    });
                }
            }

            revalidatePath(`/principal/classroom/${currentClassroomId}`);
            revalidatePath(`/principal/classroom/${nextClassroomId}`);
            return {
                success: true,
                message: `Successfully promoted ${studentIds.length} student(s) to ${nextClassName}`,
                promoted: true
            };
        }
    } catch (error: any) {
        console.error("Error promoting students:", error);
        return { success: false, error: error.message || "Failed to promote students" };
    }
};
