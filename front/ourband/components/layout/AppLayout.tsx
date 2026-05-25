"use client";
// @ts-nocheck

import * as React from "react";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileDrawer } from "./MobileDrawer";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type LayoutContextType = {
  openMenu: () => void;
};

// Mock Global Notifications
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: "apply", text: "신스팝 밴드 네온사인에서 영입 제안이 왔습니다.", time: "10분 전", read: false },
  { id: 2, type: "system", text: "루비스파크님의 프로필이 주간 인기 톱퍼에 선정되었습니다!", time: "2시간 전", read: true },
];

export const LayoutContext = React.createContext<LayoutContextType>({ openMenu: () => {} });

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    setIsNotifOpen(false);
    navigate(`/chat/${id}?type=apply&targetId=${id}`); // Simple mock redirect
  };

  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isLoginPage = pathname?.startsWith('/login');
  const isRegistPage = pathname?.startsWith('/register');

  const isHideSidebar = isAdminPage || isLoginPage || isRegistPage;

  return (
    <LayoutContext.Provider value={{ openMenu: () => setIsMenuOpen(true) }}>
    <div className="flex bg-background min-h-screen w-full font-sans text-slate-100">
      {!isHideSidebar && <DesktopSidebar />}
      {!isHideSidebar && <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}

      {/* Global Fixed Notification Bell */}
      {!isHideSidebar && (
      <div className="fixed top-4 right-4 md:top-6 md:right-8 z-50">
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-10 h-10 md:w-12 md:h-12 bg-secondary/80 backdrop-blur-xl border border-border rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
          >
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute 0 top-0 right-0 md:top-1 md:right-1 w-3 h-3 bg-red-500 border-2 border-secondary rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {/* Dropdown Panel */}
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-14 right-0 w-[320px] md:w-[380px] bg-secondary/95 backdrop-blur-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-[1.5rem] overflow-hidden"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
                  <h3 className="font-bold text-white text-sm">알림 ({unreadCount})</h3>
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} className="text-xs font-bold text-primary hover:text-indigo-400 transition-colors">
                    모두 읽음 처리
                  </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto hide-scrollbar">
                  {notifications.length > 0 ? notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`p-4 border-b border-border/50 cursor-pointer transition-colors hover:bg-slate-800/80 flex gap-4 ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="mt-1">
                        {!notif.read ? (
                          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm mb-1 line-clamp-2 leading-tight ${!notif.read ? 'text-white font-medium' : 'text-slate-300'}`}>
                          {notif.text}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock size={10} /> {notif.time}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      새로운 알림이 없습니다.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      <div className={`flex-1 flex flex-col min-h-screen w-full focus:outline-none ${!isHideSidebar ? 'md:pl-64 lg:pl-72' : ''}`}>
        <main className={`flex-1 w-full mx-auto overflow-x-hidden ${!isHideSidebar ? 'max-w-screen-2xl pb-16 md:pb-8' : ''}`}>
          {children}
        </main>
        {!isHideSidebar && <BottomNav />}
      </div>
    </div>
    </LayoutContext.Provider>
  );
}
