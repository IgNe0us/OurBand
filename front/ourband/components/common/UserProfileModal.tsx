"use client";
// @ts-nocheck

import { X, UserPlus, UserCheck, MessageCircle, MapPin, Music2, Users2, Guitar, History, Disc, Play, ThumbsUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioJamModal, type PopularJamVideo } from "../jam/AudioJamModal";
import { cn } from "@/lib/utils";;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | number;
  userName?: string;
  userImage?: string;
}

export function UserProfileModal({ isOpen, onClose, userId = 1, userName = "유저 이름", userImage }: UserProfileModalProps) {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [selectedActivity, setSelectedActivity] = useState<PopularJamVideo | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const mockPostActivity: PopularJamVideo = {
    id: "act-1",
    title: "스트라토캐스터 픽업 교체 질문 있습니다.",
    description: "싱싱험 사용중인데 리어 픽업 출력이 너무 약해서 교체하려고 합니다. 톤을 조금 더 두껍게 만들고 싶은데 추천해주실 만한 픽업이 있을까요?\\n\\nSeymour Duncan JB나 험버커 사이즈의 P90도 고려중입니다. 조언 부탁드려요!",
    author: userName,
    date: "2일 전",
    thumbnail: "https://picsum.photos/seed/setup1/600/800",
    likes: 12,
    commentsCount: 5,
    type: "post"
  };

  const mockVideoActivity: PopularJamVideo = {
    id: "act-2",
    title: "블루스 백킹 트랙 기타 즉흥 연주",
    date: "3일 전",
    thumbnail: "https://picsum.photos/seed/jamimg1/600/800",
    description: "주말에 집에서 혼자 잼해본 블루스 즉흥연주입니다. 펜더 스트랫 + 헬릭스 조합입니다.",
    author: userName,
    likes: 48,
    commentsCount: 15,
    type: "video"
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto hide-scrollbar bg-background border border-border rounded-3xl shadow-2xl relative flex flex-col"
          >
            {/* Cover */}
            <div className="h-28 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-b border-border/50 shrink-0 relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors z-10">
                <X size={18} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="px-6 pb-6 relative pt-12 text-left shrink-0">
              <div 
                className="absolute -top-14 left-6 w-24 h-24 rounded-full border-4 border-background bg-slate-800 overflow-hidden shadow-lg cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${userId}`);
                }}
              >
                {userImage ? (
                  <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Music2 size={32} />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 w-full mb-6 relative z-10 -mt-8">
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-1.5",
                    isFollowing
                      ? "bg-secondary border border-border text-white hover:bg-slate-800 shadow-none"
                      : "bg-primary text-white hover:bg-indigo-600 shadow-primary/20"
                  )}
                >
                  {isFollowing ? (
                    <><UserCheck size={16} /> 팔로잉</>
                  ) : (
                    <><UserPlus size={16} /> 팔로우</>
                  )}
                </button>
                <button 
                  onClick={() => {
                    onClose();
                    navigate(`/chat/${userId}?type=direct&name=${encodeURIComponent(userName)}`);
                  }}
                  className="bg-secondary border border-border hover:bg-slate-800 text-white p-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center"
                >
                  <MessageCircle size={18} />
                </button>
              </div>

              <h3 
                className="text-2xl font-black text-white mb-1 cursor-pointer hover:text-primary transition-colors flex items-center gap-2 w-fit"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${userId}`);
                }}
              >
                {userName}
              </h3>
              <p className="text-sm text-primary font-bold mb-3">일렉트릭 기타 • 보컬</p>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-6 border border-border/50 bg-secondary/50 rounded-xl py-1.5 px-3 inline-flex">
                <MapPin size={14} /> 서울특별시 마포구
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed mb-8 font-light line-clamp-3">
                음악을 사랑하는 평범한 직장인입니다. 주로 주말에 홍대나 합정에서 합주하며 잼 하는 걸 좋아해요. 블루스와 펑크를 즐겨 연주합니다!
              </p>
              
              <div className="space-y-8 border-t border-border/50 pt-8">
                {/* Posts & Videos */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <History size={16} className="text-primary"/> 최근 활동
                  </h4>
                  <div className="flex flex-col gap-3">
                    {/* Post */}
                    <div 
                      onClick={() => setSelectedActivity(mockPostActivity)}
                      className="p-3 bg-secondary border border-border rounded-xl cursor-pointer hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">장비질문</span>
                        <span className="text-[10px] text-slate-500">2일 전</span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1 line-clamp-1">스트라토캐스터 픽업 교체 질문 있습니다.</h5>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">싱싱험 사용중인데 리어 픽업 출력이 너무 약해서 교체하려고 합니다. 톤을 조금 더 두껍게 만들고 싶은데 추천해주실 만한...</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><ThumbsUp size={12}/> 12</span>
                        <span className="flex items-center gap-1"><MessageCircle size={12}/> 5</span>
                      </div>
                    </div>
                    {/* Video Jam */}
                    <div 
                      onClick={() => setSelectedActivity(mockVideoActivity)}
                      className="flex gap-3 p-3 bg-secondary border border-border rounded-xl cursor-pointer hover:border-slate-600 transition-colors"
                    >
                      <div className="w-24 h-16 rounded-md bg-slate-800 shrink-0 overflow-hidden relative">
                         <img src="https://picsum.photos/seed/jamimg1/200/100" className="w-full h-full object-cover opacity-80" alt="jam" referrerPolicy="no-referrer" />
                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                           <Play size={16} className="text-white fill-white/80 drop-shadow-md" />
                         </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded w-fit mb-1 border border-rose-500/20">잼 (Jam)</span>
                        <h5 className="text-sm font-bold text-white line-clamp-1 mb-1">블루스 백킹 트랙 기타 즉흥 연주</h5>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="flex items-center gap-1"><ThumbsUp size={12}/> 48</span>
                          <span>3일 전</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 소속 밴드 */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Users2 size={16} className="text-primary"/> 소속 밴드
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border hover:border-slate-600 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                          <img src="https://picsum.photos/seed/band1/100/100" className="w-full h-full object-cover" alt="band"/>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white leading-tight">Neon Dreams</div>
                          <div className="text-xs text-slate-400">신스팝 / 인디록</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 rounded-md text-slate-300">리드 기타</span>
                    </div>
                  </div>
                </section>

                {/* 사용 장비 */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Guitar size={16} className="text-primary"/> 사용 장비 (Gear)
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-300 bg-secondary/30 p-4 rounded-xl border border-border/50">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary/50 flex-shrink-0 mt-1.5 rounded-full" />
                      Fender American Pro II Stratocaster
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary/50 flex-shrink-0 mt-1.5 rounded-full" />
                      Gibson Les Paul Standard '50s
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary/50 flex-shrink-0 mt-1.5 rounded-full" />
                      Line 6 Helix Floor
                    </li>
                  </ul>
                </section>

                {/* Favorite Music */}
                <section>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <Disc size={16} className="text-primary"/> Favorite Music
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">John Mayer</span>
                    <span className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">Oasis</span>
                    <span className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">Red Hot Chili Peppers</span>
                    <span className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">Stevie Ray Vaughan</span>
                    <span className="bg-slate-800 border border-border text-slate-300 text-xs px-3 py-1.5 rounded-lg">City Pop</span>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    <AudioJamModal 
      isOpen={!!selectedActivity} 
      onClose={() => setSelectedActivity(null)} 
      post={selectedActivity} 
      isHistory={true}
    />
    </>
  );
}
