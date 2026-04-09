"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Paperclip, Send, CheckCircle2 } from "lucide-react";
import { useGetMessageRecipientsQuery } from "@/redux/api/studentApi";
import { useSendMessageMutation } from "@/redux/api/operationsApi";

export default function MessagesPage() {
    const { data: recipients = [], isLoading } = useGetMessageRecipientsQuery();
    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    const [selectedRecipient, setSelectedRecipient] = useState("");
    const [subject, setSubject] = useState("");
    const [messageContent, setMessageContent] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedRecipient) {
            setFeedback({ type: "error", message: "Please select a recipient." });
            setTimeout(() => setFeedback(null), 4000);
            return;
        }
        if (!messageContent.trim()) {
            setFeedback({ type: "error", message: "Please enter a message." });
            setTimeout(() => setFeedback(null), 4000);
            return;
        }

        const authUser = JSON.parse(localStorage.getItem("authUser") ?? "{}");
        const senderId = authUser?.id;

        if (!senderId) {
            setFeedback({ type: "error", message: "Please login again." });
            setTimeout(() => setFeedback(null), 4000);
            return;
        }

        try {
            await sendMessage({
                senderId,
                receiverId: selectedRecipient,
                content: subject ? `${subject}\n${messageContent}` : messageContent,
            }).unwrap();

            setSubject("");
            setMessageContent("");
            setSelectedRecipient("");
            setAttachment(null);
            setFeedback({ type: "success", message: "Message sent successfully!" });
            setTimeout(() => setFeedback(null), 4000);
        } catch {
            setFeedback({ type: "error", message: "Failed to send message. Please try again." });
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/student/classroom">
                            <button className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft size={20} />
                                <span className="font-medium">Back</span>
                            </button>
                        </Link>
                        <div className="h-6 w-px bg-slate-300"></div>
                        <h1 className="text-3xl font-bold text-slate-800">Compose Message</h1>
                    </div>
                </div>

                {/* Feedback Banner */}
                {feedback && (
                    <div className={`flex items-center space-x-3 px-5 py-3 rounded-lg shadow-md border ${
                        feedback.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-red-50 border-red-200 text-red-800"
                    }`}>
                        {feedback.type === "success"
                            ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                            : <Send size={20} className="text-red-500 shrink-0" />
                        }
                        <p className="font-medium text-sm">{feedback.message}</p>
                    </div>
                )}

                {/* Disclaimer Section */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> This section is strictly for queries, issues, or formal communication. Please refrain from using it for casual or continuous chat.
                    </p>
                </div>

                {/* Message Form */}
                <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Recipient</label>
                        {isLoading ? (
                            <div className="w-full h-10 bg-gray-100 rounded-md animate-pulse" />
                        ) : recipients.length === 0 ? (
                            <p className="text-slate-500 text-sm">No recipients available.</p>
                        ) : (
                            <select
                                value={selectedRecipient}
                                onChange={(e) => setSelectedRecipient(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                            >
                                <option value="">Select a recipient</option>
                                {recipients.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} — {r.role}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                        <input
                            type="text"
                            placeholder="Enter message subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                        <textarea
                            rows={10}
                            placeholder="Type your message here..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    {/* <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Attachment</label>
                        <div className="flex items-center space-x-4">
                            <input
                                type="file"
                                onChange={handleAttachmentChange}
                                className="bg-white border border-slate-300 rounded-md px-4 py-2 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                            />
                            {attachment && (
                                <span className="text-sm text-slate-600">{attachment.name}</span>
                            )}
                        </div>
                    </div> */}

                    <button
                        onClick={handleSendMessage}
                        disabled={isSending}
                        className="w-full bg-blue-600 text-white py-3 rounded-md font-bold text-lg shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        {isSending ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </div>
        </div>
    );
}
