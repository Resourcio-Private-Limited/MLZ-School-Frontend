"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, BookOpen, User as UserIcon, Filter, X, Search, UserCheck } from "lucide-react";
import { useGetClassroomStudentsQuery, useGetClassroomQuery, useAddStudentMutation } from "@/redux/api/principalApi";
import { useGetStudentDetailQuery } from "@/redux/api/accountsApi";
import ClassroomAdmissionForm from "./ClassroomAdmissionForm";
import StudentDetailModal from "./StudentDetailModal";
import PromotionModal from "./PromotionModal";

type Student = {
    id: string;
    admissionNo: string;
    fullName: string;
    email: string;
    password: string;
    isActive: boolean;
    dob: Date;
    gender: string;
    residentialAddress: string;
    primaryContact: string;
    parentName?: string;
    parentContact?: string;
    attendancePercentage?: number;
    averageMarks?: number;
    feeStatus?: 'CLEARED' | 'PENDING' | 'OVERDUE';
};

type Classroom = {
    id: string;
    name: string;
    grade: string;
    section: string;
    capacity: number;
    total: number;
    classTeacher: { id: string; fullName: string; employeeId: string } | null;
    level?: string;
};

type FilterState = {
    search: string;
    minMarks: string;
    maxMarks: string;
    examStatus: 'all' | 'PASS' | 'FAIL';
    minAttendance: string;
    maxAttendance: string;
    feeStatus: 'all' | 'CLEARED' | 'PENDING' | 'OVERDUE';
};

export default function ClassroomStudentsClient({ classroom, classroomId }: { classroom: Classroom; classroomId: string }) {
    const [showAdmissionForm, setShowAdmissionForm] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        minMarks: '',
        maxMarks: '',
        examStatus: 'all',
        minAttendance: '',
        maxAttendance: '',
        feeStatus: 'all',
    });

    const { data: classroomData } = useGetClassroomQuery(classroomId);
    const { data: students = [], isLoading, refetch } = useGetClassroomStudentsQuery(classroomId);
    const { data: selectedStudentDetail } = useGetStudentDetailQuery(selectedStudentId!, { skip: !selectedStudentId });

    const activeClassroom = classroomData ?? classroom;
    const totalStudents = students.length;
    const capacityPercentage = (totalStudents / activeClassroom.capacity) * 100;

    const getCapacityColor = () => {
        if (capacityPercentage >= 95) return "text-red-600 bg-red-50 border-red-200";
        if (capacityPercentage >= 80) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-green-600 bg-green-50 border-green-200";
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch =
                    student.fullName.toLowerCase().includes(searchLower) ||
                    student.admissionNo.toLowerCase().includes(searchLower) ||
                    student.email.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            if (filters.minMarks && student.averageMarks !== undefined) {
                if (student.averageMarks < parseFloat(filters.minMarks)) return false;
            }
            if (filters.maxMarks && student.averageMarks !== undefined) {
                if (student.averageMarks > parseFloat(filters.maxMarks)) return false;
            }

            if (filters.examStatus !== 'all') {
                // exam status not available from this endpoint yet
            }

            if (filters.minAttendance && student.attendancePercentage !== undefined) {
                if (student.attendancePercentage < parseFloat(filters.minAttendance)) return false;
            }
            if (filters.maxAttendance && student.attendancePercentage !== undefined) {
                if (student.attendancePercentage > parseFloat(filters.maxAttendance)) return false;
            }

            if (filters.feeStatus !== 'all' && student.feeStatus) {
                if (student.feeStatus !== filters.feeStatus) return false;
            }

            return true;
        });
    }, [students, filters]);

    const clearFilters = () => {
        setFilters({
            search: '',
            minMarks: '',
            maxMarks: '',
            examStatus: 'all',
            minAttendance: '',
            maxAttendance: '',
            feeStatus: 'all',
        });
    };

    const hasActiveFilters =
        filters.search ||
        filters.minMarks ||
        filters.maxMarks ||
        filters.examStatus !== 'all' ||
        filters.minAttendance ||
        filters.maxAttendance ||
        filters.feeStatus !== 'all';

    const handleStudentAdded = () => {
        setShowAdmissionForm(false);
        refetch();
    };

    const handleStudentUpdated = () => {
        refetch();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/principal">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-purple-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back to Classrooms</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{activeClassroom.name}</h1>
                        <p className="text-gray-500 mt-1">
                            Grade {activeClassroom.grade} &bull; Section {activeClassroom.section}
                            {activeClassroom.classTeacher && ` &bull; Class Teacher: ${activeClassroom.classTeacher.fullName}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowPromotionModal(true)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
                    >
                        <UserCheck size={20} />
                        <span>Promote Students</span>
                    </button>
                    <button
                        onClick={() => setShowAdmissionForm(true)}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-md hover:shadow-lg"
                    >
                        <Plus size={20} />
                        <span>Admit Student</span>
                    </button>
                </div>
            </div>

            {/* Capacity Indicator */}
            <div className={`p-4 rounded-lg border ${getCapacityColor()}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users size={24} />
                        <div>
                            <p className="font-semibold">Classroom Capacity</p>
                            <p className="text-sm opacity-80">
                                {totalStudents} / {activeClassroom.capacity} students ({capacityPercentage.toFixed(1)}%)
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{activeClassroom.capacity - totalStudents}</p>
                        <p className="text-sm opacity-80">seats available</p>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Search size={20} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, admission no, or email..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="border-none outline-none text-gray-700 placeholder-gray-400 w-96"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-sm text-gray-600 hover:text-purple-600 font-medium flex items-center space-x-1"
                            >
                                <X size={16} />
                                <span>Clear Filters</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition ${showFilters ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Filter size={18} />
                            <span>Filters</span>
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Marks</label>
                                <input
                                    type="number"
                                    value={filters.minMarks}
                                    onChange={(e) => setFilters({ ...filters, minMarks: e.target.value })}
                                    placeholder="0"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Marks</label>
                                <input
                                    type="number"
                                    value={filters.maxMarks}
                                    onChange={(e) => setFilters({ ...filters, maxMarks: e.target.value })}
                                    placeholder="100"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Fee Status</label>
                                <select
                                    value={filters.feeStatus}
                                    onChange={(e) => setFilters({ ...filters, feeStatus: e.target.value as any })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="CLEARED">Cleared</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="OVERDUE">Overdue</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Min Attendance %</label>
                                <input
                                    type="number"
                                    value={filters.minAttendance}
                                    onChange={(e) => setFilters({ ...filters, minAttendance: e.target.value })}
                                    placeholder="0"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Max Attendance %</label>
                                <input
                                    type="number"
                                    value={filters.maxAttendance}
                                    onChange={(e) => setFilters({ ...filters, maxAttendance: e.target.value })}
                                    placeholder="100"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                            <BookOpen size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Students List</h2>
                    </div>
                    <div className="text-sm text-gray-500">
                        {isLoading ? (
                            <span className="italic">Loading...</span>
                        ) : (
                            <>Showing: <span className="font-semibold text-gray-800">{filteredStudents.length}</span> of <span className="font-semibold text-gray-800">{totalStudents}</span> students</>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                <th className="p-4 font-semibold text-gray-600">Password</th>
                                <th className="p-4 font-semibold text-gray-600">Attendance</th>
                                <th className="p-4 font-semibold text-gray-600">Avg Marks</th>
                                <th className="p-4 font-semibold text-gray-600">Fee Status</th>
                                <th className="p-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                                                {student.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{student.fullName}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                                            {student.password || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {student.attendancePercentage !== undefined ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.attendancePercentage >= 75
                                                ? 'bg-green-100 text-green-700'
                                                : student.attendancePercentage >= 60
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {student.attendancePercentage.toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {student.averageMarks !== undefined ? (
                                            <span className="font-semibold text-gray-800">{student.averageMarks}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {student.feeStatus ? (
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.feeStatus === 'CLEARED'
                                                ? 'bg-green-100 text-green-700'
                                                : student.feeStatus === 'PENDING'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {student.feeStatus}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">N/A</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => setSelectedStudentId(student.id)}
                                            className="text-purple-600 text-sm hover:underline font-medium"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-3">
                                            <UserIcon size={48} className="text-gray-300" />
                                            <p className="font-medium">
                                                {hasActiveFilters ? 'No students match the filters' : 'No students admitted yet'}
                                            </p>
                                            {!hasActiveFilters && (
                                                <button
                                                    onClick={() => setShowAdmissionForm(true)}
                                                    className="text-purple-600 hover:underline text-sm font-medium"
                                                >
                                                    Admit your first student
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Admission Form Modal */}
            {showAdmissionForm && (
                <ClassroomAdmissionForm
                    classroom={activeClassroom}
                    classroomId={classroomId}
                    onClose={() => setShowAdmissionForm(false)}
                    onSuccess={handleStudentAdded}
                />
            )}

            {/* Student Detail Modal */}
            {selectedStudentId && (
                <StudentDetailModal
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                    onStudentUpdate={handleStudentUpdated}
                />
            )}

            {/* Promotion Modal */}
            {showPromotionModal && (
                <PromotionModal
                    classroom={activeClassroom}
                    students={students as any}
                    onClose={() => setShowPromotionModal(false)}
                    onSuccess={handleStudentUpdated}
                />
            )}
        </div>
    );
}