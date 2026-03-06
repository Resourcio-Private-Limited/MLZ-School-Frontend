"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function MessagesPage() {
    const [messageRecipient, setMessageRecipient] = useState("Class Teacher");

    // Mock data
    const classroomData = {
        subjects: [
            { name: "Mathematics", teacher: "Mr. Kumar" },
            { name: "Science", teacher: "Dr. Patel" },
            { name: "English", teacher: "Ms. Reddy" },
            { name: "Social Studies", teacher: "Mr. Singh" },
            { name: "Hindi", teacher: "Mrs. Gupta" }
        ]
    };

    const messageRecipients = ["Class Teacher", "Principal", ...classroomData.subjects.map(s => s.teacher)];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/student/classroom">
                        <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={20} />
                            <span className="font-medium">Back</span>
                        </button>
                    </Link>
                    <div className="h-6 w-px bg-slate-300"></div>
                    <h1 className="text-3xl font-bold text-slate-800">Student Messages</h1>
                </div>
            </div>

            {/* Message Form */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-emerald-500">
                <div className="flex items-center space-x-3 p-6 border-b border-gray-100">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                        <MessageSquare size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Send a Message</h2>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Send Message To</label>
                        <select
                            value={messageRecipient}
                            onChange={(e) => setMessageRecipient(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all hover:bg-white"
                        >
                            {messageRecipients.map((recipient, index) => (
                                <option key={index} value={recipient}>{recipient}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                        <input
                            type="text"
                            placeholder="Enter message subject"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all hover:bg-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                        <textarea
                            rows={8}
                            placeholder="Type your message here..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all hover:bg-white resize-none"
                        ></textarea>
                    </div>

                    <button className="w-full bg-emerald-600 text-white py-3.5 rounded-lg font-bold text-lg shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                        Send Message
                    </button>
                </div>
            </div>
        </div>
    );
}
