"use server";

import { prisma } from "@/lib/prisma";
import { SchoolService } from "@/services/school";
import { revalidatePath } from "next/cache";

const MAX_STUDENTS_PER_SECTION = 100;

export const createStudentAction = async (data: any) => {
    try {
        // Validate section capacity
        const currentCount = await SchoolService.getSectionStudentCount(data.sectionId);

        if (currentCount >= MAX_STUDENTS_PER_SECTION) {
            return {
                success: false,
                error: `Section is full. Maximum ${MAX_STUDENTS_PER_SECTION} students allowed per section.`
            };
        }

        // Generate email if not provided
        const email = data.email || `${data.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.mlzs.edu.in`;

        // Create user account
        const user = await prisma.user?.create?.({
            data: {
                email,
                name: data.name,
                role: "STUDENT",
                password: "defaultPassword123" // Should be hashed in production
            }
        });

        if (!user) {
            return { success: false, error: "Failed to create user account" };
        }

        // Create student profile
        const student = await prisma.studentProfile?.create?.({
            data: {
                userId: user.id,
                admissionNo: data.admissionNo,
                admissionYear: data.joiningDate.getFullYear(),
                joiningDate: data.joiningDate,
                dob: data.dob,
                gender: data.gender,
                fatherName: data.fatherName,
                motherName: data.motherName,
                parentContact: data.parentContact,
                address: data.address,
                nationality: data.nationality,
                classroomId: data.classroomId,
                sectionId: data.sectionId,
            }
        });

        if (!student) {
            return { success: false, error: "Failed to create student profile" };
        }

        revalidatePath("/principal/students");
        return { success: true, error: undefined };
    } catch (error: any) {
        console.error("Error creating student:", error);
        return { success: false, error: error.message || "Failed to create student" };
    }
};

export const createStudentInClassroomAction = async (data: any) => {
    try {
        // Validate section capacity
        const currentCount = await SchoolService.getSectionStudentCount(data.sectionId);

        if (currentCount >= MAX_STUDENTS_PER_SECTION) {
            return {
                success: false,
                error: `Section is full. Maximum ${MAX_STUDENTS_PER_SECTION} students allowed per section.`
            };
        }

        // Generate email if not provided
        const email = data.email || `${data.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.mlzs.edu.in`;

        // Create user account
        const user = await prisma.user?.create?.({
            data: {
                email,
                name: data.name,
                role: "STUDENT",
                password: "defaultPassword123" // Should be hashed in production
            }
        });

        if (!user) {
            return { success: false, error: "Failed to create user account" };
        }

        // Create student profile with all fields
        const student = await prisma.studentProfile?.create?.({
            data: {
                userId: user.id,
                admissionNo: data.admissionNo,
                admissionYear: data.admissionYear,
                joiningDate: data.joiningDate,
                passingYear: data.passingYear,
                dob: data.dob,
                gender: data.gender,
                bloodGroup: data.bloodGroup,
                religion: data.religion,
                category: data.category,
                nationality: data.nationality,
                fatherName: data.fatherName,
                motherName: data.motherName,
                parentContact: data.parentContact,
                emergencyContact: data.emergencyContact,
                guardianName: data.guardianName,
                guardianContact: data.guardianContact,
                guardianRelation: data.guardianRelation,
                address: data.address,
                previousSchool: data.previousSchool,
                classroomId: data.classroomId,
                sectionId: data.sectionId,
            }
        });

        if (!student) {
            return { success: false, error: "Failed to create student profile" };
        }

        revalidatePath(`/principal/classroom/${data.classroomId}`);
        revalidatePath("/principal/students");
        return { success: true, error: undefined };
    } catch (error: any) {
        console.error("Error creating student:", error);
        return { success: false, error: error.message || "Failed to create student" };
    }
};

export const createTeacherAction = async (data: any) => {
    return { success: true, error: undefined };
};
