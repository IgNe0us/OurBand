"use client";
// @ts-nocheck
import Link from "next/link";

import { usePathname } from "next/navigation";
import { Home, Search, Music, MapPin, User, MessageCircle, Mic2, HeartHandshake, PenTool, Users, PlaySquare, UserPlus, AudioWaveform, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "트렌드", icon: Home },
  { path: "/match", label: "주변매칭", icon: Search },
  { path: "/jam", label: "오디오잼", icon: Music },
  { path: "/studio", label: "합주실", icon: MapPin },
  { path: "/bands", label: "밴드", icon: Users },
  { path: "/band", label: "구인/구직", icon: UserPlus },
];

const COMMUNITY_ITEMS = [
  { path: "/community/free", label: "자유게시판", icon: MessageCircle },
  { path: "/community/counseling", label: "고민상담", icon: HeartHandshake },
  { path: "/community/flex", label: "악기자랑", icon: PenTool },
];

const MY_BANDS = [
  { path: "/band/rubyspark/board", label: "루비스파크", icon: PlaySquare },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const location = { pathname: pathname || "/" };
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('ourband_isAdmin') === 'true');
  }, [pathname]);

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen fixed left-0 top-0 bg-secondary border-r border-border z-40 overflow-y-auto">
      <div className="p-6 md:p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <AudioWaveform size={20} strokeWidth={2.5} />
        </div>
        <span className="text-2xl font-black tracking-tight text-white">OurBand</span>
      </div>

      <div className="flex-1 px-4 md:px-6 space-y-8 mt-4">
        {/* Main Navigation */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Discover</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path || (path === "/band" && (location.pathname === "/band" || (location.pathname.startsWith("/band/") && !location.pathname.includes("/board"))));
              return (
                <Link key={path} href={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Community Navigation */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Community</p>
          <nav className="space-y-1">
            {COMMUNITY_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname.startsWith(path);
              return (
                <Link key={path} href={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-slate-800 text-white font-bold" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* My Bands Navigation */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">My Band</p>
          <nav className="space-y-1">
            {MY_BANDS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} href={path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-primary/10 text-primary font-bold" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-6 md:p-8 border-t border-border mt-auto">
        {isAdmin && (
          <Link href="/admin" className="flex items-center justify-center gap-2 w-full py-2.5 mb-4 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors border border-red-500/20">
            <Settings size={18} />
            관리자 대시보드
          </Link>
        )}
        <Link href="/profile" className="flex items-center gap-3 group">
          <img src="https://picsum.photos/seed/george/100/100" alt="My Profile" className="w-10 h-10 rounded-full border border-border group-hover:border-primary transition-colors" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">조지스미스</span>
            <span className="text-xs text-slate-400">@george_smith</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
