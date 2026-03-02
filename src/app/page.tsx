import Link from "next/link";
import Image from "next/image";
import { GraduationCap, Users, Shield, Banknote, ShieldCheck, Phone, ArrowRight, ChevronRight, LayoutGrid } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Hero Section */}
      <div className="bg-slate-900 pb-32">
        <header className="max-w-7xl mx-auto px-6 py-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* White Logo for Dark Background - If not available, use filter or text */}
            <Image
              src="/MLZS_contents/Zee Learn White.png"
              alt="Mount Litera Zee School"
              width={120}
              height={40}
              className="h-8 w-auto opacity-90"
              priority
            />
            <div className="h-6 w-px bg-white/20"></div>
            <span className="text-white/90 text-sm font-medium tracking-wide">PORTAL ACCESS</span>
          </div>
          <div className="text-white/60 text-xs tracking-wider uppercase hidden sm:block">
            Session 2025-2026
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-light text-white mb-2">
            Welcome to <span className="font-bold text-blue-400">Mount Litera Zee School</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-light">
            Select your role to access the integrated management system.
            Secure, efficient, and comprehensive.
          </p>
        </div>
      </div>

      {/* Main Content - Floating Cards */}
      <main className="flex-grow -mt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

            <CorporateCard
              href="/login/student"
              icon={<GraduationCap className="w-6 h-6" />}
              title="Student"
              subtitle="My Learning"
              color="border-blue-500"
            />

            <CorporateCard
              href="/login/teacher"
              icon={<Users className="w-6 h-6" />}
              title="Teacher"
              subtitle="Classroom Ops"
              color="border-emerald-500"
            />

            <CorporateCard
              href="/login/principal"
              icon={<Shield className="w-6 h-6" />}
              title="Principal"
              subtitle="Administration"
              color="border-purple-600"
            />

            <CorporateCard
              href="/login/accounts"
              icon={<Banknote className="w-6 h-6" />}
              title="Accounts"
              subtitle="Finance & Payroll"
              color="border-amber-500"
            />

            <CorporateCard
              href="/login/super-admin"
              icon={<ShieldCheck className="w-6 h-6" />}
              title="Super Admin"
              subtitle="System Control"
              color="border-rose-600"
            />

          </div>

          {/* Quick Links / Info Section under cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 py-8 border-t border-gray-200">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <LayoutGrid size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Integrated Platform</h3>
                <p className="text-sm text-gray-500 mt-1">One unified system for all school operations and management needs.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Secure Access</h3>
                <p className="text-sm text-gray-500 mt-1">Enterprise-grade security ensuring your data remains protected.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">24/7 Support</h3>
                <p className="text-sm text-gray-500 mt-1">Need help? Contact our dedicated support team anytime.</p>
                <p className="text-sm font-medium text-blue-600 mt-1">+91 1800-123-4567</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top row: partner logos */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-5 border-b border-gray-100">
            <Image
              src="/MLZS_contents/write Zee Learn Original Blue.png"
              alt="Zee Learn"
              width={100}
              height={30}
              className="h-6 w-auto opacity-70"
            />
            {/* RET Branding */}
            <div className="flex items-center gap-3">
              <Image
                src="/MLZS_contents/RET Icon-PNG.png"
                alt="Rudraksh Educational Trust"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 leading-tight">Rudraksh Educational Trust</p>
                <p className="text-xs text-gray-400 tracking-wide">Empowering Education</p>
              </div>
            </div>
          </div>
          {/* Bottom row: copyright */}
          <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} <span className="font-medium text-gray-500">Rudraksh Educational Trust</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Mount Litera Zee School, North Kolkata &mdash; A unit of Rudraksh Educational Trust
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CorporateCard({ href, icon, title, subtitle, color }: { href: string; icon: React.ReactNode; title: string; subtitle: string; color: string }) {
  return (
    <Link href={href} className="group block h-full">
      <div className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 h-full overflow-hidden border-t-4 ${color} relative group-hover:-translate-y-1`}>
        <div className="p-6">
          <div className={`w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-700 mb-4 group-hover:bg-gray-100 transition-colors`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-900 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500 mb-4 font-medium">{subtitle}</p>

          <div className="flex items-center text-blue-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Login <ArrowRight size={16} className="ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}
