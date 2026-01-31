"use client";

import { User, Briefcase, Mail, Phone, MapPin, Calendar, Book, IdCard, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

export default function TeacherProfilePage() {
    // Mock Profile Data
    const profile = {
        personal: {
            name: "Rajesh Kumar",
            email: "rajesh.kumar@school.com",
            phone: "+91 98765 43210",
            dob: "1985-05-15",
            address: "123, Green Avenue, Mumbai, Maharashtra",
            bloodGroup: "O+"
        },
        official: {
            employeeId: "TCH-2015-042",
            designation: "Senior Mathematics Teacher",
            joiningDate: "2015-06-01",
            qualifications: ["M.Sc. Mathematics", "B.Ed."],
            subjects: ["Mathematics", "Physics"],
            classes: ["Class 9", "Class 10", "Class 12"]
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative"></div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-bold">
                                {profile.personal.name[0]}
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">{profile.personal.name}</h2>
                            <p className="text-gray-500 font-medium">{profile.official.designation}</p>
                        </div>
                    </div>

                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-lg">
                            <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 font-medium rounded-md py-2 transition-all shadow-sm">
                                <User size={18} className="mr-2 inline" /> Personal Details
                            </TabsTrigger>
                            <TabsTrigger value="official" className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 font-medium rounded-md py-2 transition-all shadow-sm">
                                <Briefcase size={18} className="mr-2 inline" /> Official Details
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="personal" className="space-y-6 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Mail size={16} /> Email Address
                                    </label>
                                    <p className="text-gray-800 font-medium">{profile.personal.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Phone size={16} /> Phone Number
                                    </label>
                                    <p className="text-gray-800 font-medium">{profile.personal.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Calendar size={16} /> Date of Birth
                                    </label>
                                    <p className="text-gray-800 font-medium">{new Date(profile.personal.dob).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <MapPin size={16} /> Address
                                    </label>
                                    <p className="text-gray-800 font-medium">{profile.personal.address}</p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="official" className="space-y-6 animate-in fade-in-50 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <IdCard size={16} /> Employee ID
                                    </label>
                                    <p className="text-gray-800 font-medium">{profile.official.employeeId}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Calendar size={16} /> Joining Date
                                    </label>
                                    <p className="text-gray-800 font-medium">{new Date(profile.official.joiningDate).toLocaleDateString()}</p>
                                </div>
                                <div className="col-span-1 md:col-span-2 space-y-3 pt-4 border-t border-gray-100">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <GraduationCap size={16} /> Qualifications
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.official.qualifications.map((qual, idx) => (
                                                <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                                                    {qual}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <Book size={16} /> Subjects & Classes
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.official.subjects.map((sub, idx) => (
                                                <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100">
                                                    {sub}
                                                </span>
                                            ))}
                                            <span className="text-gray-300">|</span>
                                            {profile.official.classes.map((cls, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                                                    {cls}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
