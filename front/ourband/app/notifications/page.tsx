"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Notifications Data
const INITIAL_NOTIFICATIONS = [
  { id: 1, type: "apply", text: "신스팝 밴드 네온사인에서 영입 제안이 왔습니다.", time: "10분 전", read: false, link: "/chat/1?type=offer&targetId=1" },
  { id: 2, type: "system", text: "루비스파크님의 프로필이 주간 인기 톱퍼에 선정되었습니다!", time: "2시간 전", read: true, link: "/profile" },
  { id: 3, type: "community", text: "회원님의 게시글에 새로운 댓글이 달렸습니다.", time: "어제", read: true, link: "/community/free/1" },
  { id: 4, type: "jam", text: "베이스깎는노인님이 새로운 오디오잼을 업로드했습니다.", time: "어제", read: true, link: "/jam" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background border-x border-border max-w-3xl mx-auto">
      {/* Header */}
      <header className="shrink-0 px-6 py-5 bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Bell className="text-primary" /> 
          알림
        </h1>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-primary hover:text-indigo-400 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <CheckCircle2 size={14} /> 모두 읽음 처리
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {notifications.length > 0 ? notifications.map(notif => (
          <Link 
            key={notif.id}
            href={notif.link}
            onClick={() => markAsRead(notif.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-border group",
              !notif.read ? "bg-primary/5 border-primary/20" : ""
            )}
          >
            <div className="mt-1 shrink-0">
              {!notif.read ? (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className={cn(
                "text-sm mb-1.5 leading-tight group-hover:text-primary transition-colors", 
                !notif.read ? "text-white font-bold" : "text-slate-300"
              )}>
                {notif.text}
              </p>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Clock size={12} /> {notif.time}
              </span>
            </div>

            <div className="w-8 h-8 shrink-0 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors group-hover:text-white text-slate-400 border border-border group-hover:border-primary">
              <ChevronRight size={16} />
            </div>
          </Link>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Bell size={48} className="mb-4 opacity-50" />
            <p>새로운 알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
