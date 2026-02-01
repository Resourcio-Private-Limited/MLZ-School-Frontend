// Simplified mock for build purposes
export const prisma: any = {
    studentProfile: {
        findMany: async () => [],
        count: async () => 0,
        create: async (data: any) => ({ id: 'mock-id', ...data.data })
    },
    teacherProfile: {
        findMany: async () => [],
    },
    user: {
        create: async (data: any) => ({ id: 'mock-user-id', ...data.data })
    },
    classroom: {
        findMany: async () => [],
        findUnique: async () => null
    },
    section: {
        findMany: async () => []
    },
    // Add other mocks as needed or let 'any' handle it if TS allows
};
