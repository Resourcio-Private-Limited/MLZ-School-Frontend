"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ children, content, side = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setIsVisible(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-flex"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && mounted && createPortal(
        <div
          className={cn(
            "fixed z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            side === "top" && "-translate-x-1/2 -translate-y-full mb-2",
            side === "bottom" && "-translate-x-1/2 translate-y-1 mt-2",
            side === "left" && "-translate-y-1/2 -translate-x-full mr-2",
            side === "right" && "-translate-y-1/2 translate-x-1 ml-2",
            className
          )}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          <div
            className={cn(
              "absolute w-2 h-2 bg-gray-900 rotate-45",
              side === "top" && "left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2",
              side === "bottom" && "left-1/2 -translate-x-1/2 top-0 -translate-y-1/2",
              side === "left" && "top-1/2 -translate-y-1/2 right-0 translate-x-1/2",
              side === "right" && "top-1/2 -translate-y-1/2 left-0 -translate-x-1/2"
            )}
          />
        </div>,
        document.body
      )}
    </>
  );
}

// Icon tooltip mapping with descriptions
export const ICON_TOOLTIPS: Record<string, string> = {
  // Navigation & Layout
  Home: "Home",
  LayoutDashboard: "Dashboard",
  BookOpen: "Classrooms",
  Users: "Students",
  User: "Profile",
  Bell: "Notifications",
  LogOut: "Logout",
  ChevronLeft: "Collapse",
  ChevronRight: "Expand",
  Loader2: "Loading...",
  Settings: "Settings",

  // Actions
  Plus: "Add New",
  PlusCircle: "Add New",
  Edit: "Edit",
  Edit2: "Edit",
  Trash2: "Delete",
  Save: "Save",
  Download: "Download",
  Print: "Print",
  Search: "Search",
  Filter: "Filter",
  X: "Close",
  ArrowLeft: "Go Back",
  ArrowRight: "Continue",
  Send: "Send",
  Check: "Confirm",
  CheckCircle: "Confirmed",
  CheckSquare: "Select All",
  XCircle: "Not Confirmed",
  Square: "Deselect All",

  // User related
  UserPlus: "Create User",
  UserCheck: "Approve Student",
  Shield: "Principal Portal",
  ShieldCheck: "Verified Student",
  ShieldX: "Unverified Student",
  Briefcase: "Teacher",
  GraduationCap: "Student",
  Users: "Students",
  Key: "Reset Password",
  Lock: "Lock/Unlock",

  // Eye related
  Eye: "View Details",
  EyeOff: "Hide Details",

  // Finance related
  DollarSign: "Fees",
  IndianRupee: "Fees",
  TrendingUp: "Income",
  TrendingDown: "Expenses",
  CreditCard: "Payment",
  Banknote: "Cash Payment",
  FileText: "Invoice",
  FileSpreadsheet: "Excel Export",

  // Calendar & Time
  Calendar: "Calendar",
  Clock: "Time",
  History: "History",

  // Status indicators
  AlertCircle: "Alert",
  AlertTriangle: "Warning",
  Info: "Information",
  Trophy: "Rankings",
  TrendingUp: "Rank Up",
  TrendingDown: "Rank Down",

  // Messages
  MessageSquare: "Messages",
  MessageCircleIcon: "Messages",
  Send: "Send Message",
  Link2: "External Link",
  Paperclip: "Attachment",

  // Misc
  BarChart3: "Analytics",
  ShieldAlert: "Access Denied",
  Video: "Video Lecture",
  ExternalLink: "External Resource",
  RefreshCw: "Refresh",
  MoreVertical: "More Options",
  Loader: "Processing",
  Phone: "Contact",
};

interface IconButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "default";
  side?: "top" | "bottom" | "left" | "right";
}

export function IconButton({ icon, tooltip, size = "sm", variant = "ghost", side = "top", className, ...props }: IconButtonProps) {
  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  const variantClasses = {
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
    outline: "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
  };

  return (
    <Tooltip content={tooltip} side={side}>
      <button
        className={cn(
          "rounded-md transition-colors",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {icon}
      </button>
    </Tooltip>
  );
}
