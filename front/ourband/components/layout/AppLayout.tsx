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

      {/* Removed Global Fixed Notification Bell */}

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
