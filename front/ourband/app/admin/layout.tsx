"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Users, ShieldBan, ArrowLeft, Settings, BarChart2, HardDrive, Layout as LayoutIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";

import { getUserInfoApi } from "@/api/account/userService";

const TABS = [
  { id: "overview", path: "/admin", label: "대시보드 홈", icon: LayoutIcon },
  { id: "users", path: "/admin/users", label: "회원 관리", icon: Users },
  { id: "content", path: "/admin/content", label: "콘텐츠 관리", icon: HardDrive },
  { id: "reports", path: "/admin/reports", label: "신고/모니터링", icon: ShieldBan },
  { id: "settings", path: "/admin/settings", label: "사이트 설정", icon: Settings },
  { id: "analytics", path: "/admin/analytics", label: "통계 및 로그", icon: BarChart2 },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    getUserInfoApi()
      .then((data) => {
        const adminStatus = data.type === 'system_admin' || data.type === 'service_admin' || data.type === 'admin';
        setIsAdmin(adminStatus);
        setUserType(data.type);
        if (!adminStatus) {
          toast.error("관리자 권한이 필요합니다.");
          router.push("/");
        }
      })
      .catch((err) => {
        console.error("Failed to load user info in admin layout", err);
        setIsAdmin(false);
        toast.error("로그인이 필요합니다.");
        router.push("/");
      });
  }, [router]);

  if (isAdmin === null) return null;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-border shrink-0 bg-secondary/30 flex flex-col h-auto md:h-screen sticky top-0 z-10 overflow-y-auto">
        <header className="p-4 md:p-6 flex items-center gap-3 border-b border-border">
          <button onClick={() => router.push("/")} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors bg-background rounded-full border border-border shadow-sm">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            <h1 className="text-xl font-black text-white tracking-tight">Admin</h1>
          </div>
        </header>
        <nav className="p-4 space-y-1 hidden md:block">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Management</div>
          {TABS.map(tab => {
            // 서비스 관리자는 설정 페이지 볼 수 없음
            if (tab.id === 'settings' && userType === 'service_admin') return null;
            
            const Icon = tab.icon;
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={cn("w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all", 
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon size={18} /> {tab.label}
              </Link>
            )
          })}
        </nav>
        {/* Mobile Horizontal Tabs */}
        <div className="md:hidden flex overflow-x-auto hide-scrollbar p-2 gap-2 border-b border-border bg-background">
          {TABS.map(tab => {
            if (tab.id === 'settings' && userType === 'service_admin') return null;
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={cn("whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                  isActive ? "bg-primary text-white" : "bg-secondary text-slate-400"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-h-screen overflow-y-auto flex flex-col">
        <header className="mb-8 hidden md:block shrink-0">
          <h2 className="text-2xl font-black text-white">{TABS.find(t => t.path === pathname)?.label || "관리자 대시보드"}</h2>
          <p className="text-slate-400 text-sm mt-1">OurBand 관리자 시스템</p>
        </header>
        {children}
      </main>
    </div>
  );
}
