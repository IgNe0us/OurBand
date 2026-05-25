"use client";
import { useContext } from "react";

// @ts-nocheck
import { LayoutContext } from "@/components/layout/AppLayout";

import { Play, Heart, MessageCircle, Share2, Plus, Music2, Menu, Pause, X, Copy, Send, Disc, Image as ImageIcon, Video, Mic, Check } from "lucide-react";

import type { LayoutContextType } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";;
import { motion, AnimatePresence } from "motion/react";

const VIDEOS = [
  { id: 1, img: "jam1", inst: "기타", style: "TomMisch스타일", title: "여기에 기타 솔로 얹어주실 분! 🎸", author: "드럼머신", commentsCount: 48, sharesCount: 12 },
  { id: 2, img: "jam2", inst: "보컬", style: "R&B", title: "이 진행에 탑라인(멜로디) 짜주세요", author: "비트메이커", commentsCount: 15, sharesCount: 3 }
];

export default function JamPage() {
  const { openMenu } = useContext(LayoutContext);
  const [playingId, setPlayingId] = useState<number | null>(1);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  
  // Modals state
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  const [activeShareId, setActiveShareId] = useState<number | null>(null);
  const [activeDuetId, setActiveDuetId] = useState<number | null>(null);
  
  // Comments state
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<number, any[]>>({
    1: [
      { id: 1, author: "베이스치는사람", text: "와 톤 너무 좋네요 ㅠㅠ 같이 잼해보고 싶습니다!", time: "10분 전" },
      { id: 2, author: "건반초보", text: "진행이 쫀쫀해서 너무 재밌게 들었어요!", time: "2시간 전" }
    ],
    2: [
      { id: 1, author: "보컬지망생", text: "라인 한번 짜보고 있습니다 대기해주세요!", time: "30분 전" }
    ]
  });

  // Duet recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRecording(false);
            return 100;
          }
          return prev + 1;
        });
      }, 100);
    } else if (!isRecording && recordProgress === 100) {
      setTimeout(() => {
        alert("듀엣 영상이 성공적으로 업로드되었습니다!");
        setActiveDuetId(null);
        setRecordProgress(0);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordProgress]);

  const togglePlay = (id: number) => {
    setPlayingId(prev => prev === id ? null : id);
  };

  const toggleLike = (id: number) => {
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleFollow = (author: string) => {
    setFollowingMap(prev => ({ ...prev, [author]: !prev[author] }));
  };

  const handleAddComment = (videoId: number) => {
    if (!commentText.trim()) return;
    setComments(prev => ({
      ...prev,
      [videoId]: [
        { id: Date.now() + Math.random(), author: "내아이디", text: commentText, time: "방금 전" },
        ...(prev[videoId] || [])
      ]
    }));
    setCommentText("");
  };

  const handleCopyLink = () => {
    alert("링크가 클립보드에 복사되었습니다.");
    setActiveShareId(null);
  };

  return (
    <div className="h-screen w-full bg-background snap-y snap-mandatory overflow-y-scroll hide-scrollbar pb-16 relative">
      {/* Top Bar overlay */}
      <div className="absolute top-0 w-full z-20 flex pt-12 text-center pb-4 md:pt-14 px-6 md:px-8 bg-gradient-to-b from-background/80 to-transparent pointer-events-none items-center justify-between">
        <button onClick={openMenu} className="md:hidden text-white drop-shadow-md pointer-events-auto">
          <Menu size={28} />
        </button>
        <div className="flex gap-4 absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <span className="text-white/60 font-semibold text-lg drop-shadow-md cursor-pointer hover:text-white">팔로잉</span>
          <span className="text-white font-bold text-lg border-b-2 border-white pb-1 drop-shadow-md cursor-pointer">추천 잼</span>
        </div>
        <div className="w-7 md:hidden" /> {/* Spacer for centering */}
      </div>

      {VIDEOS.map((v, idx) => {
        const isPlaying = playingId === v.id;
        const isLiked = likedMap[v.id];
        
        return (
          <div key={`jam-video-${v.id}-${idx}`} className="h-screen w-full snap-start relative overflow-hidden bg-secondary flex justify-center">
            <div className="relative w-full h-full max-w-xl md:border-x md:border-border/50">
              <img src={`https://picsum.photos/seed/${v.img}/400/800`} className="absolute inset-0 w-full h-full md:object-contain object-cover opacity-70" alt="Jam background" referrerPolicy="no-referrer" />
              
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/90 pointer-events-none" />

              {/* Fake Video Player interaction area */}
              <div 
                className="absolute inset-0 cursor-pointer z-0 flex items-center justify-center"
                onClick={() => togglePlay(v.id)}
              >
                {!isPlaying && (
                  <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 shadow-2xl transition-transform scale-110">
                    <Play size={40} className="ml-2" fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Right Action Bar */}
              <div className="absolute right-4 bottom-28 md:bottom-32 flex flex-col items-center gap-7 z-10 pointer-events-auto">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden shadow-lg cursor-pointer">
                    <img src={`https://picsum.photos/seed/${v.author}/100/100`} alt="User" referrerPolicy="no-referrer" />
                  </div>
                  <AnimatePresence>
                    {!followingMap[v.author] && (
                      <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => toggleFollow(v.author)}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-background cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Plus size={14} className="text-white" />
                      </motion.button>
                    )}
                    {followingMap[v.author] && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 rounded-full p-0.5 border-2 border-background pointer-events-none"
                      >
                        <Check size={14} className="text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <button 
                  onClick={() => toggleLike(v.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={cn(
                    "w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all",
                    isLiked ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-transparent" : "bg-background/20 border border-border group-hover:bg-white/10 text-white"
                  )}>
                    <Heart size={24} className={cn(isLiked && "fill-white", isLiked && "scale-110 transition-transform")} />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-md">
                    {isLiked ? '1.3k' : '1.2k'}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveCommentId(v.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                    <MessageCircle size={24} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-md">{v.commentsCount + (comments[v.id]?.length || 0) - (v.id === 1 ? 2 : 1)}</span>
                </button>
                <button 
                  onClick={() => setActiveShareId(v.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                    <Share2 size={24} className="text-white" />
                  </div>
                  <span className="text-white text-xs font-semibold drop-shadow-md">{v.sharesCount}</span>
                </button>

                {/* Jam Button - Core Feature */}
                <button 
                  onClick={() => setActiveDuetId(v.id)}
                  className="mt-4 flex flex-col items-center gap-1 group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] group-hover:scale-110 transition-transform cursor-pointer border-2 border-white/20">
                    <Music2 size={24} className="text-white fill-white" />
                  </div>
                  <span className="font-black text-white text-[10px] tracking-widest mt-1">DUET</span>
                </button>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-16 md:bottom-20 left-0 w-3/4 md:w-2/3 p-5 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-md text-[11px] font-bold border border-white/20">오디오 듀엣 챌린지</span>
                  <span className="text-primary text-[11px] font-bold flex items-center gap-1 bg-background/40 px-2 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    구인 중
                  </span>
                </div>
                <h2 className="text-white font-black text-xl md:text-2xl mb-2 leading-tight drop-shadow-lg">{v.title}</h2>
                <p className="text-slate-300 text-sm mb-4 font-light drop-shadow-md">#{v.inst} #{v.style} #잼세션</p>
                
                {/* Audio Waveform visualization mockup */}
                <div className="w-full h-10 flex items-end gap-1 mb-2 bg-background/20 p-2 rounded-xl backdrop-blur-sm border border-border">
                  {[...Array(30)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-indigo-500/80 to-purple-400 rounded-t-sm transition-all duration-300" 
                      style={{ 
                        height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : '15%',
                        opacity: isPlaying ? 1 : 0.4
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Modals */}
      <AnimatePresence>
        {/* Comments Modal (Bottom Sheet style) */}
        {activeCommentId && (
          <motion.div key="comment-modal" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveCommentId(null)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-xl h-[70vh] rounded-t-3xl border-t border-border flex flex-col shadow-2xl relative"
            >
              <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                <h3 className="font-bold text-white">댓글 <span className="text-primary">{VIDEOS.find(v => v.id === activeCommentId)?.commentsCount! + (comments[activeCommentId]?.length || 0) - (activeCommentId === 1 ? 2 : 1)}</span></h3>
                <button onClick={() => setActiveCommentId(null)} className="p-1 text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(comments[activeCommentId] || []).map((c, idx) => (
                  <div key={`jam-comment-${c.id}-${idx}`} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border overflow-hidden">
                      <img src={`https://picsum.photos/seed/${c.author}/100/100`} alt="user" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-300">{c.author}</span>
                        <span className="text-xs text-slate-500">{c.time}</span>
                      </div>
                      <p className="text-sm text-white">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border shrink-0 bg-secondary flex gap-2 items-end">
                <textarea 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="댓글 추가..." 
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-white resize-none h-11 min-h-[44px] max-h-32 focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={() => handleAddComment(activeCommentId)}
                  disabled={!commentText.trim()}
                  className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-slate-700"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Share Modal */}
        {activeShareId && (
          <motion.div key="share-modal" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setActiveShareId(null)}
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()} 
              className="bg-secondary w-full max-w-sm rounded-[2rem] p-6 border border-border shadow-2xl relative"
            >
              <button onClick={() => setActiveShareId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
              <h2 className="text-xl font-black text-white mb-6 text-center">어디로 공유할까요?</h2>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { icon: MessageCircle, color: "bg-yellow-400", name: "카카오" },
                  { icon: Share2, color: "bg-blue-500", name: "트위터" },
                  { icon: Plus, color: "bg-purple-500", name: "더보기" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", item.color)}>
                      <item.icon size={24} className="text-white" />
                    </div>
                    <span className="text-xs text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-background border border-border hover:border-primary text-white font-bold py-3 text-sm rounded-xl transition-colors"
              >
                <Copy size={16} /> 링크 복사하기
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* DUET Recording Modal */}
        {activeDuetId && (
          <motion.div key="duet-modal" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex flex-col bg-black overflow-hidden"
          >
            {/* Header */}
            <div className="absolute top-0 w-full z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
              <button onClick={() => !isRecording && setActiveDuetId(null)} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                <X size={20} />
              </button>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/30 flex items-center gap-2">
                <Disc size={14} className={cn(isRecording && "animate-spin")} />
                {isRecording ? "녹음 중..." : "듀엣 준비"}
              </div>
            </div>

            {/* Content (Split Screen Simulation) */}
            <div className="flex-1 flex flex-col md:flex-row h-full">
              {/* Original Video */}
              <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/20 bg-slate-900">
                <img src={`https://picsum.photos/seed/${VIDEOS.find(v => v.id === activeDuetId)?.img}/400/800`} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Original" referrerPolicy="no-referrer" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-white text-xs font-bold px-2 py-1 bg-white/20 rounded-md">Original</span>
                  <p className="text-white/80 text-sm mt-1 truncate">{VIDEOS.find(v => v.id === activeDuetId)?.author}</p>
                </div>
              </div>
              
              {/* My Camera/Recording */}
              <div className="flex-1 relative bg-slate-800">
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center text-slate-500">
                     <Video size={32} />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">카메라를 비추고 악기를 준비하세요</p>
                </div>
                
                {/* Recording Progress Line */}
                {isRecording && (
                  <div className="absolute top-0 left-0 h-1 bg-red-500 transition-all duration-100 ease-linear" style={{ width: `${recordProgress}%` }} />
                )}

                <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <span className="text-primary text-xs font-bold px-2 py-1 bg-primary/20 rounded-md border border-primary/30">My Jam</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="h-32 bg-black pb-8 pt-4 flex flex-col items-center justify-center shrink-0">
              <button 
                onClick={() => setIsRecording(!isRecording)}
                className="relative group"
              >
                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300", isRecording ? "border-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "border-white hover:scale-105")}>
                  <div className={cn("bg-red-500 rounded-full transition-all duration-300", isRecording ? "w-6 h-6 rounded-md" : "w-12 h-12")} />
                </div>
              </button>
              <p className="text-white/60 text-xs mt-3 font-medium">
                {isRecording ? "터치해서 중지" : "빨간 버튼을 눌러 잼 시작"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
