"use client";
// @ts-nocheck
import { Play, Heart, MessageCircle, Share2, Plus, X, Send, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { VideoPost } from "../band/VideoPostModal";
import { addHistoryCommentApi, increaseHistoryShareApi, toggleHistoryLikeApi } from "@/api/account/userService";
import { apiClient } from "@/api/baseApi";

export type PopularJamVideo = VideoPost & { 
  likes?: number; 
  likedByMe?: boolean;
  author?: string; 
  authorAvatar?: string;
  commentsCount?: number; 
  sharesCount?: number; 
  inst?: string; 
  style?: string;
  type?: "video" | "post";
};

interface AudioJamModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PopularJamVideo | null;
  isHistory?: boolean;
}

// 💡 서버에서 온 ISO 날짜 문자열을 인간이 읽기 쉬운 상대 시간으로 변환하는 함수
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "알 수 없음";
  
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  // 7일 이상 지난 댓글은 날짜 형태로 출력 (예: 2026. 05. 23.)
  return past.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export function AudioJamModal({ isOpen, onClose, post, isHistory = false }: AudioJamModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [localShares, setLocalShares] = useState(0);
  
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  
  const [commentText, setCommentText] = useState("");
  // 💡 히스토리인 경우 더미 댓글 배열을 비워둠으로써 실시간 카운트 동기화 방해를 막습니다.
  const [comments, setComments] = useState<any[]>([]);

  // 💡 1. 비디오 엘리먼트를 제어하기 위한 ref 추가
  const videoRef = useRef<HTMLVideoElement>(null);

  // 💡 2. isPlaying 상태 변화에 따라 비디오를 진짜로 play / pause 시켜주는 로직
  useEffect(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.play().catch(err => {
        console.error("비디오 재생 실패:", err);
      });
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isOpen && post) {
      setIsPlaying(false);
      setIsFollowing(false);

      setIsLiked(post.likedByMe ?? false);
      setLocalLikes(post.likes ?? 0);
      setLocalShares(post.sharesCount ?? 0);
      if (isHistory) {
        // 💡 8082 백엔드 포트로 진짜 댓글 목록 GET 요청 실행
        apiClient.get(`/users/history/${post.id}/comments`,)
          .then(res => {
            // 백엔드의 HistoryCommentResponse 규격을 프론트 UI 맞춤형 배열로 빌드
            const mapped = res.data.map((c: any) => ({
              id: c.id,
              author: c.author,
              avatar: c.profilePictureUrl || "https://picsum.photos/seed/default/100/100",
              text: c.content,
              time: formatRelativeTime(c.createdAt) // 필요 시 포맷팅 함수 연동 가능
            }));
            setComments(mapped);
          })
          .catch(err => {
            console.error("실제 댓글 목록 로드 실패:", err);
            setComments([]);
          });
      }

    }
  }, [isOpen, post, isHistory]);

  if (!isOpen || !post) return null;

  const togglePlay = () => setIsPlaying(!isPlaying);
  // 💡 좋아요 토글 로직 최적화
  const toggleLike = async () => {
    const nextLikeState = !isLiked;
    setIsLiked(nextLikeState); // UI 하트 불빛 선반영
    setLocalLikes(prev => nextLikeState ? prev + 1 : prev - 1); // 숫자 카운트 선반영
    
    try {
      await toggleHistoryLikeApi(post.id, nextLikeState);
    } catch (err) {
      // 실패 시 원래 상태로 롤백
      setIsLiked(isLiked);
      setLocalLikes(prev => isLiked ? prev + 1 : prev - 1);
      console.error(err);
    }
  };

  const toggleFollow = () => setIsFollowing(!isFollowing);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      // 서버에 댓글 저장 요청
      const savedComment = await addHistoryCommentApi(post.id, commentText.trim());
      
      // 서버가 리턴해준 진짜 데이터 형식으로 추가
      setComments(prev => [
        { 
          id: savedComment.id, 
          author: savedComment.author, 
          avatar: savedComment.profilePictureUrl || "https://picsum.photos/seed/default/100/100",
          text: savedComment.content, 
          time: "방금 전" 
        },
        ...prev
      ]);
      setCommentText("");
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다.");
      
      setLocalShares(prev => prev + 1); // 💡 3. 클릭 즉시 UI 숫자를 1 올림 (선반영)
      
      // 서버 공유 카운트 증가 API 호출
      await increaseHistoryShareApi(post.id);
      setActiveShareId(null);
    } catch (err) {
      setLocalShares(prev => Math.max(0, prev - 1)); // 실패 시 롤백 안전장치
      console.error("공유 실패:", err);
    }
  };

  // 💡 중요: || 를 ?? 로 변경하여 실제 '0'개 데이터가 온전하게 표시되도록 수정
  // 💡 복잡한 계산식은 싹 지우고, 실시간 변수 인 localLikes만 기준으로 삼습니다!
  const displayLikes = localLikes >= 1000 ? (localLikes / 1000).toFixed(1) + 'k' : localLikes;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full h-full max-w-md bg-secondary flex justify-center sm:rounded-3xl sm:h-[90vh] overflow-hidden border-x sm:border border-border/50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-50 border border-white/10"
          >
            <X size={20} />
          </button>

          {/* 💡 미디어 영역 최적화: VIDEO 타입 방어 및 object-contain 적용으로 이미지 잘림/확대 현상 전면 해결 */}
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
            {post.type === "video" ? (
              <video 
                ref={videoRef}
                src={post.thumbnail} 
                className="w-full h-full object-contain opacity-90" 
                controls={false}
                muted
                loop
                playsInline
                key={post.thumbnail}
              />
            ) : (
              <img 
                src={post.thumbnail} 
                className="w-full h-full object-contain opacity-90" 
                alt="Jam background" 
              />
            )}
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/10 to-transparent pointer-events-none z-[1]" />

          {/* Player Interaction Area */}
          {post.type === "video" && (
            <div 
              className="absolute inset-0 cursor-pointer z-10 flex items-center justify-center"
              onClick={togglePlay}
            >
              {!isPlaying && (
                <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 shadow-2xl transition-transform scale-110">
                  <Play size={40} className="ml-2" fill="currentColor" />
                </div>
              )}
            </div>
          )}

          {/* Right Action Bar */}
          <div className="absolute right-4 bottom-28 flex flex-col items-center gap-7 z-20 pointer-events-auto">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-[3px] border-white overflow-hidden shadow-lg cursor-pointer bg-slate-800">
                <img 
                  src={post.authorAvatar || "https://picsum.photos/seed/default/100/100"} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <AnimatePresence>
                {/* 💡 내 히스토리 글(!isHistory)이 아닐 때만 팔로우 버튼 활성화 */}
                {!isHistory && !isFollowing && (
                  <motion.button 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                    onClick={toggleFollow}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-background cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Plus size={14} className="text-white" />
                  </motion.button>
                )}
                
                {/* 💡 내 히스토리 글(!isHistory)이 아닐 때만 체크 마크 활성화 */}
                {!isHistory && isFollowing && (
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 rounded-full p-0.5 border-2 border-background pointer-events-none"
                  >
                    <Check size={14} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button onClick={toggleLike} className="flex flex-col items-center gap-1.5 group">
              <div className={cn(
                "w-12 h-12 backdrop-blur-md rounded-full flex items-center justify-center transition-all",
                isLiked ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] border-transparent" : "bg-background/20 border border-border group-hover:bg-white/10 text-white"
              )}>
                <Heart size={24} className={cn(isLiked && "fill-white flex", isLiked && "scale-110 transition-transform")} />
              </div>
              <span className="text-white text-xs font-semibold drop-shadow-md">{displayLikes}</span>
            </button>

            <button onClick={() => setActiveCommentId(post.id)} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                <MessageCircle size={24} className="text-white" />
              </div>
              {/* 💡 || 대신 ?? 로 수정 */}
              <span className="text-white text-xs font-semibold drop-shadow-md">{comments.length + (post.commentsCount ?? 0)}</span>
            </button>

            <button onClick={() => setActiveShareId(post.id)} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                <Share2 size={24} className="text-white" />
              </div>
              {/* 💡 4. 기존 {post.sharesCount ?? 0} 대신 실시간 상태 변수로 교체! */}
              <span className="text-white text-xs font-semibold drop-shadow-md">{localShares}</span>
            </button>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-10 left-0 w-3/4 p-5 z-20 pointer-events-none">
            {!isHistory && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary text-[11px] font-bold flex items-center gap-1 bg-background/40 px-2 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  인기 급상승 잼
                </span>
              </div>
            )}
            
            <h2 className="text-white font-black text-xl mb-2 leading-tight drop-shadow-lg">{post.title}</h2>
            
            {!isHistory && (
              <p className="text-slate-300 text-sm mb-4 font-light drop-shadow-md">#{post.inst || '기타'} #{post.style || '추천'}</p>
            )}
            
            {/* Audio Waveform visualization */}
            {post.type === "video" && (
              <div className="w-full h-10 flex items-end gap-1 mb-2 bg-background/20 p-2 rounded-xl backdrop-blur-sm border border-border">
                {[...Array(20)].map((_, i) => (
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
            )}
            <div className="text-xs text-slate-300 font-light line-clamp-3 drop-shadow-md pointer-events-auto select-text">{post.description}</div>
          </div>

          {/* Modals inside Jam */}
          <AnimatePresence>
            {activeCommentId !== null && (
              <motion.div key="jam-modal-comment" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveCommentId(null)}
              >
                <motion.div 
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  onClick={e => e.stopPropagation()} 
                  className="bg-secondary w-full h-[70%] rounded-t-3xl border-t border-border flex flex-col shadow-2xl relative"
                >
                  <div className="flex justify-between items-center p-5 border-b border-border shrink-0">
                    {/* 💡 || 대신 ?? 로 수정 */}
                    <h3 className="text-lg font-black text-white">댓글 <span className="text-primary text-sm ml-1">{comments.length + (post.commentsCount ?? 0)}</span></h3>
                    <button onClick={() => setActiveCommentId(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    {comments.map((c, idx) => (
                      <div key={`comment-${c.id}-${idx}`} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 overflow-hidden">
                          {/* 💡 기존의 picsum 고정 주소를 지우고 c.avatar로 전면 교체! */}
                          <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-300">{c.author}</span>
                            <span className="text-[10px] text-slate-500">{c.time}</span>
                          </div>
                          <p className="text-sm text-white">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-background border-t border-border shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex items-center bg-secondary rounded-full px-4 py-2 border border-border w-full">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="댓글 남기기..." 
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none py-1"
                      />
                      <button type="submit" disabled={!commentText.trim()} className={cn("p-1 transition-colors", commentText.trim() ? "text-primary" : "text-slate-500")} ><Send size={18} /></button>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeShareId !== null && (
              <motion.div key="jam-modal-share" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
                onClick={() => setActiveShareId(null)}
              >
                <motion.div 
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  onClick={e => e.stopPropagation()} 
                  className="bg-secondary w-full rounded-t-3xl border-t border-border p-6 shadow-2xl relative"
                >
                  <h3 className="text-lg font-black text-white mb-6 text-center">공유하기</h3>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {['카카오톡', '인스타그램', '트위터', '링크 복사'].map((txt, i) => (
                      <button key={i} onClick={i === 3 ? handleCopyLink : undefined} className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border border-border group-hover:bg-primary group-hover:border-primary transition-colors">
                          {i === 3 ? <Share2 size={20} className="text-white" /> : <div className="text-white font-black text-lg">{txt[0]}</div>}
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">{txt}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setActiveShareId(null)} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors border border-border">닫기</button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}