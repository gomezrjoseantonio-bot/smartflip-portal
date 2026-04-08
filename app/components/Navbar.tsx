"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, TrendingUp, FileText, Target, Trophy, Menu, X, LogOut } from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/investments", label: "Mis Inversiones", icon: TrendingUp },
  { href: "/dashboard/receipts", label: "Recibos", icon: FileText },
  { href: "/dashboard/goals", label: "Metas", icon: Target },
  { href: "/dashboard/achievements", label: "Logros", icon: Trophy },
];

export default function Navbar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Image src="/logo-smartflip.svg" alt="SmartFlip" width={32} height={32} />
          <span className="font-bold text-white text-lg">SMARTFLIP</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-slate-300 p-1" style={{background:'none',border:'none',width:'auto',padding:'4px'}}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700">
          <Image src="/logo-smartflip.svg" alt="SmartFlip" width={40} height={40} />
          <div>
            <div className="font-bold text-white text-xl tracking-wider">SMARTFLIP</div>
            <div className="text-xs text-slate-400">Portal de Inversores</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-gradient-to-r from-[#4ECDC4]/20 to-[#2ECC71]/20 text-white border border-[#4ECDC4]/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon size={18} className={active ? 'text-[#4ECDC4]' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          {userEmail && (
            <div className="text-xs text-slate-500 mb-3 truncate">{userEmail}</div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm w-full px-3 py-2 rounded-lg hover:bg-slate-800 transition-all"
            style={{background:'none',border:'none',width:'100%',padding:'8px 12px',cursor:'pointer',textAlign:'left'}}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
