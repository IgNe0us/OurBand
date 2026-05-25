"use client";
// @ts-nocheck
import Link from "next/link";

import { usePathname } from "next/navigation";
import { X, MessageCircle, HeartHandshake, PenTool, User, Search, Music, MapPin, Home, PlaySquare, AudioWaveform, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMUNITY_ITEMS = [
  { path: "/community/free", label: "자유게시판", icon: MessageCircle },
  { path: "/community/counseling", label: "고민상담", icon: HeartHandshake },
  { path: "/community/flex", label: "악기자랑", icon: PenTool },
];

const MY_BANDS = [
  { path: "/band/rubyspark/board", label: "루비스파크", icon: PlaySquare },
];

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const location = { pathname: pathname || "/" };
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('ourband_isAdmin') === 'true');
  }, [isOpen, pathname]);

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
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
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
              {MY_BANDS.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
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
                    <Icon className={cn("w-5 h-5 text-primary", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
                    {label}
                  </Link>
                );
              })}
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
          <Link href="/profile" onClick={onClose} className="flex items-center gap-3">
            <img src="https://picsum.photos/seed/myprofile/100/100" alt="My Profile" className="w-12 h-12 rounded-full border border-border" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">루비스파크</span>
              <span className="text-xs text-slate-400">@rubyspark</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
