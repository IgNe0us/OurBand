"use client";

// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2, XCircle, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { getUserInfoApi } from "@/api/account/userService";
import { getChatMessagesApi, markRoomAsReadApi, getMyChatRoomsApi, ChatMessageResponseDTO } from "@/api/chat/chatService";
import { webSocketService } from "@/api/chat/webSocketService";
import { useChatStore } from "@/store/chatStore";
import { acceptApplicationApi, rejectApplicationApi } from "@/api/band/bandService";
import { acceptOfferApi, rejectOfferApi, getReceivedOffersApi, RecruitmentOfferData } from "@/api/recruitment/recruitmentService";
import { toast } from "react-hot-toast";

export default function ChatIdDynamicPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = Number(params.id);
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "apply" or "offer"
  const targetId = searchParams.get("targetId"); 

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessageResponseDTO[]>([]);
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">(type === "apply" || type === "offer" ? "pending" : "accepted");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [targetUser, setTargetUser] = useState<{name: string, profileImage: string | null}>({ name: "대화방", profileImage: null });
  const [offerDetails, setOfferDetails] = useState<RecruitmentOfferData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "offer" && targetId) {
      getReceivedOffersApi()
        .then(offers => {
          const found = offers.find(o => o.id === Number(targetId));
          if (found) {
            setOfferDetails(found);
            if (found.status !== "PENDING") {
              toast.error("이미 처리된 제안입니다.");
              router.replace("/notifications");
            }
          }
        })
        .catch(err => console.error("Failed to load offer details", err));
    }
  }, [type, targetId, router]);
  const setTotalUnreadCount = useChatStore((state) => state.setTotalUnreadCount);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // On initial load only
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length > 0]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const me = await getUserInfoApi();
        setCurrentUserId(me.userId);
        await markRoomAsReadApi(roomId);
        
        // 1. 방 정보 가져오기 & 글로벌 안읽은 개수 동기화
        const rooms = await getMyChatRoomsApi().catch(() => []);
        const totalUnread = rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
        setTotalUnreadCount(totalUnread);
        
        const roomInfo = rooms.find(r => r.roomId === roomId);
        if (roomInfo) {
          setTargetUser({
            name: roomInfo.targetUserName,
            profileImage: roomInfo.targetUserProfileUrl
          });
        }

        // 2. 메시지 가져오기
        const msgs = await getChatMessagesApi(roomId);
        setMessages(msgs);

        // 3. 웹소켓 방 구독
        webSocketService.subscribeRoom(roomId, (newMsg: ChatMessageResponseDTO) => {
          setMessages(prev => {
            if (prev.some(m => m.messageId === newMsg.messageId)) return prev;
            return [...prev, newMsg];
          });
          // 새 메시지가 오면 읽음 처리 (선택사항, 백엔드에서 자동 처리될 수도 있음)
          markRoomAsReadApi(roomId).catch(() => {});
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }, 100);
        });

      } catch (err) {
        console.error("Failed to load chat", err);
      }
    };
    initChat();

    return () => {
      webSocketService.unsubscribeRoom();
    };
  }, [roomId, setTotalUnreadCount]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId) return;
    
    try {
      webSocketService.sendMessage(roomId, message);
      setMessage("");
      // 메시지 추가는 웹소켓 구독 콜백에서 처리되므로 여기서 수동으로 추가하지 않습니다.
    } catch (err) {
      toast.error("메시지 전송에 실패했습니다.");
    }
  };

  const handleAccept = async () => {
    if (!targetId) return;
    try {
      if (type === "apply") {
        await acceptApplicationApi(targetId);
      } else if (type === "offer") {
        await acceptOfferApi(targetId);
      }
      setStatus("accepted");
      toast.success("수락되었습니다.", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "수락 처리에 실패했습니다.", { position: "top-center" });
    }
  };

  const handleReject = async () => {
    if (!targetId) return;
    try {
      if (type === "apply") {
        await rejectApplicationApi(targetId);
      } else if (type === "offer") {
        await rejectOfferApi(targetId);
      }
      setStatus("rejected");
      toast.success("거절되었습니다.", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "거절 처리에 실패했습니다.", { position: "top-center" });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative max-w-2xl mx-auto border-x border-border overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 bg-secondary/80 backdrop-blur-xl border-b border-border flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {targetUser.profileImage ? (
                <img src={targetUser.profileImage} alt={targetUser.name} className="w-full h-full object-cover" />
              ) : (
                <User className="text-slate-500" />
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h2 className="text-white font-bold text-base truncate">{targetUser.name}</h2>
              <p className="text-xs text-primary truncate">{type === "apply" ? "밴드 지원자" : type === "offer" ? "밴드 마스터" : "일반 대화"}</p>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white">
          <Info size={24} />
        </button>
      </header>

      {/* Action Banner (Accept/Reject) */}
      <AnimatePresence>
        {status === "pending" && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="shrink-0 mx-4 mt-4"
          >
            <div className="bg-secondary/90 backdrop-blur-lg border border-primary/30 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {type === "apply" ? "새로운 밴드 합류 요청" : 
                       type === "offer" && offerDetails ? `${offerDetails.bandName} 밴드 ${offerDetails.position} 포지션으로 영입 제안 되었습니다.` : 
                       "새로운 밴드 영입 제안"}
                    </h3>
                    <p className="text-xs text-slate-400 whitespace-pre-wrap">
                      {type === "apply" ? "프로필을 확인하고 가입을 수락 또는 거절을 선택해주세요." : 
                       type === "offer" && offerDetails ? (offerDetails.message || "조건을 확인하고 영입 제안을 수락 또는 거절을 선택해주세요.") : 
                       "조건을 확인하고 영입 제안을 수락 또는 거절을 선택해주세요."}
                    </p>
                  </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleReject}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-background border border-border text-slate-300 rounded-xl hover:text-rose-400 hover:border-rose-400/50 hover:bg-rose-500/10 transition-colors text-sm font-bold flex-1"
                  >
                    <XCircle size={16} /> 거절
                  </button>
                  <button 
                    onClick={handleAccept}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl hover:bg-indigo-500 transition-all text-sm font-bold flex-1 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] hover:scale-105"
                  >
                    <CheckCircle2 size={16} /> 수락
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          // Format time (assuming msg.createdAt is ISO string)
          const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={msg.messageId} 
              className={cn("flex flex-col w-full", isMe ? "items-end" : "items-start")}
            >
              <div className="flex items-end gap-2 max-w-[80%]">
                {isMe && <span className="text-[10px] text-slate-500 mb-1 shrink-0">{timeStr}</span>}
                <div className={cn(
                  "px-5 py-3 rounded-2xl text-sm shadow-md whitespace-pre-wrap",
                  isMe 
                    ? "bg-primary text-white rounded-br-sm" 
                    : "bg-secondary border border-border text-slate-200 rounded-bl-sm"
                )}>
                  {msg.content}
                </div>
                {!isMe && <span className="text-[10px] text-slate-500 mb-1 shrink-0">{timeStr}</span>}
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Chat Input */}
      <footer className="p-4 bg-background/80 backdrop-blur-xl border-t border-border shrink-0 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "rejected"}
            placeholder={status === "rejected" ? "대화가 종료되었습니다." : "메시지를 입력하세요..."} 
            className="flex-1 bg-secondary/80 border border-border rounded-full px-5 py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!message.trim() || status === "rejected"}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-lg"
          >
            <Send size={18} className="translate-x-0.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}

