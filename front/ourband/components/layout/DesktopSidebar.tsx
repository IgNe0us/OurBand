"use client";
// @ts-nocheck
import Link from "next/link";

import { usePathname } from "next/navigation";
import { Home, Search, Music, MapPin, User, MessageCircle, Mic2, HeartHandshake, PenTool, Users, PlaySquare, UserPlus, AudioWaveform, Settings, Bell, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getUserInfoApi } from "@/api/account/userService";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";

const NAV_ITEMS = [
  { path: "/", label: "트렌드", icon: Home },
  { path: "/match", label: "주변매칭", icon: Search },
  { path: "/jam", label: "오디오잼", icon: Music },
  { path: "/studio", label: "합주실", icon: MapPin },
  { path: "/bands", label: "밴드", icon: Users },
  { path: "/band", label: "멤버 찾기", icon: UserPlus },
];

const COMMUNITY_ITEMS = [
  { path: "/community/free", label: "자유게시판", icon: MessageCircle },
  { path: "/community/counseling", label: "고민상담", icon: HeartHandshake },
  { path: "/community/flex", label: "악기자랑", icon: PenTool },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const location = { pathname: pathname || "/" };
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const totalUnreadCount = useChatStore(state => state.totalUnreadCount);
  const notificationCount = useNotificationStore(state => state.unreadCount);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('ourband_isAdmin') === 'true');
    
    // 💡 실시간 유저 정보 로드
    getUserInfoApi()
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Failed to load user info in sidebar", err);
      });
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
            {!user ? (
              // 💡 로딩 중 스켈레톤 표시
              <div className="px-3 py-3 animate-pulse flex items-center gap-3">
                <div className="w-5 h-5 bg-slate-800 rounded" />
                <div className="w-24 h-3 bg-slate-800 rounded" />
              </div>
            ) : user.bands && user.bands.length > 0 ? (
              user.bands.map((band: any) => {
                const path = `/band/${band.bandId}/board`;
                const isActive = location.pathname === path;
                return (
                  <Link key={band.bandId} href={path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300",
                      isActive 
                        ? "bg-primary/10 text-primary font-bold" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium"
                    )}
                  >
                    {band.logoImageUrl ? (
                      <img 
                        src={band.logoImageUrl} 
                        alt={band.bandName} 
                        className="w-5 h-5 rounded-md object-cover border border-slate-700 shrink-0" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <PlaySquare className={cn("w-5 h-5 shrink-0", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                    <span className="truncate">{band.bandName}</span>
                  </Link>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 px-3 py-2">가입된 밴드가 없습니다.</p>
            )}
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
        {user ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-4">
              <Link href="/notifications" className="relative flex-1 flex justify-center py-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all group">
                <Bell size={20} className="group-hover:scale-110 transition-transform" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1/4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-secondary animate-pulse" />
                )}
              </Link>
              <Link href="/chat" className="relative flex-1 flex justify-center py-2 rounded-xl bg-primary/10 text-primary hover:text-white hover:bg-primary transition-all group">
                <Send size={20} className="group-hover:scale-110 transition-transform" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 right-1/4 translate-x-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-secondary flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </span>
                )}
              </Link>
            </div>
            <Link href="/profile" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-border group-hover:border-primary transition-colors overflow-hidden shrink-0 flex items-center justify-center bg-slate-800">
                {user.profilePictureUrl ? (
                  <img 
                    src={user.profilePictureUrl} 
                    alt="My Profile" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} className="text-slate-500" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{user.nickname}</span>
                <span className="text-xs text-slate-400 truncate">@{user.handle || `user_${user.userId || '1'}`}</span>
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-slate-700" />
            <div className="flex flex-col gap-1.5">
              <div className="w-16 h-3 bg-slate-700 rounded" />
              <div className="w-20 h-2.5 bg-slate-700 rounded" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
