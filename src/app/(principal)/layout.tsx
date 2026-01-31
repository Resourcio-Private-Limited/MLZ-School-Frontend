import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Users, GraduationCap, Calendar, Settings, LogOut } from "lucide-react";

export default function PrincipalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TODO: Connect to new backend API for authentication
    // For now, layout is accessible without authentication
    const mockUser = {
        name: "Principal User",
        email: "principal@school.com"
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md flex flex-col">
                <div className="p-4 border-b">
                    <Image
                        src="/MLZS_contents/Horizontal MLZS Logo.png"
                        alt="Mount Litera Zee School"
                        width={180}
                        height={56}
                        className="h-auto mb-2"
                    />
                    <p className="text-sm text-gray-500 font-medium">Principal Portal</p>
                </div>


                <nav className="flex-1 p-4 space-y-2">
                    <NavLink href="/principal" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavLink href="/principal/teachers" icon={<Users size={20} />} label="Teachers" />
                    <NavLink href="/principal/students" icon={<GraduationCap size={20} />} label="Students" />
                    <NavLink href="/principal/academics" icon={<Calendar size={20} />} label="Academics" />
                    <NavLink href="/principal/settings" icon={<Settings size={20} />} label="Settings" />
                </nav>

                <div className="p-4 border-t">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {mockUser.name?.[0] || "P"}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{mockUser.name}</p>
                            <p className="text-xs text-gray-500">{mockUser.email}</p>
                        </div>
                    </div>
                    <Link href="/" className="flex items-center space-x-3 text-red-600 p-2 hover:bg-red-50 rounded">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
