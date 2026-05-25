"use client";
import { AudioJamModal } from "@/components/jam/AudioJamModal";
// @ts-nocheck

import React, { useState } from "react";
import { Share, Music2, MapPin, Zap, AtSign, ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { LayoutContextType } from "@/components/layout/AppLayout";
import { AnimatePresence, motion } from "motion/react";
import { UserProfileModal } from "@/components/common/UserProfileModal";
export default function ProfileIdDynamicPage() {
  const { userId } = useParams();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);;
  const [activeTab, setActiveTab] = useState<"Favorite Music" | "History" | "Gear">("Favorite Music");

  // Read-only mocked data for other user's profile
  const favoriteMusic = [
    "Radiohead - Creep", 
    "Coldplay - Yellow", 
    "Muse - Time is Running Out"
  ];

  const historyList = [
    { id: "1", title: "오아시스 커버곡 녹음", desc: "집에서 간단하게 쳐봤습니다.", type: "video" },
    { id: "2", title: "첫 합주", desc: "멤버들과의 첫 합주", type: "post" }
  ];

  const gearList = ["Fender Stratocaster", "Boss ME-80", "Focusrite Scarlett 2i2"];

  const [selectedHistory, setSelectedHistory] = useState<typeof historyList[0] | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [activeFollowModal, setActiveFollowModal] = useState<"follower" | "following" | null>(null);
  const [selectedFollowUser, setSelectedFollowUser] = useState<{ id: string | number; name: string; imageSeed?: string } | null>(null);

  const mockFollowers = [
    { id: '1', name: "드럼머신", imageSeed: "drum", isFollowing: true },
    { id: '2', name: "건반장인", imageSeed: "keyboard", isFollowing: false },
    { id: '3', name: "기타초보", imageSeed: "guitar", isFollowing: true },
  ];
  
  const mockFollowing = [
    { id: '4', name: "베이스왕", imageSeed: "bass", isFollowing: true },
    { id: '5', name: "보컬신", imageSeed: "vocal", isFollowing: true },
  ];

  // In a real app, fetch user data based on `userId`
  const userName = userId ? `유저 ${userId}` : "다른 사용자";

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 relative z-50">
      {/* Detail Header for UserProfile inside AppLayout but overlapping if needed, or simply let it scroll */}
      <div className="sticky top-0 z-[60] flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-white absolute left-1/2 -translate-x-1/2">프로필</h1>
        <button 
          onClick={() => alert("프로필 링크가 복사되었습니다!")}
          className="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Share size={20} />
        </button>
      </div>

      {/* Cover Profile */}
      <div className="relative h-48 md:h-64 bg-secondary border-b border-border">
        <img src={`https://picsum.photos/seed/usercover${userId}/800/400`} className="w-full h-full object-cover opacity-50" alt="Cover" referrerPolicy="no-referrer" />
        
        {/* Sleek soft gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
      </div>

      <div className="px-6 md:px-10 lg:px-16 -mt-16 relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-end mb-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-slate-800 overflow-hidden shadow-2xl relative">
            <img src={`https://picsum.photos/seed/userprofile${userId}/200/200`} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
          </div>
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className={cn("px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-sm font-bold shadow-lg transition-colors border", 
              isFollowing 
                ? "bg-secondary border-border text-slate-300 hover:bg-slate-800" 
                : "bg-primary border-transparent text-white shadow-primary/20 hover:bg-indigo-600"
            )}
          >
            {isFollowing ? "팔로잉" : "팔로우"}
          </button>
        </div>

        <div className="mb-8 md:mb-12 mt-2">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
            {userName}
            <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-lg border border-primary/20">Lv.10</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <AtSign size={14} className="text-slate-500" /> user_{userId}
          </p>
          
          <div className="flex flex-wrap items-center gap-2 text-sm mb-5">
            <span className="flex items-center gap-1.5 text-slate-300 bg-secondary border border-border px-3 py-1.5 rounded-lg font-bold text-xs">
               <Zap size={14} className="text-yellow-500 fill-yellow-500" /> 음악력 30.0
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 bg-secondary border border-border px-3 py-1.5 rounded-lg font-bold text-xs">
               <MapPin size={14} className="text-primary" /> 마포구
            </span>
          </div>
          
          <p className="text-slate-300 text-sm leading-relaxed font-light md:w-2/3">"음악을 사랑하는 직장인입니다. 주말 밴드활동 원해요!"</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            {/* Stats */}
            <section className="mb-10 bg-secondary/50 border border-border rounded-2xl p-5 grid grid-cols-3 gap-4 items-center text-center">
              <div>
                 <div className="text-2xl font-black text-white mb-1">5</div>
                 <div className="text-xs font-medium text-slate-500">참여 잼</div>
              </div>
              <div className="border-x border-border cursor-pointer group" onClick={() => setActiveFollowModal("follower")}>
                 <div className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors">120</div>
                 <div className="text-xs font-medium text-slate-500">팔로워</div>
              </div>
              <div className="cursor-pointer group" onClick={() => setActiveFollowModal("following")}>
                 <div className="text-2xl font-black text-white mb-1 group-hover:text-primary transition-colors">15</div>
                 <div className="text-xs font-medium text-slate-500">팔로잉</div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            {/* Sleek Tab Navigation */}
            <div className="flex border-b border-border mb-6">
              {["Favorite Music", "History", "Gear"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "flex-1 pb-3 text-sm font-bold transition-colors relative",
                    activeTab === tab ? "text-white" : "text-slate-600 hover:text-slate-400"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div layoutId="user-tab-indicator" className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "Favorite Music" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">
                {favoriteMusic.map((song, idx) => (
                  <div key={`fav-${idx}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-600 text-xs font-mono font-bold w-4">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-sm font-medium text-slate-200">{song}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === "History" && (
              <div className="space-y-4">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                   {historyList.map((history, idx) => (
                      <div key={`history-${history.id}-${idx}`} className="bg-secondary/40 border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group flex flex-col relative" onClick={() => setSelectedHistory(history)}>
                         <div className="relative overflow-hidden bg-slate-800 shrink-0 aspect-[3/4]">
                            <img src={`https://picsum.photos/seed/history${history.id}/600/800`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100" alt="history" referrerPolicy="no-referrer" />
                         </div>
                         <div className="p-4 md:p-5 text-left flex flex-col flex-1 bg-secondary/20">
                            <h4 className="text-sm md:text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{history.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{history.desc}</p>
                         </div>
                      </div>
                   ))}
                 </div>
              </div>
            )}

            {activeTab === "Gear" && (
              <div className="bg-secondary border border-border rounded-2xl p-2 shadow-xl">
                 {gearList.length === 0 ? (
                   <div className="text-center py-12 text-slate-500">
                     <Music2 size={32} className="mx-auto mb-3 opacity-30" />
                     <p className="font-medium text-sm">등록된 장비가 없습니다.</p>
                   </div>
                 ) : (
                   gearList.map((gear, idx) => (
                     <div key={`gear-${idx}`} className="flex items-center justify-between p-4 border-b border-border last:border-0 rounded-xl hover:bg-white/5 transition-colors">
                       <div className="flex items-center gap-4">
                         <span className="text-primary text-xs font-mono font-bold w-4">#{idx + 1}</span>
                         <span className="text-sm font-medium text-slate-200">{gear}</span>
                       </div>
                     </div>
                   ))
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Detail Modal */}
      <AudioJamModal
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        isHistory={true}
        post={selectedHistory ? {
          id: String(selectedHistory.id),
          title: selectedHistory.title,
          date: "최근",
          thumbnail: `https://picsum.photos/seed/history${selectedHistory.id}/600/800`,
          description: selectedHistory.desc,
          likes: 42,
          author: userName,
          type: selectedHistory.type as "post" | "video"
        } : null}
      />

      {/* Follow/Following Modal */}
      <AnimatePresence>
        {activeFollowModal && (
          <motion.div 
            key="follow-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveFollowModal(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-xl h-[75vh] rounded-t-3xl border-t border-border flex flex-col shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h3 className="font-bold text-white text-lg">
                  {activeFollowModal === "follower" ? "팔로워" : "팔로잉"} 
                  <span className="text-primary ml-2">{activeFollowModal === "follower" ? mockFollowers.length : mockFollowing.length}</span>
                </h3>
                <button onClick={() => setActiveFollowModal(null)} className="p-1 text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {(activeFollowModal === "follower" ? mockFollowers : mockFollowing).map((user, idx) => (
                  <div 
                    key={`follow-user-${user.id}-${idx}`} 
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer group"
                    onClick={() => {
                      setActiveFollowModal(null);
                      setSelectedFollowUser(user);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-border overflow-hidden">
                        <img src={`https://picsum.photos/seed/${user.imageSeed}/100/100`} alt={user.name} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{user.name}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserProfileModal 
        isOpen={!!selectedFollowUser}
        onClose={() => setSelectedFollowUser(null)}
        userId={selectedFollowUser?.id}
        userName={selectedFollowUser?.name}
      />
    </div>
  );
}
