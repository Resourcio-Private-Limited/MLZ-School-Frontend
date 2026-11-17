"use client";

import { useRef } from "react";
import { FileText, ImageIcon, Paperclip, X } from "lucide-react";
import toast from "react-hot-toast";
import {
    useSendMessageMutation,
    useUploadMessageAttachmentMutation,
    type MessageItem,
} from "@/redux/api/operationsApi";

/** Keep in step with MESSAGE_ATTACHMENT_TYPES / MAX_BYTES in the backend operations service. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
]);
const ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

export type Accent = "rose" | "purple" | "emerald" | "sky" | "yellow";

// Literal class strings so Tailwind keeps them.
const RING: Record<Accent, string> = {
    rose: "focus-visible:ring-rose-500",
    purple: "focus-visible:ring-purple-500",
    emerald: "focus-visible:ring-emerald-500",
    sky: "focus-visible:ring-sky-500",
    yellow: "focus-visible:ring-yellow-500",
};
const ATTACH_HOVER: Record<Accent, string> = {
    rose: "hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700",
    purple: "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700",
    emerald: "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
    sky: "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700",
    yellow: "hover:border-yellow-400 hover:bg-yellow-50 hover:text-yellow-800",
};

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why a file can't be attached, or null if it's fine. */
function rejectReason(file: File): string | null {
    if (file.size === 0) return `${file.name} is empty. Choose another file.`;
    if (file.size > ATTACHMENT_MAX_BYTES) return `${file.name} is ${formatBytes(file.size)}. Attachments can be up to 10 MB.`;
    if (!ALLOWED_TYPES.has(file.type)) return `${file.name} can't be attached. Use an image, PDF, Word, Excel, PowerPoint or text file.`;
    return null;
}

/**
 * Sends a message with an optional file: uploads the file first, then sends
 * the message that points at it. Text may be empty when a file is attached.
 */
export function useSendMessageWithAttachment() {
    const [sendMessage, sendState] = useSendMessageMutation();
    const [upload, uploadState] = useUploadMessageAttachmentMutation();
    const busy = sendState.isLoading || uploadState.isLoading;

    const send = async (receiverId: string, text: string, file: File | null) => {
        const attachment = file ? await upload(file).unwrap() : undefined;
        return sendMessage({ receiverId, content: text, ...(attachment && { attachment }) }).unwrap();
    };

    return { send, busy, uploading: uploadState.isLoading };
}

/** Paperclip button plus the chip for the chosen file. Controlled by `file` / `onChange`. */
export function AttachmentPicker({
    file,
    onChange,
    accent,
    disabled,
    id,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
    accent: Accent;
    disabled?: boolean;
    id: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const ring = `focus-visible:outline-none focus-visible:ring-2 ${RING[accent]}`;

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    const picked = e.target.files?.[0] ?? null;
                    e.target.value = ""; // let the same file be picked again after removing it
                    if (!picked) return;
                    const reason = rejectReason(picked);
                    if (reason) {
                        toast.error(reason);
                        return;
                    }
                    onChange(picked);
                }}
            />
            {file ? (
                <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-1 text-sm text-gray-700">
                    {file.type.startsWith("image/") ? (
                        <ImageIcon size={16} aria-hidden="true" className="shrink-0 text-gray-500" />
                    ) : (
                        <FileText size={16} aria-hidden="true" className="shrink-0 text-gray-500" />
                    )}
                    <span className="min-w-0 truncate" title={file.name}>{file.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">{formatBytes(file.size)}</span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        disabled={disabled}
                        aria-label={`Remove attachment ${file.name}`}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50 motion-safe:transition-colors ${ring}`}
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                </span>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className={`inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 disabled:opacity-50 motion-safe:transition-colors ${ATTACH_HOVER[accent]} ${ring}`}
                >
                    <Paperclip size={16} aria-hidden="true" />
                    Attach file
                </button>
            )}
        </div>
    );
}

/** The file inside a message bubble. `onDark` is for bubbles with white text on the portal colour. */
export function MessageAttachmentView({ message, onDark }: { message: MessageItem; onDark: boolean }) {
    if (!message.attachmentUrl) return null;
    const name = message.attachmentName || "Attachment";
    const isImage = (message.attachmentType ?? "").startsWith("image/");
    const size = message.attachmentSize ? formatBytes(message.attachmentSize) : "";
    const ring = onDark ? "focus-visible:ring-white" : "focus-visible:ring-gray-400";

    return (
        <a
            href={message.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={name}
            aria-label={`Open attachment ${name}${size ? `, ${size}` : ""}`}
            className={`mb-1.5 block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 ${ring} ${
                onDark ? "bg-white/15 hover:bg-white/25" : "bg-gray-50 ring-1 ring-gray-200 hover:bg-gray-100"
            } motion-safe:transition-colors`}
        >
            {isImage && (
                // Plain <img>: attachment hosts vary and these are small thumbnails. Fixed height so the
                // thread doesn't shift (and lose its scroll-to-newest position) when the image loads.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={message.attachmentUrl} alt="" loading="lazy" className="h-44 w-full object-cover" />
            )}
            <span className="flex items-center gap-2.5 px-3 py-2">
                {isImage ? (
                    <ImageIcon size={18} aria-hidden="true" className="shrink-0 opacity-80" />
                ) : (
                    <FileText size={18} aria-hidden="true" className="shrink-0 opacity-80" />
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}</span>
                    {size && <span className={`block text-xs tabular-nums ${onDark ? "opacity-80" : "text-gray-500"}`}>{size}</span>}
                </span>
            </span>
        </a>
    );
}
