// Simplified mock for build purposes
export const prisma: any = {
    studentProfile: { findMany: async () => [] },
    teacherProfile: { findMany: async () => [] },
    // Add other mocks as needed or let 'any' handle it if TS allows
};
