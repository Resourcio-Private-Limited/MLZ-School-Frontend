
// Mock Data and Services for Frontend-Only Version

// --- Types (Simplified generic types for mocks) ---
export type User = {
    id: string;
    name: string;
    email: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PRINCIPAL' | 'SUPER_ADMIN';
    image?: string | null;
};

export type Student = {
    id: string;
    admissionNo: string;
    userId: string;
    user: User;
    classroomId?: string;
    classroom?: {
        name: string;
        section?: string;
    };
    rollNumber?: number;
    // ... other fields as needed by UI
};

// --- Mock Data Generators ---

const generateId = () => Math.random().toString(36).substr(2, 9);

export const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'John Doe', email: 'john@student.mlzs.edu.in', role: 'STUDENT' },
    { id: 'user-2', name: 'Jane Smith', email: 'jane@teacher.mlzs.edu.in', role: 'TEACHER' },
    { id: 'user-3', name: 'Principal Brown', email: 'principal@mlzs.edu.in', role: 'PRINCIPAL' },
];

export const MOCK_ATTENDANCE = Array.from({ length: 30 }).map((_, i) => ({
    id: `att-${i}`,
    date: new Date(Date.now() - i * 86400000),
    status: Math.random() > 0.1 ? 'PRESENT' : Math.random() > 0.5 ? 'ABSENT' : 'LATE',
    studentId: 'student-1',
}));

export const MOCK_EXAM_RESULTS = [
    {
        id: 'res-1',
        exam: {
            id: 'exam-1',
            name: 'Mid-Term Maths',
            date: new Date('2025-09-15'),
            totalMarks: 100,
            passingMarks: 40,
            subject: { name: 'Mathematics' }
        },
        marksObtained: 85,
        studentId: 'student-1'
    },
    {
        id: 'res-2',
        exam: {
            id: 'exam-2',
            name: 'Mid-Term Science',
            date: new Date('2025-09-18'),
            totalMarks: 100,
            passingMarks: 40,
            subject: { name: 'Science' }
        },
        marksObtained: 78,
        studentId: 'student-1'
    }
];

export const MOCK_FEE_STRUCTURES = [
    {
        id: 'fee-1',
        name: 'Tuition Fee (Q1)',
        amount: 15000,
        dueDate: new Date('2026-04-10'),
        description: 'Quarterly tuition fee',
        frequency: 'QUARTERLY'
    },
    {
        id: 'fee-2',
        name: 'Transport Fee (Q1)',
        amount: 5000,
        dueDate: new Date('2026-04-10'),
        description: 'Quarterly transport fee',
        frequency: 'QUARTERLY'
    },
];

export const MOCK_PAYMENTS = [
    {
        id: 'pay-1',
        amountPaid: 15000,
        paymentDate: new Date('2026-04-05'),
        status: 'COMPLETED',
        method: 'ONLINE',
        transactionId: 'txn_12345',
        feeStructure: { name: 'Tuition Fee (Q1)' }
    }
];

export const MOCK_TEACHERS = [
    {
        id: 'teacher-1',
        user: { name: 'Mr. Anderson', email: 'anderson@mlzs.edu.in' },
        subjectsTaught: [{ id: 'sub-1', name: 'Mathematics' }, { id: 'sub-2', name: 'Physics' }],
        classTeacherOf: { name: 'Class 10-A' },
        designation: 'Senior Teacher',
        joiningDate: new Date('2020-05-15')
    },
    {
        id: 'teacher-2',
        user: { name: 'Ms. Roberts', email: 'roberts@mlzs.edu.in' },
        subjectsTaught: [{ id: 'sub-3', name: 'English' }],
        classTeacherOf: null,
        designation: 'TGT English',
        joiningDate: new Date('2022-08-20')
    }
];

export const MOCK_CLASSES = [
    { id: 'class-1', name: 'Class 1', level: 'Primary', section: 'A', capacity: 40, _count: { students: 35 }, sections: [{ id: 'sec-1', name: 'A', _count: { students: 35 } }] },
    { id: 'class-2', name: 'Class 2', level: 'Primary', section: 'B', capacity: 40, _count: { students: 38 }, sections: [{ id: 'sec-2', name: 'A', _count: { students: 38 } }] },
];

export const MOCK_STUDENTS_LIST = Array.from({ length: 10 }).map((_, i) => ({
    id: `student-${i}`,
    admissionNo: `ADM-${2024000 + i}`,
    rollNumber: i + 1,
    user: {
        name: `Student Name ${i + 1}`,
        email: `student${i + 1}@mlzs.edu.in`,
        image: null,
    },
    section: { name: 'Section A' },
    classroomId: 'class-1',
    fees: { status: i % 3 === 0 ? 'OVERDUE' : 'CLEARED' },
    parentContact: `+91 98765 4321${i}`
}));


// --- Mock Services ---

export const MockSchoolService = {
    getStats: async () => ({
        totalStudents: 1250,
        totalTeachers: 75,
        totalStaff: 20,
        attendanceRate: 92.5
    }),
    getRecentActivities: async () => ([
        { id: 1, title: 'New Student Admitted', time: '2 hours ago' },
        { id: 2, title: 'Fees Updated', time: '5 hours ago' }
    ]),
    getAllClassrooms: async () => MOCK_CLASSES
};

export const MockAcademicYearService = {
    getActive: async () => ({
        id: 'ay-2025-26',
        name: '2025-2026',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2026-03-31'),
        isCurrent: true,
        status: 'ACTIVE'
    })
};

export const MockAdmissionService = {
    admitStudent: async (data: any) => {
        console.log("Mock Admit Student:", data);
        return { success: true, message: "Student admitted successfully (Mock)" };
    }
};

export const MockPromotionService = {
    promoteStudents: async (data: any) => {
        console.log("Mock Promote Students:", data);
        return { success: true, promotedCount: 10, graduatedCount: 0 };
    }
};


// --- Mock Actions ---

export async function mockAction(name: string, data?: any) {
    console.log(`[Mock Action] ${name} called with:`, data);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return { success: true, message: "Action completed successfully (Mock)" };
}

// Replaces getServerSession for generic usage
export async function getMockSession() {
    return {
        user: {
            id: 'mock-user-id',
            name: 'Mock User',
            email: 'mock@mlzs.edu.in',
            role: 'ADMIN', // Default role, can be overridden in UI logic if needed
            image: null
        }
    };
}
