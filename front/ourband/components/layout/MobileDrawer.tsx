"use client";
// @ts-nocheck
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import { X, MessageCircle, HeartHandshake, PenTool, User, Search, Music, MapPin, Home, PlaySquare, AudioWaveform, Settings, Bell, Send, LogOut } from "lucide-react";
import { cn, translateInstrument } from "@/lib/utils";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getUserInfoApi, logoutApi } from "@/api/account/userService";
import { useChatStore } from "@/store/chatStore";
import { useNotificationStore } from "@/store/notificationStore";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMUNITY_ITEMS = [
  { path: "/community/free", label: "자유게시판", icon: MessageCircle },
  { path: "/community/counseling", label: "고민상담", icon: HeartHandshake },
  { path: "/community/flex", label: "악기자랑", icon: PenTool },
];

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const location = { pathname: pathname || "/" };
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const totalUnreadCount = useChatStore(state => state.totalUnreadCount);
  const notificationCount = useNotificationStore(state => state.unreadCount);

  useEffect(() => {
    if (isOpen) {
      // 💡 실시간 유저 정보 로드
      getUserInfoApi()
        .then((data) => {
          setUser(data);
          setIsAdmin(data.type === 'admin');
        })
        .catch((err) => {
          console.error("Failed to load user info in drawer", err);
        });
    }
  }, [isOpen, pathname]);

  const handleLogout = async () => {
    try {
      await logoutApi();
      toast.success("안전하게 로그아웃 되었습니다.");
      onClose();
      router.push("/login");
    } catch (err) {
      toast.error("로그아웃 처리 중 오류가 발생했습니다.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-4/5 max-w-sm bg-secondary h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 border-r border-border">
        <div className="p-6 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <AudioWaveform size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">OurBand</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" onClick={onClose} className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={22} />
              {notificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-secondary animate-pulse" />
              )}
            </Link>
            <Link href="/chat" onClick={onClose} className="relative p-2 text-slate-400 hover:text-white transition-colors mr-2">
              <Send size={22} />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-secondary flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </Link>
            <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-xl">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Community Actions */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Community</p>
            <nav className="space-y-1">
              {COMMUNITY_ITEMS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname.startsWith(path);
                return (
                  <Link key={path} href={path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
                      isActive 
                        ? "bg-slate-800 text-white font-bold" 
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white font-medium"
                    )}
                  >
                    <Icon className="w-5 h-5 text-primary" strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* My Bands Actions */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">My Band</p>
            <nav className="space-y-1">
              {!user ? (
                // 💡 로딩 중 스켈레톤 표시
                <div className="px-4 py-3.5 animate-pulse flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-800 rounded" />
                  <div className="w-24 h-3 bg-slate-800 rounded" />
                </div>
              ) : user.bands && user.bands.length > 0 ? (
                user.bands.map((band: any) => {
                  const path = `/band/${band.bandId}/board`;
                  const isActive = location.pathname === path;
                  return (
                    <Link key={band.bandId} href={path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all",
                        isActive 
                          ? "bg-slate-800 text-white font-bold" 
                          : "text-slate-300 hover:bg-slate-800/50 hover:text-white font-medium"
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
                        <PlaySquare className={cn("w-5 h-5 text-primary shrink-0", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                      )}
                      <span className="truncate">{band.bandName}</span>
                    </Link>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 px-2 py-2">가입된 밴드가 없습니다.</p>
              )}
            </nav>
          </div>
        </div>
        
        <div className="p-6 border-t border-border">
          {isAdmin && (
            <Link href="/admin" onClick={onClose} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors border border-red-500/20">
              <Settings size={18} />
              관리자 대시보드
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" onClick={onClose} className="flex items-center gap-3 group flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full border border-border group-hover:border-primary transition-colors overflow-hidden flex items-center justify-center bg-slate-800 shrink-0">
                  {user.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt="My Profile" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={24} className="text-slate-500" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{user.nickname}</span>
                  <span className="text-xs text-slate-400 truncate">{translateInstrument(user.instrument)}</span>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group shrink-0"
                title="로그아웃"
              >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-slate-700" />
              <div className="flex flex-col gap-1.5">
                <div className="w-16 h-3 bg-slate-700 rounded" />
                <div className="w-20 h-2.5 bg-slate-700 rounded" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
