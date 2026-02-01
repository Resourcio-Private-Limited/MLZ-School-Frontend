"use client";

import { Users, GraduationCap, UserCog, Shield, TrendingUp, Bell, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function SuperAdminDashboard() {
    // Mock statistics
    const stats = {
        totalStudents: 1847,
        totalTeachers: 57,
        totalStaff: 3, // Principal + Accountant + Super Admin
        activeNotices: 12,
        monthlyRevenue: 2740000,
        pendingAdmissions: 5
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Complete system administration and control</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Total Students */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-50">
                            <GraduationCap size={24} className="text-blue-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Total Students</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">{stats.totalStudents.toLocaleString()}</h2>
                    <p className="text-gray-500 text-xs mt-2">Across all classes</p>
                </div>

                {/* Total Teachers */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-50">
                            <UserCog size={24} className="text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Total Teachers</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">{stats.totalTeachers}</h2>
                    <p className="text-gray-500 text-xs mt-2">Active faculty members</p>
                </div>

                {/* Total Staff */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-50">
                            <Shield size={24} className="text-purple-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Administrative Staff</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">{stats.totalStaff}</h2>
                    <p className="text-gray-500 text-xs mt-2">Principal, Accountant, Admin</p>
                </div>

                {/* Active Notices */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-amber-50">
                            <Bell size={24} className="text-amber-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Active Notices</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">{stats.activeNotices}</h2>
                    <p className="text-gray-500 text-xs mt-2">Published announcements</p>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-rose-50">
                            <TrendingUp size={24} className="text-rose-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Monthly Revenue</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</h2>
                    <p className="text-gray-500 text-xs mt-2">Current month income</p>
                </div>

                {/* Pending Admissions */}
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-indigo-50">
                            <Users size={24} className="text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">Pending Admissions</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-800">{stats.pendingAdmissions}</h2>
                    <p className="text-gray-500 text-xs mt-2">Awaiting approval</p>
                </div>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/super-admin/users" className="block group">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-rose-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gray-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                    <Users size={24} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">User Management</h3>
                            <p className="text-rose-600 font-medium text-sm">Manage all users</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-center items-center">
                            <span className="text-rose-600 text-sm font-semibold">
                                Access →
                            </span>
                        </div>
                    </div>
                </Link>

                <Link href="/super-admin/noticeboard" className="block group">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-rose-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gray-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                    <Bell size={24} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Notice Board</h3>
                            <p className="text-rose-600 font-medium text-sm">Broadcast notices</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-center items-center">
                            <span className="text-rose-600 text-sm font-semibold">
                                Access →
                            </span>
                        </div>
                    </div>
                </Link>

                <Link href="/super-admin/financial" className="block group">
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-rose-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-gray-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                                    <BarChart3 size={24} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Financial Overview</h3>
                            <p className="text-rose-600 font-medium text-sm">View P&L reports</p>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-center items-center">
                            <span className="text-rose-600 text-sm font-semibold">
                                Access →
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="bg-white rounded-xl shadow-md overflow-hidden border-t-4 border-gray-300 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-lg bg-gray-50 text-gray-400">
                            <Shield size={24} />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">System Status</h3>
                    <p className="text-gray-500 font-medium text-sm mb-4">All systems operational</p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Database</span>
                            <span className="text-green-600 font-semibold">●  Online</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Server</span>
                            <span className="text-green-600 font-semibold">●  Running</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
