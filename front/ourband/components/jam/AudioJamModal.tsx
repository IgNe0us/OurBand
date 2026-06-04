"use client";
// @ts-nocheck
import { Play, Heart, MessageCircle, Share2, Plus, X, Send, Check, User, Volume2, VolumeX, Reply, Edit3, Trash2, Flag } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { VideoPost } from "../band/VideoPostModal";
import { addHistoryCommentApi, updateHistoryCommentApi, deleteHistoryCommentApi, increaseHistoryShareApi, toggleHistoryLikeApi, getUserInfoApi } from "@/api/account/userService";
import { apiClient } from "@/api/baseApi";
import { useUserProfile } from "@/store/userProfileContext";
import { toggleJamLikeApi, getJamCommentsApi, createJamCommentApi, updateJamCommentApi, deleteJamCommentApi, incrementJamShareApi } from "@/api/jam/jamService";
import { ReportModal } from "@/components/common/ReportModal";

export type PopularJamVideo = VideoPost & { 
  likes?: number; 
  likedByMe?: boolean;
  author?: string; 
  authorId?: number | string;
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
  isJam?: boolean;
  onUpdatePost?: (updatedPost: Partial<PopularJamVideo>) => void;
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

export function AudioJamModal({ isOpen, onClose, post, isHistory = false, isJam = false, onUpdatePost }: AudioJamModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [localShares, setLocalShares] = useState(0);
  const [localCommentCount, setLocalCommentCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const { openUserProfile } = useUserProfile();
  
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number, author: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: number, text: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: string, id: string | number, name: string } | null>(null);

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
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("timeupdate", updateProgress);
    return () => video.removeEventListener("timeupdate", updateProgress);
  }, [isPlaying]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    video.currentTime = percentage * video.duration;
    setProgress(percentage * 100);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (volume > 0) {
      setVolume(0);
      setIsMuted(true);
      if (videoRef.current) {
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
      }
    } else {
      setVolume(1);
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.volume = 1;
        videoRef.current.muted = false;
      }
    }
  };

  useEffect(() => {
    if (isOpen && post) {
      getUserInfoApi().then(res => { if(res?.userId) setCurrentUserId(res.userId); }).catch(console.error);
      setIsPlaying(false);
      setIsFollowing(false);

      setIsLiked(post.likedByMe ?? false);
      setLocalLikes(post.likes ?? 0);
      setLocalShares(post.sharesCount ?? 0);
      setLocalCommentCount(post.commentsCount ?? 0);
      if (isHistory || isJam) {
        if (isJam) {
          getJamCommentsApi(Number(post.id))
            .then(res => {
              const mapComment = (c: any): any => ({
                id: c.id,
                author: c.authorName || c.author,
                authorId: c.authorId || c.userId,
                avatar: c.authorProfileImageUrl || c.profilePictureUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt),
                isEdited: c.updatedAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 1000,
                replies: c.replies ? c.replies.map(mapComment) : []
              });
              setComments(res.map(mapComment));
            })
            .catch(err => {
              console.error("실제 댓글 목록 로드 실패:", err);
              setComments([]);
            });
        } else {
          apiClient.get(`/users/history/${post.id}/comments`)
            .then(res => {
              const mapComment = (c: any): any => ({
                id: c.id,
                author: c.authorName || c.author,
                authorId: c.authorId || c.userId,
                avatar: c.authorProfileImageUrl || c.profilePictureUrl || "",
                text: c.content,
                time: formatRelativeTime(c.createdAt),
                isEdited: c.updatedAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 1000,
                replies: c.replies ? c.replies.map(mapComment) : []
              });
              setComments(res.data.map(mapComment));
            })
            .catch(err => {
              console.error("실제 댓글 목록 로드 실패:", err);
              setComments([]);
            });
        }
      }

    }
  }, [isOpen, post, isHistory]);

  if (!isOpen || !post) return null;

  const togglePlay = () => setIsPlaying(!isPlaying);
  // 💡 좋아요 토글 로직 최적화
  const toggleLike = async () => {
    const nextLikeState = !isLiked;
    const nextLikes = nextLikeState ? localLikes + 1 : localLikes - 1;
    
    setIsLiked(nextLikeState);
    setLocalLikes(nextLikes);
    if (post) {
      post.likedByMe = nextLikeState;
      post.likes = nextLikes;
      onUpdatePost?.({ likedByMe: nextLikeState, likes: nextLikes });
    }
    
    try {
      if (isJam) {
        await toggleJamLikeApi(Number(post.id));
      } else {
        await toggleHistoryLikeApi(post.id, nextLikeState);
      }
    } catch (err) {
      // 실패 시 원래 상태로 롤백
      setIsLiked(isLiked);
      setLocalLikes(localLikes);
      if (post) {
        post.likedByMe = isLiked;
        post.likes = localLikes;
        onUpdatePost?.({ likedByMe: isLiked, likes: localLikes });
      }
      console.error(err);
    }
  };

  const toggleFollow = () => setIsFollowing(!isFollowing);

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      if (isJam) await deleteJamCommentApi(Number(post.id), commentId);
      else await deleteHistoryCommentApi(Number(post.id), commentId);
      
      const removeComment = (list: any[]): any[] => {
        return list.filter(c => c.id !== commentId).map(c => ({...c, replies: c.replies ? removeComment(c.replies) : []}));
      };
      setComments(prev => removeComment(prev));
      
      const newCount = Math.max(0, localCommentCount - 1);
      setLocalCommentCount(newCount);
      if (post) {
        post.commentsCount = newCount;
        onUpdatePost?.({ commentsCount: newCount });
      }
    } catch (e) { alert("삭제 실패"); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      if (editingComment) {
        let savedComment;
        if (isJam) savedComment = await updateJamCommentApi(Number(post.id), editingComment.id, { content: commentText.trim() });
        else savedComment = await updateHistoryCommentApi(Number(post.id), editingComment.id, commentText.trim());
        
        const updateList = (list: any[]): any[] => list.map(c => c.id === editingComment.id ? { ...c, text: commentText.trim() } : { ...c, replies: c.replies ? updateList(c.replies) : [] });
        setComments(prev => updateList(prev));
        setEditingComment(null);
      } else {
        let savedComment;
        if (isJam) savedComment = await createJamCommentApi(Number(post.id), { content: commentText.trim(), parentId: replyingTo?.id });
        else savedComment = await addHistoryCommentApi(Number(post.id), commentText.trim(), replyingTo?.id);
        
        const newC = { 
          id: savedComment.id, 
          author: savedComment.authorName || savedComment.author, 
          authorId: savedComment.authorId || savedComment.userId,
          avatar: savedComment.authorProfileImageUrl || savedComment.profilePictureUrl || "",
          text: savedComment.content, 
          time: "방금 전",
          replies: []
        };
        
        if (replyingTo) {
          const addReply = (list: any[]): any[] => list.map(c => c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), newC] } : { ...c, replies: c.replies ? addReply(c.replies) : [] });
          setComments(prev => addReply(prev));
        } else {
          setComments(prev => [...prev, newC]);
        }
        
        const newCount = localCommentCount + 1;
        setLocalCommentCount(newCount);
        if (post) {
          post.commentsCount = newCount;
          onUpdatePost?.({ commentsCount: newCount });
        }
        
        setReplyingTo(null);
      }
      setCommentText("");
    } catch (err) {
      alert("댓글 등록에 실패했습니다.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다.");
      
      const nextShares = localShares + 1;
      setLocalShares(nextShares);
      if (post) {
        post.sharesCount = nextShares;
        onUpdatePost?.({ sharesCount: nextShares });
      } // 💡 3. 클릭 즉시 UI 숫자를 1 올림 (선반영)
      
      // 서버 공유 카운트 증가 API 호출
      if (isJam) {
        await incrementJamShareApi(Number(post.id));
      } else {
        await increaseHistoryShareApi(post.id);
      }
      setActiveShareId(null);
    } catch (err) {
      setLocalShares(localShares);
      if (post) {
        post.sharesCount = localShares;
        onUpdatePost?.({ sharesCount: localShares });
      } // 실패 시 롤백 안전장치
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
          {/* Top Right Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            {post.type === "video" && (
              <div className="relative group flex items-center">
                <div className="absolute right-12 w-24 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center px-3 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <input 
                    type="range" 
                    min="0" max="1" step="0.05" 
                    value={volume}
                    onChange={(e) => {
                       const v = parseFloat(e.target.value);
                       setVolume(v);
                       if (videoRef.current) videoRef.current.volume = v;
                       if (v === 0) setIsMuted(true);
                       else setIsMuted(false);
                    }}
                    className="w-full h-1 bg-white/30 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                </div>
                <button 
                  onClick={toggleMute}
                  className="w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/10 relative z-10"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* 💡 미디어 영역 최적화: VIDEO 타입 방어 및 object-contain 적용으로 이미지 잘림/확대 현상 전면 해결 */}
          <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
            {post.type === "video" ? (
              <video 
                ref={videoRef}
                src={post.thumbnail} 
                className="w-full h-full object-contain opacity-90" 
                controls={false}
                muted={isMuted}
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
              <div 
                className="w-10 h-10 rounded-full border-2 border-background overflow-hidden bg-slate-800 shrink-0 cursor-pointer flex items-center justify-center"
                onClick={() => post.authorId && openUserProfile(Number(post.authorId), post.author, post.authorAvatar)}
              >
                {post.authorAvatar ? (
                  <img 
                    src={post.authorAvatar} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-slate-500" />
                )}
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

            <button onClick={() => setActiveCommentId(String(post.id))} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                <MessageCircle size={24} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold drop-shadow-md">{localCommentCount}</span>
            </button>

            <button onClick={() => setActiveShareId(String(post.id))} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-white/10 transition-colors">
                <Share2 size={24} className="text-white" />
              </div>
              {/* 💡 4. 기존 {post.sharesCount ?? 0} 대신 실시간 상태 변수로 교체! */}
              <span className="text-white text-xs font-semibold drop-shadow-md">{localShares}</span>
            </button>

            {post.authorId !== currentUserId && (
              <button 
                onClick={(e) => { e.stopPropagation(); setReportTarget({ type: isJam ? 'JAM_POST' : 'HISTORY_POST', id: post.id!, name: '게시물' }); }} 
                className="flex flex-col items-center gap-1.5 group mt-4"
              >
                <div className="w-10 h-10 bg-background/20 backdrop-blur-md rounded-full flex items-center justify-center border border-border group-hover:bg-rose-500/20 transition-colors">
                  <Flag size={18} className="text-white/80 group-hover:text-rose-500" />
                </div>
              </button>
            )}
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

          {/* Progress Bar */}
          {post.type === "video" && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer z-[60] hover:h-2.5 transition-all"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

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
                    <h3 className="text-lg font-black text-white">댓글 <span className="text-primary text-sm ml-1">{localCommentCount}</span></h3>
                    <button onClick={() => { setActiveCommentId(null); setReplyingTo(null); setEditingComment(null); setCommentText(''); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 pb-8 hide-scrollbar">
                    {(() => {
                      const flattenComments = (commentsList: any[], depth = 0): any[] => {
                        return commentsList.reduce((acc, c) => {
                          acc.push({ ...c, depth });
                          if (c.replies && c.replies.length > 0) {
                            acc.push(...flattenComments(c.replies, depth + 1));
                          }
                          return acc;
                        }, []);
                      };

                      const renderComment = (c: any) => {
                        const effectiveDepth = c.depth === 0 ? 0 : ((c.depth - 1) % 4) + 1;
                        const isRoot = c.depth === 0;
                        const isReply = effectiveDepth > 0;
                        
                        return (
                          <div 
                            key={`comment-${c.id}`} 
                            style={{ marginLeft: isReply ? `${effectiveDepth * 2.5}rem` : '0' }}
                            className={cn("flex gap-3 group relative", isRoot ? "mt-5" : "mt-3", isReply ? "before:absolute before:-left-5 before:top-4 before:w-4 before:h-px before:bg-border before:content-['']" : "")}
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-border flex items-center justify-center overflow-hidden">
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="text-slate-500" />
                              )}
                            </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-300">{c.author}</span>
                                <span className="text-[10px] text-slate-500">{c.time} {c.isEdited && "(수정 됨)"}</span>
                              </div>
                              <div className="group-hover:opacity-100 transition-opacity flex gap-2">
                                  <button onClick={() => {setReplyingTo({ id: c.id, author: c.author }); setEditingComment(null); setCommentText('');}} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="답글">
                                    <Reply size={13} />
                                  </button>
                                {c.authorId === currentUserId && (
                                  <>
                                    <button onClick={() => {setEditingComment({ id: c.id, text: c.text }); setCommentText(c.text); setReplyingTo(null);}} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="수정">
                                      <Edit3 size={13} />
                                    </button>
                                    {(!c.replies || c.replies.length === 0) && (
                                      <button onClick={() => handleDeleteComment(c.id)} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="삭제">
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </>
                                )}
                                {c.authorId !== currentUserId && (
                                  <button onClick={() => setReportTarget({ type: isJam ? 'JAM_COMMENT' : 'HISTORY_COMMENT', id: c.id, name: '댓글' })} className="text-slate-500 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-white/5" title="신고">
                                    <Flag size={13} />
                                  </button>
                                )}
                                
                              </div>
                            </div>
                            <p className="text-sm text-white break-all">{c.text}</p>
                            
                            {/* 대댓글 렌더링 부분은 평탄화 처리로 삭제됨 */}
                          </div>
                        </div>
                        );
                      };
                      return flattenComments(comments).map(c => renderComment(c));
                    })()}
                  </div>
                  <div className="p-4 bg-background border-t border-border shrink-0">
                    {(replyingTo || editingComment) && (
                      <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs text-primary">
                          {replyingTo ? `@${replyingTo.author}님에게 답글 남기는 중` : `댓글 수정 중`}
                        </span>
                        <button onClick={() => { setReplyingTo(null); setEditingComment(null); setCommentText(''); }} className="text-xs text-slate-400 hover:text-white">취소</button>
                      </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex items-center bg-secondary rounded-full px-4 py-2 border border-border w-full">
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={replyingTo ? "답글 남기기..." : "댓글 남기기..."} 
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

          {/* Report Modal */}
          {reportTarget && (
            <ReportModal 
              isOpen={true} 
              onClose={() => setReportTarget(null)} 
              targetName={reportTarget.name}
              targetType={reportTarget.type}
              targetId={reportTarget.id}
            />
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}