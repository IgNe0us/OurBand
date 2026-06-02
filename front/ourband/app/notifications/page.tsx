"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Clock, CheckCircle2, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotificationsApi, markNotificationAsReadApi, NotificationData } from "@/api/notification/notificationService";
import { getReceivedOffersApi, RecruitmentOfferData } from "@/api/recruitment/recruitmentService";
import { useNotificationStore } from "@/store/notificationStore";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createOrGetRoomApi } from "@/api/chat/chatService";
import { useUserProfile } from "@/store/userProfileContext";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [offers, setOffers] = useState<RecruitmentOfferData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unreadCount = useNotificationStore(state => state.unreadCount);
  const setGlobalUnreadCount = useNotificationStore(state => state.setUnreadCount);
  const decrementUnreadCount = useNotificationStore(state => state.decrementUnreadCount);
  const { openUserProfile } = useUserProfile();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [data, offersData] = await Promise.all([
        getNotificationsApi(),
        getReceivedOffersApi().catch(() => []) // Silently fail offers if error
      ]);
      setNotifications(data);
      setOffers(offersData);
      setGlobalUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      for (const n of unreadNotifs) {
        await markNotificationAsReadApi(n.id);
      }
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setGlobalUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: number, isRead: boolean) => {
    if (isRead) return;
    try {
      await markNotificationAsReadApi(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      decrementUnreadCount();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getLinkForNotification = (n: NotificationData) => {
    switch (n.type) {
      case "RECRUIT_OFFER": {
        const match = n.targetId.match(/targetId=(\d+)/);
        if (match) {
          const offerId = Number(match[1]);
          const offer = offers.find(o => o.id === offerId);
          if (offer && offer.status !== "PENDING") {
            return null;
          }
        }
        return `/chat/${n.targetId}`; // targetId is roomId with params
      }
      case "BAND_APPLY": return `/band/${n.targetId}/board?tab=가입 신청`; // targetId is bandId
      case "JAM_LIKE":
      case "JAM_COMMENT":
      case "JAM_DUET": return `/jam?id=${n.targetId}`;
      case "POST_LIKE":
      case "POST_COMMENT": 
        if (n.content.includes("커뮤니티")) {
          return `/community/post/${n.targetId}`;
        }
        if (n.content.includes("마이페이지")) {
          return `/profile?historyId=${n.targetId}`;
        }
        return `/post/${n.targetId}`;
      case "INFO": return null;
      default: return null;
    }
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
        {isLoading ? (
          <div className="flex justify-center py-20 text-slate-500">
             <span className="animate-pulse">로딩 중...</span>
          </div>
        ) : notifications.length > 0 ? notifications.map(notif => {
          const link = getLinkForNotification(notif);
          const isEmergency = notif.type === "INFO" && notif.targetId === "emergency";
          const isClickable = link || isEmergency;
          const ContentWrapper = (link ? Link : "div") as any;
          return (
          <ContentWrapper 
            key={notif.id}
            {...(link ? { href: link } : {})}
            onClick={async (e: any) => {
              if (isEmergency) {
                e.preventDefault();
                if (notif.senderId) {
                  try {
                    const roomId = await createOrGetRoomApi(notif.senderId);
                    router.push(`/chat/${roomId}`);
                    markAsRead(notif.id, notif.isRead);
                    return;
                  } catch (err) {
                    toast.error("채팅방을 열 수 없습니다.");
                  }
                }
              }
              if (!link && notif.type === "RECRUIT_OFFER") {
                toast.custom((t) => (
                  <div
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      opacity: t.visible ? 1 : 0,
                      transition: "opacity 300ms ease-in-out",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderRadius: "14px",
                      background: "rgba(15, 23, 42, 0.8)",
                      backdropFilter: "blur(10px)",
                      color: "#f8fafc",
                      border: "1px solid rgba(51, 65, 85, 0.6)",
                      padding: "12px 20px",
                      fontSize: "15px",
                      fontWeight: "500",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>ℹ️</span>
                    <span>이미 처리된 제안입니다.</span>
                  </div>
                ), { position: "top-center", duration: 3000 });
              }
              markAsRead(notif.id, notif.isRead);
            }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all border border-transparent group",
              !notif.isRead ? "bg-primary/5 border-primary/20" : "",
              !isClickable ? "cursor-default opacity-60" : "hover:bg-slate-800/50 hover:border-border cursor-pointer"
            )}
          >
            {notif.senderProfileImageUrl ? (
                <img 
                  src={notif.senderProfileImageUrl} 
                  alt={notif.senderName} 
                  className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer" 
                  referrerPolicy="no-referrer" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (notif.senderId) openUserProfile(notif.senderId, notif.senderName, notif.senderProfileImageUrl || undefined);
                  }}
                />
            ) : (
                <div className="mt-1 shrink-0">
                  {!notif.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  )}
                </div>
            )}
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className={cn(
                "text-sm mb-1.5 leading-tight transition-colors", 
                !notif.isRead ? "text-white font-bold" : "text-slate-300",
                link ? "group-hover:text-primary" : ""
              )}>
                {notif.content}
              </p>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Clock size={12} /> {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ko })}
              </span>
            </div>

            {isClickable && (
              <div className="w-8 h-8 shrink-0 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary transition-colors group-hover:text-white text-slate-400 border border-border group-hover:border-primary">
                <ChevronRight size={16} />
              </div>
            )}
          </ContentWrapper>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Bell size={48} className="mb-4 opacity-50" />
            <p>새로운 알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}



